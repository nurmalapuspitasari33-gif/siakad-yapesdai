<?php

namespace Tests\Feature\Guru;

use App\Models\Guru;
use App\Models\Jadwal;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PresensiControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_teacher_can_store_and_load_attendance_for_their_active_schedule(): void
    {
        [$teacher, $jadwal, $students] = $this->createSchedule();

        $this->actingAs($teacher)
            ->post(route('guru.presensi.store', $jadwal), [
                'tanggal' => '2026-11-18',
                'materi_jurnal' => 'Persamaan linear',
                'presensi' => [
                    ['siswa_id' => $students[0]->id, 'status' => 'H'],
                    ['siswa_id' => $students[1]->id, 'status' => 'S'],
                ],
            ])
            ->assertRedirect(route('guru.jadwal.index', absolute: false));

        $this->assertDatabaseCount('presensi_kelas', 2);
        $this->assertDatabaseHas('presensi_kelas', [
            'jadwal_id' => $jadwal->id,
            'kelas_id' => $jadwal->kelas_id,
            'mapel_id' => $jadwal->mapel_id,
            'guru_id' => $jadwal->guru_id,
            'siswa_id' => $students[1]->id,
            'tanggal' => '2026-11-18',
            'status' => 'S',
            'materi_jurnal' => 'Persamaan linear',
        ]);

        $this->actingAs($teacher)
            ->getJson(route('guru.presensi.show', $jadwal).'?tanggal=2026-11-18')
            ->assertOk()
            ->assertJsonPath('presensi.'.$students[0]->id, 'H')
            ->assertJsonPath('presensi.'.$students[1]->id, 'S')
            ->assertJsonPath('materi_jurnal', 'Persamaan linear');
    }

    public function test_teacher_cannot_store_attendance_for_an_unassigned_schedule_or_partial_roster(): void
    {
        [$teacher, $jadwal, $students] = $this->createSchedule();
        $otherTeacher = User::factory()->create(['role' => 'guru']);
        Guru::create([
            'user_id' => $otherTeacher->id,
            'nip' => '19870002',
            'nama_lengkap' => 'Guru Lain',
        ]);

        $this->actingAs($otherTeacher)
            ->post(route('guru.presensi.store', $jadwal), [
                'tanggal' => '2026-11-18',
                'presensi' => [['siswa_id' => $students[0]->id, 'status' => 'H']],
            ])
            ->assertNotFound();

        $this->actingAs($teacher)
            ->from(route('guru.jadwal.index'))
            ->post(route('guru.presensi.store', $jadwal), [
                'tanggal' => '2026-11-18',
                'presensi' => [['siswa_id' => $students[0]->id, 'status' => 'H']],
            ])
            ->assertRedirect(route('guru.jadwal.index'))
            ->assertSessionHasErrors('presensi');

        $this->assertDatabaseCount('presensi_kelas', 0);
    }

    public function test_teacher_cannot_submit_a_student_from_another_class(): void
    {
        [$teacher, $jadwal, $students] = $this->createSchedule();
        $otherClass = Kelas::create([
            'tahun_ajaran_id' => $jadwal->tahun_ajaran_id,
            'nama_kelas' => 'X IPA 2',
            'tingkat' => 10,
        ]);
        $otherUser = User::factory()->create(['role' => 'siswa']);
        $otherStudent = Siswa::create([
            'user_id' => $otherUser->id,
            'kelas_id' => $otherClass->id,
            'nisn' => '0000000003',
            'nama_lengkap' => 'Siswa Kelas Lain',
            'status_siswa' => 'aktif',
        ]);

        $this->actingAs($teacher)
            ->from(route('guru.jadwal.index'))
            ->post(route('guru.presensi.store', $jadwal), [
                'tanggal' => '2026-11-18',
                'presensi' => [
                    ['siswa_id' => $students[0]->id, 'status' => 'H'],
                    ['siswa_id' => $otherStudent->id, 'status' => 'A'],
                ],
            ])
            ->assertRedirect(route('guru.jadwal.index'))
            ->assertSessionHasErrors('presensi.1.siswa_id');
    }

    /**
     * @return array{User, Jadwal, array{Siswa, Siswa}}
     */
    private function createSchedule(): array
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
        $teacher = User::factory()->create(['role' => 'guru']);
        $guru = Guru::create([
            'user_id' => $teacher->id,
            'nip' => '19870001',
            'nama_lengkap' => 'Guru Matematika',
        ]);
        $mapel = MataPelajaran::create([
            'kode_mapel' => 'MAT-001',
            'nama_mapel' => 'Matematika',
        ]);
        $jadwal = Jadwal::create([
            'tahun_ajaran_id' => $tahunAjaran->id,
            'kelas_id' => $kelas->id,
            'mapel_id' => $mapel->id,
            'guru_id' => $guru->id,
            'hari' => 'senin',
            'jam_mulai' => '08:00',
            'jam_selesai' => '09:00',
        ]);
        $students = collect(['Siswa Satu', 'Siswa Dua'])->map(
            fn (string $nama, int $index): Siswa => Siswa::create([
                'user_id' => User::factory()->create(['role' => 'siswa'])->id,
                'kelas_id' => $kelas->id,
                'nisn' => '000000000'.($index + 1),
                'nama_lengkap' => $nama,
                'status_siswa' => 'aktif',
            ]),
        )->all();

        return [$teacher, $jadwal, $students];
    }
}
