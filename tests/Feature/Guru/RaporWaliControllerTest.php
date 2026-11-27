<?php

namespace Tests\Feature\Guru;

use App\Models\CatatanRapor;
use App\Models\Ekstrakurikuler;
use App\Models\Guru;
use App\Models\Jadwal;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\Nilai;
use App\Models\NilaiGuru;
use App\Models\PengaturanSekolah;
use App\Models\PresensiKelas;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RaporWaliControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_wali_teacher_sees_attendance_totals_and_subject_completeness(): void
    {
        [$waliUser, $wali, $tahunAjaran, $kelas, $student, $mapel] = $this->createWaliClass();
        $secondStudent = Siswa::create([
            'user_id' => User::factory()->create(['role' => 'siswa'])->id,
            'kelas_id' => $kelas->id,
            'nisn' => '0000000002',
            'nama_lengkap' => 'Siswa Kedua',
            'status_siswa' => 'aktif',
        ]);
        $secondMapel = MataPelajaran::create([
            'kode_mapel' => 'PRA-001',
            'nama_mapel' => 'Prakarya',
        ]);
        $firstSchedule = Jadwal::query()
            ->where('kelas_id', $kelas->id)
            ->where('mapel_id', $mapel->id)
            ->firstOrFail();
        $secondSchedule = Jadwal::create([
            'tahun_ajaran_id' => $tahunAjaran->id,
            'kelas_id' => $kelas->id,
            'mapel_id' => $secondMapel->id,
            'guru_id' => $wali->id,
            'hari' => 'selasa',
            'jam_mulai' => '09:00',
            'jam_selesai' => '10:00',
        ]);
        Nilai::create([
            'tahun_ajaran_id' => $tahunAjaran->id,
            'siswa_id' => $student->id,
            'mapel_id' => $mapel->id,
            'nilai_tugas' => 80,
            'nilai_uts' => 80,
            'nilai_uas' => 80,
            'nilai_akhir' => 80,
        ]);
        foreach ([
            [$firstSchedule, $student, '2026-11-18', 'S'],
            [$secondSchedule, $student, '2026-11-18', 'S'],
            [$firstSchedule, $student, '2026-11-19', 'I'],
            [$firstSchedule, $student, '2026-11-20', 'A'],
            [$firstSchedule, $secondStudent, '2026-11-18', 'A'],
        ] as [$schedule, $siswa, $date, $status]) {
            PresensiKelas::create([
                'jadwal_id' => $schedule->id,
                'kelas_id' => $kelas->id,
                'mapel_id' => $schedule->mapel_id,
                'guru_id' => $wali->id,
                'siswa_id' => $siswa->id,
                'tanggal' => $date,
                'status' => $status,
            ]);
        }

        $this->actingAs($waliUser)
            ->get(route('guru.rapor-wali.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('monitoringNilai', 2)
                ->where('monitoringNilai.0.nama_mapel', 'Matematika')
                ->where('monitoringNilai.0.status', 'sebagian')
                ->where('monitoringNilai.0.siswa_terisi', 1)
                ->where('monitoringNilai.1.nama_mapel', 'Prakarya')
                ->where('monitoringNilai.1.status', 'belum')
                ->where('siswas.0.catatan_rapor.sakit', 1)
                ->where('siswas.0.catatan_rapor.izin', 1)
                ->where('siswas.0.catatan_rapor.tanpa_keterangan', 1)
                ->where('siswas.1.catatan_rapor.tanpa_keterangan', 1));
    }

    public function test_wali_teacher_can_view_report_scores_for_their_class(): void
    {
        $activeEkstra = Ekstrakurikuler::create([
            'nama_ekstra' => 'Pramuka',
            'is_aktif' => true,
        ]);
        Ekstrakurikuler::create([
            'nama_ekstra' => 'Kegiatan Lama',
            'is_aktif' => false,
        ]);
        PengaturanSekolah::query()->findOrFail(1)->update([
            'nama_sekolah' => 'SMA Negeri 1 Contoh',
            'kepala_sekolah' => 'Dewi Puspita',
            'niky_kepala_sekolah' => 'NIKY-001',
        ]);
        [$waliUser, $wali, $tahunAjaran, $kelas, $student, $mapel] = $this->createWaliClass();
        Nilai::create([
            'tahun_ajaran_id' => $tahunAjaran->id,
            'siswa_id' => $student->id,
            'mapel_id' => $mapel->id,
            'nilai_tugas' => 70,
            'nilai_uts' => 80,
            'nilai_uas' => 90,
            'nilai_akhir' => 80,
            'capaian_kompetensi' => "Wali Kelas: Memahami materi.\nGuru Pengampu Kedua: Memahami materi.",
        ]);
        $otherTeacher = Guru::create([
            'user_id' => User::factory()->create(['role' => 'guru'])->id,
            'nip' => '19870010',
            'nama_lengkap' => 'Guru Pengampu Kedua',
        ]);
        foreach ([
            [$wali, 70, 'Memahami materi.'],
            [$otherTeacher, 90, 'Memahami materi.'],
        ] as [$teacher, $score, $description]) {
            NilaiGuru::create([
                'tahun_ajaran_id' => $tahunAjaran->id,
                'siswa_id' => $student->id,
                'kelas_id' => $kelas->id,
                'mapel_id' => $mapel->id,
                'guru_id' => $teacher->id,
                'nilai_akhir' => $score,
                'capaian_kompetensi' => $description,
            ]);
        }
        CatatanRapor::create([
            'tahun_ajaran_id' => $tahunAjaran->id,
            'siswa_id' => $student->id,
            'ekstra_3_nama' => 'PMR',
            'ekstra_3_ket' => 'Baik',
            'ekstra_4_nama' => 'Futsal',
            'ekstra_4_ket' => 'Amat Baik',
        ]);
        $secondStudentUser = User::factory()->create(['role' => 'siswa']);
        $secondStudent = Siswa::create([
            'user_id' => $secondStudentUser->id,
            'kelas_id' => $kelas->id,
            'nisn' => '0000000002',
            'nama_lengkap' => 'Siswa Kedua',
            'status_siswa' => 'aktif',
        ]);
        Nilai::create([
            'tahun_ajaran_id' => $tahunAjaran->id,
            'siswa_id' => $secondStudent->id,
            'mapel_id' => $mapel->id,
            'nilai_tugas' => 70,
            'nilai_uts' => 80,
            'nilai_uas' => 90,
            'nilai_akhir' => 90,
        ]);

        $this->actingAs($waliUser)
            ->get(route('guru.rapor-wali.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Guru/RaporWali/Index')
                ->where('kelas', 'X IPA 1')
                ->where('namaWaliKelas', 'Wali Kelas')
                ->where('pengaturanSekolah.nama_sekolah', 'SMA Negeri 1 Contoh')
                ->where('pengaturanSekolah.kepala_sekolah', 'Dewi Puspita')
                ->where('pengaturanSekolah.niky_kepala_sekolah', 'NIKY-001')
                ->has('siswas', 2)
                ->where('mataPelajarans.0.kelompok_mapel', 'umum')
                ->where("siswas.0.nilai.{$mapel->id}.nilai_akhir", '80.00')
                ->where('siswas.0.nilai.'.$mapel->id.'.capaian_kompetensi', 'Memahami materi.')
                ->has("siswas.0.nilai.{$mapel->id}.kontribusi_guru", 2)
                ->where("siswas.0.nilai.{$mapel->id}.kontribusi_guru.0.nilai_akhir", 70)
                ->where("siswas.0.nilai.{$mapel->id}.kontribusi_guru.1.nama_guru", 'Guru Pengampu Kedua')
                ->where('siswas.0.jumlah_nilai', 80)
                ->where('siswas.0.rata_rata', 80)
                ->where('siswas.0.ranking', 2)
                ->where('siswas.1.ranking', 1)
                ->where('siswas.0.catatan_rapor.ekstra_3_nama', 'PMR')
                ->where('siswas.0.catatan_rapor.ekstra_3_ket', 'Baik')
                ->where('siswas.0.catatan_rapor.ekstra_4_nama', 'Futsal')
                ->where('siswas.0.catatan_rapor.ekstra_4_ket', 'Amat Baik')
                ->has('ekstrakurikulers', 1)
                ->where('ekstrakurikulers.0.id', $activeEkstra->id)
                ->where('ekstrakurikulers.0.nama_ekstra', 'Pramuka'));
    }

    public function test_regular_teacher_cannot_view_wali_class_report(): void
    {
        $teacherUser = User::factory()->create(['role' => 'guru']);
        Guru::create([
            'user_id' => $teacherUser->id,
            'nip' => '19870002',
            'nama_lengkap' => 'Guru Biasa',
            'is_wali_kelas' => false,
        ]);

        $this->actingAs($teacherUser)
            ->get(route('guru.rapor-wali.index'))
            ->assertForbidden();

        $this->actingAs($teacherUser)
            ->post(route('guru.rapor-wali.store'))
            ->assertForbidden();
    }

    public function test_teacher_without_an_active_wali_class_cannot_access_wali_report(): void
    {
        $teacherUser = User::factory()->create(['role' => 'guru']);
        Guru::create([
            'user_id' => $teacherUser->id,
            'nip' => '19870003',
            'nama_lengkap' => 'Wali Tanpa Kelas Aktif',
            'is_wali_kelas' => true,
        ]);

        $this->actingAs($teacherUser)
            ->get(route('guru.rapor-wali.index'))
            ->assertForbidden();

        $this->actingAs($teacherUser)
            ->post(route('guru.rapor-wali.store'))
            ->assertForbidden();
    }

    public function test_wali_teacher_can_save_report_notes_and_generates_the_competency_description(): void
    {
        [$waliUser, , $tahunAjaran, $kelas, $student] = $this->createWaliClass('genap');
        Ekstrakurikuler::create([
            'nama_ekstra' => 'Pramuka',
            'is_aktif' => true,
        ]);
        Ekstrakurikuler::create([
            'nama_ekstra' => 'PMR',
            'is_aktif' => true,
        ]);
        Ekstrakurikuler::create([
            'nama_ekstra' => 'Futsal',
            'is_aktif' => true,
        ]);

        $this->actingAs($waliUser)
            ->post(route('guru.rapor-wali.store'), [
                'kelas_id' => $kelas->id,
                'catatan_rapor' => [[
                    'siswa_id' => $student->id,
                    'kokurikuler_predikat' => 'Baik',
                    'kokurikuler_deskripsi' => '',
                    'ekstra_1_nama' => 'Pramuka',
                    'ekstra_1_ket' => 'Baik',
                    'ekstra_2_nama' => 'Pramuka',
                    'ekstra_2_ket' => 'Amat Baik',
                    'ekstra_3_nama' => 'PMR',
                    'ekstra_3_ket' => 'Cukup',
                    'ekstra_4_nama' => 'Futsal',
                    'ekstra_4_ket' => 'Kurang',
                    'sakit' => 2,
                    'izin' => 1,
                    'tanpa_keterangan' => 0,
                    'presensi_manual_sakit' => 2,
                    'presensi_manual_izin' => 1,
                    'presensi_manual_tanpa_keterangan' => 0,
                    'catatan_wali_kelas' => 'Terus tingkatkan semangat belajar.',
                    'status_kenaikan' => 'naik',
                    'naik_ke_kelas' => 'XI RPL 1',
                ]],
            ])
            ->assertRedirect(route('guru.rapor-wali.index', ['kelas_id' => $kelas->id], absolute: false));

        $catatan = CatatanRapor::query()
            ->where('tahun_ajaran_id', $tahunAjaran->id)
            ->where('siswa_id', $student->id)
            ->firstOrFail();

        $this->assertSame(
            'Ananda sudah Baik dalam keterampilan mengolah barang bekas menjadi pot bunga, namun masih perlu berlatih meningkatkan ketelitian pada tahap finishing. Baik dalam mengidentifikasi potensi limbah, menumbuhkan kepedulian lingkungan, namun masih perlu berlatih mengembangkan ide inovatif untuk meningkatkan nilai jual produk.',
            $catatan->kokurikuler_deskripsi,
        );
        $this->assertSame('naik', $catatan->status_kenaikan);
        $this->assertSame('XI RPL 1', $catatan->naik_ke_kelas);
        $this->assertSame(2, $catatan->sakit);
        $this->assertSame(2, $catatan->presensi_manual_sakit);
        $this->assertSame('Pramuka', $catatan->ekstra_1_nama);
        $this->assertSame('Baik', $catatan->ekstra_1_ket);
        $this->assertSame('Pramuka', $catatan->ekstra_2_nama);
        $this->assertSame('Amat Baik', $catatan->ekstra_2_ket);
        $this->assertSame('PMR', $catatan->ekstra_3_nama);
        $this->assertSame('Cukup', $catatan->ekstra_3_ket);
        $this->assertSame('Futsal', $catatan->ekstra_4_nama);
        $this->assertSame('Kurang', $catatan->ekstra_4_ket);
    }

    public function test_wali_teacher_cannot_save_inactive_extracurricular_or_unlisted_predicates(): void
    {
        [$waliUser, , , $kelas, $student] = $this->createWaliClass();
        Ekstrakurikuler::create([
            'nama_ekstra' => 'Kegiatan Lama',
            'is_aktif' => false,
        ]);

        $this->actingAs($waliUser)
            ->from(route('guru.rapor-wali.index'))
            ->post(route('guru.rapor-wali.store'), [
                'kelas_id' => $kelas->id,
                'catatan_rapor' => [[
                    'siswa_id' => $student->id,
                    'ekstra_1_nama' => 'Kegiatan Lama',
                    'ekstra_1_ket' => 'Aktif',
                ]],
            ])
            ->assertRedirect(route('guru.rapor-wali.index'))
            ->assertSessionHasErrors([
                'catatan_rapor.0.ekstra_1_nama' => 'Pilih ekstrakurikuler aktif yang tersedia.',
                'catatan_rapor.0.ekstra_1_ket' => 'Pilih predikat ekstrakurikuler yang tersedia.',
            ]);

        $this->assertDatabaseCount('catatan_rapors', 0);
    }

    public function test_wali_teacher_cannot_save_promotion_decisions_in_the_odd_semester(): void
    {
        [$waliUser, , , $kelas, $student] = $this->createWaliClass('ganjil');

        $this->actingAs($waliUser)
            ->from(route('guru.rapor-wali.index'))
            ->post(route('guru.rapor-wali.store'), [
                'kelas_id' => $kelas->id,
                'catatan_rapor' => [[
                    'siswa_id' => $student->id,
                    'status_kenaikan' => 'naik',
                    'naik_ke_kelas' => 'XI RPL 1',
                ]],
            ])
            ->assertRedirect(route('guru.rapor-wali.index'))
            ->assertSessionHasErrors([
                'catatan_rapor.0.status_kenaikan' => 'Kenaikan kelas hanya dapat diisi pada semester genap.',
            ]);

        $this->assertDatabaseCount('catatan_rapors', 0);
    }

    public function test_wali_teacher_cannot_save_notes_for_a_student_outside_their_class(): void
    {
        [$waliUser, , , $kelas] = $this->createWaliClass();
        $otherClass = Kelas::create([
            'tahun_ajaran_id' => $kelas->tahun_ajaran_id,
            'nama_kelas' => 'X IPA 2',
            'tingkat' => 10,
        ]);
        $otherStudentUser = User::factory()->create(['role' => 'siswa']);
        $otherStudent = Siswa::create([
            'user_id' => $otherStudentUser->id,
            'kelas_id' => $otherClass->id,
            'nisn' => '0000000002',
            'nama_lengkap' => 'Siswa Kelas Lain',
            'status_siswa' => 'aktif',
        ]);

        $this->actingAs($waliUser)
            ->from(route('guru.rapor-wali.index'))
            ->post(route('guru.rapor-wali.store'), [
                'kelas_id' => $kelas->id,
                'catatan_rapor' => [[
                    'siswa_id' => $otherStudent->id,
                    'kokurikuler_predikat' => 'Baik',
                ]],
            ])
            ->assertRedirect(route('guru.rapor-wali.index'))
            ->assertSessionHasErrors('catatan_rapor.0.siswa_id');

        $this->assertDatabaseCount('catatan_rapors', 0);
    }

    public function test_wali_class_ranking_uses_standard_competition_positions_for_ties(): void
    {
        [$waliUser, , , $kelas, $firstStudent, $mapel] = $this->createWaliClass();
        $students = [$firstStudent];

        foreach (['Siswa B', 'Siswa C', 'Siswa D'] as $index => $name) {
            $user = User::factory()->create(['role' => 'siswa']);
            $students[] = Siswa::create([
                'user_id' => $user->id,
                'kelas_id' => $kelas->id,
                'nisn' => '000000000'.($index + 2),
                'nama_lengkap' => $name,
                'status_siswa' => 'aktif',
            ]);
        }

        foreach ([100, 90, 90, 80] as $index => $score) {
            Nilai::create([
                'tahun_ajaran_id' => $kelas->tahun_ajaran_id,
                'siswa_id' => $students[$index]->id,
                'mapel_id' => $mapel->id,
                'nilai_tugas' => $score,
                'nilai_uts' => $score,
                'nilai_uas' => $score,
                'nilai_akhir' => $score,
            ]);
        }

        $this->actingAs($waliUser)
            ->get(route('guru.rapor-wali.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('siswas.0.ranking', 1)
                ->where('siswas.1.ranking', 2)
                ->where('siswas.2.ranking', 2)
                ->where('siswas.3.ranking', 4)
                ->where('siswas.0.rata_rata', 100)
                ->where('siswas.3.rata_rata', 80));
    }

    /**
     * @return array{User, Guru, TahunAjaran, Kelas, Siswa, MataPelajaran}
     */
    private function createWaliClass(string $semester = 'ganjil'): array
    {
        $tahunAjaran = TahunAjaran::create([
            'nama_tahun' => '2026/2027',
            'semester' => $semester,
            'is_aktif' => true,
        ]);
        $waliUser = User::factory()->create(['role' => 'guru']);
        $wali = Guru::create([
            'user_id' => $waliUser->id,
            'nip' => '19870001',
            'nama_lengkap' => 'Wali Kelas',
            'is_wali_kelas' => true,
        ]);
        $kelas = Kelas::create([
            'tahun_ajaran_id' => $tahunAjaran->id,
            'wali_kelas_id' => $wali->id,
            'nama_kelas' => 'X IPA 1',
            'tingkat' => 10,
        ]);
        $studentUser = User::factory()->create(['role' => 'siswa']);
        $student = Siswa::create([
            'user_id' => $studentUser->id,
            'kelas_id' => $kelas->id,
            'nisn' => '0000000001',
            'nama_lengkap' => 'Siswa Aktif',
            'status_siswa' => 'aktif',
        ]);
        $mapel = MataPelajaran::create([
            'kode_mapel' => 'MAT-001',
            'nama_mapel' => 'Matematika',
        ]);
        Jadwal::create([
            'tahun_ajaran_id' => $tahunAjaran->id,
            'kelas_id' => $kelas->id,
            'mapel_id' => $mapel->id,
            'guru_id' => $wali->id,
            'hari' => 'senin',
            'jam_mulai' => '08:00',
            'jam_selesai' => '09:00',
        ]);

        return [$waliUser, $wali, $tahunAjaran, $kelas, $student, $mapel];
    }
}
