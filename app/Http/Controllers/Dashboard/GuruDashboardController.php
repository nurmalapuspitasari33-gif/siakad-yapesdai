<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\TahunAjaran;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GuruDashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $guru = $request->user()->guru;
        $tahunAjaranAktif = TahunAjaran::query()
            ->where('is_aktif', true)
            ->first(['nama_tahun', 'semester']);

        $jadwals = $guru?->jadwals()
            ->with(['kelas:id,nama_kelas', 'mataPelajaran:id,nama_mapel'])
            ->orderByRaw("CASE hari WHEN 'senin' THEN 1 WHEN 'selasa' THEN 2 WHEN 'rabu' THEN 3 WHEN 'kamis' THEN 4 WHEN 'jumat' THEN 5 WHEN 'sabtu' THEN 6 ELSE 7 END")
            ->orderBy('jam_mulai')
            ->get()
            ->map(fn ($jadwal): array => [
                'id' => $jadwal->id,
                'hari' => $jadwal->hari,
                'jam_mulai' => substr($jadwal->jam_mulai, 0, 5),
                'jam_selesai' => substr($jadwal->jam_selesai, 0, 5),
                'kelas' => $jadwal->kelas?->nama_kelas,
                'mata_pelajaran' => $jadwal->mataPelajaran?->nama_mapel,
            ]) ?? collect();

        $kelasWalian = $guru?->is_wali_kelas
            ? $guru->kelasWalian()->with('tahunAjaran:id,nama_tahun,semester')->get()
                ->map(fn ($kelas): array => [
                    'nama_kelas' => $kelas->nama_kelas,
                    'tahun_ajaran' => $kelas->tahunAjaran?->nama_tahun,
                ])
            : collect();

        return Inertia::render('Dashboard/Guru', [
            'tahunAjaranAktif' => $tahunAjaranAktif ? [
                'nama_tahun' => $tahunAjaranAktif->nama_tahun,
                'semester' => $tahunAjaranAktif->semester,
            ] : null,
            'guru' => [
                'nama_lengkap' => $guru?->nama_lengkap ?? $request->user()->name,
                'is_wali_kelas' => (bool) $guru?->is_wali_kelas,
            ],
            'jadwals' => $jadwals,
            'kelasWalian' => $kelasWalian,
        ]);
    }
}
