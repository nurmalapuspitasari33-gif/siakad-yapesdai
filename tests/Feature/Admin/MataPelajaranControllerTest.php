<?php

namespace Tests\Feature\Admin;

use App\Models\Guru;
use App\Models\Jadwal;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\PengaturanSekolah;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MataPelajaranControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_update_search_and_delete_subjects(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)
            ->post(route('admin.mapel.store'), [
                'kode_mapel' => 'MAT-001',
                'nama_mapel' => 'Matematika',
                'kelompok_mapel' => 'umum',
            ])
            ->assertRedirectToRoute('admin.mapel.index');
        $this->post(route('admin.mapel.store'), [
            'kode_mapel' => 'BIN-001',
            'nama_mapel' => 'Bahasa Indonesia',
            'kelompok_mapel' => 'umum',
        ])->assertRedirectToRoute('admin.mapel.index');

        $matematika = MataPelajaran::query()->where('kode_mapel', 'MAT-001')->firstOrFail();
        $this->assertDatabaseHas('mata_pelajarans', [
            'kode_mapel' => 'MAT-001',
            'nama_mapel' => 'Matematika',
        ]);

        $this->put(route('admin.mapel.update', $matematika), [
            'kode_mapel' => 'MAT-001',
            'nama_mapel' => 'Matematika Wajib',
            'kelompok_mapel' => 'kejuruan',
        ])->assertRedirectToRoute('admin.mapel.index');

        $this->assertDatabaseHas('mata_pelajarans', [
            'id' => $matematika->id,
            'nama_mapel' => 'Matematika Wajib',
            'kelompok_mapel' => 'kejuruan',
        ]);

        $this->get(route('admin.mapel.index', ['search' => 'MAT']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Mapel/Index')
                ->where('filters.search', 'MAT')
                ->has('mataPelajarans.data', 1)
                ->where('mataPelajarans.data.0.kode_mapel', 'MAT-001'));

        $this->delete(route('admin.mapel.destroy', $matematika))
            ->assertRedirectToRoute('admin.mapel.index');

        $this->assertModelMissing($matematika);
    }

    public function test_subject_search_treats_query_as_a_value_and_returns_no_unmatched_rows(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        MataPelajaran::create([
            'kode_mapel' => 'MAT-001',
            'nama_mapel' => 'Matematika',
        ]);

        $this->actingAs($admin)
            ->get(route('admin.mapel.index', ['search' => "' OR 1=1 --"]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Mapel/Index')
                ->has('mataPelajarans.data', 0));

        $this->assertDatabaseHas('mata_pelajarans', ['kode_mapel' => 'MAT-001']);
    }

    public function test_duplicate_subject_code_is_rejected_with_a_message(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        MataPelajaran::create([
            'kode_mapel' => 'MAT-001',
            'nama_mapel' => 'Matematika',
        ]);

        $this->actingAs($admin)
            ->post(route('admin.mapel.store'), [
                'kode_mapel' => 'MAT-001',
                'nama_mapel' => 'Matematika Lain',
            ])
            ->assertSessionHasErrors([
                'kode_mapel' => 'Kode mata pelajaran sudah digunakan.',
            ]);

        $this->assertDatabaseCount('mata_pelajarans', 1);
    }

    public function test_subject_group_is_required_and_restricted_to_supported_values(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->post(route('admin.mapel.store'), [
                'kode_mapel' => 'MUL-001',
                'nama_mapel' => 'Muatan Lokal',
                'kelompok_mapel' => 'pilihan',
            ])
            ->assertSessionHasErrors('kelompok_mapel');

        $this->assertDatabaseCount('mata_pelajarans', 0);

        $this->post(route('admin.mapel.store'), [
            'kode_mapel' => 'MUL-001',
            'nama_mapel' => 'Muatan Lokal',
        ])->assertSessionHasErrors('kelompok_mapel');
    }

    public function test_admin_can_update_the_kokurikuler_template_from_subject_management(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $template = 'Ananda menunjukkan capaian {predikat} dalam kegiatan kokurikuler.';

        $this->actingAs($admin)
            ->put(route('admin.mapel.template-kokurikuler.update'), [
                'template_kokurikuler' => $template,
            ])
            ->assertRedirectToRoute('admin.mapel.index', ['tab' => 'kokurikuler'])
            ->assertSessionHas('success', 'Templat deskripsi kokurikuler berhasil diperbarui.');

        $this->assertDatabaseHas('pengaturan_sekolahs', [
            'id' => 1,
            'template_kokurikuler' => $template,
        ]);

        $this->get(route('admin.mapel.index', ['tab' => 'kokurikuler']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Mapel/Index')
                ->where('activeTab', 'kokurikuler')
                ->where('templateKokurikuler', $template));
    }

    public function test_kokurikuler_template_rejects_values_longer_than_5000_characters(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $settings = PengaturanSekolah::query()->findOrFail(1);

        $this->actingAs($admin)
            ->put(route('admin.mapel.template-kokurikuler.update'), [
                'template_kokurikuler' => str_repeat('a', 5001),
            ])
            ->assertSessionHasErrors([
                'template_kokurikuler' => 'Templat deskripsi kokurikuler tidak boleh lebih dari 5000 karakter.',
            ]);

        $this->assertSame(null, $settings->fresh()->template_kokurikuler);
    }

    public function test_kokurikuler_template_must_be_included_in_the_update_request(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $settings = PengaturanSekolah::query()->findOrFail(1);

        $this->actingAs($admin)
            ->put(route('admin.mapel.template-kokurikuler.update'), [])
            ->assertSessionHasErrors([
                'template_kokurikuler' => 'Kolom templat kokurikuler wajib dikirim.',
            ]);

        $this->assertSame(null, $settings->fresh()->template_kokurikuler);
    }

    public function test_subject_cannot_be_deleted_while_used_by_a_schedule(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $tahunAjaran = TahunAjaran::create([
            'nama_tahun' => '2026/2027',
            'semester' => 'ganjil',
            'is_aktif' => true,
        ]);
        $subject = MataPelajaran::create([
            'kode_mapel' => 'MAT-001',
            'nama_mapel' => 'Matematika',
        ]);
        $guruUser = User::factory()->create(['role' => 'guru']);
        $guru = Guru::create([
            'user_id' => $guruUser->id,
            'nip' => 'GURU-004',
            'nama_lengkap' => 'Guru Matematika',
            'is_wali_kelas' => false,
        ]);
        $kelas = Kelas::create([
            'tahun_ajaran_id' => $tahunAjaran->id,
            'nama_kelas' => 'X IPA 1',
            'tingkat' => 10,
        ]);
        Jadwal::create([
            'tahun_ajaran_id' => $tahunAjaran->id,
            'kelas_id' => $kelas->id,
            'mapel_id' => $subject->id,
            'guru_id' => $guru->id,
            'hari' => 'senin',
            'jam_mulai' => '08:00:00',
            'jam_selesai' => '09:00:00',
        ]);

        $this->actingAs($admin)
            ->from(route('admin.mapel.index'))
            ->delete(route('admin.mapel.destroy', $subject))
            ->assertRedirectToRoute('admin.mapel.index')
            ->assertSessionHas('error', 'Mata pelajaran tidak dapat dihapus karena masih digunakan oleh jadwal, ujian, atau nilai.');

        $this->assertModelExists($subject);
    }

    public function test_guest_and_non_admin_cannot_access_subject_management(): void
    {
        $this->get(route('admin.mapel.index'))
            ->assertRedirectToRoute('login');

        $this->put(route('admin.mapel.template-kokurikuler.update'), [
            'template_kokurikuler' => 'Tidak diizinkan',
        ])->assertRedirectToRoute('login');

        $siswa = User::factory()->create(['role' => 'siswa']);

        $this->actingAs($siswa)
            ->get(route('admin.mapel.index'))
            ->assertForbidden();

        $this->put(route('admin.mapel.template-kokurikuler.update'), [
            'template_kokurikuler' => 'Tidak diizinkan',
        ])->assertForbidden();

        $this->post(route('admin.mapel.store'), [])
            ->assertForbidden();

        $this->assertDatabaseCount('mata_pelajarans', 0);
    }
}
