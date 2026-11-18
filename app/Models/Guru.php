<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['user_id', 'nip', 'nama_lengkap', 'is_wali_kelas'])]
class Guru extends Model
{
    protected function casts(): array
    {
        return [
            'is_wali_kelas' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function kelasWalian(): HasMany
    {
        return $this->hasMany(Kelas::class, 'wali_kelas_id');
    }

    /**
     * @return EloquentCollection<int, Kelas>
     */
    public function kelasWalianAktif(): EloquentCollection
    {
        if (! $this->is_wali_kelas) {
            return new EloquentCollection;
        }

        return $this->kelasWalian()
            ->whereHas('tahunAjaran', fn ($query) => $query->where('is_aktif', true))
            ->orderBy('nama_kelas')
            ->get(['id', 'nama_kelas', 'tahun_ajaran_id', 'fase']);
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
