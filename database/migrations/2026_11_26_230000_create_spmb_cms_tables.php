<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('gelombang_spmbs')) {
            Schema::create('gelombang_spmbs', function (Blueprint $table): void {
                $table->id();
                $table->string('nama_gelombang');
                $table->string('tahun_ajaran', 20);
                $table->date('tanggal_mulai');
                $table->date('tanggal_selesai');
                $table->unsignedInteger('kuota');
                $table->text('keterangan')->nullable();
                $table->boolean('is_active')->default(false);
                $table->timestamps();

                $table->index(['is_active', 'tanggal_mulai', 'tanggal_selesai'], 'gelombang_spmb_status_dates_idx');
            });
        }

        if (! Schema::hasTable('spmb_banners')) {
            Schema::create('spmb_banners', function (Blueprint $table): void {
                $table->id();
                $table->string('kicker');
                $table->string('judul');
                $table->text('subjudul');
                $table->string('gambar_path')->nullable();
                $table->string('cta_label');
                $table->string('cta_url', 2048);
                $table->unsignedSmallInteger('urutan')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->index(['is_active', 'urutan'], 'spmb_banners_active_order_idx');
            });
        }

        if (! Schema::hasTable('spmb_contents')) {
            Schema::create('spmb_contents', function (Blueprint $table): void {
                $table->id();
                $table->string('content_key')->unique('spmb_contents_key_unique');
                $table->json('content');
                $table->timestamps();
            });
        }

        if (! Schema::hasColumn('pendaftaran_spmbs', 'gelombang_spmb_id')) {
            Schema::table('pendaftaran_spmbs', function (Blueprint $table): void {
                $table->unsignedBigInteger('gelombang_spmb_id')->nullable()->after('user_id');
            });
        }

        if (! Schema::hasForeignKey('pendaftaran_spmbs', 'gelombang_spmb_id')) {
            Schema::table('pendaftaran_spmbs', function (Blueprint $table): void {
                $table->foreign('gelombang_spmb_id', 'pendaftaran_gelombang_spmb_fk')
                    ->references('id')
                    ->on('gelombang_spmbs')
                    ->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasForeignKey('pendaftaran_spmbs', 'gelombang_spmb_id')) {
            Schema::table('pendaftaran_spmbs', function (Blueprint $table): void {
                $table->dropForeign('pendaftaran_gelombang_spmb_fk');
            });
        }

        if (Schema::hasColumn('pendaftaran_spmbs', 'gelombang_spmb_id')) {
            Schema::table('pendaftaran_spmbs', function (Blueprint $table): void {
                $table->dropColumn('gelombang_spmb_id');
            });
        }

        Schema::dropIfExists('spmb_contents');
        Schema::dropIfExists('spmb_banners');
        Schema::dropIfExists('gelombang_spmbs');
    }
};
