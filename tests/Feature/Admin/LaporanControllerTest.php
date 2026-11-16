<?php

namespace Tests\Feature\Admin;

use App\Models\Guru;
use App\Models\Jadwal;
use App\Models\Kelas;
use App\Models\KategoriBeasiswa;
use App\Models\KonsentrasiKeahlian;
use App\Models\MataPelajaran;
use App\Models\Nilai;
use App\Models\ProgramKeahlian;
use App\Models\Siswa;
use App\Models\Tagihan;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class LaporanControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_sees_year_filtered_executive_reports_with_aggregated_values(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $activeYear = TahunAjaran::create([
            'nama_tahun' => '2026/2027',
            'semester' => 'ganjil',
            'is_aktif' => true,
        ]);
        $previousYear = TahunAjaran::create([
            'nama_tahun' => '2025/2026',
            'semester' => 'genap',
            'is_aktif' => false,
        ]);
        $program = ProgramKeahlian::create([
            'kode_jurusan' => 'TO',
            'nama_jurusan' => 'Teknik Otomotif',
        ]);
        $concentration = KonsentrasiKeahlian::create([
            'program_keahlian_id' => $program->id,
            'kode_konsentrasi' => 'TKR',
            'nama_konsentrasi' => 'Teknik Kendaraan Ringan',
        ]);
        KonsentrasiKeahlian::create([
            'program_keahlian_id' => $program->id,
            'kode_konsentrasi' => 'TSM',
            'nama_konsentrasi' => 'Teknik Sepeda Motor',
        ]);
        $scholarship = KategoriBeasiswa::create([
            'nama_beasiswa' => 'Afirmasi',
            'jenis_potongan' => 'persen',
            'nilai_potongan' => 100,
            'is_afirmasi' => true,
        ]);
        $kelas = Kelas::create([
            'tahun_ajaran_id' => $activeYear->id,
            'nama_kelas' => 'X TO 1',
            'tingkat' => 10,
        ]);
        $studentWithScholarship = $this->createStudent($kelas, '0000000001', 'Siswa Laki-laki', [
            'program_keahlian_id' => $program->id,
            'konsentrasi_keahlian_id' => $concentration->id,
            'jenis_kelamin' => 'L',
            'tipe_program' => 'reguler',
            'kategori_beasiswa_id' => $scholarship->id,
        ]);
        $studentWithoutScholarship = $this->createStudent($kelas, '0000000002', 'Siswa Perempuan', [
            'program_keahlian_id' => $program->id,
            'konsentrasi_keahlian_id' => $concentration->id,
            'jenis_kelamin' => 'P',
            'tipe_program' => 'santri_internal',
        ]);
        Tagihan::create([
            'siswa_id' => $studentWithScholarship->id,
            'judul_tagihan' => 'SPP Oktober',
            'nominal' => 100000,
            'jatuh_tempo' => '2026-10-10',
            'status_bayar' => 'lunas',
        ]);
        Tagihan::create([
            'siswa_id' => $studentWithScholarship->id,
            'judul_tagihan' => 'Praktikum',
            'nominal' => 50000,
            'jatuh_tempo' => '2026-10-10',
            'status_bayar' => 'belum_lunas',
        ]);
        Tagihan::create([
            'siswa_id' => $studentWithoutScholarship->id,
            'judul_tagihan' => 'SPP Oktober',
            'nominal' => 50000,
            'jatuh_tempo' => '2026-10-10',
            'status_bayar' => 'belum_lunas',
        ]);

        $teacherUser = User::factory()->create(['role' => 'guru']);
        $teacher = Guru::create([
            'user_id' => $teacherUser->id,
            'nip' => 'GURU-001',
            'nama_lengkap' => 'Guru Otomotif',
        ]);
        $subject = MataPelajaran::create([
            'kode_mapel' => 'TO-001',
            'nama_mapel' => 'Dasar Otomotif',
        ]);
        Jadwal::create([
            'tahun_ajaran_id' => $activeYear->id,
            'kelas_id' => $kelas->id,
            'mapel_id' => $subject->id,
            'guru_id' => $teacher->id,
            'hari' => 'senin',
            'jam_mulai' => '08:00:00',
            'jam_selesai' => '09:00:00',
        ]);
        Nilai::create([
            'tahun_ajaran_id' => $activeYear->id,
            'siswa_id' => $studentWithScholarship->id,
            'mapel_id' => $subject->id,
            'nilai_tugas' => 80,
            'nilai_uts' => 80,
            'nilai_uas' => 80,
            'nilai_akhir' => 80,
        ]);

        $previousClass = Kelas::create([
            'tahun_ajaran_id' => $previousYear->id,
            'nama_kelas' => 'IX TO 1',
            'tingkat' => 9,
        ]);
        $this->createStudent($previousClass, '0000000003', 'Siswa Tahun Lalu');

        $this->actingAs($admin)
            ->get(route('admin.laporan.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Laporan/Index')
                ->where('filters.tahun_ajaran_id', (string) $activeYear->id)
                ->has('laporanKeuangan', 1)
                ->where('laporanKeuangan.0.nama_kelas', 'X TO 1')
                ->where('laporanKeuangan.0.jumlah_siswa', 2)
                ->where('laporanKeuangan.0.total_tagihan', 200000)
                ->where('laporanKeuangan.0.total_terbayar', 100000)
                ->where('laporanKeuangan.0.total_tunggakan', 100000)
                ->where('laporanKeuangan.0.persentase_pelunasan', 50)
                ->has('demografiSiswa', 2)
                ->where('demografiSiswa.0.program_keahlian', 'Teknik Otomotif')
                ->where('demografiSiswa.0.konsentrasi_keahlian', 'Teknik Kendaraan Ringan')
                ->where('demografiSiswa.0.jumlah_aktif', 2)
                ->where('demografiSiswa.0.laki_laki', 1)
                ->where('demografiSiswa.0.perempuan', 1)
                ->where('demografiSiswa.0.reguler', 1)
                ->where('demografiSiswa.0.santri_internal', 1)
                ->where('demografiSiswa.0.beasiswa', 1)
                ->where('demografiSiswa.0.afirmasi', 1)
                ->where('demografiSiswa.1.konsentrasi_keahlian', 'Teknik Sepeda Motor')
                ->where('demografiSiswa.1.jumlah_aktif', 0)
                ->has('monitoringNilai', 1)
                ->where('monitoringNilai.0.nama_guru', 'Guru Otomotif')
                ->where('monitoringNilai.0.jumlah_nilai', 1)
                ->where('monitoringNilai.0.total_siswa', 2));
    }

    public function test_admin_can_filter_executive_reports_to_another_school_year(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $activeYear = TahunAjaran::create([
            'nama_tahun' => '2026/2027',
            'semester' => 'ganjil',
            'is_aktif' => true,
        ]);
        $previousYear = TahunAjaran::create([
            'nama_tahun' => '2025/2026',
            'semester' => 'genap',
            'is_aktif' => false,
        ]);
        $previousClass = Kelas::create([
            'tahun_ajaran_id' => $previousYear->id,
            'nama_kelas' => 'IX Akuntansi',
            'tingkat' => 9,
        ]);
        $student = $this->createStudent($previousClass, '0000000001', 'Siswa Tahun Lalu');
        $teacherUser = User::factory()->create(['role' => 'guru']);
        $teacher = Guru::create([
            'user_id' => $teacherUser->id,
            'nip' => 'GURU-002',
            'nama_lengkap' => 'Guru Tahun Lalu',
        ]);
        $subject = MataPelajaran::create([
            'kode_mapel' => 'AK-001',
            'nama_mapel' => 'Akuntansi',
        ]);
        Jadwal::create([
            'tahun_ajaran_id' => $previousYear->id,
            'kelas_id' => $previousClass->id,
            'mapel_id' => $subject->id,
            'guru_id' => $teacher->id,
            'hari' => 'selasa',
            'jam_mulai' => '08:00:00',
            'jam_selesai' => '09:00:00',
        ]);
        Tagihan::create([
            'siswa_id' => $student->id,
            'judul_tagihan' => 'SPP',
            'nominal' => 250000,
            'jatuh_tempo' => '2025-10-10',
            'status_bayar' => 'belum_lunas',
        ]);

        $this->actingAs($admin)
            ->get(route('admin.laporan.index', ['tahun_ajaran_id' => $previousYear->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.tahun_ajaran_id', (string) $previousYear->id)
                ->has('laporanKeuangan', 1)
                ->where('laporanKeuangan.0.nama_kelas', 'IX Akuntansi')
                ->where('laporanKeuangan.0.total_tunggakan', 250000)
                ->has('demografiSiswa', 1)
                ->where('demografiSiswa.0.jumlah_aktif', 1)
                ->has('monitoringNilai', 1)
                ->where('monitoringNilai.0.nama_tahun', '2025/2026')
                ->where('monitoringNilai.0.jumlah_nilai', 0)
                ->where('monitoringNilai.0.total_siswa', 1));
    }

    public function test_unauthenticated_user_is_redirected_to_login(): void
    {
        $this->get(route('admin.laporan.index'))
            ->assertRedirect(route('login'));
    }

    #[DataProvider('nonAdminRoles')]
    public function test_non_admin_roles_cannot_view_reports(string $role): void
    {
        $user = User::factory()->create(['role' => $role]);

        $this->actingAs($user)
            ->get(route('admin.laporan.index'))
            ->assertForbidden();
    }

    public static function nonAdminRoles(): array
    {
        return [
            'guru' => ['guru'],
            'siswa' => ['siswa'],
        ];
    }

    public function test_nonexistent_school_year_is_rejected(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->from(route('admin.laporan.index'))
            ->get(route('admin.laporan.index', ['tahun_ajaran_id' => 99999]))
            ->assertRedirect(route('admin.laporan.index'))
            ->assertSessionHasErrors('tahun_ajaran_id');
    }

    public function test_legacy_csv_report_route_is_not_available(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->get('/admin/laporan/export/spmb')
            ->assertNotFound();
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function createStudent(Kelas $kelas, string $nisn, string $name, array $attributes = []): Siswa
    {
        $user = User::factory()->create(['role' => 'siswa']);

        return Siswa::create(array_merge([
            'user_id' => $user->id,
            'kelas_id' => $kelas->id,
            'nisn' => $nisn,
            'nama_lengkap' => $name,
            'status_siswa' => 'aktif',
        ], $attributes));
    }
}
