<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'tahun_ajaran_id',
    'siswa_id',
    'mapel_id',
    'nilai_tugas',
    'nilai_uts',
    'nilai_uas',
    'nilai_akhir',
    'capaian_kompetensi',
    'catatan',
])]
class Nilai extends Model
{
    protected function casts(): array
    {
        return [
            'nilai_akhir' => 'decimal:2',
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

    public function mataPelajaran(): BelongsTo
    {
        return $this->belongsTo(MataPelajaran::class, 'mapel_id');
    }
}
