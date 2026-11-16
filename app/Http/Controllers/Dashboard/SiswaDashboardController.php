<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\TahunAjaran;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SiswaDashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $siswa = $request->user()->siswa;
        $pendaftaran = $request->user()->pendaftaranSpmbs()->latest()->first();
        $tahunAjaranAktif = TahunAjaran::query()
            ->where('is_aktif', true)
            ->first(['nama_tahun', 'semester']);

        $jadwals = collect();
        $tagihans = collect();
        $ujians = collect();

        if ($siswa?->status_siswa === 'aktif') {
            $jadwals = $siswa->kelas?->jadwals()
                ->whereHas('tahunAjaran', fn ($query) => $query->where('is_aktif', true))
                ->with(['mataPelajaran:id,nama_mapel', 'guru:id,nama_lengkap'])
                ->orderByRaw("CASE hari WHEN 'senin' THEN 1 WHEN 'selasa' THEN 2 WHEN 'rabu' THEN 3 WHEN 'kamis' THEN 4 WHEN 'jumat' THEN 5 WHEN 'sabtu' THEN 6 ELSE 7 END")
                ->orderBy('jam_mulai')
                ->get()
                ->map(fn ($jadwal): array => [
                    'id' => $jadwal->id,
                    'hari' => $jadwal->hari,
                    'jam_mulai' => substr($jadwal->jam_mulai, 0, 5),
                    'jam_selesai' => substr($jadwal->jam_selesai, 0, 5),
                    'mata_pelajaran' => $jadwal->mataPelajaran?->nama_mapel,
                    'guru' => $jadwal->guru?->nama_lengkap,
                ]) ?? collect();

            $tagihans = $siswa->tagihans()
                ->latest('jatuh_tempo')
                ->get(['id', 'judul_tagihan', 'nominal', 'jatuh_tempo', 'status_bayar'])
                ->map(fn ($tagihan): array => [
                    'id' => $tagihan->id,
                    'judul' => $tagihan->judul_tagihan,
                    'nominal' => $tagihan->nominal,
                    'jatuh_tempo' => $tagihan->jatuh_tempo->format('Y-m-d'),
                    'status' => $tagihan->status_bayar,
                ]);

            $ujians = $siswa->kelas?->ujians()
                ->with('mataPelajaran:id,nama_mapel')
                ->orderBy('waktu_mulai')
                ->get()
                ->filter(fn ($ujian): bool => $ujian->waktu_mulai
                    ->copy()
                    ->addMinutes($ujian->durasi_menit)
                    ->isFuture())
                ->values()
                ->map(fn ($ujian): array => [
                    'id' => $ujian->id,
                    'judul' => $ujian->judul_ujian,
                    'mata_pelajaran' => $ujian->mataPelajaran?->nama_mapel,
                    'waktu_mulai' => $ujian->waktu_mulai->toIso8601String(),
                    'durasi_menit' => $ujian->durasi_menit,
                ]) ?? collect();
        }

        return Inertia::render('Dashboard/Siswa', [
            'tahunAjaranAktif' => $tahunAjaranAktif ? [
                'nama_tahun' => $tahunAjaranAktif->nama_tahun,
                'semester' => $tahunAjaranAktif->semester,
            ] : null,
            'siswa' => [
                'nama_lengkap' => $siswa?->nama_lengkap ?? $request->user()->name,
                'status_siswa' => $siswa?->status_siswa ?? 'calon_spmb',
                'kelas' => $siswa?->kelas?->nama_kelas,
            ],
            'pendaftaran' => $pendaftaran ? [
                'no_pendaftaran' => $pendaftaran->no_pendaftaran,
                'status_seleksi' => $pendaftaran->status_seleksi,
            ] : null,
            'jadwals' => $jadwals,
            'tagihans' => $tagihans,
            'ujians' => $ujians,
        ]);
    }
}
