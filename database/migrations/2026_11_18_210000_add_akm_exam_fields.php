<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ujians', function (Blueprint $table): void {
            $table->enum('mode_ujian', ['normal', 'akm'])->default('normal');
            $table->unsignedInteger('maks_pelanggaran')->default(3);
        });

        Schema::table('bank_soals', function (Blueprint $table): void {
            $table->enum('tipe_soal', ['pg', 'pg_kompleks', 'menjodohkan', 'isian_singkat', 'esai'])
                ->default('pg');
            $table->unsignedInteger('bobot')->default(1);
            $table->string('gambar_soal')->nullable();
            $table->string('gambar_a')->nullable();
            $table->string('gambar_b')->nullable();
            $table->string('gambar_c')->nullable();
            $table->string('gambar_d')->nullable();
            $table->string('gambar_e')->nullable();
            $table->json('opsi_json')->nullable();
        });

        Schema::table('hasil_ujians', function (Blueprint $table): void {
            $table->unsignedInteger('jumlah_pelanggaran')->default(0);
            $table->text('catatan_pelanggaran')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('hasil_ujians', function (Blueprint $table): void {
            $table->dropColumn(['jumlah_pelanggaran', 'catatan_pelanggaran']);
        });

        Schema::table('bank_soals', function (Blueprint $table): void {
            $table->dropColumn([
                'tipe_soal',
                'bobot',
                'gambar_soal',
                'gambar_a',
                'gambar_b',
                'gambar_c',
                'gambar_d',
                'gambar_e',
                'opsi_json',
            ]);
        });

        Schema::table('ujians', function (Blueprint $table): void {
            $table->dropColumn(['mode_ujian', 'maks_pelanggaran']);
        });
    }
};
