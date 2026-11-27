<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use App\Models\Kelas;
use App\Models\TahunAjaran;
use App\Models\User;
use App\Support\SpreadsheetFile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class GuruController extends Controller
{
    private const IMPORT_HEADERS = [
        'niky',
        'nama_lengkap',
        'email',
        'no_wa',
        'is_wali_kelas',
        'nama_kelas_wali',
    ];

    private const IMPORT_HEADER_ALIASES = [
        'nip' => 'niky',
    ];

    public function index(): Response
    {
        return Inertia::render('Admin/Guru/Index', [
            'gurus' => Guru::query()
                ->with('user:id,name,username,email,no_wa')
                ->orderBy('nama_lengkap')
                ->paginate(10)
                ->withQueryString(),
        ]);
    }

    public function template(): StreamedResponse
    {
        return SpreadsheetFile::downloadTemplate('template-guru.xlsx', self::IMPORT_HEADERS);
    }

    public function import(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx', 'extensions:xlsx', 'max:5120'],
        ]);
        $rows = SpreadsheetFile::readRows(
            $validated['file'],
            self::IMPORT_HEADERS,
            self::IMPORT_HEADER_ALIASES,
        );
        $nikyCandidates = collect($rows)
            ->map(fn (array $item): string => mb_strtolower(trim((string) ($item['data']['niky'] ?? ''))))
            ->filter()
            ->unique()
            ->values()
            ->all();
        $emailCandidates = collect($rows)
            ->map(fn (array $item): string => mb_strtolower(trim((string) ($item['data']['email'] ?? ''))))
            ->filter()
            ->unique()
            ->values()
            ->all();
        $existingNiky = $this->existingNormalizedValues('gurus', 'nip', $nikyCandidates);
        $existingEmails = $this->existingTeacherEmails($emailCandidates);
        $activeYearId = TahunAjaran::query()->where('is_aktif', true)->value('id');
        $classes = $activeYearId
            ? Kelas::query()->where('tahun_ajaran_id', $activeYearId)->get(['id', 'nama_kelas', 'wali_kelas_id'])
            : collect();
        $classesByName = $classes->groupBy(fn (Kelas $kelas): string => mb_strtolower($kelas->nama_kelas));
        $errors = [];
        $skippedRows = [];
        $seenNiky = [];
        $seenEmails = [];
        $seenClassIds = [];
        $teachers = [];

        foreach ($rows as $item) {
            $rowNumber = $item['row'];
            $data = $item['data'];
            $data['email'] = trim((string) ($data['email'] ?? '')) ?: null;
            $nikyKey = mb_strtolower(trim((string) ($data['niky'] ?? '')));
            $emailKey = mb_strtolower(trim((string) ($data['email'] ?? '')));

            if (isset($existingNiky[$nikyKey]) || ($emailKey !== '' && isset($existingEmails[$emailKey]))) {
                $skippedRows[] = $rowNumber;

                continue;
            }

            $isHomeroomTeacher = trim((string) ($data['is_wali_kelas'] ?? ''));
            $data['is_wali_kelas'] = $isHomeroomTeacher === '' ? 'tidak' : mb_strtolower($isHomeroomTeacher);
            $validator = Validator::make($data, [
                'niky' => ['required', 'string', 'max:255', Rule::unique('gurus', 'nip')],
                'nama_lengkap' => ['required', 'string', 'max:255'],
                'email' => ['nullable', 'email', 'max:255', Rule::unique('users', 'email')],
                'no_wa' => ['nullable', 'string', 'max:30'],
                'is_wali_kelas' => ['required', Rule::in(['ya', 'tidak'])],
                'nama_kelas_wali' => ['nullable', 'string', 'max:255', 'required_if:is_wali_kelas,ya'],
            ], [], ['niky' => 'NIKY']);

            if ($validator->fails()) {
                $errors[] = "Baris {$rowNumber}: ".implode(' ', $validator->errors()->all());

                continue;
            }

            $data = $validator->validated();
            $nikyKey = mb_strtolower($data['niky']);
            $emailKey = mb_strtolower((string) ($data['email'] ?? ''));

            if (isset($seenNiky[$nikyKey])) {
                $errors[] = "Baris {$rowNumber}: NIKY duplikat di dalam file.";
            }

            if ($emailKey !== '' && isset($seenEmails[$emailKey])) {
                $errors[] = "Baris {$rowNumber}: Email duplikat di dalam file.";
            }

            $seenNiky[$nikyKey] = true;

            if ($emailKey !== '') {
                $seenEmails[$emailKey] = true;
            }

            $classId = null;

            if ($data['is_wali_kelas'] === 'ya') {
                $classKey = mb_strtolower($data['nama_kelas_wali']);
                $matchingClasses = $classesByName->get($classKey, collect());

                if (! $activeYearId || $matchingClasses->count() !== 1) {
                    $errors[] = "Baris {$rowNumber}: Kelas wali tidak ditemukan secara unik pada tahun ajaran aktif.";
                } else {
                    $class = $matchingClasses->first();
                    $classId = $class->id;

                    if ($class->wali_kelas_id !== null) {
                        $errors[] = "Baris {$rowNumber}: Kelas {$class->nama_kelas} sudah memiliki wali kelas.";
                    }

                    if (isset($seenClassIds[$classId])) {
                        $errors[] = "Baris {$rowNumber}: Kelas wali yang sama dicantumkan lebih dari sekali.";
                    }

                    $seenClassIds[$classId] = true;
                }
            }

            $teachers[] = [
                'data' => $data,
                'class_id' => $classId,
            ];
        }

        if ($errors !== []) {
            throw ValidationException::withMessages(['file' => implode("\n", $errors)]);
        }

        DB::transaction(function () use ($teachers): void {
            foreach ($teachers as $teacher) {
                $data = $teacher['data'];
                $user = User::create([
                    'name' => $data['nama_lengkap'],
                    'username' => $this->generateUsername($data['nama_lengkap']),
                    'email' => $data['email'] ?? null,
                    'no_wa' => $data['no_wa'] ?? null,
                    'password' => 'password',
                    'role' => 'guru',
                ]);
                $user->forceFill([
                    'email_verified_at' => now(),
                    'must_change_password' => true,
                ])->save();

                $guru = Guru::create([
                    'user_id' => $user->id,
                    'nip' => $data['niky'],
                    'nama_lengkap' => $data['nama_lengkap'],
                    'is_wali_kelas' => $data['is_wali_kelas'] === 'ya',
                ]);

                if ($teacher['class_id'] !== null) {
                    Kelas::query()->whereKey($teacher['class_id'])->update(['wali_kelas_id' => $guru->id]);
                }
            }
        });

        $message = count($teachers).' guru baru berhasil diimpor.';

        if ($skippedRows !== []) {
            $message .= ' '.count($skippedRows).' baris dilewati karena NIKY atau email sudah terdaftar.';
        }

        if ($teachers !== []) {
            $message .= ' Kata sandi awal akun adalah password dan wajib diganti saat login pertama.';
        }

        return to_route('admin.guru.index')->with('success', $message);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nip' => ['required', 'string', 'max:255', Rule::unique('gurus', 'nip')],
            'nama_lengkap' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255', Rule::unique('users', 'email')],
            'no_wa' => ['nullable', 'string', 'max:30'],
            'is_wali_kelas' => ['required', 'boolean'],
        ], [
            'nip.required' => 'NIKY wajib diisi.',
            'nip.unique' => 'NIKY sudah digunakan.',
            'email.unique' => 'Email sudah digunakan.',
        ], ['nip' => 'NIKY']);

        $username = DB::transaction(function () use ($validated): string {
            $user = User::create([
                'name' => $validated['nama_lengkap'],
                'username' => $this->generateUsername($validated['nama_lengkap']),
                'email' => $validated['email'] ?? null,
                'no_wa' => $validated['no_wa'] ?? null,
                'password' => 'password',
                'role' => 'guru',
            ]);
            $user->forceFill([
                'email_verified_at' => now(),
                'must_change_password' => true,
            ])->save();

            Guru::create([
                'user_id' => $user->id,
                'nip' => $validated['nip'],
                'nama_lengkap' => $validated['nama_lengkap'],
                'is_wali_kelas' => $validated['is_wali_kelas'],
            ]);

            return $user->username;
        });

        return to_route('admin.guru.index')->with(
            'success',
            "Data guru berhasil ditambahkan. Username: {$username}. Kata sandi awal: password dan wajib diganti saat login pertama.",
        );
    }

    public function update(Request $request, Guru $guru): RedirectResponse
    {
        $guru->load('user');

        $validated = $request->validate([
            'nip' => ['required', 'string', 'max:255', Rule::unique('gurus', 'nip')->ignore($guru)],
            'nama_lengkap' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255', Rule::unique('users', 'email')->ignore($guru->user)],
            'no_wa' => ['nullable', 'string', 'max:30'],
            'password' => ['nullable', 'string', 'min:8'],
            'is_wali_kelas' => ['required', 'boolean'],
        ], [
            'nip.required' => 'NIKY wajib diisi.',
            'nip.unique' => 'NIKY sudah digunakan.',
            'email.unique' => 'Email sudah digunakan.',
            'password.min' => 'Kata sandi minimal 8 karakter.',
        ], ['nip' => 'NIKY']);

        DB::transaction(function () use ($guru, $validated): void {
            $userData = [
                'name' => $validated['nama_lengkap'],
                'email' => $validated['email'] ?? null,
                'no_wa' => $validated['no_wa'] ?? null,
            ];

            if ($guru->user->email !== ($validated['email'] ?? null)) {
                $userData['email_verified_at'] = null;
            }

            if (! empty($validated['password'])) {
                $userData['password'] = $validated['password'];
                $userData['must_change_password'] = true;
            }

            $guru->user->forceFill($userData)->save();
            $guru->update([
                'nip' => $validated['nip'],
                'nama_lengkap' => $validated['nama_lengkap'],
                'is_wali_kelas' => $validated['is_wali_kelas'],
            ]);
        });

        return to_route('admin.guru.index')->with('success', 'Data guru berhasil diperbarui.');
    }

    public function destroy(Guru $guru): RedirectResponse
    {
        if (
            $guru->jadwals()->exists()
            || $guru->tugasMengajars()->exists()
            || $guru->ujians()->exists()
            || $guru->kelasWalian()->exists()
        ) {
            return back()->with('error', 'Guru tidak dapat dihapus karena masih memiliki jadwal, penugasan mengajar, ujian, atau kelas wali.');
        }

        $guru->user()->delete();

        return to_route('admin.guru.index')->with('success', 'Data guru berhasil dihapus.');
    }

    public function resetPassword(Guru $guru): RedirectResponse
    {
        $guru->user->forceFill([
            'password' => Hash::make('password'),
            'must_change_password' => true,
        ])->save();

        return to_route('admin.guru.index')
            ->with('success', 'Kata sandi akun guru berhasil direset menjadi password dan wajib diganti saat login berikutnya.');
    }

    private function generateUsername(string $namaLengkap): string
    {
        $baseUsername = rtrim(substr(Str::slug($namaLengkap, '.'), 0, 240), '.');
        $baseUsername = $baseUsername === '' ? 'guru' : $baseUsername;

        if (preg_match('/^\d{16}$/D', $baseUsername) === 1) {
            $baseUsername = 'guru.'.$baseUsername;
        }

        $username = $baseUsername;
        $suffix = 2;

        while (User::query()->where('username', $username)->exists()) {
            $suffixText = (string) $suffix++;
            $username = substr($baseUsername, 0, 254 - strlen($suffixText)).'.'.$suffixText;
        }

        return $username;
    }

    /**
     * @param  array<int, string>  $values
     * @return array<string, true>
     */
    private function existingNormalizedValues(string $table, string $column, array $values): array
    {
        $existingValues = [];

        foreach (array_chunk($values, 500) as $valueChunk) {
            $matches = DB::table($table)
                ->whereIn(DB::raw("LOWER({$column})"), $valueChunk)
                ->pluck($column);

            foreach ($matches as $value) {
                $existingValues[mb_strtolower(trim((string) $value))] = true;
            }
        }

        return $existingValues;
    }

    /**
     * @param  array<int, string>  $emails
     * @return array<string, true>
     */
    private function existingTeacherEmails(array $emails): array
    {
        $existingEmails = [];

        foreach (array_chunk($emails, 500) as $emailChunk) {
            $matches = DB::table('users')
                ->join('gurus', 'gurus.user_id', '=', 'users.id')
                ->whereIn(DB::raw('LOWER(users.email)'), $emailChunk)
                ->pluck('users.email');

            foreach ($matches as $email) {
                $existingEmails[mb_strtolower(trim((string) $email))] = true;
            }
        }

        return $existingEmails;
    }
}
