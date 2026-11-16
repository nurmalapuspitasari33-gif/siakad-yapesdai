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
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('siswa.spmb.index', absolute: false));

        $user = User::query()->where('email', 'test@example.com')->firstOrFail();
        $siswa = Siswa::query()->where('user_id', $user->id)->firstOrFail();

        $this->assertSame('siswa', $user->role);
        $this->assertSame('calon_spmb', $siswa->status_siswa);
        $this->assertSame('Test User', $siswa->nama_lengkap);
        $this->assertNull($siswa->nisn);
        $this->assertModelExists($siswa);

        $this->get(route('siswa.spmb.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Siswa/Spmb/Index')
                ->where('siswa.nama_lengkap', 'Test User')
                ->where('pendaftaran', null));
    }
}
