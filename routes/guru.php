<?php

use App\Http\Controllers\Guru\NilaiController;
use App\Http\Controllers\Guru\PresensiController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:guru'])
    ->prefix('guru')
    ->name('guru.')
    ->group(function (): void {
        Route::get('presensi/{jadwal}', [PresensiController::class, 'show'])->name('presensi.show');
        Route::post('presensi/{jadwal}', [PresensiController::class, 'store'])->name('presensi.store');
        Route::post('nilai/tarik-ujian', [NilaiController::class, 'importExamResults'])
            ->name('nilai.import-ujian');
    });
