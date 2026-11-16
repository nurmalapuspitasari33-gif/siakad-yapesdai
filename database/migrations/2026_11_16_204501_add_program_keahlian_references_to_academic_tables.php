<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['pendaftaran_spmbs', 'siswas', 'kelas'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table): void {
                $table->foreignId('program_keahlian_id')
                    ->nullable()
                    ->constrained()
                    ->nullOnDelete();
                $table->foreignId('konsentrasi_keahlian_id')
                    ->nullable()
                    ->constrained()
                    ->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        foreach (['pendaftaran_spmbs', 'siswas', 'kelas'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table): void {
                $table->dropConstrainedForeignId('konsentrasi_keahlian_id');
                $table->dropConstrainedForeignId('program_keahlian_id');
            });
        }
    }
};
