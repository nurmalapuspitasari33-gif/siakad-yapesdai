<?php

namespace Tests\Feature\Admin;

use App\Models\Kelas;
use App\Models\PendaftaranSpmb;
use App\Models\ProgramKeahlian;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SpmbControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_accept_a_pending_candidate_into_a_class_in_the_active_year(): void
    {
        $this->travelTo('2026-11-16 08:00:00');
        $admin = User::factory()->create(['role' => 'admin']);
        $candidate = User::factory()->create(['role' => 'siswa']);
        $siswa = Siswa::create([
            'user_id' => $candidate->id,
            'nisn' => '2000000001',
            'nama_lengkap' => 'Calon Siswa',
            'status_siswa' => 'calon_spmb',
        ]);
        $program = ProgramKeahlian::create([
            'kode_jurusan' => 'TO',
            'nama_jurusan' => 'Teknik Otomotif',
        ]);
        $concentration = $program->konsentrasiKeahlians()->create([
            'kode_konsentrasi' => 'TKR',
            'nama_konsentrasi' => 'Teknik Kendaraan Ringan',
        ]);
        $pendaftaran = PendaftaranSpmb::create([
            'user_id' => $candidate->id,
            'program_keahlian_id' => $program->id,
            'konsentrasi_keahlian_id' => $concentration->id,
            'no_pendaftaran' => 'SPMB-2026-0001',
            'asal_sekolah' => 'SMP Negeri 1',
            'sekolah_asal' => 'SMP Negeri 1',
            'nis' => 'SMK-2001',
            'tipe_program' => 'santri_eksternal',
            'foto_siswa_path' => 'foto-siswa/calon.jpg',
            'nama_ayah' => 'Budi',
            'status_seleksi' => 'pending',
        ]);
        $tahunAjaranAktif = TahunAjaran::create([
            'nama_tahun' => '2026/2027',
            'semester' => 'ganjil',
            'is_aktif' => true,
        ]);
        $kelasAktif = Kelas::create([
            'tahun_ajaran_id' => $tahunAjaranAktif->id,
            'program_keahlian_id' => $program->id,
            'konsentrasi_keahlian_id' => $concentration->id,
            'nama_kelas' => 'X IPA 1',
            'tingkat' => 10,
        ]);
        $tahunAjaranLama = TahunAjaran::create([
            'nama_tahun' => '2025/2026',
            'semester' => 'ganjil',
            'is_aktif' => false,
        ]);
        $kelasLama = Kelas::create([
            'tahun_ajaran_id' => $tahunAjaranLama->id,
            'nama_kelas' => 'IX IPA 1',
            'tingkat' => 9,
        ]);

        $this->actingAs($admin)
            ->get(route('admin.spmb.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Spmb/Index')
                ->has('pendaftarans.data', 1)
                ->has('kelasOptions', 1)
                ->has('programKeahlians', 1));

        $this->actingAs($admin)
            ->patch(route('admin.spmb.accept', $pendaftaran), ['kelas_id' => $kelasLama->id])
            ->assertSessionHasErrors('kelas_id');

        $this->actingAs($admin)
            ->patch(route('admin.spmb.accept', $pendaftaran), ['kelas_id' => $kelasAktif->id])
            ->assertRedirect(route('admin.spmb.index', absolute: false));

        $this->assertDatabaseHas('pendaftaran_spmbs', [
            'id' => $pendaftaran->id,
            'status_seleksi' => 'diterima',
        ]);
        $this->assertDatabaseHas('siswas', [
            'id' => $siswa->id,
            'status_siswa' => 'aktif',
            'kelas_id' => $kelasAktif->id,
            'program_keahlian_id' => $program->id,
            'konsentrasi_keahlian_id' => $concentration->id,
            'nis' => 'SMK-2001',
            'tipe_program' => 'santri_eksternal',
            'foto_siswa_path' => 'foto-siswa/calon.jpg',
            'nama_ayah' => 'Budi',
            'diterima_di_kelas' => 'X IPA 1',
        ]);
        $this->assertDatabaseHas('pendaftaran_spmbs', [
            'id' => $pendaftaran->id,
            'diterima_di_kelas' => 'X IPA 1',
        ]);
        $this->assertSame('2026-11-16', $siswa->refresh()->tanggal_diterima->toDateString());
        $this->assertSame('2026-11-16', $pendaftaran->refresh()->tanggal_diterima->toDateString());
    }

    public function test_admin_can_reject_a_pending_application_without_activating_the_student(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $candidate = User::factory()->create(['role' => 'siswa']);
        $siswa = Siswa::create([
            'user_id' => $candidate->id,
            'nisn' => '2000000002',
            'nama_lengkap' => 'Calon Siswa Kedua',
            'status_siswa' => 'calon_spmb',
        ]);
        $pendaftaran = PendaftaranSpmb::create([
            'user_id' => $candidate->id,
            'no_pendaftaran' => 'SPMB-2026-0002',
            'asal_sekolah' => 'SMP Negeri 2',
            'status_seleksi' => 'pending',
        ]);

        $this->actingAs($admin)
            ->patch(route('admin.spmb.reject', $pendaftaran))
            ->assertRedirect(route('admin.spmb.index', absolute: false));

        $this->assertDatabaseHas('pendaftaran_spmbs', [
            'id' => $pendaftaran->id,
            'status_seleksi' => 'ditolak',
        ]);
        $this->assertDatabaseHas('siswas', [
            'id' => $siswa->id,
            'status_siswa' => 'calon_spmb',
            'kelas_id' => null,
        ]);
    }

    public function test_admin_can_filter_applicants_and_print_the_complete_filtered_recap(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $program = ProgramKeahlian::create([
            'kode_jurusan' => 'AKL',
            'nama_jurusan' => 'Akuntansi dan Keuangan Lembaga',
        ]);
        $concentration = $program->konsentrasiKeahlians()->create([
            'kode_konsentrasi' => 'AK',
            'nama_konsentrasi' => 'Akuntansi',
        ]);
        $matchingUser = User::factory()->create(['role' => 'siswa']);
        Siswa::create([
            'user_id' => $matchingUser->id,
            'nisn' => '2000000010',
            'nama_lengkap' => 'Calon Akuntansi',
            'status_siswa' => 'calon_spmb',
        ]);
        PendaftaranSpmb::create([
            'user_id' => $matchingUser->id,
            'program_keahlian_id' => $program->id,
            'konsentrasi_keahlian_id' => $concentration->id,
            'no_pendaftaran' => 'SPMB-2026-AKL-001',
            'asal_sekolah' => 'SMP Negeri 1',
            'status_seleksi' => 'pending',
        ]);

        $otherUser = User::factory()->create(['role' => 'siswa']);
        Siswa::create([
            'user_id' => $otherUser->id,
            'nisn' => '2000000011',
            'nama_lengkap' => 'Calon Lain',
            'status_siswa' => 'calon_spmb',
        ]);
        PendaftaranSpmb::create([
            'user_id' => $otherUser->id,
            'no_pendaftaran' => 'SPMB-2026-OTHER-001',
            'asal_sekolah' => 'SMP Negeri 2',
            'status_seleksi' => 'ditolak',
        ]);

        $this->actingAs($admin)
            ->get(route('admin.spmb.index', [
                'program_keahlian_id' => $program->id,
                'konsentrasi_keahlian_id' => $concentration->id,
                'status_seleksi' => 'pending',
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.program_keahlian_id', (string) $program->id)
                ->where('filters.konsentrasi_keahlian_id', (string) $concentration->id)
                ->where('filters.status_seleksi', 'pending')
                ->has('pendaftarans.data', 1)
                ->has('printPendaftarans', 1)
                ->where('printPendaftarans.0.program_keahlian', 'Akuntansi dan Keuangan Lembaga')
                ->where('printPendaftarans.0.konsentrasi_keahlian', 'Akuntansi')
                ->where('printPendaftarans.0.status_seleksi', 'pending'));
    }
}
