import AdminPagination from '@/Components/AdminPagination';
import DashboardLayout from '@/Layouts/DashboardLayout';
import roleNavigationItems from '@/Components/RoleNavigationItems';
import { Head, Link } from '@inertiajs/react';

export default function GuruUjianResultsIndex({ ujians, isWaliKelas = false, waliKelasName = '' }) {
    return (
        <DashboardLayout
            title="Hasil Ujian"
            subtitle="Pilih ujian untuk melihat status pengerjaan dan nilai seluruh siswa di kelas."
            roleLabel="Guru"
            navigation={roleNavigationItems('guru', 'hasil-ujian', { isWaliKelas, waliKelasName })}
        >
            <Head title="Hasil Ujian" />

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                    <div>
                        <h2 className="font-bold text-slate-900">Daftar hasil ujian</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {ujians.total} ujian tercatat
                        </p>
                    </div>
                    <Link
                        href={route('guru.ujian.index')}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                        Ujian & Bank Soal
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 text-left">
                        <thead className="bg-slate-50">
                            <tr>
                                {['Ujian', 'Kelas', 'Waktu Mulai', 'Sesi Tercatat', 'Aksi'].map((heading) => (
                                    <th key={heading} className="whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        {heading}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {ujians.data.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-5 py-12 text-center text-sm text-slate-500">
                                        Belum ada jadwal ujian. Buat jadwal terlebih dahulu melalui Ujian & Bank Soal.
                                    </td>
                                </tr>
                            ) : ujians.data.map((ujian) => (
                                <tr key={ujian.id} className="hover:bg-slate-50/70">
                                    <td className="px-5 py-4">
                                        <p className="text-sm font-semibold text-slate-900">{ujian.judul_ujian}</p>
                                        <p className="mt-1 text-xs text-slate-500">{ujian.mata_pelajaran ?? '—'}</p>
                                    </td>
                                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                                        {ujian.kelas ?? '—'}
                                    </td>
                                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                                        {ujian.waktu_mulai}
                                    </td>
                                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                                        {ujian.hasil_ujians_count}
                                    </td>
                                    <td className="whitespace-nowrap px-5 py-4">
                                        <Link
                                            href={route('guru.ujian.hasil', ujian.id)}
                                            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                                        >
                                            Lihat Hasil
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="border-t border-slate-100 px-5 py-4 sm:px-7">
                    <AdminPagination links={ujians.links} />
                </div>
            </section>
        </DashboardLayout>
    );
}
