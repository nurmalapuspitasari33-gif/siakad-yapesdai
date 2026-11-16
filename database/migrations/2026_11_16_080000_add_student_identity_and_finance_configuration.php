<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kategori_beasiswas', function (Blueprint $table): void {
            $table->id();
            $table->string('nama_beasiswa')->unique();
            $table->enum('jenis_potongan', ['persen', 'nominal']);
            $table->decimal('nilai_potongan', 12, 2)->default(0);
            $table->boolean('is_afirmasi')->default(false);
            $table->text('keterangan')->nullable();
            $table->timestamps();
        });

        Schema::table('pengaturan_sekolahs', function (Blueprint $table): void {
            $table->decimal('tarif_spp_reguler', 12, 2)->default(0);
            $table->decimal('tarif_praktikum', 12, 2)->default(0);
        });

        Schema::table('siswas', function (Blueprint $table): void {
            $table->string('nis')->nullable()->unique();
            $table->string('tempat_lahir', 100)->nullable();
            $table->date('tanggal_lahir')->nullable();
            $table->enum('jenis_kelamin', ['L', 'P'])->nullable();
            $table->string('agama', 50)->nullable();
            $table->string('status_keluarga', 50)->nullable();
            $table->unsignedTinyInteger('anak_ke')->nullable();
            $table->text('alamat_murid')->nullable();
            $table->string('telepon_rumah', 30)->nullable();
            $table->string('sekolah_asal')->nullable();
            $table->string('diterima_di_kelas')->nullable();
            $table->date('tanggal_diterima')->nullable();
            $table->string('nama_ayah')->nullable();
            $table->string('nama_ibu')->nullable();
            $table->text('alamat_ortu')->nullable();
            $table->string('telepon_ortu', 30)->nullable();
            $table->string('pekerjaan_ayah')->nullable();
            $table->string('pekerjaan_ibu')->nullable();
            $table->string('nama_wali')->nullable();
            $table->text('alamat_wali')->nullable();
            $table->string('telepon_wali', 30)->nullable();
            $table->string('pekerjaan_wali')->nullable();
            $table->string('foto_siswa_path')->nullable();
            $table->enum('ukuran_seragam', ['S', 'M', 'L', 'XL', 'XXL'])->nullable();
            $table->enum('tipe_program', ['reguler', 'santri_internal', 'santri_eksternal'])->default('reguler');
            $table->foreignId('kategori_beasiswa_id')->nullable()
                ->constrained('kategori_beasiswas')
                ->nullOnDelete();
        });

        Schema::table('pendaftaran_spmbs', function (Blueprint $table): void {
            $table->string('nis')->nullable();
            $table->string('tempat_lahir', 100)->nullable();
            $table->date('tanggal_lahir')->nullable();
            $table->enum('jenis_kelamin', ['L', 'P'])->nullable();
            $table->string('agama', 50)->nullable();
            $table->string('status_keluarga', 50)->nullable();
            $table->unsignedTinyInteger('anak_ke')->nullable();
            $table->text('alamat_murid')->nullable();
            $table->string('telepon_rumah', 30)->nullable();
            $table->string('sekolah_asal')->nullable();
            $table->string('diterima_di_kelas')->nullable();
            $table->date('tanggal_diterima')->nullable();
            $table->string('nama_ayah')->nullable();
            $table->string('nama_ibu')->nullable();
            $table->text('alamat_ortu')->nullable();
            $table->string('telepon_ortu', 30)->nullable();
            $table->string('pekerjaan_ayah')->nullable();
            $table->string('pekerjaan_ibu')->nullable();
            $table->string('nama_wali')->nullable();
            $table->text('alamat_wali')->nullable();
            $table->string('telepon_wali', 30)->nullable();
            $table->string('pekerjaan_wali')->nullable();
            $table->string('foto_siswa_path')->nullable();
            $table->enum('ukuran_seragam', ['S', 'M', 'L', 'XL', 'XXL'])->nullable();
            $table->enum('tipe_program', ['reguler', 'santri_internal', 'santri_eksternal'])->default('reguler');
            $table->foreignId('kategori_beasiswa_id')->nullable()
                ->constrained('kategori_beasiswas')
                ->nullOnDelete();
        });

        DB::table('pendaftaran_spmbs')
            ->whereNull('sekolah_asal')
            ->update(['sekolah_asal' => DB::raw('asal_sekolah')]);

        Schema::table('tagihans', function (Blueprint $table): void {
            $table->enum('jenis_tagihan', ['spp', 'praktikum', 'khusus_non_afirmasi'])
                ->default('khusus_non_afirmasi');
        });

        DB::table('tagihans')
            ->where('judul_tagihan', 'like', '%SPP%')
            ->update(['jenis_tagihan' => 'spp']);
        DB::table('tagihans')
            ->where('judul_tagihan', 'like', '%praktikum%')
            ->update(['jenis_tagihan' => 'praktikum']);

        Schema::table('mata_pelajarans', function (Blueprint $table): void {
            $table->enum('kelompok_mapel', ['umum', 'kejuruan', 'muatan_lokal'])->default('umum');
        });

        Schema::table('kelas', function (Blueprint $table): void {
            $table->enum('fase', ['E', 'F'])->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('kelas', function (Blueprint $table): void {
            $table->dropColumn('fase');
        });

        Schema::table('mata_pelajarans', function (Blueprint $table): void {
            $table->dropColumn('kelompok_mapel');
        });

        Schema::table('tagihans', function (Blueprint $table): void {
            $table->dropColumn('jenis_tagihan');
        });

        Schema::table('pendaftaran_spmbs', function (Blueprint $table): void {
            $table->dropForeign(['kategori_beasiswa_id']);
            $table->dropColumn([
                'nis',
                'tempat_lahir',
                'tanggal_lahir',
                'jenis_kelamin',
                'agama',
                'status_keluarga',
                'anak_ke',
                'alamat_murid',
                'telepon_rumah',
                'sekolah_asal',
                'diterima_di_kelas',
                'tanggal_diterima',
                'nama_ayah',
                'nama_ibu',
                'alamat_ortu',
                'telepon_ortu',
                'pekerjaan_ayah',
                'pekerjaan_ibu',
                'nama_wali',
                'alamat_wali',
                'telepon_wali',
                'pekerjaan_wali',
                'foto_siswa_path',
                'ukuran_seragam',
                'tipe_program',
                'kategori_beasiswa_id',
            ]);
        });

        Schema::table('siswas', function (Blueprint $table): void {
            $table->dropForeign(['kategori_beasiswa_id']);
            $table->dropUnique(['nis']);
            $table->dropColumn([
                'nis',
                'tempat_lahir',
                'tanggal_lahir',
                'jenis_kelamin',
                'agama',
                'status_keluarga',
                'anak_ke',
                'alamat_murid',
                'telepon_rumah',
                'sekolah_asal',
                'diterima_di_kelas',
                'tanggal_diterima',
                'nama_ayah',
                'nama_ibu',
                'alamat_ortu',
                'telepon_ortu',
                'pekerjaan_ayah',
                'pekerjaan_ibu',
                'nama_wali',
                'alamat_wali',
                'telepon_wali',
                'pekerjaan_wali',
                'foto_siswa_path',
                'ukuran_seragam',
                'tipe_program',
                'kategori_beasiswa_id',
            ]);
        });

        Schema::table('pengaturan_sekolahs', function (Blueprint $table): void {
            $table->dropColumn(['tarif_spp_reguler', 'tarif_praktikum']);
        });

        Schema::dropIfExists('kategori_beasiswas');
    }
};
