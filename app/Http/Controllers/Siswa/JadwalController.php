<?php

namespace App\Http\Controllers\Siswa;

use App\Http\Controllers\Controller;
use App\Models\TahunAjaran;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class JadwalController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $siswa = $request->user()->siswa;
        $tahunAjaranAktif = TahunAjaran::query()->where('is_aktif', true)->first();

        $jadwals = $siswa?->status_siswa === 'aktif' && $siswa->kelas && $tahunAjaranAktif
            ? $siswa->kelas->jadwals()
                ->where('tahun_ajaran_id', $tahunAjaranAktif->id)
                ->with(['mataPelajaran:id,nama_mapel', 'guru:id,nama_lengkap'])
                ->orderByRaw("CASE hari WHEN 'senin' THEN 1 WHEN 'selasa' THEN 2 WHEN 'rabu' THEN 3 WHEN 'kamis' THEN 4 WHEN 'jumat' THEN 5 WHEN 'sabtu' THEN 6 ELSE 7 END")
                ->orderBy('jam_mulai')
                ->get()
                ->map(fn ($jadwal): array => [
                    'id' => $jadwal->id,
                    'hari' => $jadwal->hari,
                    'jam_mulai' => substr($jadwal->jam_mulai, 0, 5),
                    'jam_selesai' => substr($jadwal->jam_selesai, 0, 5),
                    'kelas' => $siswa->kelas->nama_kelas,
                    'mata_pelajaran' => $jadwal->mataPelajaran?->nama_mapel,
                    'guru' => $jadwal->guru?->nama_lengkap,
                ])
            : collect();

        return Inertia::render('Siswa/Jadwal/Index', [
            'jadwals' => $jadwals,
            'tahunAjaranAktif' => $tahunAjaranAktif
                ? "{$tahunAjaranAktif->nama_tahun} · {$tahunAjaranAktif->semester}"
                : null,
        ]);
    }
}
