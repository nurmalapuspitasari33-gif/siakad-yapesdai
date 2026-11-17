<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE bank_soals DROP CONSTRAINT IF EXISTS bank_soals_kunci_jawaban_check');
            DB::statement('ALTER TABLE bank_soals ALTER COLUMN kunci_jawaban TYPE VARCHAR(10)');
            DB::statement("ALTER TABLE bank_soals ADD CONSTRAINT bank_soals_kunci_jawaban_check CHECK (kunci_jawaban IN ('A', 'B', 'C', 'D', 'E'))");
        } else {
            Schema::table('bank_soals', function (Blueprint $table) {
                $table->enum('kunci_jawaban', ['A', 'B', 'C', 'D', 'E'])->change();
            });
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE bank_soals DROP CONSTRAINT IF EXISTS bank_soals_kunci_jawaban_check');
            DB::statement('ALTER TABLE bank_soals ALTER COLUMN kunci_jawaban TYPE VARCHAR(10)');
            DB::statement("ALTER TABLE bank_soals ADD CONSTRAINT bank_soals_kunci_jawaban_check CHECK (kunci_jawaban IN ('A', 'B', 'C', 'D'))");
        } else {
            Schema::table('bank_soals', function (Blueprint $table) {
                $table->enum('kunci_jawaban', ['A', 'B', 'C', 'D'])->change();
            });
        }
    }
};