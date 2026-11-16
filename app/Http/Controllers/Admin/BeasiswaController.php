<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KategoriBeasiswa;
use App\Models\PengaturanSekolah;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class BeasiswaController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Beasiswa/Index', [
            'kategoriBeasiswas' => KategoriBeasiswa::query()
                ->withCount(['siswas', 'pendaftaranSpmbs'])
                ->orderBy('nama_beasiswa')
                ->get(),
            'tarif' => PengaturanSekolah::query()->findOrFail(1)->only([
                'tarif_spp_reguler',
                'tarif_praktikum',
            ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate($this->rules($request));
        KategoriBeasiswa::create($validated);

        return to_route('admin.beasiswa.index')->with('success', 'Kategori beasiswa berhasil ditambahkan.');
    }

    public function update(Request $request, KategoriBeasiswa $beasiswa): RedirectResponse
    {
        $validated = $request->validate($this->rules($request, $beasiswa));
        $beasiswa->update($validated);

        return to_route('admin.beasiswa.index')->with('success', 'Kategori beasiswa berhasil diperbarui.');
    }

    public function destroy(KategoriBeasiswa $beasiswa): RedirectResponse
    {
        if ($beasiswa->siswas()->exists() || $beasiswa->pendaftaranSpmbs()->exists()) {
            return back()->with('error', 'Kategori tidak dapat dihapus karena masih digunakan oleh siswa atau pendaftar.');
        }

        $beasiswa->delete();

        return to_route('admin.beasiswa.index')->with('success', 'Kategori beasiswa berhasil dihapus.');
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    private function rules(Request $request, ?KategoriBeasiswa $beasiswa = null): array
    {
        return [
            'nama_beasiswa' => [
                'required',
                'string',
                'max:255',
                Rule::unique('kategori_beasiswas', 'nama_beasiswa')->ignore($beasiswa),
            ],
            'jenis_potongan' => ['required', Rule::in(['persen', 'nominal'])],
            'nilai_potongan' => [
                'required',
                'numeric',
                'gte:0',
                'max:9999999999.99',
                Rule::when(
                    $request->input('jenis_potongan') === 'persen',
                    ['lte:100'],
                ),
            ],
            'is_afirmasi' => ['required', 'boolean'],
            'keterangan' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
