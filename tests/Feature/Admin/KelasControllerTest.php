<?php

namespace Tests\Feature\Admin;

use App\Models\Guru;
use App\Models\Kelas;
use App\Models\ProgramKeahlian;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class KelasControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_create_update_and_delete_a_class(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $tahunAjaran = TahunAjaran::create([
            'nama_tahun' => '2026/2027',
            'semester' => 'ganjil',
            'is_aktif' => true,
        ]);
        $waliUser = User::factory()->create(['role' => 'guru']);
        $waliKelas = Guru::create([
            'user_id' => $waliUser->id,
            'nip' => 'GURU-001',
            'nama_lengkap' => 'Dewi Anggraini',
            'is_wali_kelas' => true,
        ]);
        $guruBiasaUser = User::factory()->create(['role' => 'guru']);
        Guru::create([
            'user_id' => $guruBiasaUser->id,
            'nip' => 'GURU-002',
            'nama_lengkap' => 'Budi Santoso',
            'is_wali_kelas' => false,
        ]);

        $this->actingAs($admin)
            ->get(route('admin.kelas.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Kelas/Index')
                ->has('daftarKelas.data', 0)
                ->has('tahunAjarans', 1)
                ->has('guruWaliKelas', 1)
                ->where('guruWaliKelas.0.id', $waliKelas->id));

        $this->post(route('admin.kelas.store'), [
            'tahun_ajaran_id' => $tahunAjaran->id,
            'wali_kelas_id' => $waliKelas->id,
            'nama_kelas' => 'X IPA 1',
            'tingkat' => 10,
        ])->assertRedirectToRoute('admin.kelas.index');

        $kelas = Kelas::query()->where('nama_kelas', 'X IPA 1')->firstOrFail();
        $this->assertDatabaseHas('kelas', [
            'id' => $kelas->id,
            'tahun_ajaran_id' => $tahunAjaran->id,
            'wali_kelas_id' => $waliKelas->id,
            'tingkat' => 10,
        ]);

        $this->put(route('admin.kelas.update', $kelas), [
            'tahun_ajaran_id' => $tahunAjaran->id,
            'wali_kelas_id' => '',
            'nama_kelas' => 'X IPA 2',
            'tingkat' => 10,
        ])->assertRedirectToRoute('admin.kelas.index')
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('kelas', [
            'id' => $kelas->id,
            'nama_kelas' => 'X IPA 2',
            'wali_kelas_id' => null,
        ]);

        $this->delete(route('admin.kelas.destroy', $kelas))
            ->assertRedirectToRoute('admin.kelas.index');

        $this->assertModelMissing($kelas);
    }

    public function test_only_a_class_advisor_can_be_assigned_and_required_fields_are_validated(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $tahunAjaran = TahunAjaran::create([
            'nama_tahun' => '2026/2027',
            'semester' => 'ganjil',
            'is_aktif' => true,
        ]);
        $guruUser = User::factory()->create(['role' => 'guru']);
        $guruBiasa = Guru::create([
            'user_id' => $guruUser->id,
            'nip' => 'GURU-003',
            'nama_lengkap' => 'Guru Biasa',
            'is_wali_kelas' => false,
        ]);

        $this->actingAs($admin)
            ->post(route('admin.kelas.store'), [
                'tahun_ajaran_id' => $tahunAjaran->id,
                'wali_kelas_id' => $guruBiasa->id,
                'nama_kelas' => 'XI IPA 1',
                'tingkat' => 11,
            ])
            ->assertSessionHasErrors([
                'wali_kelas_id' => 'The selected wali kelas id is invalid.',
            ]);

        $this->post(route('admin.kelas.store'), [])
            ->assertSessionHasErrors(['tahun_ajaran_id', 'nama_kelas', 'tingkat']);

        $this->assertDatabaseCount('kelas', 0);
    }

    public function test_class_cannot_be_deleted_while_it_has_students(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $tahunAjaran = TahunAjaran::create([
            'nama_tahun' => '2026/2027',
            'semester' => 'ganjil',
            'is_aktif' => true,
        ]);
        $kelas = Kelas::create([
            'tahun_ajaran_id' => $tahunAjaran->id,
            'nama_kelas' => 'X IPA 1',
            'tingkat' => 10,
        ]);
        $studentUser = User::factory()->create(['role' => 'siswa']);
        Siswa::create([
            'user_id' => $studentUser->id,
            'kelas_id' => $kelas->id,
            'nisn' => '0012345678',
            'nama_lengkap' => 'Siswa Contoh',
            'status_siswa' => 'aktif',
        ]);

        $this->assertDatabaseHas('siswas', ['kelas_id' => $kelas->id]);

        $this->actingAs($admin)
            ->from(route('admin.kelas.index'))
            ->delete(route('admin.kelas.destroy', $kelas))
            ->assertRedirectToRoute('admin.kelas.index')
            ->assertSessionHas('error', 'Kelas tidak dapat dihapus karena masih memiliki siswa, jadwal, atau ujian.');

        $this->assertModelExists($kelas);
    }

    public function test_class_program_and_concentration_must_belong_to_the_same_program(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $tahunAjaran = TahunAjaran::create([
            'nama_tahun' => '2026/2027',
            'semester' => 'ganjil',
            'is_aktif' => true,
        ]);
        $program = ProgramKeahlian::create([
            'kode_jurusan' => 'TO',
            'nama_jurusan' => 'Teknik Otomotif',
        ]);
        $otherProgram = ProgramKeahlian::create([
            'kode_jurusan' => 'TF',
            'nama_jurusan' => 'Teknologi Farmasi',
        ]);
        $concentration = $program->konsentrasiKeahlians()->create([
            'kode_konsentrasi' => 'TKR',
            'nama_konsentrasi' => 'Teknik Kendaraan Ringan',
        ]);

        $this->actingAs($admin)
            ->post(route('admin.kelas.store'), [
                'tahun_ajaran_id' => $tahunAjaran->id,
                'nama_kelas' => 'X TKR 1',
                'tingkat' => 10,
                'program_keahlian_id' => $otherProgram->id,
                'konsentrasi_keahlian_id' => $concentration->id,
            ])
            ->assertSessionHasErrors('konsentrasi_keahlian_id');

        $this->actingAs($admin)
            ->post(route('admin.kelas.store'), [
                'tahun_ajaran_id' => $tahunAjaran->id,
                'nama_kelas' => 'X TKR 1',
                'tingkat' => 10,
                'program_keahlian_id' => $program->id,
                'konsentrasi_keahlian_id' => $concentration->id,
            ])
            ->assertRedirectToRoute('admin.kelas.index');

        $this->assertDatabaseHas('kelas', [
            'nama_kelas' => 'X TKR 1',
            'program_keahlian_id' => $program->id,
            'konsentrasi_keahlian_id' => $concentration->id,
        ]);
    }

    public function test_guest_and_non_admin_cannot_access_class_management(): void
    {
        $this->get(route('admin.kelas.index'))
            ->assertRedirectToRoute('login');

        $guru = User::factory()->create(['role' => 'guru']);

        $this->actingAs($guru)
            ->get(route('admin.kelas.index'))
            ->assertForbidden();

        $this->post(route('admin.kelas.store'), [])
            ->assertForbidden();

        $this->assertDatabaseCount('kelas', 0);
    }
}
