<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\PendaftaranSpmb;
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
                ->withErrors(['google' => 'Login Google belum dikonfigurasi oleh administrator.']);
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
            report($e);

            return to_route('login')
                ->withErrors(['google' => 'Login Google gagal diproses. Silakan coba lagi atau hubungi administrator.']);
        }

        $email = Str::lower(trim((string) $googleUser->getEmail()));
        $googleId = (string) $googleUser->getId();

        if (($email !== '' && ! filter_var($email, FILTER_VALIDATE_EMAIL)) || $googleId === '') {
            return to_route('login')
                ->withErrors(['google' => 'Akun Google tidak memberikan identitas yang valid.']);
        }

        if ($email !== '' && ! (bool) ($googleUser->user['verified_email'] ?? false)) {
            return to_route('login')
                ->withErrors(['google' => 'Gunakan akun Google dengan alamat email terverifikasi.']);
        }

        $userByGoogleId = User::query()->where('google_id', $googleId)->first();
        $userByEmail = $email !== '' ? User::query()->where('email', $email)->first() : null;

        if (
            $userByGoogleId
            && $userByEmail
            && $userByGoogleId->getKey() !== $userByEmail->getKey()
        ) {
            return to_route('login')
                ->withErrors(['google' => 'Akun Google ini sudah terhubung ke akun lain.']);
        }

        $isNewCandidate = ! $userByGoogleId && ! $userByEmail;

        if ($isNewCandidate) {
            $name = trim((string) $googleUser->getName())
                ?: ($email !== '' ? Str::before($email, '@') : 'Calon Siswa');

            $user = DB::transaction(function () use ($email, $googleId, $googleUser, $name): User {
                $user = User::create([
                    'name' => $name,
                    'email' => $email !== '' ? $email : null,
                    'password' => bcrypt(Str::random(32)),
                    'role' => 'siswa',
                    'google_id' => $googleId,
                    'avatar' => $googleUser->getAvatar(),
                ]);

                if ($email !== '') {
                    $user->forceFill(['email_verified_at' => now()])->save();
                }

                $user->siswa()->create([
                    'nisn' => null,
                    'nama_lengkap' => $name,
                    'status_siswa' => 'calon_spmb',
                ]);

                $user->pendaftaranSpmbs()->create([
                    'no_pendaftaran' => PendaftaranSpmb::generateNoPendaftaran(),
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
                'email_verified_at' => $user->email_verified_at ?? ($email !== '' ? now() : null),
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
