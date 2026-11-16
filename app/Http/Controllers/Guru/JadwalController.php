<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Controller;
use App\Models\TahunAjaran;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class JadwalController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $guru = $request->user()->guru;
        $tahunAjaranAktif = TahunAjaran::query()->where('is_aktif', true)->first();

        $jadwals = $guru && $tahunAjaranAktif
            ? $guru->jadwals()
                ->where('tahun_ajaran_id', $tahunAjaranAktif->id)
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
                    'guru' => null,
                ])
            : collect();

        return Inertia::render('Guru/Jadwal/Index', [
            'jadwals' => $jadwals,
            'tahunAjaranAktif' => $tahunAjaranAktif
                ? "{$tahunAjaranAktif->nama_tahun} · {$tahunAjaranAktif->semester}"
                : null,
        ]);
    }
}
