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
        if (! Schema::hasColumn('bank_soals', 'opsi_e')) {
            Schema::table('bank_soals', function (Blueprint $table): void {
                $table->text('opsi_e')->nullable();
            });
        }

        if (! Schema::hasColumn('nilais', 'capaian_kompetensi')) {
            Schema::table('nilais', function (Blueprint $table): void {
                $table->text('capaian_kompetensi')->nullable();
            });
        }

        if (! Schema::hasColumn('pengaturan_sekolahs', 'template_kokurikuler')) {
            Schema::table('pengaturan_sekolahs', function (Blueprint $table): void {
                $table->text('template_kokurikuler')->nullable();
            });
        }

        Schema::table('nilais', function (Blueprint $table): void {
            $table->decimal('nilai_tugas', 5, 2)->nullable()->change();
            $table->decimal('nilai_uts', 5, 2)->nullable()->change();
            $table->decimal('nilai_uas', 5, 2)->nullable()->change();
        });

        if (! Schema::hasTable('catatan_rapors')) {
            Schema::create('catatan_rapors', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('tahun_ajaran_id')->constrained('tahun_ajarans');
                $table->foreignId('siswa_id')->constrained('siswas');
                $table->string('kokurikuler_predikat')->nullable();
                $table->text('kokurikuler_deskripsi')->nullable();
                $table->string('ekstra_1_nama')->nullable();
                $table->string('ekstra_1_ket')->nullable();
                $table->string('ekstra_2_nama')->nullable();
                $table->string('ekstra_2_ket')->nullable();
                $table->string('ekstra_3_nama')->nullable();
                $table->string('ekstra_3_ket')->nullable();
                $table->string('ekstra_4_nama')->nullable();
                $table->string('ekstra_4_ket')->nullable();
                $table->unsignedSmallInteger('sakit')->default(0);
                $table->unsignedSmallInteger('izin')->default(0);
                $table->unsignedSmallInteger('tanpa_keterangan')->default(0);
                $table->text('catatan_wali_kelas')->nullable();
                $table->string('status_kenaikan')->nullable();
                $table->string('naik_ke_kelas')->nullable();
                $table->timestamps();

                $table->unique(['tahun_ajaran_id', 'siswa_id']);
            });
        } else {
            Schema::table('catatan_rapors', function (Blueprint $table): void {
                if (! Schema::hasColumn('catatan_rapors', 'kokurikuler_predikat')) {
                    $table->string('kokurikuler_predikat')->nullable();
                }
                if (! Schema::hasColumn('catatan_rapors', 'kokurikuler_deskripsi')) {
                    $table->text('kokurikuler_deskripsi')->nullable();
                }
                if (! Schema::hasColumn('catatan_rapors', 'ekstra_1_nama')) {
                    $table->string('ekstra_1_nama')->nullable();
                }
                if (! Schema::hasColumn('catatan_rapors', 'ekstra_1_ket')) {
                    $table->string('ekstra_1_ket')->nullable();
                }
                if (! Schema::hasColumn('catatan_rapors', 'ekstra_2_nama')) {
                    $table->string('ekstra_2_nama')->nullable();
                }
                if (! Schema::hasColumn('catatan_rapors', 'ekstra_2_ket')) {
                    $table->string('ekstra_2_ket')->nullable();
                }
                if (! Schema::hasColumn('catatan_rapors', 'ekstra_3_nama')) {
                    $table->string('ekstra_3_nama')->nullable();
                }
                if (! Schema::hasColumn('catatan_rapors', 'ekstra_3_ket')) {
                    if (Schema::hasColumn('catatan_rapors', 'ekstra_3_keterangan')) {
                        $table->renameColumn('ekstra_3_keterangan', 'ekstra_3_ket');
                    } else {
                        $table->string('ekstra_3_ket')->nullable();
                    }
                }
                if (! Schema::hasColumn('catatan_rapors', 'ekstra_4_nama')) {
                    $table->string('ekstra_4_nama')->nullable();
                }
                if (! Schema::hasColumn('catatan_rapors', 'ekstra_4_ket')) {
                    if (Schema::hasColumn('catatan_rapors', 'ekstra_4_keterangan')) {
                        $table->renameColumn('ekstra_4_keterangan', 'ekstra_4_ket');
                    } else {
                        $table->string('ekstra_4_ket')->nullable();
                    }
                }
                if (! Schema::hasColumn('catatan_rapors', 'sakit')) {
                    $table->unsignedSmallInteger('sakit')->default(0);
                }
                if (! Schema::hasColumn('catatan_rapors', 'izin')) {
                    $table->unsignedSmallInteger('izin')->default(0);
                }
                if (! Schema::hasColumn('catatan_rapors', 'tanpa_keterangan')) {
                    $table->unsignedSmallInteger('tanpa_keterangan')->default(0);
                }
                if (! Schema::hasColumn('catatan_rapors', 'catatan_wali_kelas')) {
                    $table->text('catatan_wali_kelas')->nullable();
                }
                if (! Schema::hasColumn('catatan_rapors', 'status_kenaikan')) {
                    $table->string('status_kenaikan')->nullable();
                }
                if (! Schema::hasColumn('catatan_rapors', 'naik_ke_kelas')) {
                    $table->string('naik_ke_kelas')->nullable();
                }
            });

            if (! Schema::hasIndex('catatan_rapors', ['tahun_ajaran_id', 'siswa_id'], 'unique')) {
                Schema::table('catatan_rapors', function (Blueprint $table): void {
                    $table->unique(['tahun_ajaran_id', 'siswa_id']);
                });
            }

            if (
                Schema::hasColumn('catatan_rapors', 'ekstra_3_keterangan')
                && Schema::hasColumn('catatan_rapors', 'ekstra_3_ket')
            ) {
                DB::table('catatan_rapors')
                    ->whereNull('ekstra_3_ket')
                    ->update(['ekstra_3_ket' => DB::raw('ekstra_3_keterangan')]);
            }

            if (
                Schema::hasColumn('catatan_rapors', 'ekstra_4_keterangan')
                && Schema::hasColumn('catatan_rapors', 'ekstra_4_ket')
            ) {
                DB::table('catatan_rapors')
                    ->whereNull('ekstra_4_ket')
                    ->update(['ekstra_4_ket' => DB::raw('ekstra_4_keterangan')]);
            }
        }
    }

    /**
     * Preserve report data when rolling back; reverse this repair with a forward migration.
     */
    public function down(): void {}
};
