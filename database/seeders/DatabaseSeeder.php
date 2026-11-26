<?php

namespace Database\Seeders;

use App\Models\Guru;
use App\Models\Jadwal;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\PendaftaranSpmb;
use App\Models\Siswa;
use App\Models\Tagihan;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        TahunAjaran::query()->where('is_aktif', true)->update(['is_aktif' => false]);

        $this->call(KategoriBeasiswaSeeder::class);
        $this->call(EkstrakurikulerSeeder::class);
        $this->call(ProgramKeahlianSeeder::class);
        $this->call(SpmbCmsSeeder::class);

        $tahunAjaran = TahunAjaran::updateOrCreate(
            ['nama_tahun' => '2026/2027', 'semester' => 'ganjil'],
            ['is_aktif' => true],
        );

        $this->seedUser(
            'Administrator Sekolah',
            'admin@sekolah.sch.id',
            'admin',
        );

        $guruBiasaUser = $this->seedUser(
            'Guru Matematika',
            'guru1@sekolah.sch.id',
            'guru',
        );

        $waliKelasUser = $this->seedUser(
            'Guru Wali Kelas',
            'walikelas@sekolah.sch.id',
            'guru',
        );

        $guruBiasa = Guru::updateOrCreate(
            ['user_id' => $guruBiasaUser->id],
            [
                'nip' => '197001010001',
                'nama_lengkap' => 'Guru Matematika',
                'is_wali_kelas' => false,
            ],
        );

        $waliKelas = Guru::updateOrCreate(
            ['user_id' => $waliKelasUser->id],
            [
                'nip' => '197001010002',
                'nama_lengkap' => 'Guru Wali Kelas',
                'is_wali_kelas' => true,
            ],
        );

        $kelas = Kelas::updateOrCreate(
            [
                'tahun_ajaran_id' => $tahunAjaran->id,
                'nama_kelas' => 'X IPA 1',
            ],
            [
                'wali_kelas_id' => $waliKelas->id,
                'tingkat' => 10,
            ],
        );

        $siswaAktifUser = $this->seedUser(
            'Siswa Aktif',
            'siswa@sekolah.sch.id',
            'siswa',
        );

        $calonSiswaUser = $this->seedUser(
            'Calon Siswa',
            'calon@sekolah.sch.id',
            'siswa',
        );

        $siswaAktif = Siswa::updateOrCreate(
            ['user_id' => $siswaAktifUser->id],
            [
                'kelas_id' => $kelas->id,
                'nisn' => '0000000001',
                'nama_lengkap' => 'Siswa Aktif',
                'status_siswa' => 'aktif',
            ],
        );

        Siswa::updateOrCreate(
            ['user_id' => $calonSiswaUser->id],
            [
                'kelas_id' => null,
                'nisn' => '0000000002',
                'nama_lengkap' => 'Calon Siswa',
                'status_siswa' => 'calon_spmb',
            ],
        );

        PendaftaranSpmb::updateOrCreate(
            ['no_pendaftaran' => 'SPMB-2026-0001'],
            [
                'user_id' => $calonSiswaUser->id,
                'asal_sekolah' => 'SMP Negeri 1 Contoh',
                'status_seleksi' => 'pending',
            ],
        );

        $matematika = MataPelajaran::updateOrCreate(
            ['kode_mapel' => 'MAT-001'],
            ['nama_mapel' => 'Matematika'],
        );

        $bahasaIndonesia = MataPelajaran::updateOrCreate(
            ['kode_mapel' => 'BIN-001'],
            ['nama_mapel' => 'Bahasa Indonesia'],
        );

        Jadwal::updateOrCreate(
            [
                'tahun_ajaran_id' => $tahunAjaran->id,
                'kelas_id' => $kelas->id,
                'hari' => 'senin',
                'jam_mulai' => '07:00:00',
            ],
            [
                'mapel_id' => $matematika->id,
                'guru_id' => $guruBiasa->id,
                'jam_selesai' => '08:30:00',
            ],
        );

        Jadwal::updateOrCreate(
            [
                'tahun_ajaran_id' => $tahunAjaran->id,
                'kelas_id' => $kelas->id,
                'hari' => 'selasa',
                'jam_mulai' => '08:30:00',
            ],
            [
                'mapel_id' => $bahasaIndonesia->id,
                'guru_id' => $waliKelas->id,
                'jam_selesai' => '10:00:00',
            ],
        );

        Tagihan::updateOrCreate(
            ['siswa_id' => $siswaAktif->id, 'judul_tagihan' => 'SPP November 2026'],
            [
                'nominal' => 250000,
                'jenis_tagihan' => 'spp',
                'jatuh_tempo' => '2026-11-30',
                'status_bayar' => 'belum_lunas',
                'status_wa' => 'belum_terkirim',
            ],
        );
    }

    private function seedUser(string $name, string $email, string $role): User
    {
        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => 'password',
                'role' => $role,
            ],
        );

        $user->forceFill(['email_verified_at' => now()])->save();

        return $user;
    }
}
