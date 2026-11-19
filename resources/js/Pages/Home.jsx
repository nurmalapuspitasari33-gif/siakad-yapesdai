import { Head, Link, usePage } from '@inertiajs/react';

const educationUnits = [
    'Ponpes Al Fiel Kesugihan',
    "SMK Al Mu'allim Kesugihan",
    'MTs Wustho Al Fiel Kesugihan',
    'RA Al Fiel Kesugihan',
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
    const { assetUrls = {} } = usePage().props;

    return (
        <>
            <Head title="Beranda | YAPESDAI" />

            <div className="relative flex min-h-[calc(100vh-5rem)] flex-1 flex-col bg-[#F8FAFC] font-public tracking-tight text-slate-900 antialiased lg:h-[calc(100vh-5rem)] lg:min-h-0">
                <main className="relative isolate flex min-h-0 flex-1 flex-col overflow-hidden bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/50">
                    <div className="pointer-events-none absolute -right-36 top-20 -z-10 h-[26rem] w-[26rem] rounded-full border-[3rem] border-emerald-100/40 opacity-40" />
                    <div className="pointer-events-none absolute -left-40 top-1/2 -z-10 h-96 w-96 -translate-y-1/2 rounded-full bg-teal-100/50 opacity-40 blur-3xl" />

                    <section className="relative z-10 mx-auto grid w-full flex-1 grid-cols-1 items-center gap-7 px-6 py-8 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:px-10 lg:py-6">
                        <div className="flex flex-col gap-5">
                            <div>
                                <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl">
                                    <span className="block text-xl font-semibold tracking-normal text-emerald-700 sm:text-2xl">
                                        Selamat Datang di
                                    </span>
                                    YAPESDAI
                                </h1>
                                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                                    Yayasan Pengembangan Sumber Daya Insani yang mengelola berbagai lembaga pendidikan berkualitas.
                                </p>
                            </div>

                            <ul id="lembaga" className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                                {educationUnits.map((unit) => (
                                    <li key={unit} className="flex items-center gap-2.5 text-sm font-medium text-slate-700">
                                        <GraduationCapIcon />
                                        <span>{unit}</span>
                                    </li>
                                ))}
                            </ul>

                            <article id="tentang" className="rounded-2xl border border-emerald-100 bg-white/75 p-4 shadow-sm backdrop-blur">
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                                    Tentang YAPESDAI
                                </p>
                                <p className="mt-1.5 text-sm leading-5 text-slate-600">
                                    Berkomitmen mencetak generasi berilmu, berakhlak mulia, dan siap berkontribusi bagi masyarakat melalui pendidikan berlandaskan nilai-nilai Islam.
                                </p>
                            </article>
                        </div>

                        <div className="flex min-h-0 flex-col gap-4">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <Link
                                    href={route('spmb.home')}
                                    prefetch
                                    className="group flex min-h-36 flex-col justify-between rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-700 p-4 text-white shadow-lg shadow-emerald-900/10 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-emerald-700/20"
                                >
                                    <span className="flex items-center justify-between">
                                        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10">
                                            <ServiceCardIcon type="megaphone" />
                                        </span>
                                        <span className="transition-transform group-hover:translate-x-0.5" aria-hidden="true">
                                            <ArrowIcon />
                                        </span>
                                    </span>
                                    <span>
                                        <span className="block text-lg font-bold tracking-tight">SPMB</span>
                                        <span className="mt-1 block text-xs leading-4 text-emerald-50">
                                            Penerimaan Peserta Didik Baru
                                        </span>
                                    </span>
                                </Link>

                                <Link
                                    href={route('login')}
                                    prefetch
                                    className="group flex min-h-36 flex-col justify-between rounded-2xl border border-white bg-white/85 p-4 text-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5 backdrop-blur-xl transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgb(0,0,0,0.08)] focus:outline-none focus:ring-4 focus:ring-emerald-700/15"
                                >
                                    <span className="flex items-center justify-between">
                                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100">
                                            <ServiceCardIcon type="login" />
                                        </span>
                                        <span className="text-emerald-800 transition-transform group-hover:translate-x-0.5" aria-hidden="true">
                                            <ArrowIcon />
                                        </span>
                                    </span>
                                    <span>
                                        <span className="block text-lg font-bold tracking-tight">Login</span>
                                        <span className="mt-1 block text-xs leading-4 text-slate-500">
                                            Siswa, Guru &amp; Admin
                                        </span>
                                    </span>
                                </Link>
                            </div>

                            <div className="flex min-h-48 flex-1 flex-col items-center justify-center gap-3 rounded-3xl border border-emerald-100 bg-emerald-50/70 p-5 text-center backdrop-blur-md">
                                <img src={assetUrls.logoYapesdai} alt="Logo YAPESDAI" className="h-28 w-full max-w-48 object-contain" />
                                <p className="text-sm font-semibold text-emerald-900">
                                    Pendidikan, akhlak, dan pengembangan insani
                                </p>
                                <p className="text-xs text-emerald-800/80">
                                    Bersama membangun masa depan yang berkarakter.
                                </p>
                            </div>
                        </div>
                    </section>
                </main>

                <footer className="shrink-0 border-t border-slate-200/70 bg-white/70 px-6 py-2 text-center text-xs text-slate-500 backdrop-blur sm:px-8 lg:px-10">
                    YAPESDAI — Yayasan Pengembangan Sumber Daya Insani · Kesugihan, Cilacap · © 2026
                </footer>
            </div>
        </>
    );
}
