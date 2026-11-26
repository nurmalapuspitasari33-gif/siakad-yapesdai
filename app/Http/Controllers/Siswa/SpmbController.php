<?php

namespace App\Http\Controllers\Siswa;

use App\Http\Controllers\Controller;
use App\Models\KategoriBeasiswa;
use App\Models\GelombangSpmb;
use App\Models\PendaftaranSpmb;
use App\Models\PendaftaranSpmbBerkas;
use App\Models\ProgramKeahlian;
use App\Models\Siswa;
use App\Models\User;
use App\Support\StudentIdentity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class SpmbController extends Controller
{
    public function index(Request $request): Response
    {
        $siswa = $this->candidate($request);
        $pendaftaran = $request->user()->pendaftaranSpmbs()->with('berkas')->latest()->first();
        $identity = [];

        foreach (StudentIdentity::PROFILE_FIELDS as $field) {
            $identity[$field] = $pendaftaran?->{$field} ?? $siswa->{$field};
        }

        return Inertia::render('Siswa/Spmb/Index', [
            'nik' => $request->user()->nik,
            'siswa' => [
                'nama_lengkap' => $siswa->nama_lengkap,
                'no_wa_wali' => $siswa->no_wa_wali,
                'program_keahlian_id' => $siswa->program_keahlian_id,
                'konsentrasi_keahlian_id' => $siswa->konsentrasi_keahlian_id,
                ...$identity,
            ],
            'pendaftaran' => $pendaftaran ? [
                'no_pendaftaran' => $pendaftaran->no_pendaftaran,
                'asal_sekolah' => $pendaftaran->sekolah_asal ?? $pendaftaran->asal_sekolah,
                'status_seleksi' => $pendaftaran->status_seleksi,
                'gelombang' => $pendaftaran->gelombangSpmb?->nama_gelombang,
                'can_edit' => $pendaftaran->status_seleksi === 'pending',
                'has_berkas' => (bool) ($pendaftaran->berkas_path || $pendaftaran->berkas->isNotEmpty()),
                'berkas' => $pendaftaran->berkas->map(fn (PendaftaranSpmbBerkas $berkas): array => [
                    'id' => $berkas->id,
                    'caption' => $berkas->caption,
                    'url' => Storage::disk('public')->url($berkas->path),
                ]),
                'program_keahlian_id' => $pendaftaran->program_keahlian_id,
                'konsentrasi_keahlian_id' => $pendaftaran->konsentrasi_keahlian_id,
            ] : null,
            'uploadedDocuments' => $pendaftaran?->berkas->map(fn (PendaftaranSpmbBerkas $berkas): array => [
                'id' => $berkas->id,
                'caption' => $berkas->caption,
                'url' => Storage::disk('public')->url($berkas->path),
            ])->values() ?? collect(),
            'documentCount' => $pendaftaran?->berkas->count() ?? 0,
            'programKeahlians' => ProgramKeahlian::query()
                ->with('konsentrasiKeahlians:id,program_keahlian_id,kode_konsentrasi,nama_konsentrasi')
                ->orderBy('nama_jurusan')
                ->get(['id', 'kode_jurusan', 'nama_jurusan']),
            'kategoriBeasiswas' => KategoriBeasiswa::query()->orderBy('nama_beasiswa')->get([
                'id',
                'nama_beasiswa',
                'jenis_potongan',
                'nilai_potongan',
                'is_afirmasi',
            ]),
            'fotoSiswaUrl' => $pendaftaran?->foto_siswa_path || $siswa->foto_siswa_path
                ? Storage::disk('public')->url($pendaftaran?->foto_siswa_path ?? $siswa->foto_siswa_path)
                : null,
            'berkasUrl' => $pendaftaran?->berkas_path
                ? route('siswa.spmb.berkas')
                : null,
        ]);
    }

    public function print(Request $request): Response
    {
        $user = $request->user();
        $pendaftaran = $user->pendaftaranSpmbs()
            ->with(['programKeahlian:id,nama_jurusan', 'konsentrasiKeahlian:id,nama_konsentrasi', 'kategoriBeasiswa:id,nama_beasiswa', 'berkas'])
            ->latest()
            ->firstOrFail();
        $siswa = $user->siswa;

        return Inertia::render('Siswa/Spmb/Print', [
            'pendaftaran' => [
                'nomor' => $pendaftaran->no_pendaftaran,
                'tanggal_daftar' => $pendaftaran->created_at?->format('d-m-Y'),
                'jalur' => $pendaftaran->kategoriBeasiswa?->nama_beasiswa
                    ?? str($pendaftaran->tipe_program)->replace('_', ' ')->title()->toString(),
                'status_seleksi' => $pendaftaran->status_seleksi,
                'nik' => $user->nik,
                'nama_lengkap' => $siswa?->nama_lengkap ?? $user->name,
                'tempat_lahir' => $pendaftaran->tempat_lahir,
                'tanggal_lahir' => $pendaftaran->tanggal_lahir?->format('d-m-Y'),
                'jenis_kelamin' => $pendaftaran->jenis_kelamin === 'L'
                    ? 'Laki-laki'
                    : ($pendaftaran->jenis_kelamin === 'P' ? 'Perempuan' : null),
                'alamat' => $pendaftaran->alamat_murid,
                'no_hp' => $user->no_wa ?: ($siswa?->no_wa_wali ?? $pendaftaran->telepon_rumah),
                'sekolah_asal' => $pendaftaran->sekolah_asal ?? $pendaftaran->asal_sekolah,
                'program_keahlian' => $pendaftaran->programKeahlian?->nama_jurusan,
                'konsentrasi_keahlian' => $pendaftaran->konsentrasiKeahlian?->nama_konsentrasi,
                'nama_ayah' => $pendaftaran->nama_ayah,
                'nama_ibu' => $pendaftaran->nama_ibu,
                'nama_wali' => $pendaftaran->nama_wali,
                'telepon_ortu' => $pendaftaran->telepon_ortu,
                'telepon_wali' => $pendaftaran->telepon_wali,
                'foto_siswa_url' => $pendaftaran->foto_siswa_path
                    ? Storage::disk('public')->url($pendaftaran->foto_siswa_path)
                    : null,
                'berkas' => $pendaftaran->berkas->map(fn (PendaftaranSpmbBerkas $berkas): array => [
                    'caption' => $berkas->caption,
                    'uploaded' => Storage::disk('public')->exists($berkas->path),
                ])->values(),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $siswa = $this->candidate($request);
        $initialPendaftaran = $request->user()->pendaftaranSpmbs()->latest()->first();

        if (! $request->filled('sekolah_asal') && $request->filled('asal_sekolah')) {
            $request->merge(['sekolah_asal' => $request->input('asal_sekolah')]);
        }

        $identityRules = StudentIdentity::rules($siswa);
        unset($identityRules['sekolah_asal']);
        $hasExistingDocuments = (bool) (
            $initialPendaftaran?->berkas_path
            || $initialPendaftaran?->berkas()->exists()
        );

        $validated = $request->validate([
            'nik' => StudentIdentity::nikRules($request->user()),
            'sekolah_asal' => ['required', 'string', 'max:255'],
            'no_wa_wali' => ['required', 'string', 'max:30'],
            'foto_berkas' => [Rule::requiredIf(! $hasExistingDocuments), 'array', 'max:20'],
            'foto_berkas.*' => ['required', 'image', 'mimes:jpg,jpeg', 'max:5120'],
            'foto_keterangan' => ['nullable', 'array', 'max:20'],
            'foto_keterangan.*' => ['nullable', 'string', 'max:255'],
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
            ...$identityRules,
        ], [
            'sekolah_asal.required' => 'Asal sekolah wajib diisi.',
            'no_wa_wali.required' => 'Nomor WhatsApp wali wajib diisi.',
            'foto_berkas.required' => 'Unggah minimal satu foto berkas persyaratan.',
            'foto_berkas.array' => 'Pilih berkas foto yang valid.',
            'foto_berkas.max' => 'Maksimal 20 foto berkas dapat diunggah.',
            'foto_berkas.*.image' => 'Berkas persyaratan harus berupa foto.',
            'foto_berkas.*.mimes' => 'Foto berkas harus berformat JPG atau JPEG.',
            'foto_berkas.*.max' => 'Ukuran setiap foto maksimal 5 MB.',
        ]);

        $newPhotoPath = $request->file('foto_siswa')?->store('foto-siswa', 'public');
        if ($request->hasFile('foto_siswa') && ! is_string($newPhotoPath)) {
            return back()->with('error', 'Pas foto gagal disimpan. Silakan coba kembali.');
        }

        $newDocumentPaths = [];

        try {
            foreach ($request->file('foto_berkas', []) as $index => $uploadedPhoto) {
                $path = $uploadedPhoto->store('berkas-spmb/foto', 'public');

                if (! is_string($path)) {
                    throw new \RuntimeException('Foto berkas SPMB gagal disimpan.');
                }

                $newDocumentPaths[] = [
                    'path' => $path,
                    'caption' => $validated['foto_keterangan'][$index] ?? $uploadedPhoto->getClientOriginalName(),
                ];
            }

            $oldPhotoPath = DB::transaction(function () use (
                $request,
                $initialPendaftaran,
                $validated,
                $newPhotoPath,
                $newDocumentPaths,
            ): ?string {
                $pendaftaran = $initialPendaftaran
                    ? PendaftaranSpmb::query()->lockForUpdate()->findOrFail($initialPendaftaran->id)
                    : null;
                $user = User::query()->lockForUpdate()->findOrFail($request->user()->id);
                $siswa = Siswa::query()
                    ->where('user_id', $user->id)
                    ->lockForUpdate()
                    ->firstOrFail();
                abort_unless($siswa->status_siswa === 'calon_spmb', 404);

                if (! $initialPendaftaran) {
                    $pendaftaran = $user->pendaftaranSpmbs()
                        ->latest()
                        ->lockForUpdate()
                        ->first();
                }

                abort_unless(! $pendaftaran || $pendaftaran->status_seleksi === 'pending', 403);

                $existingDocumentCount = $pendaftaran?->berkas()->count() ?? 0;

                if ($existingDocumentCount + count($newDocumentPaths) > 20) {
                    throw ValidationException::withMessages([
                        'foto_berkas' => 'Jumlah keseluruhan foto berkas tidak boleh lebih dari 20.',
                    ]);
                }

                if (! $pendaftaran && $newDocumentPaths === []) {
                    throw ValidationException::withMessages([
                        'foto_berkas' => 'Unggah minimal satu foto berkas persyaratan.',
                    ]);
                }

                $oldPhotoPath = $pendaftaran?->foto_siswa_path ?? $siswa->foto_siswa_path;
                $attributes = [
                    'asal_sekolah' => $validated['sekolah_asal'],
                    'program_keahlian_id' => $validated['program_keahlian_id'] ?? null,
                    'konsentrasi_keahlian_id' => $validated['konsentrasi_keahlian_id'] ?? null,
                    ...StudentIdentity::attributes($validated),
                ];

                if (is_string($newPhotoPath)) {
                    $attributes['foto_siswa_path'] = $newPhotoPath;
                }

                if ($pendaftaran) {
                    $pendaftaran->update($attributes);
                } else {
                    $wave = GelombangSpmb::query()->open()->lockForUpdate()->first();
                    abort_if(! $wave, 403, 'Pendaftaran SPMB sedang ditutup.');

                    $pendaftaran = PendaftaranSpmb::create([
                        ...$attributes,
                        'user_id' => $user->id,
                        'gelombang_spmb_id' => $wave->id,
                        'no_pendaftaran' => PendaftaranSpmb::generateNoPendaftaran(),
                        'status_seleksi' => 'pending',
                    ]);
                }

                foreach ($newDocumentPaths as $sortOrder => $document) {
                    $pendaftaran->berkas()->create([
                        ...$document,
                        'sort_order' => $existingDocumentCount + $sortOrder,
                    ]);
                }

                $user->update(['nik' => $validated['nik']]);
                $siswa->update([
                    'no_wa_wali' => $validated['no_wa_wali'],
                    'program_keahlian_id' => $validated['program_keahlian_id'] ?? null,
                    'konsentrasi_keahlian_id' => $validated['konsentrasi_keahlian_id'] ?? null,
                    ...StudentIdentity::attributes($validated),
                    ...(is_string($newPhotoPath) ? ['foto_siswa_path' => $newPhotoPath] : []),
                ]);

                return $oldPhotoPath;
            });
        } catch (Throwable $exception) {
            $newPaths = [
                $newPhotoPath,
                ...array_column($newDocumentPaths, 'path'),
            ];

            foreach ($newPaths as $newPath) {
                if (is_string($newPath) && ! Storage::disk('public')->delete($newPath)) {
                    Log::warning('Berkas SPMB baru gagal dibersihkan setelah transaksi gagal.', [
                        'user_id' => $request->user()->id,
                        'path' => $newPath,
                    ]);
                }
            }

            throw $exception;
        }

        if ($oldPhotoPath && is_string($newPhotoPath) && ! Storage::disk('public')->delete($oldPhotoPath)) {
            Log::warning('Pas foto lama gagal dihapus setelah penggantian.', [
                'user_id' => $request->user()->id,
                'path' => $oldPhotoPath,
            ]);
        }

        return to_route('siswa.spmb.index')->with('success', 'Biodata SPMB berhasil disimpan.');
    }

    public function destroyDocument(Request $request, PendaftaranSpmbBerkas $berkas): RedirectResponse
    {
        $this->candidate($request);
        $path = DB::transaction(function () use ($request, $berkas): string {
            $pendaftaran = $request->user()->pendaftaranSpmbs()
                ->whereKey($berkas->pendaftaran_spmb_id)
                ->lockForUpdate()
                ->firstOrFail();
            abort_unless($pendaftaran->status_seleksi === 'pending', 403);

            $lockedDocument = PendaftaranSpmbBerkas::query()
                ->where('pendaftaran_spmb_id', $pendaftaran->id)
                ->lockForUpdate()
                ->findOrFail($berkas->id);
            $lockedDocument->delete();

            return $lockedDocument->path;
        });

        if (
            Storage::disk('public')->exists($path)
            && ! Storage::disk('public')->delete($path)
        ) {
            Log::warning('Foto berkas SPMB gagal dihapus dari penyimpanan.', [
                'user_id' => $request->user()->id,
                'path' => $path,
            ]);
        }

        return back()->with('success', 'Foto berkas persyaratan berhasil dihapus.');
    }

    public function download(Request $request): StreamedResponse
    {
        $this->candidate($request);
        $pendaftaran = $request->user()->pendaftaranSpmbs()->latest()->first();
        abort_unless($pendaftaran?->berkas_path && Storage::disk('public')->exists($pendaftaran->berkas_path), 404);

        return Storage::disk('public')->download($pendaftaran->berkas_path);
    }

    private function candidate(Request $request): Siswa
    {
        $siswa = $request->user()->siswa;
        abort_unless($siswa && $siswa->status_siswa === 'calon_spmb', 404);

        return $siswa;
    }
}
