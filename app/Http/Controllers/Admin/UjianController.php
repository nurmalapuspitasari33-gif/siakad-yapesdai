<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Siswa;
use App\Models\Ujian;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UjianController extends Controller
{
    public function index(Request $request): Response
    {
        $examOptions = Ujian::query()
            ->with([
                'kelas:id,nama_kelas',
                'mataPelajaran:id,nama_mapel',
            ])
            ->orderByDesc('waktu_mulai')
            ->orderByDesc('id')
            ->get(['id', 'kelas_id', 'mapel_id', 'judul_ujian', 'waktu_mulai']);

        $validated = $request->validate([
            'ujian_id' => ['sometimes', 'nullable', 'integer', Rule::exists('ujians', 'id')],
        ]);
        $selectedExamId = $request->query->has('ujian_id')
            ? ($validated['ujian_id'] ?? null)
            : $examOptions->first()?->id;
        $selectedExam = $selectedExamId === null
            ? null
            : Ujian::query()
                ->with([
                    'kelas:id,nama_kelas',
                    'mataPelajaran:id,nama_mapel',
                ])
                ->findOrFail($selectedExamId);

        $students = $selectedExam
            ? Siswa::query()
                ->where('kelas_id', $selectedExam->kelas_id)
                ->where('status_siswa', 'aktif')
                ->with([
                    'hasilUjians' => fn (HasMany $query) => $query
                        ->where('ujian_id', $selectedExam->id)
                        ->select('id', 'ujian_id', 'siswa_id', 'status_pengerjaan', 'updated_at'),
                ])
                ->orderBy('nama_lengkap')
                ->get(['id', 'kelas_id', 'nisn', 'nama_lengkap'])
                ->map(function (Siswa $siswa): array {
                    $attempt = $siswa->hasilUjians->first();

                    return [
                        'id' => $siswa->id,
                        'nisn' => $siswa->nisn,
                        'nama_lengkap' => $siswa->nama_lengkap,
                        'hasil_ujian_id' => $attempt?->id,
                        'status_pengerjaan' => $attempt?->status_pengerjaan ?? 'belum_mulai',
                        'updated_at' => $attempt?->updated_at?->toIso8601String(),
                    ];
                })
            : collect();

        $statusCounts = $students->countBy('status_pengerjaan');

        return Inertia::render('Admin/Ujian/Index', [
            'examOptions' => $examOptions->map(fn (Ujian $ujian): array => [
                'id' => $ujian->id,
                'judul_ujian' => $ujian->judul_ujian,
                'waktu_mulai' => $ujian->waktu_mulai?->toIso8601String(),
                'kelas' => $ujian->kelas?->nama_kelas,
                'mata_pelajaran' => $ujian->mataPelajaran?->nama_mapel,
            ]),
            'selectedExam' => $selectedExam ? [
                'id' => $selectedExam->id,
                'judul_ujian' => $selectedExam->judul_ujian,
                'kelas' => $selectedExam->kelas?->nama_kelas,
                'mata_pelajaran' => $selectedExam->mataPelajaran?->nama_mapel,
            ] : null,
            'filters' => [
                'ujian_id' => $selectedExamId === null ? '' : (string) $selectedExamId,
            ],
            'statistics' => [
                'totalPeserta' => $students->count(),
                'sedangMengerjakan' => $statusCounts->get('sedang_mengerjakan', 0),
                'sudahSelesai' => $statusCounts->get('selesai', 0),
                'belumMulai' => $statusCounts->get('belum_mulai', 0),
            ],
            'students' => $students,
        ]);
    }

    public function resetSession(Ujian $ujian, Siswa $siswa): RedirectResponse
    {
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

        return back()->with('success', "Sesi ujian {$ujian->judul_ujian} untuk {$siswa->nama_lengkap} berhasil direset.");
    }
}
