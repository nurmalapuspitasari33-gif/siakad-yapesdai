<?php

namespace Database\Seeders;

use App\Models\ProgramKeahlian;
use Illuminate\Database\Seeder;

class ProgramKeahlianSeeder extends Seeder
{
    /**
     * @var array<int, array{
     *     kode_jurusan: string,
     *     nama_jurusan: string,
     *     konsentrasi_keahlians: array<int, array{kode_konsentrasi: string, nama_konsentrasi: string}>
     * }>
     */
    private const DEFAULT_PROGRAMS = [
        [
            'kode_jurusan' => 'TO',
            'nama_jurusan' => 'Teknik Otomotif',
            'konsentrasi_keahlians' => [
                ['kode_konsentrasi' => 'TKR', 'nama_konsentrasi' => 'Teknik Kendaraan Ringan'],
                ['kode_konsentrasi' => 'TSM', 'nama_konsentrasi' => 'Teknik Sepeda Motor'],
            ],
        ],
        [
            'kode_jurusan' => 'TF',
            'nama_jurusan' => 'Teknologi Farmasi',
            'konsentrasi_keahlians' => [
                ['kode_konsentrasi' => 'FI', 'nama_konsentrasi' => 'Farmasi Industri'],
            ],
        ],
        [
            'kode_jurusan' => 'AKL',
            'nama_jurusan' => 'Akuntansi dan Keuangan Lembaga',
            'konsentrasi_keahlians' => [
                ['kode_konsentrasi' => 'AK', 'nama_konsentrasi' => 'Akuntansi'],
            ],
        ],
    ];

    public function run(): void
    {
        foreach (self::DEFAULT_PROGRAMS as $programData) {
            $program = ProgramKeahlian::query()->updateOrCreate(
                ['kode_jurusan' => $programData['kode_jurusan']],
                ['nama_jurusan' => $programData['nama_jurusan']],
            );

            foreach ($programData['konsentrasi_keahlians'] as $concentrationData) {
                $program->konsentrasiKeahlians()->updateOrCreate(
                    ['kode_konsentrasi' => $concentrationData['kode_konsentrasi']],
                    ['nama_konsentrasi' => $concentrationData['nama_konsentrasi']],
                );
            }
        }
    }
}
