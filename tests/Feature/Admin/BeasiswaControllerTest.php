<?php

namespace Tests\Feature\Admin;

use App\Models\KategoriBeasiswa;
use App\Models\Siswa;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class BeasiswaControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_update_and_delete_a_beasiswa_category(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->get(route('admin.beasiswa.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Beasiswa/Index')
                ->has('kategoriBeasiswas', 0)
                ->where('tarif.tarif_spp_reguler', '0.00'));

        $this->post(route('admin.beasiswa.store'), [
            'nama_beasiswa' => 'Beasiswa Prestasi Uji',
            'jenis_potongan' => 'persen',
            'nilai_potongan' => 25,
            'is_afirmasi' => false,
            'keterangan' => 'Potongan prestasi.',
        ])->assertRedirectToRoute('admin.beasiswa.index');

        $category = KategoriBeasiswa::query()->where('nama_beasiswa', 'Beasiswa Prestasi Uji')->firstOrFail();

        $this->put(route('admin.beasiswa.update', $category), [
            'nama_beasiswa' => 'Beasiswa Prestasi',
            'jenis_potongan' => 'nominal',
            'nilai_potongan' => 500000,
            'is_afirmasi' => false,
            'keterangan' => 'Potongan nominal prestasi.',
        ])->assertRedirectToRoute('admin.beasiswa.index');

        $this->assertDatabaseHas('kategori_beasiswas', [
            'id' => $category->id,
            'nama_beasiswa' => 'Beasiswa Prestasi',
            'jenis_potongan' => 'nominal',
            'nilai_potongan' => 500000,
        ]);

        $this->delete(route('admin.beasiswa.destroy', $category))
            ->assertRedirectToRoute('admin.beasiswa.index');

        $this->assertDatabaseMissing('kategori_beasiswas', ['id' => $category->id]);
    }

    public function test_admin_cannot_delete_a_category_used_by_a_student(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $category = KategoriBeasiswa::create([
            'nama_beasiswa' => 'Afirmasi Terpakai',
            'jenis_potongan' => 'persen',
            'nilai_potongan' => 100,
            'is_afirmasi' => true,
        ]);
        $studentUser = User::factory()->create(['role' => 'siswa']);
        Siswa::create([
            'user_id' => $studentUser->id,
            'nisn' => '9000000001',
            'nama_lengkap' => 'Siswa Uji',
            'status_siswa' => 'aktif',
            'kategori_beasiswa_id' => $category->id,
        ]);

        $this->actingAs($admin)
            ->delete(route('admin.beasiswa.destroy', $category))
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertDatabaseHas('kategori_beasiswas', ['id' => $category->id]);
    }

    public function test_admin_cannot_create_a_percentage_discount_greater_than_one_hundred(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->post(route('admin.beasiswa.store'), [
                'nama_beasiswa' => 'Diskon Tidak Valid',
                'jenis_potongan' => 'persen',
                'nilai_potongan' => 101,
                'is_afirmasi' => false,
            ])
            ->assertSessionHasErrors('nilai_potongan');

        $this->assertDatabaseMissing('kategori_beasiswas', [
            'nama_beasiswa' => 'Diskon Tidak Valid',
        ]);
    }

    public function test_non_admin_cannot_access_beasiswa_categories(): void
    {
        $teacher = User::factory()->create(['role' => 'guru']);

        $this->actingAs($teacher)
            ->get(route('admin.beasiswa.index'))
            ->assertForbidden();
    }
}
