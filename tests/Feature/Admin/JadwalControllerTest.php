<?php

namespace Tests\Feature\Admin;

use App\Models\Guru;
use App\Models\Jadwal;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\TahunAjaran;
use App\Models\TugasMengajar;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class JadwalControllerTest extends TestCase
{
    use RefreshDatabase;

    #[DataProvider('sessionTimingAcrossBreaks')]
    public function test_schedule_extends_the_end_time_when_a_session_crosses_a_break(
        string $jamMulai,
        int $jumlahJp,
        string $jamSelesai,
        int $jpTarget,
    ): void {
        $admin = User::factory()->create(['role' => 'admin']);
        [$tahunAjaran, $kelas, $guru, $mapel] = $this->createScheduleData();
        $tugasMengajar = $this->createTugasMengajar($tahunAjaran, $kelas, $guru, $mapel, $jpTarget);

        $this->actingAs($admin)
            ->post(route('admin.jadwal.store'), [
                'tugas_mengajar_id' => $tugasMengajar->id,
                'jumlah_jp' => $jumlahJp,
                'hari' => 'senin',
                'jam_mulai' => $jamMulai,
            ])
            ->assertRedirect(route('admin.jadwal.index', absolute: false));

        $this->assertDatabaseHas('jadwals', [
            'tugas_mengajar_id' => $tugasMengajar->id,
            'jumlah_jp' => $jumlahJp,
            'jam_mulai' => $jamMulai,
            'jam_selesai' => $jamSelesai,
        ]);
    }

    public static function sessionTimingAcrossBreaks(): array
    {
        return [
            'crosses the first break' => ['09:20', 1, '10:20', 4],
            'crosses both breaks' => ['09:00', 5, '13:10', 5],
        ];
    }

    #[DataProvider('breakStartTimes')]
    public function test_schedule_cannot_start_during_a_break(string $jamMulai): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        [$tahunAjaran, $kelas, $guru, $mapel] = $this->createScheduleData();
        $tugasMengajar = $this->createTugasMengajar($tahunAjaran, $kelas, $guru, $mapel, 4);

        $this->actingAs($admin)
            ->post(route('admin.jadwal.store'), [
                'tugas_mengajar_id' => $tugasMengajar->id,
                'jumlah_jp' => 1,
                'hari' => 'senin',
                'jam_mulai' => $jamMulai,
            ])
            ->assertSessionHasErrors([
                'jam_mulai' => 'Jam mulai tidak boleh berada pada waktu istirahat (09.40–10.00 atau 12.00–12.30).',
            ]);

        $this->assertDatabaseCount('jadwals', 0);
    }

    public static function breakStartTimes(): array
    {
        return [
            'first break' => ['09:40'],
            'second break' => ['12:00'],
        ];
    }

    public function test_admin_schedules_from_a_teaching_assignment_and_conflicts_or_weekly_overages_are_rejected(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        [$tahunAjaran, $kelas, $guru, $mapel] = $this->createScheduleData();
        $this->createJadwal($tahunAjaran, $kelas, $guru, $mapel, '08:00', '09:00');
        $tugasMengajar = $this->createTugasMengajar($tahunAjaran, $kelas, $guru, $mapel, 4);

        $this->actingAs($admin)
            ->get(route('admin.jadwal.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Jadwal/Index')
                ->has('jadwals.data', 1)
                ->has('tugasMengajarOptions', 1));

        $baseInput = [
            'tugas_mengajar_id' => $tugasMengajar->id,
            'jumlah_jp' => 1,
            'hari' => 'senin',
        ];

        $this->actingAs($admin)
            ->post(route('admin.jadwal.store'), [
                ...$baseInput,
                'jam_mulai' => '09:00',
            ])
            ->assertRedirect(route('admin.jadwal.index', absolute: false));

        $this->actingAs($admin)
            ->post(route('admin.jadwal.store'), [
                ...$baseInput,
                'jam_mulai' => '08:30',
            ])
            ->assertSessionHasErrors('jam_mulai');

        $this->assertDatabaseHas('jadwals', [
            'tugas_mengajar_id' => $tugasMengajar->id,
            'jumlah_jp' => 1,
            'jam_mulai' => '09:00',
            'jam_selesai' => '09:40',
        ]);

        $kelasLain = Kelas::create([
            'tahun_ajaran_id' => $tahunAjaran->id,
            'nama_kelas' => 'X IPA 2',
            'tingkat' => 10,
        ]);
        $tugasKelasLain = $this->createTugasMengajar($tahunAjaran, $kelasLain, $guru, $mapel, 4);

        $this->actingAs($admin)
            ->post(route('admin.jadwal.store'), [
                ...$baseInput,
                'tugas_mengajar_id' => $tugasKelasLain->id,
                'jam_mulai' => '08:30',
            ])
            ->assertSessionHasErrors('jam_mulai');

        $this->actingAs($admin)
            ->post(route('admin.jadwal.store'), [
                ...$baseInput,
                'jumlah_jp' => 3,
                'jam_mulai' => '10:00',
            ])
            ->assertRedirect(route('admin.jadwal.index', absolute: false));

        $this->actingAs($admin)
            ->post(route('admin.jadwal.store'), [
                ...$baseInput,
                'hari' => 'selasa',
                'jam_mulai' => '08:00',
            ])
            ->assertSessionHasErrors('jumlah_jp');

        $this->assertDatabaseCount('jadwals', 3);
    }

    public function test_schedule_session_cannot_extend_past_midnight(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        [$tahunAjaran, $kelas, $guru, $mapel] = $this->createScheduleData();
        $tugasMengajar = $this->createTugasMengajar($tahunAjaran, $kelas, $guru, $mapel, 4);

        $this->actingAs($admin)
            ->post(route('admin.jadwal.store'), [
                'tugas_mengajar_id' => $tugasMengajar->id,
                'jumlah_jp' => 1,
                'hari' => 'senin',
                'jam_mulai' => '23:40',
            ])
            ->assertSessionHasErrors([
                'jumlah_jp' => 'Durasi jadwal tidak boleh melewati pukul 24.00.',
            ]);

        $this->assertDatabaseCount('jadwals', 0);
    }

    private function createScheduleData(): array
    {
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
        $user = User::factory()->create(['role' => 'guru']);
        $guru = Guru::create([
            'user_id' => $user->id,
            'nip' => '19870001',
            'nama_lengkap' => 'Guru Matematika',
        ]);
        $mapel = MataPelajaran::create([
            'kode_mapel' => 'MAT-001',
            'nama_mapel' => 'Matematika',
        ]);

        return [$tahunAjaran, $kelas, $guru, $mapel];
    }

    private function createJadwal(
        TahunAjaran $tahunAjaran,
        Kelas $kelas,
        Guru $guru,
        MataPelajaran $mapel,
        string $jamMulai,
        string $jamSelesai,
    ): Jadwal {
        return Jadwal::create([
            'tahun_ajaran_id' => $tahunAjaran->id,
            'kelas_id' => $kelas->id,
            'mapel_id' => $mapel->id,
            'guru_id' => $guru->id,
            'hari' => 'senin',
            'jam_mulai' => $jamMulai,
            'jam_selesai' => $jamSelesai,
        ]);
    }

    private function createTugasMengajar(
        TahunAjaran $tahunAjaran,
        Kelas $kelas,
        Guru $guru,
        MataPelajaran $mapel,
        int $jpPerMinggu,
    ): TugasMengajar {
        return TugasMengajar::create([
            'tahun_ajaran_id' => $tahunAjaran->id,
            'kelas_id' => $kelas->id,
            'guru_id' => $guru->id,
            'mapel_id' => $mapel->id,
            'jp_per_minggu' => $jpPerMinggu,
        ]);
    }
}
