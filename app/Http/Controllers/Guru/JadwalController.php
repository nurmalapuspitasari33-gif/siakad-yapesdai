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

    private const WAKTU_ISTIRAHAT = [
        ['09:40', '10:00'],
        ['12:00', '12:30'],
    ];

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
            $studentsByClass = Siswa::query()
                ->whereIn('kelas_id', $jadwals->pluck('kelas_id')->unique())
                ->where('status_siswa', 'aktif')
                ->orderBy('nama_lengkap')
                ->get(['id', 'kelas_id', 'nisn', 'nama_lengkap'])
                ->groupBy('kelas_id');
            $jadwals = $jadwals->map(function ($jadwal) use ($studentsByClass): array {
                $jp = $jadwal->jumlah_jp ?? $this->jumlahJpDariWaktu(
                    $jadwal->jam_mulai,
                    $jadwal->jam_selesai,
                );
                $jamKeAwal = array_search(substr($jadwal->jam_mulai, 0, 5), self::JAM_KE_MULAI, true);

                return [
                    'id' => $jadwal->id,
                    'hari' => $jadwal->hari,
                    'jam_mulai' => substr($jadwal->jam_mulai, 0, 5),
                    'jam_selesai' => substr($jadwal->jam_selesai, 0, 5),
                    'jam_ke' => $jamKeAwal === false
                        ? '—'
                        : ($jp === 1
                            ? (string) ($jamKeAwal + 1)
                            : ($jamKeAwal + 1).'-'.($jamKeAwal + $jp)),
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

    private function jumlahJpDariWaktu(string $jamMulai, string $jamSelesai): int
    {
        $startMinutes = $this->minutesFromMidnight($jamMulai);
        $endMinutes = $this->minutesFromMidnight($jamSelesai);
        $breakMinutes = 0;

        foreach (self::WAKTU_ISTIRAHAT as [$breakStart, $breakEnd]) {
            $breakMinutes += max(
                0,
                min($endMinutes, $this->minutesFromMidnight($breakEnd))
                    - max($startMinutes, $this->minutesFromMidnight($breakStart)),
            );
        }

        return max(1, (int) round(($endMinutes - $startMinutes - $breakMinutes) / 40));
    }
}
