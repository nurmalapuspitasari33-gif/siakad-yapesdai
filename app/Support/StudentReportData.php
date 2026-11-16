<?php

namespace App\Support;

use App\Models\Siswa;
use Illuminate\Support\Facades\Storage;

class StudentReportData
{
    /**
     * @return array<string, mixed>
     */
    public static function identity(Siswa $siswa): array
    {
        return [
            'nama_lengkap' => $siswa->nama_lengkap,
            'nis' => $siswa->nis,
            'nisn' => $siswa->nisn,
            'kelas' => $siswa->kelas?->nama_kelas,
            'fase' => $siswa->kelas?->fase,
            'program_keahlian' => $siswa->programKeahlian?->nama_jurusan,
            'konsentrasi_keahlian' => $siswa->konsentrasiKeahlian?->nama_konsentrasi,
            'foto_siswa_url' => $siswa->foto_siswa_path
                ? Storage::disk('public')->url($siswa->foto_siswa_path)
                : null,
            'tempat_lahir' => $siswa->tempat_lahir,
            'tanggal_lahir' => $siswa->tanggal_lahir?->toDateString(),
            'jenis_kelamin' => $siswa->jenis_kelamin,
            'agama' => $siswa->agama,
            'status_keluarga' => $siswa->status_keluarga,
            'anak_ke' => $siswa->anak_ke,
            'alamat_murid' => $siswa->alamat_murid,
            'telepon_rumah' => $siswa->telepon_rumah,
            'sekolah_asal' => $siswa->sekolah_asal,
            'diterima_di_kelas' => $siswa->diterima_di_kelas,
            'tanggal_diterima' => $siswa->tanggal_diterima?->toDateString(),
            'nama_ayah' => $siswa->nama_ayah,
            'pekerjaan_ayah' => $siswa->pekerjaan_ayah,
            'nama_ibu' => $siswa->nama_ibu,
            'pekerjaan_ibu' => $siswa->pekerjaan_ibu,
            'alamat_ortu' => $siswa->alamat_ortu,
            'telepon_ortu' => $siswa->telepon_ortu,
            'nama_wali' => $siswa->nama_wali,
            'pekerjaan_wali' => $siswa->pekerjaan_wali,
            'alamat_wali' => $siswa->alamat_wali,
            'telepon_wali' => $siswa->telepon_wali,
            'ukuran_seragam' => $siswa->ukuran_seragam,
            'tipe_program' => $siswa->tipe_program,
            'kategori_beasiswa' => $siswa->kategoriBeasiswa?->nama_beasiswa,
        ];
    }
}
