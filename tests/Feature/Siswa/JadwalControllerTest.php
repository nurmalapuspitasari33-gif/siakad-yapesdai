<?php

namespace Tests\Feature\Siswa;

use App\Models\Guru;
use App\Models\Jadwal;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class JadwalControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_only_sees_schedule_for_their_assigned_class(): void
    {
        $tahunAjaran = TahunAjaran::create([
            'nama_tahun' => '2026/2027',
            'semester' => 'ganjil',
            'is_aktif' => true,
        ]);
        $kelasSiswa = $this->createKelas($tahunAjaran, 'X IPA 1');
        $kelasLain = $this->createKelas($tahunAjaran, 'X IPA 2');
        $guruUser = User::factory()->create(['role' => 'guru']);
        $guru = Guru::create([
            'user_id' => $guruUser->id,
            'nip' => '19870001',
            'nama_lengkap' => 'Guru Matematika',
        ]);
        $mapel = MataPelajaran::create([
            'kode_mapel' => 'MAT-001',
            'nama_mapel' => 'Matematika',
        ]);
        $jadwalSiswa = $this->createJadwal($tahunAjaran, $kelasSiswa, $guru, $mapel);
        $this->createJadwal($tahunAjaran, $kelasLain, $guru, $mapel, 'selasa');
        $siswaUser = User::factory()->create(['role' => 'siswa']);
        Siswa::create([
            'user_id' => $siswaUser->id,
            'kelas_id' => $kelasSiswa->id,
            'nisn' => '4000000001',
            'nama_lengkap' => 'Siswa Aktif',
            'status_siswa' => 'aktif',
        ]);

        $this->actingAs($siswaUser)
            ->get(route('siswa.jadwal.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Siswa/Jadwal/Index')
                ->has('jadwals', 1)
                ->where('jadwals.0.id', $jadwalSiswa->id)
                ->where('jadwals.0.kelas', 'X IPA 1')
                ->where('jadwals.0.guru', 'Guru Matematika'));
    }

    public function test_candidate_student_does_not_receive_a_class_schedule(): void
    {
        $candidate = User::factory()->create(['role' => 'siswa']);
        Siswa::create([
            'user_id' => $candidate->id,
            'nisn' => '4000000002',
            'nama_lengkap' => 'Calon Siswa',
            'status_siswa' => 'calon_spmb',
        ]);

        $this->actingAs($candidate)
            ->get(route('siswa.jadwal.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Siswa/Jadwal/Index')
                ->has('jadwals', 0));
    }

    private function createKelas(TahunAjaran $tahunAjaran, string $namaKelas): Kelas
    {
        return Kelas::create([
            'tahun_ajaran_id' => $tahunAjaran->id,
            'nama_kelas' => $namaKelas,
            'tingkat' => 10,
        ]);
    }

    private function createJadwal(
        TahunAjaran $tahunAjaran,
        Kelas $kelas,
        Guru $guru,
        MataPelajaran $mapel,
        string $hari = 'senin',
    ): Jadwal {
        return Jadwal::create([
            'tahun_ajaran_id' => $tahunAjaran->id,
            'kelas_id' => $kelas->id,
            'mapel_id' => $mapel->id,
            'guru_id' => $guru->id,
            'hari' => $hari,
            'jam_mulai' => $hari === 'senin' ? '08:00' : '09:00',
            'jam_selesai' => $hari === 'senin' ? '09:00' : '10:00',
        ]);
    }
}
