<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('program_keahlians', function (Blueprint $table): void {
            $table->id();
            $table->string('kode_jurusan')->unique();
            $table->string('nama_jurusan')->unique();
            $table->text('keterangan')->nullable();
            $table->timestamps();
        });

        Schema::create('konsentrasi_keahlians', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('program_keahlian_id')->constrained()->cascadeOnDelete();
            $table->string('kode_konsentrasi')->unique();
            $table->string('nama_konsentrasi');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('konsentrasi_keahlians');
        Schema::dropIfExists('program_keahlians');
    }
};
