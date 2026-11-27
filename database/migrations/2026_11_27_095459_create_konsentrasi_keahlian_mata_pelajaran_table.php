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
        Schema::create('konsentrasi_keahlian_mata_pelajaran', function (Blueprint $table) {
            $table->id();
            $table->foreignId('konsentrasi_keahlian_id');
            $table->foreignId('mata_pelajaran_id');
            $table->unsignedSmallInteger('urutan');
            $table->timestamps();

            $table->foreign('konsentrasi_keahlian_id', 'kons_mapel_konsentrasi_fk')
                ->references('id')
                ->on('konsentrasi_keahlians')
                ->cascadeOnDelete();
            $table->foreign('mata_pelajaran_id', 'kons_mapel_mapel_fk')
                ->references('id')
                ->on('mata_pelajarans')
                ->cascadeOnDelete();
            $table->unique(
                ['konsentrasi_keahlian_id', 'mata_pelajaran_id'],
                'konsentrasi_mapel_unique',
            );
            $table->index(
                ['konsentrasi_keahlian_id', 'urutan'],
                'konsentrasi_mapel_order_idx',
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('konsentrasi_keahlian_mata_pelajaran');
    }
};
