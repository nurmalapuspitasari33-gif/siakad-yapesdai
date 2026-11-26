<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\GelombangSpmb;
use App\Models\SpmbBanner;
use App\Models\SpmbContent;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class SpmbCmsController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/SpmbCms/Index', [
            'gelombangs' => GelombangSpmb::query()
                ->withCount('pendaftaranSpmbs')
                ->orderByDesc('is_active')
                ->orderByDesc('tanggal_mulai')
                ->get()
                ->map(fn (GelombangSpmb $wave): array => [
                    ...$wave->toArray(),
                    'tanggal_mulai' => $wave->tanggal_mulai->format('Y-m-d'),
                    'tanggal_selesai' => $wave->tanggal_selesai->format('Y-m-d'),
                ]),
            'banners' => SpmbBanner::query()
                ->orderBy('urutan')
                ->orderBy('id')
                ->get()
                ->map(fn (SpmbBanner $banner): array => [
                    ...$banner->toArray(),
                    'gambar_url' => $banner->gambar_path
                        ? Storage::disk('public')->url($banner->gambar_path)
                        : null,
                ]),
            'contents' => SpmbContent::query()
                ->get()
                ->mapWithKeys(fn (SpmbContent $content): array => [
                    $content->content_key => $content->content,
                ]),
        ]);
    }

    public function storeWave(Request $request): RedirectResponse
    {
        GelombangSpmb::create($request->validate($this->waveRules()));

        return to_route('admin.spmb-cms.index')
            ->with('success', 'Gelombang pendaftaran berhasil ditambahkan.');
    }

    public function updateWave(Request $request, GelombangSpmb $gelombang): RedirectResponse
    {
        $gelombang->update($request->validate($this->waveRules()));

        return to_route('admin.spmb-cms.index')
            ->with('success', 'Gelombang pendaftaran berhasil diperbarui.');
    }

    public function activateWave(GelombangSpmb $gelombang): RedirectResponse
    {
        DB::transaction(function () use ($gelombang): void {
            GelombangSpmb::query()->lockForUpdate()->get();
            GelombangSpmb::query()->update(['is_active' => false]);
            $gelombang->newQuery()->whereKey($gelombang->id)->update(['is_active' => true]);
        });

        return to_route('admin.spmb-cms.index')
            ->with('success', 'Gelombang pendaftaran berhasil diaktifkan.');
    }

    public function closeWave(GelombangSpmb $gelombang): RedirectResponse
    {
        DB::transaction(function () use ($gelombang): void {
            $lockedWave = GelombangSpmb::query()->lockForUpdate()->findOrFail($gelombang->id);
            $lockedWave->update(['is_active' => false]);
        });

        return to_route('admin.spmb-cms.index')
            ->with('success', 'Gelombang pendaftaran berhasil ditutup.');
    }

    public function destroyWave(GelombangSpmb $gelombang): RedirectResponse
    {
        $deleted = DB::transaction(function () use ($gelombang): bool {
            $lockedWave = GelombangSpmb::query()->lockForUpdate()->findOrFail($gelombang->id);

            if ($lockedWave->pendaftaranSpmbs()->exists()) {
                return false;
            }

            $lockedWave->delete();

            return true;
        });

        if (! $deleted) {
            return back()->with('error', 'Gelombang tidak dapat dihapus karena sudah memiliki pendaftar.');
        }

        return to_route('admin.spmb-cms.index')
            ->with('success', 'Gelombang pendaftaran berhasil dihapus.');
    }

    public function storeBanner(Request $request): RedirectResponse
    {
        $validated = $request->validate($this->bannerRules());
        $path = $request->file('gambar')?->store('spmb/banners', 'public');

        if ($request->hasFile('gambar') && ! is_string($path)) {
            return back()->with('error', 'Gambar banner gagal disimpan. Silakan coba kembali.');
        }

        try {
            SpmbBanner::create([
                ...$validated,
                'gambar_path' => $path,
            ]);
        } catch (Throwable $exception) {
            if (is_string($path)) {
                $this->deleteStoredFile($path, 'Gambar banner baru gagal dibersihkan setelah penyimpanan gagal.');
            }

            throw $exception;
        }

        return to_route('admin.spmb-cms.index')
            ->with('success', 'Slide portal berhasil ditambahkan.');
    }

    public function updateBanner(Request $request, SpmbBanner $banner): RedirectResponse
    {
        $validated = $request->validate($this->bannerRules());
        $newPath = $request->file('gambar')?->store('spmb/banners', 'public');

        if ($request->hasFile('gambar') && ! is_string($newPath)) {
            return back()->with('error', 'Gambar banner gagal disimpan. Silakan coba kembali.');
        }

        $oldPath = $banner->gambar_path;

        try {
            $banner->update([
                ...$validated,
                ...(is_string($newPath) ? ['gambar_path' => $newPath] : []),
            ]);
        } catch (Throwable $exception) {
            if (is_string($newPath)) {
                $this->deleteStoredFile($newPath, 'Gambar banner baru gagal dibersihkan setelah pembaruan gagal.');
            }

            throw $exception;
        }

        if (is_string($newPath) && is_string($oldPath)) {
            $this->deleteStoredFile($oldPath, 'Gambar banner lama gagal dihapus setelah penggantian.');
        }

        return to_route('admin.spmb-cms.index')
            ->with('success', 'Slide portal berhasil diperbarui.');
    }

    public function destroyBanner(SpmbBanner $banner): RedirectResponse
    {
        $path = $banner->gambar_path;
        $banner->delete();

        if (is_string($path)) {
            $this->deleteStoredFile($path, 'Gambar banner gagal dihapus dari penyimpanan.');
        }

        return to_route('admin.spmb-cms.index')
            ->with('success', 'Slide portal berhasil dihapus.');
    }

    public function updateContents(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'jalur_seleksi' => ['required', 'array', 'min:1', 'max:20'],
            'jalur_seleksi.*.judul' => ['required', 'string', 'max:120'],
            'jalur_seleksi.*.badge' => ['nullable', 'string', 'max:80'],
            'jalur_seleksi.*.deskripsi' => ['required', 'string', 'max:2000'],
            'jalur_seleksi.*.jadwal_kuota' => ['nullable', 'string', 'max:255'],
            'jalur_seleksi.*.status_buka' => ['required', 'boolean'],
            'persyaratan' => ['required', 'array', 'min:1', 'max:40'],
            'persyaratan.*.judul' => ['required', 'string', 'max:120'],
            'persyaratan.*.deskripsi' => ['nullable', 'string', 'max:2000'],
            'alur' => ['required', 'array', 'min:1', 'max:20'],
            'alur.*.judul' => ['required', 'string', 'max:120'],
            'alur.*.deskripsi' => ['required', 'string', 'max:2000'],
            'kontak.nomor_whatsapp' => ['nullable', 'string', 'max:30'],
            'kontak.nomor_telepon' => ['nullable', 'string', 'max:30'],
            'kontak.email' => ['nullable', 'email', 'max:255'],
            'kontak.alamat' => ['nullable', 'string', 'max:1000'],
        ]);

        DB::transaction(function () use ($validated): void {
            foreach (['jalur_seleksi', 'persyaratan', 'alur', 'kontak'] as $contentKey) {
                SpmbContent::query()->updateOrCreate(
                    ['content_key' => $contentKey],
                    ['content' => $validated[$contentKey]],
                );
            }
        });

        return to_route('admin.spmb-cms.index')
            ->with('success', 'Konten portal SPMB berhasil disimpan.');
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    private function waveRules(): array
    {
        return [
            'nama_gelombang' => ['required', 'string', 'max:120'],
            'tahun_ajaran' => ['required', 'string', 'max:20'],
            'tanggal_mulai' => ['required', 'date'],
            'tanggal_selesai' => ['required', 'date', 'after_or_equal:tanggal_mulai'],
            'kuota' => ['required', 'integer', 'min:1', 'max:100000'],
            'keterangan' => ['nullable', 'string', 'max:2000'],
        ];
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    private function bannerRules(): array
    {
        return [
            'kicker' => ['required', 'string', 'max:180'],
            'judul' => ['required', 'string', 'max:255'],
            'subjudul' => ['required', 'string', 'max:2000'],
            'gambar' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'cta_label' => ['required', 'string', 'max:80'],
            'cta_url' => [
                'required',
                'string',
                'max:2048',
                'regex:/^\/(?!\/)[^\s]*$/',
            ],
            'urutan' => ['required', 'integer', 'min:0', 'max:65535'],
            'is_active' => ['required', 'boolean'],
        ];
    }

    private function deleteStoredFile(string $path, string $message): void
    {
        if (Storage::disk('public')->exists($path) && ! Storage::disk('public')->delete($path)) {
            Log::warning($message, ['path' => $path]);
        }
    }
}
