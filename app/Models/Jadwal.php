<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'tahun_ajaran_id',
    'tugas_mengajar_id',
    'kelas_id',
    'mapel_id',
    'guru_id',
    'jumlah_jp',
    'ruang',
    'hari',
    'jam_mulai',
    'jam_selesai',
])]
class Jadwal extends Model
{
    protected function casts(): array
    {
        return [
            'jumlah_jp' => 'integer',
        ];
    }

    public function tahunAjaran(): BelongsTo
    {
        return $this->belongsTo(TahunAjaran::class);
    }

    public function tugasMengajar(): BelongsTo
    {
        return $this->belongsTo(TugasMengajar::class);
    }

    public function kelas(): BelongsTo
    {
        return $this->belongsTo(Kelas::class);
    }

    public function mataPelajaran(): BelongsTo
    {
        return $this->belongsTo(MataPelajaran::class, 'mapel_id');
    }

    public function guru(): BelongsTo
    {
        return $this->belongsTo(Guru::class);
    }
}
