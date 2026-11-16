<?php

namespace Tests\Feature\Guru;

use App\Models\Guru;
use App\Models\Jadwal;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class JadwalControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_teacher_only_sees_their_own_schedule_for_the_active_year(): void
    {
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
        $mapel = MataPelajaran::create([
            'kode_mapel' => 'MAT-001',
            'nama_mapel' => 'Matematika',
        ]);
        $guruSaya = $this->createGuru('19870001', 'Guru Saya');
        $guruLain = $this->createGuru('19870002', 'Guru Lain');
        $jadwalSaya = $this->createJadwal($tahunAjaran, $kelas, $guruSaya, $mapel);
        $this->createJadwal($tahunAjaran, $kelas, $guruLain, $mapel, 'selasa');

        $this->actingAs($guruSaya->user)
            ->get(route('guru.jadwal.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Guru/Jadwal/Index')
                ->has('jadwals', 1)
                ->where('jadwals.0.id', $jadwalSaya->id)
                ->where('jadwals.0.kelas', 'X IPA 1')
                ->where('jadwals.0.mata_pelajaran', 'Matematika'));
    }

    private function createGuru(string $nip, string $nama): Guru
    {
        $user = User::factory()->create(['role' => 'guru']);

        return Guru::create([
            'user_id' => $user->id,
            'nip' => $nip,
            'nama_lengkap' => $nama,
        ]);
    }

    private function createJadwal(
        TahunAjaran $tahunAjaran,
        Kelas $kelas,
        Guru $guru,
        MataPelajaran $mapel,
        string $hari = 'senin',
    ): Jadwal {
        static $counter = 0;
        $start = 8 + $counter++;

        return Jadwal::create([
            'tahun_ajaran_id' => $tahunAjaran->id,
            'kelas_id' => $kelas->id,
            'mapel_id' => $mapel->id,
            'guru_id' => $guru->id,
            'hari' => $hari,
            'jam_mulai' => sprintf('%02d:00', $start),
            'jam_selesai' => sprintf('%02d:00', $start + 1),
        ]);
    }
}
