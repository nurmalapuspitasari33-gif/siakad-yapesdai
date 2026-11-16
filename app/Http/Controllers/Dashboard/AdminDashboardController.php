<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use App\Models\PendaftaranSpmb;
use App\Models\Siswa;
use App\Models\Tagihan;
use App\Models\TahunAjaran;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    public function __invoke(): Response
    {
        $tahunAjaranAktif = TahunAjaran::query()
            ->where('is_aktif', true)
            ->first(['nama_tahun', 'semester']);

        return Inertia::render('Dashboard/Admin', [
            'tahunAjaranAktif' => $tahunAjaranAktif ? [
                'nama_tahun' => $tahunAjaranAktif->nama_tahun,
                'semester' => $tahunAjaranAktif->semester,
            ] : null,
            'statistics' => [
                'siswa' => Siswa::count(),
                'guru' => Guru::count(),
                'pendaftarSpmb' => PendaftaranSpmb::count(),
                'totalTagihan' => Tagihan::sum('nominal'),
            ],
            'modules' => [
                ['id' => 'siswa', 'label' => 'Data Siswa', 'description' => 'Kelola profil, kelas, dan status siswa.'],
                ['id' => 'guru', 'label' => 'Data Guru', 'description' => 'Kelola akun guru dan penugasan wali kelas.'],
                ['id' => 'kelas', 'label' => 'Kelas', 'description' => 'Atur rombongan belajar dan wali kelas.'],
                ['id' => 'mata-pelajaran', 'label' => 'Mata Pelajaran', 'description' => 'Kelola daftar mata pelajaran sekolah.'],
                ['id' => 'tahun-ajaran', 'label' => 'Tahun Ajaran', 'description' => 'Atur tahun ajaran dan semester aktif.'],
                ['id' => 'jadwal', 'label' => 'Jadwal Pelajaran', 'description' => 'Kelola jadwal kelas dan guru pengajar.'],
                ['id' => 'spmb', 'label' => 'Pendaftaran SPMB', 'description' => 'Tinjau pendaftar dan status seleksi.'],
                ['id' => 'tagihan', 'label' => 'Tagihan', 'description' => 'Pantau tagihan sekolah dan status pembayaran.'],
                ['id' => 'ujian', 'label' => 'Ujian & Bank Soal', 'description' => 'Kelola ujian dan bank soal.'],
                ['id' => 'hasil-ujian', 'label' => 'Hasil Ujian', 'description' => 'Lihat hasil pengerjaan dan nilai siswa.'],
                ['id' => 'laporan', 'label' => 'Laporan', 'description' => 'Akses ringkasan data akademik sekolah.'],
            ],
        ]);
    }
}
