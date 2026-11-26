import PublicSiteFooter from '@/Components/PublicSiteFooter';
import PublicSiteHeader from '@/Components/PublicSiteHeader';
import { Link, usePage } from '@inertiajs/react';

export default function PublicSiteLayout({ children }) {
    const { component, props } = usePage();
    const isPortal = component === 'Welcome';
    const assetUrls = props.assetUrls ?? {};
    const pengaturanSekolah = props.pengaturanSekolah ?? {};
    const schoolName = pengaturanSekolah.nama_sekolah
        && pengaturanSekolah.nama_sekolah !== 'Nama Sekolah'
        ? pengaturanSekolah.nama_sekolah
        : "SMK Al Mu'allim Kesugihan";

    if (isPortal) {
        return (
            <div className="flex min-h-screen flex-col bg-white font-sans text-slate-900">
                <PublicSiteHeader />
                <div className="flex flex-1 flex-col">{children}</div>
                <PublicSiteFooter />
            </div>
        );
    }

    return (
        <div className="relative flex min-h-screen flex-col overflow-hidden bg-slate-950 font-public text-slate-900">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_15%,rgba(0,74,153,0.65),transparent_48%),radial-gradient(ellipse_at_85%_85%,rgba(200,155,37,0.18),transparent_45%),linear-gradient(135deg,#07172f,#0b2c59_55%,#102d50)]" />
            <div className="pointer-events-none absolute inset-0 bg-slate-950/35" />
            <div className="relative z-10 flex min-h-screen flex-col">
                <header className="mx-auto flex w-full max-w-7xl items-center gap-3 px-5 py-5 sm:px-8">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-lg">
                        <img
                            src={assetUrls.logoSekolah || '/logo.png'}
                            alt=""
                            className="h-full w-full object-contain"
                        />
                    </span>
                    <div className="min-w-0 text-white">
                        <p className="truncate font-display text-base font-extrabold sm:text-lg">{schoolName}</p>
                        <p className="mt-0.5 text-xs font-medium text-white/75">
                            Yayasan Pengembangan Sumberdaya Insani (YAPESDAI)
                        </p>
                    </div>
                </header>

                <main className="flex flex-1 items-center justify-center px-4 py-4 sm:px-6 sm:py-8">
                    {children}
                </main>

                <footer className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 px-4 pb-6 text-xs font-semibold text-white/80">
                    <Link href={route('home')} className="transition hover:text-brand-gold">
                        ← Kembali ke Beranda SPMB
                    </Link>
                    <span className="hidden text-white/40 sm:inline">•</span>
                    <span>Portal Akademik &amp; SPMB</span>
                </footer>
            </div>
        </div>
    );
}
