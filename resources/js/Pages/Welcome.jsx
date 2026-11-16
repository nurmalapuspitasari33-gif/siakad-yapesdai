import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import GoogleAuthButton from '@/Components/GoogleAuthButton';
import StatisticCard from '@/Components/StatisticCard';

const numberFormatter = new Intl.NumberFormat('id-ID');
const dashboardRoutes = {
    admin: 'admin.dashboard',
    guru: 'guru.dashboard',
    siswa: 'siswa.dashboard',
};

const navigationLinks = [
    { href: '#beranda', label: 'Beranda' },
    { href: '#fitur-akademik', label: 'Fitur Akademik' },
    { href: '#alur-spmb', label: 'Alur SPMB' },
    { href: '#kontak', label: 'Kontak' },
];

const academicFeatures = [
    {
        number: '01',
        title: 'Data akademik terpusat',
        description: 'Informasi siswa, guru, kelas, dan tahun ajaran tersusun dalam satu portal.',
        color: 'bg-indigo-100 text-indigo-700',
    },
    {
        number: '02',
        title: 'Jadwal lebih terarah',
        description: 'Jadwal pelajaran dapat diakses siswa dan guru dengan mudah.',
        color: 'bg-sky-100 text-sky-700',
    },
    {
        number: '03',
        title: 'Ujian dan hasil belajar',
        description: 'Dukung pembelajaran digital melalui ujian online dan informasi nilai.',
        color: 'bg-violet-100 text-violet-700',
    },
];

const registrationSteps = [
    {
        number: '1',
        title: 'Buat akun',
        description: 'Daftar melalui portal untuk memulai proses penerimaan siswa baru.',
    },
    {
        number: '2',
        title: 'Lengkapi berkas',
        description: 'Isi biodata dan unggah dokumen pendaftaran yang diperlukan.',
    },
    {
        number: '3',
        title: 'Pantau pengumuman',
        description: 'Periksa status seleksi secara online melalui akun Anda.',
    },
];

function SchoolMark({ small = false, logoUrl = null, schoolName = 'SIAKAD Sekolah' }) {
    const size = small ? 'h-10 w-10' : 'h-12 w-12';

    if (logoUrl) {
        return (
            <img
                src={logoUrl}
                alt={schoolName}
                className={`${size} shrink-0 rounded-2xl border border-slate-200 bg-white object-contain p-1 shadow-sm`}
            />
        );
    }

    return (
        <span
            className={`flex shrink-0 items-center justify-center rounded-2xl bg-indigo-600 font-bold text-white shadow-lg shadow-indigo-200 ${size} ${
                small ? 'text-sm' : 'text-base'
            }`}
            aria-hidden="true"
        >
            SA
        </span>
    );
}

export default function Welcome({
    auth = {},
    canLogin,
    canRegister,
    statistics = {},
    pengaturanSekolah = {},
}) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const root = document.documentElement;
        const alreadySmooth = root.classList.contains('scroll-smooth');

        root.classList.add('scroll-smooth');

        return () => {
            if (!alreadySmooth) {
                root.classList.remove('scroll-smooth');
            }
        };
    }, []);

    const user = auth?.user;
    const dashboardRoute = dashboardRoutes[user?.role] ?? 'dashboard';
    const schoolStatistics = statistics ?? {};
    const schoolName = pengaturanSekolah?.nama_sekolah ?? 'SIAKAD Sekolah';
    const schoolLogo = pengaturanSekolah?.logo_url ?? null;
    const pendaftarMenunggu = schoolStatistics.menungguSeleksi ?? 0;
    const pendaftarStatus = pendaftarMenunggu > 0
        ? `${numberFormatter.format(pendaftarMenunggu)} menunggu seleksi`
        : 'Tidak ada yang menunggu seleksi';

    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    return (
        <>
            <Head title={`Beranda | ${schoolName}`} />

            <div className="min-h-screen scroll-smooth bg-white text-slate-900">
                <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
                    <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
                        <Link href="/" className="flex items-center gap-3" aria-label={`${schoolName}, beranda`}>
                            <SchoolMark logoUrl={schoolLogo} schoolName={schoolName} />
                            <span>
                                <span className="block text-sm font-bold tracking-tight text-slate-950 sm:text-base">
                                    {schoolName}
                                </span>
                                <span className="hidden text-xs text-slate-500 sm:block">
                                    Portal akademik terpadu
                                </span>
                            </span>
                        </Link>

                        <nav className="hidden items-center gap-7 lg:flex" aria-label="Navigasi utama">
                            {navigationLinks.map((item) => (
                                <a
                                    key={item.href}
                                    href={item.href}
                                    className="text-sm font-medium text-slate-600 transition hover:text-indigo-700"
                                >
                                    {item.label}
                                </a>
                            ))}
                        </nav>

                        <div className="hidden items-center gap-3 lg:flex">
                            {!user && canRegister && (
                                <Link
                                    href={route('register')}
                                    className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-indigo-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                >
                                    Daftar SPMB
                                </Link>
                            )}
                            {user ? (
                                <Link
                                    href={route(dashboardRoute)}
                                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 hover:shadow-lg"
                                >
                                    Masuk ke Dasbor
                                </Link>
                            ) : canLogin ? (
                                <Link
                                    href={route('login')}
                                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                >
                                    Login Portal
                                </Link>
                            ) : null}
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
                            aria-label={isMobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
                            aria-expanded={isMobileMenuOpen}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50 lg:hidden"
                        >
                            <span className="text-lg" aria-hidden="true">
                                {isMobileMenuOpen ? '×' : '☰'}
                            </span>
                        </button>
                    </div>

                    {isMobileMenuOpen && (
                        <div className="border-t border-slate-100 bg-white px-4 py-4 lg:hidden">
                            <nav className="flex flex-col gap-1" aria-label="Navigasi seluler">
                                {navigationLinks.map((item) => (
                                    <a
                                        key={item.href}
                                        href={item.href}
                                        onClick={closeMobileMenu}
                                        className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
                                    >
                                        {item.label}
                                    </a>
                                ))}
                                <div className="mt-2 flex flex-col gap-2 border-t border-slate-100 pt-3">
                                    {!user && canRegister && (
                                        <Link
                                            href={route('register')}
                                            onClick={closeMobileMenu}
                                            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-indigo-700 hover:shadow-lg"
                                        >
                                            Daftar SPMB
                                        </Link>
                                    )}
                                    {user ? (
                                        <Link
                                            href={route(dashboardRoute)}
                                            onClick={closeMobileMenu}
                                            className="rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:bg-indigo-50 hover:shadow-lg"
                                        >
                                            Masuk ke Dasbor
                                        </Link>
                                    ) : canLogin ? (
                                        <Link
                                            href={route('login')}
                                            onClick={closeMobileMenu}
                                            className="rounded-xl px-4 py-2.5 text-center text-sm font-semibold text-slate-600 transition-all duration-300 hover:-translate-y-1 hover:bg-indigo-50 hover:shadow-lg"
                                        >
                                            Login Portal
                                        </Link>
                                    ) : null}
                                </div>
                            </nav>
                        </div>
                    )}
                </header>

                <main>
                    <section
                        id="beranda"
                        className="relative isolate overflow-hidden bg-gradient-to-br from-white via-slate-50 to-indigo-50"
                    >
                        <div className="absolute -right-32 -top-32 -z-10 h-96 w-96 rounded-full bg-indigo-200/50 blur-3xl" />
                        <div className="absolute -bottom-48 left-1/3 -z-10 h-96 w-96 rounded-full bg-sky-100/70 blur-3xl" />

                        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:px-8 lg:py-24">
                            <div>
                                <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold tracking-wide text-indigo-800 shadow-sm">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                                    Portal resmi akademik sekolah
                                </span>
                                <h1 className="mt-6 max-w-2xl text-4xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                                    Akademik terpadu,
                                    <span className="block text-indigo-700">langkah masa depan lebih pasti.</span>
                                </h1>
                                <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                                    Satu portal untuk menghubungkan informasi belajar, layanan sekolah, dan penerimaan siswa baru secara lebih mudah dan terarah.
                                </p>
                                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                    {!user && canRegister && (
                                        <Link
                                            href={route('register')}
                                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-indigo-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                        >
                                            Mulai Pendaftaran SPMB
                                            <span aria-hidden="true">→</span>
                                        </Link>
                                    )}
                                    {!user && canRegister && (
                                        <GoogleAuthButton
                                            label="Daftar SPMB dengan Google"
                                            className="sm:w-auto"
                                        />
                                    )}
                                    {user ? (
                                        <Link
                                            href={route(dashboardRoute)}
                                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-indigo-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                        >
                                            Masuk ke Dasbor
                                            <span aria-hidden="true">→</span>
                                        </Link>
                                    ) : canLogin ? (
                                        <Link
                                            href={route('login')}
                                            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                        >
                                            Login Portal
                                        </Link>
                                    ) : null}
                                </div>
                                <a
                                    href="#fitur-akademik"
                                    className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-indigo-800 transition hover:text-indigo-950"
                                >
                                    Jelajahi fitur akademik <span aria-hidden="true">↓</span>
                                </a>
                            </div>

                            <div className="relative">
                                <div className="absolute -inset-4 rounded-[2rem] bg-indigo-400/10 blur-2xl" aria-hidden="true" />
                                <div className="relative rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-xl shadow-indigo-950/10 backdrop-blur sm:p-6">
                                    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">
                                                Sekilas sekolah
                                            </p>
                                            <h2 className="mt-1 text-lg font-bold text-slate-950">{schoolName}</h2>
                                        </div>
                                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-lg text-indigo-700" aria-hidden="true">
                                            ✦
                                        </span>
                                    </div>
                                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                        <StatisticCard
                                            label="Siswa aktif"
                                            value={numberFormatter.format(schoolStatistics.siswaAktif ?? 0)}
                                            detail="Terdaftar sebagai siswa aktif"
                                            icon="users"
                                            tone="indigo"
                                        />
                                        <StatisticCard
                                            label="Guru"
                                            value={numberFormatter.format(schoolStatistics.guru ?? 0)}
                                            detail="Tenaga pendidik sekolah"
                                            icon="school"
                                            tone="sky"
                                        />
                                        <div className="rounded-2xl border border-indigo-200/70 bg-indigo-50 p-4 sm:col-span-2 sm:p-5">
                                            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                                                <div>
                                                    <p className="text-sm font-semibold text-indigo-950">Pendaftaran SPMB</p>
                                                    <p className="mt-1 text-xs leading-5 text-indigo-700">
                                                        {pendaftarStatus}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-3xl font-bold tracking-tight text-indigo-950">
                                                        {numberFormatter.format(schoolStatistics.pendaftarSpmb ?? 0)}
                                                    </span>
                                                    <span className="text-xs font-semibold text-indigo-700">pendaftar</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="mt-4 text-center text-xs text-slate-500">
                                        Data diperbarui langsung dari sistem sekolah
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section id="fitur-akademik" className="scroll-mt-24 bg-white py-16 sm:py-20">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="mx-auto max-w-2xl text-center">
                                <p className="text-sm font-bold uppercase tracking-[0.16em] text-indigo-600">
                                    Fitur akademik
                                </p>
                                <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                                    Semua kebutuhan sekolah dalam satu portal
                                </h2>
                                <p className="mt-4 text-base leading-7 text-slate-600">
                                    Informasi yang jelas membantu siswa, guru, dan keluarga tetap terhubung dengan kegiatan sekolah.
                                </p>
                            </div>
                            <div className="mt-10 grid gap-5 md:grid-cols-3">
                                {academicFeatures.map((feature) => (
                                    <article
                                        key={feature.number}
                                        className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
                                    >
                                        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-bold ${feature.color}`}>
                                            {feature.number}
                                        </span>
                                        <h3 className="mt-5 text-lg font-bold text-slate-900">{feature.title}</h3>
                                        <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section id="alur-spmb" className="scroll-mt-24 bg-slate-50 py-16 sm:py-20">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
                                <div>
                                    <p className="text-sm font-bold uppercase tracking-[0.16em] text-indigo-600">
                                        Penerimaan siswa baru
                                    </p>
                                    <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                                        Alur SPMB yang mudah diikuti
                                    </h2>
                                    <p className="mt-4 text-base leading-7 text-slate-600">
                                        {pengaturanSekolah?.info_spmb || 'Mulai pendaftaran secara online dan pantau setiap tahap melalui akun portal Anda.'}
                                    </p>
                                    {!user && canRegister && (
                                        <Link
                                            href={route('register')}
                                            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-indigo-700 hover:shadow-lg"
                                        >
                                            Daftar sekarang <span aria-hidden="true">→</span>
                                        </Link>
                                    )}
                                </div>
                                <div className="grid gap-4 sm:grid-cols-3">
                                    {registrationSteps.map((step) => (
                                        <article
                                            key={step.number}
                                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg sm:p-6"
                                        >
                                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                                                {step.number}
                                            </span>
                                            <h3 className="mt-5 font-bold text-slate-900">{step.title}</h3>
                                            <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
                                        </article>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section id="kontak" className="scroll-mt-24 bg-white py-16 sm:py-20">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="flex flex-col gap-6 rounded-3xl bg-indigo-950 px-6 py-9 text-white sm:px-10 sm:py-11 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-indigo-300">Informasi sekolah</p>
                                    <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                                        Butuh informasi lebih lanjut?
                                    </h2>
                                    <div className="mt-2 flex flex-col gap-1 text-sm leading-6 text-indigo-100">
                                        {pengaturanSekolah?.alamat && <p>{pengaturanSekolah.alamat}</p>}
                                        {pengaturanSekolah?.telepon && (
                                            <a href={`tel:${pengaturanSekolah.telepon}`} className="transition hover:text-white">
                                                {pengaturanSekolah.telepon}
                                            </a>
                                        )}
                                    </div>
                                </div>
                                {pengaturanSekolah?.email && (
                                    <a
                                        href={`mailto:${pengaturanSekolah.email}`}
                                        className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-900 transition-all duration-300 hover:-translate-y-1 hover:bg-indigo-50 hover:shadow-lg"
                                    >
                                        {pengaturanSekolah.email}
                                    </a>
                                )}
                            </div>
                        </div>
                    </section>
                </main>

                <footer className="border-t border-slate-200 bg-slate-50">
                    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-7 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
                        <div className="flex items-center gap-3">
                            <SchoolMark small logoUrl={schoolLogo} schoolName={schoolName} />
                            <div>
                                <p className="text-sm font-bold text-slate-900">{schoolName}</p>
                                <p className="text-xs text-slate-500">Sistem Informasi Akademik Terpadu</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500">
                            © {new Date().getFullYear()} {schoolName}. Semua hak dilindungi.
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}
