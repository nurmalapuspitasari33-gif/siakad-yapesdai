import PublicSiteHeader from '@/Components/PublicSiteHeader';
import { Head, Link } from '@inertiajs/react';

const educationUnits = [
    'Ponpes Al Fieil Kesugihan',
    "SMK Al Mu'allim Kesugihan",
    'MTs Wustho Al Fieil Kesugihan',
    'RA Al Fieil Kesugihan',
    'Madin Miftahussaadah',
    "TPQ Roudlotul Muta'allimin",
];

function GraduationCapIcon() {
    return (
        <svg
            className="h-5 w-5 shrink-0 text-emerald-700"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="m3 9 9-5 9 5-9 5-9-5Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 11.2v4.3c2.8 2.3 7.2 2.3 10 0v-4.3M21 9v5" />
        </svg>
    );
}

function ArrowIcon() {
    return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
        </svg>
    );
}

function ServiceCardIcon({ type }) {
    if (type === 'megaphone') {
        return (
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 11v2a2 2 0 0 0 2 2h2l3 5h3l-2.2-5.2L20 18V6L10.8 9H5a2 2 0 0 0-2 2Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 9a3 3 0 0 1 0 6" />
            </svg>
        );
    }

    return (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 5h5a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5M4 12h11m-4-4 4 4-4 4" />
        </svg>
    );
}

export default function Home() {
    return (
        <>
            <Head title="Beranda | YAPESDAI" />

            <div className="relative min-h-screen bg-[#F8FAFC] font-public tracking-tight text-slate-900 antialiased">
                <PublicSiteHeader activePage="home" />

                <main className="relative z-10 isolate overflow-hidden bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/50">
                    <div className="pointer-events-none absolute -right-36 top-20 -z-10 h-[26rem] w-[26rem] rounded-full border-[3rem] border-emerald-100/40 opacity-40" />
                    <div className="pointer-events-none absolute -left-40 top-[32rem] -z-10 h-96 w-96 rounded-full bg-teal-100/50 opacity-40 blur-3xl" />
                    <section className="mx-auto max-w-7xl px-4 pb-14 pt-12 sm:px-6 sm:pb-16 sm:pt-16 lg:px-8">
                        <div className="max-w-3xl">
                            <p className="text-xl font-semibold tracking-normal text-emerald-700 sm:text-2xl">
                                Selamat Datang di
                            </p>
                            <h1 className="mt-1 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
                                YAPESDAI
                            </h1>
                            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                                Yayasan Pengembangan Sumber Daya Insani yang mengelola berbagai lembaga pendidikan berkualitas:
                            </p>

                            <ul
                                id="lembaga"
                                className="mt-6 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2"
                            >
                                {educationUnits.map((unit) => (
                                    <li key={unit} className="flex items-center gap-3 text-sm font-medium text-slate-700 sm:text-base">
                                        <GraduationCapIcon />
                                        <span>{unit}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="mt-9 grid grid-cols-1 gap-5 md:grid-cols-2">
                            <Link
                                href={route('spmb.home')}
                                className="group flex min-h-32 items-center gap-4 rounded-3xl bg-gradient-to-r from-emerald-800 to-emerald-700 p-6 text-white shadow-lg shadow-emerald-900/10 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-emerald-700/20"
                            >
                                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white backdrop-blur-md">
                                    <ServiceCardIcon type="megaphone" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-xl font-bold tracking-tight">SPMB</span>
                                    <span className="mt-1 block text-sm leading-5 text-emerald-50">
                                        Penerimaan Peserta Didik Baru
                                    </span>
                                </span>
                                <span
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-emerald-800 shadow-sm transition-transform group-hover:translate-x-0.5"
                                    aria-hidden="true"
                                >
                                    <ArrowIcon />
                                </span>
                            </Link>

                            <Link
                                href={route('login')}
                                className="group flex min-h-32 items-center gap-4 rounded-3xl border border-white bg-white/85 p-6 text-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgb(0,0,0,0.08)] focus:outline-none focus:ring-4 focus:ring-emerald-700/15"
                            >
                                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100">
                                    <ServiceCardIcon type="login" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-xl font-bold tracking-tight">Login</span>
                                    <span className="mt-1 block text-sm leading-5 text-slate-500">
                                        Siswa, Guru &amp; Admin
                                    </span>
                                </span>
                                <span
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-white shadow-sm transition-transform group-hover:translate-x-0.5"
                                    aria-hidden="true"
                                >
                                    <ArrowIcon />
                                </span>
                            </Link>
                        </div>
                    </section>

                    <section id="tentang" className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-4 py-12 sm:px-6 md:grid-cols-2 lg:px-8">
                        <div>
                            <span className="mb-4 block h-1 w-12 rounded-full bg-emerald-600" aria-hidden="true" />
                            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700">
                                Tentang
                            </p>
                            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                                Tentang YAPESDAI
                            </h2>
                            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
                                YAPESDAI berkomitmen mencetak generasi yang berilmu, berakhlak mulia, dan siap berkontribusi bagi masyarakat. Pendidikan dan nilai-nilai Islam menjadi landasan untuk bertumbuh bersama.
                            </p>
                            <Link
                                href="#lembaga"
                                className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
                            >
                                Selengkapnya <ArrowIcon />
                            </Link>
                        </div>

                        <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-8 backdrop-blur-md sm:p-10">
                            <div className="flex min-h-56 flex-col items-center justify-center gap-4 rounded-2xl border border-white/80 bg-white/60 p-6 text-center">
                                <svg className="h-28 w-28 text-emerald-700" viewBox="0 0 120 120" fill="none" aria-hidden="true">
                                    <path d="M20 89h80M27 89V59h66v30M37 59c0-15 10-25 23-25s23 10 23 25" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M60 34V24m0 0c-5 0-8-4-8-8 5 0 8 3 8 8Zm0 0c0-5 3-8 8-8 0 5-3 8-8 8ZM40 70v7m20-7v7m20-7v7" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                                    <path d="M14 99h92" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
                                </svg>
                                <p className="text-sm font-semibold text-emerald-900">
                                    Pendidikan, akhlak, dan pengembangan insani
                                </p>
                            </div>
                        </div>
                    </section>
                </main>

                <footer className="relative mt-8 overflow-hidden rounded-t-[3rem] bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 px-4 py-12 text-white sm:px-6 sm:py-14 lg:px-8">
                    <div className="pointer-events-none absolute -top-32 left-1/4 h-56 w-[70%] rounded-[50%] bg-emerald-400/15 blur-2xl" />
                    <div className="relative mx-auto max-w-7xl">
                        <p className="mx-auto max-w-3xl text-center text-lg font-semibold leading-8 text-emerald-50 sm:text-2xl">
                            “Bersama YAPESDAI, Menuju Pendidikan Islam yang Unggul dan Berkarakter”
                        </p>
                        <div className="mt-8 flex flex-col gap-3 border-t border-white/15 pt-6 text-center text-sm text-emerald-100 sm:flex-row sm:items-center sm:justify-between sm:text-left">
                            <span>YAPESDAI — Yayasan Pengembangan Sumber Daya Insani</span>
                            <span>Kesugihan, Cilacap · © 2026 YAPESDAI</span>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
