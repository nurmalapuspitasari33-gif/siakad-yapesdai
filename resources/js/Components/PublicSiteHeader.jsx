import { Link, usePage } from '@inertiajs/react';

const navigationItems = [
    { label: 'Beranda', href: '#beranda' },
    { label: 'Kompetensi Keahlian', href: '#kompetensi-keahlian' },
    { label: 'Jalur Seleksi', href: '#jalur-seleksi' },
    { label: 'Persyaratan & Biaya', href: '#persyaratan-biaya' },
    { label: 'Alur Pendaftaran', href: '#alur-pendaftaran' },
];

export default function PublicSiteHeader() {
    const { props } = usePage();
    const assetUrls = props.assetUrls ?? {};
    const pengaturanSekolah = props.pengaturanSekolah ?? {};
    const auth = props.auth ?? {};
    const schoolName = pengaturanSekolah.nama_sekolah
        && pengaturanSekolah.nama_sekolah !== 'Nama Sekolah'
        ? pengaturanSekolah.nama_sekolah
        : "SMK Al Mu'allim Kesugihan";

    return (
        <header className="sticky top-0 z-40 border-b border-white/10 bg-brand-navy text-white shadow-lg">
            <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                <Link
                    href={route('home')}
                    aria-label={`${schoolName} — Portal SPMB`}
                    className="flex min-w-0 items-center gap-3"
                >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white p-1.5">
                        <img
                            src={assetUrls.logoSekolah || '/logo.png'}
                            alt=""
                            className="h-full w-full object-contain"
                        />
                    </span>
                    <span className="min-w-0">
                        <span className="block truncate font-display text-sm font-extrabold sm:text-base">
                            SPMB {schoolName}
                        </span>
                        <span className="mt-0.5 hidden text-[11px] text-white/70 sm:block">
                            YAPESDAI · Portal Penerimaan Murid Baru
                        </span>
                    </span>
                </Link>

                <nav aria-label="Navigasi utama" className="hidden items-center gap-1 xl:flex">
                    {navigationItems.map((item) => (
                        <a
                            key={item.href}
                            href={item.href}
                            className="rounded-lg px-2.5 py-2 text-xs font-semibold text-white/85 transition hover:bg-white/10 hover:text-brand-gold"
                        >
                            {item.label}
                        </a>
                    ))}
                </nav>

                <div className="flex shrink-0 items-center gap-2">
                    <Link
                        href={auth.user ? route('dashboard') : route('register')}
                        className="inline-flex min-h-10 items-center justify-center rounded-full bg-brand-gold px-3.5 py-2 text-xs font-bold text-brand-navy transition hover:bg-yellow-300 sm:px-4 sm:text-sm"
                    >
                        {auth.user ? 'Dashboard' : 'Daftar Sekarang'}
                    </Link>
                    <Link
                        href={auth.user ? route('dashboard') : route('login')}
                        className="hidden min-h-10 items-center justify-center rounded-full border border-white/40 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10 sm:inline-flex"
                    >
                        {auth.user ? 'SIAKAD' : 'Login SIAKAD'}
                    </Link>
                </div>
            </div>
            <nav aria-label="Navigasi portal" className="overflow-x-auto border-t border-white/10 px-2 py-2 xl:hidden">
                <div className="mx-auto flex w-max items-center gap-1">
                    {navigationItems.map((item) => (
                        <a
                            key={item.href}
                            href={item.href}
                            className="whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] font-semibold text-white/85 transition hover:bg-white/10 hover:text-brand-gold"
                        >
                            {item.label}
                        </a>
                    ))}
                </div>
            </nav>
        </header>
    );
}
