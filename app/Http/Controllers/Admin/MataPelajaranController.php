<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Ekstrakurikuler;
use App\Models\MataPelajaran;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class MataPelajaranController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
        ]);
        $search = trim($filters['search'] ?? '');

        $mataPelajarans = MataPelajaran::query()
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('kode_mapel', 'like', "%{$search}%")
                        ->orWhere('nama_mapel', 'like', "%{$search}%");
                });
            })
            ->orderBy('nama_mapel')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Admin/Mapel/Index', [
            'mataPelajarans' => $mataPelajarans,
            'filters' => ['search' => $search],
            'ekstrakurikulers' => Ekstrakurikuler::query()
                ->orderBy('nama_ekstra')
                ->get(['id', 'nama_ekstra', 'is_aktif']),
            'activeTab' => $request->query('tab') === 'ekstrakurikuler' ? 'ekstrakurikuler' : 'mapel',
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'kode_mapel' => ['required', 'string', 'max:255', Rule::unique('mata_pelajarans', 'kode_mapel')],
            'nama_mapel' => ['required', 'string', 'max:255'],
            'kelompok_mapel' => ['required', Rule::in(['umum', 'kejuruan', 'muatan_lokal'])],
        ], [
            'kode_mapel.required' => 'Kode mata pelajaran wajib diisi.',
            'kode_mapel.unique' => 'Kode mata pelajaran sudah digunakan.',
            'nama_mapel.required' => 'Nama mata pelajaran wajib diisi.',
        ]);

        MataPelajaran::create($validated);

        return to_route('admin.mapel.index')
            ->with('success', 'Mata pelajaran berhasil ditambahkan.');
    }

    public function update(Request $request, MataPelajaran $mapel): RedirectResponse
    {
        $validated = $request->validate([
            'kode_mapel' => [
                'required',
                'string',
                'max:255',
                Rule::unique('mata_pelajarans', 'kode_mapel')->ignore($mapel),
            ],
            'nama_mapel' => ['required', 'string', 'max:255'],
            'kelompok_mapel' => ['required', Rule::in(['umum', 'kejuruan', 'muatan_lokal'])],
        ], [
            'kode_mapel.required' => 'Kode mata pelajaran wajib diisi.',
            'kode_mapel.unique' => 'Kode mata pelajaran sudah digunakan.',
            'nama_mapel.required' => 'Nama mata pelajaran wajib diisi.',
        ]);

        $mapel->update($validated);

        return to_route('admin.mapel.index')
            ->with('success', 'Mata pelajaran berhasil diperbarui.');
    }

    public function destroy(MataPelajaran $mapel): RedirectResponse
    {
        if ($mapel->jadwals()->exists() || $mapel->ujians()->exists() || $mapel->nilais()->exists()) {
            return back()->with('error', 'Mata pelajaran tidak dapat dihapus karena masih digunakan oleh jadwal, ujian, atau nilai.');
        }

        $mapel->delete();

        return to_route('admin.mapel.index')
            ->with('success', 'Mata pelajaran berhasil dihapus.');
    }
}
