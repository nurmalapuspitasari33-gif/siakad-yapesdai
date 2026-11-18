<?php

namespace App\Http\Controllers\Siswa;

use App\Http\Controllers\Controller;
use App\Models\BankSoal;
use App\Models\HasilUjian;
use App\Models\Siswa;
use App\Models\Ujian;
use App\Support\ExamScoring;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class UjianController extends Controller
{
    public function index(Request $request): Response
    {
        $siswa = $this->activeStudent($request);
        $now = now();

        $ujians = Ujian::query()
            ->where('kelas_id', $siswa->kelas_id)
            ->where('waktu_mulai', '<=', $now)
            ->with([
                'mataPelajaran:id,nama_mapel',
                'guru:id,nama_lengkap',
                'hasilUjians' => fn ($query) => $query
                    ->where('siswa_id', $siswa->id)
                    ->select('id', 'ujian_id', 'siswa_id', 'skor_akhir', 'status_pengerjaan', 'created_at'),
            ])
            ->withCount('bankSoals')
            ->orderByDesc('waktu_mulai')
            ->get()
            ->filter(fn (Ujian $ujian): bool => $ujian->waktu_mulai
                ->copy()
                ->addMinutes($ujian->durasi_menit)
                ->isFuture()
                || $ujian->hasilUjians->isNotEmpty())
            ->map(function (Ujian $ujian): array {
                $attempt = $ujian->hasilUjians->first();
                $scheduledEnd = $ujian->waktu_mulai->copy()->addMinutes($ujian->durasi_menit);

                return [
                    'id' => $ujian->id,
                    'judul_ujian' => $ujian->judul_ujian,
                    'mata_pelajaran' => $ujian->mataPelajaran?->nama_mapel,
                    'guru' => $ujian->guru?->nama_lengkap,
                    'waktu_mulai' => $ujian->waktu_mulai->toIso8601String(),
                    'durasi_menit' => $ujian->durasi_menit,
                    'jumlah_soal' => $ujian->bank_soals_count,
                    'mode_ujian' => $ujian->mode_ujian ?? 'normal',
                    'status_pengerjaan' => $attempt?->status_pengerjaan,
                    'skor_akhir' => $attempt?->skor_akhir,
                    'dapat_dilanjutkan' => $attempt?->status_pengerjaan === 'sedang_mengerjakan'
                        && $scheduledEnd->isFuture()
                        && $attempt->created_at->copy()->addMinutes($ujian->durasi_menit)->isFuture(),
                    'dapat_dimulai' => $ujian->bank_soals_count > 0
                        && $scheduledEnd->isFuture()
                        && $attempt === null,
                ];
            })
            ->values();

        return Inertia::render('Siswa/Ujian/Index', ['ujians' => $ujians]);
    }

    public function start(Request $request, Ujian $ujian): RedirectResponse
    {
        $siswa = $this->activeStudent($request);
        abort_unless((int) $ujian->kelas_id === (int) $siswa->kelas_id, 404);

        if ($ujian->bankSoals()->doesntExist()) {
            return back()->with('error', 'Ujian belum memiliki soal sehingga belum dapat dimulai.');
        }

        $now = now();
        $scheduledEnd = $ujian->waktu_mulai->copy()->addMinutes($ujian->durasi_menit);
        abort_unless($now->greaterThanOrEqualTo($ujian->waktu_mulai) && $now->lessThan($scheduledEnd), 403);

        DB::transaction(function () use ($ujian, $siswa, $now, $scheduledEnd): void {
            $attempt = HasilUjian::query()
                ->where('ujian_id', $ujian->id)
                ->where('siswa_id', $siswa->id)
                ->lockForUpdate()
                ->first();

            if (! $attempt) {
                HasilUjian::create([
                    'ujian_id' => $ujian->id,
                    'siswa_id' => $siswa->id,
                    'jawaban_json' => [],
                    'status_pengerjaan' => 'sedang_mengerjakan',
                ]);

                return;
            }

            if (
                $attempt->status_pengerjaan === 'sedang_mengerjakan'
                && $now->greaterThanOrEqualTo($this->deadline($ujian, $attempt, $scheduledEnd))
            ) {
                $this->finalizeAttempt($ujian, $attempt, $attempt->jawaban_json ?? []);
            }
        });

        return to_route('siswa.ujian.show', $ujian);
    }

    public function show(Request $request, Ujian $ujian): Response|RedirectResponse
    {
        $siswa = $this->activeStudent($request);
        abort_unless((int) $ujian->kelas_id === (int) $siswa->kelas_id, 404);

        $attempt = HasilUjian::query()
            ->where('ujian_id', $ujian->id)
            ->where('siswa_id', $siswa->id)
            ->first();

        if (! $attempt) {
            return to_route('siswa.ujian.index');
        }

        $scheduledEnd = $ujian->waktu_mulai->copy()->addMinutes($ujian->durasi_menit);
        if (
            $attempt->status_pengerjaan === 'sedang_mengerjakan'
            && now()->greaterThanOrEqualTo($this->deadline($ujian, $attempt, $scheduledEnd))
        ) {
            DB::transaction(function () use ($ujian, $attempt): void {
                $lockedAttempt = HasilUjian::query()->lockForUpdate()->findOrFail($attempt->id);

                if ($lockedAttempt->status_pengerjaan === 'sedang_mengerjakan') {
                    $this->finalizeAttempt($ujian, $lockedAttempt, $lockedAttempt->jawaban_json ?? []);
                }
            });
            $attempt->refresh();
        }

        $questions = $attempt->status_pengerjaan === 'selesai'
            ? collect()
            : $ujian->bankSoals()
                ->select([
                    'id',
                    'ujian_id',
                    'pertanyaan',
                    'opsi_a',
                    'opsi_b',
                    'opsi_c',
                    'opsi_d',
                    'opsi_e',
                    'kunci_jawaban',
                    'tipe_soal',
                    'bobot',
                    'gambar_soal',
                    'gambar_a',
                    'gambar_b',
                    'gambar_c',
                    'gambar_d',
                    'gambar_e',
                    'opsi_json',
                ])
                ->when($ujian->acak_soal, fn ($query) => $query->inRandomOrder())
                ->get()
                ->map(function (BankSoal $question): array {
                    $type = $question->tipe_soal ?? 'pg';
                    $questionOptions = match ($type) {
                        'pg_kompleks' => collect($question->opsi_json['opsi'] ?? [])
                            ->mapWithKeys(fn (string $option, int $index): array => [(string) $index => $option])
                            ->all(),
                        'menjodohkan' => [],
                        default => [
                            'A' => $question->opsi_a,
                            'B' => $question->opsi_b,
                            'C' => $question->opsi_c,
                            'D' => $question->opsi_d,
                            'E' => $question->opsi_e,
                        ],
                    };
                    $displayOptions = match ($type) {
                        'menjodohkan' => [
                            'pasangan_kiri' => $question->opsi_json['pasangan_kiri'] ?? [],
                            'pasangan_kanan' => $question->opsi_json['pasangan_kanan'] ?? [],
                        ],
                        default => [],
                    };

                    return [
                        'id' => $question->id,
                        'pertanyaan' => $question->pertanyaan,
                        'tipe_soal' => $type,
                        'bobot' => $question->bobot ?? 1,
                        'opsi' => $questionOptions,
                        'opsi_json' => $displayOptions,
                        'gambar_soal' => $this->imageUrl($question->gambar_soal),
                        'gambar_opsi' => [
                            'A' => $this->imageUrl($question->gambar_a),
                            'B' => $this->imageUrl($question->gambar_b),
                            'C' => $this->imageUrl($question->gambar_c),
                            'D' => $this->imageUrl($question->gambar_d),
                            'E' => $this->imageUrl($question->gambar_e),
                        ],
                    ];
                });

        $endsAt = $this->deadline($ujian, $attempt, $scheduledEnd);

        return Inertia::render('Siswa/Ujian/Show', [
            'ujian' => [
                'id' => $ujian->id,
                'judul_ujian' => $ujian->judul_ujian,
                'mata_pelajaran' => $ujian->mataPelajaran()->value('nama_mapel'),
                'durasi_menit' => $ujian->durasi_menit,
                'mode_ujian' => $ujian->mode_ujian ?? 'normal',
                'maks_pelanggaran' => $ujian->maks_pelanggaran ?? 3,
                'ends_at' => $endsAt->toIso8601String(),
            ],
            'attempt' => [
                'id' => $attempt->id,
                'status' => $attempt->status_pengerjaan,
                'skor_akhir' => $attempt->skor_akhir,
                'jawaban' => $attempt->jawaban_json ?? [],
                'jumlah_pelanggaran' => $attempt->jumlah_pelanggaran ?? 0,
            ],
            'questions' => $questions,
        ]);
    }

    public function saveAnswer(Request $request, Ujian $ujian): JsonResponse
    {
        $siswa = $this->activeStudent($request);
        abort_unless((int) $ujian->kelas_id === (int) $siswa->kelas_id, 404);

        $validated = $request->validate(['question_id' => ['required', 'integer']]);

        $question = $ujian->bankSoals()
            ->whereKey($validated['question_id'])
            ->firstOrFail();
        $answer = $this->validateQuestionAnswer($question, $request->input('answer'));

        $attempt = HasilUjian::query()
            ->where('ujian_id', $ujian->id)
            ->where('siswa_id', $siswa->id)
            ->firstOrFail();
        $scheduledEnd = $ujian->waktu_mulai->copy()->addMinutes($ujian->durasi_menit);

        DB::transaction(function () use ($attempt, $ujian, $scheduledEnd, $validated, $answer): void {
            $lockedAttempt = HasilUjian::query()->lockForUpdate()->findOrFail($attempt->id);
            abort_unless($lockedAttempt->status_pengerjaan === 'sedang_mengerjakan', 403);
            abort_unless(now()->lessThan($this->deadline($ujian, $lockedAttempt, $scheduledEnd)), 410);

            $answers = $lockedAttempt->jawaban_json ?? [];
            $questionKey = (string) $validated['question_id'];

            if ($answer === null) {
                unset($answers[$questionKey]);
            } else {
                $answers[$questionKey] = $answer;
            }

            $lockedAttempt->update(['jawaban_json' => $answers]);
        });

        return response()->json(['saved' => true]);
    }

    public function recordViolation(Request $request, Ujian $ujian): JsonResponse
    {
        $siswa = $this->activeStudent($request);
        abort_unless((int) $ujian->kelas_id === (int) $siswa->kelas_id, 404);

        $validated = $request->validate([
            'reason' => ['required', Rule::in(['fullscreen', 'visibility', 'blur'])],
        ]);
        $scheduledEnd = $ujian->waktu_mulai->copy()->addMinutes($ujian->durasi_menit);
        $result = DB::transaction(function () use ($ujian, $siswa, $scheduledEnd, $validated): array {
            $attempt = $ujian->hasilUjians()
                ->where('siswa_id', $siswa->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($attempt->status_pengerjaan !== 'sedang_mengerjakan') {
                return [
                    'jumlah_pelanggaran' => (int) $attempt->jumlah_pelanggaran,
                    'maks_pelanggaran' => (int) ($ujian->maks_pelanggaran ?? 3),
                    'finished' => true,
                ];
            }

            $labels = [
                'fullscreen' => 'Keluar dari layar penuh',
                'visibility' => 'Berpindah tab atau aplikasi',
                'blur' => 'Jendela ujian kehilangan fokus',
            ];
            $count = (int) $attempt->jumlah_pelanggaran + 1;
            $entry = now()->toDateTimeString().' - '.$labels[$validated['reason']];
            $notes = trim(($attempt->catatan_pelanggaran ?? '')."\n".$entry);
            $attempt->update([
                'jumlah_pelanggaran' => $count,
                'catatan_pelanggaran' => mb_substr($notes, -10000),
            ]);

            $maximum = max(1, (int) ($ujian->maks_pelanggaran ?? 3));
            $finished = $count >= $maximum;

            if ($finished) {
                $this->finalizeAttempt($ujian, $attempt, $attempt->jawaban_json ?? []);
            } elseif (now()->greaterThanOrEqualTo($this->deadline($ujian, $attempt, $scheduledEnd))) {
                $this->finalizeAttempt($ujian, $attempt, $attempt->jawaban_json ?? []);
                $finished = true;
            }

            return [
                'jumlah_pelanggaran' => $count,
                'maks_pelanggaran' => $maximum,
                'finished' => $finished,
            ];
        });

        return response()->json($result);
    }

    public function finish(Request $request, Ujian $ujian): RedirectResponse
    {
        $siswa = $this->activeStudent($request);
        abort_unless((int) $ujian->kelas_id === (int) $siswa->kelas_id, 404);

        $validated = $request->validate(['jawaban' => ['sometimes', 'array']]);

        $attempt = HasilUjian::query()
            ->where('ujian_id', $ujian->id)
            ->where('siswa_id', $siswa->id)
            ->firstOrFail();
        $scheduledEnd = $ujian->waktu_mulai->copy()->addMinutes($ujian->durasi_menit);

        DB::transaction(function () use ($attempt, $ujian, $scheduledEnd, $validated): void {
            $lockedAttempt = HasilUjian::query()->lockForUpdate()->findOrFail($attempt->id);

            if ($lockedAttempt->status_pengerjaan === 'selesai') {
                return;
            }

            $answers = $lockedAttempt->jawaban_json ?? [];

            if (now()->lessThan($this->deadline($ujian, $lockedAttempt, $scheduledEnd))) {
                $questions = $ujian->bankSoals()->get();
                $hasExtendedTypes = $questions->contains(
                    fn (BankSoal $question): bool => ($question->tipe_soal ?? 'pg') !== 'pg',
                );
                $submittedAnswers = $validated['jawaban'] ?? [];
                $validatedAnswers = $hasExtendedTypes
                    ? $this->validatedExamAnswers($questions, $submittedAnswers)
                    : $this->validatedAnswers($ujian, $submittedAnswers);
                $answers = array_replace($answers, $validatedAnswers);
            }

            $this->finalizeAttempt($ujian, $lockedAttempt, $answers);
        });

        return to_route('siswa.ujian.show', $ujian)
            ->with('success', 'Ujian berhasil diselesaikan.');
    }

    private function activeStudent(Request $request): Siswa
    {
        $siswa = $request->user()->siswa;
        abort_unless($siswa?->status_siswa === 'aktif' && $siswa->kelas_id, 403);

        return $siswa;
    }

    private function deadline(Ujian $ujian, HasilUjian $attempt, Carbon $scheduledEnd): Carbon
    {
        $attemptEnd = $attempt->created_at->copy()->addMinutes($ujian->durasi_menit);

        return $attemptEnd->lessThan($scheduledEnd) ? $attemptEnd : $scheduledEnd;
    }

    /**
     * @param  array<string, mixed>  $submittedAnswers
     * @return array<string, string>
     */
    private function validatedAnswers(Ujian $ujian, array $submittedAnswers): array
    {
        $questionIds = $ujian->bankSoals()->pluck('id')->map(fn ($id): string => (string) $id)->all();
        $validAnswers = [];

        foreach ($submittedAnswers as $questionId => $answer) {
            $questionKey = (string) $questionId;

            if (! in_array($questionKey, $questionIds, true)) {
                throw ValidationException::withMessages([
                    'jawaban' => 'Jawaban berisi soal yang bukan bagian dari ujian ini.',
                ]);
            }

            if ($answer !== null && (! is_string($answer) || ! in_array($answer, ['A', 'B', 'C', 'D', 'E'], true))) {
                throw ValidationException::withMessages([
                    "jawaban.{$questionKey}" => 'Jawaban pilihan ganda tidak valid.',
                ]);
            }

            if (is_string($answer)) {
                $validAnswers[$questionKey] = $answer;
            }
        }

        return $validAnswers;
    }

    /**
     * @param  Collection<int, BankSoal>  $questions
     * @param  array<string, mixed>  $submittedAnswers
     * @return array<string, mixed>
     */
    private function validatedExamAnswers(Collection $questions, array $submittedAnswers): array
    {
        $questionsById = $questions->keyBy(fn (BankSoal $question): string => (string) $question->id);
        $answers = [];

        foreach ($submittedAnswers as $questionId => $answer) {
            $questionKey = (string) $questionId;
            $question = $questionsById->get($questionKey);

            if (! $question) {
                throw ValidationException::withMessages([
                    'jawaban' => 'Jawaban berisi soal yang bukan bagian dari ujian ini.',
                ]);
            }

            $validatedAnswer = $this->validateQuestionAnswer($question, $answer);

            if ($validatedAnswer !== null) {
                $answers[$questionKey] = $validatedAnswer;
            }
        }

        return $answers;
    }

    private function validateQuestionAnswer(BankSoal $question, mixed $answer): mixed
    {
        if ($answer === null) {
            return null;
        }

        $type = $question->tipe_soal ?? 'pg';
        $options = $question->opsi_json ?? [];

        if ($type === 'pg') {
            if (! is_string($answer) || ! in_array($answer, ['A', 'B', 'C', 'D', 'E'], true)) {
                throw ValidationException::withMessages(['answer' => 'Jawaban pilihan ganda tidak valid.']);
            }

            return $answer;
        }

        if ($type === 'pg_kompleks') {
            $optionCount = count($options['opsi'] ?? []);

            if (
                ! is_array($answer)
                || count($answer) > $optionCount
                || count(array_unique(array_map('strval', $answer))) !== count($answer)
            ) {
                throw ValidationException::withMessages(['answer' => 'Jawaban PG kompleks tidak valid.']);
            }

            foreach ($answer as $optionIndex) {
                if (! is_numeric($optionIndex) || (int) $optionIndex < 0 || (int) $optionIndex >= $optionCount) {
                    throw ValidationException::withMessages(['answer' => 'Jawaban PG kompleks tidak valid.']);
                }
            }

            return array_values(array_map('strval', $answer));
        }

        if ($type === 'menjodohkan') {
            $leftCount = count($options['pasangan_kiri'] ?? []);
            $rightCount = count($options['pasangan_kanan'] ?? []);

            if (! is_array($answer)) {
                throw ValidationException::withMessages(['answer' => 'Jawaban menjodohkan tidak valid.']);
            }

            foreach ($answer as $leftIndex => $rightIndex) {
                if (
                    ! ctype_digit((string) $leftIndex)
                    || (int) $leftIndex >= $leftCount
                    || ! is_numeric($rightIndex)
                    || (int) $rightIndex < 0
                    || (int) $rightIndex >= $rightCount
                ) {
                    throw ValidationException::withMessages(['answer' => 'Jawaban menjodohkan tidak valid.']);
                }
            }

            return $answer;
        }

        if (in_array($type, ['isian_singkat', 'esai'], true)) {
            if (! is_string($answer) || mb_strlen($answer) > 10000) {
                throw ValidationException::withMessages(['answer' => 'Jawaban teks tidak valid.']);
            }

            return $answer;
        }

        throw ValidationException::withMessages(['answer' => 'Jenis soal tidak dikenali.']);
    }

    /**
     * @param  array<string, string>  $answers
     */
    private function finalizeAttempt(Ujian $ujian, HasilUjian $attempt, array $answers): void
    {
        $questions = $ujian->bankSoals()->get();
        $usesLegacyScoring = $questions->every(
            fn (BankSoal $question): bool => ($question->tipe_soal ?? 'pg') === 'pg' && (int) ($question->bobot ?? 1) === 1,
        );
        if ($usesLegacyScoring) {
            $answerKeys = $questions->pluck('kunci_jawaban', 'id');
            $correctCount = $answerKeys->filter(
                fn (string $key, int|string $questionId): bool => ($answers[(string) $questionId] ?? null) === $key,
            )->count();
            $score = $answerKeys->isEmpty()
                ? 0
                : round(($correctCount / $answerKeys->count()) * 100, 2);
        } else {
            $score = ExamScoring::score($questions, $answers);
        }

        $attempt->update([
            'jawaban_json' => $answers,
            'skor_akhir' => $score,
            'status_pengerjaan' => 'selesai',
        ]);
    }

    private function imageUrl(?string $path): ?string
    {
        return $path ? Storage::disk('public')->url($path) : null;
    }
}
