<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use App\Models\Jadwal;
use App\Models\Nilai;
use App\Models\Siswa;
use App\Models\TahunAjaran;
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

        if ($tahunAjaranAktif && $selectedKelasId && $selectedMapelId) {
            $siswas = Siswa::query()
                ->where('kelas_id', $selectedKelasId)
                ->where('status_siswa', 'aktif')
                ->with([
                    'nilais' => fn ($query) => $query
                        ->where('tahun_ajaran_id', $tahunAjaranAktif->id)
                        ->where('mapel_id', $selectedMapelId),
                ])
                ->orderBy('nama_lengkap')
                ->get()
                ->map(fn (Siswa $siswa): array => [
                    'id' => $siswa->id,
                    'nisn' => $siswa->nisn,
                    'nama_lengkap' => $siswa->nama_lengkap,
                    'nilai' => $siswa->nilais->first() ? [
                        'nilai_akhir' => $siswa->nilais->first()->nilai_akhir,
                        'capaian_kompetensi' => $siswa->nilais->first()->capaian_kompetensi,
                    ] : null,
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
            'isWaliKelas' => $guru->is_wali_kelas,
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
            'nilai.*.nilai_akhir' => ['required', 'numeric', 'between:0,100'],
            'nilai.*.capaian_kompetensi' => ['nullable', 'string', 'max:5000'],
        ], [
            'kelas_id.required' => 'Kelas wajib dipilih.',
            'mapel_id.required' => 'Mata pelajaran wajib dipilih.',
            'nilai.*.siswa_id.exists' => 'Daftar siswa berubah. Muat ulang halaman sebelum menyimpan nilai.',
            'nilai.*.nilai_akhir.required' => 'Nilai akhir wajib diisi.',
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
            'mapel_id' => $validated['mapel_id'],
            'nilai_akhir' => $row['nilai_akhir'],
            'capaian_kompetensi' => $row['capaian_kompetensi'] ?? null,
            'created_at' => $now,
            'updated_at' => $now,
        ])->all();

        DB::transaction(function () use ($rows): void {
            Nilai::query()->upsert(
                $rows,
                ['tahun_ajaran_id', 'siswa_id', 'mapel_id'],
                ['nilai_akhir', 'capaian_kompetensi', 'updated_at'],
            );
        });

        return to_route('guru.nilai.index', [
            'kelas_id' => $validated['kelas_id'],
            'mapel_id' => $validated['mapel_id'],
        ])->with('success', 'Nilai siswa berhasil disimpan.');
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
}
