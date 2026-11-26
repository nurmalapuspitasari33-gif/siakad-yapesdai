<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KategoriBeasiswa;
use App\Models\Kelas;
use App\Models\PendaftaranSpmb;
use App\Models\ProgramKeahlian;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Support\StudentIdentity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SpmbController extends Controller
{
    public function index(Request $request): Response
    {
        $tahunAjaranAktif = TahunAjaran::query()->where('is_aktif', true)->first();
        $filters = $request->validate([
            'program_keahlian_id' => ['nullable', 'integer', Rule::exists('program_keahlians', 'id')],
            'konsentrasi_keahlian_id' => [
                'nullable',
                'integer',
                Rule::exists('konsentrasi_keahlians', 'id')
                    ->where('program_keahlian_id', $request->input('program_keahlian_id')),
            ],
            'status_seleksi' => ['nullable', Rule::in(['pending', 'diterima', 'ditolak'])],
        ]);
        $query = PendaftaranSpmb::query()
            ->when(
                $filters['program_keahlian_id'] ?? null,
                fn ($query, $id) => $query->where('program_keahlian_id', $id),
            )
            ->when(
                $filters['konsentrasi_keahlian_id'] ?? null,
                fn ($query, $id) => $query->where('konsentrasi_keahlian_id', $id),
            )
            ->when(
                $filters['status_seleksi'] ?? null,
                fn ($query, $status) => $query->where('status_seleksi', $status),
            );
        $pendaftarans = (clone $query)
            ->with([
                'user:id,name,email,nik',
                'user.siswa',
                'user.siswa.kelas:id,nama_kelas',
                'user.siswa.kategoriBeasiswa:id,nama_beasiswa,is_afirmasi',
                'kategoriBeasiswa:id,nama_beasiswa,is_afirmasi',
                'programKeahlian:id,kode_jurusan,nama_jurusan',
                'konsentrasiKeahlian:id,program_keahlian_id,kode_konsentrasi,nama_konsentrasi',
            ])
            ->orderByDesc('created_at')
            ->paginate(10)
            ->withQueryString();
        $pendaftarans->getCollection()->each(
            static fn (PendaftaranSpmb $pendaftaran) => $pendaftaran->user?->makeVisible('nik'),
        );
        $printPendaftarans = (clone $query)
            ->with([
                'user:id,name',
                'user.siswa:id,user_id,nama_lengkap,nisn',
                'programKeahlian:id,nama_jurusan',
                'konsentrasiKeahlian:id,nama_konsentrasi',
            ])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (PendaftaranSpmb $pendaftaran): array => [
                'no_pendaftaran' => $pendaftaran->no_pendaftaran,
                'nama_lengkap' => $pendaftaran->user?->siswa?->nama_lengkap ?? $pendaftaran->user?->name,
                'nisn' => $pendaftaran->user?->siswa?->nisn,
                'asal_sekolah' => $pendaftaran->sekolah_asal ?? $pendaftaran->asal_sekolah,
                'program_keahlian' => $pendaftaran->programKeahlian?->nama_jurusan,
                'konsentrasi_keahlian' => $pendaftaran->konsentrasiKeahlian?->nama_konsentrasi,
                'tipe_program' => $pendaftaran->tipe_program,
                'status_seleksi' => $pendaftaran->status_seleksi,
            ])
            ->values();

        return Inertia::render('Admin/Spmb/Index', [
            'pendaftarans' => $pendaftarans,
            'openPendaftaranId' => $request->integer('open') ?: null,
            'printPendaftarans' => $printPendaftarans,
            'filters' => [
                'program_keahlian_id' => (string) ($filters['program_keahlian_id'] ?? ''),
                'konsentrasi_keahlian_id' => (string) ($filters['konsentrasi_keahlian_id'] ?? ''),
                'status_seleksi' => $filters['status_seleksi'] ?? '',
            ],
            'programKeahlians' => ProgramKeahlian::query()
                ->with('konsentrasiKeahlians:id,program_keahlian_id,nama_konsentrasi')
                ->orderBy('nama_jurusan')
                ->get(['id', 'kode_jurusan', 'nama_jurusan']),
            'kategoriBeasiswas' => KategoriBeasiswa::query()
                ->orderBy('nama_beasiswa')
                ->get(['id', 'nama_beasiswa']),
            'fotoSiswaUrls' => $pendaftarans->getCollection()->mapWithKeys(
                fn (PendaftaranSpmb $pendaftaran): array => [
                    $pendaftaran->id => $pendaftaran->foto_siswa_path
                        ? Storage::disk('public')->url($pendaftaran->foto_siswa_path)
                        : null,
                ],
            ),
            'kelasOptions' => $tahunAjaranAktif
                ? $tahunAjaranAktif->kelas()
                    ->orderBy('nama_kelas')
                    ->get(['id', 'nama_kelas', 'program_keahlian_id', 'konsentrasi_keahlian_id'])
                : [],
            'tahunAjaranAktif' => $tahunAjaranAktif
                ? [
                    'nama_tahun' => $tahunAjaranAktif->nama_tahun,
                    'semester' => $tahunAjaranAktif->semester,
                ]
                : null,
        ]);
    }

    public function update(Request $request, PendaftaranSpmb $spmb): RedirectResponse
    {
        if (! $request->filled('sekolah_asal') && $request->filled('asal_sekolah')) {
            $request->merge(['sekolah_asal' => $request->input('asal_sekolah')]);
        }

        $siswa = $spmb->user?->siswa;
        $validated = $request->validate([
            ...StudentIdentity::rules($siswa),
            'nama_lengkap' => ['required', 'string', 'max:255'],
            'nisn' => [
                'required',
                'string',
                'max:255',
                Rule::unique('siswas', 'nisn')->ignore($siswa?->id),
            ],
            'sekolah_asal' => ['required', 'string', 'max:255'],
            'no_wa_wali' => ['required', 'string', 'max:30'],
            'program_keahlian_id' => [
                'nullable',
                'integer',
                'required_with:konsentrasi_keahlian_id',
                Rule::exists('program_keahlians', 'id'),
            ],
            'konsentrasi_keahlian_id' => [
                'nullable',
                'integer',
                'required_with:program_keahlian_id',
                Rule::exists('konsentrasi_keahlians', 'id')
                    ->where('program_keahlian_id', $request->input('program_keahlian_id')),
            ],
        ], [
            'nama_lengkap.required' => 'Nama lengkap wajib diisi.',
            'nisn.required' => 'NISN wajib diisi.',
            'nisn.unique' => 'NISN sudah digunakan.',
            'sekolah_asal.required' => 'Asal sekolah wajib diisi.',
            'no_wa_wali.required' => 'Nomor WhatsApp wali wajib diisi.',
        ]);

        DB::transaction(function () use ($spmb, $validated): void {
            $pendaftaran = PendaftaranSpmb::query()->lockForUpdate()->findOrFail($spmb->id);
            $user = $pendaftaran->user()->lockForUpdate()->firstOrFail();
            $siswa = Siswa::query()
                ->where('user_id', $user->id)
                ->lockForUpdate()
                ->firstOrFail();
            $profileAttributes = StudentIdentity::attributes($validated);
            $programKeahlianId = $validated['program_keahlian_id'] ?? null;
            $konsentrasiKeahlianId = $validated['konsentrasi_keahlian_id'] ?? null;

            $pendaftaran->update([
                'asal_sekolah' => $validated['sekolah_asal'],
                'program_keahlian_id' => $programKeahlianId,
                'konsentrasi_keahlian_id' => $konsentrasiKeahlianId,
                ...$profileAttributes,
            ]);
            $siswa->update([
                'nisn' => $validated['nisn'],
                'nama_lengkap' => $validated['nama_lengkap'],
                'no_wa_wali' => $validated['no_wa_wali'],
                'program_keahlian_id' => $programKeahlianId,
                'konsentrasi_keahlian_id' => $konsentrasiKeahlianId,
                ...$profileAttributes,
                'sekolah_asal' => $validated['sekolah_asal'],
            ]);
            $user->update(['name' => $validated['nama_lengkap']]);
        });

        return to_route('admin.spmb.index')->with('success', 'Data pendaftar SPMB berhasil diperbarui.');
    }

    public function destroy(PendaftaranSpmb $spmb): RedirectResponse
    {
        $filePaths = DB::transaction(function () use ($spmb): array {
            $pendaftaran = PendaftaranSpmb::query()->lockForUpdate()->findOrFail($spmb->id);
            $user = $pendaftaran->user()->lockForUpdate()->first();
            $siswa = $user?->siswa()->lockForUpdate()->first();
            $filePaths = array_values(array_unique(array_filter([
                $pendaftaran->berkas_path,
                $pendaftaran->foto_siswa_path,
                $siswa?->foto_siswa_path,
            ])));

            if (! $user) {
                $pendaftaran->delete();
            } elseif (! $siswa || ($siswa->status_siswa === 'calon_spmb' && $siswa->kelas_id === null)) {
                $user->delete();
            } else {
                $pendaftaran->delete();
            }

            return $filePaths;
        });

        foreach ($filePaths as $filePath) {
            if (
                Storage::disk('public')->exists($filePath)
                && ! Storage::disk('public')->delete($filePath)
            ) {
                Log::warning('Berkas pendaftar SPMB gagal dihapus.', [
                    'pendaftaran_spmb_id' => $spmb->id,
                    'path' => $filePath,
                ]);
            }
        }

        return to_route('admin.spmb.index')->with('success', 'Data pendaftar SPMB berhasil dihapus.');
    }

    public function accept(Request $request, PendaftaranSpmb $spmb): RedirectResponse
    {
        abort_unless($spmb->status_seleksi === 'pending', 404);

        $tahunAjaranAktif = TahunAjaran::query()->where('is_aktif', true)->first();

        if (! $tahunAjaranAktif) {
            return back()->with('error', 'Aktifkan tahun ajaran sebelum menerima pendaftar.');
        }

        $kelasIdRule = Rule::exists('kelas', 'id')
            ->where('tahun_ajaran_id', $tahunAjaranAktif->id);

        if ($spmb->program_keahlian_id) {
            $kelasIdRule = $kelasIdRule
                ->where('program_keahlian_id', $spmb->program_keahlian_id)
                ->where('konsentrasi_keahlian_id', $spmb->konsentrasi_keahlian_id);
        }

        $validated = $request->validate([
            'kelas_id' => [
                'required',
                'integer',
                $kelasIdRule,
            ],
        ], [
            'kelas_id.required' => 'Kelas tujuan wajib dipilih.',
            'kelas_id.exists' => 'Kelas yang dipilih tidak sesuai dengan tahun ajaran dan pilihan keahlian pendaftar.',
        ]);

        DB::transaction(function () use ($spmb, $validated): void {
            $pendaftaran = PendaftaranSpmb::query()->lockForUpdate()->findOrFail($spmb->id);
            abort_unless($pendaftaran->status_seleksi === 'pending', 404);

            $siswa = Siswa::query()->where('user_id', $pendaftaran->user_id)->firstOrFail();
            abort_unless($siswa->status_siswa === 'calon_spmb', 404);
            $kelas = Kelas::query()->findOrFail($validated['kelas_id']);
            $tanggalDiterima = now()->toDateString();
            $studentIdentity = StudentIdentity::attributes($siswa->getAttributes());

            foreach (StudentIdentity::PROFILE_FIELDS as $field) {
                if ($pendaftaran->{$field} !== null) {
                    $studentIdentity[$field] = $pendaftaran->{$field};
                }
            }

            $studentIdentity['foto_siswa_path'] = $pendaftaran->foto_siswa_path ?? $siswa->foto_siswa_path;
            $studentIdentity['diterima_di_kelas'] = $kelas->nama_kelas;
            $studentIdentity['tanggal_diterima'] = $tanggalDiterima;

            $siswa->update([
                'kelas_id' => $validated['kelas_id'],
                'program_keahlian_id' => $pendaftaran->program_keahlian_id,
                'konsentrasi_keahlian_id' => $pendaftaran->konsentrasi_keahlian_id,
                'status_siswa' => 'aktif',
                ...$studentIdentity,
            ]);
            $pendaftaran->update([
                'status_seleksi' => 'diterima',
                'diterima_di_kelas' => $kelas->nama_kelas,
                'tanggal_diterima' => $tanggalDiterima,
            ]);
        });

        return to_route('admin.spmb.index')->with('success', 'Pendaftar berhasil diterima.');
    }

    public function reject(PendaftaranSpmb $spmb): RedirectResponse
    {
        abort_unless($spmb->status_seleksi === 'pending', 404);

        DB::transaction(function () use ($spmb): void {
            $pendaftaran = PendaftaranSpmb::query()->lockForUpdate()->findOrFail($spmb->id);
            abort_unless($pendaftaran->status_seleksi === 'pending', 404);
            $pendaftaran->update(['status_seleksi' => 'ditolak']);
        });

        return to_route('admin.spmb.index')->with('success', 'Status pendaftar berhasil diperbarui.');
    }

    public function download(PendaftaranSpmb $spmb): StreamedResponse
    {
        abort_unless($spmb->berkas_path && Storage::disk('public')->exists($spmb->berkas_path), 404);

        return Storage::disk('public')->download($spmb->berkas_path);
    }
}
