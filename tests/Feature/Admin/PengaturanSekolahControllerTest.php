<?php

namespace Tests\Feature\Admin;

use App\Models\PengaturanSekolah;
use App\Models\Siswa;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PengaturanSekolahControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_update_school_identity(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->get(route('admin.pengaturan.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/PengaturanSekolah/Index')
                ->where('pengaturanSekolah.nama_sekolah', 'Nama Sekolah')
                ->where('pengaturanSekolah.status_rilis_rapor', 'otomatis'));

        $this->post(route('admin.pengaturan.update'), [
            '_method' => 'put',
            'nama_sekolah' => 'SMA Negeri 1 Contoh',
            'npsn' => '12345678',
            'alamat' => 'Jl. Pendidikan No. 1',
            'tempat_rapor' => 'Kesugihan',
            'tanggal_rapor' => '2026-11-16',
            'status_rilis_rapor' => 'buka',
            'telepon' => '021123456',
            'email' => 'info@sekolah.sch.id',
            'kepala_sekolah' => 'Dewi Puspita',
            'niky_kepala_sekolah' => 'NIKY-001',
            'tarif_spp_reguler' => 250000,
            'tarif_praktikum' => 150000,
        ])->assertRedirectToRoute('admin.pengaturan.index');

        $settings = PengaturanSekolah::query()->findOrFail(1);

        $this->assertSame('SMA Negeri 1 Contoh', $settings->nama_sekolah);
        $this->assertSame('Kesugihan', $settings->tempat_rapor);
        $this->assertSame('2026-11-16', $settings->tanggal_rapor->toDateString());
        $this->assertSame('buka', $settings->status_rilis_rapor);
        $this->assertSame('NIKY-001', $settings->niky_kepala_sekolah);
        $this->assertSame('250000.00', $settings->tarif_spp_reguler);
        $this->assertSame('150000.00', $settings->tarif_praktikum);
    }

    public function test_logo_upload_does_not_change_the_static_school_logo(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $settings = PengaturanSekolah::query()->findOrFail(1);
        $settings->update(['logo_path' => 'identitas-sekolah/logo-lama.png']);

        $this->actingAs($admin)
            ->put(route('admin.pengaturan.update'), [
                'nama_sekolah' => $settings->nama_sekolah,
                'tarif_spp_reguler' => $settings->tarif_spp_reguler,
                'tarif_praktikum' => $settings->tarif_praktikum,
                'logo' => UploadedFile::fake()->image('logo.png'),
            ])
            ->assertRedirectToRoute('admin.pengaturan.index');

        $this->assertSame('identitas-sekolah/logo-lama.png', $settings->fresh()->logo_path);
    }

    public function test_admin_cannot_save_an_invalid_report_release_status(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $settings = PengaturanSekolah::query()->findOrFail(1);

        $this->actingAs($admin)
            ->put(route('admin.pengaturan.update'), [
                'nama_sekolah' => $settings->nama_sekolah,
                'tarif_spp_reguler' => $settings->tarif_spp_reguler,
                'tarif_praktikum' => $settings->tarif_praktikum,
                'status_rilis_rapor' => 'rilis',
            ])
            ->assertSessionHasErrors([
                'status_rilis_rapor' => 'Pilihan kontrol rilis rapor tidak valid.',
            ]);

        $this->assertSame('otomatis', $settings->fresh()->status_rilis_rapor);
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

    public function test_school_identity_is_shared_with_the_login_page_and_student_report(): void
    {
        PengaturanSekolah::query()->findOrFail(1)->update([
            'nama_sekolah' => 'SMA Negeri 1 Contoh',
            'alamat' => 'Jl. Pendidikan No. 1',
            'tempat_rapor' => 'Kesugihan',
            'tanggal_rapor' => '2026-11-16',
            'status_rilis_rapor' => 'otomatis',
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

        $this->get(route('login'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Auth/Login')
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
                ->where('pengaturanSekolah.tanggal_rapor', '2026-11-16')
                ->where('pengaturanSekolah.status_rilis_rapor', 'otomatis'));
    }
}
