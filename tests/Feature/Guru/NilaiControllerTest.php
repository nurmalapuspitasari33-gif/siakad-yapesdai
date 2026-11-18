<?php

namespace Tests\Feature\Guru;

use App\Models\Guru;
use App\Models\HasilUjian;
use App\Models\Jadwal;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\Nilai;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\Ujian;
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

    public function test_teacher_imports_only_empty_scores_unless_students_are_selected(): void
    {
        $teacherUser = User::factory()->create(['role' => 'guru']);
        [$guru, $tahunAjaran, $kelas, $mapel, $student] = $this->createAssignment($teacherUser);
        $secondStudent = Siswa::create([
            'user_id' => User::factory()->create(['role' => 'siswa'])->id,
            'kelas_id' => $kelas->id,
            'nisn' => '0000000002',
            'nama_lengkap' => 'Siswa Kedua',
            'status_siswa' => 'aktif',
        ]);
        $thirdStudent = Siswa::create([
            'user_id' => User::factory()->create(['role' => 'siswa'])->id,
            'kelas_id' => $kelas->id,
            'nisn' => '0000000003',
            'nama_lengkap' => 'Siswa Belum Selesai',
            'status_siswa' => 'aktif',
        ]);
        $ujian = Ujian::create([
            'mapel_id' => $mapel->id,
            'guru_id' => $guru->id,
            'kelas_id' => $kelas->id,
            'judul_ujian' => 'Ujian Matematika',
            'waktu_mulai' => '2026-11-18 08:00:00',
            'durasi_menit' => 60,
        ]);
        foreach ([
            [$student, 95, 'selesai'],
            [$secondStudent, 80, 'selesai'],
            [$thirdStudent, 100, 'sedang_mengerjakan'],
        ] as [$siswa, $score, $status]) {
            HasilUjian::create([
                'ujian_id' => $ujian->id,
                'siswa_id' => $siswa->id,
                'skor_akhir' => $score,
                'status_pengerjaan' => $status,
            ]);
        }
        Nilai::create([
            'tahun_ajaran_id' => $tahunAjaran->id,
            'siswa_id' => $student->id,
            'mapel_id' => $mapel->id,
            'nilai_tugas' => 50,
            'nilai_uts' => 50,
            'nilai_uas' => 50,
            'nilai_akhir' => 60,
        ]);

        $this->actingAs($teacherUser)
            ->get(route('guru.nilai.index', ['kelas_id' => $kelas->id, 'mapel_id' => $mapel->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('ujians', 1));

        $this->actingAs($teacherUser)
            ->post(route('guru.nilai.import-ujian'), [
                'kelas_id' => $kelas->id,
                'mapel_id' => $mapel->id,
                'ujian_id' => $ujian->id,
            ])
            ->assertRedirect(route('guru.nilai.index', [
                'kelas_id' => $kelas->id,
                'mapel_id' => $mapel->id,
            ], absolute: false));

        $this->assertDatabaseHas('nilais', [
            'siswa_id' => $student->id,
            'nilai_akhir' => 60,
            'nilai_tugas' => 50,
        ]);
        $this->assertDatabaseHas('nilais', [
            'tahun_ajaran_id' => $tahunAjaran->id,
            'siswa_id' => $secondStudent->id,
            'mapel_id' => $mapel->id,
            'nilai_akhir' => 80,
        ]);
        $this->assertDatabaseMissing('nilais', [
            'siswa_id' => $thirdStudent->id,
            'mapel_id' => $mapel->id,
        ]);

        $this->actingAs($teacherUser)
            ->post(route('guru.nilai.import-ujian'), [
                'kelas_id' => $kelas->id,
                'mapel_id' => $mapel->id,
                'ujian_id' => $ujian->id,
                'siswa_ids' => [$student->id],
            ])
            ->assertRedirect(route('guru.nilai.index', [
                'kelas_id' => $kelas->id,
                'mapel_id' => $mapel->id,
            ], absolute: false));

        $this->assertDatabaseHas('nilais', [
            'siswa_id' => $student->id,
            'nilai_akhir' => 95,
            'nilai_tugas' => 50,
        ]);
    }

    public function test_teacher_cannot_import_results_from_another_teachers_exam(): void
    {
        $teacherUser = User::factory()->create(['role' => 'guru']);
        [$guru, , $kelas, $mapel] = $this->createAssignment($teacherUser);
        $otherTeacher = Guru::create([
            'user_id' => User::factory()->create(['role' => 'guru'])->id,
            'nip' => '19870002',
            'nama_lengkap' => 'Guru Lain',
        ]);
        $ujian = Ujian::create([
            'mapel_id' => $mapel->id,
            'guru_id' => $otherTeacher->id,
            'kelas_id' => $kelas->id,
            'judul_ujian' => 'Ujian Lain',
            'waktu_mulai' => '2026-11-18 08:00:00',
            'durasi_menit' => 60,
        ]);

        $this->actingAs($teacherUser)
            ->post(route('guru.nilai.import-ujian'), [
                'kelas_id' => $kelas->id,
                'mapel_id' => $mapel->id,
                'ujian_id' => $ujian->id,
            ])
            ->assertNotFound();

        $this->assertDatabaseCount('nilais', 0);
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
