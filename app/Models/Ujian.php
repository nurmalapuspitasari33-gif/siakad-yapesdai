<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['mapel_id', 'guru_id', 'kelas_id', 'judul_ujian', 'waktu_mulai', 'durasi_menit', 'acak_soal'])]
class Ujian extends Model
{
    protected function casts(): array
    {
        return [
            'waktu_mulai' => 'datetime',
            'durasi_menit' => 'integer',
            'acak_soal' => 'boolean',
        ];
    }

    public function mataPelajaran(): BelongsTo
    {
        return $this->belongsTo(MataPelajaran::class, 'mapel_id');
    }

    public function guru(): BelongsTo
    {
        return $this->belongsTo(Guru::class);
    }

    public function kelas(): BelongsTo
    {
        return $this->belongsTo(Kelas::class);
    }

    public function bankSoals(): HasMany
    {
        return $this->hasMany(BankSoal::class);
    }

    public function hasilUjians(): HasMany
    {
        return $this->hasMany(HasilUjian::class);
    }
}
