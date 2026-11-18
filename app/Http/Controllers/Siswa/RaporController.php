<?php

namespace App\Http\Controllers\Siswa;

use App\Http\Controllers\Controller;
use App\Models\CatatanRapor;
use App\Models\Nilai;
use App\Models\PengaturanSekolah;
use App\Models\TahunAjaran;
use App\Support\StudentReportData;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class RaporController extends Controller
{
    public function index(Request $request): Response
    {
        $siswa = $request->user()->siswa;
        abort_unless($siswa, 404);
        $siswa->loadMissing([
            'kelas.waliKelas',
            'kategoriBeasiswa',
            'programKeahlian',
            'konsentrasiKeahlian',
        ]);

        $settings = PengaturanSekolah::query()->find(1);
        $statusRilisRapor = $settings?->status_rilis_rapor ?? 'otomatis';
        $tanggalRilisRapor = $settings?->tanggal_rapor?->toDateString();
        $isReportReleased = $this->isReportReleased($statusRilisRapor, $settings);
        $sharedProps = [
            'siswa' => [
                ...StudentReportData::identity($siswa),
                'wali_kelas_nama' => $siswa->kelas?->waliKelas?->nama_lengkap,
                'wali_niky' => $siswa->kelas?->waliKelas?->nip,
            ],
            'isReportReleased' => $isReportReleased,
            'tanggalRilisRapor' => $tanggalRilisRapor,
            'statusRilisRapor' => $statusRilisRapor,
            'isCandidate' => $siswa->status_siswa === 'calon_spmb',
        ];

        if (! $isReportReleased) {
            return Inertia::render('Siswa/Rapor/Index', [
                ...$sharedProps,
                'rapor' => [],
                'tahunAjaranOptions' => [],
                'selectedTahunAjaran' => null,
                'selectedSemester' => null,
            ]);
        }

        $nilais = Nilai::query()
            ->where('siswa_id', $siswa->id)
            ->with([
                'tahunAjaran:id,nama_tahun,semester',
                'mataPelajaran:id,kode_mapel,nama_mapel,kelompok_mapel',
            ])
            ->get();
        $catatanRapors = CatatanRapor::query()
            ->where('siswa_id', $siswa->id)
            ->get()
            ->keyBy('tahun_ajaran_id');
        $nilaiByYear = $nilais->groupBy('tahun_ajaran_id');
        $yearIds = $nilais->pluck('tahun_ajaran_id')
            ->concat($catatanRapors->keys())
            ->unique()
            ->values();
        $tahunAjarans = TahunAjaran::query()
            ->whereKey($yearIds)
            ->get(['id', 'nama_tahun', 'semester'])
            ->keyBy('id');
        $availableTerms = $yearIds
            ->map(function (int|string $tahunAjaranId) use ($tahunAjarans): ?array {
                $tahunAjaran = $tahunAjarans->get((int) $tahunAjaranId);

                return $tahunAjaran ? [
                    'tahun_ajaran_id' => $tahunAjaran->id,
                    'tahun_ajaran' => $tahunAjaran->nama_tahun,
                    'semester' => $tahunAjaran->semester,
                ] : null;
            })
            ->filter()
            ->sortByDesc(fn (array $term): string => $term['tahun_ajaran'].' '.($term['semester'] === 'genap' ? '2' : '1'))
            ->values();
        $availableYears = $availableTerms->pluck('tahun_ajaran')->unique()->values();
        $tahunAjaranAktif = TahunAjaran::query()
            ->where('is_aktif', true)
            ->first(['id']);
        $activeTerm = $availableTerms->first(
            fn (array $term): bool => (int) $term['tahun_ajaran_id'] === (int) $tahunAjaranAktif?->id,
        );
        $defaultTerm = $activeTerm ?? $availableTerms->first();
        $filters = $request->validate([
            'tahun_ajaran' => ['sometimes', 'nullable', 'string', Rule::in($availableYears->all())],
            'semester' => ['sometimes', 'nullable', Rule::in(['ganjil', 'genap'])],
        ]);
        $selectedTahunAjaran = $filters['tahun_ajaran']
            ?? $defaultTerm['tahun_ajaran']
            ?? null;
        $selectedSemester = $filters['semester']
            ?? $activeTerm['semester']
            ?? $defaultTerm['semester']
            ?? null;

        $allRapor = $yearIds
            ->map(function (int|string $tahunAjaranId) use ($catatanRapors, $nilaiByYear, $tahunAjarans): array {
                $tahunAjaranId = (int) $tahunAjaranId;
                $tahunAjaran = $tahunAjarans->get($tahunAjaranId);
                $catatan = $catatanRapors->get($tahunAjaranId);

                return [
                    'tahun_ajaran_id' => $tahunAjaranId,
                    'tahun_ajaran' => $tahunAjaran?->nama_tahun,
                    'semester' => $tahunAjaran?->semester,
                    'mata_pelajaran' => ($nilaiByYear->get($tahunAjaranId, collect()))
                        ->map(fn (Nilai $nilai): array => [
                            'kode_mapel' => $nilai->mataPelajaran?->kode_mapel,
                            'nama_mapel' => $nilai->mataPelajaran?->nama_mapel,
                            'kelompok_mapel' => $nilai->mataPelajaran?->kelompok_mapel,
                            'nilai_akhir' => $nilai->nilai_akhir,
                            'capaian_kompetensi' => $nilai->capaian_kompetensi,
                        ])
                        ->sortBy('nama_mapel')
                        ->values(),
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
                        'sakit' => $catatan?->sakit ?? 0,
                        'izin' => $catatan?->izin ?? 0,
                        'tanpa_keterangan' => $catatan?->tanpa_keterangan ?? 0,
                        'catatan_wali_kelas' => $catatan?->catatan_wali_kelas,
                        'status_kenaikan' => $catatan?->status_kenaikan,
                        'naik_ke_kelas' => $catatan?->naik_ke_kelas,
                    ],
                ];
            })
            ->sortByDesc(fn (array $semester): string => "{$semester['tahun_ajaran']} {$semester['semester']}")
            ->values();
        $rapor = $allRapor
            ->filter(fn (array $semester): bool => $semester['tahun_ajaran'] === $selectedTahunAjaran
                && $semester['semester'] === $selectedSemester)
            ->values();

        return Inertia::render('Siswa/Rapor/Index', [
            ...$sharedProps,
            'rapor' => $rapor,
            'tahunAjaranOptions' => $availableYears,
            'selectedTahunAjaran' => $selectedTahunAjaran,
            'selectedSemester' => $selectedSemester,
        ]);
    }

    private function isReportReleased(string $status, ?PengaturanSekolah $settings): bool
    {
        $releaseDate = $settings?->tanggal_rapor;

        return $status === 'buka'
            || ($status === 'otomatis'
                && $releaseDate !== null
                && now()->toDateString() >= $releaseDate->toDateString());
    }
}
