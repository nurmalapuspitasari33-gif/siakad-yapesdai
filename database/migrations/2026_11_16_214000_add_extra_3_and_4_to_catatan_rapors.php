<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('catatan_rapors')) {
            Schema::table('catatan_rapors', function (Blueprint $table) {
                if (!Schema::hasColumn('catatan_rapors', 'ekstra_3_nama')) {
                    $table->string('ekstra_3_nama')->nullable();
                }
                if (!Schema::hasColumn('catatan_rapors', 'ekstra_3_keterangan')) {
                    $table->text('ekstra_3_keterangan')->nullable();
                }
                if (!Schema::hasColumn('catatan_rapors', 'ekstra_4_nama')) {
                    $table->string('ekstra_4_nama')->nullable();
                }
                if (!Schema::hasColumn('catatan_rapors', 'ekstra_4_keterangan')) {
                    $table->text('ekstra_4_keterangan')->nullable();
                }
            });
        }
    }

    public function down(): void
    {
        //
    }
};