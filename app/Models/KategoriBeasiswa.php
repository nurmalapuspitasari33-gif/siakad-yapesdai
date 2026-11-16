<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['nama_beasiswa', 'jenis_potongan', 'nilai_potongan', 'is_afirmasi', 'keterangan'])]
class KategoriBeasiswa extends Model
{
    protected function casts(): array
    {
        return [
            'nilai_potongan' => 'decimal:2',
            'is_afirmasi' => 'boolean',
        ];
    }

    public function siswas(): HasMany
    {
        return $this->hasMany(Siswa::class);
    }

    public function pendaftaranSpmbs(): HasMany
    {
        return $this->hasMany(PendaftaranSpmb::class);
    }
}
