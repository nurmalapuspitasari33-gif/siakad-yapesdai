<?php

namespace Tests\Feature\Admin;

use App\Models\Kelas;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TahunAjaranControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_update_activate_and_delete_an_unreferenced_year(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $currentYear = TahunAjaran::create([
            'nama_tahun' => '2025/2026',
            'semester' => 'genap',
            'is_aktif' => true,
        ]);
        $nextYear = TahunAjaran::create([
            'nama_tahun' => '2026/2027',
            'semester' => 'ganjil',
            'is_aktif' => false,
        ]);

        $this->actingAs($admin)
            ->get(route('admin.tahun-ajaran.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/TahunAjaran/Index')
                ->has('tahunAjarans.data', 2));

        $this->actingAs($admin)
            ->post(route('admin.tahun-ajaran.store'), [
                'nama_tahun' => '2027/2028',
                'semester' => 'genap',
            ])
            ->assertRedirectToRoute('admin.tahun-ajaran.index');

        $this->assertDatabaseHas('tahun_ajarans', [
            'nama_tahun' => '2027/2028',
            'semester' => 'genap',
            'is_aktif' => false,
        ]);

        $this->put(route('admin.tahun-ajaran.update', $nextYear), [
            'nama_tahun' => '2026/2027',
            'semester' => 'genap',
        ])->assertRedirectToRoute('admin.tahun-ajaran.index');

        $this->assertDatabaseHas('tahun_ajarans', [
            'id' => $nextYear->id,
            'semester' => 'genap',
        ]);

        $this->patch(route('admin.tahun-ajaran.activate', $nextYear))
            ->assertRedirectToRoute('admin.tahun-ajaran.index');

        $this->assertDatabaseHas('tahun_ajarans', [
            'id' => $nextYear->id,
            'is_aktif' => true,
        ]);
        $this->assertDatabaseHas('tahun_ajarans', [
            'id' => $currentYear->id,
            'is_aktif' => false,
        ]);

        $this->delete(route('admin.tahun-ajaran.destroy', $currentYear))
            ->assertRedirectToRoute('admin.tahun-ajaran.index');

        $this->assertModelMissing($currentYear);
    }

    public function test_year_and_semester_must_be_unique_and_semester_must_be_supported(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        TahunAjaran::create([
            'nama_tahun' => '2026/2027',
            'semester' => 'ganjil',
            'is_aktif' => false,
        ]);

        $this->actingAs($admin)
            ->post(route('admin.tahun-ajaran.store'), [
                'nama_tahun' => '2026/2027',
                'semester' => 'ganjil',
            ])
            ->assertSessionHasErrors([
                'nama_tahun' => 'Tahun ajaran dan semester tersebut sudah tersedia.',
            ]);

        $this->post(route('admin.tahun-ajaran.store'), [
            'nama_tahun' => '2026/2027',
            'semester' => 'libur',
        ])->assertSessionHasErrors([
            'semester' => 'Semester yang dipilih tidak valid.',
        ]);

        $this->assertDatabaseCount('tahun_ajarans', 1);
    }

    public function test_year_cannot_be_deleted_while_active_or_referenced_by_a_class(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $activeYear = TahunAjaran::create([
            'nama_tahun' => '2026/2027',
            'semester' => 'ganjil',
            'is_aktif' => true,
        ]);
        $referencedYear = TahunAjaran::create([
            'nama_tahun' => '2025/2026',
            'semester' => 'genap',
            'is_aktif' => false,
        ]);
        Kelas::create([
            'tahun_ajaran_id' => $referencedYear->id,
            'nama_kelas' => 'IX A',
            'tingkat' => 9,
        ]);

        $this->actingAs($admin)
            ->from(route('admin.tahun-ajaran.index'))
            ->delete(route('admin.tahun-ajaran.destroy', $activeYear))
            ->assertRedirectToRoute('admin.tahun-ajaran.index')
            ->assertSessionHas('error', 'Aktifkan tahun ajaran lain sebelum menghapus tahun ajaran ini.');

        $this->delete(route('admin.tahun-ajaran.destroy', $referencedYear))
            ->assertRedirectToRoute('admin.tahun-ajaran.index')
            ->assertSessionHas('error', 'Tahun ajaran tidak dapat dihapus karena masih digunakan oleh kelas, jadwal, atau nilai.');

        $this->assertModelExists($activeYear);
        $this->assertModelExists($referencedYear);
    }

    public function test_guest_and_non_admin_cannot_access_year_management(): void
    {
        $this->get(route('admin.tahun-ajaran.index'))
            ->assertRedirectToRoute('login');

        $siswa = User::factory()->create(['role' => 'siswa']);

        $this->actingAs($siswa)
            ->get(route('admin.tahun-ajaran.index'))
            ->assertForbidden();

        $this->post(route('admin.tahun-ajaran.store'), [
            'nama_tahun' => '2026/2027',
            'semester' => 'ganjil',
        ])->assertForbidden();

        $this->assertDatabaseCount('tahun_ajarans', 0);
    }
}
