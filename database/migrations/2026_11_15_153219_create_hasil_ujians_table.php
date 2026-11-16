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
        Schema::create('hasil_ujians', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ujian_id')->constrained('ujians')->cascadeOnDelete();
            $table->foreignId('siswa_id')->constrained('siswas');
            $table->json('jawaban_json')->nullable();
            $table->decimal('skor_akhir', 5, 2)->nullable();
            $table->string('status_pengerjaan')->default('belum_mulai');
            $table->timestamps();

            $table->unique(['ujian_id', 'siswa_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hasil_ujians');
    }
};
