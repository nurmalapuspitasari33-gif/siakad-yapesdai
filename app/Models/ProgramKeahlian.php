<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['kode_jurusan', 'nama_jurusan', 'keterangan'])]
class ProgramKeahlian extends Model
{
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
