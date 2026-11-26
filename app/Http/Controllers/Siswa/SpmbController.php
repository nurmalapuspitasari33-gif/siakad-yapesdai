<?php

namespace App\Http\Controllers\Siswa;

use App\Http\Controllers\Controller;
use App\Models\KategoriBeasiswa;
use App\Models\PendaftaranSpmb;
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
        $pendaftaran = $request->user()->pendaftaranSpmbs()->latest()->first();
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
                'can_edit' => $pendaftaran->status_seleksi === 'pending',
                'has_berkas' => (bool) $pendaftaran->berkas_path,
                'program_keahlian_id' => $pendaftaran->program_keahlian_id,
                'konsentrasi_keahlian_id' => $pendaftaran->konsentrasi_keahlian_id,
            ] : null,
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

    public function store(Request $request): RedirectResponse
    {
        $siswa = $this->candidate($request);
        $initialPendaftaran = $request->user()->pendaftaranSpmbs()->latest()->first();

        if (! $request->filled('sekolah_asal') && $request->filled('asal_sekolah')) {
            $request->merge(['sekolah_asal' => $request->input('asal_sekolah')]);
        }

        $identityRules = StudentIdentity::rules($siswa);
        unset($identityRules['sekolah_asal']);

        $validated = $request->validate([
            'nik' => StudentIdentity::nikRules($request->user()),
            'sekolah_asal' => ['required', 'string', 'max:255'],
            'no_wa_wali' => ['required', 'string', 'max:30'],
            'berkas' => [
                $initialPendaftaran?->berkas_path ? 'nullable' : 'required',
                'file',
                'mimes:pdf,jpg,jpeg',
                'max:5120',
            ],
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
            'berkas.required' => 'Berkas persyaratan wajib diunggah.',
            'berkas.mimes' => 'Berkas harus berupa PDF atau JPG.',
            'berkas.max' => 'Ukuran berkas maksimal 5 MB.',
        ]);

        $newBerkasPath = $request->file('berkas')?->store('berkas-spmb', 'public');
        $newPhotoPath = $request->file('foto_siswa')?->store('foto-siswa', 'public');

        if ($request->hasFile('berkas') && ! is_string($newBerkasPath)) {
            return back()->with('error', 'Berkas gagal disimpan. Silakan coba kembali.');
        }

        if ($request->hasFile('foto_siswa') && ! is_string($newPhotoPath)) {
            return back()->with('error', 'Pas foto gagal disimpan. Silakan coba kembali.');
        }

        try {
            [$oldBerkasPath, $oldPhotoPath] = DB::transaction(function () use (
                $request,
                $initialPendaftaran,
                $validated,
                $newBerkasPath,
                $newPhotoPath,
            ): array {
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

                if (! $pendaftaran?->berkas_path && ! is_string($newBerkasPath)) {
                    throw ValidationException::withMessages([
                        'berkas' => 'Berkas persyaratan wajib diunggah.',
                    ]);
                }

                $oldBerkasPath = $pendaftaran?->berkas_path;
                $oldPhotoPath = $pendaftaran?->foto_siswa_path ?? $siswa->foto_siswa_path;
                $attributes = [
                    'asal_sekolah' => $validated['sekolah_asal'],
                    'program_keahlian_id' => $validated['program_keahlian_id'] ?? null,
                    'konsentrasi_keahlian_id' => $validated['konsentrasi_keahlian_id'] ?? null,
                    ...StudentIdentity::attributes($validated),
                ];

                if (is_string($newBerkasPath)) {
                    $attributes['berkas_path'] = $newBerkasPath;
                }

                if (is_string($newPhotoPath)) {
                    $attributes['foto_siswa_path'] = $newPhotoPath;
                }

                if ($pendaftaran) {
                    $pendaftaran->update($attributes);
                } else {
                    PendaftaranSpmb::create([
                        ...$attributes,
                        'user_id' => $user->id,
                        'no_pendaftaran' => PendaftaranSpmb::generateNoPendaftaran(),
                        'status_seleksi' => 'pending',
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

                return [$oldBerkasPath, $oldPhotoPath];
            });
        } catch (Throwable $exception) {
            foreach ([$newBerkasPath, $newPhotoPath] as $newPath) {
                if (is_string($newPath) && ! Storage::disk('public')->delete($newPath)) {
                    Log::warning('Berkas SPMB baru gagal dibersihkan setelah transaksi gagal.', [
                        'user_id' => $request->user()->id,
                        'path' => $newPath,
                    ]);
                }
            }

            throw $exception;
        }

        if ($oldBerkasPath && is_string($newBerkasPath) && ! Storage::disk('public')->delete($oldBerkasPath)) {
            Log::warning('Berkas SPMB lama gagal dihapus setelah penggantian.', [
                'user_id' => $request->user()->id,
                'path' => $oldBerkasPath,
            ]);
        }

        if ($oldPhotoPath && is_string($newPhotoPath) && ! Storage::disk('public')->delete($oldPhotoPath)) {
            Log::warning('Pas foto lama gagal dihapus setelah penggantian.', [
                'user_id' => $request->user()->id,
                'path' => $oldPhotoPath,
            ]);
        }

        return to_route('siswa.spmb.index')->with('success', 'Biodata SPMB berhasil disimpan.');
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
