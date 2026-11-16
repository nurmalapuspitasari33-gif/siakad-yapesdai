<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TahunAjaran;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TahunAjaranController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/TahunAjaran/Index', [
            'tahunAjarans' => TahunAjaran::query()
                ->orderByDesc('nama_tahun')
                ->orderBy('semester')
                ->paginate(10)
                ->withQueryString(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nama_tahun' => [
                'required',
                'string',
                'max:255',
                Rule::unique('tahun_ajarans', 'nama_tahun')
                    ->where('semester', $request->input('semester')),
            ],
            'semester' => ['required', Rule::in(['ganjil', 'genap'])],
        ], [
            'nama_tahun.required' => 'Nama tahun ajaran wajib diisi.',
            'nama_tahun.unique' => 'Tahun ajaran dan semester tersebut sudah tersedia.',
            'semester.required' => 'Semester wajib dipilih.',
            'semester.in' => 'Semester yang dipilih tidak valid.',
        ]);

        TahunAjaran::create($validated);

        return to_route('admin.tahun-ajaran.index')
            ->with('success', 'Tahun ajaran berhasil ditambahkan.');
    }

    public function update(Request $request, TahunAjaran $tahunAjaran): RedirectResponse
    {
        $validated = $request->validate([
            'nama_tahun' => [
                'required',
                'string',
                'max:255',
                Rule::unique('tahun_ajarans', 'nama_tahun')
                    ->where('semester', $request->input('semester'))
                    ->ignore($tahunAjaran),
            ],
            'semester' => ['required', Rule::in(['ganjil', 'genap'])],
        ], [
            'nama_tahun.required' => 'Nama tahun ajaran wajib diisi.',
            'nama_tahun.unique' => 'Tahun ajaran dan semester tersebut sudah tersedia.',
            'semester.required' => 'Semester wajib dipilih.',
            'semester.in' => 'Semester yang dipilih tidak valid.',
        ]);

        $tahunAjaran->update($validated);

        return to_route('admin.tahun-ajaran.index')
            ->with('success', 'Tahun ajaran berhasil diperbarui.');
    }

    public function destroy(TahunAjaran $tahunAjaran): RedirectResponse
    {
        if ($tahunAjaran->is_aktif) {
            return back()->with('error', 'Aktifkan tahun ajaran lain sebelum menghapus tahun ajaran ini.');
        }

        if (
            $tahunAjaran->kelas()->exists()
            || $tahunAjaran->jadwals()->exists()
            || $tahunAjaran->nilais()->exists()
        ) {
            return back()->with('error', 'Tahun ajaran tidak dapat dihapus karena masih digunakan oleh kelas, jadwal, atau nilai.');
        }

        $tahunAjaran->delete();

        return to_route('admin.tahun-ajaran.index')
            ->with('success', 'Tahun ajaran berhasil dihapus.');
    }

    public function activate(TahunAjaran $tahunAjaran): RedirectResponse
    {
        DB::transaction(function () use ($tahunAjaran): void {
            TahunAjaran::query()->lockForUpdate()->get(['id']);

            TahunAjaran::query()
                ->where('id', '!=', $tahunAjaran->getKey())
                ->update(['is_aktif' => false]);

            $tahunAjaran->update(['is_aktif' => true]);
        });

        return to_route('admin.tahun-ajaran.index')
            ->with('success', 'Tahun ajaran berhasil diaktifkan.');
    }
}
