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
        Schema::table('jadwals', function (Blueprint $table) {
            $table->foreignId('tugas_mengajar_id')
                ->nullable()
                ->constrained('tugas_mengajars')
                ->restrictOnDelete();
            $table->unsignedTinyInteger('jumlah_jp')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('jadwals', function (Blueprint $table) {
            $table->dropForeign(['tugas_mengajar_id']);
            $table->dropColumn(['tugas_mengajar_id', 'jumlah_jp']);
        });
    }
};
