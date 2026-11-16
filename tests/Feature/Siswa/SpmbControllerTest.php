<?php

namespace Tests\Feature\Siswa;

use App\Models\KategoriBeasiswa;
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

    public function test_candidate_can_submit_biodata_and_upload_a_spmb_document(): void
    {
        Storage::fake('public');
        $candidate = User::factory()->create(['role' => 'siswa']);
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
                ->has('programKeahlians', 1)
                ->has('kategoriBeasiswas', 1)
                ->where('pendaftaran', null));

        $this->actingAs($candidate)
            ->post(route('siswa.spmb.store'), [
                'sekolah_asal' => 'SMP Negeri 1',
                'no_wa_wali' => '081234567890',
                'berkas' => UploadedFile::fake()->create('ijazah.pdf', 100, 'application/pdf'),
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
        Storage::disk('public')->assertExists($pendaftaran->berkas_path);
        Storage::disk('public')->assertExists($pendaftaran->foto_siswa_path);
        $this->assertSame($siswa->foto_siswa_path, $pendaftaran->foto_siswa_path);
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
                'asal_sekolah' => 'SMP Negeri 2',
                'no_wa_wali' => '081234567891',
            ])
            ->assertSessionHasErrors('berkas');

        $this->assertDatabaseCount('pendaftaran_spmbs', 0);
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
                'sekolah_asal' => 'SMP Negeri 3',
                'no_wa_wali' => '081234567892',
                'berkas' => UploadedFile::fake()->create('ijazah.pdf', 100, 'application/pdf'),
                'program_keahlian_id' => $program->id,
                'konsentrasi_keahlian_id' => $otherConcentration->id,
            ])
            ->assertSessionHasErrors('konsentrasi_keahlian_id');

        $this->assertDatabaseCount('pendaftaran_spmbs', 0);
    }
}
