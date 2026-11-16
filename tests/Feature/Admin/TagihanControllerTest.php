<?php

namespace Tests\Feature\Admin;

use App\Models\KategoriBeasiswa;
use App\Models\Kelas;
use App\Models\Siswa;
use App\Models\Tagihan;
use App\Models\TahunAjaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TagihanControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_generates_bills_only_for_active_students_in_the_selected_class(): void
    {
        $this->travelTo('2026-11-15 01:00:00');
        $admin = User::factory()->create(['role' => 'admin']);
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
        $activeStudent = $this->createStudent($kelas->id, '0000000001', 'aktif');
        $this->createStudent($kelas->id, '0000000002', 'calon_spmb');
        $this->createStudent(null, '0000000003', 'aktif');

        $this->actingAs($admin)
            ->post(route('admin.tagihan.generate'), [
                'target' => 'kelas',
                'kelas_id' => $kelas->id,
                'jenis_tagihan' => 'spp',
                'judul_tagihan' => 'SPP November 2026',
                'nominal' => 250000,
                'jatuh_tempo' => '2026-11-30',
            ])
            ->assertRedirect(route('admin.tagihan.index', absolute: false));

        $this->assertDatabaseCount('tagihans', 1);
        $this->assertDatabaseHas('tagihans', [
            'siswa_id' => $activeStudent->id,
            'judul_tagihan' => 'SPP November 2026',
            'jenis_tagihan' => 'spp',
            'nominal' => 250000,
            'status_bayar' => 'belum_lunas',
            'status_wa' => 'belum_terkirim',
        ]);
    }

    public function test_spp_generation_applies_program_and_scholarship_discounts_and_afirmasi_exemption(): void
    {
        $this->travelTo('2026-11-15 01:00:00');
        $admin = User::factory()->create(['role' => 'admin']);
        $affirmation = KategoriBeasiswa::create([
            'nama_beasiswa' => 'Afirmasi Pemerintah Uji',
            'jenis_potongan' => 'persen',
            'nilai_potongan' => 100,
            'is_afirmasi' => true,
        ]);
        $achievement = KategoriBeasiswa::create([
            'nama_beasiswa' => 'Beasiswa Prestasi Uji',
            'jenis_potongan' => 'persen',
            'nilai_potongan' => 25,
            'is_afirmasi' => false,
        ]);
        $regularStudent = $this->createStudent(null, '0000000011', 'aktif');
        $internalStudent = $this->createStudent(null, '0000000012', 'aktif');
        $externalStudent = $this->createStudent(null, '0000000013', 'aktif');
        $affirmationStudent = $this->createStudent(null, '0000000014', 'aktif');
        $achievementStudent = $this->createStudent(null, '0000000015', 'aktif');
        $internalStudent->update(['tipe_program' => 'santri_internal']);
        $externalStudent->update(['tipe_program' => 'santri_eksternal']);
        $affirmationStudent->update(['kategori_beasiswa_id' => $affirmation->id]);
        $achievementStudent->update([
            'tipe_program' => 'santri_internal',
            'kategori_beasiswa_id' => $achievement->id,
        ]);

        $this->actingAs($admin)
            ->post(route('admin.tagihan.generate'), [
                'target' => 'semua',
                'jenis_tagihan' => 'spp',
                'judul_tagihan' => 'SPP Uji',
                'nominal' => 100000,
                'jatuh_tempo' => '2026-11-30',
            ])
            ->assertRedirect(route('admin.tagihan.index', absolute: false));

        $this->assertDatabaseHas('tagihans', [
            'siswa_id' => $regularStudent->id,
            'jenis_tagihan' => 'spp',
            'nominal' => 100000,
            'status_bayar' => 'belum_lunas',
        ]);
        $this->assertDatabaseHas('tagihans', [
            'siswa_id' => $internalStudent->id,
            'nominal' => 30000,
        ]);
        $this->assertDatabaseHas('tagihans', [
            'siswa_id' => $externalStudent->id,
            'nominal' => 70000,
        ]);
        $this->assertDatabaseHas('tagihans', [
            'siswa_id' => $affirmationStudent->id,
            'nominal' => 0,
            'status_bayar' => 'lunas',
        ]);
        $this->assertDatabaseHas('tagihans', [
            'siswa_id' => $achievementStudent->id,
            'nominal' => 22500,
        ]);
    }

    public function test_praktikum_and_special_bill_rules_ignore_santri_discounts_and_special_exempts_no_one(): void
    {
        $this->travelTo('2026-11-15 01:00:00');
        $admin = User::factory()->create(['role' => 'admin']);
        $affirmation = KategoriBeasiswa::create([
            'nama_beasiswa' => 'Afirmasi Pemerintah Uji',
            'jenis_potongan' => 'persen',
            'nilai_potongan' => 100,
            'is_afirmasi' => true,
        ]);
        $affirmationStudent = $this->createStudent(null, '0000000021', 'aktif');
        $internalStudent = $this->createStudent(null, '0000000022', 'aktif');
        $affirmationStudent->update(['kategori_beasiswa_id' => $affirmation->id]);
        $internalStudent->update(['tipe_program' => 'santri_internal']);

        $this->actingAs($admin)
            ->post(route('admin.tagihan.generate'), [
                'target' => 'semua',
                'jenis_tagihan' => 'praktikum',
                'judul_tagihan' => 'Praktikum Uji',
                'nominal' => 50000,
                'jatuh_tempo' => '2026-11-30',
            ])
            ->assertRedirect(route('admin.tagihan.index', absolute: false));

        $this->assertDatabaseHas('tagihans', [
            'siswa_id' => $affirmationStudent->id,
            'jenis_tagihan' => 'praktikum',
            'nominal' => 0,
            'status_bayar' => 'lunas',
        ]);
        $this->assertDatabaseHas('tagihans', [
            'siswa_id' => $internalStudent->id,
            'jenis_tagihan' => 'praktikum',
            'nominal' => 50000,
            'status_bayar' => 'belum_lunas',
        ]);

        $this->actingAs($admin)
            ->post(route('admin.tagihan.generate'), [
                'target' => 'semua',
                'jenis_tagihan' => 'khusus_non_afirmasi',
                'judul_tagihan' => 'Seragam Uji',
                'nominal' => 120000,
                'jatuh_tempo' => '2026-11-30',
            ])
            ->assertRedirect(route('admin.tagihan.index', absolute: false));

        $this->assertDatabaseHas('tagihans', [
            'siswa_id' => $affirmationStudent->id,
            'jenis_tagihan' => 'khusus_non_afirmasi',
            'nominal' => 120000,
            'status_bayar' => 'belum_lunas',
        ]);
    }

    public function test_admin_can_mark_a_bill_as_whatsapp_sent_for_a_student_with_a_guardian_number(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $student = $this->createStudent(null, '0000000001', 'aktif', '081234567890');
        $bill = Tagihan::create([
            'siswa_id' => $student->id,
            'judul_tagihan' => 'SPP November 2026',
            'nominal' => 250000,
            'jatuh_tempo' => '2026-11-30',
            'status_bayar' => 'belum_lunas',
            'status_wa' => 'belum_terkirim',
        ]);

        $this->actingAs($admin)
            ->patch(route('admin.tagihan.mark-whatsapp-sent', $bill))
            ->assertRedirect();

        $this->assertDatabaseHas('tagihans', [
            'id' => $bill->id,
            'status_wa' => 'terkirim',
        ]);
    }

    private function createStudent(?int $kelasId, string $nisn, string $status, ?string $guardianPhone = null): Siswa
    {
        $user = User::factory()->create(['role' => 'siswa']);

        return Siswa::create([
            'user_id' => $user->id,
            'kelas_id' => $kelasId,
            'nisn' => $nisn,
            'nama_lengkap' => "Siswa {$nisn}",
            'no_wa_wali' => $guardianPhone,
            'status_siswa' => $status,
        ]);
    }
}
