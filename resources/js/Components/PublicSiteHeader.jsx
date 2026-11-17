import { Link, usePage } from '@inertiajs/react';

const navigationItems = [
    { key: 'home', label: 'Beranda' },
    { key: 'spmb', label: 'SPMB' },
    { key: 'login', label: 'Login' },
];

export default function PublicSiteHeader({ activePage }) {
    const { props } = usePage();
    const pengaturanSekolah = props.pengaturanSekolah ?? {};
    const contactHref = pengaturanSekolah.email
        ? `mailto:${pengaturanSekolah.email}`
        : `tel:${pengaturanSekolah.telepon || '0282695626'}`;

    return (
        <header className="sticky top-0 z-50 flex h-20 items-center border-b border-slate-200/60 bg-white/75 backdrop-blur-xl">
            <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6 lg:px-8">
                <Link
                    href={route('home')}
                    aria-label="YAPESDAI — Yayasan Pengembangan Sumber Daya Insani"
                    className="flex min-w-0 items-center gap-2"
                >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white p-1.5 shadow-sm">
                        <img
                            src="/yapesdai.png"
                            alt=""
                            className="h-full w-full object-contain"
                        />
                    </span>
                    <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-slate-900 sm:text-base">
                            YAPESDAI
                        </span>
                        <span className="hidden text-xs text-slate-500 sm:block">
                            Yayasan Pengembangan Sumber Daya Insani
                        </span>
                    </span>
                </Link>

                <nav aria-label="Navigasi utama" className="flex shrink-0 items-center gap-0.5 sm:gap-1">
                    {navigationItems.map((item) => {
                        const href = item.key === 'home'
                            ? route('home')
                            : item.key === 'spmb'
                                ? route('spmb.home')
                                : route('login');
                        const isActive = activePage === item.key;

                        return (
                            <Link
                                key={item.key}
                                href={href}
                                aria-current={isActive ? 'page' : undefined}
                                className={`inline-flex items-center justify-center rounded-full px-1.5 py-2 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 sm:px-3 sm:text-sm ${
                                    isActive
                                        ? 'bg-emerald-50 text-emerald-800'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                    <a
                        href={contactHref}
                        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-800 px-2.5 py-2 text-[10px] font-semibold text-white shadow-sm transition hover:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 sm:ml-2 sm:px-5 sm:text-sm"
                    >
                        <svg
                            className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            aria-hidden="true"
                        >
                            <rect x="3" y="5" width="18" height="14" rx="3" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4 7 8 6 8-6" />
                        </svg>
                        Kontak
                    </a>
                </nav>
            </div>
        </header>
    );
}
