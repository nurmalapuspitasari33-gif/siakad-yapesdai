<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'ujian_id',
    'pertanyaan',
    'opsi_a',
    'opsi_b',
    'opsi_c',
    'opsi_d',
    'opsi_e',
    'kunci_jawaban',
    'tipe_soal',
    'bobot',
    'gambar_soal',
    'gambar_a',
    'gambar_b',
    'gambar_c',
    'gambar_d',
    'gambar_e',
    'opsi_json',
])]
class BankSoal extends Model
{
    protected function casts(): array
    {
        return [
            'bobot' => 'integer',
            'opsi_json' => 'array',
        ];
    }

    public function ujian(): BelongsTo
    {
        return $this->belongsTo(Ujian::class);
    }
}
