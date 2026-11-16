<?php

namespace App\Http\Controllers\Siswa;

use App\Http\Controllers\Controller;
use App\Models\Tagihan;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TagihanController extends Controller
{
    public function index(Request $request): Response
    {
        $siswa = $request->user()->siswa;
        abort_unless($siswa, 404);

        return Inertia::render('Siswa/Tagihan/Index', [
            'tagihans' => Tagihan::query()
                ->where('siswa_id', $siswa->id)
                ->orderByDesc('jatuh_tempo')
                ->orderByDesc('id')
                ->get(['id', 'judul_tagihan', 'nominal', 'jatuh_tempo', 'status_bayar']),
        ]);
    }
}
