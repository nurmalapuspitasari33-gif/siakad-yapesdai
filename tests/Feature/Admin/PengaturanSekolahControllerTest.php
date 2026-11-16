<?php

namespace Tests\Feature\Admin;

use App\Models\PengaturanSekolah;
use App\Models\Siswa;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PengaturanSekolahControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_update_school_identity_and_upload_a_logo(): void
    {
        Storage::fake('public');
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->get(route('admin.pengaturan.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/PengaturanSekolah/Index')
                ->where('pengaturanSekolah.nama_sekolah', 'Nama Sekolah')
                ->where(
                    'pengaturanSekolah.info_spmb',
                    'Pendaftaran SPMB dilakukan secara daring melalui portal ini. Lengkapi formulir dan berkas persyaratan, lalu pantau hasil seleksi melalui akun Anda.',
                ));

        $this->post(route('admin.pengaturan.update'), [
            '_method' => 'put',
            'nama_sekolah' => 'SMA Negeri 1 Contoh',
            'npsn' => '12345678',
            'alamat' => 'Jl. Pendidikan No. 1',
            'tempat_rapor' => 'Kesugihan',
            'tanggal_rapor' => '2026-11-16',
            'telepon' => '021123456',
            'email' => 'info@sekolah.sch.id',
            'kepala_sekolah' => 'Dewi Puspita',
            'niky_kepala_sekolah' => 'NIKY-001',
            'info_spmb' => 'Pendaftaran dibuka bulan Januari.',
            'template_kokurikuler' => 'Ananda sudah {predikat} dalam kegiatan.',
            'tarif_spp_reguler' => 250000,
            'tarif_praktikum' => 150000,
            'logo' => UploadedFile::fake()->image('logo.png'),
        ])->assertRedirectToRoute('admin.pengaturan.index');

        $settings = PengaturanSekolah::query()->findOrFail(1);

        $this->assertSame('SMA Negeri 1 Contoh', $settings->nama_sekolah);
        $this->assertSame('Kesugihan', $settings->tempat_rapor);
        $this->assertSame('2026-11-16', $settings->tanggal_rapor->toDateString());
        $this->assertSame('NIKY-001', $settings->niky_kepala_sekolah);
        $this->assertSame('Ananda sudah {predikat} dalam kegiatan.', $settings->template_kokurikuler);
        $this->assertSame('250000.00', $settings->tarif_spp_reguler);
        $this->assertSame('150000.00', $settings->tarif_praktikum);
        $this->assertNotNull($settings->logo_path);
        Storage::disk('public')->assertExists($settings->logo_path);

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('pengaturanSekolah.logo_url', Storage::disk('public')->url($settings->logo_path)));
    }

    public function test_invalid_logo_does_not_update_school_identity(): void
    {
        Storage::fake('public');
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->put(route('admin.pengaturan.update'), [
                'nama_sekolah' => 'Nama yang Tidak Valid',
                'tarif_spp_reguler' => 0,
                'tarif_praktikum' => 0,
                'logo' => UploadedFile::fake()->create('logo.pdf', 20, 'application/pdf'),
            ])
            ->assertSessionHasErrors('logo');

        $this->assertDatabaseHas('pengaturan_sekolahs', [
            'id' => 1,
            'nama_sekolah' => 'Nama Sekolah',
        ]);
        $this->assertSame([], Storage::disk('public')->allFiles('identitas-sekolah'));
    }

    public function test_non_admin_cannot_access_school_settings(): void
    {
        $guru = User::factory()->create(['role' => 'guru']);

        $this->actingAs($guru)
            ->get(route('admin.pengaturan.index'))
            ->assertForbidden();
    }

    public function test_guest_is_redirected_from_school_settings(): void
    {
        $this->get(route('admin.pengaturan.index'))
            ->assertRedirectToRoute('login');
    }

    public function test_school_identity_is_shared_with_the_landing_page_and_student_report(): void
    {
        PengaturanSekolah::query()->findOrFail(1)->update([
            'nama_sekolah' => 'SMA Negeri 1 Contoh',
            'alamat' => 'Jl. Pendidikan No. 1',
            'tempat_rapor' => 'Kesugihan',
            'tanggal_rapor' => '2026-11-16',
            'kepala_sekolah' => 'Dewi Puspita',
            'niky_kepala_sekolah' => 'NIKY-001',
        ]);
        $student = User::factory()->create(['role' => 'siswa']);
        Siswa::create([
            'user_id' => $student->id,
            'nisn' => '1234567890',
            'nama_lengkap' => 'Siswa Contoh',
            'status_siswa' => 'aktif',
        ]);

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('pengaturanSekolah.nama_sekolah', 'SMA Negeri 1 Contoh')
                ->where('pengaturanSekolah.alamat', 'Jl. Pendidikan No. 1')
                ->where('pengaturanSekolah.tempat_rapor', 'Kesugihan')
                ->where('pengaturanSekolah.tanggal_rapor', '2026-11-16'));

        $this->actingAs($student)
            ->get(route('siswa.rapor.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Siswa/Rapor/Index')
                ->where('pengaturanSekolah.nama_sekolah', 'SMA Negeri 1 Contoh')
                ->where('pengaturanSekolah.alamat', 'Jl. Pendidikan No. 1')
                ->where('pengaturanSekolah.kepala_sekolah', 'Dewi Puspita')
                ->where('pengaturanSekolah.niky_kepala_sekolah', 'NIKY-001')
                ->where('pengaturanSekolah.tempat_rapor', 'Kesugihan')
                ->where('pengaturanSekolah.tanggal_rapor', '2026-11-16'));
    }
}
