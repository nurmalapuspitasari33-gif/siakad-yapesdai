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
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
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
        'sekolah_asal',
        'no_wa_wali',
        'tipe_program',
        'ukuran_seragam',
        'program_keahlian',
        'konsentrasi_keahlian',
        'status_keluarga',
        'anak_ke',
        'telepon_rumah',
        'diterima_di_kelas',
        'tanggal_diterima',
        'alamat_ortu',
        'telepon_ortu',
        'pekerjaan_ayah',
        'pekerjaan_ibu',
        'nama_wali',
        'alamat_wali',
        'telepon_wali',
        'pekerjaan_wali',
        'nik',
    ];

    private const INDONESIAN_MONTH_NUMBERS = [
        'januari' => 1,
        'februari' => 2,
        'maret' => 3,
        'april' => 4,
        'mei' => 5,
        'juni' => 6,
        'juli' => 7,
        'agustus' => 8,
        'september' => 9,
        'oktober' => 10,
        'november' => 11,
        'desember' => 12,
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
                'user:id,name,email,nik',
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
        $siswas->getCollection()->each(static function (Siswa $siswa): void {
            $siswa->user?->makeVisible('nik');
        });

        $tanpaKelasCount = Siswa::query()
            ->where('status_siswa', 'aktif')
            ->whereNull('kelas_id')
            ->count();

        return Inertia::render('Admin/Siswa/Index', [
            'openCreateForm' => $request->query('create') === '1',
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
            optionalHeaders: [
                'program_keahlian',
                'konsentrasi_keahlian',
                'sekolah_asal',
                'status_keluarga',
                'anak_ke',
                'telepon_rumah',
                'diterima_di_kelas',
                'tanggal_diterima',
                'alamat_ortu',
                'telepon_ortu',
                'pekerjaan_ayah',
                'pekerjaan_ibu',
                'nama_wali',
                'alamat_wali',
                'telepon_wali',
                'pekerjaan_wali',
                'nik',
            ],
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
        $importNiks = collect($rows)
            ->pluck('data.nik')
            ->filter(static fn (mixed $value): bool => is_string($value) && $value !== '')
            ->unique()
            ->values();
        $importNisns = collect($rows)
            ->pluck('data.nisn')
            ->filter(static fn (mixed $value): bool => is_string($value) && $value !== '')
            ->map(static fn (string $value): string => mb_strtolower($value))
            ->unique()
            ->values();
        $importNis = collect($rows)
            ->pluck('data.nis')
            ->filter(static fn (mixed $value): bool => is_string($value) && $value !== '')
            ->map(static fn (string $value): string => mb_strtolower($value))
            ->unique()
            ->values();
        $importEmails = collect($rows)
            ->pluck('data.email')
            ->filter(static fn (mixed $value): bool => is_string($value) && $value !== '')
            ->map(static fn (string $value): string => mb_strtolower($value))
            ->unique()
            ->values();
        $existingStudentRelations = [
            'user:id,name,email,nik',
            'programKeahlian:id,kode_jurusan,nama_jurusan',
            'konsentrasiKeahlian:id,program_keahlian_id,kode_konsentrasi,nama_konsentrasi',
        ];
        $existingStudents = collect();

        if ($importNiks->isNotEmpty()) {
            $existingStudents = $existingStudents->merge(
                Siswa::query()
                    ->with($existingStudentRelations)
                    ->whereHas(
                        'user',
                        fn (Builder $query): Builder => $query->whereIn('nik', $importNiks->all()),
                    )
                    ->get(),
            );
        }

        if ($importNisns->isNotEmpty()) {
            $existingStudents = $existingStudents->merge(
                Siswa::query()
                    ->with($existingStudentRelations)
                    ->whereIn(DB::raw('LOWER(nisn)'), $importNisns->all())
                    ->get(),
            );
        }

        if ($importNis->isNotEmpty()) {
            $existingStudents = $existingStudents->merge(
                Siswa::query()
                    ->with($existingStudentRelations)
                    ->whereIn(DB::raw('LOWER(nis)'), $importNis->all())
                    ->get(),
            );
        }

        if ($importEmails->isNotEmpty()) {
            $existingStudents = $existingStudents->merge(
                Siswa::query()
                    ->with($existingStudentRelations)
                    ->whereHas(
                        'user',
                        fn (Builder $query): Builder => $query->whereIn(
                            DB::raw('LOWER(email)'),
                            $importEmails->all(),
                        ),
                    )
                    ->get(),
            );
        }

        $existingStudents = $existingStudents->unique('id')->values();
        $existingStudentsByNik = $existingStudents
            ->filter(static fn (Siswa $student): bool => $student->user?->nik !== null)
            ->keyBy(static fn (Siswa $student): string => $student->user->nik);
        $existingStudentsByNisn = $existingStudents
            ->filter(static fn (Siswa $student): bool => $student->nisn !== null)
            ->keyBy(static fn (Siswa $student): string => mb_strtolower($student->nisn));
        $existingStudentsByNis = $existingStudents
            ->filter(static fn (Siswa $student): bool => $student->nis !== null)
            ->keyBy(static fn (Siswa $student): string => mb_strtolower($student->nis));
        $existingStudentsByEmail = $existingStudents
            ->filter(static fn (Siswa $student): bool => $student->user?->email !== null)
            ->keyBy(static fn (Siswa $student): string => mb_strtolower($student->user->email));
        $programsByIdentifier = collect();

        foreach (ProgramKeahlian::query()
            ->with('konsentrasiKeahlians:id,program_keahlian_id,kode_konsentrasi,nama_konsentrasi')
            ->get(['id', 'kode_jurusan', 'nama_jurusan']) as $program) {
            $programsByIdentifier->put(mb_strtolower($program->nama_jurusan), $program);
            $programsByIdentifier->put(mb_strtolower($program->kode_jurusan), $program);
        }

        $errors = [];
        $seenNiks = [];
        $seenNisns = [];
        $seenNis = [];
        $seenEmails = [];
        $seenStudentIds = [];
        $students = [];

        foreach ($rows as $item) {
            $rowNumber = $item['row'];
            $data = $item['data'];
            $nikKey = $data['nik'] !== null ? trim($data['nik']) : null;
            $nisnKey = $data['nisn'] !== null ? mb_strtolower($data['nisn']) : null;
            $nisKey = $data['nis'] !== null ? mb_strtolower($data['nis']) : null;
            $emailKey = $data['email'] !== null ? mb_strtolower($data['email']) : null;
            $matchingStudents = collect([
                $nikKey !== null ? $existingStudentsByNik->get($nikKey) : null,
                $nisnKey !== null ? $existingStudentsByNisn->get($nisnKey) : null,
                $nisKey !== null ? $existingStudentsByNis->get($nisKey) : null,
                $emailKey !== null ? $existingStudentsByEmail->get($emailKey) : null,
            ])->filter()->unique('id')->values();

            if ($matchingStudents->count() > 1) {
                $errors[] = "Baris {$rowNumber}: NIK dan identitas lain merujuk ke akun siswa yang berbeda.";

                continue;
            }

            $existingStudent = $matchingStudents->first();

            if ($existingStudent !== null) {
                if (isset($seenStudentIds[$existingStudent->id])) {
                    $errors[] = "Baris {$rowNumber}: Siswa yang sama dicantumkan lebih dari sekali di dalam file.";
                }

                $seenStudentIds[$existingStudent->id] = true;
                $existingData = [
                    'nik' => $existingStudent->user?->nik,
                    'nisn' => $existingStudent->nisn,
                    'nis' => $existingStudent->nis,
                    'email' => $existingStudent->user?->email,
                    'jenis_kelamin' => $existingStudent->jenis_kelamin,
                    'tempat_lahir' => $existingStudent->tempat_lahir,
                    'tanggal_lahir' => $existingStudent->tanggal_lahir?->format('Y-m-d'),
                    'agama' => $existingStudent->agama,
                    'alamat_murid' => $existingStudent->alamat_murid,
                    'nama_ayah' => $existingStudent->nama_ayah,
                    'nama_ibu' => $existingStudent->nama_ibu,
                    'sekolah_asal' => $existingStudent->sekolah_asal,
                    'status_keluarga' => $existingStudent->status_keluarga,
                    'anak_ke' => $existingStudent->anak_ke,
                    'telepon_rumah' => $existingStudent->telepon_rumah,
                    'diterima_di_kelas' => $existingStudent->diterima_di_kelas,
                    'tanggal_diterima' => $existingStudent->tanggal_diterima?->format('Y-m-d'),
                    'alamat_ortu' => $existingStudent->alamat_ortu,
                    'telepon_ortu' => $existingStudent->telepon_ortu,
                    'pekerjaan_ayah' => $existingStudent->pekerjaan_ayah,
                    'pekerjaan_ibu' => $existingStudent->pekerjaan_ibu,
                    'nama_wali' => $existingStudent->nama_wali,
                    'alamat_wali' => $existingStudent->alamat_wali,
                    'telepon_wali' => $existingStudent->telepon_wali,
                    'pekerjaan_wali' => $existingStudent->pekerjaan_wali,
                    'no_wa_wali' => $existingStudent->no_wa_wali,
                    'tipe_program' => $existingStudent->tipe_program,
                    'ukuran_seragam' => $existingStudent->ukuran_seragam,
                ];

                foreach ($existingData as $field => $value) {
                    if ($data[$field] === null) {
                        $data[$field] = $value;
                    }
                }

                if ($data['program_keahlian'] !== null || $data['konsentrasi_keahlian'] !== null) {
                    if ($data['program_keahlian'] === null && $existingStudent->programKeahlian !== null) {
                        $data['program_keahlian'] = $existingStudent->programKeahlian->kode_jurusan;
                    }

                    if ($data['konsentrasi_keahlian'] === null && $existingStudent->konsentrasiKeahlian !== null) {
                        $data['konsentrasi_keahlian'] = $existingStudent->konsentrasiKeahlian->kode_konsentrasi;
                    }
                }
            }

            $programType = trim((string) ($data['tipe_program'] ?? ''));
            $data['tipe_program'] = $programType === ''
                ? ($existingStudent?->tipe_program ?? 'reguler')
                : mb_strtolower($programType);
            $gender = mb_strtolower(trim((string) ($data['jenis_kelamin'] ?? '')));
            $data['jenis_kelamin'] = match ($gender) {
                'l', 'laki-laki', 'laki laki' => 'L',
                'p', 'perempuan' => 'P',
                default => $data['jenis_kelamin'] ?? null,
            };
            $data['tanggal_lahir'] = $this->normalizeStudentImportDate($data['tanggal_lahir'] ?? null);
            $data['tanggal_diterima'] = $this->normalizeStudentImportDate($data['tanggal_diterima'] ?? null);
            $nisnUniqueRule = Rule::unique('siswas', 'nisn');
            $nisUniqueRule = Rule::unique('siswas', 'nis');
            $emailUniqueRule = Rule::unique('users', 'email');
            $nikUniqueRule = Rule::unique('users', 'nik');

            if ($existingStudent !== null) {
                $nisnUniqueRule->ignore($existingStudent);
                $nisUniqueRule->ignore($existingStudent);
                $emailUniqueRule->ignore($existingStudent->user);
                $nikUniqueRule->ignore($existingStudent->user);
            }

            $validator = Validator::make($data, [
                'nik' => ['nullable', 'string', 'digits:16', $nikUniqueRule],
                'nisn' => ['nullable', 'string', 'max:255', $nisnUniqueRule],
                'nis' => ['nullable', 'string', 'max:255', $nisUniqueRule],
                'nama_lengkap' => ['required', 'string', 'max:255'],
                'email' => ['nullable', 'email', 'max:255', $emailUniqueRule],
                'nama_kelas' => ['nullable', 'string', 'max:255'],
                'jenis_kelamin' => ['nullable', Rule::in(['L', 'P'])],
                'tempat_lahir' => ['nullable', 'string', 'max:100'],
                'tanggal_lahir' => ['nullable', 'date_format:Y-m-d'],
                'agama' => ['nullable', 'string', 'max:50'],
                'alamat_murid' => ['nullable', 'string', 'max:2000'],
                'nama_ayah' => ['nullable', 'string', 'max:255'],
                'nama_ibu' => ['nullable', 'string', 'max:255'],
                'sekolah_asal' => ['nullable', 'string', 'max:255'],
                'status_keluarga' => ['nullable', 'string', 'max:50'],
                'anak_ke' => ['nullable', 'integer', 'between:1,30'],
                'telepon_rumah' => ['nullable', 'string', 'max:30'],
                'diterima_di_kelas' => ['nullable', 'string', 'max:255'],
                'tanggal_diterima' => ['nullable', 'date_format:Y-m-d'],
                'alamat_ortu' => ['nullable', 'string', 'max:2000'],
                'telepon_ortu' => ['nullable', 'string', 'max:30'],
                'pekerjaan_ayah' => ['nullable', 'string', 'max:255'],
                'pekerjaan_ibu' => ['nullable', 'string', 'max:255'],
                'nama_wali' => ['nullable', 'string', 'max:255'],
                'alamat_wali' => ['nullable', 'string', 'max:2000'],
                'telepon_wali' => ['nullable', 'string', 'max:30'],
                'pekerjaan_wali' => ['nullable', 'string', 'max:255'],
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

            if ($data['nisn'] !== null) {
                $nisnKey = mb_strtolower($data['nisn']);

                if (isset($seenNisns[$nisnKey])) {
                    $errors[] = "Baris {$rowNumber}: NISN duplikat di dalam file.";
                }

                $seenNisns[$nisnKey] = true;
            }

            if ($data['nik'] !== null) {
                if (isset($seenNiks[$nikKey])) {
                    $errors[] = "Baris {$rowNumber}: NIK duplikat di dalam file.";
                }

                $seenNiks[$nikKey] = true;
            }

            if ($data['email'] !== null) {
                $emailKey = mb_strtolower($data['email']);

                if (isset($seenEmails[$emailKey])) {
                    $errors[] = "Baris {$rowNumber}: Email duplikat di dalam file.";
                }

                $seenEmails[$emailKey] = true;
            }

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
                'existing' => $existingStudent,
                'kelas_id' => $matchingClass?->id ?? $existingStudent?->kelas_id,
                'program_keahlian_id' => $programKeahlian?->id
                    ?? $matchingClass?->program_keahlian_id
                    ?? $existingStudent?->program_keahlian_id,
                'konsentrasi_keahlian_id' => $konsentrasiKeahlian?->id
                    ?? $matchingClass?->konsentrasi_keahlian_id
                    ?? $existingStudent?->konsentrasi_keahlian_id,
            ];
        }

        if ($errors !== []) {
            throw ValidationException::withMessages(['file' => implode("\n", $errors)]);
        }

        DB::transaction(function () use ($students): void {
            foreach ($students as $student) {
                $data = $student['data'];
                $studentAttributes = [
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
                    'sekolah_asal' => $data['sekolah_asal'] ?? null,
                    'status_keluarga' => $data['status_keluarga'] ?? null,
                    'anak_ke' => $data['anak_ke'] ?? null,
                    'telepon_rumah' => $data['telepon_rumah'] ?? null,
                    'diterima_di_kelas' => $data['diterima_di_kelas'] ?? null,
                    'tanggal_diterima' => $data['tanggal_diterima'] ?? null,
                    'alamat_ortu' => $data['alamat_ortu'] ?? null,
                    'telepon_ortu' => $data['telepon_ortu'] ?? null,
                    'pekerjaan_ayah' => $data['pekerjaan_ayah'] ?? null,
                    'pekerjaan_ibu' => $data['pekerjaan_ibu'] ?? null,
                    'nama_wali' => $data['nama_wali'] ?? null,
                    'alamat_wali' => $data['alamat_wali'] ?? null,
                    'telepon_wali' => $data['telepon_wali'] ?? null,
                    'pekerjaan_wali' => $data['pekerjaan_wali'] ?? null,
                    'tipe_program' => $data['tipe_program'],
                    'ukuran_seragam' => $data['ukuran_seragam'] ?? null,
                ];

                if ($student['existing'] instanceof Siswa) {
                    $existingStudent = $student['existing'];
                    $user = $existingStudent->user;
                    $userAttributes = [
                        'name' => $data['nama_lengkap'],
                        'email' => $data['email'] ?? null,
                    ];

                    if ($user->email !== ($data['email'] ?? null)) {
                        $userAttributes['email_verified_at'] = null;
                    }

                    if ($data['nik'] !== null) {
                        $userAttributes['nik'] = $data['nik'];
                    }

                    $user->forceFill($userAttributes)->save();
                    $existingStudent->update($studentAttributes);

                    continue;
                }

                $user = User::create([
                    'name' => $data['nama_lengkap'],
                    'email' => $data['email'] ?? null,
                    'nik' => $data['nik'],
                    'password' => 'password',
                    'role' => 'siswa',
                ]);

                if (($data['email'] ?? null) !== null) {
                    $user->forceFill(['email_verified_at' => now()])->save();
                }

                $studentAttributes['user_id'] = $user->id;
                $studentAttributes['status_siswa'] = 'aktif';
                Siswa::create($studentAttributes);
            }
        });

        $updatedCount = collect($students)
            ->filter(static fn (array $student): bool => $student['existing'] instanceof Siswa)
            ->count();
        $createdCount = count($students) - $updatedCount;
        $successMessage = "{$createdCount} siswa baru ditambahkan, {$updatedCount} siswa diperbarui.";

        if ($createdCount > 0) {
            $successMessage .= ' Kata sandi awal akun baru adalah password.';
        }

        return to_route('admin.siswa.index')->with(
            'success',
            $successMessage,
        );
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nik' => StudentIdentity::nikRules(),
            'nisn' => ['required', 'string', 'max:255', Rule::unique('siswas', 'nisn')],
            'nama_lengkap' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'string', 'lowercase', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'min:8'],
            'kelas_id' => ['nullable', 'integer', Rule::exists('kelas', 'id')],
            'no_wa_wali' => ['nullable', 'string', 'max:30'],
            ...$this->programRules($request),
            ...StudentIdentity::rules(),
        ], [
            'nisn.required' => 'NISN wajib diisi.',
            'nisn.unique' => 'NISN sudah digunakan.',
            'nama_lengkap.required' => 'Nama lengkap wajib diisi.',
            'nik.required' => 'NIK wajib diisi.',
            'nik.digits' => 'NIK harus terdiri dari 16 digit.',
            'nik.unique' => 'NIK sudah digunakan.',
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
                'email' => $validated['email'] ?? null,
                'nik' => $validated['nik'],
                'password' => $validated['password'],
                'role' => 'siswa',
            ]);
            if (($validated['email'] ?? null) !== null) {
                $user->forceFill(['email_verified_at' => now()])->save();
            }

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
            'nik' => [
                'nullable',
                'string',
                'digits:16',
                Rule::unique('users', 'nik')->ignore($siswa->user),
            ],
            'nisn' => ['required', 'string', 'max:255', Rule::unique('siswas', 'nisn')->ignore($siswa)],
            'nama_lengkap' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'string', 'lowercase', 'email', 'max:255', Rule::unique('users', 'email')->ignore($siswa->user)],
            'password' => ['nullable', 'string', 'min:8'],
            'kelas_id' => ['nullable', 'integer', Rule::exists('kelas', 'id')],
            'no_wa_wali' => ['nullable', 'string', 'max:30'],
            ...$this->programRules($request),
            ...StudentIdentity::rules($siswa),
        ], [
            'nisn.required' => 'NISN wajib diisi.',
            'nisn.unique' => 'NISN sudah digunakan.',
            'nama_lengkap.required' => 'Nama lengkap wajib diisi.',
            'nik.digits' => 'NIK harus terdiri dari 16 digit.',
            'nik.unique' => 'NIK sudah digunakan.',
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
            ];

            if (array_key_exists('email', $validated)) {
                $userData['email'] = $validated['email'];

                if ($siswa->user->email !== $validated['email']) {
                    $userData['email_verified_at'] = null;
                }
            }

            if (! empty($validated['nik'])) {
                $userData['nik'] = $validated['nik'];
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

        $temporaryPassword = Str::password(16);

        $siswa->user->forceFill([
            'password' => Hash::make($temporaryPassword),
            'must_change_password' => true,
        ])->save();

        return to_route('admin.siswa.index')
            ->with('success', 'Kredensial sementara berhasil dibuat.')
            ->with('temporary_password', $temporaryPassword)
            ->with('temporary_password_student', $siswa->id);
    }

    private function normalizeStudentImportDate(mixed $value): mixed
    {
        if (! is_string($value)) {
            return $value;
        }

        $value = trim($value);

        if (! preg_match('/^(\d{1,2})\s+(\p{L}+)\s+(\d{4})$/u', $value, $matches)) {
            return $value;
        }

        $day = (int) $matches[1];
        $month = self::INDONESIAN_MONTH_NUMBERS[mb_strtolower($matches[2])] ?? null;
        $year = (int) $matches[3];

        if ($month === null || ! checkdate($month, $day, $year)) {
            return $value;
        }

        return sprintf('%04d-%02d-%02d', $year, $month, $day);
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
