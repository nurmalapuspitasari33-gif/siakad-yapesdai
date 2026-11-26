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
    const auth = props.auth ?? {};
    const tahunAjaranAktif = props.tahunAjaranAktif;

    return (
        <header className="sticky top-0 z-40 text-white shadow-lg">
            <div className="bg-[#0B2C59]">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                    <Link href={route('home')} aria-label="YAPESDAI — Portal SPMB" className="flex min-w-0 items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white p-1.5">
                            <img src="/yapesdai.png" alt="" className="h-full w-full object-contain" />
                        </span>
                        <span className="min-w-0">
                            <span className="block truncate font-display text-sm font-extrabold sm:text-base">YAPESDAI</span>
                            <span className="block truncate text-[10px] font-medium text-brand-gold sm:text-xs">
                                Yayasan Pengembangan Sumberdaya Insani
                            </span>
                        </span>
                    </Link>
                    <div className="flex shrink-0 items-center gap-3">
                        <span className="hidden text-xs font-medium text-amber-300 sm:block">
                            {tahunAjaranAktif?.label ?? 'Tahun ajaran aktif belum ditetapkan'}
                        </span>
                        <Link href={auth.user ? route('dashboard') : route('login')} className="rounded-full border border-white/35 px-4 py-2 text-xs font-bold transition hover:border-[#FACC15] hover:text-[#FACC15]">
                            Login SIAKAD
                        </Link>
                    </div>
                </div>
            </div>
            <div className="bg-[#004A99]">
                <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
                    <nav aria-label="Navigasi utama" className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
                    {navigationItems.map((item) => (
                        <a
                            key={item.href}
                            href={`${route('home')}${item.href}`}
                            className={`whitespace-nowrap rounded-md px-3.5 py-1.5 text-xs font-bold transition ${
                                item.label === 'Beranda'
                                    ? 'bg-white text-[#0B2C59]'
                                    : 'text-white hover:bg-white/10'
                            }`}
                        >
                            {item.label}
                        </a>
                    ))}
                    </nav>
                    <Link href={auth.user ? route('dashboard') : route('register')} className="inline-flex shrink-0 items-center justify-center rounded-full bg-white px-5 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-[#0B2C59] transition hover:bg-amber-100 sm:text-xs">
                        Daftar Sekarang
                    </Link>
                </div>
            </div>
        </header>
    );
}
