<?php

namespace Tests\Feature;

use App\Models\Guru;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\Siswa;
use App\Models\Ujian;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_to_login_from_a_role_dashboard(): void
    {
        $this->get(route('admin.dashboard'))
            ->assertRedirect(route('login'));
    }

    public function test_users_cannot_access_another_roles_dashboard(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $siswa = User::factory()->create(['role' => 'siswa']);

        $this->actingAs($admin)
            ->get(route('siswa.dashboard'))
            ->assertForbidden();

        $this->actingAs($siswa)
            ->get(route('admin.dashboard'))
            ->assertForbidden();
    }

    public function test_role_dashboard_redirects_users_to_their_own_dashboard(): void
    {
        $guru = User::factory()->create(['role' => 'guru']);

        $this->actingAs($guru)
            ->get(route('dashboard'))
            ->assertRedirect(route('guru.dashboard'));
    }

    public function test_admin_login_redirects_to_the_admin_dashboard(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->post(route('login'), [
            'email' => $admin->email,
            'password' => 'password',
        ])->assertRedirect(route('admin.dashboard', absolute: false));
    }

    public function test_teacher_login_redirects_to_the_teacher_dashboard(): void
    {
        $teacher = User::factory()->create(['role' => 'guru']);

        $this->post(route('login'), [
            'email' => $teacher->email,
            'password' => 'password',
        ])->assertRedirect(route('guru.dashboard', absolute: false));
    }

    public function test_database_seeder_creates_complete_repeatable_demo_data(): void
    {
        $this->seed();
        $this->seed();

        $this->assertDatabaseCount('users', 5);
        $this->assertDatabaseCount('gurus', 2);
        $this->assertDatabaseCount('siswas', 2);
        $this->assertDatabaseCount('jadwals', 2);
        $this->assertDatabaseCount('tagihans', 1);
        $this->assertDatabaseCount('pendaftaran_spmbs', 1);
        $this->assertDatabaseHas('tahun_ajarans', [
            'nama_tahun' => '2026/2027',
            'semester' => 'ganjil',
            'is_aktif' => true,
        ]);
        $this->assertDatabaseHas('users', [
            'email' => 'admin@sekolah.sch.id',
            'role' => 'admin',
        ]);
        $admin = User::query()->where('email', 'admin@sekolah.sch.id')->firstOrFail();
        $this->assertNotNull($admin->email_verified_at);
        $this->assertTrue(Hash::check('password', $admin->password));
    }

    public function test_admin_dashboard_displays_school_statistics(): void
    {
        $this->seed();
        $admin = User::query()->where('email', 'admin@sekolah.sch.id')->firstOrFail();

        $response = $this->actingAs($admin)->get(route('admin.dashboard'));
        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard/Admin')
            ->where('statistics.siswa', 2)
            ->where('statistics.guru', 2)
            ->where('statistics.pendaftarSpmb', 1)
            ->where('statistics.totalTagihan', 250000)
            ->where('tahunAjaranAktif.nama_tahun', '2026/2027')
            ->where('tahunAjaranAktif.semester', 'ganjil')
            ->has('modules', 11));
    }

    public function test_teacher_dashboard_shows_own_schedule_and_class_advisory_menu(): void
    {
        $this->seed();
        $waliKelas = User::query()->where('email', 'walikelas@sekolah.sch.id')->firstOrFail();

        $response = $this->actingAs($waliKelas)->get(route('guru.dashboard'));
        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard/Guru')
            ->where('guru.is_wali_kelas', true)
            ->where('tahunAjaranAktif.nama_tahun', '2026/2027')
            ->where('tahunAjaranAktif.semester', 'ganjil')
            ->has('jadwals', 1)
            ->has('kelasWalian', 1)
            ->where('kelasWalian.0.nama_kelas', 'X IPA 1'));
    }

    public function test_active_student_dashboard_shows_class_schedule_bills_and_upcoming_exams(): void
    {
        $this->seed();

        $activeUser = User::query()->where('email', 'siswa@sekolah.sch.id')->firstOrFail();
        $student = Siswa::query()->where('user_id', $activeUser->id)->firstOrFail();
        $class = Kelas::query()->findOrFail($student->kelas_id);
        $teacher = Guru::query()->where('is_wali_kelas', true)->firstOrFail();
        $subject = MataPelajaran::query()->where('kode_mapel', 'MAT-001')->firstOrFail();

        Ujian::create([
            'mapel_id' => $subject->id,
            'guru_id' => $teacher->id,
            'kelas_id' => $class->id,
            'judul_ujian' => 'Ujian Matematika',
            'waktu_mulai' => now()->addDay(),
            'durasi_menit' => 60,
            'acak_soal' => false,
        ]);

        Ujian::create([
            'mapel_id' => $subject->id,
            'guru_id' => $teacher->id,
            'kelas_id' => $class->id,
            'judul_ujian' => 'Ujian Berlangsung',
            'waktu_mulai' => now()->subMinutes(10),
            'durasi_menit' => 30,
            'acak_soal' => false,
        ]);

        Ujian::create([
            'mapel_id' => $subject->id,
            'guru_id' => $teacher->id,
            'kelas_id' => $class->id,
            'judul_ujian' => 'Ujian Selesai',
            'waktu_mulai' => now()->subHour(),
            'durasi_menit' => 30,
            'acak_soal' => false,
        ]);

        $response = $this->actingAs($activeUser)->get(route('siswa.dashboard'));
        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard/Siswa')
            ->where('siswa.status_siswa', 'aktif')
            ->where('siswa.kelas', 'X IPA 1')
            ->where('tahunAjaranAktif.nama_tahun', '2026/2027')
            ->where('tahunAjaranAktif.semester', 'ganjil')
            ->has('jadwals', 2)
            ->where('jadwals.0.mata_pelajaran', 'Matematika')
            ->where('jadwals.1.mata_pelajaran', 'Bahasa Indonesia')
            ->has('tagihans', 1)
            ->where('tagihans.0.status', 'belum_lunas')
            ->has('ujians', 2)
            ->where('ujians.0.judul', 'Ujian Berlangsung')
            ->where('ujians.1.judul', 'Ujian Matematika'));
    }

    public function test_spmb_candidate_dashboard_displays_selection_status(): void
    {
        $this->seed();
        $candidate = User::query()->where('email', 'calon@sekolah.sch.id')->firstOrFail();

        $response = $this->actingAs($candidate)->get(route('siswa.dashboard'));
        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard/Siswa')
            ->where('siswa.status_siswa', 'calon_spmb')
            ->where('pendaftaran.status_seleksi', 'pending')
            ->where('pendaftaran.no_pendaftaran', 'SPMB-2026-0001')
            ->where('tahunAjaranAktif.nama_tahun', '2026/2027')
            ->where('tahunAjaranAktif.semester', 'ganjil')
            ->has('jadwals', 0)
            ->has('tagihans', 0)
            ->has('ujians', 0));
    }
}
