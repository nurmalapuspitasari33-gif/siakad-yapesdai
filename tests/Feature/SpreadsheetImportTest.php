<?php

namespace Tests\Feature;

use App\Models\BankSoal;
use App\Models\Guru;
use App\Models\Jadwal;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\ProgramKeahlian;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\Ujian;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Tests\TestCase;

class SpreadsheetImportTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_download_student_template_with_school_origin_column(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $response = $this->actingAs($admin)
            ->get(route('admin.siswa.template'))
            ->assertOk()
            ->assertDownload('template-siswa.xlsx')
            ->assertStreamed();
        $temporaryFile = tempnam(sys_get_temp_dir(), 'template-siswa-');
        file_put_contents($temporaryFile, $response->streamedContent());

        try {
            $spreadsheet = IOFactory::load($temporaryFile);

            $this->assertSame('sekolah_asal', $spreadsheet->getActiveSheet()->getCell('M1')->getValue());

            $spreadsheet->disconnectWorksheets();
        } finally {
            unlink($temporaryFile);
        }
    }

    public function test_admin_can_import_teachers_and_assign_a_homeroom_class(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $kelas = $this->createActiveClass();

        $this->actingAs($admin)
            ->post(route('admin.guru.import'), [
                'file' => $this->xlsxUpload(
                    ['niky', 'nama_lengkap', 'email', 'no_wa', 'is_wali_kelas', 'nama_kelas_wali'],
                    [['19870001', 'Dewi Puspita', 'dewi@sekolah.sch.id', '081234567890', 'ya', $kelas->nama_kelas]],
                ),
            ])
            ->assertRedirect(route('admin.guru.index', absolute: false));

        $guru = Guru::query()->where('nip', '19870001')->firstOrFail();

        $this->assertSame($guru->id, $kelas->fresh()->wali_kelas_id);
        $this->assertTrue($guru->is_wali_kelas);
        $this->assertTrue(Hash::check('password', $guru->user->password));
    }

    public function test_admin_can_import_a_teacher_with_blank_homeroom_fields(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $kelas = $this->createActiveClass();

        $this->actingAs($admin)
            ->post(route('admin.guru.import'), [
                'file' => $this->xlsxUpload(
                    ['niky', 'nama_lengkap', 'email', 'no_wa', 'is_wali_kelas', 'nama_kelas_wali'],
                    [['19870003', 'Guru Biasa', 'guru.biasa@sekolah.sch.id', '', '', '']],
                ),
            ])
            ->assertRedirect(route('admin.guru.index', absolute: false));

        $guru = Guru::query()->where('nip', '19870003')->firstOrFail();

        $this->assertFalse($guru->is_wali_kelas);
        $this->assertNull($kelas->fresh()->wali_kelas_id);
    }

    public function test_admin_teacher_import_still_accepts_the_legacy_nip_column(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->post(route('admin.guru.import'), [
                'file' => $this->xlsxUpload(
                    ['nip', 'nama_lengkap', 'email', 'no_wa', 'is_wali_kelas', 'nama_kelas_wali'],
                    [['19870002', 'Guru Lama', 'guru.lama@sekolah.sch.id', '', 'tidak', '']],
                ),
            ])
            ->assertRedirect(route('admin.guru.index', absolute: false));

        $this->assertDatabaseHas('gurus', [
            'nip' => '19870002',
            'nama_lengkap' => 'Guru Lama',
        ]);
    }

    public function test_admin_student_import_is_atomic_when_a_row_is_invalid(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->createActiveClass();

        $this->actingAs($admin)
            ->post(route('admin.siswa.import'), [
                'file' => $this->xlsxUpload(
                    [
                        'nisn', 'nis', 'nama_lengkap', 'email', 'nama_kelas', 'jenis_kelamin',
                        'tempat_lahir', 'tanggal_lahir', 'agama', 'alamat_murid', 'nama_ayah',
                        'nama_ibu', 'no_wa_wali', 'tipe_program', 'ukuran_seragam',
                    ],
                    [
                        [
                            '1000000001', 'SMK-1001', 'Siswa Valid', 'valid@sekolah.sch.id',
                            'X IPA 1', 'L', 'Cilacap', '2010-01-15', 'Islam', 'Jl. Pendidikan',
                            'Ayah', 'Ibu', '081234567890', 'reguler', 'L',
                        ],
                        [
                            '1000000002', 'SMK-1002', 'Siswa Tidak Valid', 'invalid-email',
                            'X IPA 1', 'P', 'Cilacap', '2010-01-15', 'Islam', 'Jl. Pendidikan',
                            'Ayah', 'Ibu', '081234567891', 'reguler', 'M',
                        ],
                    ],
                ),
            ])
            ->assertSessionHasErrors('file');

        $this->assertDatabaseCount('siswas', 0);
        $this->assertDatabaseMissing('users', ['email' => 'valid@sekolah.sch.id']);
    }

    public function test_admin_can_import_a_student_and_assign_a_class(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $kelas = $this->createActiveClass();

        $this->actingAs($admin)
            ->post(route('admin.siswa.import'), [
                'file' => $this->xlsxUpload(
                    [
                        'nisn', 'nis', 'nama_lengkap', 'email', 'nama_kelas', 'jenis_kelamin',
                        'tempat_lahir', 'tanggal_lahir', 'agama', 'alamat_murid', 'nama_ayah',
                        'nama_ibu', 'sekolah_asal', 'no_wa_wali', 'tipe_program', 'ukuran_seragam',
                    ],
                    [[
                        '1000000001', 'SMK-1001', 'Siswa Contoh', 'siswa@sekolah.sch.id',
                        'X IPA 1', 'L', 'Cilacap', '2010-01-15', 'Islam', 'Jl. Pendidikan',
                        'Ayah', 'Ibu', 'SMP Asal', '081234567890', 'santri_internal', 'L',
                    ]],
                ),
            ])
            ->assertRedirect(route('admin.siswa.index', absolute: false));

        $student = Siswa::query()->where('nisn', '1000000001')->firstOrFail();

        $this->assertSame($kelas->id, $student->kelas_id);
        $this->assertSame('SMK-1001', $student->nis);
        $this->assertSame('SMP Asal', $student->sekolah_asal);
        $this->assertSame('santri_internal', $student->tipe_program);
        $this->assertTrue(Hash::check('password', $student->user->password));
    }

    public function test_admin_can_import_indonesian_gender_and_birth_date_values(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $kelas = $this->createActiveClass();

        $this->actingAs($admin)
            ->post(route('admin.siswa.import'), [
                'file' => $this->xlsxUpload(
                    [
                        'nisn', 'nis', 'nama_lengkap', 'email', 'nama_kelas', 'jenis_kelamin',
                        'tempat_lahir', 'tanggal_lahir', 'agama', 'alamat_murid', 'nama_ayah',
                        'nama_ibu', 'no_wa_wali', 'tipe_program', 'ukuran_seragam',
                        'program_keahlian', 'konsentrasi_keahlian',
                    ],
                    [[
                        '', '2593', 'Siswa Contoh', '', $kelas->nama_kelas, 'Laki-laki',
                        'Cilacap', '01 februari 2011', 'Islam', '', '', '', '', '', '', '', '',
                    ]],
                ),
            ])
            ->assertRedirect(route('admin.siswa.index', absolute: false));

        $student = Siswa::query()->where('nis', '2593')->firstOrFail();

        $this->assertSame('L', $student->jenis_kelamin);
        $this->assertSame('2011-02-01', $student->tanggal_lahir->format('Y-m-d'));
    }

    public function test_admin_can_import_a_student_with_blank_optional_fields(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $kelas = $this->createActiveClass();

        $this->actingAs($admin)
            ->post(route('admin.siswa.import'), [
                'file' => $this->xlsxUpload(
                    [
                        'nisn', 'nis', 'nama_lengkap', 'email', 'nama_kelas', 'jenis_kelamin',
                        'tempat_lahir', 'tanggal_lahir', 'agama', 'alamat_murid', 'nama_ayah',
                        'nama_ibu', 'no_wa_wali', 'tipe_program', 'ukuran_seragam',
                        'program_keahlian', 'konsentrasi_keahlian',
                    ],
                    [[
                        '1000000005', '', 'Siswa Baru', 'siswa.baru@sekolah.sch.id', $kelas->nama_kelas,
                        'L', '', '', '', '', '', '', '', '', '', '', '',
                    ]],
                ),
            ])
            ->assertRedirect(route('admin.siswa.index', absolute: false));

        $student = Siswa::query()->where('nisn', '1000000005')->firstOrFail();

        $this->assertSame('reguler', $student->tipe_program);
        $this->assertNull($student->alamat_murid);
        $this->assertNull($student->nama_ayah);
        $this->assertNull($student->nama_ibu);
        $this->assertNull($student->no_wa_wali);
        $this->assertNull($student->ukuran_seragam);
        $this->assertSame($kelas->id, $student->kelas_id);
    }

    public function test_admin_can_import_students_with_only_names(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->post(route('admin.siswa.import'), [
                'file' => $this->xlsxUpload(
                    [
                        'nisn', 'nis', 'nama_lengkap', 'email', 'nama_kelas', 'jenis_kelamin',
                        'tempat_lahir', 'tanggal_lahir', 'agama', 'alamat_murid', 'nama_ayah',
                        'nama_ibu', 'no_wa_wali', 'tipe_program', 'ukuran_seragam',
                        'program_keahlian', 'konsentrasi_keahlian',
                    ],
                    [
                        ['', '', 'Siswa Kelas XI', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
                        ['', '', 'Siswa Kelas XII', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
                    ],
                ),
            ])
            ->assertRedirect(route('admin.siswa.index', absolute: false));

        $student = Siswa::query()->where('nama_lengkap', 'Siswa Kelas XI')->firstOrFail();
        $secondStudent = Siswa::query()->where('nama_lengkap', 'Siswa Kelas XII')->firstOrFail();

        $this->assertNull($student->nisn);
        $this->assertNull($student->kelas_id);
        $this->assertSame('reguler', $student->tipe_program);
        $this->assertNull($student->user->email);
        $this->assertNull($secondStudent->nisn);
        $this->assertNull($secondStudent->user->email);
    }

    public function test_admin_import_updates_students_by_identifiers_and_preserves_blank_cells(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $kelas = $this->createActiveClass();
        $existingRecords = [
            [
                'nisn' => '1000000011',
                'nis' => 'SMK-0011',
                'email' => 'siswa.nisn@sekolah.sch.id',
                'name' => 'Siswa Lama NISN',
                'updated_name' => 'Siswa Update NISN',
            ],
            [
                'nisn' => null,
                'nis' => 'SMK-0012',
                'email' => 'siswa.nis@sekolah.sch.id',
                'name' => 'Siswa Lama NIS',
                'updated_name' => 'Siswa Update NIS',
            ],
            [
                'nisn' => null,
                'nis' => null,
                'email' => 'siswa.email@sekolah.sch.id',
                'name' => 'Siswa Lama Email',
                'updated_name' => 'Siswa Update Email',
            ],
        ];
        $students = [];

        foreach ($existingRecords as $record) {
            $user = User::factory()->create([
                'role' => 'siswa',
                'email' => $record['email'],
            ]);
            $students[] = Siswa::create([
                'user_id' => $user->id,
                'kelas_id' => $kelas->id,
                'nisn' => $record['nisn'],
                'nis' => $record['nis'],
                'nama_lengkap' => $record['name'],
                'jenis_kelamin' => 'P',
                'tempat_lahir' => 'Jakarta',
                'tanggal_lahir' => '2010-01-02',
                'agama' => 'Islam',
                'alamat_murid' => 'Alamat Lama',
                'nama_ayah' => 'Ayah Lama',
                'nama_ibu' => 'Ibu Lama',
                'sekolah_asal' => 'SMP Lama',
                'no_wa_wali' => '081234567890',
                'tipe_program' => 'santri_internal',
                'ukuran_seragam' => 'M',
                'status_siswa' => 'aktif',
            ]);
        }

        $this->actingAs($admin)
            ->post(route('admin.siswa.import'), [
                'file' => $this->xlsxUpload(
                    [
                        'nisn', 'nis', 'nama_lengkap', 'email', 'nama_kelas', 'jenis_kelamin',
                        'tempat_lahir', 'tanggal_lahir', 'agama', 'alamat_murid', 'nama_ayah',
                        'nama_ibu', 'sekolah_asal', 'no_wa_wali', 'tipe_program', 'ukuran_seragam',
                        'program_keahlian', 'konsentrasi_keahlian',
                    ],
                    [
                        ['1000000011', '', 'Siswa Update NISN', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
                        ['', 'SMK-0012', 'Siswa Update NIS', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
                        ['', '', 'Siswa Update Email', 'siswa.email@sekolah.sch.id', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
                    ],
                ),
            ])
            ->assertRedirect(route('admin.siswa.index', absolute: false))
            ->assertSessionHas('success', '0 siswa baru ditambahkan, 3 siswa diperbarui.');

        $this->assertDatabaseCount('siswas', 3);
        $this->assertDatabaseCount('users', 4);

        foreach ($students as $index => $student) {
            $student->refresh();

            $this->assertSame($existingRecords[$index]['updated_name'], $student->nama_lengkap);
            $this->assertSame('P', $student->jenis_kelamin);
            $this->assertSame('2010-01-02', $student->tanggal_lahir->format('Y-m-d'));
            $this->assertSame('Islam', $student->agama);
            $this->assertSame('Ayah Lama', $student->nama_ayah);
            $this->assertSame('SMP Lama', $student->sekolah_asal);
            $this->assertSame($kelas->id, $student->kelas_id);
            $this->assertSame($existingRecords[$index]['email'], $student->user->email);
            $this->assertSame('santri_internal', $student->tipe_program);
        }
    }

    public function test_admin_student_import_saves_a_matching_program_and_concentration(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $kelas = $this->createActiveClass();
        $program = ProgramKeahlian::create([
            'kode_jurusan' => 'TO',
            'nama_jurusan' => 'Teknik Otomotif',
        ]);
        $concentration = $program->konsentrasiKeahlians()->create([
            'kode_konsentrasi' => 'TKR',
            'nama_konsentrasi' => 'Teknik Kendaraan Ringan',
        ]);
        $kelas->update([
            'program_keahlian_id' => $program->id,
            'konsentrasi_keahlian_id' => $concentration->id,
        ]);

        $this->actingAs($admin)
            ->post(route('admin.siswa.import'), [
                'file' => $this->xlsxUpload(
                    [
                        'nisn', 'nis', 'nama_lengkap', 'email', 'nama_kelas', 'jenis_kelamin',
                        'tempat_lahir', 'tanggal_lahir', 'agama', 'alamat_murid', 'nama_ayah',
                        'nama_ibu', 'no_wa_wali', 'tipe_program', 'ukuran_seragam',
                        'program_keahlian', 'konsentrasi_keahlian',
                    ],
                    [[
                        '1000000003', 'SMK-1003', 'Siswa Otomotif', 'otomotif@sekolah.sch.id',
                        'X IPA 1', 'L', 'Cilacap', '2010-01-15', 'Islam', 'Jl. Pendidikan',
                        'Ayah', 'Ibu', '081234567893', 'reguler', 'L',
                        'TO', 'Teknik Kendaraan Ringan',
                    ]],
                ),
            ])
            ->assertRedirect(route('admin.siswa.index', absolute: false));

        $this->assertDatabaseHas('siswas', [
            'nisn' => '1000000003',
            'kelas_id' => $kelas->id,
            'program_keahlian_id' => $program->id,
            'konsentrasi_keahlian_id' => $concentration->id,
        ]);
    }

    public function test_admin_student_import_rejects_programs_that_do_not_match_the_selected_class(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->createActiveClass();
        $program = ProgramKeahlian::create([
            'kode_jurusan' => 'TF',
            'nama_jurusan' => 'Teknologi Farmasi',
        ]);
        $concentration = $program->konsentrasiKeahlians()->create([
            'kode_konsentrasi' => 'FI',
            'nama_konsentrasi' => 'Farmasi Industri',
        ]);

        $this->actingAs($admin)
            ->post(route('admin.siswa.import'), [
                'file' => $this->xlsxUpload(
                    [
                        'nisn', 'nis', 'nama_lengkap', 'email', 'nama_kelas', 'jenis_kelamin',
                        'tempat_lahir', 'tanggal_lahir', 'agama', 'alamat_murid', 'nama_ayah',
                        'nama_ibu', 'no_wa_wali', 'tipe_program', 'ukuran_seragam',
                        'program_keahlian', 'konsentrasi_keahlian',
                    ],
                    [[
                        '1000000004', 'SMK-1004', 'Siswa Farmasi', 'farmasi@sekolah.sch.id',
                        'X IPA 1', 'P', 'Cilacap', '2010-01-15', 'Islam', 'Jl. Pendidikan',
                        'Ayah', 'Ibu', '081234567894', 'reguler', 'M',
                        $program->kode_jurusan, $concentration->kode_konsentrasi,
                    ]],
                ),
            ])
            ->assertSessionHasErrors('file');

        $this->assertDatabaseMissing('users', ['email' => 'farmasi@sekolah.sch.id']);
    }

    public function test_teacher_can_import_questions_with_an_e_answer(): void
    {
        $teacherUser = User::factory()->create(['role' => 'guru']);
        [$kelas, $mapel, $ujian] = $this->createExamForTeacher($teacherUser);

        $this->actingAs($teacherUser)
            ->post(route('guru.ujian.soal.import', $ujian), [
                'file' => $this->xlsxUpload(
                    ['pertanyaan', 'opsi_a', 'opsi_b', 'opsi_c', 'opsi_d', 'opsi_e', 'kunci_jawaban'],
                    [['Berapakah 2 + 2?', '3', '4', '5', '6', '7', 'E']],
                ),
            ])
            ->assertRedirect(route('guru.ujian.index', absolute: false));

        $this->assertDatabaseHas('bank_soals', [
            'ujian_id' => $ujian->id,
            'pertanyaan' => 'Berapakah 2 + 2?',
            'opsi_e' => '7',
            'kunci_jawaban' => 'E',
        ]);
    }

    public function test_teacher_can_import_matching_questions_from_plain_language_columns(): void
    {
        $teacherUser = User::factory()->create(['role' => 'guru']);
        [, , $exam] = $this->createExamForTeacher($teacherUser);
        $exam->update(['mode_ujian' => 'akm']);

        $headers = [
            'Pertanyaan',
            'Pilihan A',
            'Pilihan B',
            'Pilihan C',
            'Pilihan D',
            'Pilihan E',
            'Kunci jawaban',
            'Tipe soal',
            'Bobot',
            'Pasangan kiri 1',
            'Pasangan kanan 1',
            'Jawaban benar 1',
            'Pasangan kiri 2',
            'Pasangan kanan 2',
            'Jawaban benar 2',
            'Pasangan kiri 3',
            'Pasangan kanan 3',
            'Jawaban benar 3',
        ];
        $row = [
            'Pasangkan negara dengan ibukotanya.',
            '',
            '',
            '',
            '',
            '',
            '',
            'JODOH',
            '2',
            'Indonesia',
            'Tokyo',
            'Jakarta',
            'Jepang',
            'Jakarta',
            'Tokyo',
            'Thailand',
            'Bangkok',
            'Bangkok',
        ];

        $this->actingAs($teacherUser)
            ->post(route('guru.ujian.soal.import', $exam), [
                'file' => $this->xlsxUpload($headers, [$row]),
            ])
            ->assertRedirect(route('guru.ujian.index', absolute: false))
            ->assertSessionHas('success', '1 soal berhasil diimpor.');

        $question = BankSoal::query()->where('ujian_id', $exam->id)->firstOrFail();
        $this->assertSame('menjodohkan', $question->tipe_soal);
        $this->assertSame(['Indonesia', 'Jepang', 'Thailand'], $question->opsi_json['pasangan_kiri']);
        $this->assertSame(['Tokyo', 'Jakarta', 'Bangkok'], $question->opsi_json['pasangan_kanan']);
        $this->assertSame(['1', '0', '2'], $question->opsi_json['kunci_jawaban']);
    }

    public function test_teacher_can_download_templates_specific_to_each_exam_mode(): void
    {
        $teacherUser = User::factory()->create(['role' => 'guru']);
        [, , $exam] = $this->createExamForTeacher($teacherUser);

        $normalResponse = $this->actingAs($teacherUser)
            ->get(route('guru.ujian.soal.template', $exam))
            ->assertOk()
            ->assertDownload("template-soal-normal-ujian-{$exam->id}.xlsx")
            ->assertStreamed();
        $normalTemporaryFile = tempnam(sys_get_temp_dir(), 'template-normal-');
        file_put_contents($normalTemporaryFile, $normalResponse->streamedContent());

        try {
            $spreadsheet = IOFactory::load($normalTemporaryFile);
            $normalDataSheet = $spreadsheet->getSheetByName('Data Soal');

            $this->assertSame('Petunjuk', $spreadsheet->getSheet(0)->getTitle());
            $this->assertSame('PANDUAN TEMPLATE SOAL NORMAL', $spreadsheet->getSheet(0)->getCell('A1')->getValue());
            $this->assertNotNull($normalDataSheet);
            $this->assertSame('Pertanyaan', $normalDataSheet->getCell('A1')->getValue());
            $this->assertSame('Bobot', $normalDataSheet->getCell('I1')->getValue());
            $this->assertNull($normalDataSheet->getCell('J1')->getValue());

            $spreadsheet->disconnectWorksheets();
        } finally {
            unlink($normalTemporaryFile);
        }

        $exam->update(['mode_ujian' => 'akm']);
        $akmResponse = $this->actingAs($teacherUser)
            ->get(route('guru.ujian.soal.template', $exam))
            ->assertOk()
            ->assertDownload("template-soal-akm-ujian-{$exam->id}.xlsx")
            ->assertStreamed();
        $akmTemporaryFile = tempnam(sys_get_temp_dir(), 'template-akm-');
        file_put_contents($akmTemporaryFile, $akmResponse->streamedContent());

        try {
            $spreadsheet = IOFactory::load($akmTemporaryFile);
            $akmDataSheet = $spreadsheet->getSheetByName('Data Soal');

            $this->assertSame('PANDUAN TEMPLATE SOAL UJIAN AKM', $spreadsheet->getSheet(0)->getCell('A1')->getValue());
            $this->assertSame('Indonesia', $spreadsheet->getSheet(0)->getCell('A14')->getValue());
            $this->assertNotNull($akmDataSheet);
            $this->assertSame('Pasangan kiri 1', $akmDataSheet->getCell('J1')->getValue());
            $this->assertSame('Jawaban benar 5', $akmDataSheet->getCell('X1')->getValue());
            $this->assertNull($akmDataSheet->getCell('J2')->getValue());

            $spreadsheet->disconnectWorksheets();
        } finally {
            unlink($akmTemporaryFile);
        }
    }

    public function test_spreadsheet_import_rejects_an_extra_header_without_creating_accounts(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->post(route('admin.guru.import'), [
                'file' => $this->xlsxUpload(
                    ['nip', 'nama_lengkap', 'email', 'no_wa', 'is_wali_kelas', 'nama_kelas_wali', 'unexpected'],
                    [['19870001', 'Dewi Puspita', 'dewi@sekolah.sch.id', '', 'tidak', '', 'unused']],
                ),
            ])
            ->assertSessionHasErrors('file');

        $this->assertDatabaseCount('gurus', 0);
        $this->assertDatabaseMissing('users', ['email' => 'dewi@sekolah.sch.id']);
    }

    /**
     * @param  array<int, string>  $headers
     * @param  array<int, array<int, string>>  $rows
     */
    private function xlsxUpload(array $headers, array $rows): UploadedFile
    {
        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->fromArray($headers, null, 'A1');

        foreach ($rows as $index => $row) {
            $sheet->fromArray($row, null, 'A'.($index + 2));
        }

        ob_start();
        (new Xlsx($spreadsheet))->save('php://output');
        $content = ob_get_clean();
        $spreadsheet->disconnectWorksheets();

        return UploadedFile::fake()
            ->createWithContent('import.xlsx', $content)
            ->mimeType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }

    private function createActiveClass(): Kelas
    {
        $tahunAjaran = TahunAjaran::create([
            'nama_tahun' => '2026/2027',
            'semester' => 'ganjil',
            'is_aktif' => true,
        ]);

        return Kelas::create([
            'tahun_ajaran_id' => $tahunAjaran->id,
            'nama_kelas' => 'X IPA 1',
            'tingkat' => 10,
        ]);
    }

    /**
     * @return array{Kelas, MataPelajaran, Ujian}
     */
    private function createExamForTeacher(User $teacherUser): array
    {
        $kelas = $this->createActiveClass();
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
            'tahun_ajaran_id' => $kelas->tahun_ajaran_id,
            'kelas_id' => $kelas->id,
            'mapel_id' => $mapel->id,
            'guru_id' => $guru->id,
            'hari' => 'senin',
            'jam_mulai' => '08:00',
            'jam_selesai' => '09:00',
        ]);
        $ujian = Ujian::create([
            'guru_id' => $guru->id,
            'kelas_id' => $kelas->id,
            'mapel_id' => $mapel->id,
            'judul_ujian' => 'Ujian Matematika',
            'waktu_mulai' => now()->addDay(),
            'durasi_menit' => 60,
            'acak_soal' => false,
        ]);

        return [$kelas, $mapel, $ujian];
    }
}
