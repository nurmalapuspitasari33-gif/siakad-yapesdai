<?php

namespace Tests\Feature\Admin;

use App\Models\Kelas;
use App\Models\ProgramKeahlian;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SiswaControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_update_and_delete_an_active_student_account(): void
    {
        Storage::fake('public');
        $admin = User::factory()->create(['role' => 'admin']);
        $kelas = $this->createKelas('X IPA 1');
        $kelasLain = $this->createKelas('X IPA 2');

        $this->actingAs($admin)
            ->get(route('admin.siswa.index', ['kelas_id' => $kelas->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Siswa/Index')
                ->where('filters.kelas_id', (string) $kelas->id));

        $this->actingAs($admin)
            ->post(route('admin.siswa.store'), [
                'nisn' => '1000000001',
                'nama_lengkap' => 'Rani Putri',
                'email' => 'rani@sekolah.sch.id',
                'password' => 'password123',
                'kelas_id' => $kelas->id,
                'no_wa_wali' => '081234567890',
                'nis' => 'SMK-1001',
                'tempat_lahir' => 'Cilacap',
                'tanggal_lahir' => '2010-01-15',
                'jenis_kelamin' => 'P',
                'tipe_program' => 'reguler',
            ])
            ->assertRedirect(route('admin.siswa.index', absolute: false));

        $siswa = Siswa::query()->where('nisn', '1000000001')->firstOrFail();
        $user = $siswa->user;

        $this->assertSame('siswa', $user->role);
        $this->assertSame('aktif', $siswa->status_siswa);
        $this->assertTrue(Hash::check('password123', $user->password));

        $this->actingAs($admin)
            ->post(route('admin.siswa.update', $siswa), [
                '_method' => 'put',
                'nisn' => '1000000002',
                'nama_lengkap' => 'Rani Putri Baru',
                'email' => $user->email,
                'password' => '',
                'kelas_id' => $kelasLain->id,
                'no_wa_wali' => '081234567891',
                'nis' => 'SMK-1002',
                'alamat_murid' => 'Jl. Pendidikan',
                'foto_siswa' => UploadedFile::fake()->image('foto.jpg', 300, 400),
            ])
            ->assertRedirect(route('admin.siswa.index', absolute: false));

        $siswa->refresh();
        $this->assertSame('1000000002', $siswa->nisn);
        $this->assertSame('Rani Putri Baru', $siswa->nama_lengkap);
        $this->assertSame($kelasLain->id, $siswa->kelas_id);
        $this->assertSame('081234567891', $siswa->no_wa_wali);
        $this->assertSame('SMK-1002', $siswa->nis);
        $this->assertSame('Jl. Pendidikan', $siswa->alamat_murid);
        $this->assertNotNull($siswa->foto_siswa_path);
        Storage::disk('public')->assertExists($siswa->foto_siswa_path);

        $this->actingAs($admin)
            ->delete(route('admin.siswa.destroy', $siswa))
            ->assertRedirect(route('admin.siswa.index', absolute: false));

        $this->assertDatabaseMissing('siswas', ['id' => $siswa->id]);
        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }

    public function test_non_admin_cannot_manage_student_accounts(): void
    {
        $siswa = User::factory()->create([
            'role' => 'siswa',
            'password' => 'old-password',
        ]);
        $siswaProfile = Siswa::create([
            'user_id' => $siswa->id,
            'kelas_id' => $this->createKelas('X IPA 3')->id,
            'nisn' => '1000000003',
            'nama_lengkap' => 'Siswa Penguji',
            'status_siswa' => 'aktif',
        ]);

        $this->actingAs($siswa)
            ->get(route('admin.siswa.index'))
            ->assertForbidden();

        $this->actingAs($siswa)
            ->patch(route('admin.siswa.reset-password', $siswaProfile))
            ->assertForbidden();

        $this->assertFalse(Hash::check('password', $siswa->refresh()->password));
    }

    public function test_admin_student_list_only_contains_active_students(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        foreach ([
            ['nisn' => '1000000006', 'status_siswa' => 'aktif'],
            ['nisn' => '1000000007', 'status_siswa' => 'calon_spmb'],
            ['nisn' => '1000000008', 'status_siswa' => 'lulus'],
        ] as $studentData) {
            $user = User::factory()->create(['role' => 'siswa']);
            Siswa::create([
                'user_id' => $user->id,
                'nisn' => $studentData['nisn'],
                'nama_lengkap' => 'Siswa '.$studentData['nisn'],
                'status_siswa' => $studentData['status_siswa'],
            ]);
        }

        $this->actingAs($admin)
            ->get(route('admin.siswa.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Siswa/Index')
                ->has('siswas.data', 1)
                ->where('siswas.data.0.nisn', '1000000006'));
    }

    public function test_admin_can_reset_active_student_password(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $student = User::factory()->create([
            'role' => 'siswa',
            'password' => 'old-password',
        ]);
        $siswa = Siswa::create([
            'user_id' => $student->id,
            'kelas_id' => $this->createKelas('X IPA 4')->id,
            'nisn' => '1000000004',
            'nama_lengkap' => 'Siswa Uji',
            'status_siswa' => 'aktif',
        ]);

        $this->actingAs($admin)
            ->patch(route('admin.siswa.reset-password', $siswa))
            ->assertRedirect(route('admin.siswa.index', absolute: false))
            ->assertSessionHas('success', 'Kata sandi akun siswa berhasil direset menjadi password.');

        $student->refresh();
        $this->assertTrue(Hash::check('password', $student->password));
        $this->assertFalse(Hash::check('old-password', $student->password));
    }

    public function test_admin_cannot_reset_candidate_student_password_from_active_student_management(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $candidate = User::factory()->create([
            'role' => 'siswa',
            'password' => 'old-password',
        ]);
        $siswa = Siswa::create([
            'user_id' => $candidate->id,
            'kelas_id' => null,
            'nisn' => '1000000005',
            'nama_lengkap' => 'Calon Siswa',
            'status_siswa' => 'calon_spmb',
        ]);

        $this->actingAs($admin)
            ->patch(route('admin.siswa.reset-password', $siswa))
            ->assertNotFound();

        $this->assertFalse(Hash::check('password', $candidate->refresh()->password));
    }

    public function test_admin_can_create_and_filter_students_without_a_class(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $kelas = $this->createKelas('X IPA 5');

        $this->actingAs($admin)
            ->post(route('admin.siswa.store'), [
                'nisn' => '1000000010',
                'nama_lengkap' => 'Siswa Tanpa Kelas',
                'email' => 'tanpa.kelas@sekolah.sch.id',
                'password' => 'password123',
                'kelas_id' => null,
                'tipe_program' => 'reguler',
            ])
            ->assertRedirect(route('admin.siswa.index', absolute: false));

        $siswa = Siswa::query()->where('nisn', '1000000010')->firstOrFail();
        $this->assertNull($siswa->kelas_id);

        $this->actingAs($admin)
            ->get(route('admin.siswa.index', ['kelas_id' => 'tanpa_kelas']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Siswa/Index')
                ->where('filters.kelas_id', 'tanpa_kelas')
                ->where('tanpaKelasCount', 1)
                ->has('siswas.data', 1));
    }

    public function test_admin_can_assign_and_filter_students_by_program_and_concentration(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $program = ProgramKeahlian::create([
            'kode_jurusan' => 'TO',
            'nama_jurusan' => 'Teknik Otomotif',
        ]);
        $concentration = $program->konsentrasiKeahlians()->create([
            'kode_konsentrasi' => 'TKR',
            'nama_konsentrasi' => 'Teknik Kendaraan Ringan',
        ]);
        $otherProgram = ProgramKeahlian::create([
            'kode_jurusan' => 'TF',
            'nama_jurusan' => 'Teknologi Farmasi',
        ]);
        $otherConcentration = $otherProgram->konsentrasiKeahlians()->create([
            'kode_konsentrasi' => 'FI',
            'nama_konsentrasi' => 'Farmasi Industri',
        ]);

        $this->actingAs($admin)
            ->post(route('admin.siswa.store'), [
                'nisn' => '1000000040',
                'nama_lengkap' => 'Siswa Otomotif',
                'email' => 'otomotif@sekolah.sch.id',
                'password' => 'password123',
                'tipe_program' => 'reguler',
                'program_keahlian_id' => $program->id,
                'konsentrasi_keahlian_id' => $concentration->id,
            ])
            ->assertRedirect(route('admin.siswa.index', absolute: false));

        $this->assertDatabaseHas('siswas', [
            'nisn' => '1000000040',
            'program_keahlian_id' => $program->id,
            'konsentrasi_keahlian_id' => $concentration->id,
        ]);

        $this->actingAs($admin)
            ->get(route('admin.siswa.index', [
                'program_keahlian_id' => $program->id,
                'konsentrasi_keahlian_id' => $concentration->id,
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.program_keahlian_id', (string) $program->id)
                ->where('filters.konsentrasi_keahlian_id', (string) $concentration->id)
                ->has('siswas.data', 1)
                ->where('siswas.data.0.program_keahlian.nama_jurusan', 'Teknik Otomotif')
                ->where('siswas.data.0.konsentrasi_keahlian.nama_konsentrasi', 'Teknik Kendaraan Ringan'));

        $this->actingAs($admin)
            ->post(route('admin.siswa.store'), [
                'nisn' => '1000000041',
                'nama_lengkap' => 'Siswa Konsentrasi Tidak Cocok',
                'email' => 'tidakcocok@sekolah.sch.id',
                'password' => 'password123',
                'tipe_program' => 'reguler',
                'program_keahlian_id' => $program->id,
                'konsentrasi_keahlian_id' => $otherConcentration->id,
            ])
            ->assertSessionHasErrors('konsentrasi_keahlian_id');

        $this->assertDatabaseMissing('siswas', ['nisn' => '1000000041']);
    }

    public function test_admin_can_update_single_student_class_and_remove_from_class(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $kelas = $this->createKelas('X IPA 6');
        $user = User::factory()->create(['role' => 'siswa']);
        $siswa = Siswa::create([
            'user_id' => $user->id,
            'kelas_id' => null,
            'nisn' => '1000000020',
            'nama_lengkap' => 'Siswa Single Class',
            'status_siswa' => 'aktif',
        ]);

        $this->actingAs($admin)
            ->patch(route('admin.siswa.update-kelas', $siswa), [
                'kelas_id' => $kelas->id,
            ])
            ->assertStatus(302)
            ->assertSessionHas('success');

        $this->assertSame($kelas->id, $siswa->refresh()->kelas_id);

        $this->actingAs($admin)
            ->patch(route('admin.siswa.update-kelas', $siswa), [
                'kelas_id' => null,
            ])
            ->assertStatus(302)
            ->assertSessionHas('success');

        $this->assertNull($siswa->refresh()->kelas_id);
    }

    public function test_admin_can_batch_update_student_classes_and_remove_from_class(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $kelasA = $this->createKelas('X IPA 7');
        $kelasB = $this->createKelas('X IPA 8');

        $user1 = User::factory()->create(['role' => 'siswa']);
        $siswa1 = Siswa::create([
            'user_id' => $user1->id,
            'kelas_id' => $kelasA->id,
            'nisn' => '1000000031',
            'nama_lengkap' => 'Siswa Batch 1',
            'status_siswa' => 'aktif',
        ]);

        $user2 = User::factory()->create(['role' => 'siswa']);
        $siswa2 = Siswa::create([
            'user_id' => $user2->id,
            'kelas_id' => null,
            'nisn' => '1000000032',
            'nama_lengkap' => 'Siswa Batch 2',
            'status_siswa' => 'aktif',
        ]);

        // Batch assign to kelasB
        $this->actingAs($admin)
            ->patch(route('admin.siswa.batch-update-kelas'), [
                'siswa_ids' => [$siswa1->id, $siswa2->id],
                'kelas_id' => $kelasB->id,
            ])
            ->assertStatus(302)
            ->assertSessionHas('success');

        $this->assertSame($kelasB->id, $siswa1->refresh()->kelas_id);
        $this->assertSame($kelasB->id, $siswa2->refresh()->kelas_id);

        // Batch remove from class
        $this->actingAs($admin)
            ->patch(route('admin.siswa.batch-update-kelas'), [
                'siswa_ids' => [$siswa1->id, $siswa2->id],
                'kelas_id' => null,
            ])
            ->assertStatus(302)
            ->assertSessionHas('success');

        $this->assertNull($siswa1->refresh()->kelas_id);
        $this->assertNull($siswa2->refresh()->kelas_id);
    }

    private function createKelas(string $namaKelas): Kelas
    {
        $tahunAjaran = TahunAjaran::firstOrCreate([
            'nama_tahun' => '2026/2027',
            'semester' => 'ganjil',
        ], [
            'is_aktif' => true,
        ]);

        return Kelas::create([
            'tahun_ajaran_id' => $tahunAjaran->id,
            'nama_kelas' => $namaKelas,
            'tingkat' => 10,
        ]);
    }
}
