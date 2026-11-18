<?php

namespace App\Support;

use App\Models\BankSoal;
use Illuminate\Database\Eloquent\Collection;

class ExamScoring
{
    /**
     * @param  Collection<int, BankSoal>  $questions
     * @param  array<string, mixed>  $answers
     */
    public static function score(Collection $questions, array $answers): float
    {
        $totalWeight = 0;
        $earnedWeight = 0.0;
        $essayScores = $answers['_nilai_esai'] ?? [];

        foreach ($questions as $question) {
            $weight = max(1, (int) $question->bobot);
            $totalWeight += $weight;
            $answer = $answers[(string) $question->id] ?? null;
            $answerKey = $question->opsi_json['kunci_jawaban'] ?? null;

            $earnedWeight += match ($question->tipe_soal ?? 'pg') {
                'pg' => $answer === $question->kunci_jawaban ? $weight : 0,
                'pg_kompleks' => self::complexScore($answer, $answerKey, $weight),
                'menjodohkan' => self::matchingScore($answer, $answerKey, $weight),
                'isian_singkat' => self::shortAnswerScore($answer, $answerKey, $weight),
                'esai' => min($weight, max(0, (float) ($essayScores[(string) $question->id] ?? 0))),
                default => 0,
            };
        }

        return $totalWeight === 0
            ? 0
            : round(($earnedWeight / $totalWeight) * 100, 2);
    }

    private static function complexScore(mixed $answer, mixed $answerKey, int $weight): float
    {
        if (! is_array($answer) || ! is_array($answerKey) || $answerKey === []) {
            return 0;
        }

        $correctAnswers = array_map('strval', $answerKey);
        $selectedAnswers = array_map('strval', $answer);
        $correctSelections = count(array_intersect($selectedAnswers, $correctAnswers));
        $incorrectSelections = count(array_diff($selectedAnswers, $correctAnswers));
        $fraction = max(0, ($correctSelections - $incorrectSelections) / count($correctAnswers));

        return $fraction * $weight;
    }

    private static function matchingScore(mixed $answer, mixed $answerKey, int $weight): float
    {
        if (! is_array($answer) || ! is_array($answerKey) || $answerKey === []) {
            return 0;
        }

        $correctPairs = 0;

        foreach ($answerKey as $left => $right) {
            if ((string) ($answer[$left] ?? '') === (string) $right) {
                $correctPairs++;
            }
        }

        return ($correctPairs / count($answerKey)) * $weight;
    }

    private static function shortAnswerScore(mixed $answer, mixed $answerKey, int $weight): float
    {
        if (! is_string($answer) || ! is_array($answerKey)) {
            return 0;
        }

        $normalizedAnswer = mb_strtolower(trim($answer));
        $matches = array_filter(
            $answerKey,
            fn (mixed $value): bool => is_string($value)
                && mb_strtolower(trim($value)) === $normalizedAnswer,
        );

        return $matches === [] ? 0 : $weight;
    }
}
