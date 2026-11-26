<?php

namespace Tests\Feature\Auth;

use App\Models\Siswa;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered(): void
    {
        $response = $this->get('/register');

        $response->assertStatus(200);
    }

    public function test_new_users_can_register(): void
    {
        $response = $this->post('/register', [
            'name' => 'Test User',
            'nik' => '0012345678901234',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('siswa.spmb.index', absolute: false));

        $user = User::query()->where('email', 'test@example.com')->firstOrFail();
        $siswa = Siswa::query()->where('user_id', $user->id)->firstOrFail();

        $this->assertSame('siswa', $user->role);
        $this->assertSame('0012345678901234', $user->nik);
        $this->assertArrayNotHasKey('nik', $user->toArray());
        $this->assertSame('calon_spmb', $siswa->status_siswa);
        $this->assertSame('Test User', $siswa->nama_lengkap);
        $this->assertNull($siswa->nisn);
        $this->assertArrayNotHasKey('nik', $siswa->getAttributes());
        $this->assertModelExists($siswa);

        $this->get(route('siswa.spmb.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Siswa/Spmb/Index')
                ->where('siswa.nama_lengkap', 'Test User')
                ->where('pendaftaran', null));
    }

    public function test_new_users_can_register_without_an_email_address(): void
    {
        $response = $this->post('/register', [
            'name' => 'Calon Tanpa Email',
            'nik' => '0001234567890123',
            'email' => '',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertRedirect(route('siswa.spmb.index', absolute: false));
        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', [
            'nik' => '0001234567890123',
            'email' => null,
        ]);
    }

    public function test_registration_rejects_a_nik_that_is_not_sixteen_digits(): void
    {
        $this->post('/register', [
            'name' => 'Calon Invalid',
            'nik' => '123456789012345',
            'email' => '',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertSessionHasErrors('nik');
    }

    public function test_registration_rejects_a_sixteen_character_nik_with_non_digits(): void
    {
        $this->post('/register', [
            'name' => 'Calon Invalid',
            'nik' => '001234567890ABCD',
            'email' => '',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertSessionHasErrors('nik');
    }

    public function test_registration_rejects_a_nik_already_used_by_another_account(): void
    {
        User::factory()->create(['nik' => '0012345678901234']);

        $this->post('/register', [
            'name' => 'Calon Duplikat',
            'nik' => '0012345678901234',
            'email' => '',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertSessionHasErrors('nik');
    }
}
