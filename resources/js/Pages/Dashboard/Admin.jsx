import DashboardLayout from '@/Layouts/DashboardLayout';
import DashboardWelcomeBanner from '@/Components/DashboardWelcomeBanner';
import AdminNavigationItems from '@/Components/AdminNavigationItems';
import StatisticCard from '@/Components/StatisticCard';
import { Head, Link } from '@inertiajs/react';

const numberFormatter = new Intl.NumberFormat('id-ID');
const currencyFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

export default function AdminDashboard({ statistics, modules }) {
    const navigation = AdminNavigationItems('dashboard');
    const moduleRoutes = {
        siswa: 'admin.siswa.index',
        guru: 'admin.guru.index',
        kelas: 'admin.kelas.index',
        'mata-pelajaran': 'admin.mapel.index',
        'tahun-ajaran': 'admin.tahun-ajaran.index',
        jadwal: 'admin.jadwal.index',
        spmb: 'admin.spmb.index',
        tagihan: 'admin.tagihan.index',
        ujian: 'admin.ujian.index',
        'hasil-ujian': 'admin.hasil-ujian.index',
        laporan: 'admin.laporan.index',
    };
    const moduleIconTones = {
        siswa: 'bg-emerald-50 text-emerald-700',
        guru: 'bg-emerald-50 text-emerald-600',
        kelas: 'bg-amber-50 text-amber-600',
        'mata-pelajaran': 'bg-sky-50 text-sky-600',
        'tahun-ajaran': 'bg-emerald-50 text-emerald-600',
        jadwal: 'bg-emerald-50 text-emerald-700',
        spmb: 'bg-amber-50 text-amber-600',
        tagihan: 'bg-sky-50 text-sky-600',
        ujian: 'bg-emerald-50 text-emerald-600',
        'hasil-ujian': 'bg-emerald-50 text-emerald-700',
        laporan: 'bg-amber-50 text-amber-600',
    };

    const statisticCards = [
        {
            label: 'Jumlah siswa',
            value: numberFormatter.format(statistics.siswa),
            detail: 'Seluruh status siswa',
            icon: 'users',
            tone: 'emerald',
        },
        {
            label: 'Jumlah guru',
            value: numberFormatter.format(statistics.guru),
            detail: 'Termasuk wali kelas',
            icon: 'school',
            tone: 'sky',
        },
        {
            label: 'Pendaftar SPMB',
            value: numberFormatter.format(statistics.pendaftarSpmb),
            detail: 'Semua status seleksi',
            icon: 'document',
            tone: 'amber',
        },
        {
            label: 'Total tagihan',
            value: currencyFormatter.format(statistics.totalTagihan),
            detail: 'Akumulasi tagihan sekolah',
            icon: 'wallet',
            tone: 'emerald',
        },
    ];

    return (
        <DashboardLayout
            title="Dasbor Administrator"
            subtitle="Pantau aktivitas akademik dan akses modul utama sekolah dari satu tempat."
            roleLabel="Administrator"
            navigation={navigation}
        >
            <Head title="Dasbor Admin" />

            <DashboardWelcomeBanner role="Administrator" context="Pengelola sistem akademik sekolah" />

            <section id="ringkasan" className="scroll-mt-24">
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Ringkasan sekolah</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Gambaran singkat data akademik saat ini.
                        </p>
                    </div>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Sistem aktif
                    </span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {statisticCards.map((card) => (
                        <StatisticCard
                            key={card.label}
                            label={card.label}
                            value={card.value}
                            detail={card.detail}
                            icon={card.icon}
                            tone={card.tone}
                        />
                    ))}
                </div>
            </section>

            <section className="mt-8" aria-labelledby="module-title">
                <div className="mb-5">
                    <h2 id="module-title" className="text-lg font-bold text-slate-900">
                        Modul akademik
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Pilih menu untuk melihat ringkasan akses modul.
                    </p>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {modules.map((module) => (
                        <article
                            id={`modul-${module.id}`}
                            key={module.id}
                            className="scroll-mt-24 rounded-3xl border border-white/80 bg-white/80 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                                    moduleIconTones[module.id] ?? 'bg-sky-50 text-sky-600'
                                }`}>
                                    {module.label.charAt(0)}
                                </span>
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                                    Modul
                                </span>
                            </div>
                            <h3 className="mt-4 font-semibold text-slate-900">{module.label}</h3>
                            <p className="mt-1 min-h-10 text-sm leading-5 text-slate-500">
                                {module.description}
                            </p>
                            {moduleRoutes[module.id] ? (
                                <Link
                                    href={route(moduleRoutes[module.id])}
                                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 transition hover:text-emerald-950"
                                >
                                    Buka modul
                                    <span aria-hidden="true">→</span>
                                </Link>
                            ) : (
                                <a
                                    href={`#modul-${module.id}`}
                                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 transition hover:text-emerald-950"
                                >
                                    Lihat ringkasan
                                    <span aria-hidden="true">→</span>
                                </a>
                            )}
                        </article>
                    ))}
                </div>
            </section>
        </DashboardLayout>
    );
}
