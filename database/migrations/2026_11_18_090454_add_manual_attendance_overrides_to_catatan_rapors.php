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
        Schema::table('catatan_rapors', function (Blueprint $table) {
            $table->unsignedSmallInteger('presensi_manual_sakit')->nullable();
            $table->unsignedSmallInteger('presensi_manual_izin')->nullable();
            $table->unsignedSmallInteger('presensi_manual_tanpa_keterangan')->nullable();
        });

        DB::table('catatan_rapors')
            ->where('sakit', '>', 0)
            ->update(['presensi_manual_sakit' => DB::raw('sakit')]);
        DB::table('catatan_rapors')
            ->where('izin', '>', 0)
            ->update(['presensi_manual_izin' => DB::raw('izin')]);
        DB::table('catatan_rapors')
            ->where('tanpa_keterangan', '>', 0)
            ->update(['presensi_manual_tanpa_keterangan' => DB::raw('tanpa_keterangan')]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('catatan_rapors', function (Blueprint $table) {
            $table->dropColumn([
                'presensi_manual_sakit',
                'presensi_manual_izin',
                'presensi_manual_tanpa_keterangan',
            ]);
        });
    }
};
