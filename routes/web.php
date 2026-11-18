<?php

use App\Http\Controllers\Admin\BeasiswaController;
use App\Http\Controllers\Admin\EkstrakurikulerController;
use App\Http\Controllers\Admin\GuruController as AdminGuruController;
use App\Http\Controllers\Admin\HasilUjianController as AdminHasilUjianController;
use App\Http\Controllers\Admin\JadwalController as AdminJadwalController;
use App\Http\Controllers\Admin\KelasController;
use App\Http\Controllers\Admin\LaporanController;
use App\Http\Controllers\Admin\MataPelajaranController;
use App\Http\Controllers\Admin\PengaturanSekolahController;
use App\Http\Controllers\Admin\ProgramKeahlianController;
use App\Http\Controllers\Admin\SiswaController as AdminSiswaController;
use App\Http\Controllers\Admin\SpmbController as AdminSpmbController;
use App\Http\Controllers\Admin\TagihanController as AdminTagihanController;
use App\Http\Controllers\Admin\TahunAjaranController;
use App\Http\Controllers\Admin\UjianController as AdminUjianController;
use App\Http\Controllers\Dashboard\AdminDashboardController;
use App\Http\Controllers\Dashboard\GuruDashboardController;
use App\Http\Controllers\Dashboard\SiswaDashboardController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Guru\JadwalController as GuruJadwalController;
use App\Http\Controllers\Guru\NilaiController as GuruNilaiController;
use App\Http\Controllers\Guru\RaporWaliController;
use App\Http\Controllers\Guru\UjianController as GuruUjianController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Siswa\JadwalController as SiswaJadwalController;
use App\Http\Controllers\Siswa\RaporController as SiswaRaporController;
use App\Http\Controllers\Siswa\SpmbController as SiswaSpmbController;
use App\Http\Controllers\Siswa\TagihanController as SiswaTagihanController;
use App\Http\Controllers\Siswa\UjianController as SiswaUjianController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

Route::get('/', fn () => Inertia::render('Home'))->name('home');

Route::get('/spmb', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
    ]);
})->name('spmb.home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->name('dashboard');

    Route::get('/admin/dashboard', [AdminDashboardController::class, '__invoke'])
        ->middleware('role:admin')
        ->name('admin.dashboard');

    Route::get('/guru/dashboard', [GuruDashboardController::class, '__invoke'])
        ->middleware('role:guru')
        ->name('guru.dashboard');

    Route::get('/siswa/dashboard', [SiswaDashboardController::class, '__invoke'])
        ->middleware('role:siswa')
        ->name('siswa.dashboard');
});

Route::middleware(['auth', 'verified', 'role:admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::patch('tahun-ajaran/{tahun_ajaran}/aktifkan', [TahunAjaranController::class, 'activate'])
            ->name('tahun-ajaran.activate');

        Route::resource('tahun-ajaran', TahunAjaranController::class)
            ->except(['create', 'edit', 'show'])
            ->parameters(['tahun-ajaran' => 'tahun_ajaran']);

        Route::resource('kelas', KelasController::class)
            ->except(['create', 'edit', 'show'])
            ->parameters(['kelas' => 'kelas']);

        Route::post('program-keahlian', [ProgramKeahlianController::class, 'store'])
            ->name('program-keahlian.store');
        Route::put('program-keahlian/{programKeahlian}', [ProgramKeahlianController::class, 'update'])
            ->name('program-keahlian.update');
        Route::delete('program-keahlian/{programKeahlian}', [ProgramKeahlianController::class, 'destroy'])
            ->name('program-keahlian.destroy');
        Route::post('program-keahlian/{programKeahlian}/konsentrasi', [ProgramKeahlianController::class, 'storeConcentration'])
            ->name('program-keahlian.konsentrasi.store');
        Route::put('konsentrasi-keahlian/{konsentrasiKeahlian}', [ProgramKeahlianController::class, 'updateConcentration'])
            ->name('konsentrasi-keahlian.update');
        Route::delete('konsentrasi-keahlian/{konsentrasiKeahlian}', [ProgramKeahlianController::class, 'destroyConcentration'])
            ->name('konsentrasi-keahlian.destroy');

        Route::put('mapel/template-kokurikuler', [MataPelajaranController::class, 'updateKokurikulerTemplate'])
            ->name('mapel.template-kokurikuler.update');
        Route::resource('mapel', MataPelajaranController::class)
            ->except(['create', 'edit', 'show']);

        Route::patch('guru/{guru}/reset-password', [AdminGuruController::class, 'resetPassword'])
            ->name('guru.reset-password');
        Route::get('guru/template', [AdminGuruController::class, 'template'])->name('guru.template');
        Route::post('guru/import', [AdminGuruController::class, 'import'])->name('guru.import');
        Route::resource('guru', AdminGuruController::class)
            ->except(['create', 'edit', 'show'])
            ->parameters(['guru' => 'guru']);

        Route::patch('siswa/batch-kelas', [AdminSiswaController::class, 'batchUpdateKelas'])
            ->name('siswa.batch-update-kelas');
        Route::patch('siswa/{siswa}/kelas', [AdminSiswaController::class, 'updateKelas'])
            ->name('siswa.update-kelas');
        Route::patch('siswa/{siswa}/reset-password', [AdminSiswaController::class, 'resetPassword'])
            ->name('siswa.reset-password');
        Route::get('siswa/template', [AdminSiswaController::class, 'template'])->name('siswa.template');
        Route::post('siswa/import', [AdminSiswaController::class, 'import'])->name('siswa.import');
        Route::resource('siswa', AdminSiswaController::class)
            ->except(['create', 'edit', 'show'])
            ->parameters(['siswa' => 'siswa']);

        Route::get('spmb', [AdminSpmbController::class, 'index'])->name('spmb.index');
        Route::put('spmb/{spmb}', [AdminSpmbController::class, 'update'])->name('spmb.update');
        Route::delete('spmb/{spmb}', [AdminSpmbController::class, 'destroy'])->name('spmb.destroy');
        Route::patch('spmb/{spmb}/terima', [AdminSpmbController::class, 'accept'])->name('spmb.accept');
        Route::patch('spmb/{spmb}/tolak', [AdminSpmbController::class, 'reject'])->name('spmb.reject');
        Route::get('spmb/{spmb}/berkas', [AdminSpmbController::class, 'download'])->name('spmb.berkas');

        Route::resource('beasiswa', BeasiswaController::class)
            ->except(['create', 'edit', 'show']);

        Route::resource('jadwal', AdminJadwalController::class)
            ->except(['create', 'edit', 'show'])
            ->parameters(['jadwal' => 'jadwal']);

        Route::get('tagihan', [AdminTagihanController::class, 'index'])->name('tagihan.index');
        Route::post('tagihan/generate', [AdminTagihanController::class, 'generate'])->name('tagihan.generate');
        Route::patch('tagihan/{tagihan}/lunas', [AdminTagihanController::class, 'markPaid'])->name('tagihan.mark-paid');
        Route::patch('tagihan/{tagihan}/whatsapp-terkirim', [AdminTagihanController::class, 'markWhatsAppSent'])
            ->name('tagihan.mark-whatsapp-sent');

        Route::get('ujian', [AdminUjianController::class, 'index'])->name('ujian.index');
        Route::delete('ujian/{ujian}/peserta/{siswa}', [AdminUjianController::class, 'resetSession'])
            ->name('ujian.reset-session');
        Route::get('hasil-ujian', [AdminHasilUjianController::class, 'index'])->name('hasil-ujian.index');
        Route::get('hasil-ujian/export', [AdminHasilUjianController::class, 'export'])
            ->name('hasil-ujian.export');
        Route::get('laporan', [LaporanController::class, 'index'])->name('laporan.index');

        Route::get('pengaturan', [PengaturanSekolahController::class, 'index'])->name('pengaturan.index');
        Route::put('pengaturan', [PengaturanSekolahController::class, 'update'])->name('pengaturan.update');
        Route::post('ekstrakurikuler', [EkstrakurikulerController::class, 'store'])
            ->name('ekstrakurikuler.store');
        Route::put('ekstrakurikuler/{ekstrakurikuler}', [EkstrakurikulerController::class, 'update'])
            ->name('ekstrakurikuler.update');
    });

Route::middleware(['auth', 'verified', 'role:guru'])
    ->prefix('guru')
    ->name('guru.')
    ->group(function () {
        Route::get('jadwal', GuruJadwalController::class)->name('jadwal.index');
        Route::get('hasil-ujian', [GuruUjianController::class, 'resultsIndex'])
            ->name('hasil-ujian.index');
        Route::get('ujian', [GuruUjianController::class, 'index'])->name('ujian.index');
        Route::get('ujian/{ujian}/hasil/export', [GuruUjianController::class, 'exportResults'])
            ->name('ujian.hasil.export');
        Route::get('ujian/{ujian}/hasil', [GuruUjianController::class, 'results'])
            ->name('ujian.hasil');
        Route::put('ujian/{ujian}/hasil/{siswa}/esai', [GuruUjianController::class, 'gradeEssays'])
            ->name('ujian.hasil.esai');
        Route::delete('ujian/{ujian}/peserta/{siswa}', [GuruUjianController::class, 'resetSession'])
            ->name('ujian.reset-session');
        Route::post('ujian', [GuruUjianController::class, 'store'])->name('ujian.store');
        Route::put('ujian/{ujian}', [GuruUjianController::class, 'update'])->name('ujian.update');
        Route::delete('ujian/{ujian}', [GuruUjianController::class, 'destroy'])->name('ujian.destroy');
        Route::get('ujian/{ujian}/soal/template', [GuruUjianController::class, 'questionTemplate'])
            ->name('ujian.soal.template');
        Route::post('ujian/{ujian}/soal/import', [GuruUjianController::class, 'importQuestions'])
            ->name('ujian.soal.import');
        Route::post('ujian/{ujian}/soal', [GuruUjianController::class, 'storeQuestion'])->name('ujian.soal.store');
        Route::put('ujian/{ujian}/soal/{soal}', [GuruUjianController::class, 'updateQuestion'])
            ->name('ujian.soal.update');
        Route::delete('ujian/{ujian}/soal/{soal}', [GuruUjianController::class, 'destroyQuestion'])
            ->name('ujian.soal.destroy');
        Route::get('nilai', [GuruNilaiController::class, 'index'])->name('nilai.index');
        Route::post('nilai', [GuruNilaiController::class, 'store'])->name('nilai.store');
        Route::get('rapor-wali', [RaporWaliController::class, 'index'])->name('rapor-wali.index');
        Route::post('rapor-wali', [RaporWaliController::class, 'store'])->name('rapor-wali.store');
    });

Route::middleware(['auth', 'verified', 'role:siswa'])
    ->prefix('siswa')
    ->name('siswa.')
    ->group(function () {
        Route::get('spmb', [SiswaSpmbController::class, 'index'])->name('spmb.index');
        Route::post('spmb', [SiswaSpmbController::class, 'store'])->name('spmb.store');
        Route::get('spmb/berkas', [SiswaSpmbController::class, 'download'])->name('spmb.berkas');
        Route::get('jadwal', SiswaJadwalController::class)->name('jadwal.index');
        Route::get('tagihan', [SiswaTagihanController::class, 'index'])->name('tagihan.index');
        Route::get('ujian', [SiswaUjianController::class, 'index'])->name('ujian.index');
        Route::post('ujian/{ujian}/mulai', [SiswaUjianController::class, 'start'])->name('ujian.start');
        Route::patch('ujian/{ujian}/jawaban', [SiswaUjianController::class, 'saveAnswer'])
            ->name('ujian.save-answer');
        Route::post('ujian/{ujian}/pelanggaran', [SiswaUjianController::class, 'recordViolation'])
            ->name('ujian.violation');
        Route::post('ujian/{ujian}/selesai', [SiswaUjianController::class, 'finish'])->name('ujian.finish');
        Route::get('ujian/{ujian}', [SiswaUjianController::class, 'show'])->name('ujian.show');
        Route::get('rapor', [SiswaRaporController::class, 'index'])->name('rapor.index');
    });

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';

Route::get('/public-files/{path}', function (string $path): StreamedResponse {
    abort_unless(Storage::disk('public')->exists($path), 404);

    return Storage::disk('public')->response($path);
})->where('path', '.*')->name('public-files.show');
