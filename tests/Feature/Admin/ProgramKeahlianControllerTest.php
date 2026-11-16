<?php

namespace Tests\Feature\Admin;

use App\Models\Kelas;
use App\Models\KonsentrasiKeahlian;
use App\Models\ProgramKeahlian;
use App\Models\TahunAjaran;
use App\Models\User;
use Database\Seeders\ProgramKeahlianSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProgramKeahlianControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_manage_programs_and_concentrations_from_class_master_routes(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->post(route('admin.program-keahlian.store'), [
                'kode_jurusan' => 'TO',
                'nama_jurusan' => 'Teknik Otomotif',
                'keterangan' => 'Program otomotif.',
            ])
            ->assertRedirect(route('admin.kelas.index', absolute: false));

        $program = ProgramKeahlian::query()->where('kode_jurusan', 'TO')->firstOrFail();

        $this->actingAs($admin)
            ->post(route('admin.program-keahlian.konsentrasi.store', $program), [
                'kode_konsentrasi' => 'TKR',
                'nama_konsentrasi' => 'Teknik Kendaraan Ringan',
            ])
            ->assertRedirect(route('admin.kelas.index', absolute: false));

        $concentration = KonsentrasiKeahlian::query()
            ->where('kode_konsentrasi', 'TKR')
            ->firstOrFail();

        $this->actingAs($admin)
            ->put(route('admin.program-keahlian.update', $program), [
                'kode_jurusan' => 'TO',
                'nama_jurusan' => 'Teknologi Otomotif',
                'keterangan' => 'Keterangan diperbarui.',
            ])
            ->assertRedirect(route('admin.kelas.index', absolute: false));

        $this->assertDatabaseHas('program_keahlians', [
            'id' => $program->id,
            'nama_jurusan' => 'Teknologi Otomotif',
        ]);
        $this->assertSame($program->id, $concentration->program_keahlian_id);

        $this->actingAs($admin)
            ->delete(route('admin.konsentrasi-keahlian.destroy', $concentration))
            ->assertRedirect(route('admin.kelas.index', absolute: false));

        $this->actingAs($admin)
            ->delete(route('admin.program-keahlian.destroy', $program))
            ->assertRedirect(route('admin.kelas.index', absolute: false));

        $this->assertModelMissing($program);
    }

    public function test_admin_cannot_delete_a_program_or_concentration_used_by_a_class(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $program = ProgramKeahlian::create([
            'kode_jurusan' => 'TF',
            'nama_jurusan' => 'Teknologi Farmasi',
        ]);
        $concentration = $program->konsentrasiKeahlians()->create([
            'kode_konsentrasi' => 'FI',
            'nama_konsentrasi' => 'Farmasi Industri',
        ]);
        $tahunAjaran = TahunAjaran::create([
            'nama_tahun' => '2026/2027',
            'semester' => 'ganjil',
            'is_aktif' => true,
        ]);
        $kelas = Kelas::create([
            'tahun_ajaran_id' => $tahunAjaran->id,
            'program_keahlian_id' => $program->id,
            'konsentrasi_keahlian_id' => $concentration->id,
            'nama_kelas' => 'X Farmasi',
            'tingkat' => 10,
        ]);

        $this->actingAs($admin)
            ->from(route('admin.kelas.index'))
            ->delete(route('admin.konsentrasi-keahlian.destroy', $concentration))
            ->assertRedirectToRoute('admin.kelas.index')
            ->assertSessionHas('error');

        $this->actingAs($admin)
            ->from(route('admin.kelas.index'))
            ->delete(route('admin.program-keahlian.destroy', $program))
            ->assertRedirectToRoute('admin.kelas.index')
            ->assertSessionHas('error');

        $this->assertModelExists($kelas);
        $this->assertModelExists($concentration);
        $this->assertModelExists($program);
    }

    public function test_program_seeder_is_idempotent_and_creates_the_requested_default_options(): void
    {
        $this->seed(ProgramKeahlianSeeder::class);
        $this->seed(ProgramKeahlianSeeder::class);

        $this->assertDatabaseCount('program_keahlians', 3);
        $this->assertDatabaseCount('konsentrasi_keahlians', 4);
        $this->assertDatabaseHas('program_keahlians', [
            'kode_jurusan' => 'AKL',
            'nama_jurusan' => 'Akuntansi dan Keuangan Lembaga',
        ]);
        $this->assertDatabaseHas('konsentrasi_keahlians', [
            'kode_konsentrasi' => 'TSM',
            'nama_konsentrasi' => 'Teknik Sepeda Motor',
        ]);
    }

    public function test_non_admin_cannot_manage_programs(): void
    {
        $guru = User::factory()->create(['role' => 'guru']);

        $this->actingAs($guru)
            ->post(route('admin.program-keahlian.store'), [])
            ->assertForbidden();

        $this->assertDatabaseCount('program_keahlians', 0);
    }
}
