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
            ->first(['id', 'nama_tahun', 'semester']);
        $localNow = now('Asia/Jakarta');
        $hariIni = [
            0 => 'minggu',
            1 => 'senin',
            2 => 'selasa',
            3 => 'rabu',
            4 => 'kamis',
            5 => 'jumat',
            6 => 'sabtu',
        ][$localNow->dayOfWeek];
        $startOfTodayUtc = $localNow->copy()->startOfDay()->utc();
        $startOfTomorrowUtc = $localNow->copy()->addDay()->startOfDay()->utc();
        $now = now();

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
                    'ruang' => $jadwal->ruang,
                    'kelas_id' => $jadwal->kelas_id,
                    'kelas' => $jadwal->kelas?->nama_kelas,
                    'mapel_id' => $jadwal->mapel_id,
                    'mata_pelajaran' => $jadwal->mataPelajaran?->nama_mapel,
                ])
            : collect();
        $jadwalHariIni = $jadwals->where('hari', $hariIni)->values();

        $kelasWalianAktif = $guru?->kelasWalianAktif() ?? collect();
        if ($kelasWalianAktif->isNotEmpty() && $tahunAjaranAktif) {
            $kelasWalianAktif
                ->load('tahunAjaran:id,nama_tahun')
                ->loadCount([
                    'siswas as siswa_aktif_count' => fn ($query) => $query
                        ->where('status_siswa', 'aktif'),
                    'siswas as siswa_dengan_catatan_count' => fn ($query) => $query
                        ->where('status_siswa', 'aktif')
                        ->whereHas('catatanRapors', fn ($query) => $query
                            ->where('tahun_ajaran_id', $tahunAjaranAktif->id)),
                ]);
        }
        $kelasWalian = $kelasWalianAktif->map(fn ($kelas): array => [
            'nama_kelas' => $kelas->nama_kelas,
            'tahun_ajaran' => $kelas->tahunAjaran?->nama_tahun,
            'jumlah_siswa' => $kelas->siswa_aktif_count ?? 0,
            'jumlah_catatan_rapor' => $kelas->siswa_dengan_catatan_count ?? 0,
        ]);
        $ujiansAktif = $guru && $tahunAjaranAktif
            ? $guru->ujians()
                ->whereHas('kelas', fn ($query) => $query
                    ->where('tahun_ajaran_id', $tahunAjaranAktif->id))
                ->where('waktu_mulai', '>=', $startOfTodayUtc)
                ->where('waktu_mulai', '<', $startOfTomorrowUtc)
                ->where('waktu_mulai', '<=', $now)
                ->orderBy('waktu_mulai')
                ->orderBy('id')
                ->withCount('bankSoals')
                ->get()
                ->filter(fn ($ujian): bool => $ujian->waktu_mulai
                    ->copy()
                    ->addMinutes($ujian->durasi_menit)
                    ->isAfter($now))
                ->values()
            : collect();

        return Inertia::render('Dashboard/Guru', [
            'tahunAjaranAktif' => $tahunAjaranAktif ? [
                'nama_tahun' => $tahunAjaranAktif->nama_tahun,
                'semester' => $tahunAjaranAktif->semester,
            ] : null,
            'guru' => [
                'nama_lengkap' => $guru?->nama_lengkap ?? $request->user()->name,
                'is_wali_kelas' => $kelasWalianAktif->isNotEmpty(),
                'wali_kelas_nama_kelas' => $kelasWalianAktif->pluck('nama_kelas')->implode(', '),
                'jumlah_siswa_walian' => $kelasWalian->sum('jumlah_siswa'),
            ],
            'jadwals' => $jadwals,
            'jadwalHariIni' => $jadwalHariIni,
            'hariIni' => ucfirst($hariIni),
            'ujiansAktif' => $ujiansAktif->count(),
            'bankSoalAktif' => $ujiansAktif->sum('bank_soals_count'),
            'kelasWalian' => $kelasWalian,
        ]);
    }
}
