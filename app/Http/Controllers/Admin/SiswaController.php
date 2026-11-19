<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KategoriBeasiswa;
use App\Models\Kelas;
use App\Models\PendaftaranSpmb;
use App\Models\ProgramKeahlian;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\User;
use App\Support\SpreadsheetFile;
use App\Support\StudentIdentity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SiswaController extends Controller
{
    private const IMPORT_HEADERS = [
        'nisn',
        'nis',
        'nama_lengkap',
        'email',
        'nama_kelas',
        'jenis_kelamin',
        'tempat_lahir',
        'tanggal_lahir',
        'agama',
        'alamat_murid',
        'nama_ayah',
        'nama_ibu',
        'no_wa_wali',
        'tipe_program',
        'ukuran_seragam',
        'program_keahlian',
        'konsentrasi_keahlian',
    ];

    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'kelas_id' => ['nullable', 'string'],
            'program_keahlian_id' => ['nullable', 'integer', Rule::exists('program_keahlians', 'id')],
            'konsentrasi_keahlian_id' => [
                'nullable',
                'integer',
                Rule::exists('konsentrasi_keahlians', 'id')
                    ->where('program_keahlian_id', $request->input('program_keahlian_id')),
            ],
        ]);

        $kelasFilter = $filters['kelas_id'] ?? null;
        $programFilter = $filters['program_keahlian_id'] ?? null;
        $concentrationFilter = $filters['konsentrasi_keahlian_id'] ?? null;

        $siswas = Siswa::query()
            ->where('status_siswa', 'aktif')
            ->with([
                'user:id,name,email',
                'kelas:id,nama_kelas,tahun_ajaran_id',
                'kelas.tahunAjaran:id,nama_tahun,semester',
                'programKeahlian:id,kode_jurusan,nama_jurusan',
                'konsentrasiKeahlian:id,program_keahlian_id,kode_konsentrasi,nama_konsentrasi',
                'kategoriBeasiswa:id,nama_beasiswa',
            ])
            ->when($kelasFilter === 'tanpa_kelas', fn ($query) => $query->whereNull('kelas_id'))
            ->when($kelasFilter && $kelasFilter !== 'tanpa_kelas' && is_numeric($kelasFilter), fn ($query) => $query->where('kelas_id', (int) $kelasFilter))
            ->when($programFilter, fn ($query) => $query->where('program_keahlian_id', $programFilter))
            ->when($concentrationFilter, fn ($query) => $query->where('konsentrasi_keahlian_id', $concentrationFilter))
            ->orderBy('nama_lengkap')
            ->paginate(10)
            ->withQueryString();

        $tanpaKelasCount = Siswa::query()
            ->where('status_siswa', 'aktif')
            ->whereNull('kelas_id')
            ->count();

        return Inertia::render('Admin/Siswa/Index', [
            'siswas' => $siswas,
            'kelasOptions' => Kelas::query()
                ->with('tahunAjaran:id,nama_tahun,semester')
                ->orderBy('nama_kelas')
                ->get(['id', 'nama_kelas', 'tahun_ajaran_id', 'program_keahlian_id', 'konsentrasi_keahlian_id']),
            'programKeahlians' => ProgramKeahlian::query()
                ->with('konsentrasiKeahlians:id,program_keahlian_id,kode_konsentrasi,nama_konsentrasi')
                ->orderBy('nama_jurusan')
                ->get(['id', 'kode_jurusan', 'nama_jurusan']),
            'kategoriBeasiswas' => KategoriBeasiswa::query()->orderBy('nama_beasiswa')->get(['id', 'nama_beasiswa']),
            'filters' => [
                'kelas_id' => (string) ($kelasFilter ?? ''),
                'program_keahlian_id' => (string) ($programFilter ?? ''),
                'konsentrasi_keahlian_id' => (string) ($concentrationFilter ?? ''),
            ],
            'tanpaKelasCount' => $tanpaKelasCount,
        ]);
    }

    public function template(): StreamedResponse
    {
        return SpreadsheetFile::downloadTemplate('template-siswa.xlsx', self::IMPORT_HEADERS);
    }

    public function import(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx', 'extensions:xlsx', 'max:5120'],
        ]);
        $rows = SpreadsheetFile::readRows(
            $validated['file'],
            self::IMPORT_HEADERS,
            optionalHeaders: ['program_keahlian', 'konsentrasi_keahlian'],
        );
        $activeYearId = TahunAjaran::query()->where('is_aktif', true)->value('id');
        $hasClassAssignments = collect($rows)->contains(
            static fn (array $item): bool => ($item['data']['nama_kelas'] ?? null) !== null,
        );

        if (! $activeYearId && $hasClassAssignments) {
            throw ValidationException::withMessages([
                'file' => 'Tahun ajaran aktif belum ditetapkan untuk menentukan kelas siswa.',
            ]);
        }

        $classesByName = $activeYearId
            ? Kelas::query()
                ->where('tahun_ajaran_id', $activeYearId)
                ->get(['id', 'nama_kelas', 'program_keahlian_id', 'konsentrasi_keahlian_id'])
                ->groupBy(fn (Kelas $kelas): string => mb_strtolower($kelas->nama_kelas))
            : collect();
        $programsByIdentifier = collect();

        foreach (ProgramKeahlian::query()
            ->with('konsentrasiKeahlians:id,program_keahlian_id,kode_konsentrasi,nama_konsentrasi')
            ->get(['id', 'kode_jurusan', 'nama_jurusan']) as $program) {
            $programsByIdentifier->put(mb_strtolower($program->nama_jurusan), $program);
            $programsByIdentifier->put(mb_strtolower($program->kode_jurusan), $program);
        }

        $errors = [];
        $seenNisns = [];
        $seenNis = [];
        $seenEmails = [];
        $students = [];

        foreach ($rows as $item) {
            $rowNumber = $item['row'];
            $data = $item['data'];
            $programType = trim((string) ($data['tipe_program'] ?? ''));
            $data['tipe_program'] = $programType === '' ? 'reguler' : mb_strtolower($programType);
            $validator = Validator::make($data, [
                'nisn' => ['required', 'string', 'max:255', Rule::unique('siswas', 'nisn')],
                'nis' => ['nullable', 'string', 'max:255', Rule::unique('siswas', 'nis')],
                'nama_lengkap' => ['required', 'string', 'max:255'],
                'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
                'nama_kelas' => ['nullable', 'string', 'max:255'],
                'jenis_kelamin' => ['nullable', Rule::in(['L', 'P'])],
                'tempat_lahir' => ['nullable', 'string', 'max:100'],
                'tanggal_lahir' => ['nullable', 'date_format:Y-m-d'],
                'agama' => ['nullable', 'string', 'max:50'],
                'alamat_murid' => ['nullable', 'string', 'max:2000'],
                'nama_ayah' => ['nullable', 'string', 'max:255'],
                'nama_ibu' => ['nullable', 'string', 'max:255'],
                'no_wa_wali' => ['nullable', 'string', 'max:30'],
                'tipe_program' => ['required', Rule::in(['reguler', 'santri_internal', 'santri_eksternal'])],
                'ukuran_seragam' => ['nullable', Rule::in(['S', 'M', 'L', 'XL', 'XXL'])],
                'program_keahlian' => ['nullable', 'string', 'max:255'],
                'konsentrasi_keahlian' => ['nullable', 'string', 'max:255'],
            ]);

            if ($validator->fails()) {
                $errors[] = "Baris {$rowNumber}: ".implode(' ', $validator->errors()->all());

                continue;
            }

            $data = $validator->validated();
            $programIdentifier = $data['program_keahlian'] ?? null;
            $concentrationIdentifier = $data['konsentrasi_keahlian'] ?? null;
            $programKeahlian = $programIdentifier
                ? $programsByIdentifier->get(mb_strtolower($programIdentifier))
                : null;

            if ($programIdentifier && ! $programKeahlian) {
                $errors[] = "Baris {$rowNumber}: Program Keahlian tidak ditemukan.";

                continue;
            }

            if ($concentrationIdentifier && ! $programKeahlian) {
                $errors[] = "Baris {$rowNumber}: Program Keahlian wajib diisi jika Konsentrasi Keahlian dipilih.";

                continue;
            }

            $konsentrasiKeahlian = $programKeahlian?->konsentrasiKeahlians->first(
                fn ($concentration): bool => in_array(
                    mb_strtolower($concentrationIdentifier ?? ''),
                    [
                        mb_strtolower($concentration->nama_konsentrasi),
                        mb_strtolower($concentration->kode_konsentrasi),
                    ],
                    true,
                ),
            );

            if ($programKeahlian && ! $konsentrasiKeahlian) {
                $errors[] = "Baris {$rowNumber}: Konsentrasi Keahlian tidak ditemukan pada Program Keahlian yang dipilih.";

                continue;
            }

            $nisnKey = mb_strtolower($data['nisn']);
            $emailKey = mb_strtolower($data['email']);

            if (isset($seenNisns[$nisnKey])) {
                $errors[] = "Baris {$rowNumber}: NISN duplikat di dalam file.";
            }

            if (isset($seenEmails[$emailKey])) {
                $errors[] = "Baris {$rowNumber}: Email duplikat di dalam file.";
            }

            $seenNisns[$nisnKey] = true;
            $seenEmails[$emailKey] = true;

            if ($data['nis'] !== null) {
                $nisKey = mb_strtolower($data['nis']);

                if (isset($seenNis[$nisKey])) {
                    $errors[] = "Baris {$rowNumber}: NIS duplikat di dalam file.";
                }

                $seenNis[$nisKey] = true;
            }

            $matchingClass = null;

            if ($data['nama_kelas'] !== null) {
                $matchingClasses = $classesByName->get(mb_strtolower($data['nama_kelas']), collect());

                if ($matchingClasses->count() !== 1) {
                    $errors[] = "Baris {$rowNumber}: Nama kelas tidak ditemukan secara unik pada tahun ajaran aktif.";

                    continue;
                }

                $matchingClass = $matchingClasses->first();
            }

            if (
                $programKeahlian
                && $matchingClass
                && (
                    (int) $matchingClass->program_keahlian_id !== $programKeahlian->id
                    || (int) $matchingClass->konsentrasi_keahlian_id !== $konsentrasiKeahlian?->id
                )
            ) {
                $errors[] = "Baris {$rowNumber}: Program dan konsentrasi tidak sesuai dengan kelas yang dipilih.";

                continue;
            }

            $students[] = [
                'data' => $data,
                'kelas_id' => $matchingClass?->id,
                'program_keahlian_id' => $programKeahlian?->id ?? $matchingClass?->program_keahlian_id,
                'konsentrasi_keahlian_id' => $konsentrasiKeahlian?->id ?? $matchingClass?->konsentrasi_keahlian_id,
            ];
        }

        if ($errors !== []) {
            throw ValidationException::withMessages(['file' => implode("\n", $errors)]);
        }

        DB::transaction(function () use ($students): void {
            foreach ($students as $student) {
                $data = $student['data'];
                $user = User::create([
                    'name' => $data['nama_lengkap'],
                    'email' => $data['email'],
                    'password' => 'password',
                    'role' => 'siswa',
                ]);
                $user->forceFill(['email_verified_at' => now()])->save();

                Siswa::create([
                    'user_id' => $user->id,
                    'kelas_id' => $student['kelas_id'],
                    'program_keahlian_id' => $student['program_keahlian_id'],
                    'konsentrasi_keahlian_id' => $student['konsentrasi_keahlian_id'],
                    'nisn' => $data['nisn'],
                    'nis' => $data['nis'] ?? null,
                    'nama_lengkap' => $data['nama_lengkap'],
                    'no_wa_wali' => $data['no_wa_wali'] ?? null,
                    'status_siswa' => 'aktif',
                    'jenis_kelamin' => $data['jenis_kelamin'] ?? null,
                    'tempat_lahir' => $data['tempat_lahir'] ?? null,
                    'tanggal_lahir' => $data['tanggal_lahir'] ?? null,
                    'agama' => $data['agama'] ?? null,
                    'alamat_murid' => $data['alamat_murid'] ?? null,
                    'nama_ayah' => $data['nama_ayah'] ?? null,
                    'nama_ibu' => $data['nama_ibu'] ?? null,
                    'tipe_program' => $data['tipe_program'],
                    'ukuran_seragam' => $data['ukuran_seragam'] ?? null,
                ]);
            }
        });

        return to_route('admin.siswa.index')->with(
            'success',
            count($students).' siswa berhasil diimpor. Kata sandi awal akun adalah password.',
        );
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nisn' => ['required', 'string', 'max:255', Rule::unique('siswas', 'nisn')],
            'nama_lengkap' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'min:8'],
            'kelas_id' => ['nullable', 'integer', Rule::exists('kelas', 'id')],
            'no_wa_wali' => ['nullable', 'string', 'max:30'],
            ...$this->programRules($request),
            ...StudentIdentity::rules(),
        ], [
            'nisn.required' => 'NISN wajib diisi.',
            'nisn.unique' => 'NISN sudah digunakan.',
            'nama_lengkap.required' => 'Nama lengkap wajib diisi.',
            'email.required' => 'Email wajib diisi.',
            'email.unique' => 'Email sudah digunakan.',
            'password.required' => 'Kata sandi wajib diisi.',
            'password.min' => 'Kata sandi minimal 8 karakter.',
        ]);

        $photoPath = $request->file('foto_siswa')?->store('foto-siswa', 'public');

        if ($request->hasFile('foto_siswa') && ! is_string($photoPath)) {
            return back()->with('error', 'Pas foto gagal disimpan. Silakan coba kembali.');
        }

        DB::transaction(function () use ($validated, $photoPath): void {
            $user = User::create([
                'name' => $validated['nama_lengkap'],
                'email' => $validated['email'],
                'password' => $validated['password'],
                'role' => 'siswa',
            ]);
            $user->forceFill(['email_verified_at' => now()])->save();

            Siswa::create([
                'user_id' => $user->id,
                'kelas_id' => $validated['kelas_id'] ?? null,
                'program_keahlian_id' => $validated['program_keahlian_id'] ?? null,
                'konsentrasi_keahlian_id' => $validated['konsentrasi_keahlian_id'] ?? null,
                'nisn' => $validated['nisn'],
                'nama_lengkap' => $validated['nama_lengkap'],
                'no_wa_wali' => $validated['no_wa_wali'] ?? null,
                'status_siswa' => 'aktif',
                ...StudentIdentity::attributes($validated),
                'foto_siswa_path' => $photoPath,
            ]);
        });

        return to_route('admin.siswa.index')->with('success', 'Data siswa berhasil ditambahkan.');
    }

    public function update(Request $request, Siswa $siswa): RedirectResponse
    {
        abort_unless($siswa->status_siswa === 'aktif', 404);
        $siswa->load('user');

        $validated = $request->validate([
            'nisn' => ['required', 'string', 'max:255', Rule::unique('siswas', 'nisn')->ignore($siswa)],
            'nama_lengkap' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($siswa->user)],
            'password' => ['nullable', 'string', 'min:8'],
            'kelas_id' => ['nullable', 'integer', Rule::exists('kelas', 'id')],
            'no_wa_wali' => ['nullable', 'string', 'max:30'],
            ...$this->programRules($request),
            ...StudentIdentity::rules($siswa),
        ], [
            'nisn.required' => 'NISN wajib diisi.',
            'nisn.unique' => 'NISN sudah digunakan.',
            'nama_lengkap.required' => 'Nama lengkap wajib diisi.',
            'email.required' => 'Email wajib diisi.',
            'email.unique' => 'Email sudah digunakan.',
            'password.min' => 'Kata sandi minimal 8 karakter.',
        ]);

        $newPhotoPath = $request->file('foto_siswa')?->store('foto-siswa', 'public');

        if ($request->hasFile('foto_siswa') && ! is_string($newPhotoPath)) {
            return back()->with('error', 'Pas foto gagal disimpan. Silakan coba kembali.');
        }

        $oldPhotoPath = $siswa->foto_siswa_path;

        DB::transaction(function () use ($siswa, $validated, $newPhotoPath): void {
            $userData = [
                'name' => $validated['nama_lengkap'],
                'email' => $validated['email'],
            ];

            if ($siswa->user->email !== $validated['email']) {
                $userData['email_verified_at'] = null;
            }

            if (! empty($validated['password'])) {
                $userData['password'] = $validated['password'];
            }

            $siswa->user->forceFill($userData)->save();
            $siswa->update([
                'kelas_id' => $validated['kelas_id'] ?? null,
                'program_keahlian_id' => $validated['program_keahlian_id'] ?? null,
                'konsentrasi_keahlian_id' => $validated['konsentrasi_keahlian_id'] ?? null,
                'nisn' => $validated['nisn'],
                'nama_lengkap' => $validated['nama_lengkap'],
                'no_wa_wali' => $validated['no_wa_wali'] ?? null,
                ...StudentIdentity::attributes($validated),
                ...(is_string($newPhotoPath) ? ['foto_siswa_path' => $newPhotoPath] : []),
            ]);
        });

        if ($oldPhotoPath && is_string($newPhotoPath) && ! Storage::disk('public')->delete($oldPhotoPath)) {
            Log::warning('Pas foto lama gagal dihapus setelah penggantian.', [
                'siswa_id' => $siswa->id,
                'path' => $oldPhotoPath,
            ]);
        }

        return to_route('admin.siswa.index')->with('success', 'Data siswa berhasil diperbarui.');
    }

    public function updateKelas(Request $request, Siswa $siswa): RedirectResponse
    {
        abort_unless($siswa->status_siswa === 'aktif', 404);

        $validated = $request->validate([
            'kelas_id' => ['nullable', 'integer', Rule::exists('kelas', 'id')],
        ]);

        $newKelasId = $validated['kelas_id'] ?? null;
        $siswa->update(['kelas_id' => $newKelasId]);

        if ($newKelasId === null) {
            return back()->with('success', "Siswa {$siswa->nama_lengkap} berhasil dikeluarkan dari kelas.");
        }

        $namaKelas = Kelas::query()->where('id', $newKelasId)->value('nama_kelas');

        return back()->with('success', "Siswa {$siswa->nama_lengkap} berhasil dipindahkan ke {$namaKelas}.");
    }

    public function batchUpdateKelas(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'siswa_ids' => ['required', 'array', 'min:1'],
            'siswa_ids.*' => ['required', 'integer', Rule::exists('siswas', 'id')->where('status_siswa', 'aktif')],
            'kelas_id' => ['nullable', 'integer', Rule::exists('kelas', 'id')],
        ], [
            'siswa_ids.required' => 'Pilih minimal satu siswa.',
            'siswa_ids.min' => 'Pilih minimal satu siswa.',
        ]);

        $newKelasId = $validated['kelas_id'] ?? null;
        $count = count($validated['siswa_ids']);

        Siswa::query()
            ->whereIn('id', $validated['siswa_ids'])
            ->where('status_siswa', 'aktif')
            ->update(['kelas_id' => $newKelasId]);

        if ($newKelasId === null) {
            return back()->with('success', "{$count} siswa berhasil dikeluarkan dari kelas.");
        }

        $namaKelas = Kelas::query()->where('id', $newKelasId)->value('nama_kelas');

        return back()->with('success', "{$count} siswa berhasil dipindahkan ke {$namaKelas}.");
    }

    public function destroy(Siswa $siswa): RedirectResponse
    {
        abort_unless($siswa->status_siswa === 'aktif', 404);

        if (
            $siswa->tagihans()->exists()
            || $siswa->hasilUjians()->exists()
            || $siswa->nilais()->exists()
            || PendaftaranSpmb::query()->where('user_id', $siswa->user_id)->exists()
        ) {
            return back()->with('error', 'Siswa tidak dapat dihapus karena masih memiliki tagihan, hasil ujian, nilai, atau riwayat SPMB.');
        }

        $photoPath = $siswa->foto_siswa_path;
        $siswa->user()->delete();

        if ($photoPath && ! Storage::disk('public')->delete($photoPath)) {
            Log::warning('Pas foto gagal dihapus setelah akun siswa dihapus.', [
                'siswa_id' => $siswa->id,
                'path' => $photoPath,
            ]);
        }

        return to_route('admin.siswa.index')->with('success', 'Data siswa berhasil dihapus.');
    }

    public function resetPassword(Siswa $siswa): RedirectResponse
    {
        abort_unless($siswa->status_siswa === 'aktif', 404);

        $siswa->user->forceFill([
            'password' => Hash::make('password'),
        ])->save();

        return to_route('admin.siswa.index')
            ->with('success', 'Kata sandi akun siswa berhasil direset menjadi password.');
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    private function programRules(Request $request): array
    {
        return [
            'program_keahlian_id' => [
                'nullable',
                'integer',
                'required_with:konsentrasi_keahlian_id',
                Rule::exists('program_keahlians', 'id'),
            ],
            'konsentrasi_keahlian_id' => [
                'nullable',
                'integer',
                'required_with:program_keahlian_id',
                Rule::exists('konsentrasi_keahlians', 'id')
                    ->where('program_keahlian_id', $request->input('program_keahlian_id')),
            ],
        ];
    }
}
