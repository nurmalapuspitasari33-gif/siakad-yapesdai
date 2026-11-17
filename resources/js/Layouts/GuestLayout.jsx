import PublicSiteHeader from '@/Components/PublicSiteHeader';

export default function GuestLayout({ children, activePage = 'login' }) {
    return (
        <div className="relative min-h-screen bg-[#F8FAFC] font-public tracking-tight text-slate-900 antialiased">
            <PublicSiteHeader activePage={activePage} />

            <main className="relative isolate min-h-[calc(100vh-5rem)] overflow-hidden bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/50">
                <div className="pointer-events-none absolute -right-36 top-12 -z-10 h-96 w-96 rounded-full bg-emerald-200/30 opacity-40 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-28 -left-20 -z-10 h-80 w-[60%] rounded-[50%] bg-teal-100/70 opacity-40 blur-2xl" />

                <section className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
                    <div className="w-full max-w-md rounded-[2rem] border border-white bg-white/85 p-6 shadow-[0_20px_50px_rgb(0,0,0,0.06)] ring-1 ring-slate-900/5 backdrop-blur-2xl sm:p-10">
                        {children}
                    </div>
                </section>
            </main>
        </div>
    );
}
