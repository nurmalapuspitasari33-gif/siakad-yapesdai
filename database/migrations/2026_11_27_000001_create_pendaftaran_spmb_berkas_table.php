<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pendaftaran_spmb_berkas', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('pendaftaran_spmb_id')
                ->constrained('pendaftaran_spmbs')
                ->cascadeOnDelete();
            $table->string('path');
            $table->string('caption')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['pendaftaran_spmb_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pendaftaran_spmb_berkas');
    }
};
