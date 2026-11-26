<?php

namespace Tests\Feature\Admin;

use App\Models\GelombangSpmb;
use App\Models\SpmbBanner;
use App\Models\SpmbContent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SpmbCmsControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_activate_close_and_delete_an_unused_wave(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $activeWave = $this->createWave('Gelombang Lama', true);

        $this->actingAs($admin)
            ->get(route('admin.spmb-cms.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/SpmbCms/Index')
                ->has('gelombangs', 1)
                ->where('gelombangs.0.pendaftaran_spmbs_count', 0));

        $this->actingAs($admin)
            ->post(route('admin.spmb-cms.gelombang.store'), [
                'nama_gelombang' => 'Gelombang Baru',
                'tahun_ajaran' => '2026/2027',
                'tanggal_mulai' => today()->toDateString(),
                'tanggal_selesai' => today()->addMonth()->toDateString(),
                'kuota' => 80,
                'keterangan' => 'Pendaftaran tahap dua.',
            ])
            ->assertRedirectToRoute('admin.spmb-cms.index');

        $newWave = GelombangSpmb::query()->where('nama_gelombang', 'Gelombang Baru')->firstOrFail();

        $this->actingAs($admin)
            ->patch(route('admin.spmb-cms.gelombang.activate', $newWave))
            ->assertRedirectToRoute('admin.spmb-cms.index');

        $this->assertDatabaseHas('gelombang_spmbs', ['id' => $activeWave->id, 'is_active' => false]);
        $this->assertDatabaseHas('gelombang_spmbs', ['id' => $newWave->id, 'is_active' => true]);

        $this->actingAs($admin)
            ->patch(route('admin.spmb-cms.gelombang.close', $newWave))
            ->assertRedirectToRoute('admin.spmb-cms.index');
        $this->assertDatabaseHas('gelombang_spmbs', ['id' => $newWave->id, 'is_active' => false]);

        $this->actingAs($admin)
            ->delete(route('admin.spmb-cms.gelombang.destroy', $newWave))
            ->assertRedirectToRoute('admin.spmb-cms.index');
        $this->assertDatabaseMissing('gelombang_spmbs', ['id' => $newWave->id]);
    }

    public function test_admin_cannot_delete_a_wave_that_has_applicants(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $wave = $this->createWave('Gelombang Terpakai');
        $candidate = User::factory()->create(['role' => 'siswa']);
        $application = $candidate->pendaftaranSpmbs()->create([
            'gelombang_spmb_id' => $wave->id,
            'no_pendaftaran' => 'SPMB-2026-CMS00001',
            'asal_sekolah' => 'SMP Uji',
        ]);

        $this->actingAs($admin)
            ->delete(route('admin.spmb-cms.gelombang.destroy', $wave))
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertModelExists($application->fresh());
        $this->assertModelExists($wave->fresh());
    }

    public function test_admin_can_upload_replace_and_delete_a_banner_image(): void
    {
        Storage::fake('public');
        $admin = User::factory()->create(['role' => 'admin']);
        $payload = [
            'kicker' => 'Penerimaan Murid Baru',
            'judul' => 'Masa Depan Vokasi',
            'subjudul' => 'Informasi pendaftaran sekolah.',
            'gambar' => UploadedFile::fake()->image('hero.jpg', 900, 400),
            'cta_label' => 'Daftar Sekarang',
            'cta_url' => '/register',
            'urutan' => 1,
            'is_active' => true,
        ];

        $this->actingAs($admin)
            ->post(route('admin.spmb-cms.banner.store'), $payload)
            ->assertRedirectToRoute('admin.spmb-cms.index');

        $banner = SpmbBanner::query()->where('judul', 'Masa Depan Vokasi')->firstOrFail();
        $oldPath = $banner->gambar_path;
        Storage::disk('public')->assertExists($oldPath);

        $payload['gambar'] = UploadedFile::fake()->image('hero-baru.png', 900, 400);
        $payload['judul'] = 'Vokasi Siap Kerja';
        $payload['urutan'] = 2;

        $this->actingAs($admin)
            ->put(route('admin.spmb-cms.banner.update', $banner), $payload)
            ->assertRedirectToRoute('admin.spmb-cms.index');

        $banner->refresh();
        $this->assertSame('Vokasi Siap Kerja', $banner->judul);
        $this->assertNotSame($oldPath, $banner->gambar_path);
        Storage::disk('public')->assertMissing($oldPath);
        Storage::disk('public')->assertExists($banner->gambar_path);

        $this->actingAs($admin)
            ->delete(route('admin.spmb-cms.banner.destroy', $banner))
            ->assertRedirectToRoute('admin.spmb-cms.index');

        $this->assertDatabaseMissing('spmb_banners', ['id' => $banner->id]);
        Storage::disk('public')->assertMissing($banner->gambar_path);
    }

    public function test_banner_rejects_external_cta_urls_and_unsupported_images(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->post(route('admin.spmb-cms.banner.store'), [
                'kicker' => 'Kicker',
                'judul' => 'Judul',
                'subjudul' => 'Subjudul',
                'gambar' => UploadedFile::fake()->create('banner.svg', 100, 'image/svg+xml'),
                'cta_label' => 'Daftar',
                'cta_url' => 'javascript:alert(1)',
                'urutan' => 1,
                'is_active' => true,
            ])
            ->assertSessionHasErrors(['gambar', 'cta_url']);

        $this->assertDatabaseCount('spmb_banners', 0);
    }

    public function test_admin_can_update_portal_content_and_it_is_rendered_from_database(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->createWave('Gelombang CMS', true);
        $banner = SpmbBanner::create([
            'kicker' => 'SPMB Sekolah',
            'judul' => 'Banner dari CMS',
            'subjudul' => 'Deskripsi banner yang diperbarui.',
            'cta_label' => 'Mulai Daftar',
            'cta_url' => '/register',
            'urutan' => 0,
            'is_active' => true,
        ]);

        $this->actingAs($admin)
            ->put(route('admin.spmb-cms.contents.update'), [
                'jalur_seleksi' => [[
                    'judul' => 'Jalur Prestasi',
                    'badge' => 'Prestasi',
                    'deskripsi' => 'Untuk calon murid berprestasi.',
                    'jadwal_kuota' => 'Kuota 20 orang',
                    'status_buka' => true,
                ]],
                'persyaratan' => [[
                    'judul' => 'Kartu Keluarga',
                    'deskripsi' => 'Unggah foto dokumen.',
                ]],
                'alur' => [[
                    'judul' => 'Daftar dengan NIK',
                    'deskripsi' => 'Gunakan NIK 16 digit.',
                ]],
                'kontak' => [
                    'nomor_whatsapp' => '081234567890',
                    'nomor_telepon' => '0282123456',
                    'email' => 'spmb@sekolah.sch.id',
                    'alamat' => 'Kesugihan, Cilacap',
                ],
            ])
            ->assertRedirectToRoute('admin.spmb-cms.index');

        $this->get(route('home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Welcome')
                ->where('slides.0.judul', $banner->judul)
                ->where('pathways.0.judul', 'Jalur Prestasi')
                ->where('requirements.0.judul', 'Kartu Keluarga')
                ->where('processSteps.0.judul', 'Daftar dengan NIK')
                ->where('portalContacts.nomor_whatsapp', '081234567890')
                ->where('wave.nama_gelombang', 'Gelombang CMS')
                ->where('statistics.registration_open', true));

        $this->assertDatabaseHas('spmb_contents', [
            'content_key' => 'jalur_seleksi',
        ]);
    }

    public function test_admin_cms_is_not_available_to_non_admin_users(): void
    {
        $teacher = User::factory()->create(['role' => 'guru']);

        $this->actingAs($teacher)
            ->get(route('admin.spmb-cms.index'))
            ->assertForbidden();
    }

    private function createWave(string $name, bool $isActive = false): GelombangSpmb
    {
        return GelombangSpmb::create([
            'nama_gelombang' => $name,
            'tahun_ajaran' => '2026/2027',
            'tanggal_mulai' => today()->subDay(),
            'tanggal_selesai' => today()->addMonth(),
            'kuota' => 100,
            'is_active' => $isActive,
        ]);
    }
}
