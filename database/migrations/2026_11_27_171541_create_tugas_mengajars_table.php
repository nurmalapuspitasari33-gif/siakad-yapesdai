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
        Schema::create('tugas_mengajars', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tahun_ajaran_id')->constrained()->restrictOnDelete();
            $table->foreignId('guru_id')->constrained('gurus')->restrictOnDelete();
            $table->foreignId('kelas_id')->constrained('kelas')->restrictOnDelete();
            $table->foreignId('mapel_id')->constrained('mata_pelajarans')->restrictOnDelete();
            $table->unsignedTinyInteger('jp_per_minggu');
            $table->unique(
                ['tahun_ajaran_id', 'guru_id', 'kelas_id', 'mapel_id'],
                'tugas_mengajar_scope_unique',
            );
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tugas_mengajars');
    }
};
