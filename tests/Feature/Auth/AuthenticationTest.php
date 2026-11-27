<?php

namespace Tests\Feature\Auth;

use App\Models\PengaturanSekolah;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_screen_can_be_rendered(): void
    {
        $response = $this->get('/login');

        $response->assertStatus(200);
    }

    public function test_static_school_logo_is_used_as_the_favicon_when_a_legacy_logo_exists(): void
    {
        PengaturanSekolah::query()->findOrFail(1)->update([
            'logo_path' => 'identitas-sekolah/logo.png',
        ]);

        $this->get('/login')
            ->assertOk()
            ->assertSee(
                'rel="icon" type="image/png" href="'.asset('logo.png').'?v=2"',
                false,
            );
    }

    public function test_static_school_logo_is_used_as_the_favicon_when_no_legacy_logo_exists(): void
    {
        PengaturanSekolah::query()->findOrFail(1)->update([
            'logo_path' => null,
        ]);

        $this->get('/login')
            ->assertOk()
            ->assertSee(
                'rel="icon" type="image/png" href="'.asset('logo.png').'?v=2"',
                false,
            );
    }

    public function test_users_can_authenticate_using_the_login_screen(): void
    {
        $user = User::factory()->create([
            'nik' => '0012345678901234',
        ]);

        $response = $this->post('/login', [
            'email' => $user->nik,
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('siswa.dashboard', absolute: false));
    }

    public function test_users_can_still_authenticate_with_email(): void
    {
        $user = User::factory()->create();

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertAuthenticatedAs($user);
    }

    public function test_teacher_can_authenticate_with_generated_username_and_must_change_password(): void
    {
        $user = User::factory()->create([
            'role' => 'guru',
            'username' => 'dewi.puspita',
            'email' => null,
            'password' => 'password',
            'must_change_password' => true,
        ]);

        $response = $this->post('/login', [
            'email' => 'dewi.puspita',
            'password' => 'password',
        ]);

        $this->assertAuthenticatedAs($user);
        $response->assertRedirect(route('profile.edit', absolute: false));
    }

    public function test_login_rejects_a_non_string_identifier(): void
    {
        $this->post('/login', [
            'email' => ['not-an-identifier'],
            'password' => 'password',
        ])->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    public function test_login_rejects_a_username_with_spaces(): void
    {
        $this->post('/login', [
            'email' => 'dewi puspita',
            'password' => 'password',
        ])->assertSessionHasErrors([
            'email' => 'Masukkan nama pengguna, email yang valid, atau NIK yang terdiri dari 16 digit.',
        ]);

        $this->assertGuest();
    }

    public function test_users_can_not_authenticate_with_invalid_password(): void
    {
        $user = User::factory()->create();

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
    }

    public function test_users_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/logout');

        $this->assertGuest();
        $response->assertRedirect('/');
    }
}
