<?php

namespace App\Http\Middleware;

use App\Models\PengaturanSekolah;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'pengaturanSekolah' => function (): ?array {
                $settings = PengaturanSekolah::query()->find(1);

                if (! $settings) {
                    return null;
                }

                return [
                    'nama_sekolah' => $settings->nama_sekolah,
                    'npsn' => $settings->npsn,
                    'alamat' => $settings->alamat,
                    'tempat_rapor' => $settings->tempat_rapor,
                    'tanggal_rapor' => $settings->tanggal_rapor?->toDateString(),
                    'telepon' => $settings->telepon,
                    'email' => $settings->email,
                    'kepala_sekolah' => $settings->kepala_sekolah,
                    'niky_kepala_sekolah' => $settings->niky_kepala_sekolah,
                    'logo_path' => $settings->logo_path,
                    'template_kokurikuler' => $settings->template_kokurikuler,
                    'tarif_spp_reguler' => $settings->tarif_spp_reguler,
                    'tarif_praktikum' => $settings->tarif_praktikum,
                    'logo_url' => $settings->logo_path
                        ? Storage::disk('public')->url($settings->logo_path)
                        : null,
                    'info_spmb' => $settings->info_spmb,
                ];
            },
        ];
    }
}
