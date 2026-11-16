<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('pengaturan_sekolahs')
            ->where('id', 1)
            ->where('info_spmb', 'Informasi penerimaan siswa baru belum diatur.')
            ->update([
                'info_spmb' => 'Pendaftaran SPMB dilakukan secara daring melalui portal ini. Lengkapi formulir dan berkas persyaratan, lalu pantau hasil seleksi melalui akun Anda.',
                'updated_at' => now(),
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('pengaturan_sekolahs')
            ->where('id', 1)
            ->where('info_spmb', 'Pendaftaran SPMB dilakukan secara daring melalui portal ini. Lengkapi formulir dan berkas persyaratan, lalu pantau hasil seleksi melalui akun Anda.')
            ->update([
                'info_spmb' => 'Informasi penerimaan siswa baru belum diatur.',
                'updated_at' => now(),
            ]);
    }
};
