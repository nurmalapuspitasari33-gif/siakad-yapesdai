<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\StudentIdentity;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'nik' => StudentIdentity::nikRules(),
            'no_wa' => ['required', 'string', 'max:30'],
            'email' => ['bail', 'nullable', 'string', 'lowercase', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = DB::transaction(function () use ($validated): User {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'] ?? null,
                'nik' => $validated['nik'],
                'no_wa' => $validated['no_wa'],
                'password' => Hash::make($validated['password']),
                'role' => 'siswa',
            ]);

            $user->siswa()->create([
                'nisn' => null,
                'nama_lengkap' => $validated['name'],
                'status_siswa' => 'calon_spmb',
            ]);

            return $user;
        });

        event(new Registered($user));

        Auth::login($user);

        return to_route('siswa.spmb.index');
    }
}
