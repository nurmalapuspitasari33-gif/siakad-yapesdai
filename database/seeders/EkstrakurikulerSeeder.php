<?php

namespace Database\Seeders;

use App\Models\Ekstrakurikuler;
use Illuminate\Database\Seeder;

class EkstrakurikulerSeeder extends Seeder
{
    public function run(): void
    {
        foreach (['Pramuka', 'PMR', 'Paskibra', 'Futsal', 'Hadroh'] as $namaEkstra) {
            Ekstrakurikuler::query()->firstOrCreate(
                ['nama_ekstra' => $namaEkstra],
                ['is_aktif' => true],
            );
        }
    }
}
