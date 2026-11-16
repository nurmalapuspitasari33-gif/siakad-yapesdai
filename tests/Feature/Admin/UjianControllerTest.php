<?php

namespace Tests\Feature\Admin;

use App\Models\Guru;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\Ujian;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Tests\TestCase;

class UjianControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_monitor_active_students_and_attempt_states(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        [$exam, $student] = $this->createExamData();
        $completedStudent = $this->createStudent($exam->kelas, '0000000002', 'Siswa Selesai');
        $waitingStudent = $this->createStudent($exam->kelas, '0000000003', 'Siswa Belum Mulai');

        $exam->hasilUjians()->create([
            'siswa_id' => $student->id,
            'jawaban_json' => ['1' => 'A'],
            'status_pengerjaan' => 'sedang_mengerjakan',
        ]);
        $exam->hasilUjians()->create([
            'siswa_id' => $completedStudent->id,
            'jawaban_json' => ['1' => 'B'],
            'skor_akhir' => 80,
            'status_pengerjaan' => 'selesai',
        ]);

        $this->actingAs($admin)
            ->get(route('admin.ujian.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Ujian/Index')
                ->where('selectedExam.id', $exam->id)
                ->where('statistics.totalPeserta', 3)
                ->where('statistics.sedangMengerjakan', 1)
                ->where('statistics.sudahSelesai', 1)
                ->where('statistics.belumMulai', 1)
                ->has('students', 3)
                ->where('students.0.status_pengerjaan', 'sedang_mengerjakan')
                ->where('students.1.status_pengerjaan', 'belum_mulai')
                ->where('students.2.status_pengerjaan', 'selesai'));
    }

    public function test_admin_can_reset_an_in_progress_exam_session(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        [$exam, $student] = $this->createExamData();
        $attempt = $exam->hasilUjians()->create([
            'siswa_id' => $student->id,
            'jawaban_json' => ['1' => 'A'],
            'status_pengerjaan' => 'sedang_mengerjakan',
        ]);

        $this->actingAs($admin)
            ->delete(route('admin.ujian.reset-session', [
                'ujian' => $exam->id,
                'siswa' => $student->id,
            ]))
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('hasil_ujians', ['id' => $attempt->id]);
    }

    public function test_completed_exam_session_cannot_be_reset(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        [$exam, $student] = $this->createExamData();
        $attempt = $exam->hasilUjians()->create([
            'siswa_id' => $student->id,
            'jawaban_json' => ['1' => 'A'],
            'skor_akhir' => 100,
            'status_pengerjaan' => 'selesai',
        ]);

        $this->actingAs($admin)
            ->delete(route('admin.ujian.reset-session', [
                'ujian' => $exam->id,
                'siswa' => $student->id,
            ]))
            ->assertConflict();

        $this->assertDatabaseHas('hasil_ujians', ['id' => $attempt->id]);
    }

    public function test_admin_can_filter_completed_results_and_export_them_as_xlsx(): void
    {
        $this->travelTo('2026-11-16 12:00:00');
        $admin = User::factory()->create(['role' => 'admin']);
        [$exam, $student] = $this->createExamData();
        $student->update(['nama_lengkap' => '=2+2']);
        $exam->hasilUjians()->create([
            'siswa_id' => $student->id,
            'jawaban_json' => ['1' => 'A'],
            'skor_akhir' => 80,
            'status_pengerjaan' => 'selesai',
        ]);

        $otherYear = TahunAjaran::create([
            'nama_tahun' => '2025/2026',
            'semester' => 'genap',
            'is_aktif' => false,
        ]);
        $otherClass = Kelas::create([
            'tahun_ajaran_id' => $otherYear->id,
            'nama_kelas' => 'IX IPA 1',
            'tingkat' => 9,
        ]);
        $otherStudent = $this->createStudent($otherClass, '0000000004', 'Siswa Tahun Lalu');
        $otherSubject = MataPelajaran::create([
            'kode_mapel' => 'BIN-001',
            'nama_mapel' => 'Bahasa Indonesia',
        ]);
        $otherExam = Ujian::create([
            'mapel_id' => $otherSubject->id,
            'guru_id' => $exam->guru_id,
            'kelas_id' => $otherClass->id,
            'judul_ujian' => 'Ujian Bahasa Indonesia',
            'waktu_mulai' => '2026-05-01 08:00:00',
            'durasi_menit' => 30,
            'acak_soal' => false,
        ]);
        $otherExam->hasilUjians()->create([
            'siswa_id' => $otherStudent->id,
            'jawaban_json' => ['1' => 'A'],
            'skor_akhir' => 100,
            'status_pengerjaan' => 'selesai',
        ]);

        $filters = [
            'tahun_ajaran_id' => $exam->kelas->tahun_ajaran_id,
            'kelas_id' => $exam->kelas_id,
            'mapel_id' => $exam->mapel_id,
        ];

        $this->actingAs($admin)
            ->get(route('admin.hasil-ujian.index', $filters))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Ujian/Results')
                ->where('filters.tahun_ajaran_id', (string) $filters['tahun_ajaran_id'])
                ->where('filters.kelas_id', (string) $filters['kelas_id'])
                ->where('filters.mapel_id', (string) $filters['mapel_id'])
                ->where('statistics.rataRata', 80)
                ->where('statistics.nilaiTertinggi', 80)
                ->where('statistics.nilaiTerendah', 80)
                ->has('hasilUjians.data', 1)
                ->where('hasilUjians.data.0.skor_akhir', '80.00'));

        $response = $this->actingAs($admin)
            ->get(route('admin.hasil-ujian.export', $filters))
            ->assertOk()
            ->assertDownload('hasil-ujian-20261116.xlsx')
            ->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            ->assertStreamed();

        $temporaryFile = tempnam(sys_get_temp_dir(), 'hasil-ujian-');
        file_put_contents($temporaryFile, $response->streamedContent());

        try {
            $spreadsheet = IOFactory::load($temporaryFile);
            $sheet = $spreadsheet->getActiveSheet();

            $this->assertSame('Ujian', $sheet->getCell('D1')->getValue());
            $this->assertSame('=2+2', $sheet->getCell('F2')->getValue());
            $this->assertSame(DataType::TYPE_STRING, $sheet->getCell('F2')->getDataType());
            $this->assertSame(80.0, $sheet->getCell('G2')->getValue());
            $this->assertSame(null, $sheet->getCell('D3')->getValue());

            $spreadsheet->disconnectWorksheets();
        } finally {
            unlink($temporaryFile);
        }
    }

    public function test_non_admin_cannot_open_admin_exam_pages_or_reset_sessions(): void
    {
        $teacher = User::factory()->create(['role' => 'guru']);
        [$exam, $student] = $this->createExamData();

        $this->actingAs($teacher)
            ->get(route('admin.ujian.index'))
            ->assertForbidden();

        $this->actingAs($teacher)
            ->get(route('admin.hasil-ujian.index'))
            ->assertForbidden();

        $this->actingAs($teacher)
            ->delete(route('admin.ujian.reset-session', [
                'ujian' => $exam->id,
                'siswa' => $student->id,
            ]))
            ->assertForbidden();
    }

    public function test_selected_class_must_belong_to_selected_school_year(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        [$exam] = $this->createExamData();
        $otherYear = TahunAjaran::create([
            'nama_tahun' => '2025/2026',
            'semester' => 'genap',
            'is_aktif' => false,
        ]);
        $otherClass = Kelas::create([
            'tahun_ajaran_id' => $otherYear->id,
            'nama_kelas' => 'IX IPA 1',
            'tingkat' => 9,
        ]);

        $this->actingAs($admin)
            ->from(route('admin.hasil-ujian.index'))
            ->get(route('admin.hasil-ujian.index', [
                'tahun_ajaran_id' => $exam->kelas->tahun_ajaran_id,
                'kelas_id' => $otherClass->id,
            ]))
            ->assertRedirect(route('admin.hasil-ujian.index'))
            ->assertSessionHasErrors([
                'kelas_id' => 'Kelas tidak termasuk tahun ajaran yang dipilih.',
            ]);
    }

    /**
     * @return array{Ujian, Siswa}
     */
    private function createExamData(): array
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
        $teacherUser = User::factory()->create(['role' => 'guru']);
        $guru = Guru::create([
            'user_id' => $teacherUser->id,
            'nip' => '19870001',
            'nama_lengkap' => 'Guru Matematika',
        ]);
        $mapel = MataPelajaran::create([
            'kode_mapel' => 'MAT-001',
            'nama_mapel' => 'Matematika',
        ]);
        $student = $this->createStudent($kelas, '0000000001', 'Siswa Aktif');
        $exam = Ujian::create([
            'mapel_id' => $mapel->id,
            'guru_id' => $guru->id,
            'kelas_id' => $kelas->id,
            'judul_ujian' => 'Ujian Matematika',
            'waktu_mulai' => '2026-11-15 01:00:00',
            'durasi_menit' => 30,
            'acak_soal' => false,
        ]);

        return [$exam, $student];
    }

    private function createStudent(Kelas $kelas, string $nisn, string $name): Siswa
    {
        $studentUser = User::factory()->create(['role' => 'siswa']);

        return Siswa::create([
            'user_id' => $studentUser->id,
            'kelas_id' => $kelas->id,
            'nisn' => $nisn,
            'nama_lengkap' => $name,
            'status_siswa' => 'aktif',
        ]);
    }
}
