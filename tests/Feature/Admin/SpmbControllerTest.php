<?php

namespace Tests\Feature\Admin;

use App\Models\Kelas;
use App\Models\PendaftaranSpmb;
use App\Models\ProgramKeahlian;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SpmbControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_update_an_applicant_and_sync_its_student_identity(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $candidate = User::factory()->create(['role' => 'siswa', 'name' => 'Nama Lama']);
        $siswa = Siswa::create([
            'user_id' => $candidate->id,
            'nisn' => '2000000012',
            'nama_lengkap' => 'Nama Lama',
            'status_siswa' => 'calon_spmb',
        ]);
        $program = ProgramKeahlian::create([
            'kode_jurusan' => 'RPL',
            'nama_jurusan' => 'Rekayasa Perangkat Lunak',
        ]);
        $concentration = $program->konsentrasiKeahlians()->create([
            'kode_konsentrasi' => 'PPLG',
            'nama_konsentrasi' => 'Pengembangan Perangkat Lunak dan Gim',
        ]);
        $pendaftaran = PendaftaranSpmb::create([
            'user_id' => $candidate->id,
            'no_pendaftaran' => 'SPMB-2026-0012',
            'asal_sekolah' => 'SMP Lama',
            'sekolah_asal' => 'SMP Lama',
            'status_seleksi' => 'pending',
        ]);

        $this->actingAs($admin)
            ->put(route('admin.spmb.update', $pendaftaran), [
                'nama_lengkap' => 'Nama Baru',
                'nisn' => '2000000013',
                'sekolah_asal' => 'SMP Baru',
                'no_wa_wali' => '08123456789',
                'program_keahlian_id' => $program->id,
                'konsentrasi_keahlian_id' => $concentration->id,
                'nis' => 'NIS-0013',
                'tempat_lahir' => 'Cilacap',
                'tanggal_lahir' => '2008-05-04',
                'jenis_kelamin' => 'P',
                'agama' => 'Islam',
                'tipe_program' => 'santri_internal',
                'nama_ayah' => 'Ayah Baru',
            ])
            ->assertRedirect(route('admin.spmb.index', absolute: false));

        $this->assertDatabaseHas('users', [
            'id' => $candidate->id,
            'name' => 'Nama Baru',
        ]);
        $this->assertDatabaseHas('siswas', [
            'id' => $siswa->id,
            'nama_lengkap' => 'Nama Baru',
            'nisn' => '2000000013',
            'no_wa_wali' => '08123456789',
            'program_keahlian_id' => $program->id,
            'konsentrasi_keahlian_id' => $concentration->id,
            'sekolah_asal' => 'SMP Baru',
            'tipe_program' => 'santri_internal',
            'nama_ayah' => 'Ayah Baru',
        ]);
        $this->assertDatabaseHas('pendaftaran_spmbs', [
            'id' => $pendaftaran->id,
            'asal_sekolah' => 'SMP Baru',
            'sekolah_asal' => 'SMP Baru',
            'nis' => 'NIS-0013',
            'nama_ayah' => 'Ayah Baru',
            'program_keahlian_id' => $program->id,
            'konsentrasi_keahlian_id' => $concentration->id,
            'tipe_program' => 'santri_internal',
        ]);
    }

    public function test_admin_cannot_assign_a_concentration_from_another_program(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $candidate = User::factory()->create(['role' => 'siswa']);
        Siswa::create([
            'user_id' => $candidate->id,
            'nisn' => '2000000014',
            'nama_lengkap' => 'Calon Siswa',
            'status_siswa' => 'calon_spmb',
        ]);
        $program = ProgramKeahlian::create([
            'kode_jurusan' => 'TKJ',
            'nama_jurusan' => 'Teknik Komputer dan Jaringan',
        ]);
        $otherProgram = ProgramKeahlian::create([
            'kode_jurusan' => 'DKV',
            'nama_jurusan' => 'Desain Komunikasi Visual',
        ]);
        $concentration = $program->konsentrasiKeahlians()->create([
            'kode_konsentrasi' => 'TKJ-1',
            'nama_konsentrasi' => 'Teknik Jaringan',
        ]);
        $pendaftaran = PendaftaranSpmb::create([
            'user_id' => $candidate->id,
            'no_pendaftaran' => 'SPMB-2026-0014',
            'asal_sekolah' => 'SMP Negeri',
            'program_keahlian_id' => $program->id,
            'konsentrasi_keahlian_id' => $concentration->id,
        ]);

        $this->actingAs($admin)
            ->put(route('admin.spmb.update', $pendaftaran), [
                'nama_lengkap' => 'Calon Siswa',
                'nisn' => '2000000014',
                'sekolah_asal' => 'SMP Negeri',
                'no_wa_wali' => '08123456789',
                'program_keahlian_id' => $otherProgram->id,
                'konsentrasi_keahlian_id' => $concentration->id,
                'tipe_program' => 'reguler',
            ])
            ->assertSessionHasErrors('konsentrasi_keahlian_id');

        $this->assertDatabaseHas('pendaftaran_spmbs', [
            'id' => $pendaftaran->id,
            'program_keahlian_id' => $program->id,
            'konsentrasi_keahlian_id' => $concentration->id,
        ]);
    }

    public function test_admin_can_delete_a_candidate_and_its_registration_files(): void
    {
        Storage::fake('public');
        $admin = User::factory()->create(['role' => 'admin']);
        $candidate = User::factory()->create(['role' => 'siswa']);
        Siswa::create([
            'user_id' => $candidate->id,
            'nisn' => '2000000015',
            'nama_lengkap' => 'Calon Hapus',
            'status_siswa' => 'calon_spmb',
            'foto_siswa_path' => 'foto-siswa/siswa-0015.jpg',
        ]);
        $pendaftaran = PendaftaranSpmb::create([
            'user_id' => $candidate->id,
            'no_pendaftaran' => 'SPMB-2026-0015',
            'asal_sekolah' => 'SMP Negeri',
            'berkas_path' => 'berkas-spmb/0015.pdf',
            'foto_siswa_path' => 'foto-siswa/pendaftaran-0015.jpg',
        ]);
        Storage::disk('public')->put('berkas-spmb/0015.pdf', 'berkas');
        Storage::disk('public')->put('foto-siswa/pendaftaran-0015.jpg', 'foto');
        Storage::disk('public')->put('foto-siswa/siswa-0015.jpg', 'foto siswa');

        $this->actingAs($admin)
            ->delete(route('admin.spmb.destroy', $pendaftaran))
            ->assertRedirect(route('admin.spmb.index', absolute: false))
            ->assertSessionHas('success', 'Data pendaftar SPMB berhasil dihapus.');

        $this->assertDatabaseMissing('users', ['id' => $candidate->id]);
        $this->assertDatabaseMissing('siswas', ['user_id' => $candidate->id]);
        $this->assertDatabaseMissing('pendaftaran_spmbs', ['id' => $pendaftaran->id]);
        Storage::disk('public')->assertMissing('berkas-spmb/0015.pdf');
        Storage::disk('public')->assertMissing('foto-siswa/pendaftaran-0015.jpg');
        Storage::disk('public')->assertMissing('foto-siswa/siswa-0015.jpg');
    }

    public function test_admin_can_download_all_candidate_photos_as_a_pdf(): void
    {
        Storage::fake('public');
        $admin = User::factory()->create(['role' => 'admin']);
        $candidate = User::factory()->create([
            'role' => 'siswa',
            'nik' => '0012345678901250',
        ]);
        Siswa::create([
            'user_id' => $candidate->id,
            'nisn' => '2000000050',
            'nama_lengkap' => 'Calon PDF',
            'status_siswa' => 'calon_spmb',
        ]);
        $pendaftaran = PendaftaranSpmb::create([
            'user_id' => $candidate->id,
            'no_pendaftaran' => 'SPMB-2026-AB12CD50',
            'asal_sekolah' => 'SMP Negeri',
            'status_seleksi' => 'pending',
        ]);
        $firstPhoto = UploadedFile::fake()->image('kartu-keluarga.jpg', 300, 400)
            ->store('berkas-spmb/foto', 'public');
        $secondPhoto = UploadedFile::fake()->image('akta.jpg', 300, 400)
            ->store('berkas-spmb/foto', 'public');
        $pendaftaran->berkas()->createMany([
            ['path' => $firstPhoto, 'caption' => 'Kartu Keluarga'],
            ['path' => $secondPhoto, 'caption' => 'Akta Kelahiran'],
        ]);

        $response = $this->actingAs($admin)
            ->get(route('admin.spmb.berkas-pdf', $pendaftaran));

        $response->assertOk()
            ->assertDownload('spmb-2026-ab12cd50-berkas.pdf')
            ->assertHeader('content-type', 'application/pdf')
            ->assertStreamed();
        $this->assertStringStartsWith('%PDF-1.4', $response->streamedContent());
        $this->assertStringContainsString('NIK:', $response->streamedContent());
    }

    public function test_admin_can_delete_an_application_when_its_student_record_is_missing(): void
    {
        Storage::fake('public');
        $admin = User::factory()->create(['role' => 'admin']);
        $candidate = User::factory()->create(['role' => 'siswa']);
        $pendaftaran = PendaftaranSpmb::create([
            'user_id' => $candidate->id,
            'no_pendaftaran' => 'SPMB-2026-0017',
            'asal_sekolah' => 'SMP Negeri',
            'berkas_path' => 'berkas-spmb/0017.pdf',
        ]);
        Storage::disk('public')->put('berkas-spmb/0017.pdf', 'berkas');

        $this->actingAs($admin)
            ->delete(route('admin.spmb.destroy', $pendaftaran))
            ->assertRedirect(route('admin.spmb.index', absolute: false))
            ->assertSessionHas('success', 'Data pendaftar SPMB berhasil dihapus.');

        $this->assertDatabaseMissing('users', ['id' => $candidate->id]);
        $this->assertDatabaseMissing('pendaftaran_spmbs', ['id' => $pendaftaran->id]);
        Storage::disk('public')->assertMissing('berkas-spmb/0017.pdf');
    }

    public function test_admin_can_delete_an_active_students_registration_without_deleting_the_student(): void
    {
        Storage::fake('public');
        $admin = User::factory()->create(['role' => 'admin']);
        $candidate = User::factory()->create(['role' => 'siswa']);
        Siswa::create([
            'user_id' => $candidate->id,
            'nisn' => '2000000016',
            'nama_lengkap' => 'Siswa Aktif',
            'status_siswa' => 'aktif',
            'foto_siswa_path' => 'foto-siswa/siswa-0016.jpg',
        ]);
        $pendaftaran = PendaftaranSpmb::create([
            'user_id' => $candidate->id,
            'no_pendaftaran' => 'SPMB-2026-0016',
            'asal_sekolah' => 'SMP Negeri',
            'berkas_path' => 'berkas-spmb/0016.pdf',
            'foto_siswa_path' => 'foto-siswa/pendaftaran-0016.jpg',
        ]);
        Storage::disk('public')->put('berkas-spmb/0016.pdf', 'berkas');
        Storage::disk('public')->put('foto-siswa/pendaftaran-0016.jpg', 'foto');
        Storage::disk('public')->put('foto-siswa/siswa-0016.jpg', 'foto siswa');

        $this->actingAs($admin)
            ->delete(route('admin.spmb.destroy', $pendaftaran))
            ->assertRedirect(route('admin.spmb.index', absolute: false))
            ->assertSessionHas('success', 'Data pendaftar SPMB berhasil dihapus.');

        $this->assertModelExists($candidate->fresh());
        $this->assertModelExists($candidate->siswa()->firstOrFail());
        $this->assertDatabaseMissing('pendaftaran_spmbs', ['id' => $pendaftaran->id]);
        Storage::disk('public')->assertMissing('berkas-spmb/0016.pdf');
        Storage::disk('public')->assertMissing('foto-siswa/pendaftaran-0016.jpg');
        Storage::disk('public')->assertMissing('foto-siswa/siswa-0016.jpg');
    }

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
