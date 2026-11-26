<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\TahunAjaran;
use App\Support\StudentAttendanceSummary;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SiswaDashboardController extends Controller
{
    public function __invoke(Request $request, StudentAttendanceSummary $attendanceSummary): Response
    {
        $siswa = $request->user()->siswa;
        $pendaftaran = $request->user()->pendaftaranSpmbs()->latest()->first();
        $tahunAjaranAktif = TahunAjaran::query()
            ->where('is_aktif', true)
            ->first(['id', 'nama_tahun', 'semester']);
        $localNow = now('Asia/Jakarta');
        $startOfTodayUtc = $localNow->copy()->startOfDay()->utc();
        $startOfTomorrowUtc = $localNow->copy()->addDay()->startOfDay()->utc();
        $hariIni = [
            0 => 'minggu',
            1 => 'senin',
            2 => 'selasa',
            3 => 'rabu',
            4 => 'kamis',
            5 => 'jumat',
            6 => 'sabtu',
        ][$localNow->dayOfWeek];

        $jadwals = collect();
        $tagihans = collect();
        $ujians = collect();
        $ujiansAktif = collect();
        $hasilUjianTerakhir = null;
        $nilaiRataRata = null;
        $attendance = $siswa
            ? $attendanceSummary->for($siswa, $tahunAjaranAktif)['ringkasan']
            : [
                'total_sesi' => 0,
                'hadir' => 0,
                'sakit' => 0,
                'izin' => 0,
                'alfa' => 0,
                'persentase_kehadiran' => 0.0,
            ];

        if ($siswa?->status_siswa === 'aktif' && $tahunAjaranAktif) {
            $jadwals = $siswa->kelas?->jadwals()
                ->where('tahun_ajaran_id', $tahunAjaranAktif->id)
                ->where('hari', $hariIni)
                ->with(['mataPelajaran:id,nama_mapel', 'guru:id,nama_lengkap'])
                ->orderBy('jam_mulai')
                ->get()
                ->map(fn ($jadwal): array => [
                    'id' => $jadwal->id,
                    'jam_mulai' => substr($jadwal->jam_mulai, 0, 5),
                    'jam_selesai' => substr($jadwal->jam_selesai, 0, 5),
                    'ruang' => $jadwal->ruang,
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
                ->whereHas('kelas', fn ($query) => $query
                    ->where('tahun_ajaran_id', $tahunAjaranAktif->id))
                ->with('mataPelajaran:id,nama_mapel')
                ->where('waktu_mulai', '>=', $startOfTodayUtc)
                ->where('waktu_mulai', '<', $startOfTomorrowUtc)
                ->orderBy('waktu_mulai')
                ->orderBy('id')
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

            $ujiansAktif = $siswa->kelas?->ujians()
                ->whereHas('kelas', fn ($query) => $query
                    ->where('tahun_ajaran_id', $tahunAjaranAktif->id))
                ->where('waktu_mulai', '<=', now())
                ->where('waktu_mulai', '>=', $startOfTodayUtc)
                ->with([
                    'mataPelajaran:id,nama_mapel',
                    'hasilUjians' => fn ($query) => $query
                        ->where('siswa_id', $siswa->id)
                        ->select('id', 'ujian_id', 'siswa_id', 'status_pengerjaan', 'created_at'),
                ])
                ->withCount('bankSoals')
                ->orderBy('waktu_mulai')
                ->orderBy('id')
                ->get()
                ->filter(function ($ujian): bool {
                    $attempt = $ujian->hasilUjians->first();

                    return $ujian->waktu_mulai
                        ->copy()
                        ->addMinutes($ujian->durasi_menit)
                        ->isFuture()
                        && ($attempt === null || $attempt->status_pengerjaan === 'sedang_mengerjakan');
                })
                ->map(function ($ujian): array {
                    $attempt = $ujian->hasilUjians->first();
                    $scheduledEnd = $ujian->waktu_mulai->copy()->addMinutes($ujian->durasi_menit);
                    $dapatDilanjutkan = $attempt?->status_pengerjaan === 'sedang_mengerjakan'
                        && $scheduledEnd->isFuture()
                        && $attempt->created_at?->copy()->addMinutes($ujian->durasi_menit)->isFuture();

                    return [
                        'id' => $ujian->id,
                        'judul' => $ujian->judul_ujian,
                        'mata_pelajaran' => $ujian->mataPelajaran?->nama_mapel,
                        'waktu_mulai' => $ujian->waktu_mulai->toIso8601String(),
                        'durasi_menit' => $ujian->durasi_menit,
                        'status_pengerjaan' => $attempt?->status_pengerjaan,
                        'dapat_dimulai' => $ujian->bank_soals_count > 0 && $attempt === null,
                        'dapat_dilanjutkan' => $dapatDilanjutkan,
                    ];
                })
                ->values() ?? collect();

            $hasilUjianTerakhir = $siswa->hasilUjians()
                ->where('status_pengerjaan', 'selesai')
                ->with('ujian:id,judul_ujian')
                ->latest('updated_at')
                ->first(['id', 'ujian_id', 'skor_akhir', 'updated_at']);
            $nilaiRataRata = $siswa->nilais()
                ->where('tahun_ajaran_id', $tahunAjaranAktif->id)
                ->whereNotNull('nilai_akhir')
                ->avg('nilai_akhir');
        }

        return Inertia::render('Dashboard/Siswa', [
            'tahunAjaranAktif' => $tahunAjaranAktif ? [
                'nama_tahun' => $tahunAjaranAktif->nama_tahun,
                'semester' => $tahunAjaranAktif->semester,
            ] : null,
            'siswa' => [
                'nama_lengkap' => $siswa?->nama_lengkap ?? $request->user()->name,
                'nik' => $request->user()->nik,
                'status_siswa' => $siswa?->status_siswa ?? 'calon_spmb',
                'kelas' => $siswa?->kelas?->nama_kelas,
            ],
            'pendaftaran' => $pendaftaran ? [
                'no_pendaftaran' => $pendaftaran->no_pendaftaran,
                'status_seleksi' => $pendaftaran->status_seleksi,
            ] : null,
            'jadwals' => $jadwals,
            'tagihans' => $tagihans,
            'tagihanSummary' => [
                'belum_lunas' => $tagihans->where('status', 'belum_lunas')->count(),
                'lunas' => $tagihans->where('status', 'lunas')->count(),
                'nominal_belum_lunas' => $tagihans->where('status', 'belum_lunas')->sum('nominal'),
            ],
            'attendance' => $attendance,
            'ujians' => $ujians,
            'ujiansAktif' => $ujiansAktif,
            'nilaiRataRata' => $nilaiRataRata,
            'hasilUjianTerakhir' => $hasilUjianTerakhir ? [
                'ujian_id' => $hasilUjianTerakhir->ujian_id,
                'judul' => $hasilUjianTerakhir->ujian?->judul_ujian,
                'nilai' => $hasilUjianTerakhir->skor_akhir,
            ] : null,
            'hariIni' => ucfirst($hariIni),
        ]);
    }
}
