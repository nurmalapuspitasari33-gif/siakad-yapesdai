<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'tahun_ajaran_id',
    'siswa_id',
    'kokurikuler_predikat',
    'kokurikuler_deskripsi',
    'ekstra_1_nama',
    'ekstra_1_ket',
    'ekstra_2_nama',
    'ekstra_2_ket',
    'ekstra_3_nama',
    'ekstra_3_ket',
    'ekstra_4_nama',
    'ekstra_4_ket',
    'sakit',
    'izin',
    'tanpa_keterangan',
    'catatan_wali_kelas',
    'status_kenaikan',
    'naik_ke_kelas',
])]
class CatatanRapor extends Model
{
    protected function casts(): array
    {
        return [
            'sakit' => 'integer',
            'izin' => 'integer',
            'tanpa_keterangan' => 'integer',
        ];
    }

    public function tahunAjaran(): BelongsTo
    {
        return $this->belongsTo(TahunAjaran::class);
    }

    public function siswa(): BelongsTo
    {
        return $this->belongsTo(Siswa::class);
    }
}
