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
                'nama_lengkap' => 'Dewi Puspita, S.T., M.Pd.',
                'username' => 'dewi.puspita',
                'no_wa' => '081234567890',
                'password' => 'initial-password',
                'is_wali_kelas' => true,
            ])
            ->assertRedirect(route('admin.guru.index', absolute: false));

        $guru = Guru::query()->where('nip', '19870001')->firstOrFail();
        $user = $guru->user;

        $this->assertSame('guru', $user->role);
        $this->assertSame('dewi.puspita', $user->username);
        $this->assertSame('Dewi Puspita, S.T., M.Pd.', $user->name);
        $this->assertNull($user->email);
        $this->assertTrue($guru->is_wali_kelas);
        $this->assertTrue(Hash::check('initial-password', $user->password));
        $this->assertTrue($user->must_change_password);
        $this->assertNotNull($user->email_verified_at);

        $user->forceFill(['must_change_password' => false])->save();

        $this->actingAs($admin)
            ->put(route('admin.guru.update', $guru), [
                'nip' => '19870002',
                'nama_lengkap' => 'Dewi Puspita Baru, S.Pd.',
                'username' => 'dewi.guru',
                'email' => 'dewi.baru@sekolah.sch.id',
                'no_wa' => '081234567891',
                'password' => 'teacher-secret-2026',
                'is_wali_kelas' => false,
            ])
            ->assertRedirect(route('admin.guru.index', absolute: false));

        $guru->refresh();
        $user->refresh();
        $this->assertSame('19870002', $guru->nip);
        $this->assertFalse($guru->is_wali_kelas);
        $this->assertSame('dewi.guru', $user->username);
        $this->assertSame('Dewi Puspita Baru, S.Pd.', $user->name);
        $this->assertSame('dewi.baru@sekolah.sch.id', $user->email);
        $this->assertNull($user->email_verified_at);
        $this->assertTrue(Hash::check('teacher-secret-2026', $user->password));
        $this->assertTrue($user->must_change_password);

        $this->actingAs($admin)
            ->delete(route('admin.guru.destroy', $guru))
            ->assertRedirect(route('admin.guru.index', absolute: false));

        $this->assertDatabaseMissing('gurus', ['id' => $guru->id]);
        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }

    public function test_admin_cannot_assign_a_username_already_used_by_another_teacher(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->post(route('admin.guru.store'), [
                'nip' => '19870020',
                'nama_lengkap' => 'Dewi Puspita',
                'username' => 'dewi.puspita',
                'password' => 'password-pertama',
                'is_wali_kelas' => false,
            ])
            ->assertRedirect(route('admin.guru.index', absolute: false));

        $this->actingAs($admin)
            ->from(route('admin.guru.index'))
            ->post(route('admin.guru.store'), [
                'nip' => '19870021',
                'nama_lengkap' => 'Guru Dengan Username Sama',
                'username' => 'dewi.puspita',
                'password' => 'password-kedua',
                'is_wali_kelas' => false,
            ])
            ->assertRedirect(route('admin.guru.index', absolute: false))
            ->assertSessionHasErrors([
                'username' => 'Username sudah digunakan.',
            ]);

        $this->assertDatabaseCount('gurus', 1);
        $this->assertDatabaseHas('users', ['username' => 'dewi.puspita']);
    }

    public function test_admin_cannot_use_a_sixteen_digit_username_that_would_be_treated_as_a_nik(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->from(route('admin.guru.index'))
            ->post(route('admin.guru.store'), [
                'nip' => '19870023',
                'nama_lengkap' => 'Guru Pengguna NIK',
                'username' => '1234567890123456',
                'password' => 'teacher-secret-2026',
                'is_wali_kelas' => false,
            ])
            ->assertRedirect(route('admin.guru.index', absolute: false))
            ->assertSessionHasErrors([
                'username' => 'Username tidak boleh berupa 16 digit angka karena akan dianggap sebagai NIK.',
            ]);

        $this->assertDatabaseCount('gurus', 0);
    }

    public function test_migration_shortens_existing_teacher_usernames_without_changing_other_accounts(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'username' => 'ACHMAD.SYAFIIQUNNAJA',
        ]);
        $teacher = User::factory()->create([
            'role' => 'guru',
            'name' => 'Achmad Syafiiqunnaja, S.T., M.Pd.',
            'username' => 'achmad.syafiiqunnaja.s.t.m.pd',
            'password' => 'secure-password',
            'must_change_password' => false,
        ]);
        Guru::create([
            'user_id' => $teacher->id,
            'nip' => '19870022',
            'nama_lengkap' => 'Achmad Syafiiqunnaja, S.T., M.Pd.',
            'is_wali_kelas' => false,
        ]);

        $migration = require database_path('migrations/2026_11_27_184234_update_teacher_usernames_without_titles.php');
        $migration->up();

        $teacher->refresh();
        $admin->refresh();
        $this->assertSame('achmad.syafiiqunnaja.2', $teacher->username);
        $this->assertTrue(Hash::check('secure-password', $teacher->password));
        $this->assertFalse($teacher->must_change_password);
        $this->assertSame('ACHMAD.SYAFIIQUNNAJA', $admin->username);
    }

    public function test_admin_can_reset_all_teacher_passwords_and_open_a_no_cache_credentials_printout(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        for ($index = 1; $index <= 12; $index++) {
            $name = $index === 1
                ? 'Guru <script>alert(1)</script>'
                : 'Guru Akun '.$index;
            $teacher = User::factory()->create([
                'role' => 'guru',
                'name' => $name,
                'username' => 'guru.'.$index,
                'password' => 'old-password',
                'must_change_password' => false,
            ]);

            Guru::create([
                'user_id' => $teacher->id,
                'nip' => '19870'.str_pad((string) $index, 3, '0', STR_PAD_LEFT),
                'nama_lengkap' => $name,
                'is_wali_kelas' => false,
            ]);
        }

        $response = $this->actingAs($admin)
            ->post(route('admin.guru.credentials-pdf'))
            ->assertOk()
            ->assertViewIs('admin.guru.credentials-pdf')
            ->assertSee('Simpan ke PDF / Cetak')
            ->assertSee('&lt;script&gt;', false)
            ->assertDontSee('<script>alert(1)</script>', false);

        $cacheControl = $response->headers->get('Cache-Control');
        $this->assertStringContainsString('no-store', $cacheControl);
        $this->assertStringContainsString('private', $cacheControl);
        $this->assertStringContainsString('max-age=0', $cacheControl);
        $response->assertViewHas('credentials', function (array $credentials) use ($response): bool {
            $this->assertCount(12, $credentials);
            $passwords = [];

            foreach ($credentials as $credential) {
                $teacher = User::query()->where('username', $credential['username'])->firstOrFail();

                $this->assertTrue(Hash::check($credential['password'], $teacher->password));
                $this->assertTrue($teacher->must_change_password);
                $this->assertNotSame($credential['password'], $teacher->password);
                $response->assertSee($credential['password']);
                $passwords[] = $credential['password'];
            }

            $this->assertCount(12, array_unique($passwords));

            return true;
        });
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

        $this->actingAs($guru)
            ->post(route('admin.guru.credentials-pdf'))
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

        $this->post(route('admin.guru.credentials-pdf'))
            ->assertRedirect(route('login'));

        $this->assertFalse(Hash::check('password', $teacher->refresh()->password));
    }
}
