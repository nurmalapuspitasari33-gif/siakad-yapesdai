<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use App\Models\Jadwal;
use App\Models\Kelas;
use App\Models\TahunAjaran;
use App\Models\TugasMengajar;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class JadwalController extends Controller
{
    private const HARI = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];

    private const HARI_GENERATE = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];

    private const JAM_KE_MULAI = [
        '07:00',
        '07:40',
        '08:20',
        '09:00',
        '10:00',
        '10:40',
        '11:20',
        '12:30',
        '13:10',
    ];

    private const MAKSIMAL_JP_PER_SESI = 3;

    private const WAKTU_ISTIRAHAT = [
        ['mulai' => '09:40', 'selesai' => '10:00'],
        ['mulai' => '12:00', 'selesai' => '12:30'],
    ];

    public function index(Request $request): Response
    {
        $tahunAjaranAktif = TahunAjaran::query()->where('is_aktif', true)->first();
        $filters = $request->validate([
            'kelas_id' => ['nullable', 'integer', Rule::exists('kelas', 'id')],
            'hari' => ['nullable', Rule::in(self::HARI)],
        ]);

        $jadwals = Jadwal::query()
            ->when($tahunAjaranAktif, fn ($query) => $query->where('tahun_ajaran_id', $tahunAjaranAktif->id))
            ->when(! $tahunAjaranAktif, fn ($query) => $query->whereRaw('1 = 0'))
            ->when($filters['kelas_id'] ?? null, fn ($query, $kelasId) => $query->where('kelas_id', $kelasId))
            ->when($filters['hari'] ?? null, fn ($query, $hari) => $query->where('hari', $hari))
            ->with([
                'kelas:id,nama_kelas',
                'mataPelajaran:id,nama_mapel',
                'guru:id,nama_lengkap',
                'tugasMengajar:id,jp_per_minggu',
            ])
            ->orderByRaw("CASE hari WHEN 'senin' THEN 1 WHEN 'selasa' THEN 2 WHEN 'rabu' THEN 3 WHEN 'kamis' THEN 4 WHEN 'jumat' THEN 5 WHEN 'sabtu' THEN 6 ELSE 7 END")
            ->orderBy('jam_mulai')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Admin/Jadwal/Index', [
            'jadwals' => $jadwals,
            'kelasOptions' => $tahunAjaranAktif
                ? $tahunAjaranAktif->kelas()->orderBy('nama_kelas')->get(['id', 'nama_kelas'])
                : [],
            'tugasMengajarOptions' => $tahunAjaranAktif
                ? TugasMengajar::query()
                    ->where('tahun_ajaran_id', $tahunAjaranAktif->id)
                    ->with([
                        'kelas:id,nama_kelas',
                        'mataPelajaran:id,kode_mapel,nama_mapel',
                        'guru:id,nama_lengkap',
                    ])
                    ->withSum('jadwals', 'jumlah_jp')
                    ->orderBy('kelas_id')
                    ->orderBy('mapel_id')
                    ->get()
                    ->map(fn (TugasMengajar $tugasMengajar): array => [
                        'id' => $tugasMengajar->id,
                        'kelas' => $tugasMengajar->kelas,
                        'mata_pelajaran' => $tugasMengajar->mataPelajaran,
                        'guru' => $tugasMengajar->guru,
                        'jp_per_minggu' => $tugasMengajar->jp_per_minggu,
                        'jp_terjadwal' => (int) ($tugasMengajar->jadwals_sum_jumlah_jp ?? 0),
                    ])
                : [],
            'jamKeOptions' => array_map(
                fn (int $index, string $jamMulai): array => [
                    'jam_ke' => $index + 1,
                    'jam_mulai' => $jamMulai,
                ],
                array_keys(self::JAM_KE_MULAI),
                self::JAM_KE_MULAI,
            ),
            'canGenerateSchedule' => $tahunAjaranAktif
                && TugasMengajar::query()->where('tahun_ajaran_id', $tahunAjaranAktif->id)->exists()
                && ! Jadwal::query()->where('tahun_ajaran_id', $tahunAjaranAktif->id)->exists(),
            'hasExistingSchedules' => $tahunAjaranAktif
                && Jadwal::query()->where('tahun_ajaran_id', $tahunAjaranAktif->id)->exists(),
            'tahunAjaranAktif' => $tahunAjaranAktif
                ? [
                    'id' => $tahunAjaranAktif->id,
                    'nama_tahun' => $tahunAjaranAktif->nama_tahun,
                    'semester' => $tahunAjaranAktif->semester,
                ]
                : null,
            'filters' => [
                'kelas_id' => (string) ($filters['kelas_id'] ?? ''),
                'hari' => $filters['hari'] ?? '',
            ],
        ]);
    }

    public function generate(): RedirectResponse
    {
        $tahunAjaranId = TahunAjaran::query()->where('is_aktif', true)->value('id');

        if (! $tahunAjaranId) {
            return back()->with('error', 'Aktifkan tahun ajaran sebelum membuat jadwal otomatis.');
        }

        $result = DB::transaction(function () use ($tahunAjaranId): array {
            $tahunAjaran = TahunAjaran::query()
                ->whereKey($tahunAjaranId)
                ->lockForUpdate()
                ->first();

            if (! $tahunAjaran || ! $tahunAjaran->is_aktif) {
                return ['status' => 'no_active_year'];
            }

            $tugasMengajars = TugasMengajar::query()
                ->where('tahun_ajaran_id', $tahunAjaran->id)
                ->with([
                    'guru:id,nama_lengkap',
                    'kelas:id,nama_kelas',
                    'mataPelajaran:id,nama_mapel',
                ])
                ->orderBy('id')
                ->lockForUpdate()
                ->get();

            if ($tugasMengajars->isEmpty()) {
                return ['status' => 'no_assignments'];
            }

            if (Jadwal::query()->where('tahun_ajaran_id', $tahunAjaran->id)->exists()) {
                return ['status' => 'existing_schedules'];
            }

            $plan = $this->buildSchedulePlan($tugasMengajars);

            if ($plan['belum_terjadwal'] !== []) {
                return [
                    'status' => 'insufficient_slots',
                    'details' => collect($plan['belum_terjadwal'])
                        ->map(fn (array $item): string => sprintf(
                            '%s / %s / %s: %d JP',
                            $item['guru'],
                            $item['kelas'],
                            $item['mata_pelajaran'],
                            $item['jumlah_jp'],
                        ))
                        ->implode('; '),
                ];
            }

            foreach ($plan['jadwals'] as $jadwal) {
                Jadwal::create([
                    ...$jadwal,
                    'tahun_ajaran_id' => $tahunAjaran->id,
                ]);
            }

            return [
                'status' => 'generated',
                'jumlah_sesi' => count($plan['jadwals']),
                'jumlah_jp' => $tugasMengajars->sum('jp_per_minggu'),
            ];
        });

        if ($result['status'] === 'existing_schedules') {
            return back()->with('error', 'Jadwal tahun ajaran aktif sudah berisi data. Generator hanya berjalan pada jadwal yang masih kosong; data lama tidak diubah.');
        }

        if ($result['status'] === 'no_assignments') {
            return back()->with('error', 'Tambahkan pembagian tugas mengajar sebelum membuat jadwal otomatis.');
        }

        if ($result['status'] === 'insufficient_slots') {
            return back()->with('error', 'Jadwal otomatis tidak dapat menempatkan semua JP tanpa bentrok. Belum tersusun: '.$result['details'].'. Tidak ada jadwal yang disimpan.');
        }

        if ($result['status'] === 'no_active_year') {
            return back()->with('error', 'Tahun ajaran aktif berubah. Muat ulang halaman lalu coba kembali.');
        }

        return to_route('admin.jadwal.index')->with(
            'success',
            sprintf(
                'Jadwal otomatis berhasil dibuat: %d JP dalam %d sesi.',
                $result['jumlah_jp'],
                $result['jumlah_sesi'],
            ),
        );
    }

    public function store(Request $request): RedirectResponse
    {
        $tahunAjaranAktif = TahunAjaran::query()->where('is_aktif', true)->first();

        if (! $tahunAjaranAktif) {
            return back()->with('error', 'Aktifkan tahun ajaran sebelum menambahkan jadwal.');
        }

        $validated = $this->validatedSchedule($request, $tahunAjaranAktif);

        DB::transaction(function () use ($validated, $tahunAjaranAktif): void {
            $tugasMengajar = $this->lockTugasMengajar($validated, $tahunAjaranAktif);
            Kelas::query()->whereKey($tugasMengajar->kelas_id)->lockForUpdate()->firstOrFail();
            Guru::query()->whereKey($tugasMengajar->guru_id)->lockForUpdate()->firstOrFail();
            $validated = $this->applyTugasMengajar($validated, $tugasMengajar);
            $this->ensureWithinWeeklyTarget($validated, $tugasMengajar);
            $this->ensureNoConflict($validated, $tahunAjaranAktif->id);

            Jadwal::create([
                ...$validated,
                'tahun_ajaran_id' => $tahunAjaranAktif->id,
            ]);
        });

        return to_route('admin.jadwal.index')->with('success', 'Jadwal berhasil ditambahkan.');
    }

    public function update(Request $request, Jadwal $jadwal): RedirectResponse
    {
        $tahunAjaranAktif = TahunAjaran::query()->where('is_aktif', true)->first();
        abort_unless(
            $tahunAjaranAktif && (int) $jadwal->tahun_ajaran_id === (int) $tahunAjaranAktif->id,
            404,
        );

        $validated = $this->validatedSchedule($request, $tahunAjaranAktif, $jadwal);

        DB::transaction(function () use ($validated, $tahunAjaranAktif, $jadwal): void {
            $tugasMengajar = $this->lockTugasMengajar($validated, $tahunAjaranAktif);
            Kelas::query()->whereKey($tugasMengajar->kelas_id)->lockForUpdate()->firstOrFail();
            Guru::query()->whereKey($tugasMengajar->guru_id)->lockForUpdate()->firstOrFail();
            $validated = $this->applyTugasMengajar($validated, $tugasMengajar);
            $this->ensureWithinWeeklyTarget($validated, $tugasMengajar, $jadwal);
            $this->ensureNoConflict($validated, $tahunAjaranAktif->id, $jadwal);

            $jadwal->update($validated);
        });

        return to_route('admin.jadwal.index')->with('success', 'Jadwal berhasil diperbarui.');
    }

    public function destroy(Jadwal $jadwal): RedirectResponse
    {
        $tahunAjaranAktif = TahunAjaran::query()->where('is_aktif', true)->first();
        abort_unless(
            $tahunAjaranAktif && (int) $jadwal->tahun_ajaran_id === (int) $tahunAjaranAktif->id,
            404,
        );
        $jadwal->delete();

        return to_route('admin.jadwal.index')->with('success', 'Jadwal berhasil dihapus.');
    }

    /**
     * @param  Collection<int, TugasMengajar>  $tugasMengajars
     * @return array{
     *     jadwals: array<int, array{
     *         tugas_mengajar_id: int,
     *         kelas_id: int,
     *         mapel_id: int,
     *         guru_id: int,
     *         jumlah_jp: int,
     *         ruang: null,
     *         hari: string,
     *         jam_mulai: string,
     *         jam_selesai: string
     *     }>,
     *     belum_terjadwal: array<int, array{
     *         guru: string,
     *         kelas: string,
     *         mata_pelajaran: string,
     *         jumlah_jp: int
     *     }>
     * }
     */
    private function buildSchedulePlan(Collection $tugasMengajars): array
    {
        $occupied = ['guru' => [], 'kelas' => []];
        $dailyLoads = ['guru' => [], 'kelas' => []];
        $jadwals = [];
        $belumTerjadwal = [];

        foreach ($tugasMengajars->sortByDesc('jp_per_minggu')->values() as $tugasMengajar) {
            $sisaJp = (int) $tugasMengajar->jp_per_minggu;

            while ($sisaJp > 0) {
                $maksimalBlok = min(self::MAKSIMAL_JP_PER_SESI, $sisaJp);
                $penempatan = null;

                for ($jumlahJp = $maksimalBlok; $jumlahJp >= 1; $jumlahJp--) {
                    $penempatan = $this->findAvailableBlock(
                        $tugasMengajar,
                        $jumlahJp,
                        $occupied,
                        $dailyLoads,
                    );

                    if ($penempatan !== null) {
                        break;
                    }
                }

                if ($penempatan === null) {
                    $belumTerjadwal[] = [
                        'guru' => $tugasMengajar->guru->nama_lengkap,
                        'kelas' => $tugasMengajar->kelas->nama_kelas,
                        'mata_pelajaran' => $tugasMengajar->mataPelajaran->nama_mapel,
                        'jumlah_jp' => $sisaJp,
                    ];

                    break;
                }

                $hari = $penempatan['hari'];
                $jamKeMulai = $penempatan['jam_ke_mulai'];
                $jumlahJp = $penempatan['jumlah_jp'];

                for ($jamKe = $jamKeMulai; $jamKe < $jamKeMulai + $jumlahJp; $jamKe++) {
                    $occupied['guru'][$tugasMengajar->guru_id][$hari][$jamKe] = true;
                    $occupied['kelas'][$tugasMengajar->kelas_id][$hari][$jamKe] = true;
                }

                $dailyLoads['guru'][$tugasMengajar->guru_id][$hari] =
                    ($dailyLoads['guru'][$tugasMengajar->guru_id][$hari] ?? 0) + $jumlahJp;
                $dailyLoads['kelas'][$tugasMengajar->kelas_id][$hari] =
                    ($dailyLoads['kelas'][$tugasMengajar->kelas_id][$hari] ?? 0) + $jumlahJp;

                $jamMulai = $this->jamMulaiPeriode($jamKeMulai);
                $jadwals[] = [
                    'tugas_mengajar_id' => $tugasMengajar->id,
                    'kelas_id' => $tugasMengajar->kelas_id,
                    'mapel_id' => $tugasMengajar->mapel_id,
                    'guru_id' => $tugasMengajar->guru_id,
                    'jumlah_jp' => $jumlahJp,
                    'ruang' => null,
                    'hari' => $hari,
                    'jam_mulai' => $jamMulai,
                    'jam_selesai' => $this->calculateEndTime($jamMulai, $jumlahJp),
                ];

                $sisaJp -= $jumlahJp;
            }
        }

        return [
            'jadwals' => $jadwals,
            'belum_terjadwal' => $belumTerjadwal,
        ];
    }

    /**
     * @param  array<string, array<int, array<string, array<int, bool>>>>  $occupied
     * @param  array<string, array<int, array<string, int>>>  $dailyLoads
     * @return array{hari: string, jam_ke_mulai: int, jumlah_jp: int}|null
     */
    private function findAvailableBlock(
        TugasMengajar $tugasMengajar,
        int $jumlahJp,
        array $occupied,
        array $dailyLoads,
    ): ?array {
        $best = null;
        $bestScore = PHP_INT_MAX;

        foreach (self::HARI_GENERATE as $hari) {
            $maksimalJamKe = $hari === 'jumat' ? 5 : 9;
            $lastStartPeriod = $maksimalJamKe - $jumlahJp + 1;

            for ($jamKeMulai = 1; $jamKeMulai <= $lastStartPeriod; $jamKeMulai++) {
                $isAvailable = true;

                for ($jamKe = $jamKeMulai; $jamKe < $jamKeMulai + $jumlahJp; $jamKe++) {
                    if (
                        isset($occupied['guru'][$tugasMengajar->guru_id][$hari][$jamKe])
                        || isset($occupied['kelas'][$tugasMengajar->kelas_id][$hari][$jamKe])
                    ) {
                        $isAvailable = false;

                        break;
                    }
                }

                if (! $isAvailable) {
                    continue;
                }

                $score = ($dailyLoads['guru'][$tugasMengajar->guru_id][$hari] ?? 0)
                    + ($dailyLoads['kelas'][$tugasMengajar->kelas_id][$hari] ?? 0);

                if ($score < $bestScore) {
                    $bestScore = $score;
                    $best = [
                        'hari' => $hari,
                        'jam_ke_mulai' => $jamKeMulai,
                        'jumlah_jp' => $jumlahJp,
                    ];
                }
            }
        }

        return $best;
    }

    private function jamMulaiPeriode(int $jamKe): string
    {
        return self::JAM_KE_MULAI[$jamKe - 1];
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedSchedule(
        Request $request,
        TahunAjaran $tahunAjaran,
        ?Jadwal $jadwal = null,
    ): array {
        $maksimalJamKe = $request->input('hari') === 'jumat' ? 5 : 9;
        $hariValid = self::HARI_GENERATE;

        if ($jadwal?->hari === 'minggu') {
            $hariValid[] = 'minggu';
        }

        $validated = $request->validate([
            'tugas_mengajar_id' => [
                'required',
                'integer',
                Rule::exists('tugas_mengajars', 'id')->where('tahun_ajaran_id', $tahunAjaran->id),
            ],
            'jumlah_jp' => ['required', 'integer', 'min:1', 'max:255'],
            'ruang' => ['nullable', 'string', 'max:100'],
            'hari' => ['required', Rule::in($hariValid)],
            'jam_ke_mulai' => ['required', 'integer', Rule::in(range(1, $maksimalJamKe))],
        ], [
            'tugas_mengajar_id.exists' => 'Pilih penugasan pada tahun ajaran aktif.',
            'jumlah_jp.required' => 'Jumlah JP pada jadwal wajib diisi.',
            'jumlah_jp.integer' => 'Jumlah JP harus berupa bilangan bulat.',
            'jumlah_jp.min' => 'Jumlah JP minimal satu.',
            'jumlah_jp.max' => 'Jumlah JP maksimal 255.',
            'hari.in' => 'Hari yang dipilih tidak valid.',
            'jam_ke_mulai.required' => 'Pilih jam ke- untuk memulai sesi.',
            'jam_ke_mulai.integer' => 'Jam ke- harus berupa bilangan bulat.',
            'jam_ke_mulai.in' => 'Jam ke- tidak tersedia pada hari yang dipilih.',
        ]);

        $validated['tugas_mengajar_id'] = (int) $validated['tugas_mengajar_id'];
        $validated['jumlah_jp'] = (int) $validated['jumlah_jp'];
        $validated['jam_ke_mulai'] = (int) $validated['jam_ke_mulai'];

        if ($maksimalJamKe < $validated['jam_ke_mulai'] + $validated['jumlah_jp'] - 1) {
            $message = $validated['hari'] === 'jumat'
                ? 'Jadwal hari Jumat hanya dapat berlangsung sampai jam ke-5.'
                : 'Jadwal tidak dapat berlangsung melewati jam ke-9.';

            throw ValidationException::withMessages([
                'jumlah_jp' => $message,
            ]);
        }

        $validated['jam_mulai'] = $this->jamMulaiPeriode($validated['jam_ke_mulai']);
        unset($validated['jam_ke_mulai']);

        return $validated;
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function lockTugasMengajar(array $validated, TahunAjaran $tahunAjaran): TugasMengajar
    {
        return TugasMengajar::query()
            ->whereKey($validated['tugas_mengajar_id'])
            ->where('tahun_ajaran_id', $tahunAjaran->id)
            ->lockForUpdate()
            ->firstOrFail();
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    private function applyTugasMengajar(array $validated, TugasMengajar $tugasMengajar): array
    {
        $validated['kelas_id'] = $tugasMengajar->kelas_id;
        $validated['mapel_id'] = $tugasMengajar->mapel_id;
        $validated['guru_id'] = $tugasMengajar->guru_id;
        $validated['jam_selesai'] = $this->calculateEndTime(
            $validated['jam_mulai'],
            (int) $validated['jumlah_jp'],
        );

        return $validated;
    }

    private function calculateEndTime(string $jamMulai, int $jumlahJp): string
    {
        $startMinutes = $this->timeToMinutes($jamMulai);
        $endMinutes = $startMinutes + ($jumlahJp * 40);

        foreach (self::WAKTU_ISTIRAHAT as $waktuIstirahat) {
            $breakStart = $this->timeToMinutes($waktuIstirahat['mulai']);
            $breakEnd = $this->timeToMinutes($waktuIstirahat['selesai']);

            if ($startMinutes >= $breakStart && $startMinutes < $breakEnd) {
                throw ValidationException::withMessages([
                    'jam_mulai' => 'Jam mulai tidak boleh berada pada waktu istirahat (09.40–10.00 atau 12.00–12.30).',
                ]);
            }

            if ($startMinutes < $breakEnd && $endMinutes > $breakStart) {
                $endMinutes += $breakEnd - $breakStart;
            }
        }

        if ($endMinutes >= 24 * 60) {
            throw ValidationException::withMessages([
                'jumlah_jp' => 'Durasi jadwal tidak boleh melewati pukul 24.00.',
            ]);
        }

        return sprintf('%02d:%02d', intdiv($endMinutes, 60), $endMinutes % 60);
    }

    private function timeToMinutes(string $time): int
    {
        [$hours, $minutes] = array_map('intval', explode(':', $time));

        return ($hours * 60) + $minutes;
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function ensureWithinWeeklyTarget(
        array $validated,
        TugasMengajar $tugasMengajar,
        ?Jadwal $jadwal = null,
    ): void {
        $scheduledJp = Jadwal::query()
            ->where('tugas_mengajar_id', $tugasMengajar->id)
            ->when($jadwal, fn ($query) => $query->where('id', '!=', $jadwal->id))
            ->sum('jumlah_jp');

        if ($scheduledJp + $validated['jumlah_jp'] > $tugasMengajar->jp_per_minggu) {
            throw ValidationException::withMessages([
                'jumlah_jp' => 'Jumlah JP pada jadwal melebihi target JP mingguan penugasan.',
            ]);
        }
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function ensureNoConflict(array $validated, int $tahunAjaranId, ?Jadwal $jadwal = null): void
    {
        $hasConflict = Jadwal::query()
            ->where('tahun_ajaran_id', $tahunAjaranId)
            ->where('hari', $validated['hari'])
            ->where('jam_mulai', '<', $validated['jam_selesai'])
            ->where('jam_selesai', '>', $validated['jam_mulai'])
            ->where(fn ($query) => $query
                ->where('kelas_id', $validated['kelas_id'])
                ->orWhere('guru_id', $validated['guru_id']))
            ->when($jadwal, fn ($query) => $query->where('id', '!=', $jadwal->id))
            ->exists();

        if ($hasConflict) {
            throw ValidationException::withMessages([
                'jam_mulai' => 'Jadwal bertabrakan dengan jadwal kelas atau guru pada hari yang sama.',
            ]);
        }
    }
}
