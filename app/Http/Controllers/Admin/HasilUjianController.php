<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\HasilUjian;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\TahunAjaran;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class HasilUjianController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $this->validatedFilters($request);
        $resultsQuery = $this->resultsQuery($filters);
        $scoreStatistics = (clone $resultsQuery)
            ->reorder()
            ->selectRaw('AVG(hasil_ujians.skor_akhir) as rata_rata')
            ->selectRaw('MAX(hasil_ujians.skor_akhir) as nilai_tertinggi')
            ->selectRaw('MIN(hasil_ujians.skor_akhir) as nilai_terendah')
            ->first();

        return Inertia::render('Admin/Ujian/Results', [
            'tahunAjaranOptions' => TahunAjaran::query()
                ->orderByDesc('nama_tahun')
                ->orderBy('semester')
                ->get(['id', 'nama_tahun', 'semester', 'is_aktif']),
            'kelasOptions' => Kelas::query()
                ->when($filters['tahun_ajaran_id'] !== null, fn (Builder $query) => $query
                    ->where('tahun_ajaran_id', $filters['tahun_ajaran_id']))
                ->orderBy('nama_kelas')
                ->get(['id', 'tahun_ajaran_id', 'nama_kelas']),
            'mataPelajaranOptions' => MataPelajaran::query()
                ->orderBy('nama_mapel')
                ->get(['id', 'kode_mapel', 'nama_mapel']),
            'filters' => [
                'tahun_ajaran_id' => $filters['tahun_ajaran_id'] === null ? '' : (string) $filters['tahun_ajaran_id'],
                'kelas_id' => $filters['kelas_id'] === null ? '' : (string) $filters['kelas_id'],
                'mapel_id' => $filters['mapel_id'] === null ? '' : (string) $filters['mapel_id'],
            ],
            'statistics' => [
                'rataRata' => $scoreStatistics->rata_rata === null
                    ? null
                    : round((float) $scoreStatistics->rata_rata, 2),
                'nilaiTertinggi' => $scoreStatistics->nilai_tertinggi === null
                    ? null
                    : (float) $scoreStatistics->nilai_tertinggi,
                'nilaiTerendah' => $scoreStatistics->nilai_terendah === null
                    ? null
                    : (float) $scoreStatistics->nilai_terendah,
            ],
            'hasilUjians' => $resultsQuery
                ->paginate(20)
                ->withQueryString(),
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        $filters = $this->validatedFilters($request);
        $results = $this->resultsQuery($filters)->reorder('id');

        return response()->streamDownload(function () use ($results): void {
            $spreadsheet = new Spreadsheet;
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle('Hasil Ujian');
            $sheet->fromArray([
                ['Tahun Ajaran', 'Kelas', 'Mata Pelajaran', 'Ujian', 'NISN', 'Nama Siswa', 'Nilai Akhir'],
            ]);

            $rowNumber = 2;
            foreach ($results->lazyById(500) as $hasilUjian) {
                $row = [
                    $hasilUjian->ujian?->kelas?->tahunAjaran?->nama_tahun,
                    $hasilUjian->ujian?->kelas?->nama_kelas,
                    $hasilUjian->ujian?->mataPelajaran?->nama_mapel,
                    $hasilUjian->ujian?->judul_ujian,
                    $hasilUjian->siswa?->nisn,
                    $hasilUjian->siswa?->nama_lengkap,
                    $hasilUjian->skor_akhir === null ? null : (float) $hasilUjian->skor_akhir,
                ];

                foreach ($row as $columnIndex => $value) {
                    $column = chr(ord('A') + $columnIndex);
                    $cell = $column.$rowNumber;

                    if ($column === 'G' && $value !== null) {
                        $sheet->setCellValueExplicit($cell, $value, DataType::TYPE_NUMERIC);

                        continue;
                    }

                    $sheet->setCellValueExplicit($cell, (string) ($value ?? ''), DataType::TYPE_STRING);
                }

                $rowNumber++;
            }

            $lastRow = $rowNumber - 1;
            $sheet->getStyle('A1:G1')->applyFromArray([
                'font' => [
                    'bold' => true,
                    'color' => ['rgb' => 'FFFFFF'],
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '4338CA'],
                ],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'vertical' => Alignment::VERTICAL_CENTER,
                ],
            ]);
            $sheet->getRowDimension(1)->setRowHeight(24);
            $sheet->freezePane('A2');
            $sheet->setAutoFilter("A1:G{$lastRow}");
            if ($lastRow > 1) {
                $sheet->getStyle("G2:G{$lastRow}")
                    ->getNumberFormat()
                    ->setFormatCode('0.00');
            }

            foreach (range('A', 'G') as $column) {
                $sheet->getColumnDimension($column)->setAutoSize(true);
            }

            try {
                (new Xlsx($spreadsheet))->save('php://output');
            } finally {
                $spreadsheet->disconnectWorksheets();
            }
        }, 'hasil-ujian-'.now()->format('Ymd').'.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    /**
     * @return array{tahun_ajaran_id: int|null, kelas_id: int|null, mapel_id: int|null}
     */
    private function validatedFilters(Request $request): array
    {
        $validated = $request->validate([
            'tahun_ajaran_id' => ['sometimes', 'nullable', 'integer', Rule::exists('tahun_ajarans', 'id')],
            'kelas_id' => ['sometimes', 'nullable', 'integer', Rule::exists('kelas', 'id')],
            'mapel_id' => ['sometimes', 'nullable', 'integer', Rule::exists('mata_pelajarans', 'id')],
        ]);

        $tahunAjaranId = $request->query->has('tahun_ajaran_id')
            ? ($validated['tahun_ajaran_id'] ?? null)
            : TahunAjaran::query()->where('is_aktif', true)->value('id');
        $kelasId = $validated['kelas_id'] ?? null;

        if ($kelasId !== null && $tahunAjaranId !== null && ! Kelas::query()
            ->whereKey($kelasId)
            ->where('tahun_ajaran_id', $tahunAjaranId)
            ->exists()) {
            throw ValidationException::withMessages([
                'kelas_id' => 'Kelas tidak termasuk tahun ajaran yang dipilih.',
            ]);
        }

        return [
            'tahun_ajaran_id' => $tahunAjaranId,
            'kelas_id' => $kelasId,
            'mapel_id' => $validated['mapel_id'] ?? null,
        ];
    }

    /**
     * @param  array{tahun_ajaran_id: int|null, kelas_id: int|null, mapel_id: int|null}  $filters
     * @return Builder<HasilUjian>
     */
    private function resultsQuery(array $filters): Builder
    {
        return HasilUjian::query()
            ->with([
                'ujian:id,kelas_id,mapel_id,judul_ujian',
                'ujian.kelas:id,tahun_ajaran_id,nama_kelas',
                'ujian.kelas.tahunAjaran:id,nama_tahun',
                'ujian.mataPelajaran:id,nama_mapel',
                'siswa:id,nisn,nama_lengkap',
            ])
            ->where('status_pengerjaan', 'selesai')
            ->whereNotNull('skor_akhir')
            ->whereHas('ujian', fn (Builder $query) => $query
                ->when($filters['tahun_ajaran_id'] !== null, fn (Builder $query) => $query
                    ->whereHas('kelas', fn (Builder $kelasQuery) => $kelasQuery
                        ->where('tahun_ajaran_id', $filters['tahun_ajaran_id'])))
                ->when($filters['kelas_id'] !== null, fn (Builder $query) => $query
                    ->where('kelas_id', $filters['kelas_id']))
                ->when($filters['mapel_id'] !== null, fn (Builder $query) => $query
                    ->where('mapel_id', $filters['mapel_id'])))
            ->orderBy('siswa_id')
            ->orderBy('id');
    }
}
