<?php

namespace Database\Seeders;

use App\Models\GelombangSpmb;
use App\Models\SpmbBanner;
use App\Models\SpmbContent;
use Illuminate\Database\Seeder;

class SpmbCmsSeeder extends Seeder
{
    public function run(): void
    {
        GelombangSpmb::query()->firstOrCreate(
            ['nama_gelombang' => 'Gelombang 1'],
            [
                'tahun_ajaran' => '2026/2027',
                'tanggal_mulai' => '2026-11-01',
                'tanggal_selesai' => '2027-07-31',
                'kuota' => 180,
                'keterangan' => 'Pendaftaran murid baru tahun ajaran 2026/2027.',
                'is_active' => true,
            ],
        );

        foreach ([
            [
                'kicker' => "Sistem Penerimaan Murid Baru (SPMB) • SMK Al Mu'allim Kesugihan",
                'judul' => 'Wujudkan Masa Depan Vokasi Unggul, Kompeten, dan Berakhlak Mulia.',
                'subjudul' => 'Pendaftaran peserta didik baru berbasis NIK kini lebih cepat, transparan, dan terintegrasi langsung dengan Sistem Informasi Akademik sekolah.',
                'cta_label' => 'Daftar Sekarang',
                'cta_url' => '/register',
                'urutan' => 1,
            ],
            [
                'kicker' => 'Penerimaan Murid Baru · Tahun Ajaran 2026/2027',
                'judul' => 'Siap Kerja, Santun dalam Sikap, Tangguh di Era Industri.',
                'subjudul' => 'Pilih kompetensi keahlian sesuai minatmu, lengkapi berkas secara daring, dan pantau status seleksi dari mana saja.',
                'cta_label' => 'Daftar Sekarang',
                'cta_url' => '/register',
                'urutan' => 2,
            ],
        ] as $banner) {
            SpmbBanner::query()->firstOrCreate(
                ['judul' => $banner['judul']],
                [...$banner, 'is_active' => true],
            );
        }

        $defaultContents = [
            'jalur_seleksi' => [
                [
                    'judul' => 'Reguler',
                    'badge' => 'Jalur Umum',
                    'deskripsi' => 'Jalur penerimaan umum bagi calon murid baru sesuai kuota kompetensi keahlian.',
                    'jadwal_kuota' => 'Jadwal mengikuti gelombang aktif.',
                    'status_buka' => true,
                ],
                [
                    'judul' => 'Prestasi',
                    'badge' => 'Akademik & Nonakademik',
                    'deskripsi' => 'Jalur bagi calon murid dengan capaian prestasi akademik atau nonakademik.',
                    'jadwal_kuota' => 'Berkas prestasi diverifikasi panitia.',
                    'status_buka' => true,
                ],
                [
                    'judul' => 'Beasiswa / Afirmasi',
                    'badge' => 'Dukungan Pendidikan',
                    'deskripsi' => 'Jalur bantuan pendidikan sesuai kategori dan ketentuan sekolah.',
                    'jadwal_kuota' => 'Kuota dan syarat mengikuti kebijakan sekolah.',
                    'status_buka' => true,
                ],
            ],
            'persyaratan' => [
                ['judul' => 'Kartu Keluarga', 'deskripsi' => 'Foto atau pindai dokumen yang terbaca jelas.'],
                ['judul' => 'Akta Kelahiran', 'deskripsi' => 'Foto atau pindai dokumen yang terbaca jelas.'],
                ['judul' => 'Ijazah atau SKL', 'deskripsi' => 'Ijazah atau surat keterangan lulus.'],
                ['judul' => 'Pas Foto', 'deskripsi' => 'Pas foto calon murid dengan latar yang jelas.'],
            ],
            'alur' => [
                ['judul' => 'Buat Akun dengan NIK KK', 'deskripsi' => 'Gunakan NIK 16 digit pada Kartu Keluarga.'],
                ['judul' => 'Lengkapi Biodata & Jurusan', 'deskripsi' => 'Isi identitas, asal sekolah, dan pilihan keahlian.'],
                ['judul' => 'Unggah Foto Berkas Persyaratan', 'deskripsi' => 'Unggah hingga 20 foto dokumen yang terbaca jelas.'],
                ['judul' => 'Cetak Bukti Formulir & Pantau Verifikasi', 'deskripsi' => 'Simpan bukti pendaftaran dan cek status seleksi.'],
            ],
            'kontak' => [
                'nomor_whatsapp' => '',
                'nomor_telepon' => '',
                'email' => '',
                'alamat' => '',
            ],
        ];

        foreach ($defaultContents as $contentKey => $content) {
            SpmbContent::query()->firstOrCreate(
                ['content_key' => $contentKey],
                ['content' => $content],
            );
        }
    }
}
