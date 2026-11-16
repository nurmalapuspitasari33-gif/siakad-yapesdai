<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'tahun_ajaran_id',
    'wali_kelas_id',
    'program_keahlian_id',
    'konsentrasi_keahlian_id',
    'nama_kelas',
    'tingkat',
    'fase',
])]
class Kelas extends Model
{
    protected function casts(): array
    {
        return [
            'tingkat' => 'integer',
        ];
    }

    public function tahunAjaran(): BelongsTo
    {
        return $this->belongsTo(TahunAjaran::class);
    }

    public function waliKelas(): BelongsTo
    {
        return $this->belongsTo(Guru::class, 'wali_kelas_id');
    }

    public function programKeahlian(): BelongsTo
    {
        return $this->belongsTo(ProgramKeahlian::class);
    }

    public function konsentrasiKeahlian(): BelongsTo
    {
        return $this->belongsTo(KonsentrasiKeahlian::class);
    }

    public function siswas(): HasMany
    {
        return $this->hasMany(Siswa::class);
    }

    public function jadwals(): HasMany
    {
        return $this->hasMany(Jadwal::class);
    }

    public function ujians(): HasMany
    {
        return $this->hasMany(Ujian::class);
    }
}
