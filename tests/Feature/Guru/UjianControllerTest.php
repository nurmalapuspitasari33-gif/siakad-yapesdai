<?php

namespace Tests\Feature\Guru;

use App\Models\BankSoal;
use App\Models\Guru;
use App\Models\Jadwal;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\Ujian;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Tests\TestCase;

class UjianControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_teacher_can_create_an_exam_and_its_multiple_choice_question(): void
    {
        $this->travelTo('2026-11-15 01:00:00');
        $teacherUser = User::factory()->create(['role' => 'guru']);
        [$kelas, $mapel] = $this->createAssignment($teacherUser);

        $this->actingAs($teacherUser)
            ->post(route('guru.ujian.store'), [
                'kelas_id' => $kelas->id,
                'mapel_id' => $mapel->id,
                'judul_ujian' => 'Ujian Tengah Semester',
                'waktu_mulai' => '2026-11-16T08:00',
                'durasi_menit' => 60,
                'acak_soal' => true,
            ])
            ->assertRedirect(route('guru.ujian.index', absolute: false));

        $this->assertDatabaseHas('ujians', [
            'kelas_id' => $kelas->id,
            'mapel_id' => $mapel->id,
            'judul_ujian' => 'Ujian Tengah Semester',
            'durasi_menit' => 60,
            'acak_soal' => true,
        ]);

        $examId = Ujian::query()->where('judul_ujian', 'Ujian Tengah Semester')->value('id');

        $this->actingAs($teacherUser)
            ->post(route('guru.ujian.soal.store', $examId), [
                'pertanyaan' => 'Berapakah 2 + 2?',
                'opsi_a' => '3',
                'opsi_b' => '4',
                'opsi_c' => '5',
                'opsi_d' => '6',
                'opsi_e' => '7',
                'kunci_jawaban' => 'E',
            ])
            ->assertRedirect(route('guru.ujian.index', absolute: false));

        $this->assertDatabaseHas('bank_soals', [
            'ujian_id' => $examId,
            'pertanyaan' => 'Berapakah 2 + 2?',
            'opsi_e' => '7',
            'kunci_jawaban' => 'E',
        ]);
    }

    public function test_teacher_can_create_akm_exam_and_upload_question_image(): void
    {
        $this->travelTo('2026-11-15 01:00:00');
        Storage::fake('public');
        $teacherUser = User::factory()->create(['role' => 'guru']);
        [$kelas, $mapel] = $this->createAssignment($teacherUser);

        $this->actingAs($teacherUser)
            ->post(route('guru.ujian.store'), [
                'kelas_id' => $kelas->id,
                'mapel_id' => $mapel->id,
                'judul_ujian' => 'Asesmen AKM',
                'waktu_mulai' => '2026-11-16T08:00',
                'durasi_menit' => 60,
                'acak_soal' => false,
                'mode_ujian' => 'akm',
                'maks_pelanggaran' => 2,
            ])
            ->assertRedirect(route('guru.ujian.index', absolute: false));

        $exam = Ujian::query()->where('judul_ujian', 'Asesmen AKM')->firstOrFail();
        $this->actingAs($teacherUser)
            ->post(route('guru.ujian.soal.store', $exam), [
                'tipe_soal' => 'pg_kompleks',
                'bobot' => 3,
                'pertanyaan' => 'Pilih pernyataan yang benar.',
                'opsi_json' => [
                    'opsi' => ['Pernyataan A', 'Pernyataan B', 'Pernyataan C'],
                    'kunci_jawaban' => ['0', '2'],
                ],
                'gambar_soal' => UploadedFile::fake()->image('pertanyaan.png'),
            ])
            ->assertRedirect(route('guru.ujian.index', absolute: false));

        $question = BankSoal::query()->where('ujian_id', $exam->id)->firstOrFail();
        $this->assertSame('akm', $exam->mode_ujian);
        $this->assertSame(2, $exam->maks_pelanggaran);
        $this->assertSame('pg_kompleks', $question->tipe_soal);
        $this->assertSame(3, $question->bobot);
        $this->assertSame(['0', '2'], $question->opsi_json['kunci_jawaban']);
        $this->assertTrue(Storage::disk('public')->exists($question->gambar_soal));
    }

    public function test_teacher_can_add_each_question_type_with_the_question_form_default_payload(): void
    {
        $this->travelTo('2026-11-15 01:00:00');
        Storage::fake('public');
        $teacherUser = User::factory()->create(['role' => 'guru']);
        [$kelas, $mapel] = $this->createAssignment($teacherUser);
        $exam = Ujian::create([
            'mapel_id' => $mapel->id,
            'guru_id' => $teacherUser->guru->id,
            'kelas_id' => $kelas->id,
            'judul_ujian' => 'Ujian Seluruh Tipe',
            'waktu_mulai' => '2026-11-16 08:00:00',
            'durasi_menit' => 60,
            'acak_soal' => false,
            'mode_ujian' => 'akm',
        ]);
        $formDefaults = [
            'bobot' => '1',
            'pertanyaan' => 'Pertanyaan',
            'opsi_a' => '',
            'opsi_b' => '',
            'opsi_c' => '',
            'opsi_d' => '',
            'opsi_e' => '',
            'kunci_jawaban' => 'A',
            'opsi_json' => [
                'opsi' => ['', '', '', '', ''],
                'pasangan_kiri' => ['', '', ''],
                'pasangan_kanan' => ['', '', ''],
                'kunci_jawaban' => [],
            ],
        ];
        $typeSpecificData = [
            'pg' => [
                'opsi_a' => 'A',
                'opsi_b' => 'B',
                'opsi_c' => 'C',
                'opsi_d' => 'D',
                'opsi_e' => 'E',
            ],
            'pg_kompleks' => [
                'opsi_json' => [
                    'opsi' => [
                        'Pernyataan satu',
                        'Pernyataan dua',
                        'Pernyataan tiga',
                        'Pernyataan empat',
                        'Pernyataan lima',
                    ],
                    'kunci_jawaban' => ['0'],
                ],
            ],
            'menjodohkan' => [
                'opsi_json' => [
                    'pasangan_kiri' => ['Kiri satu', 'Kiri dua', 'Kiri tiga'],
                    'pasangan_kanan' => ['Kanan satu', 'Kanan dua', 'Kanan tiga'],
                    'kunci_jawaban' => ['1', '0', '2'],
                ],
            ],
            'isian_singkat' => [
                'opsi_json' => ['kunci_jawaban' => ['jawaban benar']],
            ],
            'esai' => [
                'gambar_soal' => UploadedFile::fake()->image('gambar-esai.png'),
            ],
        ];

        foreach ($typeSpecificData as $type => $specificData) {
            $payload = array_replace_recursive($formDefaults, [
                'tipe_soal' => $type,
                'pertanyaan' => "Pertanyaan {$type}",
            ], $specificData);

            $this->actingAs($teacherUser)
                ->post(route('guru.ujian.soal.store', $exam), $payload)
                ->assertRedirectToRoute('guru.ujian.index')
                ->assertSessionHas('success');

            $this->assertDatabaseHas('bank_soals', [
                'ujian_id' => $exam->id,
                'tipe_soal' => $type,
                'pertanyaan' => "Pertanyaan {$type}",
            ]);
        }

        $essay = BankSoal::query()->where('ujian_id', $exam->id)->where('tipe_soal', 'esai')->firstOrFail();
        $this->assertTrue(Storage::disk('public')->exists($essay->gambar_soal));
        $this->assertNull($essay->gambar_a);

        $this->actingAs($teacherUser)
            ->get(route('guru.ujian.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('ujians.0.bank_soals', 5)
                ->where('ujians.0.bank_soals.4.tipe_soal', 'esai'));
    }

    public function test_matching_question_requires_at_least_three_pairs(): void
    {
        $teacherUser = User::factory()->create(['role' => 'guru']);
        [$kelas, $mapel] = $this->createAssignment($teacherUser);
        $exam = Ujian::create([
            'mapel_id' => $mapel->id,
            'guru_id' => $teacherUser->guru->id,
            'kelas_id' => $kelas->id,
            'judul_ujian' => 'Ujian Menjodohkan',
            'waktu_mulai' => now()->addDay(),
            'durasi_menit' => 60,
            'acak_soal' => false,
            'mode_ujian' => 'akm',
        ]);

        $this->actingAs($teacherUser)
            ->post(route('guru.ujian.soal.store', $exam), [
                'tipe_soal' => 'menjodohkan',
                'pertanyaan' => 'Pasangkan item.',
                'opsi_json' => [
                    'pasangan_kiri' => ['Kiri satu', 'Kiri dua'],
                    'pasangan_kanan' => ['Kanan satu', 'Kanan dua'],
                    'kunci_jawaban' => ['0', '1'],
                ],
            ])
            ->assertSessionHasErrors('opsi_json.pasangan_kiri');

        $this->assertDatabaseCount('bank_soals', 0);
    }

    public function test_teacher_cannot_schedule_an_exam_for_an_unassigned_class_and_subject(): void
    {
        $this->travelTo('2026-11-15 01:00:00');
        $teacherUser = User::factory()->create(['role' => 'guru']);
        [, $mapel] = $this->createAssignment($teacherUser);
        $unassignedClass = Kelas::create([
            'tahun_ajaran_id' => TahunAjaran::query()->value('id'),
            'nama_kelas' => 'X IPA 2',
            'tingkat' => 10,
        ]);

        $this->actingAs($teacherUser)
            ->post(route('guru.ujian.store'), [
                'kelas_id' => $unassignedClass->id,
                'mapel_id' => $mapel->id,
                'judul_ujian' => 'Ujian Tidak Diampu',
                'waktu_mulai' => '2026-11-16T08:00',
                'durasi_menit' => 60,
                'acak_soal' => false,
            ])
            ->assertSessionHasErrors([
                'kelas_id' => 'Ujian hanya dapat dibuat untuk kelas dan mata pelajaran yang Anda ampu pada tahun ajaran aktif.',
            ]);

        $this->assertDatabaseCount('ujians', 0);
    }

    public function test_teacher_can_reschedule_an_exam_after_students_have_completed_it(): void
    {
        $this->travelTo('2026-11-15 00:00:00');
        $teacherUser = User::factory()->create(['role' => 'guru']);
        [$kelas, $mapel] = $this->createAssignment($teacherUser);
        $exam = Ujian::create([
            'mapel_id' => $mapel->id,
            'guru_id' => $teacherUser->guru->id,
            'kelas_id' => $kelas->id,
            'judul_ujian' => 'Ujian Matematika',
            'waktu_mulai' => '2026-11-15 01:00:00',
            'durasi_menit' => 60,
            'acak_soal' => false,
        ]);
        $student = $this->createStudent($kelas, '0000000015', 'Siswa Uji');
        $attempt = $exam->hasilUjians()->create([
            'siswa_id' => $student->id,
            'jawaban_json' => ['1' => 'A'],
            'skor_akhir' => 80,
            'status_pengerjaan' => 'selesai',
        ]);

        $this->actingAs($teacherUser)
            ->put(route('guru.ujian.update', $exam), [
                'kelas_id' => $kelas->id,
                'mapel_id' => $mapel->id,
                'judul_ujian' => 'Ujian Matematika Susulan',
                'waktu_mulai' => '2026-11-16T08:00',
                'durasi_menit' => 90,
                'acak_soal' => true,
            ])
            ->assertRedirectToRoute('guru.ujian.index')
            ->assertSessionHas('success', 'Jadwal ujian berhasil diperbarui.');

        $this->assertDatabaseHas('ujians', [
            'id' => $exam->id,
            'judul_ujian' => 'Ujian Matematika Susulan',
            'waktu_mulai' => '2026-11-16 01:00:00',
            'durasi_menit' => 90,
            'acak_soal' => true,
        ]);
        $this->assertModelExists($attempt);
    }

    public function test_teacher_can_edit_a_past_exam_without_changing_its_start_time(): void
    {
        $this->travelTo('2026-11-18 21:00:00');
        $teacherUser = User::factory()->create(['role' => 'guru']);
        [$kelas, $mapel] = $this->createAssignment($teacherUser);
        $exam = Ujian::create([
            'mapel_id' => $mapel->id,
            'guru_id' => $teacherUser->guru->id,
            'kelas_id' => $kelas->id,
            'judul_ujian' => 'Ujian Matematika',
            'waktu_mulai' => '2026-11-15 01:00:00',
            'durasi_menit' => 60,
            'acak_soal' => false,
        ]);

        $this->actingAs($teacherUser)
            ->put(route('guru.ujian.update', $exam), [
                'kelas_id' => $kelas->id,
                'mapel_id' => $mapel->id,
                'judul_ujian' => 'Judul Diperbaiki',
                'waktu_mulai' => $exam->waktu_mulai->copy()->setTimezone('Asia/Jakarta')->format('Y-m-d\TH:i'),
                'durasi_menit' => 60,
                'acak_soal' => false,
            ])
            ->assertRedirectToRoute('guru.ujian.index')
            ->assertSessionHas('success', 'Jadwal ujian berhasil diperbarui.');

        $this->assertDatabaseHas('ujians', [
            'id' => $exam->id,
            'judul_ujian' => 'Judul Diperbaiki',
        ]);
    }

    public function test_teacher_cannot_change_exam_mode_after_questions_are_added(): void
    {
        $teacherUser = User::factory()->create(['role' => 'guru']);
        [$kelas, $mapel] = $this->createAssignment($teacherUser);
        $exam = Ujian::create([
            'mapel_id' => $mapel->id,
            'guru_id' => $teacherUser->guru->id,
            'kelas_id' => $kelas->id,
            'judul_ujian' => 'Ujian Matematika',
            'waktu_mulai' => now()->addDay(),
            'durasi_menit' => 60,
            'acak_soal' => false,
            'mode_ujian' => 'normal',
        ]);
        $exam->bankSoals()->create([
            'pertanyaan' => 'Berapakah 2 + 2?',
            'opsi_a' => '3',
            'opsi_b' => '4',
            'opsi_c' => '5',
            'opsi_d' => '6',
            'opsi_e' => '7',
            'kunci_jawaban' => 'B',
            'tipe_soal' => 'pg',
            'bobot' => 1,
        ]);

        $this->actingAs($teacherUser)
            ->put(route('guru.ujian.update', $exam), [
                'kelas_id' => $kelas->id,
                'mapel_id' => $mapel->id,
                'judul_ujian' => $exam->judul_ujian,
                'waktu_mulai' => $exam->waktu_mulai->copy()->setTimezone('Asia/Jakarta')->format('Y-m-d\TH:i'),
                'durasi_menit' => $exam->durasi_menit,
                'acak_soal' => false,
                'mode_ujian' => 'akm',
            ])
            ->assertSessionHasErrors('mode_ujian');

        $this->assertDatabaseHas('ujians', [
            'id' => $exam->id,
            'mode_ujian' => 'normal',
        ]);
    }

    public function test_teacher_can_delete_an_exam_with_attempts_and_questions(): void
    {
        $teacherUser = User::factory()->create(['role' => 'guru']);
        [$kelas, $mapel] = $this->createAssignment($teacherUser);
        $exam = Ujian::create([
            'mapel_id' => $mapel->id,
            'guru_id' => $teacherUser->guru->id,
            'kelas_id' => $kelas->id,
            'judul_ujian' => 'Ujian Matematika',
            'waktu_mulai' => '2026-11-15 01:00:00',
            'durasi_menit' => 60,
            'acak_soal' => false,
        ]);
        $student = $this->createStudent($kelas, '0000000016', 'Siswa Uji');

        $question = BankSoal::create([
            'ujian_id' => $exam->id,
            'pertanyaan' => 'Berapakah 2 + 2?',
            'opsi_a' => '3',
            'opsi_b' => '4',
            'opsi_c' => '5',
            'opsi_d' => '6',
            'opsi_e' => '7',
            'kunci_jawaban' => 'B',
        ]);
        $attempt = $exam->hasilUjians()->create([
            'siswa_id' => $student->id,
            'jawaban_json' => ['1' => 'B'],
            'skor_akhir' => 100,
            'status_pengerjaan' => 'selesai',
        ]);

        $this->actingAs($teacherUser)
            ->delete(route('guru.ujian.destroy', $exam))
            ->assertRedirectToRoute('guru.ujian.index')
            ->assertSessionHas('success', 'Ujian beserta bank soal dan riwayat pengerjaannya berhasil dihapus.');

        $this->assertModelMissing($exam);
        $this->assertDatabaseMissing('bank_soals', ['id' => $question->id]);
        $this->assertDatabaseMissing('hasil_ujians', ['id' => $attempt->id]);
    }

    public function test_teacher_results_overview_lists_owned_exams_without_result_sessions(): void
    {
        $teacherUser = User::factory()->create(['role' => 'guru']);
        [$kelas, $mapel] = $this->createAssignment($teacherUser);
        $exam = Ujian::create([
            'mapel_id' => $mapel->id,
            'guru_id' => $teacherUser->guru->id,
            'kelas_id' => $kelas->id,
            'judul_ujian' => 'Ujian Tanpa Sesi',
            'waktu_mulai' => '2026-11-16 08:00:00',
            'durasi_menit' => 60,
            'acak_soal' => false,
        ]);
        $otherTeacher = User::factory()->create(['role' => 'guru']);
        $otherGuru = Guru::create([
            'user_id' => $otherTeacher->id,
            'nip' => '19870002',
            'nama_lengkap' => 'Guru Lain',
        ]);
        Ujian::create([
            'mapel_id' => $mapel->id,
            'guru_id' => $otherGuru->id,
            'kelas_id' => $kelas->id,
            'judul_ujian' => 'Ujian Guru Lain',
            'waktu_mulai' => '2026-11-16 09:00:00',
            'durasi_menit' => 60,
            'acak_soal' => false,
        ]);

        $this->actingAs($teacherUser)
            ->get(route('guru.hasil-ujian.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Guru/Ujian/ResultsIndex')
                ->where('ujians.total', 1)
                ->has('ujians.data', 1)
                ->where('ujians.data.0.id', $exam->id)
                ->where('ujians.data.0.judul_ujian', 'Ujian Tanpa Sesi')
                ->where('ujians.data.0.hasil_ujians_count', 0));
    }

    public function test_teacher_can_view_export_and_reset_exam_results_for_their_class(): void
    {
        $this->travelTo('2026-11-16 12:00:00');
        $teacherUser = User::factory()->create(['role' => 'guru']);
        [$kelas, $mapel] = $this->createAssignment($teacherUser);
        $exam = Ujian::create([
            'mapel_id' => $mapel->id,
            'guru_id' => $teacherUser->guru->id,
            'kelas_id' => $kelas->id,
            'judul_ujian' => 'Ujian Hasil Matematika',
            'waktu_mulai' => '2026-11-16 08:00:00',
            'durasi_menit' => 60,
            'acak_soal' => false,
        ]);
        $workingStudent = $this->createStudent($kelas, '0000000011', 'A Siswa Aktif');
        $completedStudent = $this->createStudent($kelas, '=2+2', 'B Siswa Selesai');
        $waitingStudent = $this->createStudent($kelas, '0000000013', 'C Siswa Belum Mulai');
        $workingAttempt = $exam->hasilUjians()->create([
            'siswa_id' => $workingStudent->id,
            'jawaban_json' => ['1' => 'A'],
            'status_pengerjaan' => 'sedang_mengerjakan',
        ]);
        $completedAttempt = $exam->hasilUjians()->create([
            'siswa_id' => $completedStudent->id,
            'jawaban_json' => ['1' => 'B'],
            'skor_akhir' => 84,
            'status_pengerjaan' => 'selesai',
        ]);

        $this->actingAs($teacherUser)
            ->get(route('guru.ujian.hasil', $exam))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Guru/Ujian/Results')
                ->where('ujian.id', $exam->id)
                ->has('students', 3)
                ->where('students.0.status_pengerjaan', 'sedang_mengerjakan')
                ->where('students.1.status_pengerjaan', 'selesai')
                ->where('students.1.skor_akhir', '84.00')
                ->where('students.2.status_pengerjaan', 'belum_mulai'));

        $response = $this->actingAs($teacherUser)
            ->get(route('guru.ujian.hasil.export', $exam))
            ->assertOk()
            ->assertDownload("hasil-ujian-{$exam->id}-20261116.xlsx")
            ->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            ->assertStreamed();

        $temporaryFile = tempnam(sys_get_temp_dir(), 'hasil-ujian-guru-');
        file_put_contents($temporaryFile, $response->streamedContent());

        try {
            $spreadsheet = IOFactory::load($temporaryFile);
            $sheet = $spreadsheet->getActiveSheet();

            $this->assertSame('Nama', $sheet->getCell('A1')->getValue());
            $this->assertSame('=2+2', $sheet->getCell('B3')->getValue());
            $this->assertSame(DataType::TYPE_STRING, $sheet->getCell('B3')->getDataType());
            $this->assertSame('Selesai', $sheet->getCell('C3')->getValue());
            $this->assertSame(84.0, $sheet->getCell('E3')->getValue());

            $spreadsheet->disconnectWorksheets();
        } finally {
            unlink($temporaryFile);
        }

        $this->actingAs($teacherUser)
            ->delete(route('guru.ujian.reset-session', [$exam->id, $workingStudent->id]))
            ->assertRedirect(route('guru.ujian.hasil', $exam, absolute: false))
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('hasil_ujians', ['id' => $workingAttempt->id]);
        $this->assertDatabaseHas('hasil_ujians', ['id' => $completedAttempt->id]);
        $this->assertModelExists($waitingStudent);
    }

    public function test_teacher_can_grade_essays_and_the_final_score_includes_the_essay_score(): void
    {
        $teacherUser = User::factory()->create(['role' => 'guru']);
        [$kelas, $mapel] = $this->createAssignment($teacherUser);
        $exam = Ujian::create([
            'mapel_id' => $mapel->id,
            'guru_id' => $teacherUser->guru->id,
            'kelas_id' => $kelas->id,
            'judul_ujian' => 'Ujian Campuran',
            'waktu_mulai' => '2026-11-16 08:00:00',
            'durasi_menit' => 60,
            'acak_soal' => false,
        ]);
        $multipleChoice = $exam->bankSoals()->create([
            'pertanyaan' => 'Pilih jawaban.',
            'opsi_a' => 'Benar',
            'opsi_b' => 'Salah',
            'opsi_c' => 'Pilihan C',
            'opsi_d' => 'Pilihan D',
            'opsi_e' => 'Pilihan E',
            'kunci_jawaban' => 'A',
        ]);
        $essay = $exam->bankSoals()->create([
            'pertanyaan' => 'Jelaskan alasan Anda.',
            'opsi_a' => '',
            'opsi_b' => '',
            'opsi_c' => '',
            'opsi_d' => '',
            'opsi_e' => '',
            'kunci_jawaban' => 'A',
            'tipe_soal' => 'esai',
            'bobot' => 2,
        ]);
        $student = $this->createStudent($kelas, '0000000020', 'Siswa Esai');
        $attempt = $exam->hasilUjians()->create([
            'siswa_id' => $student->id,
            'jawaban_json' => [
                (string) $multipleChoice->id => 'A',
                (string) $essay->id => 'Jawaban siswa.',
            ],
            'skor_akhir' => 50,
            'status_pengerjaan' => 'selesai',
        ]);

        $this->actingAs($teacherUser)
            ->get(route('guru.ujian.hasil', $exam))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('students.0.jumlah_pelanggaran', 0)
                ->where('students.0.esai.0.jawaban', 'Jawaban siswa.')
                ->where('students.0.esai.0.bobot', 2));

        $this->actingAs($teacherUser)
            ->put(route('guru.ujian.hasil.esai', [$exam->id, $student->id]), [
                'scores' => [(string) $essay->id => 2],
            ])
            ->assertRedirectToRoute('guru.ujian.hasil', $exam)
            ->assertSessionHas('success');

        $this->assertSame('100.00', $attempt->refresh()->skor_akhir);

        $this->actingAs($teacherUser)
            ->put(route('guru.ujian.hasil.esai', [$exam->id, $student->id]), [
                'scores' => [(string) $essay->id => 3],
            ])
            ->assertSessionHasErrors(["scores.{$essay->id}"]);

        $this->assertSame('100.00', $attempt->refresh()->skor_akhir);
    }

    public function test_teacher_cannot_access_another_teachers_exam_results_or_reset_sessions(): void
    {
        $teacherUser = User::factory()->create(['role' => 'guru']);
        $otherTeacher = User::factory()->create(['role' => 'guru']);
        [$kelas, $mapel] = $this->createAssignment($otherTeacher);
        $student = $this->createStudent($kelas, '0000000014', 'Siswa Uji');
        $exam = Ujian::create([
            'mapel_id' => $mapel->id,
            'guru_id' => $otherTeacher->guru->id,
            'kelas_id' => $kelas->id,
            'judul_ujian' => 'Ujian Rahasia',
            'waktu_mulai' => '2026-11-16 08:00:00',
            'durasi_menit' => 60,
            'acak_soal' => false,
        ]);
        $attempt = $exam->hasilUjians()->create([
            'siswa_id' => $student->id,
            'jawaban_json' => [],
            'status_pengerjaan' => 'sedang_mengerjakan',
        ]);

        $this->actingAs($teacherUser)
            ->get(route('guru.ujian.hasil', $exam))
            ->assertNotFound();

        $this->actingAs($teacherUser)
            ->delete(route('guru.ujian.destroy', $exam))
            ->assertNotFound();

        $this->assertModelExists($exam);

        $this->actingAs($teacherUser)
            ->delete(route('guru.ujian.reset-session', [$exam->id, $student->id]))
            ->assertNotFound();

        $this->assertModelExists($attempt);
    }

    /**
     * @return array{Kelas, MataPelajaran}
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
        Jadwal::create([
            'tahun_ajaran_id' => $tahunAjaran->id,
            'kelas_id' => $kelas->id,
            'mapel_id' => $mapel->id,
            'guru_id' => $guru->id,
            'hari' => 'senin',
            'jam_mulai' => '08:00',
            'jam_selesai' => '09:00',
        ]);

        return [$kelas, $mapel];
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
