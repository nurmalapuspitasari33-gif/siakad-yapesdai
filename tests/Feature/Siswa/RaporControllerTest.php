<?php

namespace Tests\Feature\Siswa;

use App\Models\CatatanRapor;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\Nilai;
use App\Models\PengaturanSekolah;
use App\Models\ProgramKeahlian;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class RaporControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_only_sees_their_own_report_scores(): void
    {
        PengaturanSekolah::query()->findOrFail(1)->update([
            'status_rilis_rapor' => 'buka',
        ]);
        $tahunAjaran = TahunAjaran::create([
            'nama_tahun' => '2026/2027',
            'semester' => 'ganjil',
            'is_aktif' => true,
        ]);
        $kelas = Kelas::create([
            'tahun_ajaran_id' => $tahunAjaran->id,
            'nama_kelas' => 'X IPA 1',
            'tingkat' => 10,
        ]);
        $program = ProgramKeahlian::create([
            'kode_jurusan' => 'TF',
            'nama_jurusan' => 'Teknologi Farmasi',
        ]);
        $concentration = $program->konsentrasiKeahlians()->create([
            'kode_konsentrasi' => 'FI',
            'nama_konsentrasi' => 'Farmasi Industri',
        ]);
        $studentUser = User::factory()->create(['role' => 'siswa']);
        $student = Siswa::create([
            'user_id' => $studentUser->id,
            'kelas_id' => $kelas->id,
            'program_keahlian_id' => $program->id,
            'konsentrasi_keahlian_id' => $concentration->id,
            'nisn' => '0000000001',
            'nama_lengkap' => 'Siswa Aktif',
            'status_siswa' => 'aktif',
        ]);
        $otherUser = User::factory()->create(['role' => 'siswa']);
        $otherStudent = Siswa::create([
            'user_id' => $otherUser->id,
            'kelas_id' => $kelas->id,
            'nisn' => '0000000002',
            'nama_lengkap' => 'Siswa Lain',
            'status_siswa' => 'aktif',
        ]);
        $mapel = MataPelajaran::create([
            'kode_mapel' => 'MAT-001',
            'nama_mapel' => 'Matematika',
        ]);
        Nilai::create([
            'tahun_ajaran_id' => $tahunAjaran->id,
            'siswa_id' => $student->id,
            'mapel_id' => $mapel->id,
            'nilai_tugas' => 70,
            'nilai_uts' => 80,
            'nilai_uas' => 90,
            'nilai_akhir' => 80,
            'capaian_kompetensi' => 'Menerapkan konsep secara mandiri.',
        ]);
        Nilai::create([
            'tahun_ajaran_id' => $tahunAjaran->id,
            'siswa_id' => $otherStudent->id,
            'mapel_id' => $mapel->id,
            'nilai_tugas' => 100,
            'nilai_uts' => 100,
            'nilai_uas' => 100,
            'nilai_akhir' => 100,
        ]);

        $this->actingAs($studentUser)
            ->get(route('siswa.rapor.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Siswa/Rapor/Index')
                ->where('siswa.nama_lengkap', 'Siswa Aktif')
                ->where('siswa.program_keahlian', 'Teknologi Farmasi')
                ->where('siswa.konsentrasi_keahlian', 'Farmasi Industri')
                ->where('selectedTahunAjaran', '2026/2027')
                ->where('selectedSemester', 'ganjil')
                ->has('rapor', 1)
                ->has('rapor.0.mata_pelajaran', 1)
                ->where('rapor.0.mata_pelajaran.0.nilai_akhir', '80.00')
                ->where('rapor.0.mata_pelajaran.0.capaian_kompetensi', 'Menerapkan konsep secara mandiri.')
                ->where('isCandidate', false));

        CatatanRapor::create([
            'tahun_ajaran_id' => $tahunAjaran->id,
            'siswa_id' => $student->id,
            'kokurikuler_predikat' => 'Baik',
            'kokurikuler_deskripsi' => 'Deskripsi kokurikuler.',
            'ekstra_3_nama' => 'PMR',
            'ekstra_3_ket' => 'Baik',
            'ekstra_4_nama' => 'Futsal',
            'ekstra_4_ket' => 'Amat Baik',
            'sakit' => 1,
        ]);

        $this->actingAs($studentUser)
            ->get(route('siswa.rapor.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('rapor.0.catatan_rapor.kokurikuler_predikat', 'Baik')
                ->where('rapor.0.catatan_rapor.kokurikuler_deskripsi', 'Deskripsi kokurikuler.')
                ->where('rapor.0.catatan_rapor.ekstra_3_nama', 'PMR')
                ->where('rapor.0.catatan_rapor.ekstra_3_ket', 'Baik')
                ->where('rapor.0.catatan_rapor.ekstra_4_nama', 'Futsal')
                ->where('rapor.0.catatan_rapor.ekstra_4_ket', 'Amat Baik')
                ->where('rapor.0.catatan_rapor.sakit', 1));
    }

    public function test_student_can_filter_their_report_by_academic_year_and_semester(): void
    {
        PengaturanSekolah::query()->findOrFail(1)->update([
            'status_rilis_rapor' => 'buka',
        ]);
        $activeYear = TahunAjaran::create([
            'nama_tahun' => '2026/2027',
            'semester' => 'ganjil',
            'is_aktif' => true,
        ]);
        $previousYear = TahunAjaran::create([
            'nama_tahun' => '2025/2026',
            'semester' => 'genap',
            'is_aktif' => false,
        ]);
        $studentUser = User::factory()->create(['role' => 'siswa']);
        $student = Siswa::create([
            'user_id' => $studentUser->id,
            'nisn' => '0000000004',
            'nama_lengkap' => 'Siswa Aktif',
            'status_siswa' => 'aktif',
        ]);
        $mapel = MataPelajaran::create([
            'kode_mapel' => 'MAT-001',
            'nama_mapel' => 'Matematika',
        ]);

        foreach ([$activeYear, $previousYear] as $index => $tahunAjaran) {
            Nilai::create([
                'tahun_ajaran_id' => $tahunAjaran->id,
                'siswa_id' => $student->id,
                'mapel_id' => $mapel->id,
                'nilai_tugas' => 70,
                'nilai_uts' => 80,
                'nilai_uas' => 90,
                'nilai_akhir' => 80 + $index,
                'capaian_kompetensi' => 'Capaian semester.',
            ]);
        }

        $this->actingAs($studentUser)
            ->get(route('siswa.rapor.index').'?tahun_ajaran=2025%2F2026&semester=genap')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('selectedTahunAjaran', '2025/2026')
                ->where('selectedSemester', 'genap')
                ->has('tahunAjaranOptions', 2)
                ->has('rapor', 1)
                ->where('rapor.0.tahun_ajaran_id', $previousYear->id)
                ->where('rapor.0.mata_pelajaran.0.nilai_akhir', '81.00'));
    }

    public static function reportReleaseSettings(): array
    {
        return [
            'automatic release before its date' => ['otomatis', '2026-11-19', false],
            'automatic release on its date' => ['otomatis', '2026-11-18', true],
            'manual opening overrides a future date' => ['buka', '2026-11-19', true],
            'manual lock overrides a past date' => ['kunci', '2026-11-17', false],
        ];
    }

    #[DataProvider('reportReleaseSettings')]
    public function test_student_report_access_follows_release_settings(
        string $releaseStatus,
        string $releaseDate,
        bool $isReleased,
    ): void {
        $this->travelTo('2026-11-18 12:00:00');
        PengaturanSekolah::query()->findOrFail(1)->update([
            'tanggal_rapor' => $releaseDate,
            'status_rilis_rapor' => $releaseStatus,
        ]);
        $tahunAjaran = TahunAjaran::create([
            'nama_tahun' => '2026/2027',
            'semester' => 'ganjil',
            'is_aktif' => true,
        ]);
        $studentUser = User::factory()->create(['role' => 'siswa']);
        $student = Siswa::create([
            'user_id' => $studentUser->id,
            'nisn' => '0000000005',
            'nama_lengkap' => 'Siswa Uji Rilis',
            'status_siswa' => 'aktif',
        ]);
        $mapel = MataPelajaran::create([
            'kode_mapel' => 'MAT-002',
            'nama_mapel' => 'Matematika',
        ]);
        Nilai::create([
            'tahun_ajaran_id' => $tahunAjaran->id,
            'siswa_id' => $student->id,
            'mapel_id' => $mapel->id,
            'nilai_tugas' => 70,
            'nilai_uts' => 80,
            'nilai_uas' => 90,
            'nilai_akhir' => 80,
            'capaian_kompetensi' => 'Capaian hanya setelah rilis.',
        ]);

        $this->actingAs($studentUser)
            ->get(route('siswa.rapor.index'))
            ->assertOk()
            ->assertInertia(function (Assert $page) use ($isReleased, $releaseDate): void {
                $page->component('Siswa/Rapor/Index')
                    ->where('isReportReleased', $isReleased)
                    ->where('tanggalRilisRapor', $releaseDate);

                if ($isReleased) {
                    $page->has('rapor', 1)
                        ->where('rapor.0.mata_pelajaran.0.capaian_kompetensi', 'Capaian hanya setelah rilis.');

                    return;
                }

                $page->has('rapor', 0)
                    ->has('tahunAjaranOptions', 0)
                    ->where('selectedTahunAjaran', null);
            });
    }

    public function test_candidate_student_keeps_spmb_navigation_on_the_report_page(): void
    {
        $candidate = User::factory()->create(['role' => 'siswa']);
        Siswa::create([
            'user_id' => $candidate->id,
            'nisn' => '0000000003',
            'nama_lengkap' => 'Calon Siswa',
            'status_siswa' => 'calon_spmb',
        ]);

        $this->actingAs($candidate)
            ->get(route('siswa.rapor.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Siswa/Rapor/Index')
                ->has('rapor', 0)
                ->where('isCandidate', true));
    }
}
