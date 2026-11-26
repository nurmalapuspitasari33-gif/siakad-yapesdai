<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Controller;
use App\Models\BankSoal;
use App\Models\Guru;
use App\Models\Jadwal;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\Ujian;
use App\Support\ExamScoring;
use App\Support\SpreadsheetFile;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
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

class UjianController extends Controller
{
    private const TIMEZONE = 'Asia/Jakarta';

    private const QUESTION_HEADERS = [
        'pertanyaan',
        'opsi_a',
        'opsi_b',
        'opsi_c',
        'opsi_d',
        'opsi_e',
        'kunci_jawaban',
        'tipe_soal',
        'bobot',
    ];

    private const OPTIONAL_QUESTION_HEADERS = ['tipe_soal', 'bobot'];

    private const TEMPLATE_MATCHING_PAIR_COUNT = 5;

    private const MAX_MATCHING_PAIRS = 10;

    private const RESULT_HEADERS = [
        'Nama',
        'NISN',
        'Status Mengerjakan',
        'Waktu Selesai',
        'Skor Akhir',
    ];

    public function index(Request $request): Response
    {
        $guru = $request->user()->guru;
        abort_unless($guru, 404);
        $tahunAjaranAktif = TahunAjaran::query()->where('is_aktif', true)->first();

        $assignments = $tahunAjaranAktif
            ? Jadwal::query()
                ->where('tahun_ajaran_id', $tahunAjaranAktif->id)
                ->where('guru_id', $guru->id)
                ->with(['kelas:id,nama_kelas', 'mataPelajaran:id,kode_mapel,nama_mapel'])
                ->get()
                ->unique(fn (Jadwal $jadwal): string => "{$jadwal->kelas_id}:{$jadwal->mapel_id}")
                ->values()
            : collect();
        $kelasWalianAktif = $guru->kelasWalianAktif();

        return Inertia::render('Guru/Ujian/Index', [
            'ujians' => Ujian::query()
                ->where('guru_id', $guru->id)
                ->with([
                    'kelas:id,nama_kelas',
                    'mataPelajaran:id,kode_mapel,nama_mapel',
                    'bankSoals:id,ujian_id,pertanyaan,opsi_a,opsi_b,opsi_c,opsi_d,opsi_e,kunci_jawaban,tipe_soal,bobot,gambar_soal,gambar_a,gambar_b,gambar_c,gambar_d,gambar_e,opsi_json',
                ])
                ->withCount('hasilUjians')
                ->orderByDesc('waktu_mulai')
                ->get()
                ->map(fn (Ujian $ujian): array => [
                    'id' => $ujian->id,
                    'kelas_id' => $ujian->kelas_id,
                    'mapel_id' => $ujian->mapel_id,
                    'judul_ujian' => $ujian->judul_ujian,
                    'waktu_mulai' => $ujian->waktu_mulai->setTimezone(self::TIMEZONE)->format('Y-m-d\TH:i'),
                    'waktu_mulai_label' => $ujian->waktu_mulai->setTimezone(self::TIMEZONE)->translatedFormat('d M Y, H:i'),
                    'durasi_menit' => $ujian->durasi_menit,
                    'acak_soal' => $ujian->acak_soal,
                    'mode_ujian' => $ujian->mode_ujian ?? 'normal',
                    'maks_pelanggaran' => $ujian->maks_pelanggaran ?? 3,
                    'hasil_ujians_count' => $ujian->hasil_ujians_count,
                    'kelas' => $ujian->kelas?->nama_kelas,
                    'mapel' => $ujian->mataPelajaran?->nama_mapel,
                    'bank_soals' => $ujian->bankSoals->map(fn (BankSoal $soal): array => [
                        'id' => $soal->id,
                        'pertanyaan' => $soal->pertanyaan,
                        'opsi_a' => $soal->opsi_a,
                        'opsi_b' => $soal->opsi_b,
                        'opsi_c' => $soal->opsi_c,
                        'opsi_d' => $soal->opsi_d,
                        'opsi_e' => $soal->opsi_e,
                        'kunci_jawaban' => $soal->kunci_jawaban,
                        'tipe_soal' => $soal->tipe_soal ?? 'pg',
                        'bobot' => $soal->bobot ?? 1,
                        'gambar_soal' => $soal->gambar_soal
                            ? Storage::disk('public')->url($soal->gambar_soal)
                            : null,
                        'gambar_a' => $soal->gambar_a ? Storage::disk('public')->url($soal->gambar_a) : null,
                        'gambar_b' => $soal->gambar_b ? Storage::disk('public')->url($soal->gambar_b) : null,
                        'gambar_c' => $soal->gambar_c ? Storage::disk('public')->url($soal->gambar_c) : null,
                        'gambar_d' => $soal->gambar_d ? Storage::disk('public')->url($soal->gambar_d) : null,
                        'gambar_e' => $soal->gambar_e ? Storage::disk('public')->url($soal->gambar_e) : null,
                        'opsi_json' => $soal->opsi_json,
                    ]),
                ]),
            'kelasOptions' => $assignments->pluck('kelas')->unique('id')->values(),
            'mapelOptions' => $assignments->pluck('mataPelajaran')->unique('id')->values(),
            'assignments' => $assignments->map(fn (Jadwal $jadwal): array => [
                'kelas_id' => $jadwal->kelas_id,
                'mapel_id' => $jadwal->mapel_id,
            ]),
            'isWaliKelas' => $kelasWalianAktif->isNotEmpty(),
            'waliKelasName' => $kelasWalianAktif->pluck('nama_kelas')->implode(', '),
            'tahunAjaranAktif' => $tahunAjaranAktif
                ? "{$tahunAjaranAktif->nama_tahun} · {$tahunAjaranAktif->semester}"
                : null,
        ]);
    }

    public function resultsIndex(Request $request): Response
    {
        $guru = $this->teacher($request);
        $kelasWalianAktif = $guru->kelasWalianAktif();
        $ujians = Ujian::query()
            ->where('guru_id', $guru->id)
            ->with(['kelas:id,nama_kelas', 'mataPelajaran:id,nama_mapel'])
            ->withCount('hasilUjians')
            ->orderByDesc('waktu_mulai')
            ->paginate(10)
            ->through(fn (Ujian $ujian): array => [
                'id' => $ujian->id,
                'judul_ujian' => $ujian->judul_ujian,
                'kelas' => $ujian->kelas?->nama_kelas,
                'mata_pelajaran' => $ujian->mataPelajaran?->nama_mapel,
                'waktu_mulai' => $ujian->waktu_mulai
                    ->setTimezone(self::TIMEZONE)
                    ->translatedFormat('d M Y, H:i'),
                'hasil_ujians_count' => $ujian->hasil_ujians_count,
            ]);

        return Inertia::render('Guru/Ujian/ResultsIndex', [
            'ujians' => $ujians,
            'isWaliKelas' => $kelasWalianAktif->isNotEmpty(),
            'waliKelasName' => $kelasWalianAktif->pluck('nama_kelas')->implode(', '),
        ]);
    }

    public function results(Request $request, Ujian $ujian): Response
    {
        $guru = $this->teacher($request);
        $kelasWalianAktif = $guru->kelasWalianAktif();
        $this->ensureOwnership($ujian, $guru);
        $ujian->loadMissing(['kelas:id,nama_kelas', 'mataPelajaran:id,nama_mapel', 'bankSoals']);

        return Inertia::render('Guru/Ujian/Results', [
            'ujian' => [
                'id' => $ujian->id,
                'judul_ujian' => $ujian->judul_ujian,
                'kelas' => $ujian->kelas?->nama_kelas,
                'mata_pelajaran' => $ujian->mataPelajaran?->nama_mapel,
            ],
            'isWaliKelas' => $kelasWalianAktif->isNotEmpty(),
            'waliKelasName' => $kelasWalianAktif->pluck('nama_kelas')->implode(', '),
            'students' => $this->resultStudents($ujian)
                ->get()
                ->map(fn (Siswa $siswa): array => $this->studentResult($siswa, $ujian->bankSoals))
                ->values(),
        ]);
    }

    public function gradeEssays(Request $request, Ujian $ujian, Siswa $siswa): RedirectResponse
    {
        $guru = $this->teacher($request);
        $this->ensureOwnership($ujian, $guru);
        abort_unless(
            (int) $ujian->kelas_id === (int) $siswa->kelas_id && $siswa->status_siswa === 'aktif',
            404,
        );

        $validated = $request->validate([
            'scores' => ['required', 'array'],
            'scores.*' => ['required', 'numeric', 'min:0'],
        ]);
        $questions = $ujian->bankSoals()
            ->where('tipe_soal', 'esai')
            ->get();
        $questionIds = $questions->map(fn (BankSoal $question): string => (string) $question->id)->all();

        foreach ($validated['scores'] as $questionId => $score) {
            if (! in_array((string) $questionId, $questionIds, true)) {
                throw ValidationException::withMessages([
                    'scores' => 'Nilai hanya dapat diberikan untuk soal esai pada ujian ini.',
                ]);
            }

            if ((float) $score > (int) $questions->firstWhere('id', (int) $questionId)->bobot) {
                throw ValidationException::withMessages([
                    "scores.{$questionId}" => 'Nilai esai tidak boleh melebihi bobot soal.',
                ]);
            }
        }

        DB::transaction(function () use ($ujian, $siswa, $questions, $validated): void {
            $attempt = $ujian->hasilUjians()
                ->where('siswa_id', $siswa->id)
                ->lockForUpdate()
                ->firstOrFail();
            abort_unless($attempt->status_pengerjaan === 'selesai', 409);

            $answers = $attempt->jawaban_json ?? [];
            $essayScores = $answers['_nilai_esai'] ?? [];

            foreach ($validated['scores'] as $questionId => $score) {
                $essayScores[(string) $questionId] = (float) $score;
            }

            $answers['_nilai_esai'] = $essayScores;
            $attempt->update([
                'jawaban_json' => $answers,
                'skor_akhir' => ExamScoring::score($questions, $answers),
            ]);
        });

        return to_route('guru.ujian.hasil', $ujian)
            ->with('success', "Koreksi esai {$siswa->nama_lengkap} berhasil disimpan.");
    }

    public function exportResults(Request $request, Ujian $ujian): StreamedResponse
    {
        $guru = $this->teacher($request);
        $this->ensureOwnership($ujian, $guru);
        $ujian->loadMissing('bankSoals');
        $students = $this->resultStudents($ujian);

        return response()->streamDownload(function () use ($students, $ujian): void {
            $spreadsheet = new Spreadsheet;
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle('Hasil Ujian');
            $sheet->fromArray([self::RESULT_HEADERS], null, 'A1');

            $rowNumber = 2;
            foreach ($students->lazyById(500) as $siswa) {
                $result = $this->studentResult($siswa, $ujian->bankSoals);
                $row = [
                    $result['nama_lengkap'],
                    $result['nisn'],
                    $result['status_label'],
                    $result['waktu_selesai'] ?? '',
                    $result['skor_akhir'] === null ? null : (float) $result['skor_akhir'],
                ];

                foreach ($row as $columnIndex => $value) {
                    $column = chr(ord('A') + $columnIndex);
                    $cell = $column.$rowNumber;

                    if ($column === 'E' && $value !== null) {
                        $sheet->setCellValueExplicit($cell, $value, DataType::TYPE_NUMERIC);

                        continue;
                    }

                    $sheet->setCellValueExplicit($cell, (string) ($value ?? ''), DataType::TYPE_STRING);
                }

                $rowNumber++;
            }

            $lastRow = $rowNumber - 1;
            $sheet->getStyle('A1:E1')->applyFromArray([
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
            $sheet->setAutoFilter("A1:E{$lastRow}");

            if ($lastRow > 1) {
                $sheet->getStyle("E2:E{$lastRow}")
                    ->getNumberFormat()
                    ->setFormatCode('0.00');
            }

            foreach (range('A', 'E') as $column) {
                $sheet->getColumnDimension($column)->setAutoSize(true);
            }

            try {
                (new Xlsx($spreadsheet))->save('php://output');
            } finally {
                $spreadsheet->disconnectWorksheets();
            }
        }, 'hasil-ujian-'.$ujian->id.'-'.now()->format('Ymd').'.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    public function resetSession(Request $request, Ujian $ujian, Siswa $siswa): RedirectResponse
    {
        $guru = $this->teacher($request);
        $this->ensureOwnership($ujian, $guru);
        abort_unless(
            (int) $ujian->kelas_id === (int) $siswa->kelas_id && $siswa->status_siswa === 'aktif',
            404,
        );

        DB::transaction(function () use ($ujian, $siswa): void {
            $attempt = $ujian->hasilUjians()
                ->where('siswa_id', $siswa->id)
                ->lockForUpdate()
                ->firstOrFail();

            abort_unless($attempt->status_pengerjaan === 'sedang_mengerjakan', 409);

            $attempt->delete();
        });

        return to_route('guru.ujian.hasil', $ujian)
            ->with('success', "Sesi ujian {$ujian->judul_ujian} untuk {$siswa->nama_lengkap} berhasil direset.");
    }

    public function store(Request $request): RedirectResponse
    {
        $guru = $this->teacher($request);
        $validated = $this->validatedExam($request, $guru);

        Ujian::create([
            ...$validated,
            'guru_id' => $guru->id,
        ]);

        return to_route('guru.ujian.index')->with('success', 'Jadwal ujian berhasil dibuat.');
    }

    public function questionTemplate(Request $request, Ujian $ujian): StreamedResponse
    {
        $guru = $this->teacher($request);
        $this->ensureOwnership($ujian, $guru);
        $isAkm = $ujian->mode_ujian === 'akm';

        $spreadsheet = new Spreadsheet;
        $guideSheet = $spreadsheet->getActiveSheet();
        $guideSheet->setTitle('Petunjuk');
        $guideRows = $isAkm
            ? [
                ['PANDUAN TEMPLATE SOAL UJIAN AKM'],
                ['Isi satu soal per baris pada sheet Data Soal. Jangan ubah atau menghapus nama kolom.'],
                ['Tipe soal: PG, PGK, JODOH, ISIAN, atau ESAI. Bobot boleh diisi 1-1000; jika kosong nilainya 1.'],
                ['PG: isi Pilihan A-E dan Kunci jawaban dengan satu huruf, contoh B.'],
                ['PGK: isi pernyataan pada Pilihan A-E. Isi Kunci jawaban dengan huruf jawaban yang benar, pisahkan dengan koma, contoh A,C.'],
                ['JODOH: isi minimal 3 pasangan. Kolom Pasangan kanan berisi pilihan yang ditampilkan kepada siswa.'],
                ['Untuk setiap Pasangan kiri, isi Jawaban benar dengan teks yang sama persis seperti salah satu Pasangan kanan.'],
                ['ISIAN: isi Kunci jawaban dengan satu atau beberapa jawaban benar, pisahkan variasi dengan tanda |, contoh Jakarta|DKI Jakarta.'],
                ['ESAI: isi Pertanyaan, Tipe soal ESAI, dan Bobot. Jawaban dinilai oleh guru setelah ujian.'],
                ['Kolom yang tidak digunakan boleh dikosongkan. Template menyediakan 5 slot JODOH; minimal 3 slot harus terisi.'],
                ['Gunakan form Kelola Soal untuk menambahkan hingga 10 pasangan dalam satu soal.'],
                ['Contoh pasangan menjodohkan: setiap baris di bawah ini menjadi satu slot Pasangan kiri, Pasangan kanan, dan Jawaban benar.'],
                ['Pasangan kiri', 'Pasangan kanan (pilihan siswa)', 'Jawaban benar'],
                ['Indonesia', 'Tokyo', 'Jakarta'],
                ['Jepang', 'Jakarta', 'Tokyo'],
                ['Thailand', 'Bangkok', 'Bangkok'],
            ]
            : [
                ['PANDUAN TEMPLATE SOAL NORMAL'],
                ['Isi satu soal per baris pada sheet Data Soal. Jangan ubah atau menghapus nama kolom.'],
                ['Mode Normal hanya menerima tipe PG dan ESAI. Bobot boleh diisi 1-1000; jika kosong nilainya 1.'],
                ['PG: isi Pilihan A-E dan Kunci jawaban dengan satu huruf, contoh B.'],
                ['ESAI: isi Pertanyaan, Tipe soal ESAI, dan Bobot. Jawaban dinilai oleh guru setelah ujian.'],
                ['Kosongkan kolom pilihan yang tidak digunakan untuk soal esai. Jangan isi tipe AKM pada template Normal.'],
            ];
        $guideSheet->fromArray($guideRows, null, 'A1');
        $guideSheet->getColumnDimension('A')->setWidth(115);
        $guideSheet->getColumnDimension('B')->setWidth(34);
        $guideSheet->getColumnDimension('C')->setWidth(28);
        $lastGuideRow = count($guideRows);
        $guideSheet->getStyle("A1:C{$lastGuideRow}")->getAlignment()->setWrapText(true);
        if ($isAkm) {
            $guideSheet->getStyle('A13:C13')->getFont()->setBold(true);
        }
        $guideSheet->getStyle('A1')->getFont()->setBold(true)->setSize(16);
        $guideSheet->getRowDimension(1)->setRowHeight(28);
        foreach (range(2, $lastGuideRow) as $rowNumber) {
            $guideSheet->getRowDimension($rowNumber)->setRowHeight(34);
        }

        $dataSheet = $spreadsheet->createSheet();
        $dataSheet->setTitle('Data Soal');
        $headers = $this->questionTemplateHeaders($isAkm);
        $dataSheet->fromArray([$headers], null, 'A1');
        $lastColumn = $dataSheet->getHighestColumn();
        $dataSheet->getStyle("A1:{$lastColumn}1")->getFont()
            ->setBold(true)
            ->getColor()
            ->setARGB('FFFFFFFF');
        $dataSheet->getStyle("A1:{$lastColumn}1")->getFill()
            ->setFillType(Fill::FILL_SOLID)
            ->getStartColor()
            ->setARGB('FF1F4E78');
        $dataSheet->getStyle("A1:{$lastColumn}1")->getAlignment()->setWrapText(true);
        $dataSheet->getRowDimension(1)->setRowHeight(40);
        $dataSheet->getColumnDimension('A')->setWidth(38);
        foreach (range('B', 'G') as $column) {
            $dataSheet->getColumnDimension($column)->setWidth(16);
        }
        $dataSheet->getColumnDimension('H')->setWidth(20);
        $dataSheet->getColumnDimension('I')->setWidth(10);
        if ($isAkm) {
            foreach (range('J', $lastColumn) as $column) {
                $dataSheet->getColumnDimension($column)->setWidth(22);
            }
        }
        $dataSheet->freezePane('A2');
        $spreadsheet->setActiveSheetIndex($spreadsheet->getIndex($dataSheet));

        return response()->streamDownload(function () use ($spreadsheet): void {
            try {
                (new Xlsx($spreadsheet))->save('php://output');
            } finally {
                $spreadsheet->disconnectWorksheets();
            }
        }, 'template-soal-'.($isAkm ? 'akm' : 'normal').'-ujian-'.$ujian->id.'.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    public function importQuestions(Request $request, Ujian $ujian): RedirectResponse
    {
        $guru = $this->teacher($request);
        $this->ensureOwnership($ujian, $guru);

        if ($ujian->hasilUjians()->exists()) {
            return back()->with('error', 'Bank soal tidak dapat diubah setelah ada siswa yang mulai mengerjakan.');
        }

        $validated = $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx', 'extensions:xlsx', 'max:5120'],
        ]);
        $isAkm = $ujian->mode_ujian === 'akm';
        $rows = SpreadsheetFile::readRows(
            $validated['file'],
            $this->questionImportHeaders($isAkm),
            headerAliases: $this->questionImportHeaderAliases(),
            optionalHeaders: $this->questionImportOptionalHeaders($isAkm),
            sheetName: 'Data Soal',
        );
        $questions = [];
        $errors = [];

        foreach ($rows as $item) {
            try {
                $questions[] = $this->questionFromSpreadsheetRow($item['data'], $ujian);
            } catch (ValidationException $exception) {
                $errors[] = "Baris {$item['row']}: ".implode(' ', $exception->validator->errors()->all());

                continue;
            }
        }

        if ($errors !== []) {
            throw ValidationException::withMessages(['file' => implode("\n", $errors)]);
        }

        DB::transaction(function () use ($ujian, $questions): void {
            foreach ($questions as $question) {
                $ujian->bankSoals()->create($question);
            }
        });

        return to_route('guru.ujian.index')->with(
            'success',
            count($questions).' soal berhasil diimpor.',
        );
    }

    /**
     * @return array<int, string>
     */
    private function questionImportHeaders(bool $isAkm): array
    {
        return $isAkm
            ? [...self::QUESTION_HEADERS, ...$this->matchingSpreadsheetHeaders()]
            : self::QUESTION_HEADERS;
    }

    /**
     * @return array<int, string>
     */
    private function questionImportOptionalHeaders(bool $isAkm): array
    {
        return $isAkm
            ? [...self::OPTIONAL_QUESTION_HEADERS, ...$this->matchingSpreadsheetHeaders()]
            : self::OPTIONAL_QUESTION_HEADERS;
    }

    /**
     * @return array<int, string>
     */
    private function matchingSpreadsheetHeaders(): array
    {
        $headers = [];

        for ($pairNumber = 1; $pairNumber <= self::MAX_MATCHING_PAIRS; $pairNumber++) {
            $headers[] = "pasangan_kiri_{$pairNumber}";
            $headers[] = "pasangan_kanan_{$pairNumber}";
            $headers[] = "jawaban_benar_{$pairNumber}";
        }

        return $headers;
    }

    /**
     * @return array<string, string>
     */
    private function questionImportHeaderAliases(): array
    {
        $aliases = [
            'pilihan a' => 'opsi_a',
            'pilihan b' => 'opsi_b',
            'pilihan c' => 'opsi_c',
            'pilihan d' => 'opsi_d',
            'pilihan e' => 'opsi_e',
            'kunci pg (a-e)' => 'kunci_jawaban',
            'kunci jawaban' => 'kunci_jawaban',
            'tipe soal' => 'tipe_soal',
        ];

        for ($pairNumber = 1; $pairNumber <= self::MAX_MATCHING_PAIRS; $pairNumber++) {
            $aliases["pasangan kiri {$pairNumber}"] = "pasangan_kiri_{$pairNumber}";
            $aliases["pasangan kanan {$pairNumber}"] = "pasangan_kanan_{$pairNumber}";
            $aliases["jawaban benar {$pairNumber}"] = "jawaban_benar_{$pairNumber}";
        }

        return $aliases;
    }

    /**
     * @return array<int, string>
     */
    private function questionTemplateHeaders(bool $isAkm): array
    {
        $headers = [
            'Pertanyaan',
            'Pilihan A',
            'Pilihan B',
            'Pilihan C',
            'Pilihan D',
            'Pilihan E',
            'Kunci jawaban',
            'Tipe soal',
            'Bobot',
        ];

        if ($isAkm) {
            for ($pairNumber = 1; $pairNumber <= self::TEMPLATE_MATCHING_PAIR_COUNT; $pairNumber++) {
                $headers[] = "Pasangan kiri {$pairNumber}";
                $headers[] = "Pasangan kanan {$pairNumber}";
                $headers[] = "Jawaban benar {$pairNumber}";
            }
        }

        return $headers;
    }

    public function update(Request $request, Ujian $ujian): RedirectResponse
    {
        $guru = $this->teacher($request);
        $this->ensureOwnership($ujian, $guru);
        $ujian->update($this->validatedExam($request, $guru, $ujian));

        return to_route('guru.ujian.index')->with('success', 'Jadwal ujian berhasil diperbarui.');
    }

    public function destroy(Request $request, Ujian $ujian): RedirectResponse
    {
        $guru = $this->teacher($request);
        $this->ensureOwnership($ujian, $guru);

        $ujian->delete();

        return to_route('guru.ujian.index')
            ->with('success', 'Ujian beserta bank soal dan riwayat pengerjaannya berhasil dihapus.');
    }

    public function storeQuestion(Request $request, Ujian $ujian): RedirectResponse
    {
        $guru = $this->teacher($request);
        $this->ensureOwnership($ujian, $guru);

        if ($ujian->hasilUjians()->exists()) {
            return back()->with('error', 'Bank soal tidak dapat diubah setelah ada siswa yang mulai mengerjakan.');
        }

        $question = $this->validatedQuestion($request, $ujian);
        $question = $this->storeQuestionImages($request, $question);
        $ujian->bankSoals()->create($question);

        return to_route('guru.ujian.index')->with('success', 'Soal berhasil ditambahkan.');
    }

    public function updateQuestion(Request $request, Ujian $ujian, BankSoal $soal): RedirectResponse
    {
        $guru = $this->teacher($request);
        $this->ensureOwnership($ujian, $guru);
        $this->ensureQuestionBelongsToExam($ujian, $soal);

        if ($ujian->hasilUjians()->exists()) {
            return back()->with('error', 'Bank soal tidak dapat diubah setelah ada siswa yang mulai mengerjakan.');
        }

        $question = $this->validatedQuestion($request, $ujian);
        $question = $this->storeQuestionImages($request, $question);
        if (! in_array($question['tipe_soal'], ['pg', 'pg_kompleks'], true)) {
            foreach (['gambar_a', 'gambar_b', 'gambar_c', 'gambar_d', 'gambar_e'] as $field) {
                if ($soal->{$field}) {
                    Storage::disk('public')->delete($soal->{$field});
                }

                $question[$field] = null;
            }
        }
        $soal->update($question);

        return to_route('guru.ujian.index')->with('success', 'Soal berhasil diperbarui.');
    }

    public function destroyQuestion(Request $request, Ujian $ujian, BankSoal $soal): RedirectResponse
    {
        $guru = $this->teacher($request);
        $this->ensureOwnership($ujian, $guru);
        $this->ensureQuestionBelongsToExam($ujian, $soal);

        if ($ujian->hasilUjians()->exists()) {
            return back()->with('error', 'Bank soal tidak dapat diubah setelah ada siswa yang mulai mengerjakan.');
        }

        $soal->delete();

        return to_route('guru.ujian.index')->with('success', 'Soal berhasil dihapus.');
    }

    private function teacher(Request $request): Guru
    {
        $guru = $request->user()->guru;
        abort_unless($guru, 404);

        return $guru;
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedExam(Request $request, Guru $guru, ?Ujian $existingUjian = null): array
    {
        $validated = $request->validate([
            'mapel_id' => ['required', 'integer', Rule::exists('mata_pelajarans', 'id')],
            'kelas_id' => ['required', 'integer', Rule::exists('kelas', 'id')],
            'judul_ujian' => ['required', 'string', 'max:255'],
            'waktu_mulai' => ['required', 'date_format:Y-m-d\TH:i'],
            'durasi_menit' => ['required', 'integer', 'min:1', 'max:360'],
            'acak_soal' => ['required', 'boolean'],
            'mode_ujian' => ['sometimes', Rule::in(['normal', 'akm'])],
            'maks_pelanggaran' => ['sometimes', 'integer', 'min:1'],
        ], [
            'mapel_id.required' => 'Mata pelajaran wajib dipilih.',
            'kelas_id.required' => 'Kelas wajib dipilih.',
            'waktu_mulai.date_format' => 'Format waktu mulai tidak valid.',
            'durasi_menit.min' => 'Durasi ujian minimal satu menit.',
            'durasi_menit.max' => 'Durasi ujian maksimal enam jam.',
        ]);

        $tahunAjaranAktif = TahunAjaran::query()->where('is_aktif', true)->first();
        $keepsExistingAssignment = $existingUjian !== null
            && (int) $existingUjian->kelas_id === (int) $validated['kelas_id']
            && (int) $existingUjian->mapel_id === (int) $validated['mapel_id'];
        $isAssigned = $keepsExistingAssignment || ($tahunAjaranAktif && Jadwal::query()
            ->where('tahun_ajaran_id', $tahunAjaranAktif->id)
            ->where('guru_id', $guru->id)
            ->where('kelas_id', $validated['kelas_id'])
            ->where('mapel_id', $validated['mapel_id'])
            ->exists());

        if (! $isAssigned) {
            throw ValidationException::withMessages([
                'kelas_id' => 'Ujian hanya dapat dibuat untuk kelas dan mata pelajaran yang Anda ampu pada tahun ajaran aktif.',
            ]);
        }

        $startsAt = Carbon::createFromFormat('Y-m-d\TH:i', $validated['waktu_mulai'], self::TIMEZONE)->utc();
        $existingStart = $existingUjian === null
            ? null
            : $existingUjian->waktu_mulai->copy()->setTimezone(self::TIMEZONE)->format('Y-m-d\TH:i');
        $mode = $validated['mode_ujian'] ?? $existingUjian?->mode_ujian ?? 'normal';
        $hasQuestions = $existingUjian?->bankSoals()->exists() ?? false;

        if (
            $existingUjian !== null
            && $mode !== ($existingUjian->mode_ujian ?? 'normal')
            && $hasQuestions
        ) {
            throw ValidationException::withMessages([
                'mode_ujian' => 'Mode ujian tidak dapat diubah setelah soal dibuat.',
            ]);
        }

        if (
            $existingUjian !== null
            && $mode === 'normal'
            && $hasQuestions
            && $existingUjian->bankSoals()->whereNotIn('tipe_soal', ['pg', 'esai'])->exists()
        ) {
            throw ValidationException::withMessages([
                'mode_ujian' => 'Ujian yang memiliki soal AKM tidak dapat diubah ke mode Normal.',
            ]);
        }

        if ($startsAt->isPast() && $validated['waktu_mulai'] !== $existingStart) {
            throw ValidationException::withMessages([
                'waktu_mulai' => 'Waktu mulai ujian harus berada di masa depan.',
            ]);
        }

        return [
            'mapel_id' => $validated['mapel_id'],
            'kelas_id' => $validated['kelas_id'],
            'judul_ujian' => $validated['judul_ujian'],
            'waktu_mulai' => $startsAt,
            'durasi_menit' => $validated['durasi_menit'],
            'acak_soal' => $validated['acak_soal'],
            'mode_ujian' => $mode,
            'maks_pelanggaran' => $validated['maks_pelanggaran'] ?? $existingUjian?->maks_pelanggaran ?? 3,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedQuestion(Request $request, Ujian $ujian): array
    {
        $type = $request->input('tipe_soal', 'pg');
        $allowedTypes = $ujian->mode_ujian === 'akm'
            ? ['pg', 'pg_kompleks', 'menjodohkan', 'isian_singkat', 'esai']
            : ['pg', 'esai'];
        if (! in_array($type, $allowedTypes, true)) {
            throw ValidationException::withMessages([
                'tipe_soal' => 'Jenis soal tidak tersedia untuk mode ujian ini.',
            ]);
        }

        $rules = [
            'tipe_soal' => ['sometimes', Rule::in($allowedTypes)],
            'pertanyaan' => ['required', 'string', 'max:10000'],
            'bobot' => ['sometimes', 'integer', 'min:1', 'max:1000'],
            'gambar_soal' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ];

        if ($type === 'pg') {
            foreach (['a', 'b', 'c', 'd', 'e'] as $option) {
                $rules["opsi_{$option}"] = ['required', 'string', 'max:5000'];
                $rules["gambar_{$option}"] = ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'];
            }

            $rules['kunci_jawaban'] = ['required', Rule::in(['A', 'B', 'C', 'D', 'E'])];
        } elseif ($type === 'pg_kompleks') {
            $rules['opsi_json'] = ['required', 'array'];
            $rules['opsi_json.opsi'] = ['required', 'array', 'min:2', 'max:5'];
            $rules['opsi_json.opsi.*'] = ['required', 'string', 'max:5000'];
            $rules['opsi_json.kunci_jawaban'] = ['required', 'array', 'min:1'];
            $rules['opsi_json.kunci_jawaban.*'] = ['required', 'integer', 'min:0'];

            foreach (['a', 'b', 'c', 'd', 'e'] as $option) {
                $rules["gambar_{$option}"] = ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'];
            }
        } elseif ($type === 'menjodohkan') {
            $rules['opsi_json'] = ['required', 'array'];
            $rules['opsi_json.pasangan_kiri'] = ['required', 'array', 'min:3', 'max:10'];
            $rules['opsi_json.pasangan_kiri.*'] = ['required', 'string', 'max:1000'];
            $rules['opsi_json.pasangan_kanan'] = ['required', 'array', 'min:3', 'max:10'];
            $rules['opsi_json.pasangan_kanan.*'] = ['required', 'string', 'max:1000'];
            $rules['opsi_json.kunci_jawaban'] = ['required', 'array', 'min:1'];
            $rules['opsi_json.kunci_jawaban.*'] = ['required', 'integer', 'min:0'];
        } elseif ($type === 'isian_singkat') {
            $rules['opsi_json'] = ['required', 'array'];
            $rules['opsi_json.kunci_jawaban'] = ['required', 'array', 'min:1'];
            $rules['opsi_json.kunci_jawaban.*'] = ['required', 'string', 'max:1000'];
        }

        $validated = $request->validate($rules, [
            'pertanyaan.required' => 'Pertanyaan wajib diisi.',
            'opsi_a.required' => 'Opsi A wajib diisi.',
            'opsi_b.required' => 'Opsi B wajib diisi.',
            'opsi_c.required' => 'Opsi C wajib diisi.',
            'opsi_d.required' => 'Opsi D wajib diisi.',
            'opsi_e.required' => 'Opsi E wajib diisi.',
            'kunci_jawaban.in' => 'Pilih salah satu kunci jawaban A sampai E.',
        ]);

        $options = $validated['opsi_json'] ?? [];

        if ($type === 'menjodohkan') {
            $leftCount = count($options['pasangan_kiri'] ?? []);
            $rightCount = count($options['pasangan_kanan'] ?? []);

            if ($leftCount !== $rightCount || count($options['kunci_jawaban'] ?? []) !== $leftCount) {
                throw ValidationException::withMessages([
                    'opsi_json' => 'Setiap pasangan menjodohkan harus memiliki satu pilihan jawaban yang benar.',
                ]);
            }

            foreach ($options['kunci_jawaban'] as $rightIndex) {
                if (! is_numeric($rightIndex) || (int) $rightIndex < 0 || (int) $rightIndex >= $rightCount) {
                    throw ValidationException::withMessages([
                        'opsi_json.kunci_jawaban' => 'Kunci pasangan harus menunjuk ke pilihan kanan yang tersedia.',
                    ]);
                }
            }
        }

        if ($type === 'pg_kompleks') {
            $optionCount = count($options['opsi'] ?? []);

            foreach ($options['kunci_jawaban'] as $optionIndex) {
                if (! is_numeric($optionIndex) || (int) $optionIndex < 0 || (int) $optionIndex >= $optionCount) {
                    throw ValidationException::withMessages([
                        'opsi_json.kunci_jawaban' => 'Kunci PG kompleks harus menunjuk ke opsi yang tersedia.',
                    ]);
                }
            }
        }

        return [
            'pertanyaan' => $validated['pertanyaan'],
            'opsi_a' => $validated['opsi_a'] ?? '',
            'opsi_b' => $validated['opsi_b'] ?? '',
            'opsi_c' => $validated['opsi_c'] ?? '',
            'opsi_d' => $validated['opsi_d'] ?? '',
            'opsi_e' => $validated['opsi_e'] ?? '',
            'kunci_jawaban' => $type === 'pg' ? $validated['kunci_jawaban'] : 'A',
            'tipe_soal' => $type,
            'bobot' => (int) ($validated['bobot'] ?? 1),
            'opsi_json' => match ($type) {
                'pg_kompleks' => [
                    'opsi' => array_values($options['opsi']),
                    'kunci_jawaban' => array_values(array_map('strval', $options['kunci_jawaban'])),
                ],
                'menjodohkan' => [
                    'pasangan_kiri' => array_values($options['pasangan_kiri']),
                    'pasangan_kanan' => array_values($options['pasangan_kanan']),
                    'kunci_jawaban' => array_values(array_map('strval', $options['kunci_jawaban'])),
                ],
                'isian_singkat' => [
                    'kunci_jawaban' => array_values($options['kunci_jawaban']),
                ],
                default => null,
            },
        ];
    }

    /**
     * @param  array<string, mixed>  $question
     * @return array<string, mixed>
     */
    private function storeQuestionImages(Request $request, array $question): array
    {
        $fields = ['gambar_soal'];
        if (in_array($question['tipe_soal'], ['pg', 'pg_kompleks'], true)) {
            $fields = [...$fields, 'gambar_a', 'gambar_b', 'gambar_c', 'gambar_d', 'gambar_e'];
        }

        foreach ($fields as $field) {
            if ($request->hasFile($field)) {
                $question[$field] = $request->file($field)->store('soal-images', 'public');
            }
        }

        return $question;
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array<string, mixed>
     */
    private function questionFromSpreadsheetRow(array $row, Ujian $ujian): array
    {
        $typeMap = [
            'PG' => 'pg',
            'PGK' => 'pg_kompleks',
            'JODOH' => 'menjodohkan',
            'ISIAN' => 'isian_singkat',
            'ESAI' => 'esai',
        ];
        $typeValue = mb_strtoupper(trim((string) ($row['tipe_soal'] ?? 'PG')));
        $type = $typeMap[$typeValue] ?? null;

        if ($type === null) {
            throw ValidationException::withMessages(['tipe_soal' => 'Isi tipe_soal dengan PG, PGK, JODOH, ISIAN, atau ESAI.']);
        }

        if ($ujian->mode_ujian !== 'akm' && ! in_array($type, ['pg', 'esai'], true)) {
            throw ValidationException::withMessages(['tipe_soal' => 'Jenis soal AKM hanya dapat diimpor pada ujian mode AKM.']);
        }

        $options = [];

        if ($type === 'pg_kompleks') {
            $options['opsi'] ??= array_values(array_filter([
                $row['opsi_a'] ?? null,
                $row['opsi_b'] ?? null,
                $row['opsi_c'] ?? null,
                $row['opsi_d'] ?? null,
                $row['opsi_e'] ?? null,
            ], static fn (mixed $option): bool => is_string($option) && trim($option) !== ''));

            $options['kunci_jawaban'] ??= array_map(
                static fn (string $answer): string => (string) (ord($answer) - ord('A')),
                array_filter(array_map('trim', explode(',', mb_strtoupper((string) ($row['kunci_jawaban'] ?? ''))))),
            );

            $options['kunci_jawaban'] = array_map(
                static fn (mixed $answer): string => is_string($answer)
                    && preg_match('/^[A-E]$/i', $answer) === 1
                    ? (string) (ord(mb_strtoupper($answer)) - ord('A'))
                    : (string) $answer,
                $options['kunci_jawaban'],
            );
        } elseif ($type === 'menjodohkan') {
            $matchingOptions = $this->matchingOptionsFromSpreadsheetRow($row);

            if ($matchingOptions !== null) {
                $options = [...$options, ...$matchingOptions];
            }
        } elseif ($type === 'isian_singkat') {
            $options['kunci_jawaban'] ??= array_values(array_filter(
                array_map('trim', preg_split('/[|;]/', (string) ($row['kunci_jawaban'] ?? '')) ?: []),
            ));
        }

        $validated = Validator::make([
            ...$row,
            'tipe_soal' => $type,
            'bobot' => $row['bobot'] ?? 1,
            'opsi_json' => $options,
        ], [
            'pertanyaan' => ['required', 'string', 'max:10000'],
            'opsi_a' => [Rule::requiredIf($type === 'pg'), 'nullable', 'string', 'max:5000'],
            'opsi_b' => [Rule::requiredIf($type === 'pg'), 'nullable', 'string', 'max:5000'],
            'opsi_c' => [Rule::requiredIf($type === 'pg'), 'nullable', 'string', 'max:5000'],
            'opsi_d' => [Rule::requiredIf($type === 'pg'), 'nullable', 'string', 'max:5000'],
            'opsi_e' => [Rule::requiredIf($type === 'pg'), 'nullable', 'string', 'max:5000'],
            'kunci_jawaban' => [
                Rule::requiredIf($type === 'pg'),
                'nullable',
                Rule::in(['A', 'B', 'C', 'D', 'E']),
            ],
            'bobot' => ['required', 'integer', 'min:1', 'max:1000'],
            'opsi_json.opsi' => ['required_if:tipe_soal,pg_kompleks', 'array', 'min:2', 'max:5'],
            'opsi_json.opsi.*' => ['required', 'string', 'max:5000'],
            'opsi_json.kunci_jawaban' => [
                Rule::requiredIf(in_array($type, ['pg_kompleks', 'menjodohkan', 'isian_singkat'], true)),
                'array',
                'min:1',
            ],
            'opsi_json.kunci_jawaban.*' => $type === 'isian_singkat'
                ? ['required', 'string', 'max:1000']
                : ['required', 'integer', 'min:0'],
            'opsi_json.pasangan_kiri' => ['required_if:tipe_soal,menjodohkan', 'array', 'min:3', 'max:10'],
            'opsi_json.pasangan_kiri.*' => ['required', 'string', 'max:1000'],
            'opsi_json.pasangan_kanan' => ['required_if:tipe_soal,menjodohkan', 'array', 'min:3', 'max:10'],
            'opsi_json.pasangan_kanan.*' => ['required', 'string', 'max:1000'],
        ])->validate();

        if ($type === 'pg_kompleks') {
            foreach ($validated['opsi_json']['kunci_jawaban'] as $optionIndex) {
                if (! ctype_digit((string) $optionIndex) || (int) $optionIndex >= count($validated['opsi_json']['opsi'])) {
                    throw ValidationException::withMessages([
                        'opsi_json' => 'Kunci PG kompleks harus menunjuk ke opsi yang tersedia.',
                    ]);
                }
            }
        }

        if ($type === 'menjodohkan') {
            $leftCount = count($validated['opsi_json']['pasangan_kiri']);
            $rightCount = count($validated['opsi_json']['pasangan_kanan']);
            $answerKeys = $validated['opsi_json']['kunci_jawaban'];

            if ($leftCount !== $rightCount || count($answerKeys) !== $leftCount) {
                throw ValidationException::withMessages([
                    'opsi_json' => 'Setiap pasangan menjodohkan harus memiliki satu pilihan jawaban yang benar.',
                ]);
            }

            foreach ($answerKeys as $rightIndex) {
                if (! ctype_digit((string) $rightIndex) || (int) $rightIndex >= $rightCount) {
                    throw ValidationException::withMessages([
                        'opsi_json' => 'Kunci pasangan harus menunjuk ke pilihan kanan yang tersedia.',
                    ]);
                }
            }
        }

        return [
            'pertanyaan' => $validated['pertanyaan'],
            'opsi_a' => $validated['opsi_a'] ?? '',
            'opsi_b' => $validated['opsi_b'] ?? '',
            'opsi_c' => $validated['opsi_c'] ?? '',
            'opsi_d' => $validated['opsi_d'] ?? '',
            'opsi_e' => $validated['opsi_e'] ?? '',
            'kunci_jawaban' => $type === 'pg' ? $validated['kunci_jawaban'] : 'A',
            'tipe_soal' => $type,
            'bobot' => (int) $validated['bobot'],
            'opsi_json' => $type === 'esai' ? null : ($validated['opsi_json'] ?? null),
        ];
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array{pasangan_kiri: array<int, string>, pasangan_kanan: array<int, string>, kunci_jawaban: array<int, string>}|null
     */
    private function matchingOptionsFromSpreadsheetRow(array $row): ?array
    {
        $leftItems = [];
        $rightItems = [];
        $correctAnswers = [];

        for ($pairNumber = 1; $pairNumber <= self::MAX_MATCHING_PAIRS; $pairNumber++) {
            $left = trim((string) ($row["pasangan_kiri_{$pairNumber}"] ?? ''));
            $right = trim((string) ($row["pasangan_kanan_{$pairNumber}"] ?? ''));
            $correctAnswer = trim((string) ($row["jawaban_benar_{$pairNumber}"] ?? ''));

            if ($left === '' && $right === '' && $correctAnswer === '') {
                continue;
            }

            if ($left === '' || $right === '' || $correctAnswer === '') {
                throw ValidationException::withMessages([
                    'opsi_json' => "Lengkapi kolom kiri, kanan, dan jawaban benar pada pasangan {$pairNumber}.",
                ]);
            }

            $leftItems[] = $left;
            $rightItems[] = $right;
            $correctAnswers[] = $correctAnswer;
        }

        if ($leftItems === []) {
            return null;
        }

        if (count($leftItems) < 3) {
            throw ValidationException::withMessages([
                'opsi_json' => 'Soal menjodohkan minimal harus memiliki 3 pasangan lengkap.',
            ]);
        }

        if (count(array_unique($rightItems)) !== count($rightItems)) {
            throw ValidationException::withMessages([
                'opsi_json' => 'Setiap pilihan Pasangan kanan harus berbeda agar jawaban benar dapat dikenali.',
            ]);
        }

        $answerIndexes = [];
        foreach ($correctAnswers as $index => $answer) {
            $rightIndex = array_search($answer, $rightItems, true);

            if ($rightIndex === false) {
                throw ValidationException::withMessages([
                    'opsi_json' => 'Jawaban benar harus sama persis dengan salah satu pilihan Pasangan kanan.',
                ]);
            }

            $answerIndexes[$index] = (string) $rightIndex;
        }

        return [
            'pasangan_kiri' => $leftItems,
            'pasangan_kanan' => $rightItems,
            'kunci_jawaban' => $answerIndexes,
        ];
    }

    private function ensureOwnership(Ujian $ujian, Guru $guru): void
    {
        abort_unless((int) $ujian->guru_id === (int) $guru->id, 404);
    }

    private function ensureQuestionBelongsToExam(Ujian $ujian, BankSoal $soal): void
    {
        abort_unless((int) $soal->ujian_id === (int) $ujian->id, 404);
    }

    /**
     * @return Builder<Siswa>
     */
    private function resultStudents(Ujian $ujian): Builder
    {
        return Siswa::query()
            ->where('kelas_id', $ujian->kelas_id)
            ->where('status_siswa', 'aktif')
            ->with([
                'hasilUjians' => fn (HasMany $query) => $query
                    ->where('ujian_id', $ujian->id)
                    ->select(
                        'id',
                        'ujian_id',
                        'siswa_id',
                        'status_pengerjaan',
                        'skor_akhir',
                        'jawaban_json',
                        'jumlah_pelanggaran',
                        'catatan_pelanggaran',
                        'updated_at',
                    ),
            ])
            ->orderBy('nama_lengkap');
    }

    /**
     * @param  Collection<int, BankSoal>  $questions
     * @return array{id: int, nama_lengkap: string, nisn: ?string, status_pengerjaan: string, status_label: string, waktu_selesai: ?string, skor_akhir: string|null, jumlah_pelanggaran: int, catatan_pelanggaran: ?string, esai: array<int, array{id: int, pertanyaan: string, jawaban: string, bobot: int, skor: float|null}>}
     */
    private function studentResult(Siswa $siswa, Collection $questions): array
    {
        $attempt = $siswa->hasilUjians->first();
        $answers = $attempt?->jawaban_json ?? [];
        $essayScores = $answers['_nilai_esai'] ?? [];

        return [
            'id' => $siswa->id,
            'nama_lengkap' => $siswa->nama_lengkap,
            'nisn' => $siswa->nisn,
            'status_pengerjaan' => $attempt?->status_pengerjaan ?? 'belum_mulai',
            'status_label' => match ($attempt?->status_pengerjaan) {
                'sedang_mengerjakan' => 'Sedang Mengerjakan',
                'selesai' => 'Selesai',
                default => 'Belum Mulai',
            },
            'waktu_selesai' => $attempt?->status_pengerjaan === 'selesai'
                ? $attempt->updated_at?->setTimezone('Asia/Jakarta')->format('d/m/Y H:i')
                : null,
            'skor_akhir' => $attempt?->skor_akhir,
            'jumlah_pelanggaran' => $attempt?->jumlah_pelanggaran ?? 0,
            'catatan_pelanggaran' => $attempt?->catatan_pelanggaran,
            'esai' => $attempt?->status_pengerjaan === 'selesai'
                ? $questions->where('tipe_soal', 'esai')->map(fn (BankSoal $question): array => [
                    'id' => $question->id,
                    'pertanyaan' => $question->pertanyaan,
                    'jawaban' => is_string($answers[(string) $question->id] ?? null)
                        ? $answers[(string) $question->id]
                        : '',
                    'bobot' => (int) $question->bobot,
                    'skor' => isset($essayScores[(string) $question->id])
                        ? (float) $essayScores[(string) $question->id]
                        : null,
                ])->values()->all()
                : [],
        ];
    }
}
