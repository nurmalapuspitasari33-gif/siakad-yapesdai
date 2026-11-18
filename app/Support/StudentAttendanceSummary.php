<?php

namespace App\Support;

use App\Models\Siswa;
use App\Models\TahunAjaran;
use Illuminate\Support\Collection;

class StudentAttendanceSummary
{
    /**
     * @return array{
     *     tahunAjaran: ?array{nama_tahun: string, semester: string},
     *     ringkasan: array{
     *         total_sesi: int,
     *         hadir: int,
     *         sakit: int,
     *         izin: int,
     *         alfa: int,
     *         persentase_kehadiran: float
     *     },
     *     ketidakhadiran: Collection<int, array{
     *         id: int,
     *         tanggal: string,
     *         status: string,
     *         status_label: string,
     *         mata_pelajaran: ?string
     *     }>
     * }
     */
    public function for(Siswa $siswa, ?TahunAjaran $tahunAjaran): array
    {
        $presensis = $tahunAjaran && $siswa->status_siswa === 'aktif' && $siswa->kelas_id
            ? $siswa->presensiKelas()
                ->where('kelas_id', $siswa->kelas_id)
                ->whereDate('tanggal', '<=', now('Asia/Jakarta')->toDateString())
                ->whereHas('jadwal', fn ($query) => $query->where('tahun_ajaran_id', $tahunAjaran->id))
                ->with('mataPelajaran:id,nama_mapel')
                ->orderByDesc('tanggal')
                ->orderBy('mapel_id')
                ->get(['id', 'mapel_id', 'tanggal', 'status'])
            : collect();

        $statusCounts = $presensis->countBy('status');
        $totalSesi = $presensis->count();
        $hadir = (int) $statusCounts->get('H', 0);

        return [
            'tahunAjaran' => $tahunAjaran ? [
                'nama_tahun' => $tahunAjaran->nama_tahun,
                'semester' => $tahunAjaran->semester,
            ] : null,
            'ringkasan' => [
                'total_sesi' => $totalSesi,
                'hadir' => $hadir,
                'sakit' => (int) $statusCounts->get('S', 0),
                'izin' => (int) $statusCounts->get('I', 0),
                'alfa' => (int) $statusCounts->get('A', 0),
                'persentase_kehadiran' => $totalSesi > 0
                    ? round(($hadir / $totalSesi) * 100, 1)
                    : 0.0,
            ],
            'ketidakhadiran' => $presensis
                ->whereIn('status', ['S', 'I', 'A'])
                ->map(fn ($presensi): array => [
                    'id' => $presensi->id,
                    'tanggal' => $presensi->tanggal->toDateString(),
                    'status' => $presensi->status,
                    'status_label' => match ($presensi->status) {
                        'S' => 'Sakit',
                        'I' => 'Izin',
                        'A' => 'Alfa',
                    },
                    'mata_pelajaran' => $presensi->mataPelajaran?->nama_mapel,
                ])
                ->values(),
        ];
    }
}
