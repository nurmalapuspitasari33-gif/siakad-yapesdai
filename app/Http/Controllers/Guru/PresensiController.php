<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Controller;
use App\Models\Jadwal;
use App\Models\PresensiKelas;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class PresensiController extends Controller
{
    public function show(Request $request, Jadwal $jadwal): JsonResponse
    {
        $jadwal = $this->assignedSchedule($request, $jadwal);
        $validated = $request->validate([
            'tanggal' => ['required', 'date'],
        ]);
        $presensi = PresensiKelas::query()
            ->where('jadwal_id', $jadwal->id)
            ->whereDate('tanggal', $validated['tanggal'])
            ->get(['siswa_id', 'status', 'materi_jurnal']);

        return response()->json([
            'presensi' => $presensi->mapWithKeys(fn (PresensiKelas $row): array => [
                $row->siswa_id => $row->status,
            ]),
            'materi_jurnal' => $presensi->first()?->materi_jurnal ?? '',
        ]);
    }

    public function store(Request $request, Jadwal $jadwal): RedirectResponse
    {
        $jadwal = $this->assignedSchedule($request, $jadwal);
        $validated = $request->validate([
            'tanggal' => ['required', 'date'],
            'materi_jurnal' => ['nullable', 'string', 'max:10000'],
            'presensi' => ['required', 'array', 'min:1'],
            'presensi.*.siswa_id' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('siswas', 'id')
                    ->where('kelas_id', $jadwal->kelas_id)
                    ->where('status_siswa', 'aktif'),
            ],
            'presensi.*.status' => ['required', Rule::in(['H', 'S', 'I', 'A'])],
        ], [
            'presensi.*.siswa_id.exists' => 'Daftar siswa aktif berubah. Muat ulang halaman sebelum menyimpan presensi.',
            'presensi.*.status.in' => 'Pilih status presensi yang tersedia.',
        ]);

        $activeStudentIds = Siswa::query()
            ->where('kelas_id', $jadwal->kelas_id)
            ->where('status_siswa', 'aktif')
            ->pluck('id')
            ->map(fn ($id): int => (int) $id)
            ->sort()
            ->values();
        $submittedStudentIds = collect($validated['presensi'])
            ->pluck('siswa_id')
            ->map(fn ($id): int => (int) $id)
            ->sort()
            ->values();

        if ($activeStudentIds->all() !== $submittedStudentIds->all()) {
            throw ValidationException::withMessages([
                'presensi' => 'Presensi harus mencakup seluruh siswa aktif pada kelas ini.',
            ]);
        }

        $now = now();
        $rows = collect($validated['presensi'])->map(fn (array $row): array => [
            'jadwal_id' => $jadwal->id,
            'kelas_id' => $jadwal->kelas_id,
            'mapel_id' => $jadwal->mapel_id,
            'guru_id' => $jadwal->guru_id,
            'siswa_id' => $row['siswa_id'],
            'tanggal' => $validated['tanggal'],
            'status' => $row['status'],
            'materi_jurnal' => $validated['materi_jurnal'] ?? null,
            'created_at' => $now,
            'updated_at' => $now,
        ])->all();

        DB::transaction(function () use ($rows): void {
            PresensiKelas::query()->upsert(
                $rows,
                ['jadwal_id', 'siswa_id', 'tanggal'],
                ['kelas_id', 'mapel_id', 'guru_id', 'status', 'materi_jurnal', 'updated_at'],
            );
        });

        return to_route('guru.jadwal.index')->with('success', 'Presensi dan jurnal kelas berhasil disimpan.');
    }

    private function assignedSchedule(Request $request, Jadwal $jadwal): Jadwal
    {
        $guru = $request->user()->guru;
        $tahunAjaranAktif = TahunAjaran::query()->where('is_aktif', true)->first();

        abort_unless(
            $guru
                && $tahunAjaranAktif
                && $jadwal->guru_id === $guru->id
                && $jadwal->tahun_ajaran_id === $tahunAjaranAktif->id,
            404,
        );

        return $jadwal;
    }
}
