<?php

namespace App\Http\Controllers\Siswa;

use App\Http\Controllers\Controller;
use App\Models\HasilUjian;
use App\Models\Siswa;
use App\Models\Ujian;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
                ->select('id', 'ujian_id', 'pertanyaan', 'opsi_a', 'opsi_b', 'opsi_c', 'opsi_d', 'opsi_e')
                ->when($ujian->acak_soal, fn ($query) => $query->inRandomOrder())
                ->get()
                ->map(fn ($question): array => [
                    'id' => $question->id,
                    'pertanyaan' => $question->pertanyaan,
                    'opsi' => [
                        'A' => $question->opsi_a,
                        'B' => $question->opsi_b,
                        'C' => $question->opsi_c,
                        'D' => $question->opsi_d,
                        'E' => $question->opsi_e,
                    ],
                ]);

        $endsAt = $this->deadline($ujian, $attempt, $scheduledEnd);

        return Inertia::render('Siswa/Ujian/Show', [
            'ujian' => [
                'id' => $ujian->id,
                'judul_ujian' => $ujian->judul_ujian,
                'mata_pelajaran' => $ujian->mataPelajaran()->value('nama_mapel'),
                'durasi_menit' => $ujian->durasi_menit,
                'ends_at' => $endsAt->toIso8601String(),
            ],
            'attempt' => [
                'id' => $attempt->id,
                'status' => $attempt->status_pengerjaan,
                'skor_akhir' => $attempt->skor_akhir,
                'jawaban' => $attempt->jawaban_json ?? [],
            ],
            'questions' => $questions,
        ]);
    }

    public function saveAnswer(Request $request, Ujian $ujian): JsonResponse
    {
        $siswa = $this->activeStudent($request);
        abort_unless((int) $ujian->kelas_id === (int) $siswa->kelas_id, 404);

        $validated = $request->validate([
            'question_id' => ['required', 'integer'],
            'answer' => ['nullable', Rule::in(['A', 'B', 'C', 'D', 'E'])],
        ]);

        $questionExists = $ujian->bankSoals()
            ->whereKey($validated['question_id'])
            ->exists();
        abort_unless($questionExists, 404);

        $attempt = HasilUjian::query()
            ->where('ujian_id', $ujian->id)
            ->where('siswa_id', $siswa->id)
            ->firstOrFail();
        $scheduledEnd = $ujian->waktu_mulai->copy()->addMinutes($ujian->durasi_menit);

        DB::transaction(function () use ($attempt, $ujian, $scheduledEnd, $validated): void {
            $lockedAttempt = HasilUjian::query()->lockForUpdate()->findOrFail($attempt->id);
            abort_unless($lockedAttempt->status_pengerjaan === 'sedang_mengerjakan', 403);
            abort_unless(now()->lessThan($this->deadline($ujian, $lockedAttempt, $scheduledEnd)), 410);

            $answers = $lockedAttempt->jawaban_json ?? [];
            $questionKey = (string) $validated['question_id'];

            if ($validated['answer'] === null) {
                unset($answers[$questionKey]);
            } else {
                $answers[$questionKey] = $validated['answer'];
            }

            $lockedAttempt->update(['jawaban_json' => $answers]);
        });

        return response()->json(['saved' => true]);
    }

    public function finish(Request $request, Ujian $ujian): RedirectResponse
    {
        $siswa = $this->activeStudent($request);
        abort_unless((int) $ujian->kelas_id === (int) $siswa->kelas_id, 404);

        $validated = $request->validate([
            'jawaban' => ['sometimes', 'array'],
            'jawaban.*' => ['nullable', Rule::in(['A', 'B', 'C', 'D', 'E'])],
        ]);

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
                $answers = array_replace($answers, $this->validatedAnswers($ujian, $validated['jawaban'] ?? []));
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

            if (is_string($answer) && in_array($answer, ['A', 'B', 'C', 'D', 'E'], true)) {
                $validAnswers[$questionKey] = $answer;
            }
        }

        return $validAnswers;
    }

    /**
     * @param  array<string, string>  $answers
     */
    private function finalizeAttempt(Ujian $ujian, HasilUjian $attempt, array $answers): void
    {
        $answerKeys = $ujian->bankSoals()->pluck('kunci_jawaban', 'id');
        $correctCount = $answerKeys->filter(
            fn (string $key, int|string $questionId): bool => ($answers[(string) $questionId] ?? null) === $key,
        )->count();
        $score = $answerKeys->isEmpty()
            ? 0
            : round(($correctCount / $answerKeys->count()) * 100, 2);

        $attempt->update([
            'jawaban_json' => $answers,
            'skor_akhir' => $score,
            'status_pengerjaan' => 'selesai',
        ]);
    }
}
