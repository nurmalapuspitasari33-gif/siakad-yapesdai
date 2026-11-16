<?php

namespace Tests\Feature\Siswa;

use App\Models\Siswa;
use App\Models\Tagihan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TagihanControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_only_sees_their_own_bill_history(): void
    {
        $studentUser = User::factory()->create(['role' => 'siswa']);
        $student = Siswa::create([
            'user_id' => $studentUser->id,
            'nisn' => '0000000001',
            'nama_lengkap' => 'Siswa Aktif',
            'status_siswa' => 'aktif',
        ]);
        $otherUser = User::factory()->create(['role' => 'siswa']);
        $otherStudent = Siswa::create([
            'user_id' => $otherUser->id,
            'nisn' => '0000000002',
            'nama_lengkap' => 'Siswa Lain',
            'status_siswa' => 'aktif',
        ]);
        Tagihan::create([
            'siswa_id' => $student->id,
            'judul_tagihan' => 'SPP November 2026',
            'nominal' => 250000,
            'jatuh_tempo' => '2026-11-30',
            'status_bayar' => 'belum_lunas',
        ]);
        Tagihan::create([
            'siswa_id' => $otherStudent->id,
            'judul_tagihan' => 'Tagihan privat',
            'nominal' => 100000,
            'jatuh_tempo' => '2026-11-30',
            'status_bayar' => 'lunas',
        ]);

        $this->actingAs($studentUser)
            ->get(route('siswa.tagihan.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Siswa/Tagihan/Index')
                ->has('tagihans', 1)
                ->where('tagihans.0.judul_tagihan', 'SPP November 2026'));
    }
}
