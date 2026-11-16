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

    public function test_school_logo_is_used_as_the_favicon_when_available(): void
    {
        PengaturanSekolah::query()->findOrFail(1)->update([
            'logo_path' => 'identitas-sekolah/logo.png',
        ]);

        $this->get('/login')
            ->assertOk()
            ->assertSee(
                'rel="icon" href="'.asset('storage/identitas-sekolah/logo.png').'"',
                false,
            );
    }

    public function test_default_favicon_is_used_when_school_logo_is_missing(): void
    {
        PengaturanSekolah::query()->findOrFail(1)->update([
            'logo_path' => null,
        ]);

        $this->get('/login')
            ->assertOk()
            ->assertSee(
                'rel="icon" href="'.asset('favicon.ico').'"',
                false,
            );
    }

    public function test_users_can_authenticate_using_the_login_screen(): void
    {
        $user = User::factory()->create();

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('siswa.dashboard', absolute: false));
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
