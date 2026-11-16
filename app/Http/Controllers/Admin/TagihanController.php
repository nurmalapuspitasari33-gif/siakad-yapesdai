<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Kelas;
use App\Models\PengaturanSekolah;
use App\Models\Siswa;
use App\Models\Tagihan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TagihanController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'status' => ['nullable', Rule::in(['belum_lunas', 'lunas'])],
        ]);

        return Inertia::render('Admin/Tagihan/Index', [
            'tagihans' => Tagihan::query()
                ->with([
                    'siswa:id,nisn,nama_lengkap,no_wa_wali,kelas_id,tipe_program,kategori_beasiswa_id',
                    'siswa.kelas:id,nama_kelas',
                    'siswa.kategoriBeasiswa:id,nama_beasiswa,jenis_potongan,nilai_potongan,is_afirmasi',
                ])
                ->when($filters['status'] ?? null, fn ($query, $status) => $query->where('status_bayar', $status))
                ->latest('jatuh_tempo')
                ->latest('id')
                ->paginate(15)
                ->withQueryString(),
            'kelasOptions' => Kelas::query()
                ->whereHas('siswas', fn ($query) => $query->where('status_siswa', 'aktif'))
                ->orderBy('nama_kelas')
                ->get(['id', 'nama_kelas']),
            'tarif' => $this->tariffSettings(),
            'filters' => ['status' => $filters['status'] ?? ''],
        ]);
    }

    public function generate(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'target' => ['required', Rule::in(['semua', 'kelas'])],
            'kelas_id' => [
                Rule::requiredIf($request->input('target') === 'kelas'),
                'nullable',
                'integer',
                Rule::exists('kelas', 'id'),
            ],
            'jenis_tagihan' => ['required', Rule::in(['spp', 'praktikum', 'khusus_non_afirmasi'])],
            'judul_tagihan' => ['required', 'string', 'max:255'],
            'nominal' => ['required', 'numeric', 'gt:0', 'max:9999999999.99'],
            'jatuh_tempo' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
        ], [
            'target.required' => 'Pilih cakupan penerbitan tagihan.',
            'kelas_id.required' => 'Pilih kelas yang akan menerima tagihan.',
            'judul_tagihan.required' => 'Judul tagihan wajib diisi.',
            'nominal.gt' => 'Nominal tagihan harus lebih dari nol.',
            'jatuh_tempo.after_or_equal' => 'Jatuh tempo tidak boleh sebelum hari ini.',
        ]);
        $jenisTagihan = $validated['jenis_tagihan'];

        $siswas = Siswa::query()
            ->where('status_siswa', 'aktif')
            ->with('kategoriBeasiswa:id,jenis_potongan,nilai_potongan,is_afirmasi');

        if ($validated['target'] === 'kelas') {
            $siswas->where('kelas_id', $validated['kelas_id']);
        }

        if (! $siswas->exists()) {
            return back()->with('error', 'Tidak ada siswa aktif pada cakupan yang dipilih.');
        }

        $count = 0;

        DB::transaction(function () use ($siswas, $validated, $jenisTagihan, &$count): void {
            $siswas->orderBy('id')->chunkById(500, function ($siswaBatch) use (
                $validated,
                $jenisTagihan,
                &$count,
            ): void {
                $now = now();
                $baseAmountInCents = (int) round((float) $validated['nominal'] * 100);
                $rows = $siswaBatch->map(function (Siswa $siswa) use (
                    $validated,
                    $jenisTagihan,
                    $baseAmountInCents,
                    $now,
                ): array {
                    $amountInCents = $this->amountForStudent($siswa, $jenisTagihan, $baseAmountInCents);

                    return [
                        'siswa_id' => $siswa->id,
                        'judul_tagihan' => $validated['judul_tagihan'],
                        'jenis_tagihan' => $jenisTagihan,
                        'nominal' => number_format($amountInCents / 100, 2, '.', ''),
                        'jatuh_tempo' => $validated['jatuh_tempo'],
                        'status_bayar' => $amountInCents === 0 ? 'lunas' : 'belum_lunas',
                        'status_wa' => 'belum_terkirim',
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                })->all();

                Tagihan::query()->insert($rows);
                $count += count($rows);
            });
        });

        return to_route('admin.tagihan.index')
            ->with('success', "{$count} tagihan berhasil dibuat.");
    }

    /**
     * @return array{tarif_spp_reguler: string, tarif_praktikum: string}
     */
    private function tariffSettings(): array
    {
        $settings = PengaturanSekolah::query()->findOrFail(1);

        return [
            'tarif_spp_reguler' => $settings->tarif_spp_reguler,
            'tarif_praktikum' => $settings->tarif_praktikum,
        ];
    }

    private function amountForStudent(Siswa $siswa, string $jenisTagihan, int $baseAmountInCents): int
    {
        $kategoriBeasiswa = $siswa->kategoriBeasiswa;

        if ($jenisTagihan === 'khusus_non_afirmasi') {
            return $baseAmountInCents;
        }

        if ($kategoriBeasiswa?->is_afirmasi) {
            return 0;
        }

        if ($jenisTagihan === 'praktikum') {
            return $baseAmountInCents;
        }

        $programDiscount = match ($siswa->tipe_program) {
            'santri_internal' => 70,
            'santri_eksternal' => 30,
            default => 0,
        };
        $amountInCents = (int) round($baseAmountInCents * (100 - $programDiscount) / 100);

        if (! $kategoriBeasiswa) {
            return $amountInCents;
        }

        $scholarshipDiscount = $kategoriBeasiswa->jenis_potongan === 'persen'
            ? (int) round($amountInCents * (float) $kategoriBeasiswa->nilai_potongan / 100)
            : (int) round((float) $kategoriBeasiswa->nilai_potongan * 100);

        return max(0, $amountInCents - $scholarshipDiscount);
    }

    public function markPaid(Tagihan $tagihan): RedirectResponse
    {
        if ($tagihan->status_bayar === 'lunas') {
            return back()->with('success', 'Tagihan ini sudah berstatus lunas.');
        }

        $tagihan->update(['status_bayar' => 'lunas']);

        return back()->with('success', 'Status tagihan berhasil ditandai lunas.');
    }

    public function markWhatsAppSent(Tagihan $tagihan): RedirectResponse
    {
        if (! $tagihan->siswa()->value('no_wa_wali')) {
            return back()->with('error', 'Nomor WhatsApp wali siswa belum tersedia.');
        }

        $tagihan->update(['status_wa' => 'terkirim']);

        return back()->with('success', 'Status notifikasi WhatsApp berhasil diperbarui.');
    }
}
