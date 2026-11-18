<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PengaturanSekolah;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PengaturanSekolahController extends Controller
{
    public function index(): Response
    {
        $this->settings();

        return Inertia::render('Admin/PengaturanSekolah/Index');
    }

    public function update(Request $request): RedirectResponse
    {
        $settings = $this->settings();
        $validated = $request->validate([
            'nama_sekolah' => ['required', 'string', 'max:255'],
            'npsn' => ['nullable', 'string', 'max:20'],
            'alamat' => ['nullable', 'string', 'max:2000'],
            'tempat_rapor' => ['nullable', 'string', 'max:100'],
            'tanggal_rapor' => ['nullable', 'date'],
            'status_rilis_rapor' => ['sometimes', 'required', Rule::in(['otomatis', 'buka', 'kunci'])],
            'telepon' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'kepala_sekolah' => ['nullable', 'string', 'max:255'],
            'niky_kepala_sekolah' => ['nullable', 'string', 'max:50'],
            'tarif_spp_reguler' => ['required', 'numeric', 'gte:0', 'max:9999999999.99'],
            'tarif_praktikum' => ['required', 'numeric', 'gte:0', 'max:9999999999.99'],
        ], [
            'nama_sekolah.required' => 'Nama sekolah wajib diisi.',
            'email.email' => 'Format email sekolah tidak valid.',
            'status_rilis_rapor.in' => 'Pilihan kontrol rilis rapor tidak valid.',
            'tarif_spp_reguler.required' => 'Tarif SPP Reguler wajib diisi.',
            'tarif_praktikum.required' => 'Tarif praktikum wajib diisi.',
        ]);

        $settings->update($validated);

        return to_route('admin.pengaturan.index')->with('success', 'Identitas sekolah berhasil diperbarui.');
    }

    private function settings(): PengaturanSekolah
    {
        return PengaturanSekolah::query()->firstOrCreate(
            ['id' => 1],
            [
                'nama_sekolah' => "SMK Al Mu'allim Kesugihan",
                'tempat_rapor' => 'Kesugihan',
            ],
        );
    }
}
