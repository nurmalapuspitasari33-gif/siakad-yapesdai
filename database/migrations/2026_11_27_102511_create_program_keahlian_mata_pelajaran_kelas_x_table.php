<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('program_keahlian_mata_pelajaran_kelas_x', function (Blueprint $table) {
            $table->id();
            $table->foreignId('program_keahlian_id');
            $table->foreignId('mata_pelajaran_id');
            $table->unsignedSmallInteger('urutan');
            $table->timestamps();

            $table->foreign('program_keahlian_id', 'prog_mapel_x_program_fk')
                ->references('id')
                ->on('program_keahlians')
                ->cascadeOnDelete();
            $table->foreign('mata_pelajaran_id', 'prog_mapel_x_mapel_fk')
                ->references('id')
                ->on('mata_pelajarans')
                ->cascadeOnDelete();
            $table->unique(
                ['program_keahlian_id', 'mata_pelajaran_id'],
                'program_keahlian_mapel_kelas_x_unique',
            );
            $table->index(
                ['program_keahlian_id', 'urutan'],
                'program_keahlian_mapel_kelas_x_order_idx',
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('program_keahlian_mata_pelajaran_kelas_x');
    }
};
