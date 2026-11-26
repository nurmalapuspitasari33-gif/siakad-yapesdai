<?php

namespace Tests\Feature\Siswa;

use App\Models\KategoriBeasiswa;
use App\Models\GelombangSpmb;
use App\Models\PendaftaranSpmb;
use App\Models\ProgramKeahlian;
use App\Models\Siswa;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SpmbControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_candidate_can_submit_biodata_and_upload_multiple_spmb_photos(): void
    {
        Storage::fake('public');
        $wave = $this->createOpenWave();
        $candidate = User::factory()->create([
            'role' => 'siswa',
            'email' => null,
        ]);
        $category = KategoriBeasiswa::create([
            'nama_beasiswa' => 'Afirmasi Pemerintah Uji',
            'jenis_potongan' => 'persen',
            'nilai_potongan' => 100,
            'is_afirmasi' => true,
        ]);
        $program = ProgramKeahlian::create([
            'kode_jurusan' => 'TO',
            'nama_jurusan' => 'Teknik Otomotif',
        ]);
        $concentration = $program->konsentrasiKeahlians()->create([
            'kode_konsentrasi' => 'TSM',
            'nama_konsentrasi' => 'Teknik Sepeda Motor',
        ]);
        $siswa = Siswa::create([
            'user_id' => $candidate->id,
            'nisn' => '3000000001',
            'nama_lengkap' => 'Calon Siswa',
            'status_siswa' => 'calon_spmb',
        ]);

        $this->actingAs($candidate)
            ->get(route('siswa.spmb.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Siswa/Spmb/Index')
                ->where('siswa.nama_lengkap', $siswa->nama_lengkap)
                ->where('siswa.tipe_program', 'reguler')
                ->where('nik', null)
                ->has('programKeahlians', 1)
                ->has('kategoriBeasiswas', 1)
                ->where('pendaftaran', null));

        $this->actingAs($candidate)
            ->post(route('siswa.spmb.store'), [
                'nik' => '0012345678901234',
                'sekolah_asal' => 'SMP Negeri 1',
                'no_wa_wali' => '081234567890',
                'foto_berkas' => [
                    UploadedFile::fake()->image('kartu-keluarga.jpg', 300, 400),
                    UploadedFile::fake()->image('akta-kelahiran.jpg', 300, 400),
                ],
                'foto_keterangan' => ['Kartu Keluarga', 'Akta Kelahiran'],
                'foto_siswa' => UploadedFile::fake()->image('foto.jpg', 300, 400),
                'nis' => 'SMK-3001',
                'tempat_lahir' => 'Cilacap',
                'tanggal_lahir' => '2010-02-03',
                'jenis_kelamin' => 'L',
                'agama' => 'Islam',
                'status_keluarga' => 'Anak Kandung',
                'anak_ke' => 2,
                'alamat_murid' => 'Jl. Sekolah',
                'telepon_rumah' => '0282123456',
                'tipe_program' => 'santri_internal',
                'program_keahlian_id' => $program->id,
                'konsentrasi_keahlian_id' => $concentration->id,
                'kategori_beasiswa_id' => $category->id,
                'ukuran_seragam' => 'L',
                'nama_ayah' => 'Budi',
                'nama_ibu' => 'Siti',
                'alamat_ortu' => 'Jl. Orang Tua',
                'telepon_ortu' => '081111111111',
                'pekerjaan_ayah' => 'Petani',
                'pekerjaan_ibu' => 'Guru',
                'nama_wali' => 'Wali Murid',
                'alamat_wali' => 'Jl. Wali',
                'telepon_wali' => '082222222222',
                'pekerjaan_wali' => 'Wiraswasta',
            ])
            ->assertRedirect(route('siswa.spmb.index', absolute: false));

        $pendaftaran = PendaftaranSpmb::query()->where('user_id', $candidate->id)->firstOrFail();
        $siswa->refresh();

        $this->assertSame('pending', $pendaftaran->status_seleksi);
        $this->assertSame($wave->id, $pendaftaran->gelombang_spmb_id);
        $this->assertMatchesRegularExpression('/^SPMB-\d{4}-[A-Z0-9]{8}$/', $pendaftaran->no_pendaftaran);
        $this->assertSame('0012345678901234', $candidate->refresh()->nik);
        $this->assertArrayNotHasKey('nik', $siswa->getAttributes());
        $this->assertArrayNotHasKey('nik', $pendaftaran->getAttributes());
        $this->assertSame('SMP Negeri 1', $pendaftaran->asal_sekolah);
        $this->assertSame('SMP Negeri 1', $pendaftaran->sekolah_asal);
        $this->assertSame('081234567890', $siswa->no_wa_wali);
        $this->assertSame('SMK-3001', $siswa->nis);
        $this->assertSame('santri_internal', $siswa->tipe_program);
        $this->assertSame($program->id, $pendaftaran->program_keahlian_id);
        $this->assertSame($concentration->id, $pendaftaran->konsentrasi_keahlian_id);
        $this->assertSame($program->id, $siswa->program_keahlian_id);
        $this->assertSame($concentration->id, $siswa->konsentrasi_keahlian_id);
        $this->assertSame($category->id, $siswa->kategori_beasiswa_id);
        $this->assertSame('L', $pendaftaran->jenis_kelamin);
        $this->assertNull($pendaftaran->berkas_path);
        $this->assertDatabaseCount('pendaftaran_spmb_berkas', 2);
        foreach ($pendaftaran->berkas as $berkas) {
            Storage::disk('public')->assertExists($berkas->path);
        }
        Storage::disk('public')->assertExists($pendaftaran->foto_siswa_path);
        $this->assertSame($siswa->foto_siswa_path, $pendaftaran->foto_siswa_path);

        $this->actingAs($candidate)
            ->get(route('siswa.spmb.cetak'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Siswa/Spmb/Print')
                ->where('pendaftaran.nomor', $pendaftaran->no_pendaftaran)
                ->where('pendaftaran.nik', '0012345678901234')
                ->where('pendaftaran.nama_lengkap', 'Calon Siswa')
                ->has('pendaftaran.berkas', 2));
    }

    public function test_candidate_must_upload_a_document_before_submitting(): void
    {
        $candidate = User::factory()->create(['role' => 'siswa']);
        Siswa::create([
            'user_id' => $candidate->id,
            'nisn' => '3000000002',
            'nama_lengkap' => 'Calon Siswa Dua',
            'status_siswa' => 'calon_spmb',
        ]);

        $this->actingAs($candidate)
            ->post(route('siswa.spmb.store'), [
                'nik' => '0012345678901235',
                'asal_sekolah' => 'SMP Negeri 2',
                'no_wa_wali' => '081234567891',
            ])
            ->assertSessionHasErrors('foto_berkas');

        $this->assertDatabaseCount('pendaftaran_spmbs', 0);
    }

    public function test_candidate_must_provide_a_sixteen_digit_nik_before_submitting(): void
    {
        $candidate = User::factory()->create(['role' => 'siswa']);
        Siswa::create([
            'user_id' => $candidate->id,
            'nisn' => '3000000004',
            'nama_lengkap' => 'Calon Siswa Empat',
            'status_siswa' => 'calon_spmb',
        ]);

        $this->actingAs($candidate)
            ->post(route('siswa.spmb.store'), [
                'sekolah_asal' => 'SMP Negeri 4',
                'no_wa_wali' => '081234567894',
                'foto_berkas' => [UploadedFile::fake()->image('ijazah.jpg', 300, 400)],
            ])
            ->assertSessionHasErrors('nik');

        $this->assertDatabaseCount('pendaftaran_spmbs', 0);
    }

    public function test_candidate_cannot_update_a_non_pending_registration(): void
    {
        Storage::fake('public');
        $candidate = User::factory()->create([
            'role' => 'siswa',
            'nik' => '0012345678901234',
        ]);
        Siswa::create([
            'user_id' => $candidate->id,
            'nisn' => '3000000005',
            'nama_lengkap' => 'Calon Siswa Lima',
            'status_siswa' => 'calon_spmb',
        ]);
        $pendaftaran = PendaftaranSpmb::create([
            'user_id' => $candidate->id,
            'no_pendaftaran' => 'SPMB-2026-AB12CD34',
            'asal_sekolah' => 'SMP Negeri 5',
            'berkas_path' => 'berkas-spmb/existing.pdf',
            'status_seleksi' => 'ditolak',
        ]);

        $this->actingAs($candidate)
            ->post(route('siswa.spmb.store'), [
                'nik' => '0012345678901234',
                'sekolah_asal' => 'SMP Negeri 5',
                'no_wa_wali' => '081234567895',
            ])
            ->assertForbidden();

        $this->assertSame([], Storage::disk('public')->allFiles('berkas-spmb'));
        $this->assertDatabaseHas('pendaftaran_spmbs', [
            'id' => $pendaftaran->id,
            'status_seleksi' => 'ditolak',
            'asal_sekolah' => 'SMP Negeri 5',
        ]);
    }

    public function test_candidate_can_add_and_remove_photos_without_replacing_other_photos(): void
    {
        Storage::fake('public');
        $candidate = User::factory()->create([
            'role' => 'siswa',
            'nik' => '0012345678901237',
        ]);
        Siswa::create([
            'user_id' => $candidate->id,
            'nisn' => '3000000007',
            'nama_lengkap' => 'Calon Siswa Tujuh',
            'status_siswa' => 'calon_spmb',
        ]);
        $pendaftaran = PendaftaranSpmb::create([
            'user_id' => $candidate->id,
            'no_pendaftaran' => 'SPMB-2026-AB12CD37',
            'asal_sekolah' => 'SMP Negeri 7',
            'status_seleksi' => 'pending',
        ]);
        Storage::disk('public')->put('berkas-spmb/foto/berkas-lama.jpg', 'existing photo');
        $existingDocument = $pendaftaran->berkas()->create([
            'path' => 'berkas-spmb/foto/berkas-lama.jpg',
            'caption' => 'Kartu Keluarga',
        ]);

        $this->actingAs($candidate)
            ->post(route('siswa.spmb.store'), [
                'nik' => '0012345678901237',
                'sekolah_asal' => 'SMP Negeri 7',
                'no_wa_wali' => '081234567897',
                'foto_berkas' => [UploadedFile::fake()->image('akta.jpg', 300, 400)],
                'foto_keterangan' => ['Akta Kelahiran'],
            ])
            ->assertRedirect(route('siswa.spmb.index', absolute: false));

        $this->assertDatabaseCount('pendaftaran_spmb_berkas', 2);
        Storage::disk('public')->assertExists('berkas-spmb/foto/berkas-lama.jpg');

        $addedDocument = $pendaftaran->berkas()->where('caption', 'Akta Kelahiran')->firstOrFail();
        Storage::disk('public')->assertExists($addedDocument->path);

        $this->actingAs($candidate)
            ->delete(route('siswa.spmb.berkas.destroy', $existingDocument))
            ->assertRedirect();

        $this->assertDatabaseCount('pendaftaran_spmb_berkas', 1);
        Storage::disk('public')->assertMissing('berkas-spmb/foto/berkas-lama.jpg');
        Storage::disk('public')->assertExists($addedDocument->path);
    }

    public function test_candidate_cannot_upload_more_than_twenty_photos(): void
    {
        Storage::fake('public');
        $candidate = User::factory()->create([
            'role' => 'siswa',
            'nik' => '0012345678901238',
        ]);
        Siswa::create([
            'user_id' => $candidate->id,
            'nisn' => '3000000008',
            'nama_lengkap' => 'Calon Siswa Delapan',
            'status_siswa' => 'calon_spmb',
        ]);
        $pendaftaran = PendaftaranSpmb::create([
            'user_id' => $candidate->id,
            'no_pendaftaran' => 'SPMB-2026-AB12CD38',
            'asal_sekolah' => 'SMP Negeri 8',
            'status_seleksi' => 'pending',
        ]);

        foreach (range(1, 20) as $index) {
            $path = "berkas-spmb/foto/berkas-{$index}.jpg";
            Storage::disk('public')->put($path, 'existing photo');
            $pendaftaran->berkas()->create(['path' => $path]);
        }

        $this->actingAs($candidate)
            ->post(route('siswa.spmb.store'), [
                'nik' => '0012345678901238',
                'sekolah_asal' => 'SMP Negeri 8',
                'no_wa_wali' => '081234567898',
                'foto_berkas' => [UploadedFile::fake()->image('foto-tambahan.jpg', 300, 400)],
            ])
            ->assertSessionHasErrors('foto_berkas');

        $this->assertDatabaseCount('pendaftaran_spmb_berkas', 20);
        $this->assertCount(20, Storage::disk('public')->allFiles('berkas-spmb/foto'));
    }

    public function test_candidate_cannot_submit_a_concentration_from_another_program(): void
    {
        $candidate = User::factory()->create(['role' => 'siswa']);
        Siswa::create([
            'user_id' => $candidate->id,
            'nisn' => '3000000003',
            'nama_lengkap' => 'Calon Siswa Tiga',
            'status_siswa' => 'calon_spmb',
        ]);
        $program = ProgramKeahlian::create([
            'kode_jurusan' => 'TO',
            'nama_jurusan' => 'Teknik Otomotif',
        ]);
        $otherProgram = ProgramKeahlian::create([
            'kode_jurusan' => 'TF',
            'nama_jurusan' => 'Teknologi Farmasi',
        ]);
        $otherConcentration = $otherProgram->konsentrasiKeahlians()->create([
            'kode_konsentrasi' => 'FI',
            'nama_konsentrasi' => 'Farmasi Industri',
        ]);

        $this->actingAs($candidate)
            ->post(route('siswa.spmb.store'), [
                'nik' => '0012345678901236',
                'sekolah_asal' => 'SMP Negeri 3',
                'no_wa_wali' => '081234567892',
                'foto_berkas' => [UploadedFile::fake()->image('ijazah.jpg', 300, 400)],
                'program_keahlian_id' => $program->id,
                'konsentrasi_keahlian_id' => $otherConcentration->id,
            ])
            ->assertSessionHasErrors('konsentrasi_keahlian_id');

        $this->assertDatabaseCount('pendaftaran_spmbs', 0);
    }

    public function test_candidate_cannot_create_a_registration_when_no_wave_is_open(): void
    {
        Storage::fake('public');
        $candidate = User::factory()->create(['role' => 'siswa', 'nik' => '0012345678901259']);
        Siswa::create([
            'user_id' => $candidate->id,
            'nisn' => '3000000059',
            'nama_lengkap' => 'Calon Siswa Sembilan',
            'status_siswa' => 'calon_spmb',
        ]);

        $this->actingAs($candidate)
            ->post(route('siswa.spmb.store'), [
                'nik' => '0012345678901259',
                'sekolah_asal' => 'SMP Negeri',
                'no_wa_wali' => '081234567899',
                'foto_berkas' => [UploadedFile::fake()->image('kk.jpg', 300, 400)],
            ])
            ->assertForbidden();

        $this->assertDatabaseCount('pendaftaran_spmbs', 0);
        $this->assertSame([], Storage::disk('public')->allFiles('berkas-spmb/foto'));
    }

    private function createOpenWave(): GelombangSpmb
    {
        return GelombangSpmb::create([
            'nama_gelombang' => 'Gelombang Uji',
            'tahun_ajaran' => '2026/2027',
            'tanggal_mulai' => today()->subDay(),
            'tanggal_selesai' => today()->addMonth(),
            'kuota' => 100,
            'is_active' => true,
        ]);
    }
}
