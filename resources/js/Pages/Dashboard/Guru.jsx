import DashboardLayout from '@/Layouts/DashboardLayout';
import DashboardWelcomeBanner from '@/Components/DashboardWelcomeBanner';
import roleNavigationItems from '@/Components/RoleNavigationItems';
import StatisticCard from '@/Components/StatisticCard';
import { Head, Link } from '@inertiajs/react';

const numberFormatter = new Intl.NumberFormat('id-ID');

const dayLabels = {
    senin: 'Senin',
    selasa: 'Selasa',
    rabu: 'Rabu',
    kamis: 'Kamis',
    jumat: 'Jumat',
    sabtu: 'Sabtu',
    minggu: 'Minggu',
};

export default function GuruDashboard({ guru = {}, jadwals = [], kelasWalian = [] }) {
    const isWaliKelas = Boolean(guru?.is_wali_kelas);
    const navigation = roleNavigationItems('guru', 'dashboard', {
        isWaliKelas,
        waliKelasName: guru?.wali_kelas_nama_kelas ?? '',
    });
    const mataPelajaranCount = new Set(jadwals.map((jadwal) => jadwal.mata_pelajaran).filter(Boolean)).size;
    const kelasCount = new Set(jadwals.map((jadwal) => jadwal.kelas).filter(Boolean)).size;
    const statisticCards = [
        {
            label: 'Jadwal Mengajar',
            value: numberFormatter.format(jadwals.length),
            detail: 'Jadwal pada tahun ajaran aktif',
            icon: 'calendar',
            tone: 'emerald',
        },
        {
            label: 'Mata Pelajaran',
            value: numberFormatter.format(mataPelajaranCount),
            detail: 'Mata pelajaran yang diampu',
            icon: 'book',
            tone: 'sky',
        },
        {
            label: 'Kelas Diampu',
            value: numberFormatter.format(kelasCount),
            detail: 'Kelas dalam jadwal mengajar',
            icon: 'school',
            tone: 'emerald',
        },
        {
            label: 'Kelas Wali',
            value: numberFormatter.format(kelasWalian.length),
            detail: isWaliKelas ? 'Kelas yang menjadi tanggung jawab' : 'Belum ditugaskan sebagai wali',
            icon: 'users',
            tone: 'amber',
        },
    ];
    const quickLinks = [
        {
            title: 'Hasil Ujian',
            description: 'Lihat hasil dan status pengerjaan siswa.',
            href: route('guru.hasil-ujian.index'),
            icon: 'document',
            tone: 'blue',
        },
        {
            title: 'Ujian & Bank Soal',
            description: 'Jadwalkan ujian dan kelola soal pilihan ganda.',
            href: route('guru.ujian.index'),
            icon: 'book',
            tone: 'gold',
        },
        ...(isWaliKelas ? [{
            title: 'Rapor Kelas Wali',
            description: 'Kelola rapor dan data kelas yang menjadi tanggung jawab Anda.',
            href: route('guru.rapor-wali.index'),
            icon: 'school',
            tone: 'blue',
            kelasWalian,
        }] : []),
    ];

    return (
        <DashboardLayout
            title={`Selamat datang, ${guru?.nama_lengkap ?? 'Guru'}`}
            subtitle="Lihat jadwal mengajar dan informasi yang relevan dengan tugas Anda."
            roleLabel={isWaliKelas ? 'Guru · Wali Kelas' : 'Guru'}
            navigation={navigation}
        >
            <Head title="Dasbor Guru" />

            <DashboardWelcomeBanner
                name={guru?.nama_lengkap}
                role={isWaliKelas ? 'Guru · Wali Kelas' : 'Guru'}
                context={isWaliKelas && kelasWalian.length > 0
                    ? kelasWalian.map((kelas) => kelas.nama_kelas).join(', ')
                    : null}
            />

            <section
                aria-label="Ringkasan guru"
                className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >
                {statisticCards.map((card) => (
                    <StatisticCard key={card.label} {...card} />
                ))}
            </section>

            <section
                id="jadwal-mengajar"
                className="scroll-mt-24 rounded-3xl border border-white/80 bg-white/80 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5 backdrop-blur-xl sm:p-7"
            >
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Jadwal mengajar</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Daftar kelas dan mata pelajaran yang Anda ampu.
                        </p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                        {jadwals.length} jadwal
                    </span>
                </div>
                <div className="mb-5">
                    <a
                        href={route('guru.jadwal.index')}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-brand-blue transition hover:text-brand-navy"
                    >
                        Lihat jadwal lengkap <span aria-hidden="true">→</span>
                    </a>
                </div>

                {jadwals.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
                        <p className="font-semibold text-slate-700">Belum ada jadwal mengajar</p>
                        <p className="mt-1 text-sm text-slate-500">
                            Jadwal akan tampil di sini setelah ditetapkan oleh administrator.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {jadwals.map((jadwal) => (
                            <article
                                key={jadwal.id}
                                className="rounded-2xl border border-slate-200/80 bg-white/60 p-4 transition hover:border-brand-gold hover:bg-amber-50/40"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-semibold text-slate-900">
                                            {jadwal.mata_pelajaran}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Kelas {jadwal.kelas}
                                        </p>
                                    </div>
                                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-600">
                                        {dayLabels[jadwal.hari] ?? jadwal.hari ?? '—'}
                                    </span>
                                </div>
                                <p className="mt-4 text-sm font-medium text-brand-blue">
                                    {jadwal.jam_mulai} – {jadwal.jam_selesai}
                                </p>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            <section className={`mt-6 grid gap-4 ${isWaliKelas ? 'md:grid-cols-2 xl:grid-cols-3' : 'md:grid-cols-2'}`}>
                {quickLinks.map((item) => (
                    <Link
                        key={item.title}
                        href={item.href}
                        className="group rounded-3xl border border-white/80 bg-white/80 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-brand-gold hover:shadow-md"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                                item.tone === 'blue'
                                    ? 'bg-blue-50 text-brand-blue'
                                    : 'bg-amber-50 text-amber-600'
                            }`} aria-hidden="true">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-5 w-5"
                                >
                                    {item.icon === 'document' ? (
                                        <>
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                                            <path d="M14 2v6h6M8 13h8M8 17h8" />
                                        </>
                                    ) : item.icon === 'school' ? (
                                        <>
                                            <path d="m3 10 9-7 9 7" />
                                            <path d="M5 9v12h14V9M9 21v-7h6v7M3 21h18" />
                                        </>
                                    ) : (
                                        <>
                                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
                                            <path d="M8 7h8M8 11h8" />
                                        </>
                                    )}
                                </svg>
                            </span>
                            <span className="text-lg text-slate-400 transition group-hover:translate-x-1 group-hover:text-brand-blue" aria-hidden="true">
                                →
                            </span>
                        </div>
                        <h2 className="mt-4 font-bold text-slate-900">{item.title}</h2>
                        <p className="mt-1 text-sm leading-6 text-slate-500">{item.description}</p>
                        {item.kelasWalian && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {item.kelasWalian.map((kelas) => (
                                    <span
                                        key={`${kelas.nama_kelas}-${kelas.tahun_ajaran}`}
                                        className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600"
                                    >
                                        {kelas.nama_kelas} · {kelas.tahun_ajaran}
                                    </span>
                                ))}
                                {item.kelasWalian.length === 0 && (
                                    <span className="text-xs text-slate-500">
                                        Belum ada kelas yang ditetapkan.
                                    </span>
                                )}
                            </div>
                        )}
                    </Link>
                ))}
            </section>
        </DashboardLayout>
    );
}
