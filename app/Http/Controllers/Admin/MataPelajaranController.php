<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Ekstrakurikuler;
use App\Models\KonsentrasiKeahlian;
use App\Models\MataPelajaran;
use App\Models\PengaturanSekolah;
use App\Models\ProgramKeahlian;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
        $requestedTab = $request->query('tab');

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
            'templateKokurikuler' => PengaturanSekolah::query()->value('template_kokurikuler'),
            'programKeahlians' => ProgramKeahlian::query()
                ->with('mataPelajaranRaporKelasX:id,kode_mapel,nama_mapel,kelompok_mapel')
                ->orderBy('nama_jurusan')
                ->get(['id', 'kode_jurusan', 'nama_jurusan'])
                ->map(fn (ProgramKeahlian $program): array => [
                    'id' => $program->id,
                    'kode_jurusan' => $program->kode_jurusan,
                    'nama_jurusan' => $program->nama_jurusan,
                    'mata_pelajaran_ids' => $program->mataPelajaranRaporKelasX->pluck('id')->all(),
                ]),
            'konsentrasiKeahlians' => KonsentrasiKeahlian::query()
                ->with([
                    'programKeahlian:id,nama_jurusan',
                    'mataPelajarans:id,kode_mapel,nama_mapel,kelompok_mapel',
                ])
                ->orderBy('nama_konsentrasi')
                ->get(['id', 'program_keahlian_id', 'kode_konsentrasi', 'nama_konsentrasi'])
                ->map(fn (KonsentrasiKeahlian $konsentrasi): array => [
                    'id' => $konsentrasi->id,
                    'kode_konsentrasi' => $konsentrasi->kode_konsentrasi,
                    'nama_konsentrasi' => $konsentrasi->nama_konsentrasi,
                    'program_keahlian' => $konsentrasi->programKeahlian?->nama_jurusan,
                    'mata_pelajaran_ids' => $konsentrasi->mataPelajarans->pluck('id')->all(),
                ]),
            'mapelOptions' => MataPelajaran::query()
                ->orderBy('nama_mapel')
                ->get(['id', 'kode_mapel', 'nama_mapel', 'kelompok_mapel']),
            'activeTab' => in_array($requestedTab, ['ekstrakurikuler', 'kokurikuler', 'urutan-rapor'], true)
                ? $requestedTab
                : 'mapel',
        ]);
    }

    public function updateConcentrationReportSubjects(
        Request $request,
        KonsentrasiKeahlian $konsentrasiKeahlian,
    ): RedirectResponse {
        return $this->syncReportSubjects(
            $request,
            $konsentrasiKeahlian->mataPelajarans(),
            'Mata pelajaran rapor berhasil disimpan untuk konsentrasi keahlian.',
        );
    }

    public function updateProgramClassXReportSubjects(
        Request $request,
        ProgramKeahlian $programKeahlian,
    ): RedirectResponse {
        return $this->syncReportSubjects(
            $request,
            $programKeahlian->mataPelajaranRaporKelasX(),
            'Mata pelajaran rapor kelas X berhasil disimpan untuk program keahlian.',
        );
    }

    private function syncReportSubjects(
        Request $request,
        BelongsToMany $subjects,
        string $successMessage,
    ): RedirectResponse {
        $validated = $request->validate([
            'mapel_ids' => ['required', 'array', 'min:1'],
            'mapel_ids.*' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('mata_pelajarans', 'id'),
            ],
        ], [
            'mapel_ids.required' => 'Pilih setidaknya satu mata pelajaran untuk rapor.',
            'mapel_ids.min' => 'Pilih setidaknya satu mata pelajaran untuk rapor.',
            'mapel_ids.*.distinct' => 'Mata pelajaran tidak boleh dipilih lebih dari satu kali.',
            'mapel_ids.*.exists' => 'Salah satu mata pelajaran yang dipilih tidak tersedia.',
        ]);

        $pivotData = collect($validated['mapel_ids'])
            ->mapWithKeys(fn (int|string $mapelId, int $index): array => [
                (int) $mapelId => ['urutan' => $index + 1],
            ])
            ->all();

        DB::transaction(function () use ($subjects, $pivotData): void {
            $subjects->sync($pivotData);
        });

        return to_route('admin.mapel.index', ['tab' => 'urutan-rapor'])
            ->with('success', $successMessage);
    }

    public function updateKokurikulerTemplate(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'template_kokurikuler' => ['present', 'nullable', 'string', 'max:5000'],
        ], [
            'template_kokurikuler.present' => 'Kolom templat kokurikuler wajib dikirim.',
            'template_kokurikuler.max' => 'Templat deskripsi kokurikuler tidak boleh lebih dari 5000 karakter.',
        ]);

        PengaturanSekolah::query()->findOrFail(1)->update($validated);

        return to_route('admin.mapel.index', ['tab' => 'kokurikuler'])
            ->with('success', 'Templat deskripsi kokurikuler berhasil diperbarui.');
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
        if (
            $mapel->jadwals()->exists()
            || $mapel->tugasMengajars()->exists()
            || $mapel->ujians()->exists()
            || $mapel->nilais()->exists()
            || $mapel->konsentrasiKeahlians()->exists()
            || $mapel->programKeahliansKelasX()->exists()
        ) {
            return back()->with('error', 'Mata pelajaran tidak dapat dihapus karena masih digunakan oleh jadwal, penugasan mengajar, ujian, nilai, atau pengaturan urutan rapor.');
        }

        $mapel->delete();

        return to_route('admin.mapel.index')
            ->with('success', 'Mata pelajaran berhasil dihapus.');
    }
}
