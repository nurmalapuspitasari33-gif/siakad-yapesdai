<?php

namespace Tests\Feature;

use App\Models\Guru;
use App\Models\PendaftaranSpmb;
use App\Models\Siswa;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class WelcomePageTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_landing_page_displays_live_school_and_spmb_statistics(): void
    {
        $activeStudentUser = User::factory()->create(['role' => 'siswa']);
        Siswa::create([
            'user_id' => $activeStudentUser->id,
            'nisn' => '0000000001',
            'nama_lengkap' => 'Siswa Aktif',
            'status_siswa' => 'aktif',
        ]);

        $candidate = User::factory()->create(['role' => 'siswa']);
        Siswa::create([
            'user_id' => $candidate->id,
            'nisn' => '0000000002',
            'nama_lengkap' => 'Calon Siswa',
            'status_siswa' => 'calon_spmb',
        ]);
        PendaftaranSpmb::create([
            'user_id' => $candidate->id,
            'no_pendaftaran' => 'SPMB-001',
            'asal_sekolah' => 'SMP Negeri',
            'status_seleksi' => 'pending',
        ]);

        $acceptedApplicant = User::factory()->create(['role' => 'siswa']);
        PendaftaranSpmb::create([
            'user_id' => $acceptedApplicant->id,
            'no_pendaftaran' => 'SPMB-002',
            'asal_sekolah' => 'SMP Swasta',
            'status_seleksi' => 'diterima',
        ]);

        $teacherUser = User::factory()->create(['role' => 'guru']);
        Guru::create([
            'user_id' => $teacherUser->id,
            'nip' => '19870001',
            'nama_lengkap' => 'Guru Sekolah',
            'is_wali_kelas' => false,
        ]);

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Welcome')
                ->where('statistics.siswaAktif', 1)
                ->where('statistics.guru', 1)
                ->where('statistics.pendaftarSpmb', 2)
                ->where('statistics.menungguSeleksi', 1)
                ->where('canLogin', true)
                ->where('canRegister', true));
    }

    public function test_authenticated_user_role_is_available_on_the_landing_page(): void
    {
        $teacher = User::factory()->create(['role' => 'guru']);

        $this->actingAs($teacher)
            ->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Welcome')
                ->where('auth.user.role', 'guru'));
    }
}
