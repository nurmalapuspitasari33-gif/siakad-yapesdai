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
            || ! config('services.google.redirect')
        ) {
            return to_route('login')
                ->withErrors(['email' => 'Login Google belum dikonfigurasi oleh administrator.']);
        }

        return Socialite::driver('google')->stateless()->redirect();
    }

    public function callback(Request $request): RedirectResponse
    {
        $googleUser = Socialite::driver('google')->stateless()->user();
        $email = Str::lower(trim((string) $googleUser->getEmail()));
        $googleId = (string) $googleUser->getId();
        $emailIsVerified = filter_var(
            $googleUser->user['verified_email'] ?? false,
            FILTER_VALIDATE_BOOLEAN,
        );

        if (
            ! filter_var($email, FILTER_VALIDATE_EMAIL)
            || $googleId === ''
            || ! $emailIsVerified
        ) {
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
                    'password' => Str::random(64),
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

        Auth::login($user);
        $request->session()->regenerate();

        if ($isNewCandidate) {
            return to_route('siswa.spmb.index');
        }

        return to_route(match ($user->role) {
            'admin' => 'admin.dashboard',
            'guru' => 'guru.dashboard',
            'siswa' => 'siswa.dashboard',
        });
    }
}
