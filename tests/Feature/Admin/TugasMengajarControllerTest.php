<?php

namespace Tests\Feature\Admin;

use App\Models\Guru;
use App\Models\Jadwal;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\TahunAjaran;
use App\Models\TugasMengajar;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TugasMengajarControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_update_and_delete_a_teaching_assignment(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        [$tahunAjaran, $kelas, $guru, $mapel] = $this->createAssignmentData();

        $this->actingAs($admin)
            ->get(route('admin.tugas-mengajar.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/TugasMengajar/Index')
                ->has('tugasMengajars.data', 0)
                ->has('guruOptions', 1)
                ->has('kelasOptions', 1)
                ->has('mapelOptions', 1));

        $this->actingAs($admin)
            ->post(route('admin.tugas-mengajar.store'), [
                'guru_id' => $guru->id,
                'kelas_id' => $kelas->id,
                'mapel_id' => $mapel->id,
                'jp_per_minggu' => 4,
            ])
            ->assertRedirectToRoute('admin.tugas-mengajar.index');

        $tugasMengajar = TugasMengajar::query()->firstOrFail();
        $this->assertDatabaseHas('tugas_mengajars', [
            'id' => $tugasMengajar->id,
            'tahun_ajaran_id' => $tahunAjaran->id,
            'guru_id' => $guru->id,
            'kelas_id' => $kelas->id,
            'mapel_id' => $mapel->id,
            'jp_per_minggu' => 4,
        ]);

        $this->actingAs($admin)
            ->post(route('admin.tugas-mengajar.store'), [
                'guru_id' => $guru->id,
                'kelas_id' => $kelas->id,
                'mapel_id' => $mapel->id,
                'jp_per_minggu' => 4,
            ])
            ->assertSessionHasErrors([
                'mapel_id' => 'Kombinasi guru, kelas, dan mata pelajaran tersebut sudah terdaftar.',
            ]);

        $this->actingAs($admin)
            ->put(route('admin.tugas-mengajar.update', $tugasMengajar), [
                'guru_id' => $guru->id,
                'kelas_id' => $kelas->id,
                'mapel_id' => $mapel->id,
                'jp_per_minggu' => 6,
            ])
            ->assertRedirectToRoute('admin.tugas-mengajar.index');

        $this->assertDatabaseHas('tugas_mengajars', [
            'id' => $tugasMengajar->id,
            'jp_per_minggu' => 6,
        ]);

        $this->actingAs($admin)
            ->from(route('admin.tugas-mengajar.index'))
            ->delete(route('admin.tugas-mengajar.destroy', $tugasMengajar))
            ->assertRedirectToRoute('admin.tugas-mengajar.index');

        $this->assertModelMissing($tugasMengajar);
    }

    public function test_assignment_class_must_belong_to_the_active_academic_year(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        [, , $guru, $mapel] = $this->createAssignmentData();
        $tahunAjaranLain = TahunAjaran::create([
            'nama_tahun' => '2027/2028',
            'semester' => 'ganjil',
            'is_aktif' => false,
        ]);
        $kelasLain = Kelas::create([
            'tahun_ajaran_id' => $tahunAjaranLain->id,
            'nama_kelas' => 'XI IPA 1',
            'tingkat' => 11,
        ]);

        $this->actingAs($admin)
            ->post(route('admin.tugas-mengajar.store'), [
                'guru_id' => $guru->id,
                'kelas_id' => $kelasLain->id,
                'mapel_id' => $mapel->id,
                'jp_per_minggu' => 4,
            ])
            ->assertSessionHasErrors([
                'kelas_id' => 'Pilih kelas pada tahun ajaran aktif.',
            ]);

        $this->assertDatabaseCount('tugas_mengajars', 0);
    }

    public function test_weekly_target_must_be_at_least_one(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        [, $kelas, $guru, $mapel] = $this->createAssignmentData();

        $this->actingAs($admin)
            ->post(route('admin.tugas-mengajar.store'), [
                'guru_id' => $guru->id,
                'kelas_id' => $kelas->id,
                'mapel_id' => $mapel->id,
                'jp_per_minggu' => 0,
            ])
            ->assertSessionHasErrors([
                'jp_per_minggu' => 'Target JP minimal satu.',
            ]);

        $this->assertDatabaseCount('tugas_mengajars', 0);
    }

    public function test_weekly_target_must_not_exceed_255(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        [, $kelas, $guru, $mapel] = $this->createAssignmentData();

        $this->actingAs($admin)
            ->post(route('admin.tugas-mengajar.store'), [
                'guru_id' => $guru->id,
                'kelas_id' => $kelas->id,
                'mapel_id' => $mapel->id,
                'jp_per_minggu' => 256,
            ])
            ->assertSessionHasErrors([
                'jp_per_minggu' => 'Target JP maksimal 255.',
            ]);

        $this->assertDatabaseCount('tugas_mengajars', 0);
    }

    public function test_scheduled_assignment_cannot_be_reassigned_reduced_below_scheduled_jp_or_deleted(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        [$tahunAjaran, $kelas, $guru, $mapel] = $this->createAssignmentData();
        $tugasMengajar = TugasMengajar::create([
            'tahun_ajaran_id' => $tahunAjaran->id,
            'guru_id' => $guru->id,
            'kelas_id' => $kelas->id,
            'mapel_id' => $mapel->id,
            'jp_per_minggu' => 4,
        ]);
        Jadwal::create([
            'tahun_ajaran_id' => $tahunAjaran->id,
            'tugas_mengajar_id' => $tugasMengajar->id,
            'kelas_id' => $kelas->id,
            'mapel_id' => $mapel->id,
            'guru_id' => $guru->id,
            'jumlah_jp' => 2,
            'hari' => 'senin',
            'jam_mulai' => '08:00',
            'jam_selesai' => '09:20',
        ]);
        $anotherGuruUser = User::factory()->create(['role' => 'guru']);
        $anotherGuru = Guru::create([
            'user_id' => $anotherGuruUser->id,
            'nip' => '19870002',
            'nama_lengkap' => 'Guru Pengganti',
        ]);

        $this->actingAs($admin)
            ->put(route('admin.tugas-mengajar.update', $tugasMengajar), [
                'guru_id' => $anotherGuru->id,
                'kelas_id' => $kelas->id,
                'mapel_id' => $mapel->id,
                'jp_per_minggu' => 4,
            ])
            ->assertSessionHasErrors([
                'kelas_id' => 'Guru, kelas, dan mata pelajaran tidak dapat diubah setelah penugasan dipakai pada jadwal.',
            ]);

        $this->actingAs($admin)
            ->put(route('admin.tugas-mengajar.update', $tugasMengajar), [
                'guru_id' => $guru->id,
                'kelas_id' => $kelas->id,
                'mapel_id' => $mapel->id,
                'jp_per_minggu' => 1,
            ])
            ->assertSessionHasErrors([
                'jp_per_minggu' => 'Target JP tidak boleh lebih kecil dari JP yang sudah dijadwalkan.',
            ]);

        $this->actingAs($admin)
            ->from(route('admin.tugas-mengajar.index'))
            ->delete(route('admin.tugas-mengajar.destroy', $tugasMengajar))
            ->assertRedirect(route('admin.tugas-mengajar.index', absolute: false))
            ->assertSessionHas('error', 'Penugasan tidak dapat dihapus karena sudah digunakan oleh jadwal.');

        $this->assertModelExists($tugasMengajar);
    }

    public function test_non_admin_cannot_manage_teaching_assignments(): void
    {
        $guru = User::factory()->create(['role' => 'guru']);

        $this->actingAs($guru)
            ->get(route('admin.tugas-mengajar.index'))
            ->assertForbidden();
    }

    /**
     * @return array{TahunAjaran, Kelas, Guru, MataPelajaran}
     */
    private function createAssignmentData(): array
    {
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
        $guruUser = User::factory()->create(['role' => 'guru']);
        $guru = Guru::create([
            'user_id' => $guruUser->id,
            'nip' => '19870001',
            'nama_lengkap' => 'Guru Matematika',
        ]);
        $mapel = MataPelajaran::create([
            'kode_mapel' => 'MAT-001',
            'nama_mapel' => 'Matematika',
        ]);

        return [$tahunAjaran, $kelas, $guru, $mapel];
    }
}
