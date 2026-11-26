<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('nilai_gurus')) {
            Schema::create('nilai_gurus', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('tahun_ajaran_id');
                $table->foreignId('siswa_id');
                $table->foreignId('kelas_id');
                $table->foreignId('mapel_id');
                $table->foreignId('guru_id');
                $table->unsignedTinyInteger('nilai_akhir');
                $table->text('capaian_kompetensi')->nullable();
                $table->timestamps();
            });
        }

        $foreignKeys = [
            ['tahun_ajaran_id', 'tahun_ajarans', 'nilai_gurus_tahun_ajaran_fk'],
            ['siswa_id', 'siswas', 'nilai_gurus_siswa_fk'],
            ['kelas_id', 'kelas', 'nilai_gurus_kelas_fk'],
            ['mapel_id', 'mata_pelajarans', 'nilai_gurus_mapel_fk'],
            ['guru_id', 'gurus', 'nilai_gurus_guru_fk'],
        ];

        foreach ($foreignKeys as [$column, $referencedTable, $name]) {
            if (Schema::hasForeignKey('nilai_gurus', $column)) {
                continue;
            }

            Schema::table('nilai_gurus', function (Blueprint $table) use ($column, $referencedTable, $name): void {
                $table->foreign($column, $name)->references('id')->on($referencedTable);
            });
        }

        $scoreColumns = ['tahun_ajaran_id', 'siswa_id', 'kelas_id', 'mapel_id', 'guru_id'];

        if (! Schema::hasIndex('nilai_gurus', 'nilai_gurus_score_unique')) {
            Schema::table('nilai_gurus', function (Blueprint $table) use ($scoreColumns): void {
                $table->unique($scoreColumns, 'nilai_gurus_score_unique');
            });
        }

        if (! Schema::hasIndex('nilai_gurus', 'nilai_gurus_assignment_idx')) {
            Schema::table('nilai_gurus', function (Blueprint $table): void {
                $table->index(
                    ['tahun_ajaran_id', 'kelas_id', 'mapel_id', 'guru_id'],
                    'nilai_gurus_assignment_idx',
                );
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('nilai_gurus');
    }
};
