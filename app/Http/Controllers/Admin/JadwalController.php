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
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class JadwalController extends Controller
{
    private const HARI = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];

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

        $validated = $this->validatedSchedule($request, $tahunAjaranAktif);

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
     * @return array<string, mixed>
     */
    private function validatedSchedule(Request $request, TahunAjaran $tahunAjaran): array
    {
        $validated = $request->validate([
            'tugas_mengajar_id' => [
                'required',
                'integer',
                Rule::exists('tugas_mengajars', 'id')->where('tahun_ajaran_id', $tahunAjaran->id),
            ],
            'jumlah_jp' => ['required', 'integer', 'min:1', 'max:255'],
            'ruang' => ['nullable', 'string', 'max:100'],
            'hari' => ['required', Rule::in(self::HARI)],
            'jam_mulai' => ['required', 'date_format:H:i'],
        ], [
            'tugas_mengajar_id.exists' => 'Pilih penugasan pada tahun ajaran aktif.',
            'jumlah_jp.required' => 'Jumlah JP pada jadwal wajib diisi.',
            'jumlah_jp.integer' => 'Jumlah JP harus berupa bilangan bulat.',
            'jumlah_jp.min' => 'Jumlah JP minimal satu.',
            'jumlah_jp.max' => 'Jumlah JP maksimal 255.',
            'hari.in' => 'Hari yang dipilih tidak valid.',
            'jam_mulai.date_format' => 'Format jam mulai tidak valid.',
        ]);

        $validated['tugas_mengajar_id'] = (int) $validated['tugas_mengajar_id'];
        $validated['jumlah_jp'] = (int) $validated['jumlah_jp'];

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
        [$hours, $minutes] = array_map('intval', explode(':', $jamMulai));
        $endMinutes = ($hours * 60) + $minutes + ($jumlahJp * 40);

        if ($endMinutes >= 24 * 60) {
            throw ValidationException::withMessages([
                'jumlah_jp' => 'Durasi jadwal tidak boleh melewati pukul 24.00.',
            ]);
        }

        return sprintf('%02d:%02d', intdiv($endMinutes, 60), $endMinutes % 60);
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
