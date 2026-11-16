<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KonsentrasiKeahlian;
use App\Models\ProgramKeahlian;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ProgramKeahlianController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'kode_jurusan' => ['required', 'string', 'max:50', Rule::unique('program_keahlians', 'kode_jurusan')],
            'nama_jurusan' => ['required', 'string', 'max:255', Rule::unique('program_keahlians', 'nama_jurusan')],
            'keterangan' => ['nullable', 'string', 'max:2000'],
        ]);

        ProgramKeahlian::query()->create($validated);

        return to_route('admin.kelas.index')->with('success', 'Program Keahlian berhasil ditambahkan.');
    }

    public function update(Request $request, ProgramKeahlian $programKeahlian): RedirectResponse
    {
        $validated = $request->validate([
            'kode_jurusan' => [
                'required',
                'string',
                'max:50',
                Rule::unique('program_keahlians', 'kode_jurusan')->ignore($programKeahlian),
            ],
            'nama_jurusan' => [
                'required',
                'string',
                'max:255',
                Rule::unique('program_keahlians', 'nama_jurusan')->ignore($programKeahlian),
            ],
            'keterangan' => ['nullable', 'string', 'max:2000'],
        ]);

        $programKeahlian->update($validated);

        return to_route('admin.kelas.index')->with('success', 'Program Keahlian berhasil diperbarui.');
    }

    public function destroy(ProgramKeahlian $programKeahlian): RedirectResponse
    {
        $isUsed = $programKeahlian->kelas()->exists()
            || $programKeahlian->siswas()->exists()
            || $programKeahlian->pendaftaranSpmbs()->exists()
            || $programKeahlian->konsentrasiKeahlians()
                ->where(function ($query): void {
                    $query->whereHas('kelas')
                        ->orWhereHas('siswas')
                        ->orWhereHas('pendaftaranSpmbs');
                })
                ->exists();

        if ($isUsed) {
            return back()->with('error', 'Program tidak dapat dihapus karena sudah digunakan oleh kelas, siswa, atau pendaftar.');
        }

        $programKeahlian->delete();

        return to_route('admin.kelas.index')->with('success', 'Program Keahlian berhasil dihapus.');
    }

    public function storeConcentration(Request $request, ProgramKeahlian $programKeahlian): RedirectResponse
    {
        $validated = $request->validate([
            'kode_konsentrasi' => ['required', 'string', 'max:50', Rule::unique('konsentrasi_keahlians', 'kode_konsentrasi')],
            'nama_konsentrasi' => [
                'required',
                'string',
                'max:255',
                Rule::unique('konsentrasi_keahlians', 'nama_konsentrasi')
                    ->where('program_keahlian_id', $programKeahlian->id),
            ],
        ]);

        $programKeahlian->konsentrasiKeahlians()->create($validated);

        return to_route('admin.kelas.index')->with('success', 'Konsentrasi Keahlian berhasil ditambahkan.');
    }

    public function updateConcentration(Request $request, KonsentrasiKeahlian $konsentrasiKeahlian): RedirectResponse
    {
        $validated = $request->validate([
            'program_keahlian_id' => ['required', 'integer', Rule::exists('program_keahlians', 'id')],
            'kode_konsentrasi' => [
                'required',
                'string',
                'max:50',
                Rule::unique('konsentrasi_keahlians', 'kode_konsentrasi')->ignore($konsentrasiKeahlian),
            ],
            'nama_konsentrasi' => [
                'required',
                'string',
                'max:255',
                Rule::unique('konsentrasi_keahlians', 'nama_konsentrasi')
                    ->where('program_keahlian_id', $request->input('program_keahlian_id'))
                    ->ignore($konsentrasiKeahlian),
            ],
        ]);

        if (
            (int) $validated['program_keahlian_id'] !== $konsentrasiKeahlian->program_keahlian_id
            && $this->concentrationIsUsed($konsentrasiKeahlian)
        ) {
            throw ValidationException::withMessages([
                'program_keahlian_id' => 'Program tidak dapat diubah karena konsentrasi ini sudah digunakan.',
            ]);
        }

        $konsentrasiKeahlian->update($validated);

        return to_route('admin.kelas.index')->with('success', 'Konsentrasi Keahlian berhasil diperbarui.');
    }

    public function destroyConcentration(KonsentrasiKeahlian $konsentrasiKeahlian): RedirectResponse
    {
        if ($this->concentrationIsUsed($konsentrasiKeahlian)) {
            return back()->with('error', 'Konsentrasi tidak dapat dihapus karena sudah digunakan oleh kelas, siswa, atau pendaftar.');
        }

        $konsentrasiKeahlian->delete();

        return to_route('admin.kelas.index')->with('success', 'Konsentrasi Keahlian berhasil dihapus.');
    }

    private function concentrationIsUsed(KonsentrasiKeahlian $konsentrasiKeahlian): bool
    {
        return $konsentrasiKeahlian->kelas()->exists()
            || $konsentrasiKeahlian->siswas()->exists()
            || $konsentrasiKeahlian->pendaftaranSpmbs()->exists();
    }
}
