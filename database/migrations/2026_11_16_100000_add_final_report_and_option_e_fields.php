<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('nilais', function (Blueprint $table): void {
            $table->decimal('nilai_tugas', 5, 2)->nullable()->change();
            $table->decimal('nilai_uts', 5, 2)->nullable()->change();
            $table->decimal('nilai_uas', 5, 2)->nullable()->change();
            $table->text('capaian_kompetensi')->nullable();
        });

        Schema::table('pengaturan_sekolahs', function (Blueprint $table): void {
            $table->text('template_kokurikuler')->nullable();
        });

        DB::table('pengaturan_sekolahs')
            ->whereNull('template_kokurikuler')
            ->update([
                'template_kokurikuler' => 'Ananda sudah {predikat} dalam keterampilan mengolah barang bekas menjadi pot bunga, namun masih perlu berlatih meningkatkan ketelitian pada tahap finishing. {predikat} dalam mengidentifikasi potensi limbah, menumbuhkan kepedulian lingkungan, namun masih perlu berlatih mengembangkan ide inovatif untuk meningkatkan nilai jual produk.',
            ]);

        Schema::create('catatan_rapors', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tahun_ajaran_id')->constrained('tahun_ajarans')->cascadeOnDelete();
            $table->foreignId('siswa_id')->constrained('siswas')->cascadeOnDelete();
            $table->enum('kokurikuler_predikat', ['Amat Baik', 'Baik', 'Cukup', 'Kurang'])->nullable();
            $table->text('kokurikuler_deskripsi')->nullable();
            $table->string('ekstra_1_nama')->nullable();
            $table->string('ekstra_1_ket')->nullable();
            $table->string('ekstra_2_nama')->nullable();
            $table->string('ekstra_2_ket')->nullable();
            $table->unsignedSmallInteger('sakit')->default(0);
            $table->unsignedSmallInteger('izin')->default(0);
            $table->unsignedSmallInteger('tanpa_keterangan')->default(0);
            $table->text('catatan_wali_kelas')->nullable();
            $table->enum('status_kenaikan', ['naik', 'tidak_naik'])->nullable();
            $table->string('naik_ke_kelas')->nullable();
            $table->timestamps();

            $table->unique(['tahun_ajaran_id', 'siswa_id']);
        });

        Schema::table('bank_soals', function (Blueprint $table): void {
            $table->text('opsi_e')->nullable();
            $table->enum('kunci_jawaban', ['A', 'B', 'C', 'D', 'E'])->change();
        });
    }

    public function down(): void
    {
        if (DB::table('bank_soals')->where('kunci_jawaban', 'E')->exists()) {
            throw new RuntimeException('Hapus atau ubah kunci jawaban E sebelum membatalkan migrasi.');
        }

        if (DB::table('nilais')->whereNull('nilai_tugas')
            ->orWhereNull('nilai_uts')
            ->orWhereNull('nilai_uas')
            ->exists()) {
            throw new RuntimeException('Nilai lama yang kosong harus diisi sebelum membatalkan migrasi.');
        }

        Schema::table('bank_soals', function (Blueprint $table): void {
            $table->enum('kunci_jawaban', ['A', 'B', 'C', 'D'])->change();
            $table->dropColumn('opsi_e');
        });

        Schema::dropIfExists('catatan_rapors');

        Schema::table('pengaturan_sekolahs', function (Blueprint $table): void {
            $table->dropColumn('template_kokurikuler');
        });

        Schema::table('nilais', function (Blueprint $table): void {
            $table->dropColumn('capaian_kompetensi');
            $table->decimal('nilai_tugas', 5, 2)->nullable(false)->change();
            $table->decimal('nilai_uts', 5, 2)->nullable(false)->change();
            $table->decimal('nilai_uas', 5, 2)->nullable(false)->change();
        });
    }
};
