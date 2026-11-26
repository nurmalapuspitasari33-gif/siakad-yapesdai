<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\CatatanRapor;
use App\Models\Guru;
use App\Models\HasilUjian;
use App\Models\Jadwal;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\Nilai;
use App\Models\PendaftaranSpmb;
use App\Models\Siswa;
use App\Models\Tagihan;
use App\Models\TahunAjaran;
use App\Models\Ujian;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    public function __invoke(): Response
    {
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

        $siswaAktif = Siswa::query()->where('status_siswa', 'aktif');
        $pendaftarMenunggu = PendaftaranSpmb::query()
            ->where('status_seleksi', 'pending');
        $tagihanBelumLunas = Tagihan::query()
            ->where('status_bayar', 'belum_lunas');

        $statistics = [
            'siswa' => Siswa::count(),
            'siswaAktif' => (clone $siswaAktif)->count(),
            'siswaTanpaKelas' => (clone $siswaAktif)->whereNull('kelas_id')->count(),
            'siswaTanpaNIK' => (clone $siswaAktif)
                ->whereHas('user', fn ($query) => $query->whereNull('nik')->orWhere('nik', ''))
                ->count(),
            'guru' => Guru::count(),
            'waliKelas' => Guru::query()->where('is_wali_kelas', true)->count(),
            'kelas' => Kelas::count(),
            'mataPelajaran' => MataPelajaran::count(),
            'tahunAjaran' => TahunAjaran::count(),
            'jadwal' => Jadwal::count(),
            'jadwalHariIni' => $tahunAjaranAktif
                ? Jadwal::query()
                    ->where('tahun_ajaran_id', $tahunAjaranAktif->id)
                    ->where('hari', $hariIni)
                    ->count()
                : 0,
            'pendaftarSpmb' => PendaftaranSpmb::count(),
            'pendaftarMenunggu' => (clone $pendaftarMenunggu)->count(),
            'tagihan' => Tagihan::count(),
            'tagihanBelumLunas' => (clone $tagihanBelumLunas)->count(),
            'totalTagihan' => Tagihan::sum('nominal'),
            'nominalBelumLunas' => (clone $tagihanBelumLunas)->sum('nominal'),
            'ujian' => Ujian::count(),
            'ujianHariIni' => Ujian::query()
                ->where('waktu_mulai', '>=', $startOfTodayUtc)
                ->where('waktu_mulai', '<', $startOfTomorrowUtc)
                ->count(),
            'hasilUjian' => HasilUjian::query()
                ->where('status_pengerjaan', 'selesai')
                ->count(),
            'laporan' => Nilai::count() + CatatanRapor::count(),
        ];
        $latestPendaftarans = PendaftaranSpmb::query()
            ->with([
                'user:id,name,nik',
                'user.siswa:id,user_id,nama_lengkap',
            ])
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (PendaftaranSpmb $pendaftaran): array => [
                'id' => $pendaftaran->id,
                'nama' => $pendaftaran->user?->siswa?->nama_lengkap
                    ?? $pendaftaran->user?->name
                    ?? '—',
                'nik' => $pendaftaran->user?->nik,
                'no_pendaftaran' => $pendaftaran->no_pendaftaran,
                'status' => $pendaftaran->status_seleksi,
                'created_at' => $pendaftaran->created_at?->format('d M Y'),
            ]);

        return Inertia::render('Dashboard/Admin', [
            'tahunAjaranAktif' => $tahunAjaranAktif ? [
                'nama_tahun' => $tahunAjaranAktif->nama_tahun,
                'semester' => $tahunAjaranAktif->semester,
            ] : null,
            'hariIni' => ucfirst($hariIni),
            'statistics' => $statistics,
            'latestPendaftarans' => $latestPendaftarans,
        ]);
    }
}
