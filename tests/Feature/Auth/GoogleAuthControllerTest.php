<?php

namespace Tests\Feature\Auth;

use App\Models\Guru;
use App\Models\Siswa;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Laravel\Socialite\Socialite as GoogleSocialite;
use Laravel\Socialite\Two\User as GoogleUser;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class GoogleAuthControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_google_redirect_starts_oauth_flow(): void
    {
        config([
            'services.google.client_id' => 'google-client-id',
            'services.google.client_secret' => 'google-client-secret',
            'services.google.redirect' => 'http://localhost/auth/google/callback',
        ]);

        $response = $this->get(route('google.redirect'));

        $response->assertRedirect();
        $this->assertStringContainsString(
            'prompt=select_account',
            (string) $response->headers->get('Location'),
        );
    }

    public function test_google_redirect_reports_missing_oauth_configuration(): void
    {
        config([
            'services.google.client_id' => null,
            'services.google.client_secret' => null,
            'services.google.redirect' => null,
        ]);

        $this->get(route('google.redirect'))
            ->assertRedirect(route('login'))
            ->assertSessionHasErrors([
                'email' => 'Login Google belum dikonfigurasi oleh administrator.',
            ]);
    }

    public function test_unregistered_google_email_creates_a_spmb_candidate(): void
    {
        $this->fakeGoogleProfile('calon@example.com', 'google-candidate-1');

        $response = $this->get(route('google.callback'));

        $response->assertRedirect(route('siswa.spmb.index'));
        $this->assertAuthenticated();

        $user = User::query()->where('email', 'calon@example.com')->firstOrFail();
        $siswa = $user->siswa()->firstOrFail();
        $pendaftaran = $user->pendaftaranSpmbs()->firstOrFail();

        $this->assertSame('siswa', $user->role);
        $this->assertSame('google-candidate-1', $user->google_id);
        $this->assertSame('https://example.test/avatar.png', $user->avatar);
        $this->assertNotNull($user->email_verified_at);
        $this->assertSame('calon_spmb', $siswa->status_siswa);
        $this->assertSame('Calon Google', $siswa->nama_lengkap);
        $this->assertNull($siswa->nisn);
        $this->assertSame('', $pendaftaran->asal_sekolah);
        $this->assertSame('pending', $pendaftaran->status_seleksi);
        $this->assertStringStartsWith('SPMB-', $pendaftaran->no_pendaftaran);
        $this->assertModelExists($siswa);
        $this->assertModelExists($pendaftaran);

        $this->get(route('siswa.spmb.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Siswa/Spmb/Index')
                ->where('siswa.nama_lengkap', 'Calon Google')
                ->where('pendaftaran.asal_sekolah', ''));
    }

    /**
     * @return array<string, array{string, string}>
     */
    public static function existingAccountRoles(): array
    {
        return [
            'admin' => ['admin', 'admin.dashboard'],
            'guru' => ['guru', 'guru.dashboard'],
            'active student' => ['siswa', 'siswa.dashboard'],
        ];
    }

    #[DataProvider('existingAccountRoles')]
    public function test_existing_verified_google_email_signs_in_to_its_role_dashboard(
        string $role,
        string $dashboardRoute,
    ): void {
        $email = "{$role}@example.com";
        $user = User::factory()->create([
            'email' => $email,
            'role' => $role,
        ]);

        if ($role === 'guru') {
            Guru::create([
                'user_id' => $user->id,
                'nip' => 'GOOGLE-GURU-001',
                'nama_lengkap' => 'Guru Google',
                'is_wali_kelas' => true,
            ]);
        }

        if ($role === 'siswa') {
            Siswa::create([
                'user_id' => $user->id,
                'nisn' => '0000000099',
                'nama_lengkap' => 'Siswa Google',
                'status_siswa' => 'aktif',
            ]);
        }

        $this->fakeGoogleProfile($email, "google-{$role}");

        $this->get(route('google.callback'))
            ->assertRedirect(route($dashboardRoute));

        $this->assertAuthenticatedAs($user);
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'google_id' => "google-{$role}",
            'avatar' => 'https://example.test/avatar.png',
        ]);
        $this->assertDatabaseCount('pendaftaran_spmbs', 0);
    }

    public function test_unverified_google_email_is_rejected_without_creating_accounts(): void
    {
        $this->fakeGoogleProfile('unverified@example.com', 'google-unverified-1', false);

        $this->get(route('google.callback'))
            ->assertRedirect(route('login'))
            ->assertSessionHasErrors([
                'email' => 'Gunakan akun Google dengan alamat email terverifikasi.',
            ]);

        $this->assertGuest();
        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('siswas', 0);
        $this->assertDatabaseCount('pendaftaran_spmbs', 0);
    }

    public function test_google_identity_linked_to_another_email_cannot_be_reassigned(): void
    {
        $linkedUser = User::factory()->create([
            'email' => 'linked@example.com',
            'google_id' => 'google-existing-1',
        ]);
        User::factory()->create(['email' => 'different@example.com']);
        $this->fakeGoogleProfile('different@example.com', 'google-existing-1');

        $this->get(route('google.callback'))
            ->assertRedirect(route('login'))
            ->assertSessionHasErrors([
                'email' => 'Akun Google ini sudah terhubung ke akun lain.',
            ]);

        $this->assertGuest();
        $this->assertDatabaseHas('users', [
            'id' => $linkedUser->id,
            'email' => 'linked@example.com',
            'google_id' => 'google-existing-1',
        ]);
        $this->assertDatabaseCount('siswas', 0);
        $this->assertDatabaseCount('pendaftaran_spmbs', 0);
    }

    private function fakeGoogleProfile(
        string $email,
        string $googleId,
        bool $verifiedEmail = true,
    ): void {
        GoogleSocialite::fake('google', GoogleUser::fake([
            'id' => $googleId,
            'name' => 'Calon Google',
            'email' => $email,
            'avatar' => 'https://example.test/avatar.png',
            'verified_email' => $verifiedEmail,
        ]));
    }
}
