<?php

namespace App\Http\Controllers\Siswa;

use App\Http\Controllers\Controller;
use App\Models\TahunAjaran;
use App\Support\StudentAttendanceSummary;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PresensiController extends Controller
{
    public function index(Request $request, StudentAttendanceSummary $attendanceSummary): Response
    {
        $siswa = $request->user()->siswa;
        abort_unless($siswa, 404);

        $tahunAjaranAktif = TahunAjaran::query()
            ->where('is_aktif', true)
            ->first(['id', 'nama_tahun', 'semester']);

        return Inertia::render('Siswa/Presensi/Index', [
            'siswa' => [
                'nama_lengkap' => $siswa->nama_lengkap,
                'kelas' => $siswa->kelas?->nama_kelas,
            ],
            ...$attendanceSummary->for($siswa, $tahunAjaranAktif),
            'isCandidate' => $siswa->status_siswa === 'calon_spmb',
        ]);
    }
}
