<?php

namespace Tests\Feature\Database;

use App\Models\MataPelajaran;
use App\Models\ProgramKeahlian;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class KonsentrasiKeahlianMataPelajaranMigrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_existing_pivot_is_repaired_without_losing_mappings(): void
    {
        $program = ProgramKeahlian::create([
            'kode_jurusan' => 'RPL',
            'nama_jurusan' => 'Rekayasa Perangkat Lunak',
        ]);
        $concentration = $program->konsentrasiKeahlians()->create([
            'kode_konsentrasi' => 'PPLG',
            'nama_konsentrasi' => 'Pengembangan Perangkat Lunak dan Gim',
        ]);
        $subject = MataPelajaran::create([
            'kode_mapel' => 'PPLG-001',
            'nama_mapel' => 'Pemrograman Dasar',
        ]);

        Schema::drop('konsentrasi_keahlian_mata_pelajaran');
        Schema::create('konsentrasi_keahlian_mata_pelajaran', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('konsentrasi_keahlian_id');
            $table->foreignId('mata_pelajaran_id');
            $table->unsignedSmallInteger('urutan');
            $table->timestamps();
            $table->unique(
                ['konsentrasi_keahlian_id', 'mata_pelajaran_id'],
                'konsentrasi_mapel_unique',
            );
            $table->index(
                ['konsentrasi_keahlian_id', 'urutan'],
                'konsentrasi_mapel_order_idx',
            );
        });

        DB::table('konsentrasi_keahlian_mata_pelajaran')->insert([
            'konsentrasi_keahlian_id' => $concentration->id,
            'mata_pelajaran_id' => $subject->id,
            'urutan' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $migration = require database_path(
            'migrations/2026_11_27_095459_create_konsentrasi_keahlian_mata_pelajaran_table.php',
        );
        $migration->up();

        $this->assertDatabaseHas('konsentrasi_keahlian_mata_pelajaran', [
            'konsentrasi_keahlian_id' => $concentration->id,
            'mata_pelajaran_id' => $subject->id,
            'urutan' => 1,
        ]);
        $this->assertTrue(collect(Schema::getIndexes('konsentrasi_keahlian_mata_pelajaran'))
            ->contains(fn (array $index): bool => $index['unique']
                && $index['columns'] === ['konsentrasi_keahlian_id', 'mata_pelajaran_id']));
        $this->assertTrue(collect(Schema::getIndexes('konsentrasi_keahlian_mata_pelajaran'))
            ->contains(fn (array $index): bool => ! $index['unique']
                && $index['columns'] === ['konsentrasi_keahlian_id', 'urutan']));
        $this->assertCount(2, Schema::getForeignKeys('konsentrasi_keahlian_mata_pelajaran'));
    }
}
