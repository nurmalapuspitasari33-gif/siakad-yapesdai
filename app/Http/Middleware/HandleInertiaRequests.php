<?php

namespace App\Http\Middleware;

use App\Models\PengaturanSekolah;
use App\Models\TahunAjaran;
use Illuminate\Http\Request;
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
            'activeTahunAjaran' => function (): ?array {
                $tahunAjaran = TahunAjaran::query()
                    ->where('is_aktif', true)
                    ->first(['nama_tahun', 'semester']);

                if (! $tahunAjaran) {
                    return null;
                }

                return [
                    'tahun' => $tahunAjaran->nama_tahun,
                    'nama_tahun' => $tahunAjaran->nama_tahun,
                    'semester' => $tahunAjaran->semester,
                    'label' => $tahunAjaran->nama_tahun.' • '.ucfirst($tahunAjaran->semester),
                ];
            },
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'temporaryPassword' => fn () => $request->session()->pull('temporary_password'),
                'temporaryPasswordStudent' => fn () => $request->session()->pull('temporary_password_student'),
            ],
            'assetUrls' => [
                'logoSekolah' => asset('logo.png'),
                'logoYapesdai' => asset('yapesdai.png'),
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
                    'status_rilis_rapor' => $settings->status_rilis_rapor,
                    'telepon' => $settings->telepon,
                    'email' => $settings->email,
                    'kepala_sekolah' => $settings->kepala_sekolah,
                    'niky_kepala_sekolah' => $settings->niky_kepala_sekolah,
                    'tarif_spp_reguler' => $settings->tarif_spp_reguler,
                    'tarif_praktikum' => $settings->tarif_praktikum,
                ];
            },
        ];
    }
}
