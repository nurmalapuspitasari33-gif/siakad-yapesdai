<?php

namespace Tests\Feature\Admin;

use App\Models\Guru;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\TahunAjaran;
use App\Models\TugasMengajar;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class GuruControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_update_and_delete_a_teacher_account(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->get(route('admin.guru.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Admin/Guru/Index'));

        $this->actingAs($admin)
            ->post(route('admin.guru.store'), [
                'nip' => '19870001',
                'nama_lengkap' => 'Dewi Puspita',
                'no_wa' => '081234567890',
                'is_wali_kelas' => true,
            ])
            ->assertRedirect(route('admin.guru.index', absolute: false));

        $guru = Guru::query()->where('nip', '19870001')->firstOrFail();
        $user = $guru->user;

        $this->assertSame('guru', $user->role);
        $this->assertSame('dewi.puspita', $user->username);
        $this->assertNull($user->email);
        $this->assertTrue($guru->is_wali_kelas);
        $this->assertTrue(Hash::check('password', $user->password));
        $this->assertTrue($user->must_change_password);
        $this->assertNotNull($user->email_verified_at);

        $this->actingAs($admin)
            ->put(route('admin.guru.update', $guru), [
                'nip' => '19870002',
                'nama_lengkap' => 'Dewi Puspita Baru',
                'email' => 'dewi.baru@sekolah.sch.id',
                'no_wa' => '081234567891',
                'password' => '',
                'is_wali_kelas' => false,
            ])
            ->assertRedirect(route('admin.guru.index', absolute: false));

        $guru->refresh();
        $user->refresh();
        $this->assertSame('19870002', $guru->nip);
        $this->assertFalse($guru->is_wali_kelas);
        $this->assertSame('dewi.puspita', $user->username);
        $this->assertSame('dewi.baru@sekolah.sch.id', $user->email);
        $this->assertNull($user->email_verified_at);
        $this->assertTrue(Hash::check('password', $user->password));

        $this->actingAs($admin)
            ->delete(route('admin.guru.destroy', $guru))
            ->assertRedirect(route('admin.guru.index', absolute: false));

        $this->assertDatabaseMissing('gurus', ['id' => $guru->id]);
        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }

    public function test_admin_gets_a_unique_username_for_teachers_with_the_same_name(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        foreach (['19870020', '19870021'] as $nip) {
            $this->actingAs($admin)
                ->post(route('admin.guru.store'), [
                    'nip' => $nip,
                    'nama_lengkap' => 'Dewi Puspita',
                    'is_wali_kelas' => false,
                ])
                ->assertRedirect(route('admin.guru.index', absolute: false));
        }

        $this->assertDatabaseHas('users', ['username' => 'dewi.puspita']);
        $this->assertDatabaseHas('users', ['username' => 'dewi.puspita.2']);
    }

    public function test_non_admin_cannot_manage_teacher_accounts(): void
    {
        $guru = User::factory()->create([
            'role' => 'guru',
            'password' => 'old-password',
        ]);
        $guruProfile = Guru::create([
            'user_id' => $guru->id,
            'nip' => '19870003',
            'nama_lengkap' => 'Guru Penguji',
            'is_wali_kelas' => false,
        ]);

        $this->actingAs($guru)
            ->get(route('admin.guru.index'))
            ->assertForbidden();

        $this->actingAs($guru)
            ->patch(route('admin.guru.reset-password', $guruProfile))
            ->assertForbidden();

        $this->assertFalse(Hash::check('password', $guru->refresh()->password));
    }

    public function test_admin_cannot_delete_a_teacher_with_teaching_assignments(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $teacherUser = User::factory()->create(['role' => 'guru']);
        $guru = Guru::create([
            'user_id' => $teacherUser->id,
            'nip' => '19870006',
            'nama_lengkap' => 'Guru dengan Penugasan',
            'is_wali_kelas' => false,
        ]);
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
        $mapel = MataPelajaran::create([
            'kode_mapel' => 'MAT-001',
            'nama_mapel' => 'Matematika',
        ]);
        TugasMengajar::create([
            'tahun_ajaran_id' => $tahunAjaran->id,
            'guru_id' => $guru->id,
            'kelas_id' => $kelas->id,
            'mapel_id' => $mapel->id,
            'jp_per_minggu' => 4,
        ]);

        $this->actingAs($admin)
            ->from(route('admin.guru.index'))
            ->delete(route('admin.guru.destroy', $guru))
            ->assertRedirect(route('admin.guru.index', absolute: false))
            ->assertSessionHas(
                'error',
                'Guru tidak dapat dihapus karena masih memiliki jadwal, penugasan mengajar, ujian, atau kelas wali.',
            );

        $this->assertDatabaseHas('gurus', ['id' => $guru->id]);
        $this->assertDatabaseHas('users', ['id' => $teacherUser->id]);
    }

    public function test_admin_can_reset_teacher_password(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $teacher = User::factory()->create([
            'role' => 'guru',
            'password' => 'old-password',
        ]);
        $guru = Guru::create([
            'user_id' => $teacher->id,
            'nip' => '19870004',
            'nama_lengkap' => 'Guru Uji',
            'is_wali_kelas' => false,
        ]);

        $this->actingAs($admin)
            ->patch(route('admin.guru.reset-password', $guru))
            ->assertRedirect(route('admin.guru.index', absolute: false))
            ->assertSessionHas(
                'success',
                'Kata sandi akun guru berhasil direset menjadi password dan wajib diganti saat login berikutnya.',
            );

        $teacher->refresh();
        $this->assertTrue(Hash::check('password', $teacher->password));
        $this->assertFalse(Hash::check('old-password', $teacher->password));
        $this->assertTrue($teacher->must_change_password);
    }

    public function test_guest_is_redirected_from_teacher_password_reset(): void
    {
        $teacher = User::factory()->create([
            'role' => 'guru',
            'password' => 'old-password',
        ]);
        $guru = Guru::create([
            'user_id' => $teacher->id,
            'nip' => '19870005',
            'nama_lengkap' => 'Guru Uji',
            'is_wali_kelas' => false,
        ]);

        $this->patch(route('admin.guru.reset-password', $guru))
            ->assertRedirect(route('login'));

        $this->assertFalse(Hash::check('password', $teacher->refresh()->password));
    }
}
