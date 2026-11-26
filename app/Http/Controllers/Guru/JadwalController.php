<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Controller;
use App\Models\PengaturanSekolah;
use App\Models\Siswa;
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

        $jadwals = collect();
        $totalJp = 0;
        $kepalaSekolah = PengaturanSekolah::query()->value('kepala_sekolah');

        if ($guru && $tahunAjaranAktif) {
            $jadwals = $guru->jadwals()
                ->where('tahun_ajaran_id', $tahunAjaranAktif->id)
                ->with(['kelas:id,nama_kelas', 'mataPelajaran:id,nama_mapel'])
                ->orderByRaw("CASE hari WHEN 'senin' THEN 1 WHEN 'selasa' THEN 2 WHEN 'rabu' THEN 3 WHEN 'kamis' THEN 4 WHEN 'jumat' THEN 5 WHEN 'sabtu' THEN 6 ELSE 7 END")
                ->orderBy('jam_mulai')
                ->get();
            $periodStartByDay = $jadwals->groupBy('hari')
                ->map(fn ($dailySchedules): int => $dailySchedules
                    ->min(fn ($schedule): int => $this->minutesFromMidnight($schedule->jam_mulai)));
            $studentsByClass = Siswa::query()
                ->whereIn('kelas_id', $jadwals->pluck('kelas_id')->unique())
                ->where('status_siswa', 'aktif')
                ->orderBy('nama_lengkap')
                ->get(['id', 'kelas_id', 'nisn', 'nama_lengkap'])
                ->groupBy('kelas_id');
            $jadwals = $jadwals->map(function ($jadwal) use ($periodStartByDay, $studentsByClass): array {
                $startMinutes = $this->minutesFromMidnight($jadwal->jam_mulai);
                $endMinutes = $this->minutesFromMidnight($jadwal->jam_selesai);
                $jp = max(1, (int) round(($endMinutes - $startMinutes) / 45));
                $jamKeAwal = (int) floor(($startMinutes - $periodStartByDay[$jadwal->hari]) / 45) + 1;

                return [
                    'id' => $jadwal->id,
                    'hari' => $jadwal->hari,
                    'jam_mulai' => substr($jadwal->jam_mulai, 0, 5),
                    'jam_selesai' => substr($jadwal->jam_selesai, 0, 5),
                    'jam_ke' => $jp === 1 ? (string) $jamKeAwal : "{$jamKeAwal}-".($jamKeAwal + $jp - 1),
                    'jp' => $jp,
                    'ruang' => $jadwal->ruang,
                    'kelas' => $jadwal->kelas?->nama_kelas,
                    'mata_pelajaran' => $jadwal->mataPelajaran?->nama_mapel,
                    'guru' => null,
                    'siswas' => $studentsByClass->get($jadwal->kelas_id, collect())
                        ->map(fn (Siswa $siswa): array => [
                            'id' => $siswa->id,
                            'nisn' => $siswa->nisn,
                            'nama_lengkap' => $siswa->nama_lengkap,
                        ])
                        ->values(),
                ];
            });
            $totalJp = $jadwals->sum('jp');
        }

        $kelasWalianAktif = $guru?->kelasWalianAktif() ?? collect();

        return Inertia::render('Guru/Jadwal/Index', [
            'jadwals' => $jadwals,
            'openJadwalId' => $request->integer('jadwal_id') ?: null,
            'isWaliKelas' => $kelasWalianAktif->isNotEmpty(),
            'waliKelasName' => $kelasWalianAktif->pluck('nama_kelas')->implode(', '),
            'tahunAjaranAktif' => $tahunAjaranAktif
                ? "{$tahunAjaranAktif->nama_tahun} · {$tahunAjaranAktif->semester}"
                : null,
            'printIdentity' => [
                'nama_guru' => $guru?->nama_lengkap,
                'nip' => $guru?->nip,
                'tahun_ajaran' => $tahunAjaranAktif?->nama_tahun,
                'semester' => $tahunAjaranAktif?->semester,
                'kepala_sekolah' => $kepalaSekolah,
                'total_jp' => $totalJp,
            ],
        ]);
    }

    private function minutesFromMidnight(string $time): int
    {
        [$hours, $minutes] = array_map('intval', explode(':', $time));

        return ($hours * 60) + $minutes;
    }
}
