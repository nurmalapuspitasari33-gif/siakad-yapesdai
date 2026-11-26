<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

#[Fillable([
    'user_id',
    'program_keahlian_id',
    'konsentrasi_keahlian_id',
    'no_pendaftaran',
    'asal_sekolah',
    'berkas_path',
    'status_seleksi',
    'nis',
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
class PendaftaranSpmb extends Model
{
    public static function generateNoPendaftaran(): string
    {
        do {
            $number = 'SPMB-'.now()->format('Y').'-'.Str::upper(Str::random(8));
        } while (static::query()->where('no_pendaftaran', $number)->exists());

        return $number;
    }

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
}
