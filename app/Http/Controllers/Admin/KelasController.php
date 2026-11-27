<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use App\Models\Kelas;
use App\Models\ProgramKeahlian;
use App\Models\TahunAjaran;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class KelasController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Kelas/Index', [
            'daftarKelas' => Kelas::query()
                ->with([
                    'tahunAjaran:id,nama_tahun,semester',
                    'waliKelas:id,nama_lengkap',
                    'programKeahlian:id,kode_jurusan,nama_jurusan',
                    'konsentrasiKeahlian:id,program_keahlian_id,kode_konsentrasi,nama_konsentrasi',
                ])
                ->orderBy('nama_kelas')
                ->paginate(10)
                ->withQueryString(),
            'tahunAjarans' => TahunAjaran::query()
                ->orderByDesc('nama_tahun')
                ->orderBy('semester')
                ->get(['id', 'nama_tahun', 'semester']),
            'guruWaliKelas' => Guru::query()
                ->where('is_wali_kelas', true)
                ->orderBy('nama_lengkap')
                ->get(['id', 'nama_lengkap']),
            'programKeahlians' => ProgramKeahlian::query()
                ->with('konsentrasiKeahlians:id,program_keahlian_id,kode_konsentrasi,nama_konsentrasi')
                ->orderBy('nama_jurusan')
                ->get(['id', 'kode_jurusan', 'nama_jurusan', 'keterangan']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate($this->rules($request));

        Kelas::create($validated);

        return to_route('admin.kelas.index')
            ->with('success', 'Kelas berhasil ditambahkan.');
    }

    public function update(Request $request, Kelas $kelas): RedirectResponse
    {
        $validated = $request->validate($this->rules($request));

        if (
            (int) $validated['tahun_ajaran_id'] !== (int) $kelas->tahun_ajaran_id
            && ($kelas->jadwals()->exists() || $kelas->tugasMengajars()->exists())
        ) {
            return back()->withErrors([
                'tahun_ajaran_id' => 'Tahun ajaran kelas tidak dapat diubah karena kelas sudah digunakan pada jadwal atau tugas mengajar.',
            ]);
        }

        $kelas->update($validated);

        return to_route('admin.kelas.index')
            ->with('success', 'Kelas berhasil diperbarui.');
    }

    public function destroy(Kelas $kelas): RedirectResponse
    {
        if (
            $kelas->siswas()->exists()
            || $kelas->jadwals()->exists()
            || $kelas->tugasMengajars()->exists()
            || $kelas->ujians()->exists()
        ) {
            return back()->with('error', 'Kelas tidak dapat dihapus karena masih memiliki siswa, jadwal, penugasan mengajar, atau ujian.');
        }

        $kelas->delete();

        return to_route('admin.kelas.index')
            ->with('success', 'Kelas berhasil dihapus.');
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    private function rules(Request $request): array
    {
        return [
            'tahun_ajaran_id' => ['required', 'integer', Rule::exists('tahun_ajarans', 'id')],
            'wali_kelas_id' => [
                'nullable',
                'integer',
                Rule::exists('gurus', 'id')->where('is_wali_kelas', true),
            ],
            'program_keahlian_id' => [
                'nullable',
                'integer',
                Rule::exists('program_keahlians', 'id'),
            ],
            'konsentrasi_keahlian_id' => [
                'nullable',
                'integer',
                'required_with:program_keahlian_id',
                Rule::exists('konsentrasi_keahlians', 'id')
                    ->where('program_keahlian_id', $request->input('program_keahlian_id')),
            ],
            'nama_kelas' => ['required', 'string', 'max:255'],
            'tingkat' => ['required', 'integer', 'between:1,12'],
            'fase' => ['nullable', Rule::in(['E', 'F'])],
        ];
    }
}
