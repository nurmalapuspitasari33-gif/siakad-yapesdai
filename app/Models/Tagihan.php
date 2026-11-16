<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'siswa_id',
    'judul_tagihan',
    'jenis_tagihan',
    'nominal',
    'jatuh_tempo',
    'status_bayar',
    'status_wa',
])]
class Tagihan extends Model
{
    protected function casts(): array
    {
        return [
            'nominal' => 'decimal:2',
            'jatuh_tempo' => 'date',
        ];
    }

    public function siswa(): BelongsTo
    {
        return $this->belongsTo(Siswa::class);
    }
}
