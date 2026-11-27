<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'tahun_ajaran_id',
    'siswa_id',
    'kelas_id',
    'mapel_id',
    'guru_id',
    'nilai_akhir',
    'capaian_kompetensi',
])]
class NilaiGuru extends Model
{
    /**
     * @param  iterable<NilaiGuru>  $contributions
     */
    public static function combineCompetencyDescriptions(iterable $contributions): ?string
    {
        $descriptions = collect($contributions)
            ->map(fn (NilaiGuru $contribution): ?string => $contribution->capaian_kompetensi)
            ->filter(fn (?string $description): bool => filled($description))
            ->unique(fn (string $description): string => trim($description))
            ->values();

        return $descriptions->isNotEmpty() ? $descriptions->implode("\n") : null;
    }

    public function tahunAjaran(): BelongsTo
    {
        return $this->belongsTo(TahunAjaran::class);
    }

    public function siswa(): BelongsTo
    {
        return $this->belongsTo(Siswa::class);
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
