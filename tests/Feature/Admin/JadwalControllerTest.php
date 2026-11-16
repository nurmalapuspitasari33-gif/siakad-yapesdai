<?php

namespace Tests\Feature\Admin;

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

    public function test_admin_can_create_non_overlapping_periods_and_overlaps_are_rejected(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        [$tahunAjaran, $kelas, $guru, $mapel] = $this->createScheduleData();
        $this->createJadwal($tahunAjaran, $kelas, $guru, $mapel, '08:00', '09:00');

        $this->actingAs($admin)
            ->get(route('admin.jadwal.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Jadwal/Index')
                ->has('jadwals.data', 1)
                ->has('mapelOptions', 1));

        $baseInput = [
            'kelas_id' => $kelas->id,
            'mapel_id' => $mapel->id,
            'guru_id' => $guru->id,
            'hari' => 'senin',
        ];

        $this->actingAs($admin)
            ->post(route('admin.jadwal.store'), [
                ...$baseInput,
                'jam_mulai' => '09:00',
                'jam_selesai' => '10:00',
            ])
            ->assertRedirect(route('admin.jadwal.index', absolute: false));

        $this->actingAs($admin)
            ->post(route('admin.jadwal.store'), [
                ...$baseInput,
                'jam_mulai' => '08:30',
                'jam_selesai' => '09:30',
            ])
            ->assertSessionHasErrors('jam_mulai');

        $this->assertDatabaseCount('jadwals', 2);
    }

    private function createScheduleData(): array
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
        $user = User::factory()->create(['role' => 'guru']);
        $guru = Guru::create([
            'user_id' => $user->id,
            'nip' => '19870001',
            'nama_lengkap' => 'Guru Matematika',
        ]);
        $mapel = MataPelajaran::create([
            'kode_mapel' => 'MAT-001',
            'nama_mapel' => 'Matematika',
        ]);

        return [$tahunAjaran, $kelas, $guru, $mapel];
    }

    private function createJadwal(
        TahunAjaran $tahunAjaran,
        Kelas $kelas,
        Guru $guru,
        MataPelajaran $mapel,
        string $jamMulai,
        string $jamSelesai,
    ): Jadwal {
        return Jadwal::create([
            'tahun_ajaran_id' => $tahunAjaran->id,
            'kelas_id' => $kelas->id,
            'mapel_id' => $mapel->id,
            'guru_id' => $guru->id,
            'hari' => 'senin',
            'jam_mulai' => $jamMulai,
            'jam_selesai' => $jamSelesai,
        ]);
    }
}
