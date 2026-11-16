import AdminNavigationItems from '@/Components/AdminNavigationItems';
import AdminPagination from '@/Components/AdminPagination';
import InputError from '@/Components/InputError';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, useForm } from '@inertiajs/react';

const scoreFormatter = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

function formatScore(value) {
    return value === null || value === undefined ? '—' : scoreFormatter.format(Number(value));
}

function StatisticCard({ label, value, accent }) {
    return (
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className={`h-1 ${accent}`} />
            <div className="p-5">
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{formatScore(value)}</p>
            </div>
        </article>
    );
}

export default function ExamResults({
    tahunAjaranOptions,
    kelasOptions,
    mataPelajaranOptions,
    filters,
    statistics,
    hasilUjians,
}) {
    const filterForm = useForm(filters);

    function applyFilters(event) {
        event.preventDefault();
        filterForm.get(route('admin.hasil-ujian.index'), {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    }

    const exportUrl = route('admin.hasil-ujian.export', filters);

    return (
        <DashboardLayout
            title="Hasil Ujian"
            subtitle="Tinjau rekap nilai akhir dari ujian yang sudah selesai dan unduh hasilnya ke Excel."
            roleLabel="Administrator"
            navigation={AdminNavigationItems('hasil-ujian')}
        >
            <Head title="Hasil Ujian" />

            <div className="flex flex-col gap-6">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <form onSubmit={applyFilters} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <div>
                            <label htmlFor="filter-tahun-ujian" className="mb-1.5 block text-sm font-semibold text-slate-700">Tahun ajaran</label>
                            <select
                                id="filter-tahun-ujian"
                                value={filterForm.data.tahun_ajaran_id}
                                onChange={(event) => {
                                    filterForm.setData('tahun_ajaran_id', event.target.value);
                                    filterForm.setData('kelas_id', '');
                                }}
                                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value="">Semua tahun ajaran</option>
                                {tahunAjaranOptions.map((tahunAjaran) => (
                                    <option key={tahunAjaran.id} value={tahunAjaran.id}>
                                        {tahunAjaran.nama_tahun} · {tahunAjaran.semester}{tahunAjaran.is_aktif ? ' (Aktif)' : ''}
                                    </option>
                                ))}
                            </select>
                            <InputError message={filterForm.errors.tahun_ajaran_id} className="mt-2" />
                        </div>
                        <div>
                            <label htmlFor="filter-kelas-ujian" className="mb-1.5 block text-sm font-semibold text-slate-700">Kelas</label>
                            <select
                                id="filter-kelas-ujian"
                                value={filterForm.data.kelas_id}
                                onChange={(event) => filterForm.setData('kelas_id', event.target.value)}
                                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value="">Semua kelas</option>
                                {kelasOptions.map((kelas) => (
                                    <option key={kelas.id} value={kelas.id}>{kelas.nama_kelas}</option>
                                ))}
                            </select>
                            <InputError message={filterForm.errors.kelas_id} className="mt-2" />
                        </div>
                        <div>
                            <label htmlFor="filter-mapel-ujian" className="mb-1.5 block text-sm font-semibold text-slate-700">Mata pelajaran</label>
                            <select
                                id="filter-mapel-ujian"
                                value={filterForm.data.mapel_id}
                                onChange={(event) => filterForm.setData('mapel_id', event.target.value)}
                                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value="">Semua mata pelajaran</option>
                                {mataPelajaranOptions.map((mapel) => (
                                    <option key={mapel.id} value={mapel.id}>{mapel.nama_mapel}</option>
                                ))}
                            </select>
                            <InputError message={filterForm.errors.mapel_id} className="mt-2" />
                        </div>
                        <div className="flex items-end">
                            <button
                                type="submit"
                                disabled={filterForm.processing}
                                className="inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                            >
                                Terapkan Filter
                            </button>
                        </div>
                    </form>
                </section>

                <section className="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-label="Statistik nilai ujian">
                    <StatisticCard label="Rata-rata kelas" value={statistics.rataRata} accent="bg-indigo-500" />
                    <StatisticCard label="Nilai tertinggi" value={statistics.nilaiTertinggi} accent="bg-emerald-500" />
                    <StatisticCard label="Nilai terendah" value={statistics.nilaiTerendah} accent="bg-amber-500" />
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <div>
                            <h2 className="font-bold text-slate-900">Rekap nilai siswa</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                {hasilUjians.total} hasil ujian selesai
                            </p>
                        </div>
                        <a
                            href={exportUrl}
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                        >
                            <span aria-hidden="true">↓</span>
                            Export Nilai ke Excel (.xlsx)
                        </a>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 text-left">
                            <thead className="bg-slate-50">
                                <tr>
                                    {['Siswa', 'Ujian', 'Mata Pelajaran', 'Kelas', 'Tahun Ajaran', 'Nilai Akhir'].map((heading) => (
                                        <th key={heading} scope="col" className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 first:sm:px-6">
                                            {heading}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {hasilUjians.data.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-5 py-12 text-center text-sm text-slate-500">
                                            Belum ada hasil ujian selesai untuk filter ini.
                                        </td>
                                    </tr>
                                ) : hasilUjians.data.map((hasil) => (
                                    <tr key={hasil.id} className="transition hover:bg-slate-50/70">
                                        <td className="whitespace-nowrap px-4 py-4 sm:px-6">
                                            <p className="text-sm font-semibold text-slate-900">{hasil.siswa?.nama_lengkap ?? 'Siswa tidak tersedia'}</p>
                                            <p className="mt-1 text-xs text-slate-500">{hasil.siswa?.nisn ?? '—'}</p>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-slate-800">{hasil.ujian?.judul_ujian ?? '—'}</td>
                                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">{hasil.ujian?.mata_pelajaran?.nama_mapel ?? '—'}</td>
                                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">{hasil.ujian?.kelas?.nama_kelas ?? '—'}</td>
                                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">{hasil.ujian?.kelas?.tahun_ajaran?.nama_tahun ?? '—'}</td>
                                        <td className="whitespace-nowrap px-4 py-4 text-sm font-bold text-indigo-700">{formatScore(hasil.skor_akhir)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="border-t border-slate-100 px-4 py-4">
                        <AdminPagination links={hasilUjians.links} />
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}
