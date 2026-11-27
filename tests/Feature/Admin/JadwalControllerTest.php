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
        int $jamKeMulai,
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
                'jam_ke_mulai' => $jamKeMulai,
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
            'crosses the first break' => [4, '09:00', 2, '10:40', 4],
            'crosses both breaks' => [1, '07:00', 8, '13:10', 8],
        ];
    }

    public function test_friday_schedule_cannot_extend_beyond_the_fifth_period(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        [$tahunAjaran, $kelas, $guru, $mapel] = $this->createScheduleData();
        $tugasMengajar = $this->createTugasMengajar($tahunAjaran, $kelas, $guru, $mapel, 4);

        $this->actingAs($admin)
            ->post(route('admin.jadwal.store'), [
                'tugas_mengajar_id' => $tugasMengajar->id,
                'jumlah_jp' => 2,
                'hari' => 'jumat',
                'jam_ke_mulai' => 5,
            ])
            ->assertSessionHasErrors([
                'jumlah_jp' => 'Jadwal hari Jumat hanya dapat berlangsung sampai jam ke-5.',
            ]);

        $this->assertDatabaseCount('jadwals', 0);
    }

    public function test_non_friday_schedule_cannot_extend_beyond_the_ninth_period(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        [$tahunAjaran, $kelas, $guru, $mapel] = $this->createScheduleData();
        $tugasMengajar = $this->createTugasMengajar($tahunAjaran, $kelas, $guru, $mapel, 4);

        $this->actingAs($admin)
            ->post(route('admin.jadwal.store'), [
                'tugas_mengajar_id' => $tugasMengajar->id,
                'jumlah_jp' => 2,
                'hari' => 'senin',
                'jam_ke_mulai' => 9,
            ])
            ->assertSessionHasErrors([
                'jumlah_jp' => 'Jadwal tidak dapat berlangsung melewati jam ke-9.',
            ]);

        $this->assertDatabaseCount('jadwals', 0);
    }

    public function test_friday_cannot_select_a_period_after_the_fifth_period(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        [$tahunAjaran, $kelas, $guru, $mapel] = $this->createScheduleData();
        $tugasMengajar = $this->createTugasMengajar($tahunAjaran, $kelas, $guru, $mapel, 4);

        $this->actingAs($admin)
            ->post(route('admin.jadwal.store'), [
                'tugas_mengajar_id' => $tugasMengajar->id,
                'jumlah_jp' => 1,
                'hari' => 'jumat',
                'jam_ke_mulai' => 6,
            ])
            ->assertSessionHasErrors([
                'jam_ke_mulai' => 'Jam ke- tidak tersedia pada hari yang dipilih.',
            ]);

        $this->assertDatabaseCount('jadwals', 0);
    }

    public function test_new_schedules_are_limited_to_monday_through_saturday(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        [$tahunAjaran, $kelas, $guru, $mapel] = $this->createScheduleData();
        $tugasMengajar = $this->createTugasMengajar($tahunAjaran, $kelas, $guru, $mapel, 4);

        $this->actingAs($admin)
            ->post(route('admin.jadwal.store'), [
                'tugas_mengajar_id' => $tugasMengajar->id,
                'jumlah_jp' => 1,
                'hari' => 'minggu',
                'jam_ke_mulai' => 1,
            ])
            ->assertSessionHasErrors([
                'hari' => 'Hari yang dipilih tidak valid.',
            ]);

        $this->assertDatabaseCount('jadwals', 0);
    }

    public function test_existing_sunday_schedule_can_still_be_edited(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        [$tahunAjaran, $kelas, $guru, $mapel] = $this->createScheduleData();
        $jadwal = $this->createJadwal($tahunAjaran, $kelas, $guru, $mapel, '07:00', '07:40');
        $jadwal->update(['hari' => 'minggu']);
        $tugasMengajar = $this->createTugasMengajar($tahunAjaran, $kelas, $guru, $mapel, 4);

        $this->actingAs($admin)
            ->put(route('admin.jadwal.update', $jadwal->id), [
                'tugas_mengajar_id' => $tugasMengajar->id,
                'jumlah_jp' => 1,
                'ruang' => '',
                'hari' => 'minggu',
                'jam_ke_mulai' => 1,
            ])
            ->assertRedirect(route('admin.jadwal.index', absolute: false));

        $this->assertDatabaseHas('jadwals', [
            'id' => $jadwal->id,
            'hari' => 'minggu',
            'jam_mulai' => '07:00',
            'jam_selesai' => '07:40',
            'tugas_mengajar_id' => $tugasMengajar->id,
        ]);
    }

    public function test_admin_generates_schedules_without_teacher_or_class_conflicts(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        [$tahunAjaran, $kelas, $guru, $mapel] = $this->createScheduleData();
        $kelasLain = Kelas::create([
            'tahun_ajaran_id' => $tahunAjaran->id,
            'nama_kelas' => 'X IPA 2',
            'tingkat' => 10,
        ]);
        $guruLainUser = User::factory()->create(['role' => 'guru']);
        $guruLain = Guru::create([
            'user_id' => $guruLainUser->id,
            'nip' => '19870002',
            'nama_lengkap' => 'Guru Bahasa',
        ]);
        $mapelLain = MataPelajaran::create([
            'kode_mapel' => 'BIN-001',
            'nama_mapel' => 'Bahasa Indonesia',
        ]);
        $tugasMengajar = [
            $this->createTugasMengajar($tahunAjaran, $kelas, $guru, $mapel, 3),
            $this->createTugasMengajar($tahunAjaran, $kelasLain, $guru, $mapel, 3),
            $this->createTugasMengajar($tahunAjaran, $kelas, $guruLain, $mapelLain, 3),
        ];

        $this->actingAs($admin)
            ->post(route('admin.jadwal.generate'))
            ->assertRedirect(route('admin.jadwal.index', absolute: false))
            ->assertSessionHas('success', 'Jadwal otomatis berhasil dibuat: 9 JP dalam 3 sesi.');

        $jadwals = Jadwal::query()
            ->where('tahun_ajaran_id', $tahunAjaran->id)
            ->get();

        $this->assertCount(3, $jadwals);
        $this->assertSame(9, (int) $jadwals->sum('jumlah_jp'));

        foreach ($tugasMengajar as $tugas) {
            $this->assertSame(
                $tugas->jp_per_minggu,
                (int) $jadwals->where('tugas_mengajar_id', $tugas->id)->sum('jumlah_jp'),
            );
        }

        foreach ($jadwals as $index => $jadwal) {
            foreach ($jadwals->slice($index + 1) as $otherJadwal) {
                if ($jadwal->hari !== $otherJadwal->hari) {
                    continue;
                }

                $overlaps = $jadwal->jam_mulai < $otherJadwal->jam_selesai
                    && $jadwal->jam_selesai > $otherJadwal->jam_mulai;

                $sharesTeacherOrClass = $jadwal->guru_id === $otherJadwal->guru_id
                    || $jadwal->kelas_id === $otherJadwal->kelas_id;

                $this->assertFalse($overlaps && $sharesTeacherOrClass);
            }
        }
    }

    public function test_generator_does_not_replace_an_existing_schedule(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        [$tahunAjaran, $kelas, $guru, $mapel] = $this->createScheduleData();
        $this->createJadwal($tahunAjaran, $kelas, $guru, $mapel, '08:00', '09:00');
        $this->createTugasMengajar($tahunAjaran, $kelas, $guru, $mapel, 3);

        $this->actingAs($admin)
            ->post(route('admin.jadwal.generate'))
            ->assertSessionHas('error', 'Jadwal tahun ajaran aktif sudah berisi data. Generator hanya berjalan pada jadwal yang masih kosong; data lama tidak diubah.');

        $this->assertDatabaseCount('jadwals', 1);
        $this->assertDatabaseHas('jadwals', [
            'tahun_ajaran_id' => $tahunAjaran->id,
            'jam_mulai' => '08:00',
            'jam_selesai' => '09:00',
        ]);
    }

    public function test_generator_saves_nothing_when_weekly_targets_exceed_available_periods(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        [$tahunAjaran, $kelas, $guru, $mapel] = $this->createScheduleData();
        $this->createTugasMengajar($tahunAjaran, $kelas, $guru, $mapel, 51);

        $this->actingAs($admin)
            ->post(route('admin.jadwal.generate'))
            ->assertSessionHas('error');

        $this->assertDatabaseCount('jadwals', 0);
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
                ->has('tugasMengajarOptions', 1)
                ->has('jamKeOptions', 9)
                ->where('jamKeOptions', [
                    ['jam_ke' => 1, 'jam_mulai' => '07:00'],
                    ['jam_ke' => 2, 'jam_mulai' => '07:40'],
                    ['jam_ke' => 3, 'jam_mulai' => '08:20'],
                    ['jam_ke' => 4, 'jam_mulai' => '09:00'],
                    ['jam_ke' => 5, 'jam_mulai' => '10:00'],
                    ['jam_ke' => 6, 'jam_mulai' => '10:40'],
                    ['jam_ke' => 7, 'jam_mulai' => '11:20'],
                    ['jam_ke' => 8, 'jam_mulai' => '12:30'],
                    ['jam_ke' => 9, 'jam_mulai' => '13:10'],
                ])
                ->where('canGenerateSchedule', false)
                ->where('hasExistingSchedules', true));

        $baseInput = [
            'tugas_mengajar_id' => $tugasMengajar->id,
            'jumlah_jp' => 1,
            'hari' => 'senin',
        ];

        $this->actingAs($admin)
            ->post(route('admin.jadwal.store'), [
                ...$baseInput,
                'jam_ke_mulai' => 4,
            ])
            ->assertRedirect(route('admin.jadwal.index', absolute: false));

        $this->actingAs($admin)
            ->post(route('admin.jadwal.store'), [
                ...$baseInput,
                'jam_ke_mulai' => 3,
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
                'jam_ke_mulai' => 3,
            ])
            ->assertSessionHasErrors('jam_mulai');

        $this->actingAs($admin)
            ->post(route('admin.jadwal.store'), [
                ...$baseInput,
                'jumlah_jp' => 3,
                'jam_ke_mulai' => 5,
            ])
            ->assertRedirect(route('admin.jadwal.index', absolute: false));

        $this->actingAs($admin)
            ->post(route('admin.jadwal.store'), [
                ...$baseInput,
                'hari' => 'selasa',
                'jam_ke_mulai' => 1,
            ])
            ->assertSessionHasErrors('jumlah_jp');

        $this->assertDatabaseCount('jadwals', 3);
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
