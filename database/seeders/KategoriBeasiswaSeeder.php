<?php

namespace Database\Seeders;

use App\Models\KategoriBeasiswa;
use Illuminate\Database\Seeder;

class KategoriBeasiswaSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'nama_beasiswa' => 'Reguler / Non-Beasiswa',
                'jenis_potongan' => 'persen',
                'nilai_potongan' => 0,
                'is_afirmasi' => false,
                'keterangan' => 'Tarif normal tanpa potongan beasiswa.',
            ],
            [
                'nama_beasiswa' => 'Afirmasi Pemerintah',
                'jenis_potongan' => 'persen',
                'nilai_potongan' => 100,
                'is_afirmasi' => true,
                'keterangan' => 'Bebas biaya SPP dan praktikum; tagihan khusus tetap penuh.',
            ],
            [
                'nama_beasiswa' => 'Beasiswa Prestasi',
                'jenis_potongan' => 'persen',
                'nilai_potongan' => 0,
                'is_afirmasi' => false,
                'keterangan' => 'Atur besar potongan pada halaman kategori beasiswa.',
            ],
        ];

        foreach ($categories as $category) {
            KategoriBeasiswa::query()->firstOrCreate(
                ['nama_beasiswa' => $category['nama_beasiswa']],
                $category,
            );
        }
    }
}
