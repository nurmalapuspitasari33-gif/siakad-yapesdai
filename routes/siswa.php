<?php

use App\Http\Controllers\Siswa\PresensiController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'force-password-change', 'verified', 'role:siswa'])
    ->prefix('siswa')
    ->name('siswa.')
    ->group(function (): void {
        Route::get('presensi', [PresensiController::class, 'index'])->name('presensi.index');
    });
