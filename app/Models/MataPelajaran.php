<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['kode_mapel', 'nama_mapel', 'kelompok_mapel'])]
class MataPelajaran extends Model
{
    public function konsentrasiKeahlians(): BelongsToMany
    {
        return $this->belongsToMany(
            KonsentrasiKeahlian::class,
            'konsentrasi_keahlian_mata_pelajaran',
            'mata_pelajaran_id',
            'konsentrasi_keahlian_id',
        )->withPivot('urutan')->withTimestamps();
    }

    public function jadwals(): HasMany
    {
        return $this->hasMany(Jadwal::class, 'mapel_id');
    }

    public function ujians(): HasMany
    {
        return $this->hasMany(Ujian::class, 'mapel_id');
    }

    public function nilais(): HasMany
    {
        return $this->hasMany(Nilai::class, 'mapel_id');
    }
}
