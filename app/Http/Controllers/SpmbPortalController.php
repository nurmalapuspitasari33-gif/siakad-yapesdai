<?php

namespace App\Http\Controllers;

use App\Models\GelombangSpmb;
use App\Models\ProgramKeahlian;
use App\Models\SpmbBanner;
use App\Models\SpmbContent;
use App\Models\TahunAjaran;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class SpmbPortalController extends Controller
{
    public function __invoke(): Response
    {
        $wave = GelombangSpmb::query()
            ->where('is_active', true)
            ->latest('tanggal_mulai')
            ->first();
        $registrationOpen = $wave !== null
            && today()->greaterThanOrEqualTo($wave->tanggal_mulai)
            && today()->lessThanOrEqualTo($wave->tanggal_selesai);
        $contents = SpmbContent::query()
            ->get()
            ->mapWithKeys(fn (SpmbContent $content): array => [$content->content_key => $content->content]);
        $tahunAjaran = TahunAjaran::query()->where('is_aktif', true)->first();
        $programKeahlians = ProgramKeahlian::query()
            ->with('konsentrasiKeahlians:id,program_keahlian_id,nama_konsentrasi')
            ->orderBy('nama_jurusan')
            ->get(['id', 'kode_jurusan', 'nama_jurusan']);
        $slides = SpmbBanner::query()
            ->where('is_active', true)
            ->orderBy('urutan')
            ->orderBy('id')
            ->get()
            ->map(fn (SpmbBanner $banner): array => [
                'id' => $banner->id,
                'kicker' => $banner->kicker,
                'judul' => $banner->judul,
                'subjudul' => $banner->subjudul,
                'gambar_url' => $banner->gambar_path
                    ? Storage::disk('public')->url($banner->gambar_path)
                    : null,
                'cta_label' => $banner->cta_label,
                'cta_url' => $banner->cta_url,
            ]);
        $pathways = collect($contents->get('jalur_seleksi', []))
            ->map(fn (array $pathway): array => [
                ...$pathway,
                'status_buka' => (bool) ($pathway['status_buka'] ?? false),
            ])
            ->values();

        return Inertia::render('Welcome', [
            'canLogin' => Route::has('login'),
            'canRegister' => Route::has('register'),
            'programKeahlians' => $programKeahlians,
            'slides' => $slides,
            'pathways' => $pathways,
            'requirements' => $contents->get('persyaratan', []),
            'processSteps' => $contents->get('alur', []),
            'portalContacts' => $contents->get('kontak', []),
            'tahunAjaranAktif' => $tahunAjaran ? [
                'nama_tahun' => $tahunAjaran->nama_tahun,
                'semester' => $tahunAjaran->semester,
                'label' => $tahunAjaran->nama_tahun.' · Semester '.ucfirst($tahunAjaran->semester),
            ] : null,
            'wave' => $wave ? [
                'nama_gelombang' => $wave->nama_gelombang,
                'tahun_ajaran' => $wave->tahun_ajaran,
                'tanggal_mulai' => $wave->tanggal_mulai->format('d-m-Y'),
                'tanggal_selesai' => $wave->tanggal_selesai->format('d-m-Y'),
                'kuota' => $wave->kuota,
                'status_label' => $registrationOpen ? 'Pendaftaran Dibuka' : 'Pendaftaran Ditutup',
            ] : null,
            'statistics' => [
                'competencies' => $programKeahlians->count(),
                'pathways' => $pathways->count(),
                'registration' => $registrationOpen ? 'Pendaftaran Dibuka' : 'Pendaftaran Ditutup',
                'registration_open' => $registrationOpen,
            ],
        ]);
    }
}
