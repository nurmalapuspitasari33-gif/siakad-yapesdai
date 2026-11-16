<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('pengaturan_sekolahs', function (Blueprint $table): void {
            $table->id();
            $table->string('nama_sekolah')->default('Nama Sekolah');
            $table->string('npsn', 20)->nullable();
            $table->text('alamat')->nullable();
            $table->string('telepon', 30)->nullable();
            $table->string('email')->nullable();
            $table->string('kepala_sekolah')->nullable();
            $table->string('niky_kepala_sekolah', 50)->nullable();
            $table->string('logo_path')->nullable();
            $table->text('info_spmb')->nullable();
            $table->timestamps();
        });

        DB::table('pengaturan_sekolahs')->insert([
            'id' => 1,
            'nama_sekolah' => 'Nama Sekolah',
            'npsn' => null,
            'alamat' => null,
            'telepon' => null,
            'email' => null,
            'kepala_sekolah' => null,
            'niky_kepala_sekolah' => null,
            'logo_path' => null,
            'info_spmb' => 'Pendaftaran SPMB dilakukan secara daring melalui portal ini. Lengkapi formulir dan berkas persyaratan, lalu pantau hasil seleksi melalui akun Anda.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pengaturan_sekolahs');
    }
};
