<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['program_keahlian_id', 'kode_konsentrasi', 'nama_konsentrasi'])]
class KonsentrasiKeahlian extends Model
{
    public function programKeahlian(): BelongsTo
    {
        return $this->belongsTo(ProgramKeahlian::class);
    }

    public function mataPelajarans(): BelongsToMany
    {
        return $this->belongsToMany(
            MataPelajaran::class,
            'konsentrasi_keahlian_mata_pelajaran',
            'konsentrasi_keahlian_id',
            'mata_pelajaran_id',
        )
            ->withPivot('urutan')
            ->withTimestamps()
            ->orderByPivot('urutan')
            ->orderBy('nama_mapel');
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
