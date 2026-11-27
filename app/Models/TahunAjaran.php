<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['nama_tahun', 'semester', 'is_aktif'])]
class TahunAjaran extends Model
{
    protected function casts(): array
    {
        return [
            'is_aktif' => 'boolean',
        ];
    }

    public function kelas(): HasMany
    {
        return $this->hasMany(Kelas::class);
    }

    public function jadwals(): HasMany
    {
        return $this->hasMany(Jadwal::class);
    }

    public function tugasMengajars(): HasMany
    {
        return $this->hasMany(TugasMengajar::class);
    }

    public function nilais(): HasMany
    {
        return $this->hasMany(Nilai::class);
    }

    public function catatanRapors(): HasMany
    {
        return $this->hasMany(CatatanRapor::class);
    }
}
