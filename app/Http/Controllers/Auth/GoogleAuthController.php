<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Socialite\Socialite;
use Symfony\Component\HttpFoundation\RedirectResponse as SymfonyRedirectResponse;

class GoogleAuthController extends Controller
{
    public function redirect(): SymfonyRedirectResponse
    {
        if (
            ! config('services.google.client_id')
            || ! config('services.google.client_secret')
        ) {
            return to_route('login')
                ->withErrors(['email' => 'Login Google belum dikonfigurasi oleh administrator.']);
        }

        $redirectUrl = config('services.google.redirect') ?: url('/auth/google/callback');

        return Socialite::driver('google')
            ->redirectUrl($redirectUrl)
            ->with(['prompt' => 'select_account'])
            ->stateless()
            ->redirect();
    }

    public function callback(Request $request): RedirectResponse
    {
        try {
            $redirectUrl = config('services.google.redirect') ?: url('/auth/google/callback');

            $googleUser = Socialite::driver('google')
                ->redirectUrl($redirectUrl)
                ->stateless()
                ->user();
        } catch (\Throwable $e) {
            return to_route('login')
                ->withErrors(['email' => 'Gagal memverifikasi akun Google: '.$e->getMessage()]);
        }

        $email = Str::lower(trim((string) $googleUser->getEmail()));
        $googleId = (string) $googleUser->getId();

        if (! filter_var($email, FILTER_VALIDATE_EMAIL) || $googleId === '') {
            return to_route('login')
                ->withErrors(['email' => 'Gunakan akun Google dengan alamat email yang valid.']);
        }

        if (! (bool) ($googleUser->user['verified_email'] ?? false)) {
            return to_route('login')
                ->withErrors(['email' => 'Gunakan akun Google dengan alamat email terverifikasi.']);
        }

        $userByGoogleId = User::query()->where('google_id', $googleId)->first();
        $userByEmail = User::query()->where('email', $email)->first();

        if (
            $userByGoogleId
            && $userByEmail
            && $userByGoogleId->getKey() !== $userByEmail->getKey()
        ) {
            return to_route('login')
                ->withErrors(['email' => 'Akun Google ini sudah terhubung ke akun lain.']);
        }

        $isNewCandidate = ! $userByGoogleId && ! $userByEmail;

        if ($isNewCandidate) {
            $name = trim((string) $googleUser->getName()) ?: Str::before($email, '@');

            $user = DB::transaction(function () use ($email, $googleId, $googleUser, $name): User {
                $user = User::create([
                    'name' => $name,
                    'email' => $email,
                    'password' => bcrypt(Str::random(32)),
                    'role' => 'siswa',
                    'google_id' => $googleId,
                    'avatar' => $googleUser->getAvatar(),
                ]);
                $user->forceFill(['email_verified_at' => now()])->save();

                $user->siswa()->create([
                    'nisn' => null,
                    'nama_lengkap' => $name,
                    'status_siswa' => 'calon_spmb',
                ]);

                $user->pendaftaranSpmbs()->create([
                    'no_pendaftaran' => 'SPMB-'.now()->format('Y').'-'.Str::upper((string) Str::uuid()),
                    'asal_sekolah' => '',
                    'status_seleksi' => 'pending',
                ]);

                return $user;
            });
        } else {
            $user = $userByGoogleId ?? $userByEmail;
            $user->forceFill([
                'google_id' => $googleId,
                'avatar' => $googleUser->getAvatar(),
                'email_verified_at' => $user->email_verified_at ?? now(),
            ])->save();
        }

        Auth::login($user, true);

        if ($isNewCandidate) {
            return redirect()->route('siswa.spmb.index');
        }

        return redirect()->route(match ($user->role) {
            'admin' => 'admin.dashboard',
            'guru', 'wali_kelas' => 'guru.dashboard',
            default => 'siswa.dashboard',
        });
    }
}
