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
    const tahunAjaranAktif = props.tahunAjaranAktif;
    const schoolName = pengaturanSekolah.nama_sekolah
        && pengaturanSekolah.nama_sekolah !== 'Nama Sekolah'
        ? pengaturanSekolah.nama_sekolah
        : "SMK Al Mu'allim Kesugihan";

    return (
        <header className="sticky top-0 z-40 text-white shadow-lg">
            <div className="bg-[#0B2149]">
                <div className="mx-auto flex min-h-[68px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                    <Link href={route('home')} aria-label={`${schoolName} — Portal SPMB`} className="flex min-w-0 items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white p-1.5">
                            <img src={assetUrls.logoSekolah || '/logo.png'} alt="" className="h-full w-full object-contain" />
                        </span>
                        <span className="truncate font-display text-sm font-extrabold sm:text-base">SPMB {schoolName}</span>
                    </Link>
                    <div className="flex shrink-0 items-center gap-3">
                        <span className="hidden text-xs font-medium text-blue-100 sm:block">
                            {tahunAjaranAktif?.label ?? 'Tahun ajaran aktif belum ditetapkan'}
                        </span>
                        <Link href={auth.user ? route('dashboard') : route('login')} className="rounded-full border border-white/35 px-4 py-2 text-xs font-bold transition hover:bg-white/10">
                            Login SIAKAD
                        </Link>
                    </div>
                </div>
            </div>
            <div className="bg-[#2B4C8C]">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
                    <nav aria-label="Navigasi utama" className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
                    {navigationItems.map((item) => (
                        <a
                            key={item.href}
                            href={`${route('home')}${item.href}`}
                            className={`whitespace-nowrap rounded px-3 py-2 text-xs font-bold transition ${
                                item.label === 'Beranda'
                                    ? 'bg-white text-[#0B2149]'
                                    : 'text-white hover:bg-white/10'
                            }`}
                        >
                            {item.label}
                        </a>
                    ))}
                    </nav>
                    <Link href={auth.user ? route('dashboard') : route('register')} className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-full bg-white px-4 py-2 text-[10px] font-extrabold uppercase tracking-wide text-[#0B2149] transition hover:bg-blue-50 sm:px-5 sm:text-xs">
                        Daftar Sekarang
                    </Link>
                </div>
            </div>
        </header>
    );
}
