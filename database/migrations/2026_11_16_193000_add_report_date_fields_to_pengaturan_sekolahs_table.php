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
        Schema::table('pengaturan_sekolahs', function (Blueprint $table): void {
            $table->string('tempat_rapor')->nullable();
            $table->date('tanggal_rapor')->nullable();
        });

        DB::table('pengaturan_sekolahs')
            ->whereNull('tempat_rapor')
            ->update(['tempat_rapor' => 'Kesugihan']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pengaturan_sekolahs', function (Blueprint $table): void {
            $table->dropColumn(['tempat_rapor', 'tanggal_rapor']);
        });
    }
};
