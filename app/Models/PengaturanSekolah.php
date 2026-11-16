<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'nama_sekolah',
    'npsn',
    'alamat',
    'tempat_rapor',
    'tanggal_rapor',
    'telepon',
    'email',
    'kepala_sekolah',
    'niky_kepala_sekolah',
    'logo_path',
    'info_spmb',
    'template_kokurikuler',
    'tarif_spp_reguler',
    'tarif_praktikum',
])]
class PengaturanSekolah extends Model
{
    protected function casts(): array
    {
        return [
            'tanggal_rapor' => 'date',
            'tarif_spp_reguler' => 'decimal:2',
            'tarif_praktikum' => 'decimal:2',
        ];
    }
}
