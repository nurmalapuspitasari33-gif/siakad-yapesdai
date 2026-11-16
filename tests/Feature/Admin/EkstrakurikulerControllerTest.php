<?php

namespace Tests\Feature\Admin;

use App\Models\Ekstrakurikuler;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class EkstrakurikulerControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_and_update_an_extracurricular(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->post(route('admin.ekstrakurikuler.store'), [
                'nama_ekstra' => 'Pramuka',
                'is_aktif' => true,
            ])
            ->assertRedirectToRoute('admin.mapel.index', ['tab' => 'ekstrakurikuler']);

        $ekstrakurikuler = Ekstrakurikuler::query()->where('nama_ekstra', 'Pramuka')->firstOrFail();
        $this->assertTrue($ekstrakurikuler->is_aktif);

        $this->actingAs($admin)
            ->put(route('admin.ekstrakurikuler.update', $ekstrakurikuler), [
                'nama_ekstra' => 'Pramuka Wajib',
                'is_aktif' => false,
            ])
            ->assertRedirectToRoute('admin.mapel.index', ['tab' => 'ekstrakurikuler']);

        $this->assertDatabaseHas('ekstrakurikulers', [
            'id' => $ekstrakurikuler->id,
            'nama_ekstra' => 'Pramuka Wajib',
            'is_aktif' => false,
        ]);
    }

    public function test_admin_cannot_create_a_duplicate_extracurricular_name(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Ekstrakurikuler::create([
            'nama_ekstra' => 'Pramuka',
            'is_aktif' => true,
        ]);

        $this->actingAs($admin)
            ->from(route('admin.mapel.index', ['tab' => 'ekstrakurikuler']))
            ->post(route('admin.ekstrakurikuler.store'), [
                'nama_ekstra' => 'Pramuka',
                'is_aktif' => true,
            ])
            ->assertRedirect(route('admin.mapel.index', ['tab' => 'ekstrakurikuler']))
            ->assertSessionHasErrors('nama_ekstra');

        $this->assertDatabaseCount('ekstrakurikulers', 1);
    }

    public function test_non_admin_cannot_manage_extracurriculars(): void
    {
        $guru = User::factory()->create(['role' => 'guru']);

        $this->actingAs($guru)
            ->post(route('admin.ekstrakurikuler.store'), [
                'nama_ekstra' => 'Pramuka',
                'is_aktif' => true,
            ])
            ->assertForbidden();

        $this->assertDatabaseCount('ekstrakurikulers', 0);
    }

    public function test_guest_is_redirected_from_extracurricular_management(): void
    {
        $this->post(route('admin.ekstrakurikuler.store'), [
            'nama_ekstra' => 'Pramuka',
            'is_aktif' => true,
        ])->assertRedirectToRoute('login');

        $this->assertDatabaseCount('ekstrakurikulers', 0);
    }

    public function test_mapel_page_exposes_extracurriculars_on_the_master_tab(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Ekstrakurikuler::create([
            'nama_ekstra' => 'Pramuka',
            'is_aktif' => true,
        ]);
        Ekstrakurikuler::create([
            'nama_ekstra' => 'Kegiatan Lama',
            'is_aktif' => false,
        ]);

        $this->actingAs($admin)
            ->get(route('admin.mapel.index', ['tab' => 'ekstrakurikuler']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Mapel/Index')
                ->where('activeTab', 'ekstrakurikuler')
                ->has('ekstrakurikulers', 2)
                ->where('ekstrakurikulers.0.nama_ekstra', 'Kegiatan Lama')
                ->where('ekstrakurikulers.1.nama_ekstra', 'Pramuka'));
    }
}
