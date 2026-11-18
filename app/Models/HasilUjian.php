<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'ujian_id',
    'siswa_id',
    'jawaban_json',
    'skor_akhir',
    'status_pengerjaan',
    'jumlah_pelanggaran',
    'catatan_pelanggaran',
])]
class HasilUjian extends Model
{
    protected function casts(): array
    {
        return [
            'jawaban_json' => 'array',
            'skor_akhir' => 'decimal:2',
            'jumlah_pelanggaran' => 'integer',
        ];
    }

    public function ujian(): BelongsTo
    {
        return $this->belongsTo(Ujian::class);
    }

    public function siswa(): BelongsTo
    {
        return $this->belongsTo(Siswa::class);
    }
}
