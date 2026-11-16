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
        Schema::create('ujians', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mapel_id')->constrained('mata_pelajarans');
            $table->foreignId('guru_id')->constrained('gurus');
            $table->foreignId('kelas_id')->constrained('kelas');
            $table->string('judul_ujian');
            $table->dateTime('waktu_mulai');
            $table->unsignedSmallInteger('durasi_menit');
            $table->boolean('acak_soal')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ujians');
    }
};
