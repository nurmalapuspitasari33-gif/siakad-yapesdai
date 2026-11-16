<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TahunAjaran;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Database\Query\JoinClause;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class LaporanController extends Controller
{
    public function index(Request $request): InertiaResponse
    {
        $tahunAjaranId = $this->validatedYearFilter($request);

        return Inertia::render('Admin/Laporan/Index', [
            'tahunAjaranOptions' => TahunAjaran::query()
                ->orderByDesc('nama_tahun')
                ->orderBy('semester')
                ->get(['id', 'nama_tahun', 'semester', 'is_aktif']),
            'filters' => [
                'tahun_ajaran_id' => $tahunAjaranId === null ? '' : (string) $tahunAjaranId,
            ],
            'laporanKeuangan' => $this->financialReport($tahunAjaranId),
            'demografiSiswa' => $this->studentDemographicsReport($tahunAjaranId),
            'monitoringNilai' => $this->gradeCompletenessReport($tahunAjaranId),
        ]);
    }

    private function validatedYearFilter(Request $request): ?int
    {
        $validated = $request->validate([
            'tahun_ajaran_id' => ['sometimes', 'nullable', 'integer', Rule::exists('tahun_ajarans', 'id')],
        ]);

        $tahunAjaranId = $request->query->has('tahun_ajaran_id')
            ? ($validated['tahun_ajaran_id'] ?? null)
            : TahunAjaran::query()->where('is_aktif', true)->value('id');

        return $tahunAjaranId === null ? null : (int) $tahunAjaranId;
    }

    /**
     * @return array<int, array{
     *     kelas_id: int,
     *     nama_kelas: string,
     *     jumlah_siswa: int,
     *     total_tagihan: float,
     *     total_terbayar: float,
     *     total_tunggakan: float,
     *     persentase_pelunasan: float
     * }>
     */
    private function financialReport(?int $tahunAjaranId): array
    {
        return DB::table('kelas')
            ->leftJoin('siswas', function (JoinClause $join): void {
                $join->on('siswas.kelas_id', '=', 'kelas.id')
                    ->where('siswas.status_siswa', '=', 'aktif');
            })
            ->leftJoin('tagihans', 'tagihans.siswa_id', '=', 'siswas.id')
            ->when($tahunAjaranId !== null, fn (QueryBuilder $query) => $query
                ->where('kelas.tahun_ajaran_id', $tahunAjaranId))
            ->select('kelas.id as kelas_id', 'kelas.nama_kelas')
            ->selectRaw('COUNT(DISTINCT siswas.id) as jumlah_siswa')
            ->selectRaw('COALESCE(SUM(tagihans.nominal), 0) as total_tagihan')
            ->selectRaw("COALESCE(SUM(CASE WHEN tagihans.status_bayar = 'lunas' THEN tagihans.nominal ELSE 0 END), 0) as total_terbayar")
            ->selectRaw("COALESCE(SUM(CASE WHEN tagihans.status_bayar = 'belum_lunas' THEN tagihans.nominal ELSE 0 END), 0) as total_tunggakan")
            ->groupBy('kelas.id', 'kelas.nama_kelas')
            ->orderBy('kelas.nama_kelas')
            ->get()
            ->map(static function (object $row): array {
                $totalTagihan = (float) $row->total_tagihan;
                $totalTerbayar = (float) $row->total_terbayar;

                return [
                    'kelas_id' => (int) $row->kelas_id,
                    'nama_kelas' => $row->nama_kelas,
                    'jumlah_siswa' => (int) $row->jumlah_siswa,
                    'total_tagihan' => $totalTagihan,
                    'total_terbayar' => $totalTerbayar,
                    'total_tunggakan' => (float) $row->total_tunggakan,
                    'persentase_pelunasan' => $totalTagihan > 0
                        ? round($totalTerbayar / $totalTagihan * 100, 2)
                        : 0.0,
                ];
            })
            ->all();
    }

    /**
     * @return array<int, array{
     *     program_keahlian: string,
     *     konsentrasi_keahlian: string,
     *     jumlah_aktif: int,
     *     laki_laki: int,
     *     perempuan: int,
     *     reguler: int,
     *     santri_internal: int,
     *     santri_eksternal: int,
     *     beasiswa: int,
     *     afirmasi: int
     * }>
     */
    private function studentDemographicsReport(?int $tahunAjaranId): array
    {
        $rows = DB::table('siswas')
            ->leftJoin('kelas', 'kelas.id', '=', 'siswas.kelas_id')
            ->leftJoin('program_keahlians', 'program_keahlians.id', '=', 'siswas.program_keahlian_id')
            ->leftJoin('konsentrasi_keahlians', 'konsentrasi_keahlians.id', '=', 'siswas.konsentrasi_keahlian_id')
            ->leftJoin('kategori_beasiswas', 'kategori_beasiswas.id', '=', 'siswas.kategori_beasiswa_id')
            ->where('siswas.status_siswa', 'aktif')
            ->when($tahunAjaranId !== null, fn (QueryBuilder $query) => $query
                ->where('kelas.tahun_ajaran_id', $tahunAjaranId))
            ->select('siswas.program_keahlian_id', 'siswas.konsentrasi_keahlian_id')
            ->selectRaw("COALESCE(program_keahlians.nama_jurusan, 'Belum ditentukan') as program_keahlian")
            ->selectRaw("COALESCE(konsentrasi_keahlians.nama_konsentrasi, 'Belum ditentukan') as konsentrasi_keahlian")
            ->selectRaw('COUNT(siswas.id) as jumlah_aktif')
            ->selectRaw("SUM(CASE WHEN siswas.jenis_kelamin = 'L' THEN 1 ELSE 0 END) as laki_laki")
            ->selectRaw("SUM(CASE WHEN siswas.jenis_kelamin = 'P' THEN 1 ELSE 0 END) as perempuan")
            ->selectRaw("SUM(CASE WHEN siswas.tipe_program = 'reguler' THEN 1 ELSE 0 END) as reguler")
            ->selectRaw("SUM(CASE WHEN siswas.tipe_program = 'santri_internal' THEN 1 ELSE 0 END) as santri_internal")
            ->selectRaw("SUM(CASE WHEN siswas.tipe_program = 'santri_eksternal' THEN 1 ELSE 0 END) as santri_eksternal")
            ->selectRaw('SUM(CASE WHEN siswas.kategori_beasiswa_id IS NOT NULL THEN 1 ELSE 0 END) as beasiswa')
            ->selectRaw('SUM(CASE WHEN kategori_beasiswas.is_afirmasi = 1 THEN 1 ELSE 0 END) as afirmasi')
            ->groupBy(
                'siswas.program_keahlian_id',
                'program_keahlians.nama_jurusan',
                'siswas.konsentrasi_keahlian_id',
                'konsentrasi_keahlians.nama_konsentrasi',
            )
            ->orderBy('program_keahlians.nama_jurusan')
            ->orderBy('konsentrasi_keahlians.nama_konsentrasi')
            ->get()
            ->map(static fn (object $row): array => [
                'program_keahlian_id' => $row->program_keahlian_id === null ? null : (int) $row->program_keahlian_id,
                'konsentrasi_keahlian_id' => $row->konsentrasi_keahlian_id === null ? null : (int) $row->konsentrasi_keahlian_id,
                'program_keahlian' => $row->program_keahlian,
                'konsentrasi_keahlian' => $row->konsentrasi_keahlian,
                'jumlah_aktif' => (int) $row->jumlah_aktif,
                'laki_laki' => (int) $row->laki_laki,
                'perempuan' => (int) $row->perempuan,
                'reguler' => (int) $row->reguler,
                'santri_internal' => (int) $row->santri_internal,
                'santri_eksternal' => (int) $row->santri_eksternal,
                'beasiswa' => (int) $row->beasiswa,
                'afirmasi' => (int) $row->afirmasi,
            ])
            ->all();

        $existingConcentrations = [];

        foreach ($rows as &$row) {
            $existingConcentrations[$row['program_keahlian_id'].':'.$row['konsentrasi_keahlian_id']] = true;
            unset($row['program_keahlian_id'], $row['konsentrasi_keahlian_id']);
        }
        unset($row);

        $definedConcentrations = DB::table('konsentrasi_keahlians')
            ->join('program_keahlians', 'program_keahlians.id', '=', 'konsentrasi_keahlians.program_keahlian_id')
            ->select(
                'program_keahlians.id as program_keahlian_id',
                'program_keahlians.nama_jurusan as program_keahlian',
                'konsentrasi_keahlians.id as konsentrasi_keahlian_id',
                'konsentrasi_keahlians.nama_konsentrasi as konsentrasi_keahlian',
            )
            ->orderBy('program_keahlians.nama_jurusan')
            ->orderBy('konsentrasi_keahlians.nama_konsentrasi')
            ->get();

        foreach ($definedConcentrations as $concentration) {
            $key = $concentration->program_keahlian_id.':'.$concentration->konsentrasi_keahlian_id;

            if (isset($existingConcentrations[$key])) {
                continue;
            }

            $rows[] = [
                'program_keahlian' => $concentration->program_keahlian,
                'konsentrasi_keahlian' => $concentration->konsentrasi_keahlian,
                'jumlah_aktif' => 0,
                'laki_laki' => 0,
                'perempuan' => 0,
                'reguler' => 0,
                'santri_internal' => 0,
                'santri_eksternal' => 0,
                'beasiswa' => 0,
                'afirmasi' => 0,
            ];
        }

        usort($rows, static fn (array $first, array $second): int => [
            $first['program_keahlian'],
            $first['konsentrasi_keahlian'],
        ] <=> [
            $second['program_keahlian'],
            $second['konsentrasi_keahlian'],
        ]);

        return $rows;
    }

    /**
     * @return array<int, array{
     *     nama_tahun: string,
     *     semester: string,
     *     nama_kelas: string,
     *     kode_mapel: string,
     *     nama_mapel: string,
     *     nama_guru: string,
     *     jumlah_nilai: int,
     *     total_siswa: int
     * }>
     */
    private function gradeCompletenessReport(?int $tahunAjaranId): array
    {
        return DB::table('jadwals')
            ->join('tahun_ajarans', 'tahun_ajarans.id', '=', 'jadwals.tahun_ajaran_id')
            ->join('kelas', 'kelas.id', '=', 'jadwals.kelas_id')
            ->join('mata_pelajarans', 'mata_pelajarans.id', '=', 'jadwals.mapel_id')
            ->join('gurus', 'gurus.id', '=', 'jadwals.guru_id')
            ->leftJoin('siswas', function (JoinClause $join): void {
                $join->on('siswas.kelas_id', '=', 'jadwals.kelas_id')
                    ->where('siswas.status_siswa', '=', 'aktif');
            })
            ->leftJoin('nilais', function (JoinClause $join): void {
                $join->on('nilais.siswa_id', '=', 'siswas.id')
                    ->on('nilais.mapel_id', '=', 'jadwals.mapel_id')
                    ->on('nilais.tahun_ajaran_id', '=', 'jadwals.tahun_ajaran_id');
            })
            ->when($tahunAjaranId !== null, fn (QueryBuilder $query) => $query
                ->where('jadwals.tahun_ajaran_id', $tahunAjaranId))
            ->select(
                'tahun_ajarans.nama_tahun',
                'tahun_ajarans.semester',
                'kelas.nama_kelas',
                'mata_pelajarans.kode_mapel',
                'mata_pelajarans.nama_mapel',
                'gurus.nama_lengkap as nama_guru',
            )
            ->selectRaw('COUNT(DISTINCT siswas.id) as total_siswa')
            ->selectRaw('COUNT(DISTINCT CASE WHEN nilais.id IS NOT NULL THEN siswas.id END) as jumlah_nilai')
            ->groupBy(
                'jadwals.tahun_ajaran_id',
                'tahun_ajarans.nama_tahun',
                'tahun_ajarans.semester',
                'kelas.id',
                'kelas.nama_kelas',
                'mata_pelajarans.id',
                'mata_pelajarans.kode_mapel',
                'mata_pelajarans.nama_mapel',
                'gurus.id',
                'gurus.nama_lengkap',
            )
            ->orderBy('kelas.nama_kelas')
            ->orderBy('mata_pelajarans.nama_mapel')
            ->orderBy('gurus.nama_lengkap')
            ->get()
            ->map(static fn (object $row): array => [
                'nama_tahun' => $row->nama_tahun,
                'semester' => $row->semester,
                'nama_kelas' => $row->nama_kelas,
                'kode_mapel' => $row->kode_mapel,
                'nama_mapel' => $row->nama_mapel,
                'nama_guru' => $row->nama_guru,
                'jumlah_nilai' => (int) $row->jumlah_nilai,
                'total_siswa' => (int) $row->total_siswa,
            ])
            ->all();
    }
}
