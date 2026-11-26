import { Link, usePage } from '@inertiajs/react';

const navigationItems = [
    { key: 'spmb', label: 'SPMB' },
    { key: 'login', label: 'Sistem Akademik' },
];

export default function PublicSiteHeader({ activePage }) {
    const { props } = usePage();
    const assetUrls = props.assetUrls ?? {};
    const pengaturanSekolah = props.pengaturanSekolah ?? {};
    const schoolName = pengaturanSekolah.nama_sekolah
        && pengaturanSekolah.nama_sekolah !== 'Nama Sekolah'
        ? pengaturanSekolah.nama_sekolah
        : "SMK Al Mu'allim Kesugihan";
    const contactHref = pengaturanSekolah.email
        ? `mailto:${pengaturanSekolah.email}`
        : `tel:${pengaturanSekolah.telepon || '0282695626'}`;

    return (
        <>
            <header className="shrink-0 border-b border-white/10 bg-brand-navy text-white">
                <div className="mx-auto flex min-h-[84px] w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:min-h-24 sm:px-6 lg:px-8">
                    <Link
                        href={route('login')}
                        prefetch
                        aria-label={`${schoolName} — portal akademik`}
                        className="flex min-w-0 items-center gap-3"
                    >
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white p-1.5 shadow-sm sm:h-14 sm:w-14">
                            <img
                                src={assetUrls.logoSekolah || assetUrls.logoYapesdai}
                                alt=""
                                className="h-full w-full object-contain"
                            />
                        </span>
                        <span className="min-w-0 leading-tight">
                            <span className="block truncate font-display text-base font-bold tracking-tight text-white sm:text-xl">
                                {schoolName}
                            </span>
                            <span className="mt-1 hidden text-xs text-white/75 sm:block">
                                Portal akademik terpadu · YAPESDAI
                            </span>
                        </span>
                    </Link>

                    <a
                        href={contactHref}
                        className="inline-flex shrink-0 items-center gap-2 rounded-full bg-brand-gold px-3 py-2 text-xs font-bold text-brand-navy transition hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:ring-offset-2 focus:ring-offset-brand-navy sm:px-4 sm:text-sm"
                    >
                        <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            aria-hidden="true"
                        >
                            <rect x="3" y="5" width="18" height="14" rx="3" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4 7 8 6 8-6" />
                        </svg>
                        <span className="hidden sm:inline">Kontak Sekolah</span>
                        <span className="sm:hidden">Kontak</span>
                    </a>
                </div>
            </header>

            <div className="sticky top-0 z-40 shrink-0 bg-brand-blue text-white shadow-md">
                <nav
                    aria-label="Navigasi utama"
                    className="mx-auto flex h-12 max-w-7xl items-center justify-center gap-2 px-4 sm:gap-4"
                >
                    {navigationItems.map((item) => {
                        const href = item.key === 'spmb'
                            ? route('spmb.home')
                            : route('login');
                        const isActive = activePage === item.key;

                        return (
                            <Link
                                key={item.key}
                                href={href}
                                prefetch
                                aria-current={isActive ? 'page' : undefined}
                                className={`inline-flex h-full items-center border-b-2 px-3 text-xs font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-gold sm:px-5 sm:text-sm ${
                                    isActive
                                        ? 'border-brand-gold text-brand-gold'
                                        : 'border-transparent text-white/95 hover:text-brand-gold'
                                }`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </>
    );
}
