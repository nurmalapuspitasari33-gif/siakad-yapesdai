<?php

namespace Tests\Feature\Guru;

use App\Models\Guru;
use App\Models\Jadwal;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\Nilai;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class NilaiControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_teacher_can_save_scores_for_an_assigned_class_and_subject(): void
    {
        $teacherUser = User::factory()->create(['role' => 'guru']);
        [$guru, $tahunAjaran, $kelas, $mapel, $student] = $this->createAssignment($teacherUser);

        $this->actingAs($teacherUser)
            ->get(route('guru.nilai.index', ['kelas_id' => $kelas->id, 'mapel_id' => $mapel->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Guru/Nilai/Index')
                ->has('siswas', 1)
                ->where('siswas.0.id', $student->id));

        $this->actingAs($teacherUser)
            ->post(route('guru.nilai.store'), [
                'kelas_id' => $kelas->id,
                'mapel_id' => $mapel->id,
                'nilai' => [[
                    'siswa_id' => $student->id,
                    'nilai_akhir' => 80,
                    'capaian_kompetensi' => 'Memahami konsep dengan baik.',
                ]],
            ])
            ->assertRedirect(route('guru.nilai.index', [
                'kelas_id' => $kelas->id,
                'mapel_id' => $mapel->id,
            ], absolute: false));

        $this->assertDatabaseHas('nilais', [
            'tahun_ajaran_id' => $tahunAjaran->id,
            'siswa_id' => $student->id,
            'mapel_id' => $mapel->id,
            'nilai_akhir' => 80,
            'capaian_kompetensi' => 'Memahami konsep dengan baik.',
        ]);
    }

    public function test_teacher_cannot_save_scores_for_an_unassigned_subject(): void
    {
        $teacherUser = User::factory()->create(['role' => 'guru']);
        [, , $kelas, , $student] = $this->createAssignment($teacherUser);
        $unassignedSubject = MataPelajaran::create([
            'kode_mapel' => 'BIN-001',
            'nama_mapel' => 'Bahasa Indonesia',
        ]);

        $this->actingAs($teacherUser)
            ->post(route('guru.nilai.store'), [
                'kelas_id' => $kelas->id,
                'mapel_id' => $unassignedSubject->id,
                'nilai' => [[
                    'siswa_id' => $student->id,
                    'nilai_akhir' => 80,
                ]],
            ])
            ->assertSessionHasErrors([
                'kelas_id' => 'Anda hanya dapat menginput nilai untuk kelas dan mata pelajaran yang Anda ampu.',
            ]);

        $this->assertDatabaseCount('nilais', 0);
    }

    public function test_teacher_updates_existing_scores_without_creating_a_duplicate(): void
    {
        $teacherUser = User::factory()->create(['role' => 'guru']);
        [, $tahunAjaran, $kelas, $mapel, $student] = $this->createAssignment($teacherUser);
        Nilai::create([
            'tahun_ajaran_id' => $tahunAjaran->id,
            'siswa_id' => $student->id,
            'mapel_id' => $mapel->id,
            'nilai_tugas' => 50,
            'nilai_uts' => 50,
            'nilai_uas' => 50,
            'nilai_akhir' => 50,
        ]);

        $this->actingAs($teacherUser)
            ->post(route('guru.nilai.store'), [
                'kelas_id' => $kelas->id,
                'mapel_id' => $mapel->id,
                'nilai' => [[
                    'siswa_id' => $student->id,
                    'nilai_akhir' => 90,
                    'capaian_kompetensi' => 'Menerapkan konsep secara mandiri.',
                    'sakit' => 99,
                    'status_kenaikan' => 'naik',
                ]],
            ])
            ->assertRedirect(route('guru.nilai.index', [
                'kelas_id' => $kelas->id,
                'mapel_id' => $mapel->id,
            ], absolute: false));

        $this->assertDatabaseCount('nilais', 1);
        $this->assertDatabaseHas('nilais', [
            'tahun_ajaran_id' => $tahunAjaran->id,
            'siswa_id' => $student->id,
            'mapel_id' => $mapel->id,
            'nilai_akhir' => 90,
            'nilai_tugas' => 50,
            'nilai_uts' => 50,
            'nilai_uas' => 50,
            'capaian_kompetensi' => 'Menerapkan konsep secara mandiri.',
        ]);
    }

    /**
     * @return array{Guru, TahunAjaran, Kelas, MataPelajaran, Siswa}
     */
    private function createAssignment(User $teacherUser): array
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
        $guru = Guru::create([
            'user_id' => $teacherUser->id,
            'nip' => '19870001',
            'nama_lengkap' => 'Guru Matematika',
        ]);
        $mapel = MataPelajaran::create([
            'kode_mapel' => 'MAT-001',
            'nama_mapel' => 'Matematika',
        ]);
        $studentUser = User::factory()->create(['role' => 'siswa']);
        $student = Siswa::create([
            'user_id' => $studentUser->id,
            'kelas_id' => $kelas->id,
            'nisn' => '0000000001',
            'nama_lengkap' => 'Siswa Aktif',
            'status_siswa' => 'aktif',
        ]);
        Jadwal::create([
            'tahun_ajaran_id' => $tahunAjaran->id,
            'kelas_id' => $kelas->id,
            'mapel_id' => $mapel->id,
            'guru_id' => $guru->id,
            'hari' => 'senin',
            'jam_mulai' => '08:00',
            'jam_selesai' => '09:00',
        ]);

        return [$guru, $tahunAjaran, $kelas, $mapel, $student];
    }
}
