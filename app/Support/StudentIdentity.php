<?php

namespace App\Support;

use App\Models\Siswa;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;

class StudentIdentity
{
    /**
     * @var array<int, string>
     */
    public const PROFILE_FIELDS = [
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
        'ukuran_seragam',
        'tipe_program',
        'kategori_beasiswa_id',
    ];

    /**
     * @return array<string, array<int, mixed>>
     */
    public static function rules(?Siswa $siswa = null): array
    {
        return [
            'nis' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('siswas', 'nis')->ignore($siswa?->id),
            ],
            'tempat_lahir' => ['nullable', 'string', 'max:100'],
            'tanggal_lahir' => ['nullable', 'date_format:Y-m-d'],
            'jenis_kelamin' => ['nullable', Rule::in(['L', 'P'])],
            'agama' => ['nullable', 'string', 'max:50'],
            'status_keluarga' => ['nullable', 'string', 'max:50'],
            'anak_ke' => ['nullable', 'integer', 'between:1,30'],
            'alamat_murid' => ['nullable', 'string', 'max:2000'],
            'telepon_rumah' => ['nullable', 'string', 'max:30'],
            'sekolah_asal' => ['nullable', 'string', 'max:255'],
            'diterima_di_kelas' => ['nullable', 'string', 'max:255'],
            'tanggal_diterima' => ['nullable', 'date_format:Y-m-d'],
            'nama_ayah' => ['nullable', 'string', 'max:255'],
            'nama_ibu' => ['nullable', 'string', 'max:255'],
            'alamat_ortu' => ['nullable', 'string', 'max:2000'],
            'telepon_ortu' => ['nullable', 'string', 'max:30'],
            'pekerjaan_ayah' => ['nullable', 'string', 'max:255'],
            'pekerjaan_ibu' => ['nullable', 'string', 'max:255'],
            'nama_wali' => ['nullable', 'string', 'max:255'],
            'alamat_wali' => ['nullable', 'string', 'max:2000'],
            'telepon_wali' => ['nullable', 'string', 'max:30'],
            'pekerjaan_wali' => ['nullable', 'string', 'max:255'],
            'foto_siswa' => ['nullable', 'image', 'mimes:jpg,jpeg,png', 'dimensions:ratio=3/4', 'max:2048'],
            'ukuran_seragam' => ['nullable', Rule::in(['S', 'M', 'L', 'XL', 'XXL'])],
            'tipe_program' => ['sometimes', 'required', Rule::in(['reguler', 'santri_internal', 'santri_eksternal'])],
            'kategori_beasiswa_id' => ['nullable', 'integer', Rule::exists('kategori_beasiswas', 'id')],
        ];
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    public static function attributes(array $validated): array
    {
        return Arr::only($validated, self::PROFILE_FIELDS);
    }
}
