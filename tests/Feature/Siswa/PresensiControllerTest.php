<?php

namespace Tests\Feature\Siswa;

use App\Models\Guru;
use App\Models\Jadwal;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\PresensiKelas;
use App\Models\Siswa;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PresensiControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_sees_only_current_semester_attendance_and_absence_details(): void
    {
        $this->travelTo('2026-11-18 10:00:00');
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
        $activeClass = $this->createClass($activeYear, 'X IPA 1');
        $previousClass = $this->createClass($previousYear, 'IX IPA 1');
        $studentUser = User::factory()->create(['role' => 'siswa']);
        $student = Siswa::create([
            'user_id' => $studentUser->id,
            'kelas_id' => $activeClass->id,
            'nisn' => '0000000001',
            'nama_lengkap' => 'Siswa Aktif',
            'status_siswa' => 'aktif',
        ]);
        $otherStudent = Siswa::create([
            'user_id' => User::factory()->create(['role' => 'siswa'])->id,
            'kelas_id' => $activeClass->id,
            'nisn' => '0000000002',
            'nama_lengkap' => 'Siswa Lain',
            'status_siswa' => 'aktif',
        ]);
        $teacher = Guru::create([
            'user_id' => User::factory()->create(['role' => 'guru'])->id,
            'nip' => '19870001',
            'nama_lengkap' => 'Guru Pengampu',
        ]);
        $matematika = MataPelajaran::create([
            'kode_mapel' => 'MAT-001',
            'nama_mapel' => 'Matematika',
        ]);
        $biologi = MataPelajaran::create([
            'kode_mapel' => 'BIO-001',
            'nama_mapel' => 'Biologi',
        ]);
        $matematikaSchedule = $this->createSchedule($activeYear, $activeClass, $teacher, $matematika);
        $biologiSchedule = $this->createSchedule($activeYear, $activeClass, $teacher, $biologi);
        $previousSchedule = $this->createSchedule($previousYear, $previousClass, $teacher, $matematika);

        foreach ([
            [$matematikaSchedule, '2026-11-16', 'H', $student],
            [$matematikaSchedule, '2026-11-17', 'S', $student],
            [$biologiSchedule, '2026-11-18', 'I', $student],
            [$biologiSchedule, '2026-11-15', 'A', $student],
            [$matematikaSchedule, '2026-11-19', 'A', $student],
            [$matematikaSchedule, '2026-11-18', 'H', $otherStudent],
            [$previousSchedule, '2026-11-18', 'A', $student],
        ] as [$jadwal, $tanggal, $status, $siswa]) {
            PresensiKelas::create([
                'jadwal_id' => $jadwal->id,
                'kelas_id' => $jadwal->kelas_id,
                'mapel_id' => $jadwal->mapel_id,
                'guru_id' => $teacher->id,
                'siswa_id' => $siswa->id,
                'tanggal' => $tanggal,
                'status' => $status,
            ]);
        }

        $this->actingAs($studentUser)
            ->get(route('siswa.presensi.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Siswa/Presensi/Index')
                ->where('tahunAjaran.nama_tahun', '2026/2027')
                ->where('tahunAjaran.semester', 'ganjil')
                ->where('ringkasan.total_sesi', 4)
                ->where('ringkasan.hadir', 1)
                ->where('ringkasan.sakit', 1)
                ->where('ringkasan.izin', 1)
                ->where('ringkasan.alfa', 1)
                ->where('ringkasan.persentase_kehadiran', 25)
                ->has('ketidakhadiran', 3)
                ->where('ketidakhadiran.0.status_label', 'Izin')
                ->where('ketidakhadiran.0.mata_pelajaran', 'Biologi')
                ->where('isCandidate', false));
    }

    public function test_non_student_role_cannot_view_student_attendance(): void
    {
        $teacher = User::factory()->create(['role' => 'guru']);

        $this->actingAs($teacher)
            ->get(route('siswa.presensi.index'))
            ->assertForbidden();
    }

    public function test_unauthenticated_visitor_is_redirected_from_student_attendance(): void
    {
        $this->get(route('siswa.presensi.index'))
            ->assertRedirect(route('login'));
    }

    private function createClass(TahunAjaran $tahunAjaran, string $namaKelas): Kelas
    {
        return Kelas::create([
            'tahun_ajaran_id' => $tahunAjaran->id,
            'nama_kelas' => $namaKelas,
            'tingkat' => 10,
        ]);
    }

    private function createSchedule(
        TahunAjaran $tahunAjaran,
        Kelas $kelas,
        Guru $guru,
        MataPelajaran $mapel,
    ): Jadwal {
        return Jadwal::create([
            'tahun_ajaran_id' => $tahunAjaran->id,
            'kelas_id' => $kelas->id,
            'mapel_id' => $mapel->id,
            'guru_id' => $guru->id,
            'hari' => 'rabu',
            'jam_mulai' => '08:00',
            'jam_selesai' => '09:00',
        ]);
    }
}
