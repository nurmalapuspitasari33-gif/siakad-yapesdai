<?php

namespace Tests\Feature\Siswa;

use App\Models\BankSoal;
use App\Models\Guru;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\Ujian;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class UjianControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_resume_an_active_exam_and_server_scores_submitted_answers(): void
    {
        $this->travelTo('2026-11-15 01:00:00');
        [$studentUser, $student, $exam] = $this->createExam();
        $questionOne = $this->createQuestion($exam, 'A');
        $questionTwo = $this->createQuestion($exam, 'E');

        $this->actingAs($studentUser)
            ->post(route('siswa.ujian.start', $exam))
            ->assertRedirect(route('siswa.ujian.show', $exam, absolute: false));

        $this->actingAs($studentUser)
            ->get(route('siswa.ujian.show', $exam))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('questions.1.opsi.E', 'Lima'));

        $this->actingAs($studentUser)
            ->patch(route('siswa.ujian.save-answer', $exam), [
                'question_id' => $questionTwo->id,
                'answer' => 'E',
            ])
            ->assertOk()
            ->assertJson(['saved' => true]);

        $this->actingAs($studentUser)
            ->get(route('siswa.ujian.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Siswa/Ujian/Index')
                ->has('ujians', 1)
                ->where('ujians.0.dapat_dilanjutkan', true));

        $this->actingAs($studentUser)
            ->post(route('siswa.ujian.finish', $exam), [
                'jawaban' => [
                    (string) $questionOne->id => 'A',
                    (string) $questionTwo->id => 'E',
                ],
            ])
            ->assertRedirect(route('siswa.ujian.show', $exam, absolute: false));

        $this->assertDatabaseHas('hasil_ujians', [
            'ujian_id' => $exam->id,
            'siswa_id' => $student->id,
            'skor_akhir' => 100,
            'status_pengerjaan' => 'selesai',
        ]);
    }

    public function test_student_cannot_start_an_exam_before_its_scheduled_time(): void
    {
        $this->travelTo('2026-11-15 00:59:59');
        [$studentUser, $student, $exam] = $this->createExam();
        $this->createQuestion($exam, 'A');

        $this->actingAs($studentUser)
            ->post(route('siswa.ujian.start', $exam))
            ->assertForbidden();

        $this->assertDatabaseMissing('hasil_ujians', [
            'ujian_id' => $exam->id,
            'siswa_id' => $student->id,
        ]);
    }

    public function test_student_can_submit_weighted_akm_answers_and_receive_an_automatic_score(): void
    {
        $this->travelTo('2026-11-15 01:00:00');
        [$studentUser, $student, $exam] = $this->createExam();
        $exam->update(['mode_ujian' => 'akm']);
        $complex = $exam->bankSoals()->create([
            'pertanyaan' => 'Pilih dua jawaban benar.',
            'opsi_a' => '',
            'opsi_b' => '',
            'opsi_c' => '',
            'opsi_d' => '',
            'opsi_e' => '',
            'kunci_jawaban' => 'A',
            'tipe_soal' => 'pg_kompleks',
            'bobot' => 2,
            'opsi_json' => ['opsi' => ['A', 'B', 'C'], 'kunci_jawaban' => ['0', '2']],
        ]);
        $matching = $exam->bankSoals()->create([
            'pertanyaan' => 'Pasangkan.',
            'opsi_a' => '',
            'opsi_b' => '',
            'opsi_c' => '',
            'opsi_d' => '',
            'opsi_e' => '',
            'kunci_jawaban' => 'A',
            'tipe_soal' => 'menjodohkan',
            'bobot' => 3,
            'opsi_json' => [
                'pasangan_kiri' => ['Satu', 'Dua'],
                'pasangan_kanan' => ['B', 'A'],
                'kunci_jawaban' => ['1', '0'],
            ],
        ]);
        $shortAnswer = $exam->bankSoals()->create([
            'pertanyaan' => 'Isi jawaban singkat.',
            'opsi_a' => '',
            'opsi_b' => '',
            'opsi_c' => '',
            'opsi_d' => '',
            'opsi_e' => '',
            'kunci_jawaban' => 'A',
            'tipe_soal' => 'isian_singkat',
            'bobot' => 1,
            'opsi_json' => ['kunci_jawaban' => ['Benar', 'Tepat']],
        ]);
        $essay = $exam->bankSoals()->create([
            'pertanyaan' => 'Jelaskan.',
            'opsi_a' => '',
            'opsi_b' => '',
            'opsi_c' => '',
            'opsi_d' => '',
            'opsi_e' => '',
            'kunci_jawaban' => 'A',
            'tipe_soal' => 'esai',
            'bobot' => 4,
        ]);

        $this->actingAs($studentUser)
            ->post(route('siswa.ujian.start', $exam))
            ->assertRedirect(route('siswa.ujian.show', $exam, absolute: false));

        $this->actingAs($studentUser)
            ->get(route('siswa.ujian.show', $exam))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('questions.0.tipe_soal', 'pg_kompleks')
                ->missing('questions.0.opsi_json.kunci_jawaban'));

        foreach ([
            [$complex, ['0', '2']],
            [$matching, ['0' => '1', '1' => '0']],
            [$shortAnswer, ' BENAR '],
            [$essay, 'Uraian siswa.'],
        ] as [$question, $answer]) {
            $this->actingAs($studentUser)
                ->patch(route('siswa.ujian.save-answer', $exam), [
                    'question_id' => $question->id,
                    'answer' => $answer,
                ])
                ->assertOk()
                ->assertJson(['saved' => true]);
        }

        $this->actingAs($studentUser)
            ->post(route('siswa.ujian.finish', $exam))
            ->assertRedirect(route('siswa.ujian.show', $exam, absolute: false));

        $this->assertDatabaseHas('hasil_ujians', [
            'ujian_id' => $exam->id,
            'siswa_id' => $student->id,
            'skor_akhir' => 60,
            'status_pengerjaan' => 'selesai',
        ]);
    }

    public function test_reaching_the_violation_limit_finishes_the_exam_and_records_audit_notes(): void
    {
        $this->travelTo('2026-11-15 01:00:00');
        [$studentUser, $student, $exam] = $this->createExam();
        $exam->update(['maks_pelanggaran' => 2]);
        $question = $this->createQuestion($exam, 'A');

        $this->actingAs($studentUser)
            ->post(route('siswa.ujian.start', $exam))
            ->assertRedirect(route('siswa.ujian.show', $exam, absolute: false));

        $this->actingAs($studentUser)
            ->patch(route('siswa.ujian.save-answer', $exam), [
                'question_id' => $question->id,
                'answer' => 'A',
            ])
            ->assertOk();

        $this->actingAs($studentUser)
            ->postJson(route('siswa.ujian.violation', $exam), ['reason' => 'blur'])
            ->assertOk()
            ->assertJson(['jumlah_pelanggaran' => 1, 'finished' => false]);

        $this->actingAs($studentUser)
            ->postJson(route('siswa.ujian.violation', $exam), ['reason' => 'visibility'])
            ->assertOk()
            ->assertJson(['jumlah_pelanggaran' => 2, 'finished' => true]);

        $attempt = $exam->hasilUjians()->where('siswa_id', $student->id)->firstOrFail();
        $this->assertSame(2, $attempt->jumlah_pelanggaran);
        $this->assertSame('selesai', $attempt->status_pengerjaan);
        $this->assertSame('100.00', $attempt->skor_akhir);
        $this->assertStringContainsString('Berpindah tab atau aplikasi', $attempt->catatan_pelanggaran);
    }

    /**
     * @return array{User, Siswa, Ujian}
     */
    private function createExam(): array
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
        $studentUser = User::factory()->create(['role' => 'siswa']);
        $student = Siswa::create([
            'user_id' => $studentUser->id,
            'kelas_id' => $kelas->id,
            'nisn' => '0000000001',
            'nama_lengkap' => 'Siswa Aktif',
            'status_siswa' => 'aktif',
        ]);
        $exam = Ujian::create([
            'mapel_id' => $mapel->id,
            'guru_id' => $guru->id,
            'kelas_id' => $kelas->id,
            'judul_ujian' => 'Ujian Matematika',
            'waktu_mulai' => '2026-11-15 01:00:00',
            'durasi_menit' => 30,
            'acak_soal' => false,
        ]);

        return [$studentUser, $student, $exam];
    }

    private function createQuestion(Ujian $exam, string $answer): BankSoal
    {
        return $exam->bankSoals()->create([
            'pertanyaan' => 'Berapakah hasil perhitungan?',
            'opsi_a' => 'Satu',
            'opsi_b' => 'Dua',
            'opsi_c' => 'Tiga',
            'opsi_d' => 'Empat',
            'opsi_e' => 'Lima',
            'kunci_jawaban' => $answer,
        ]);
    }
}
