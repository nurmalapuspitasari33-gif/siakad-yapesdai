<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'user_id',
    'kelas_id',
    'program_keahlian_id',
    'konsentrasi_keahlian_id',
    'nis',
    'nisn',
    'nama_lengkap',
    'no_wa_wali',
    'status_siswa',
    'tempat_lahir',
    'tanggal_lahir',
    'jenis_kelamin',
    'agama',
    'status_keluarga',
    'anak_ke',
    'alamat_murid',
    'telepon_rumah',
    'sekolah_asal',
    'diterima_di_kelas',
    'tanggal_diterima',
    'nama_ayah',
    'nama_ibu',
    'alamat_ortu',
    'telepon_ortu',
    'pekerjaan_ayah',
    'pekerjaan_ibu',
    'nama_wali',
    'alamat_wali',
    'telepon_wali',
    'pekerjaan_wali',
    'foto_siswa_path',
    'ukuran_seragam',
    'tipe_program',
    'kategori_beasiswa_id',
])]
class Siswa extends Model
{
    protected function casts(): array
    {
        return [
            'tanggal_lahir' => 'date',
            'tanggal_diterima' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function kelas(): BelongsTo
    {
        return $this->belongsTo(Kelas::class);
    }

    public function programKeahlian(): BelongsTo
    {
        return $this->belongsTo(ProgramKeahlian::class);
    }

    public function konsentrasiKeahlian(): BelongsTo
    {
        return $this->belongsTo(KonsentrasiKeahlian::class);
    }

    public function kategoriBeasiswa(): BelongsTo
    {
        return $this->belongsTo(KategoriBeasiswa::class);
    }

    public function tagihans(): HasMany
    {
        return $this->hasMany(Tagihan::class);
    }

    public function presensiKelas(): HasMany
    {
        return $this->hasMany(PresensiKelas::class);
    }

    public function hasilUjians(): HasMany
    {
        return $this->hasMany(HasilUjian::class);
    }

    public function nilais(): HasMany
    {
        return $this->hasMany(Nilai::class);
    }

    public function nilaiGurus(): HasMany
    {
        return $this->hasMany(NilaiGuru::class);
    }

    public function catatanRapors(): HasMany
    {
        return $this->hasMany(CatatanRapor::class);
    }
}
