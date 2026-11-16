<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use App\Models\Jadwal;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\TahunAjaran;
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
            'mapelOptions' => MataPelajaran::query()->orderBy('nama_mapel')->get(['id', 'kode_mapel', 'nama_mapel']),
            'guruOptions' => Guru::query()->orderBy('nama_lengkap')->get(['id', 'nama_lengkap']),
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
            Kelas::query()->whereKey($validated['kelas_id'])->lockForUpdate()->firstOrFail();
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
            Kelas::query()->whereKey($validated['kelas_id'])->lockForUpdate()->firstOrFail();
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
        return $request->validate([
            'kelas_id' => [
                'required',
                'integer',
                Rule::exists('kelas', 'id')->where('tahun_ajaran_id', $tahunAjaran->id),
            ],
            'mapel_id' => ['required', 'integer', Rule::exists('mata_pelajarans', 'id')],
            'guru_id' => ['required', 'integer', Rule::exists('gurus', 'id')],
            'hari' => ['required', Rule::in(self::HARI)],
            'jam_mulai' => ['required', 'date_format:H:i'],
            'jam_selesai' => ['required', 'date_format:H:i', 'after:jam_mulai'],
        ], [
            'kelas_id.exists' => 'Pilih kelas pada tahun ajaran aktif.',
            'hari.in' => 'Hari yang dipilih tidak valid.',
            'jam_mulai.date_format' => 'Format jam mulai tidak valid.',
            'jam_selesai.date_format' => 'Format jam selesai tidak valid.',
            'jam_selesai.after' => 'Jam selesai harus setelah jam mulai.',
        ]);
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function ensureNoConflict(array $validated, int $tahunAjaranId, ?Jadwal $jadwal = null): void
    {
        $hasConflict = Jadwal::query()
            ->where('tahun_ajaran_id', $tahunAjaranId)
            ->where('kelas_id', $validated['kelas_id'])
            ->where('hari', $validated['hari'])
            ->where('jam_mulai', '<', $validated['jam_selesai'])
            ->where('jam_selesai', '>', $validated['jam_mulai'])
            ->when($jadwal, fn ($query) => $query->where('id', '!=', $jadwal->id))
            ->exists();

        if ($hasConflict) {
            throw ValidationException::withMessages([
                'jam_mulai' => 'Jadwal bertabrakan dengan jadwal lain di kelas dan hari yang sama.',
            ]);
        }
    }
}
