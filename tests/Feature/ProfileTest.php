<?php

namespace Tests\Feature;

use App\Models\Guru;
use App\Models\Siswa;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_page_is_displayed(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->get('/profile');

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Profile/Edit')
                ->where('isWaliKelas', false)
                ->where('isCandidate', false));
    }

    public function test_profile_page_receives_wali_kelas_navigation_state(): void
    {
        $user = User::factory()->create(['role' => 'guru']);
        Guru::create([
            'user_id' => $user->id,
            'nip' => '19870010',
            'nama_lengkap' => 'Guru Wali',
            'is_wali_kelas' => true,
        ]);

        $this->actingAs($user)
            ->get('/profile')
            ->assertInertia(fn (Assert $page) => $page
                ->where('isWaliKelas', true)
                ->where('isCandidate', false));
    }

    public function test_profile_page_receives_spmb_candidate_navigation_state(): void
    {
        $user = User::factory()->create(['role' => 'siswa']);
        Siswa::create([
            'user_id' => $user->id,
            'nisn' => '1000000010',
            'nama_lengkap' => 'Calon Siswa',
            'status_siswa' => 'calon_spmb',
        ]);

        $this->actingAs($user)
            ->get('/profile')
            ->assertInertia(fn (Assert $page) => $page
                ->where('isWaliKelas', false)
                ->where('isCandidate', true));
    }

    public function test_profile_information_can_be_updated(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch('/profile', [
                'name' => 'Test User',
                'email' => 'test@example.com',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile');

        $user->refresh();

        $this->assertSame('Test User', $user->name);
        $this->assertSame('test@example.com', $user->email);
        $this->assertNull($user->email_verified_at);
    }

    public function test_profile_validation_errors_are_indonesian(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->from('/profile')
            ->patch('/profile', [
                'name' => '',
                'email' => 'alamat-tidak-valid',
            ])
            ->assertSessionHasErrors([
                'name' => 'Nama wajib diisi.',
                'email' => 'Format alamat email tidak valid.',
            ]);
    }

    public function test_email_verification_status_is_unchanged_when_the_email_address_is_unchanged(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch('/profile', [
                'name' => 'Test User',
                'email' => $user->email,
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile');

        $this->assertNotNull($user->refresh()->email_verified_at);
    }

    public function test_user_can_delete_their_account(): void
    {
        $user = User::factory()->create(['role' => 'admin']);

        $response = $this
            ->actingAs($user)
            ->delete('/profile', [
                'password' => 'password',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/');

        $this->assertGuest();
        $this->assertNull($user->fresh());
    }

    #[DataProvider('nonAdminRoles')]
    public function test_non_admin_users_cannot_delete_their_account(string $role): void
    {
        $user = User::factory()->create(['role' => $role]);

        $this->actingAs($user)
            ->delete('/profile', ['password' => 'password'])
            ->assertForbidden();

        $this->assertModelExists($user);
    }

    public static function nonAdminRoles(): array
    {
        return [
            'guru' => ['guru'],
            'siswa' => ['siswa'],
        ];
    }

    public function test_correct_password_must_be_provided_to_delete_account(): void
    {
        $user = User::factory()->create(['role' => 'admin']);

        $response = $this
            ->actingAs($user)
            ->from('/profile')
            ->delete('/profile', [
                'password' => 'wrong-password',
            ]);

        $response
            ->assertSessionHasErrors([
                'password' => 'Kata sandi yang dimasukkan tidak sesuai.',
            ])
            ->assertRedirect('/profile');

        $this->assertNotNull($user->fresh());
    }
}
