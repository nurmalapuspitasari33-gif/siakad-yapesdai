<?php

namespace Tests\Feature\Dashboard;

use App\Models\Guru;
use App\Models\Jadwal;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\PresensiKelas;
use App\Models\Siswa;
use App\Models\Tagihan;
use App\Models\TahunAjaran;
use App\Models\Ujian;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SiswaDashboardControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_summarizes_today_schedule_attendance_exams_and_bills(): void
    {
        $this->travelTo('2026-11-18 10:00:00');
        $tahunAjaran = TahunAjaran::create([
            'nama_tahun' => '2026/2027',
            'semester' => 'ganjil',
            'is_aktif' => true,
        ]);
        $kelas = Kelas::create([
            'tahun_ajaran_id' => $tahunAjaran->id,
            'nama_kelas' => 'X IPA 1',
            'tingkat' => 10,
        ]);
        $siswaUser = User::factory()->create(['role' => 'siswa']);
        $siswa = Siswa::create([
            'user_id' => $siswaUser->id,
            'kelas_id' => $kelas->id,
            'nisn' => '0000000001',
            'nama_lengkap' => 'Siswa Aktif',
            'status_siswa' => 'aktif',
        ]);
        $guru = Guru::create([
            'user_id' => User::factory()->create(['role' => 'guru'])->id,
            'nip' => '19870001',
            'nama_lengkap' => 'Guru Pengampu',
        ]);
        $mapel = MataPelajaran::create([
            'kode_mapel' => 'MAT-001',
            'nama_mapel' => 'Matematika',
        ]);
        $todaySchedule = $this->createSchedule($tahunAjaran, $kelas, $guru, $mapel, 'rabu');
        $this->createSchedule($tahunAjaran, $kelas, $guru, $mapel, 'kamis');
        PresensiKelas::create([
            'jadwal_id' => $todaySchedule->id,
            'kelas_id' => $kelas->id,
            'mapel_id' => $mapel->id,
            'guru_id' => $guru->id,
            'siswa_id' => $siswa->id,
            'tanggal' => '2026-11-16',
            'status' => 'H',
        ]);
        PresensiKelas::create([
            'jadwal_id' => $todaySchedule->id,
            'kelas_id' => $kelas->id,
            'mapel_id' => $mapel->id,
            'guru_id' => $guru->id,
            'siswa_id' => $siswa->id,
            'tanggal' => '2026-11-17',
            'status' => 'A',
        ]);
        $todayExam = $this->createExam($kelas, $guru, $mapel, '2026-11-18 10:30:00');
        $this->createExam($kelas, $guru, $mapel, '2026-11-18 08:00:00');
        $this->createExam($kelas, $guru, $mapel, '2026-11-19 10:30:00');
        Tagihan::create([
            'siswa_id' => $siswa->id,
            'judul_tagihan' => 'SPP November 2026',
            'nominal' => 250000,
            'jatuh_tempo' => '2026-11-30',
            'status_bayar' => 'belum_lunas',
        ]);
        Tagihan::create([
            'siswa_id' => $siswa->id,
            'judul_tagihan' => 'SPP Oktober 2026',
            'nominal' => 250000,
            'jatuh_tempo' => '2026-10-30',
            'status_bayar' => 'lunas',
        ]);

        $this->actingAs($siswaUser)
            ->get(route('siswa.dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard/Siswa')
                ->where('hariIni', 'Rabu')
                ->has('jadwals', 1)
                ->where('jadwals.0.mata_pelajaran', 'Matematika')
                ->where('attendance.total_sesi', 2)
                ->where('attendance.persentase_kehadiran', 50)
                ->has('ujians', 1)
                ->where('ujians.0.id', $todayExam->id)
                ->where('tagihanSummary.belum_lunas', 1)
                ->where('tagihanSummary.lunas', 1));
    }

    private function createSchedule(
        TahunAjaran $tahunAjaran,
        Kelas $kelas,
        Guru $guru,
        MataPelajaran $mapel,
        string $hari,
    ): Jadwal {
        return Jadwal::create([
            'tahun_ajaran_id' => $tahunAjaran->id,
            'kelas_id' => $kelas->id,
            'mapel_id' => $mapel->id,
            'guru_id' => $guru->id,
            'hari' => $hari,
            'jam_mulai' => '08:00',
            'jam_selesai' => '09:00',
        ]);
    }

    private function createExam(Kelas $kelas, Guru $guru, MataPelajaran $mapel, string $waktuMulai): Ujian
    {
        return Ujian::create([
            'kelas_id' => $kelas->id,
            'guru_id' => $guru->id,
            'mapel_id' => $mapel->id,
            'judul_ujian' => 'Ujian Harian',
            'waktu_mulai' => $waktuMulai,
            'durasi_menit' => 60,
            'acak_soal' => false,
        ]);
    }
}
