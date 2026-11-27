<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['kode_jurusan', 'nama_jurusan', 'keterangan'])]
class ProgramKeahlian extends Model
{
    public function mataPelajaranRaporKelasX(): BelongsToMany
    {
        return $this->belongsToMany(
            MataPelajaran::class,
            'program_keahlian_mata_pelajaran_kelas_x',
            'program_keahlian_id',
            'mata_pelajaran_id',
        )
            ->withPivot('urutan')
            ->withTimestamps()
            ->orderByPivot('urutan')
            ->orderBy('nama_mapel');
    }

    public function konsentrasiKeahlians(): HasMany
    {
        return $this->hasMany(KonsentrasiKeahlian::class);
    }

    public function kelas(): HasMany
    {
        return $this->hasMany(Kelas::class);
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
