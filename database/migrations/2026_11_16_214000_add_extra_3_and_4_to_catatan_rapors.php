<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('catatan_rapors', function (Blueprint $table): void {
            $table->string('ekstra_3_nama')->nullable();
            $table->string('ekstra_3_ket')->nullable();
            $table->string('ekstra_4_nama')->nullable();
            $table->string('ekstra_4_ket')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('catatan_rapors', function (Blueprint $table): void {
            $table->dropColumn([
                'ekstra_3_nama',
                'ekstra_3_ket',
                'ekstra_4_nama',
                'ekstra_4_ket',
            ]);
        });
    }
};
