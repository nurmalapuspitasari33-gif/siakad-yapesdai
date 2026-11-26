<?php

namespace App\Http\Controllers;

use App\Models\ProgramKeahlian;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class SpmbPortalController extends Controller
{
    public function __invoke(): Response
    {
        $programKeahlians = ProgramKeahlian::query()
            ->with('konsentrasiKeahlians:id,program_keahlian_id,nama_konsentrasi')
            ->orderBy('nama_jurusan')
            ->get(['id', 'kode_jurusan', 'nama_jurusan']);

        return Inertia::render('Welcome', [
            'canLogin' => Route::has('login'),
            'canRegister' => Route::has('register'),
            'programKeahlians' => $programKeahlians,
            'statistics' => [
                'competencies' => $programKeahlians->count(),
                'pathways' => 3,
                'registration' => 'Gelombang pendaftaran aktif',
            ],
        ]);
    }
}
