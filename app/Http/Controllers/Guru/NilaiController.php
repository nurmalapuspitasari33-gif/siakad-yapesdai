<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use App\Models\Jadwal;
use App\Models\Nilai;
use App\Models\NilaiGuru;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\Ujian;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class NilaiController extends Controller
{
    public function index(Request $request): Response
    {
        $guru = $request->user()->guru;
        abort_unless($guru, 404);
        $kelasWalianAktif = $guru->kelasWalianAktif();
        $tahunAjaranAktif = TahunAjaran::query()->where('is_aktif', true)->first();
        $assignments = $this->assignments($guru, $tahunAjaranAktif?->id);
        $filters = $request->validate([
            'kelas_id' => ['nullable', 'integer', Rule::exists('kelas', 'id')],
            'mapel_id' => ['nullable', 'integer', Rule::exists('mata_pelajarans', 'id')],
        ]);
        $selectedKelasId = $filters['kelas_id'] ?? null;
        $selectedMapelId = $filters['mapel_id'] ?? null;

        if ($selectedKelasId && $selectedMapelId && ! $assignments->contains(
            fn (Jadwal $jadwal): bool => (int) $jadwal->kelas_id === (int) $selectedKelasId
                && (int) $jadwal->mapel_id === (int) $selectedMapelId,
        )) {
            throw ValidationException::withMessages([
                'mapel_id' => 'Pilih kelas dan mata pelajaran yang tercantum pada jadwal mengajar Anda.',
            ]);
        }

        $siswas = collect();
        $ujians = collect();

        if ($tahunAjaranAktif && $selectedKelasId && $selectedMapelId) {
            $siswas = Siswa::query()
                ->where('kelas_id', $selectedKelasId)
                ->where('status_siswa', 'aktif')
                ->with([
                    'nilais' => fn ($query) => $query
                        ->where('tahun_ajaran_id', $tahunAjaranAktif->id)
                        ->where('mapel_id', $selectedMapelId),
                    'nilaiGurus' => fn ($query) => $query
                        ->where('tahun_ajaran_id', $tahunAjaranAktif->id)
                        ->where('kelas_id', $selectedKelasId)
                        ->where('mapel_id', $selectedMapelId)
                        ->orderBy('id')
                        ->with('guru:id,nama_lengkap'),
                ])
                ->orderBy('nama_lengkap')
                ->get()
                ->map(function (Siswa $siswa) use ($guru): array {
                    $myScore = $siswa->nilaiGurus->firstWhere('guru_id', $guru->id);
                    $reportScore = $siswa->nilais->first();

                    return [
                        'id' => $siswa->id,
                        'nisn' => $siswa->nisn,
                        'nama_lengkap' => $siswa->nama_lengkap,
                        'nilai' => $myScore ? [
                            'nilai_akhir' => $myScore->nilai_akhir,
                            'capaian_kompetensi' => $myScore->capaian_kompetensi,
                        ] : null,
                        'nilai_rapor' => $reportScore?->nilai_akhir,
                        'kontribusi_guru' => $siswa->nilaiGurus
                            ->map(fn (NilaiGuru $contribution): array => [
                                'guru_id' => $contribution->guru_id,
                                'nama_guru' => $contribution->guru?->nama_lengkap ?? 'Guru',
                                'nilai_akhir' => $contribution->nilai_akhir,
                            ])
                            ->values(),
                    ];
                });
            $ujians = Ujian::query()
                ->where('guru_id', $guru->id)
                ->where('kelas_id', $selectedKelasId)
                ->where('mapel_id', $selectedMapelId)
                ->orderByDesc('waktu_mulai')
                ->get(['id', 'judul_ujian', 'waktu_mulai'])
                ->map(fn (Ujian $ujian): array => [
                    'id' => $ujian->id,
                    'judul_ujian' => $ujian->judul_ujian,
                    'waktu_mulai' => $ujian->waktu_mulai?->format('Y-m-d H:i'),
                ]);
        }

        return Inertia::render('Guru/Nilai/Index', [
            'kelasOptions' => $assignments->pluck('kelas')->unique('id')->values(),
            'mapelOptions' => $assignments->pluck('mataPelajaran')->unique('id')->values(),
            'assignments' => $assignments->map(fn (Jadwal $jadwal): array => [
                'kelas_id' => $jadwal->kelas_id,
                'mapel_id' => $jadwal->mapel_id,
            ]),
            'siswas' => $siswas,
            'ujians' => $ujians,
            'isWaliKelas' => $kelasWalianAktif->isNotEmpty(),
            'waliKelasName' => $kelasWalianAktif->pluck('nama_kelas')->implode(', '),
            'filters' => [
                'kelas_id' => (string) ($selectedKelasId ?? ''),
                'mapel_id' => (string) ($selectedMapelId ?? ''),
            ],
            'tahunAjaranAktif' => $tahunAjaranAktif
                ? "{$tahunAjaranAktif->nama_tahun} · {$tahunAjaranAktif->semester}"
                : null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $guru = $request->user()->guru;
        abort_unless($guru, 404);

        $validated = $request->validate([
            'kelas_id' => ['required', 'integer', Rule::exists('kelas', 'id')],
            'mapel_id' => ['required', 'integer', Rule::exists('mata_pelajarans', 'id')],
            'nilai' => ['required', 'array', 'min:1'],
            'nilai.*.siswa_id' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('siswas', 'id')
                    ->where('kelas_id', $request->input('kelas_id'))
                    ->where('status_siswa', 'aktif'),
            ],
            'nilai.*.nilai_akhir' => ['required', 'integer', 'between:0,100'],
            'nilai.*.capaian_kompetensi' => ['nullable', 'string', 'max:5000'],
        ], [
            'kelas_id.required' => 'Kelas wajib dipilih.',
            'mapel_id.required' => 'Mata pelajaran wajib dipilih.',
            'nilai.*.siswa_id.exists' => 'Daftar siswa berubah. Muat ulang halaman sebelum menyimpan nilai.',
            'nilai.*.nilai_akhir.required' => 'Nilai akhir wajib diisi.',
            'nilai.*.nilai_akhir.integer' => 'Nilai akhir harus berupa bilangan bulat tanpa desimal.',
            'nilai.*.nilai_akhir.between' => 'Nilai akhir harus berada pada rentang 0 sampai 100.',
        ]);

        $tahunAjaranAktif = TahunAjaran::query()->where('is_aktif', true)->first();
        $isAssigned = $tahunAjaranAktif && Jadwal::query()
            ->where('tahun_ajaran_id', $tahunAjaranAktif->id)
            ->where('guru_id', $guru->id)
            ->where('kelas_id', $validated['kelas_id'])
            ->where('mapel_id', $validated['mapel_id'])
            ->exists();

        if (! $isAssigned) {
            throw ValidationException::withMessages([
                'kelas_id' => 'Anda hanya dapat menginput nilai untuk kelas dan mata pelajaran yang Anda ampu.',
            ]);
        }

        $now = now();
        $rows = collect($validated['nilai'])->map(fn (array $row): array => [
            'tahun_ajaran_id' => $tahunAjaranAktif->id,
            'siswa_id' => $row['siswa_id'],
            'kelas_id' => $validated['kelas_id'],
            'mapel_id' => $validated['mapel_id'],
            'guru_id' => $guru->id,
            'nilai_akhir' => $row['nilai_akhir'],
            'capaian_kompetensi' => $row['capaian_kompetensi'] ?? null,
            'created_at' => $now,
            'updated_at' => $now,
        ])->all();

        DB::transaction(function () use ($rows, $tahunAjaranAktif, $validated): void {
            NilaiGuru::query()->upsert(
                $rows,
                ['tahun_ajaran_id', 'siswa_id', 'kelas_id', 'mapel_id', 'guru_id'],
                ['nilai_akhir', 'capaian_kompetensi', 'updated_at'],
            );
            $this->syncFinalScores(
                $tahunAjaranAktif->id,
                $validated['kelas_id'],
                $validated['mapel_id'],
                collect($rows)->pluck('siswa_id')->all(),
            );
        });

        return to_route('guru.nilai.index', [
            'kelas_id' => $validated['kelas_id'],
            'mapel_id' => $validated['mapel_id'],
        ])->with('success', 'Nilai siswa berhasil disimpan.');
    }

    public function importExamResults(Request $request): RedirectResponse
    {
        $guru = $request->user()->guru;
        abort_unless($guru, 404);

        $validated = $request->validate([
            'kelas_id' => ['required', 'integer', Rule::exists('kelas', 'id')],
            'mapel_id' => ['required', 'integer', Rule::exists('mata_pelajarans', 'id')],
            'ujian_id' => ['required', 'integer', Rule::exists('ujians', 'id')],
            'siswa_ids' => ['nullable', 'array'],
            'siswa_ids.*' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('siswas', 'id')
                    ->where('kelas_id', $request->input('kelas_id'))
                    ->where('status_siswa', 'aktif'),
            ],
        ]);

        $tahunAjaranAktif = TahunAjaran::query()->where('is_aktif', true)->first();
        $isAssigned = $tahunAjaranAktif && Jadwal::query()
            ->where('tahun_ajaran_id', $tahunAjaranAktif->id)
            ->where('guru_id', $guru->id)
            ->where('kelas_id', $validated['kelas_id'])
            ->where('mapel_id', $validated['mapel_id'])
            ->exists();

        if (! $isAssigned) {
            throw ValidationException::withMessages([
                'kelas_id' => 'Anda hanya dapat menarik nilai untuk kelas dan mata pelajaran yang Anda ampu.',
            ]);
        }

        $ujian = Ujian::query()
            ->whereKey($validated['ujian_id'])
            ->where('guru_id', $guru->id)
            ->where('kelas_id', $validated['kelas_id'])
            ->where('mapel_id', $validated['mapel_id'])
            ->first();

        abort_unless($ujian, 404);

        $hasilUjians = $ujian->hasilUjians()
            ->where('status_pengerjaan', 'selesai')
            ->whereNotNull('skor_akhir')
            ->whereBetween('skor_akhir', [0, 100])
            ->whereHas('siswa', fn ($query) => $query
                ->where('kelas_id', $validated['kelas_id'])
                ->where('status_siswa', 'aktif'))
            ->get(['siswa_id', 'skor_akhir']);

        $selectedStudentIds = collect($validated['siswa_ids'] ?? [])
            ->map(fn ($id): int => (int) $id);
        $existingTeacherScores = NilaiGuru::query()
            ->where('tahun_ajaran_id', $tahunAjaranAktif->id)
            ->where('kelas_id', $validated['kelas_id'])
            ->where('mapel_id', $validated['mapel_id'])
            ->where('guru_id', $guru->id)
            ->whereIn('siswa_id', $hasilUjians->pluck('siswa_id'))
            ->get(['siswa_id', 'nilai_akhir'])
            ->keyBy('siswa_id');
        $existingReportScores = Nilai::query()
            ->where('tahun_ajaran_id', $tahunAjaranAktif->id)
            ->where('mapel_id', $validated['mapel_id'])
            ->whereIn('siswa_id', $hasilUjians->pluck('siswa_id'))
            ->get(['siswa_id', 'nilai_akhir'])
            ->keyBy('siswa_id');
        $assignedTeacherCount = Jadwal::query()
            ->where('tahun_ajaran_id', $tahunAjaranAktif->id)
            ->where('kelas_id', $validated['kelas_id'])
            ->where('mapel_id', $validated['mapel_id'])
            ->distinct()
            ->pluck('guru_id')
            ->count();
        $now = now();
        $rows = $hasilUjians
            ->filter(function ($hasil) use (
                $selectedStudentIds,
                $existingTeacherScores,
                $existingReportScores,
                $assignedTeacherCount,
            ): bool {
                if ($selectedStudentIds->isNotEmpty()) {
                    return $selectedStudentIds->contains((int) $hasil->siswa_id);
                }

                if ($existingTeacherScores->has($hasil->siswa_id)) {
                    return false;
                }

                return $assignedTeacherCount > 1
                    || ! $existingReportScores->has($hasil->siswa_id)
                    || $existingReportScores->get($hasil->siswa_id)->nilai_akhir === null;
            })
            ->map(fn ($hasil): array => [
                'tahun_ajaran_id' => $tahunAjaranAktif->id,
                'siswa_id' => $hasil->siswa_id,
                'kelas_id' => $validated['kelas_id'],
                'mapel_id' => $validated['mapel_id'],
                'guru_id' => $guru->id,
                'nilai_akhir' => round((float) $hasil->skor_akhir),
                'capaian_kompetensi' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ])
            ->values()
            ->all();

        if ($rows === []) {
            throw ValidationException::withMessages([
                'ujian_id' => 'Tidak ada hasil CBT selesai yang dapat diimpor untuk pilihan ini.',
            ]);
        }

        DB::transaction(function () use ($rows, $tahunAjaranAktif, $validated): void {
            NilaiGuru::query()->upsert(
                $rows,
                ['tahun_ajaran_id', 'siswa_id', 'kelas_id', 'mapel_id', 'guru_id'],
                ['nilai_akhir', 'updated_at'],
            );
            $this->syncFinalScores(
                $tahunAjaranAktif->id,
                $validated['kelas_id'],
                $validated['mapel_id'],
                collect($rows)->pluck('siswa_id')->all(),
            );
        });

        return to_route('guru.nilai.index', [
            'kelas_id' => $validated['kelas_id'],
            'mapel_id' => $validated['mapel_id'],
        ])->with('success', count($rows).' nilai CBT berhasil ditarik.');
    }

    /**
     * @return Collection<int, Jadwal>
     */
    private function assignments(Guru $guru, ?int $tahunAjaranId): Collection
    {
        if (! $tahunAjaranId) {
            return new Collection;
        }

        return Jadwal::query()
            ->where('tahun_ajaran_id', $tahunAjaranId)
            ->where('guru_id', $guru->id)
            ->with(['kelas:id,nama_kelas', 'mataPelajaran:id,kode_mapel,nama_mapel'])
            ->get()
            ->unique(fn (Jadwal $jadwal): string => "{$jadwal->kelas_id}:{$jadwal->mapel_id}")
            ->values();
    }

    /**
     * @param  array<int, int>  $studentIds
     */
    private function syncFinalScores(int $tahunAjaranId, int $classId, int $subjectId, array $studentIds): void
    {
        $contributionsByStudent = NilaiGuru::query()
            ->where('tahun_ajaran_id', $tahunAjaranId)
            ->where('kelas_id', $classId)
            ->where('mapel_id', $subjectId)
            ->whereIn('siswa_id', $studentIds)
            ->with('guru:id,nama_lengkap')
            ->get()
            ->groupBy('siswa_id');

        foreach ($studentIds as $studentId) {
            $contributions = $contributionsByStudent->get($studentId, collect());

            if ($contributions->isEmpty()) {
                continue;
            }

            $reportScore = Nilai::query()->firstOrNew([
                'tahun_ajaran_id' => $tahunAjaranId,
                'siswa_id' => $studentId,
                'mapel_id' => $subjectId,
            ]);

            if (! $reportScore->exists) {
                $reportScore->nilai_tugas = 0;
                $reportScore->nilai_uts = 0;
                $reportScore->nilai_uas = 0;
            }

            $competencyNotes = $contributions
                ->filter(fn (NilaiGuru $contribution): bool => filled($contribution->capaian_kompetensi))
                ->map(fn (NilaiGuru $contribution): string => ($contribution->guru?->nama_lengkap ?? 'Guru')
                    .': '.$contribution->capaian_kompetensi)
                ->implode("\n");

            $reportScore->fill([
                'nilai_akhir' => round((float) $contributions->avg('nilai_akhir'), 2),
                'capaian_kompetensi' => $competencyNotes !== '' ? $competencyNotes : null,
            ])->save();
        }
    }
}
