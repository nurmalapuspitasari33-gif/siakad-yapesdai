<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'nama_gelombang',
    'tahun_ajaran',
    'tanggal_mulai',
    'tanggal_selesai',
    'kuota',
    'keterangan',
    'is_active',
])]
class GelombangSpmb extends Model
{
    protected function casts(): array
    {
        return [
            'tanggal_mulai' => 'date',
            'tanggal_selesai' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public function scopeOpen(Builder $query): Builder
    {
        return $query
            ->where('is_active', true)
            ->whereDate('tanggal_mulai', '<=', today())
            ->whereDate('tanggal_selesai', '>=', today());
    }

    public function pendaftaranSpmbs(): HasMany
    {
        return $this->hasMany(PendaftaranSpmb::class, 'gelombang_spmb_id');
    }
}
