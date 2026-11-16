<?php

namespace App\Http\Controllers\Guru;

use App\Http\Controllers\Controller;
use App\Models\BankSoal;
use App\Models\Guru;
use App\Models\Jadwal;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\Ujian;
use App\Support\SpreadsheetFile;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
    ];

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

        return Inertia::render('Guru/Ujian/Index', [
            'ujians' => Ujian::query()
                ->where('guru_id', $guru->id)
                ->with([
                    'kelas:id,nama_kelas',
                    'mataPelajaran:id,kode_mapel,nama_mapel',
                    'bankSoals:id,ujian_id,pertanyaan,opsi_a,opsi_b,opsi_c,opsi_d,opsi_e,kunci_jawaban',
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
                    ]),
                ]),
            'kelasOptions' => $assignments->pluck('kelas')->unique('id')->values(),
            'mapelOptions' => $assignments->pluck('mataPelajaran')->unique('id')->values(),
            'assignments' => $assignments->map(fn (Jadwal $jadwal): array => [
                'kelas_id' => $jadwal->kelas_id,
                'mapel_id' => $jadwal->mapel_id,
            ]),
            'isWaliKelas' => $guru->is_wali_kelas,
            'tahunAjaranAktif' => $tahunAjaranAktif
                ? "{$tahunAjaranAktif->nama_tahun} · {$tahunAjaranAktif->semester}"
                : null,
        ]);
    }

    public function resultsIndex(Request $request): Response
    {
        $guru = $this->teacher($request);
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
            'isWaliKelas' => $guru->is_wali_kelas,
        ]);
    }

    public function results(Request $request, Ujian $ujian): Response
    {
        $guru = $this->teacher($request);
        $this->ensureOwnership($ujian, $guru);
        $ujian->loadMissing(['kelas:id,nama_kelas', 'mataPelajaran:id,nama_mapel']);

        return Inertia::render('Guru/Ujian/Results', [
            'ujian' => [
                'id' => $ujian->id,
                'judul_ujian' => $ujian->judul_ujian,
                'kelas' => $ujian->kelas?->nama_kelas,
                'mata_pelajaran' => $ujian->mataPelajaran?->nama_mapel,
            ],
            'isWaliKelas' => $guru->is_wali_kelas,
            'students' => $this->resultStudents($ujian)
                ->get()
                ->map(fn (Siswa $siswa): array => $this->studentResult($siswa))
                ->values(),
        ]);
    }

    public function exportResults(Request $request, Ujian $ujian): StreamedResponse
    {
        $guru = $this->teacher($request);
        $this->ensureOwnership($ujian, $guru);
        $students = $this->resultStudents($ujian);

        return response()->streamDownload(function () use ($students): void {
            $spreadsheet = new Spreadsheet;
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle('Hasil Ujian');
            $sheet->fromArray([self::RESULT_HEADERS], null, 'A1');

            $rowNumber = 2;
            foreach ($students->lazyById(500) as $siswa) {
                $result = $this->studentResult($siswa);
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

        return SpreadsheetFile::downloadTemplate(
            'template-soal-ujian-'.$ujian->id.'.xlsx',
            self::QUESTION_HEADERS,
        );
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
        $rows = SpreadsheetFile::readRows($validated['file'], self::QUESTION_HEADERS);
        $questions = [];
        $errors = [];

        foreach ($rows as $item) {
            $validator = Validator::make($item['data'], [
                'pertanyaan' => ['required', 'string', 'max:10000'],
                'opsi_a' => ['required', 'string', 'max:5000'],
                'opsi_b' => ['required', 'string', 'max:5000'],
                'opsi_c' => ['required', 'string', 'max:5000'],
                'opsi_d' => ['required', 'string', 'max:5000'],
                'opsi_e' => ['required', 'string', 'max:5000'],
                'kunci_jawaban' => ['required', Rule::in(['A', 'B', 'C', 'D', 'E'])],
            ]);

            if ($validator->fails()) {
                $errors[] = "Baris {$item['row']}: ".implode(' ', $validator->errors()->all());

                continue;
            }

            $questions[] = $validator->validated();
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

    public function update(Request $request, Ujian $ujian): RedirectResponse
    {
        $guru = $this->teacher($request);
        $this->ensureOwnership($ujian, $guru);

        if ($ujian->hasilUjians()->exists()) {
            return back()->with('error', 'Jadwal ujian tidak dapat diubah setelah ada siswa yang mulai mengerjakan.');
        }

        $ujian->update($this->validatedExam($request, $guru));

        return to_route('guru.ujian.index')->with('success', 'Jadwal ujian berhasil diperbarui.');
    }

    public function destroy(Request $request, Ujian $ujian): RedirectResponse
    {
        $guru = $this->teacher($request);
        $this->ensureOwnership($ujian, $guru);

        if ($ujian->hasilUjians()->exists()) {
            return back()->with('error', 'Ujian tidak dapat dihapus karena sudah memiliki riwayat pengerjaan.');
        }

        $ujian->delete();

        return to_route('guru.ujian.index')->with('success', 'Ujian berhasil dihapus.');
    }

    public function storeQuestion(Request $request, Ujian $ujian): RedirectResponse
    {
        $guru = $this->teacher($request);
        $this->ensureOwnership($ujian, $guru);

        if ($ujian->hasilUjians()->exists()) {
            return back()->with('error', 'Bank soal tidak dapat diubah setelah ada siswa yang mulai mengerjakan.');
        }

        $ujian->bankSoals()->create($this->validatedQuestion($request));

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

        $soal->update($this->validatedQuestion($request));

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
    private function validatedExam(Request $request, Guru $guru): array
    {
        $validated = $request->validate([
            'mapel_id' => ['required', 'integer', Rule::exists('mata_pelajarans', 'id')],
            'kelas_id' => ['required', 'integer', Rule::exists('kelas', 'id')],
            'judul_ujian' => ['required', 'string', 'max:255'],
            'waktu_mulai' => ['required', 'date_format:Y-m-d\TH:i'],
            'durasi_menit' => ['required', 'integer', 'min:1', 'max:360'],
            'acak_soal' => ['required', 'boolean'],
        ], [
            'mapel_id.required' => 'Mata pelajaran wajib dipilih.',
            'kelas_id.required' => 'Kelas wajib dipilih.',
            'waktu_mulai.date_format' => 'Format waktu mulai tidak valid.',
            'durasi_menit.min' => 'Durasi ujian minimal satu menit.',
            'durasi_menit.max' => 'Durasi ujian maksimal enam jam.',
        ]);

        $tahunAjaranAktif = TahunAjaran::query()->where('is_aktif', true)->first();
        $isAssigned = $tahunAjaranAktif && Jadwal::query()
            ->where('tahun_ajaran_id', $tahunAjaranAktif->id)
            ->where('guru_id', $guru->id)
            ->where('kelas_id', $validated['kelas_id'])
            ->where('mapel_id', $validated['mapel_id'])
            ->exists();

        if (! $isAssigned) {
            throw ValidationException::withMessages([
                'kelas_id' => 'Ujian hanya dapat dibuat untuk kelas dan mata pelajaran yang Anda ampu pada tahun ajaran aktif.',
            ]);
        }

        $startsAt = Carbon::createFromFormat('Y-m-d\TH:i', $validated['waktu_mulai'], self::TIMEZONE)->utc();

        if ($startsAt->isPast()) {
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
        ];
    }

    /**
     * @return array<string, string>
     */
    private function validatedQuestion(Request $request): array
    {
        return $request->validate([
            'pertanyaan' => ['required', 'string', 'max:10000'],
            'opsi_a' => ['required', 'string', 'max:5000'],
            'opsi_b' => ['required', 'string', 'max:5000'],
            'opsi_c' => ['required', 'string', 'max:5000'],
            'opsi_d' => ['required', 'string', 'max:5000'],
            'opsi_e' => ['required', 'string', 'max:5000'],
            'kunci_jawaban' => ['required', Rule::in(['A', 'B', 'C', 'D', 'E'])],
        ], [
            'pertanyaan.required' => 'Pertanyaan wajib diisi.',
            'opsi_e.required' => 'Opsi E wajib diisi.',
            'kunci_jawaban.in' => 'Pilih salah satu kunci jawaban A sampai E.',
        ]);
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
                    ->select('id', 'ujian_id', 'siswa_id', 'status_pengerjaan', 'skor_akhir', 'updated_at'),
            ])
            ->orderBy('nama_lengkap');
    }

    /**
     * @return array{id: int, nama_lengkap: string, nisn: ?string, status_pengerjaan: string, status_label: string, waktu_selesai: ?string, skor_akhir: string|null}
     */
    private function studentResult(Siswa $siswa): array
    {
        $attempt = $siswa->hasilUjians->first();

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
        ];
    }
}
