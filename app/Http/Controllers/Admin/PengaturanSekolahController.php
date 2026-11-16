<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PengaturanSekolah;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
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
            'telepon' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'kepala_sekolah' => ['nullable', 'string', 'max:255'],
            'niky_kepala_sekolah' => ['nullable', 'string', 'max:50'],
            'info_spmb' => ['nullable', 'string', 'max:5000'],
            'template_kokurikuler' => ['nullable', 'string', 'max:5000'],
            'tarif_spp_reguler' => ['required', 'numeric', 'gte:0', 'max:9999999999.99'],
            'tarif_praktikum' => ['required', 'numeric', 'gte:0', 'max:9999999999.99'],
            'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ], [
            'nama_sekolah.required' => 'Nama sekolah wajib diisi.',
            'email.email' => 'Format email sekolah tidak valid.',
            'logo.image' => 'Logo harus berupa gambar.',
            'logo.mimes' => 'Logo harus berformat JPG, PNG, atau WEBP.',
            'logo.max' => 'Ukuran logo maksimal 2 MB.',
            'tarif_spp_reguler.required' => 'Tarif SPP Reguler wajib diisi.',
            'tarif_praktikum.required' => 'Tarif praktikum wajib diisi.',
        ]);

        $newLogoPath = $request->file('logo')?->store('identitas-sekolah', 'public');

        if ($request->hasFile('logo') && ! is_string($newLogoPath)) {
            return back()->with('error', 'Logo gagal disimpan. Silakan coba kembali.');
        }

        $oldLogoPath = $settings->logo_path;
        $attributes = $validated;
        unset($attributes['logo']);

        if (is_string($newLogoPath)) {
            $attributes['logo_path'] = $newLogoPath;
        }

        $settings->update($attributes);

        if ($oldLogoPath && is_string($newLogoPath) && ! Storage::disk('public')->delete($oldLogoPath)) {
            Log::warning('Logo sekolah lama gagal dihapus setelah penggantian.', [
                'pengaturan_sekolah_id' => $settings->id,
                'path' => $oldLogoPath,
            ]);
        }

        return to_route('admin.pengaturan.index')->with('success', 'Identitas sekolah berhasil diperbarui.');
    }

    private function settings(): PengaturanSekolah
    {
        return PengaturanSekolah::query()->firstOrCreate(
            ['id' => 1],
            [
                'nama_sekolah' => 'Nama Sekolah',
                'tempat_rapor' => 'Kesugihan',
                'info_spmb' => 'Pendaftaran SPMB dilakukan secara daring melalui portal ini. Lengkapi formulir dan berkas persyaratan, lalu pantau hasil seleksi melalui akun Anda.',
            ],
        );
    }
}
