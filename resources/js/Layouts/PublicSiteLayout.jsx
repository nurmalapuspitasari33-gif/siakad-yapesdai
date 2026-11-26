import PublicSiteFooter from '@/Components/PublicSiteFooter';
import PublicSiteHeader from '@/Components/PublicSiteHeader';
import { Link, usePage } from '@inertiajs/react';

export default function PublicSiteLayout({ children }) {
    const { component } = usePage();
    const isPortal = component === 'Welcome';

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
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_16%_22%,rgba(30,58,138,0.72),transparent_48%),radial-gradient(ellipse_at_82%_82%,rgba(200,155,37,0.18),transparent_40%),linear-gradient(135deg,#07152f,#0b2149_55%,#142a48)]" />
            <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(135deg,transparent_45%,rgba(255,255,255,0.12)_45.2%,transparent_45.5%),linear-gradient(45deg,transparent_60%,rgba(255,255,255,0.08)_60.2%,transparent_60.5%)]" />
            <div className="pointer-events-none absolute inset-0 bg-slate-950/30" />
            <div className="relative z-10 flex min-h-screen flex-col">
                <header className="mx-auto flex w-full max-w-7xl items-center justify-center gap-3 px-5 py-5 text-center sm:px-8">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-lg">
                        <img src="/yapesdai.png" alt="" className="h-full w-full object-contain" />
                    </span>
                    <div className="min-w-0 text-white">
                        <p className="truncate font-display text-sm font-extrabold uppercase tracking-wide sm:text-lg">YAPESDAI</p>
                        <p className="mt-0.5 text-xs font-medium text-brand-gold">
                            Yayasan Pengembangan Sumberdaya Insani
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
