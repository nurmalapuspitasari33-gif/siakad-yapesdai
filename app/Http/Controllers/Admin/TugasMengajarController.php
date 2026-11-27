<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use App\Models\MataPelajaran;
use App\Models\TahunAjaran;
use App\Models\TugasMengajar;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class TugasMengajarController extends Controller
{
    public function index(): Response
    {
        $tahunAjaranAktif = TahunAjaran::query()->where('is_aktif', true)->first();

        $tugasMengajars = TugasMengajar::query()
            ->when($tahunAjaranAktif, fn ($query) => $query->where('tahun_ajaran_id', $tahunAjaranAktif->id))
            ->when(! $tahunAjaranAktif, fn ($query) => $query->whereRaw('1 = 0'))
            ->with([
                'guru:id,nama_lengkap',
                'kelas:id,nama_kelas',
                'mataPelajaran:id,kode_mapel,nama_mapel',
            ])
            ->withSum('jadwals', 'jumlah_jp')
            ->orderBy('kelas_id')
            ->orderBy('mapel_id')
            ->orderBy('guru_id')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (TugasMengajar $tugasMengajar): array => [
                'id' => $tugasMengajar->id,
                'guru' => $tugasMengajar->guru,
                'kelas' => $tugasMengajar->kelas,
                'mata_pelajaran' => $tugasMengajar->mataPelajaran,
                'jp_per_minggu' => $tugasMengajar->jp_per_minggu,
                'jp_terjadwal' => (int) ($tugasMengajar->jadwals_sum_jumlah_jp ?? 0),
            ]);

        return Inertia::render('Admin/TugasMengajar/Index', [
            'tugasMengajars' => $tugasMengajars,
            'guruOptions' => Guru::query()->orderBy('nama_lengkap')->get(['id', 'nama_lengkap']),
            'kelasOptions' => $tahunAjaranAktif
                ? $tahunAjaranAktif->kelas()->orderBy('nama_kelas')->get(['id', 'nama_kelas'])
                : [],
            'mapelOptions' => MataPelajaran::query()
                ->orderBy('nama_mapel')
                ->get(['id', 'kode_mapel', 'nama_mapel']),
            'tahunAjaranAktif' => $tahunAjaranAktif
                ? [
                    'id' => $tahunAjaranAktif->id,
                    'nama_tahun' => $tahunAjaranAktif->nama_tahun,
                    'semester' => $tahunAjaranAktif->semester,
                ]
                : null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $tahunAjaranAktif = TahunAjaran::query()->where('is_aktif', true)->first();

        if (! $tahunAjaranAktif) {
            return back()->with('error', 'Aktifkan tahun ajaran sebelum menambahkan tugas mengajar.');
        }

        $validated = $this->validatedTugasMengajar($request, $tahunAjaranAktif);

        TugasMengajar::create([
            ...$validated,
            'tahun_ajaran_id' => $tahunAjaranAktif->id,
        ]);

        return to_route('admin.tugas-mengajar.index')->with('success', 'Tugas mengajar berhasil ditambahkan.');
    }

    public function update(Request $request, TugasMengajar $tugasMengajar): RedirectResponse
    {
        $tahunAjaranAktif = TahunAjaran::query()->where('is_aktif', true)->first();
        abort_unless(
            $tahunAjaranAktif && (int) $tugasMengajar->tahun_ajaran_id === (int) $tahunAjaranAktif->id,
            404,
        );

        $validated = $this->validatedTugasMengajar($request, $tahunAjaranAktif, $tugasMengajar);

        DB::transaction(function () use ($validated, $tugasMengajar): void {
            $lockedTugasMengajar = TugasMengajar::query()
                ->whereKey($tugasMengajar->id)
                ->lockForUpdate()
                ->firstOrFail();
            $hasJadwals = $lockedTugasMengajar->jadwals()->exists();

            if (
                $hasJadwals
                && (
                    (int) $validated['guru_id'] !== (int) $lockedTugasMengajar->guru_id
                    || (int) $validated['kelas_id'] !== (int) $lockedTugasMengajar->kelas_id
                    || (int) $validated['mapel_id'] !== (int) $lockedTugasMengajar->mapel_id
                )
            ) {
                throw ValidationException::withMessages([
                    'kelas_id' => 'Guru, kelas, dan mata pelajaran tidak dapat diubah setelah penugasan dipakai pada jadwal.',
                ]);
            }

            $scheduledJp = $lockedTugasMengajar->jadwals()->sum('jumlah_jp');

            if ($scheduledJp > $validated['jp_per_minggu']) {
                throw ValidationException::withMessages([
                    'jp_per_minggu' => 'Target JP tidak boleh lebih kecil dari JP yang sudah dijadwalkan.',
                ]);
            }

            $lockedTugasMengajar->update($validated);
        });

        return to_route('admin.tugas-mengajar.index')->with('success', 'Tugas mengajar berhasil diperbarui.');
    }

    public function destroy(TugasMengajar $tugasMengajar): RedirectResponse
    {
        $tahunAjaranAktif = TahunAjaran::query()->where('is_aktif', true)->first();
        abort_unless(
            $tahunAjaranAktif && (int) $tugasMengajar->tahun_ajaran_id === (int) $tahunAjaranAktif->id,
            404,
        );

        $hasJadwals = DB::transaction(function () use ($tugasMengajar): bool {
            $lockedTugasMengajar = TugasMengajar::query()
                ->whereKey($tugasMengajar->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedTugasMengajar->jadwals()->exists()) {
                return true;
            }

            $lockedTugasMengajar->delete();

            return false;
        });

        if ($hasJadwals) {
            return back()->with('error', 'Penugasan tidak dapat dihapus karena sudah digunakan oleh jadwal.');
        }

        return to_route('admin.tugas-mengajar.index')->with('success', 'Tugas mengajar berhasil dihapus.');
    }

    /**
     * @return array{guru_id: int, kelas_id: int, mapel_id: int, jp_per_minggu: int}
     */
    private function validatedTugasMengajar(
        Request $request,
        TahunAjaran $tahunAjaran,
        ?TugasMengajar $tugasMengajar = null,
    ): array {
        $uniqueMapelRule = Rule::unique('tugas_mengajars', 'mapel_id')
            ->where('tahun_ajaran_id', $tahunAjaran->id)
            ->where('guru_id', $request->integer('guru_id'))
            ->where('kelas_id', $request->integer('kelas_id'));

        if ($tugasMengajar) {
            $uniqueMapelRule->ignore($tugasMengajar);
        }

        $validated = $request->validate([
            'guru_id' => ['required', 'integer', Rule::exists('gurus', 'id')],
            'kelas_id' => [
                'required',
                'integer',
                Rule::exists('kelas', 'id')->where('tahun_ajaran_id', $tahunAjaran->id),
            ],
            'mapel_id' => ['required', 'integer', Rule::exists('mata_pelajarans', 'id'), $uniqueMapelRule],
            'jp_per_minggu' => ['required', 'integer', 'min:1', 'max:255'],
        ], [
            'kelas_id.exists' => 'Pilih kelas pada tahun ajaran aktif.',
            'mapel_id.exists' => 'Mata pelajaran yang dipilih tidak ditemukan.',
            'mapel_id.unique' => 'Kombinasi guru, kelas, dan mata pelajaran tersebut sudah terdaftar.',
            'jp_per_minggu.required' => 'Target JP per minggu wajib diisi.',
            'jp_per_minggu.integer' => 'Target JP harus berupa bilangan bulat.',
            'jp_per_minggu.min' => 'Target JP minimal satu.',
            'jp_per_minggu.max' => 'Target JP maksimal 255.',
        ]);

        return [
            'guru_id' => (int) $validated['guru_id'],
            'kelas_id' => (int) $validated['kelas_id'],
            'mapel_id' => (int) $validated['mapel_id'],
            'jp_per_minggu' => (int) $validated['jp_per_minggu'],
        ];
    }
}
