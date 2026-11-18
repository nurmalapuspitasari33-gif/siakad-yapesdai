<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Controller;
use App\Models\CatatanRapor;
use App\Models\Ekstrakurikuler;
use App\Models\Jadwal;
use App\Models\PengaturanSekolah;
use App\Models\PresensiKelas;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Support\StudentReportData;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RaporWaliController extends Controller
{
    private const DEFAULT_KOKURIKULER_TEMPLATE = 'Ananda sudah {predikat} dalam keterampilan mengolah barang bekas menjadi pot bunga, namun masih perlu berlatih meningkatkan ketelitian pada tahap finishing. {predikat} dalam mengidentifikasi potensi limbah, menumbuhkan kepedulian lingkungan, namun masih perlu berlatih mengembangkan ide inovatif untuk meningkatkan nilai jual produk.';

    public function index(Request $request): Response
    {
        $guru = $request->user()->guru;
        abort_unless($guru, 403);
        $tahunAjaranAktif = TahunAjaran::query()->where('is_aktif', true)->first();
        $kelasOptions = $guru->kelasWalianAktif();
        abort_unless($kelasOptions->isNotEmpty(), 403);

        $filters = $request->validate([
            'kelas_id' => ['nullable', 'integer', Rule::exists('kelas', 'id')],
        ]);
        $selectedKelasId = $filters['kelas_id'] ?? $kelasOptions->first()?->id;

        if ($selectedKelasId && ! $kelasOptions->contains('id', (int) $selectedKelasId)) {
            abort(404);
        }

        $kelas = $selectedKelasId
            ? $kelasOptions->firstWhere('id', (int) $selectedKelasId)
            : null;
        $jadwals = $selectedKelasId && $tahunAjaranAktif
            ? Jadwal::query()
                ->where('tahun_ajaran_id', $tahunAjaranAktif->id)
                ->where('kelas_id', $selectedKelasId)
                ->with([
                    'mataPelajaran:id,kode_mapel,nama_mapel,kelompok_mapel',
                    'guru:id,nama_lengkap',
                ])
                ->get()
            : collect();
        $mataPelajarans = $jadwals
            ->pluck('mataPelajaran')
            ->filter()
            ->unique('id')
            ->sortBy('nama_mapel')
            ->values()
            ->map(fn ($mapel): array => [
                'id' => $mapel->id,
                'kode_mapel' => $mapel->kode_mapel,
                'nama_mapel' => $mapel->nama_mapel,
                'kelompok_mapel' => $mapel->kelompok_mapel,
                'nama_guru' => $jadwals->firstWhere('mapel_id', $mapel->id)?->guru?->nama_lengkap,
            ]);

        $siswas = $selectedKelasId && $tahunAjaranAktif
            ? Siswa::query()
                ->where('kelas_id', $selectedKelasId)
                ->where('status_siswa', 'aktif')
                ->with([
                    'kelas:id,nama_kelas,fase',
                    'kategoriBeasiswa:id,nama_beasiswa',
                    'programKeahlian:id,nama_jurusan',
                    'konsentrasiKeahlian:id,program_keahlian_id,nama_konsentrasi',
                    'nilais' => fn ($query) => $query
                        ->where('tahun_ajaran_id', $tahunAjaranAktif->id),
                    'catatanRapors' => fn ($query) => $query
                        ->where('tahun_ajaran_id', $tahunAjaranAktif->id),
                ])
                ->orderBy('nama_lengkap')
                ->get()
            : collect();
        $attendanceByStudent = $selectedKelasId && $tahunAjaranAktif
            ? PresensiKelas::query()
                ->where('kelas_id', $selectedKelasId)
                ->whereHas('jadwal', fn ($query) => $query
                    ->where('tahun_ajaran_id', $tahunAjaranAktif->id))
                ->select('siswa_id')
                ->selectRaw("COUNT(DISTINCT CASE WHEN status = 'S' THEN tanggal END) AS sakit")
                ->selectRaw("COUNT(DISTINCT CASE WHEN status = 'I' THEN tanggal END) AS izin")
                ->selectRaw("COUNT(DISTINCT CASE WHEN status = 'A' THEN tanggal END) AS tanpa_keterangan")
                ->groupBy('siswa_id')
                ->get()
                ->keyBy('siswa_id')
            : collect();

        $students = $siswas->map(function (Siswa $siswa) use ($guru, $attendanceByStudent): array {
            $catatan = $siswa->catatanRapors->first();
            $attendance = $attendanceByStudent->get($siswa->id);
            $scores = $siswa->nilais
                ->pluck('nilai_akhir')
                ->filter(fn ($nilai): bool => $nilai !== null)
                ->map(fn ($nilai): float => (float) $nilai);
            $jumlahNilai = round($scores->sum(), 2);

            return [
                ...StudentReportData::identity($siswa),
                'id' => $siswa->id,
                'wali_kelas_nama' => $guru->nama_lengkap,
                'wali_niky' => $guru->nip,
                'nilai' => $siswa->nilais->mapWithKeys(fn ($nilai): array => [
                    $nilai->mapel_id => [
                        'nilai_akhir' => $nilai->nilai_akhir,
                        'capaian_kompetensi' => $nilai->capaian_kompetensi,
                    ],
                ]),
                'has_nilai' => $scores->isNotEmpty(),
                'jumlah_nilai' => $jumlahNilai,
                'rata_rata' => $scores->isNotEmpty()
                    ? round($jumlahNilai / $scores->count(), 2)
                    : null,
                'catatan_rapor' => [
                    'kokurikuler_predikat' => $catatan?->kokurikuler_predikat,
                    'kokurikuler_deskripsi' => $catatan?->kokurikuler_deskripsi,
                    'ekstra_1_nama' => $catatan?->ekstra_1_nama,
                    'ekstra_1_ket' => $catatan?->ekstra_1_ket,
                    'ekstra_2_nama' => $catatan?->ekstra_2_nama,
                    'ekstra_2_ket' => $catatan?->ekstra_2_ket,
                    'ekstra_3_nama' => $catatan?->ekstra_3_nama,
                    'ekstra_3_ket' => $catatan?->ekstra_3_ket,
                    'ekstra_4_nama' => $catatan?->ekstra_4_nama,
                    'ekstra_4_ket' => $catatan?->ekstra_4_ket,
                    'sakit' => $catatan?->presensi_manual_sakit ?? (int) ($attendance?->sakit ?? 0),
                    'izin' => $catatan?->presensi_manual_izin ?? (int) ($attendance?->izin ?? 0),
                    'tanpa_keterangan' => $catatan?->presensi_manual_tanpa_keterangan ?? (int) ($attendance?->tanpa_keterangan ?? 0),
                    'presensi_manual_sakit' => $catatan?->presensi_manual_sakit,
                    'presensi_manual_izin' => $catatan?->presensi_manual_izin,
                    'presensi_manual_tanpa_keterangan' => $catatan?->presensi_manual_tanpa_keterangan,
                    'catatan_wali_kelas' => $catatan?->catatan_wali_kelas,
                    'status_kenaikan' => $catatan?->status_kenaikan,
                    'naik_ke_kelas' => $catatan?->naik_ke_kelas,
                ],
            ];
        });

        $rankings = [];
        $previousScore = null;
        $previousRank = null;
        $rankedStudents = $students
            ->where('has_nilai', true)
            ->sortByDesc('jumlah_nilai')
            ->values();

        foreach ($rankedStudents as $index => $student) {
            if ($previousScore !== $student['jumlah_nilai']) {
                $previousScore = $student['jumlah_nilai'];
                $previousRank = $index + 1;
            }

            $rankings[$student['id']] = $previousRank;
        }

        $students = $students->map(function (array $student) use ($rankings): array {
            $student['ranking'] = $rankings[$student['id']] ?? null;

            return $student;
        });
        $filledScoresBySubject = [];

        foreach ($siswas as $siswa) {
            foreach ($siswa->nilais as $nilai) {
                if ($nilai->nilai_akhir !== null) {
                    $filledScoresBySubject[$nilai->mapel_id] = ($filledScoresBySubject[$nilai->mapel_id] ?? 0) + 1;
                }
            }
        }

        $monitoringNilai = $mataPelajarans->map(function (array $mapel) use ($filledScoresBySubject, $siswas): array {
            $filled = $filledScoresBySubject[$mapel['id']] ?? 0;
            $total = $siswas->count();
            $status = $total > 0 && $filled === $total
                ? 'lengkap'
                : ($filled > 0 ? 'sebagian' : 'belum');

            return [
                ...$mapel,
                'siswa_terisi' => $filled,
                'jumlah_siswa' => $total,
                'status' => $status,
            ];
        });

        return Inertia::render('Guru/RaporWali/Index', [
            'kelasOptions' => $kelasOptions,
            'selectedKelasId' => (string) ($selectedKelasId ?? ''),
            'kelas' => $kelas?->nama_kelas,
            'fase' => $kelas?->fase,
            'namaWaliKelas' => $guru->nama_lengkap,
            'waliNiky' => $guru->nip,
            'waliKelasName' => $kelasOptions->pluck('nama_kelas')->implode(', '),
            'tahunAjaran' => $tahunAjaranAktif ? [
                'id' => $tahunAjaranAktif->id,
                'nama_tahun' => $tahunAjaranAktif->nama_tahun,
                'semester' => $tahunAjaranAktif->semester,
            ] : null,
            'tahunAjaranAktif' => $tahunAjaranAktif
                ? "{$tahunAjaranAktif->nama_tahun} · {$tahunAjaranAktif->semester}"
                : null,
            'templateKokurikuler' => PengaturanSekolah::query()->value('template_kokurikuler')
                ?? self::DEFAULT_KOKURIKULER_TEMPLATE,
            'ekstrakurikulers' => Ekstrakurikuler::query()
                ->where('is_aktif', true)
                ->orderBy('nama_ekstra')
                ->get(['id', 'nama_ekstra']),
            'mataPelajarans' => $mataPelajarans,
            'monitoringNilai' => $monitoringNilai,
            'siswas' => $students,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $guru = $request->user()->guru;
        abort_unless($guru && $guru->kelasWalianAktif()->isNotEmpty(), 403);

        $tahunAjaranAktif = TahunAjaran::query()->where('is_aktif', true)->first();

        if (! $tahunAjaranAktif) {
            throw ValidationException::withMessages([
                'kelas_id' => 'Tahun ajaran aktif belum ditetapkan.',
            ]);
        }

        $semesterGenap = $tahunAjaranAktif->semester === 'genap';
        $validated = $request->validate([
            'kelas_id' => ['required', 'integer', Rule::exists('kelas', 'id')],
            'catatan_rapor' => ['required', 'array', 'min:1'],
            'catatan_rapor.*.siswa_id' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('siswas', 'id')
                    ->where('kelas_id', $request->input('kelas_id'))
                    ->where('status_siswa', 'aktif'),
            ],
            'catatan_rapor.*.kokurikuler_predikat' => [
                'nullable',
                Rule::in(['Amat Baik', 'Baik', 'Cukup', 'Kurang']),
            ],
            'catatan_rapor.*.kokurikuler_deskripsi' => ['nullable', 'string', 'max:5000'],
            'catatan_rapor.*.ekstra_1_nama' => [
                'nullable',
                'string',
                'max:255',
                Rule::exists('ekstrakurikulers', 'nama_ekstra')->where('is_aktif', true),
            ],
            'catatan_rapor.*.ekstra_1_ket' => ['nullable', Rule::in(['Amat Baik', 'Baik', 'Cukup', 'Kurang'])],
            'catatan_rapor.*.ekstra_2_nama' => [
                'nullable',
                'string',
                'max:255',
                Rule::exists('ekstrakurikulers', 'nama_ekstra')->where('is_aktif', true),
            ],
            'catatan_rapor.*.ekstra_2_ket' => ['nullable', Rule::in(['Amat Baik', 'Baik', 'Cukup', 'Kurang'])],
            'catatan_rapor.*.ekstra_3_nama' => [
                'nullable',
                'string',
                'max:255',
                Rule::exists('ekstrakurikulers', 'nama_ekstra')->where('is_aktif', true),
            ],
            'catatan_rapor.*.ekstra_3_ket' => ['nullable', Rule::in(['Amat Baik', 'Baik', 'Cukup', 'Kurang'])],
            'catatan_rapor.*.ekstra_4_nama' => [
                'nullable',
                'string',
                'max:255',
                Rule::exists('ekstrakurikulers', 'nama_ekstra')->where('is_aktif', true),
            ],
            'catatan_rapor.*.ekstra_4_ket' => ['nullable', Rule::in(['Amat Baik', 'Baik', 'Cukup', 'Kurang'])],
            'catatan_rapor.*.sakit' => ['nullable', 'integer', 'between:0,366'],
            'catatan_rapor.*.izin' => ['nullable', 'integer', 'between:0,366'],
            'catatan_rapor.*.tanpa_keterangan' => ['nullable', 'integer', 'between:0,366'],
            'catatan_rapor.*.presensi_manual_sakit' => ['nullable', 'integer', 'between:0,366'],
            'catatan_rapor.*.presensi_manual_izin' => ['nullable', 'integer', 'between:0,366'],
            'catatan_rapor.*.presensi_manual_tanpa_keterangan' => ['nullable', 'integer', 'between:0,366'],
            'catatan_rapor.*.catatan_wali_kelas' => ['nullable', 'string', 'max:5000'],
            'catatan_rapor.*.status_kenaikan' => $semesterGenap
                ? ['nullable', Rule::in(['naik', 'tidak_naik'])]
                : ['prohibited'],
            'catatan_rapor.*.naik_ke_kelas' => $semesterGenap
                ? ['nullable', 'string', 'max:255', 'required_if:catatan_rapor.*.status_kenaikan,naik']
                : ['prohibited'],
        ], [
            'catatan_rapor.*.siswa_id.exists' => 'Daftar siswa berubah. Muat ulang halaman sebelum menyimpan rapor.',
            'catatan_rapor.*.kokurikuler_predikat.in' => 'Pilih predikat kokurikuler yang tersedia.',
            'catatan_rapor.*.ekstra_1_nama.exists' => 'Pilih ekstrakurikuler aktif yang tersedia.',
            'catatan_rapor.*.ekstra_2_nama.exists' => 'Pilih ekstrakurikuler aktif yang tersedia.',
            'catatan_rapor.*.ekstra_3_nama.exists' => 'Pilih ekstrakurikuler aktif yang tersedia.',
            'catatan_rapor.*.ekstra_4_nama.exists' => 'Pilih ekstrakurikuler aktif yang tersedia.',
            'catatan_rapor.*.ekstra_1_ket.in' => 'Pilih predikat ekstrakurikuler yang tersedia.',
            'catatan_rapor.*.ekstra_2_ket.in' => 'Pilih predikat ekstrakurikuler yang tersedia.',
            'catatan_rapor.*.ekstra_3_ket.in' => 'Pilih predikat ekstrakurikuler yang tersedia.',
            'catatan_rapor.*.ekstra_4_ket.in' => 'Pilih predikat ekstrakurikuler yang tersedia.',
            'catatan_rapor.*.naik_ke_kelas.required_if' => 'Kelas tujuan wajib diisi jika siswa dinyatakan naik.',
            'catatan_rapor.*.status_kenaikan.prohibited' => 'Kenaikan kelas hanya dapat diisi pada semester genap.',
            'catatan_rapor.*.naik_ke_kelas.prohibited' => 'Kenaikan kelas hanya dapat diisi pada semester genap.',
        ]);

        $isAssignedClass = $guru->kelasWalian()
            ->where('tahun_ajaran_id', $tahunAjaranAktif->id)
            ->whereKey($validated['kelas_id'])
            ->exists();

        if (! $isAssignedClass) {
            abort(404);
        }

        $template = PengaturanSekolah::query()->value('template_kokurikuler')
            ?? self::DEFAULT_KOKURIKULER_TEMPLATE;
        $now = now();
        $rows = collect($validated['catatan_rapor'])->map(function (array $row) use (
            $semesterGenap,
            $tahunAjaranAktif,
            $template,
            $now,
        ): array {
            $deskripsi = $row['kokurikuler_deskripsi'] ?? null;

            if (($deskripsi === null || trim($deskripsi) === '') && $row['kokurikuler_predikat']) {
                $deskripsi = str_replace('{predikat}', $row['kokurikuler_predikat'], $template);
            }

            $attributes = [
                'tahun_ajaran_id' => $tahunAjaranAktif->id,
                'siswa_id' => $row['siswa_id'],
                'kokurikuler_predikat' => $row['kokurikuler_predikat'] ?? null,
                'kokurikuler_deskripsi' => $deskripsi,
                'ekstra_1_nama' => $row['ekstra_1_nama'] ?? null,
                'ekstra_1_ket' => $row['ekstra_1_ket'] ?? null,
                'ekstra_2_nama' => $row['ekstra_2_nama'] ?? null,
                'ekstra_2_ket' => $row['ekstra_2_ket'] ?? null,
                'ekstra_3_nama' => $row['ekstra_3_nama'] ?? null,
                'ekstra_3_ket' => $row['ekstra_3_ket'] ?? null,
                'ekstra_4_nama' => $row['ekstra_4_nama'] ?? null,
                'ekstra_4_ket' => $row['ekstra_4_ket'] ?? null,
                'sakit' => $row['sakit'] ?? 0,
                'izin' => $row['izin'] ?? 0,
                'tanpa_keterangan' => $row['tanpa_keterangan'] ?? 0,
                'presensi_manual_sakit' => $row['presensi_manual_sakit'] ?? null,
                'presensi_manual_izin' => $row['presensi_manual_izin'] ?? null,
                'presensi_manual_tanpa_keterangan' => $row['presensi_manual_tanpa_keterangan'] ?? null,
                'catatan_wali_kelas' => $row['catatan_wali_kelas'] ?? null,
                'created_at' => $now,
                'updated_at' => $now,
            ];

            if ($semesterGenap) {
                $attributes['status_kenaikan'] = $row['status_kenaikan'] ?? null;
                $attributes['naik_ke_kelas'] = $row['naik_ke_kelas'] ?? null;
            }

            return $attributes;
        })->all();

        DB::transaction(function () use ($rows, $semesterGenap): void {
            $updates = [
                'kokurikuler_predikat',
                'kokurikuler_deskripsi',
                'ekstra_1_nama',
                'ekstra_1_ket',
                'ekstra_2_nama',
                'ekstra_2_ket',
                'ekstra_3_nama',
                'ekstra_3_ket',
                'ekstra_4_nama',
                'ekstra_4_ket',
                'sakit',
                'izin',
                'tanpa_keterangan',
                'presensi_manual_sakit',
                'presensi_manual_izin',
                'presensi_manual_tanpa_keterangan',
                'catatan_wali_kelas',
                'updated_at',
            ];

            if ($semesterGenap) {
                $updates[] = 'status_kenaikan';
                $updates[] = 'naik_ke_kelas';
            }

            CatatanRapor::query()->upsert(
                $rows,
                ['tahun_ajaran_id', 'siswa_id'],
                $updates,
            );
        });

        return to_route('guru.rapor-wali.index', [
            'kelas_id' => $validated['kelas_id'],
        ])->with('success', 'Catatan rapor siswa berhasil disimpan.');
    }
}
