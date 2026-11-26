import { Link } from '@inertiajs/react';
import MagneticItem from '@/Components/MagneticMenu';

export default function DashboardSidebar({
    navigation = [],
    isNavigationOpen,
    isSidebarCollapsed,
    onClose,
}) {
    const isAccountPage = route().current('profile.edit');

    return (
        <>
            {isNavigationOpen && (
                <button
                    type="button"
                    aria-label="Tutup navigasi"
                    onClick={onClose}
                    className="fixed inset-16 z-10 bg-slate-950/20 backdrop-blur-sm print:hidden lg:hidden"
                />
            )}
            <aside
                id="dashboard-sidebar"
                className={`print:hidden ${
                    isNavigationOpen ? 'block' : 'hidden'
                } fixed inset-y-16 left-0 z-20 w-72 shrink-0 overflow-y-auto border-r border-white/10 bg-brand-navy p-5 text-white shadow-xl shadow-brand-navy/10 transition-all duration-300 ease-in-out lg:sticky lg:inset-y-auto lg:left-auto lg:top-16 lg:block lg:h-[calc(100vh-4rem)] ${
                    isSidebarCollapsed
                        ? 'lg:invisible lg:w-0 lg:overflow-hidden lg:border-r-0 lg:p-0 lg:opacity-0'
                        : 'lg:visible lg:w-72 lg:opacity-100'
                }`}
            >
                <Link
                    href="/"
                    prefetch
                    className="mb-7 flex items-center gap-3 rounded-2xl px-2 py-1"
                    aria-label="YAPESDAI, beranda"
                    onClick={onClose}
                >
                    <img
                        src="/yapesdai.png"
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-xl border border-white/20 bg-white object-contain p-1"
                    />
                    <span className="min-w-0">
                        <span className="block break-words text-[13px] font-bold leading-4 text-white">
                            YAPESDAI
                        </span>
                        <span className="block text-xs text-brand-gold">
                            Yayasan Pengembangan Sumberdaya Insani
                        </span>
                    </span>
                </Link>

                <div className="mb-5 px-3">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-gold">
                        Navigasi utama
                    </p>
                </div>

                <nav className="flex flex-col gap-1" aria-label="Navigasi dasbor">
                    {navigation.map((item) => {
                        const isActive = Boolean(item.active);
                        const className = `group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-all duration-150 ${
                            isActive
                                ? 'bg-brand-blue font-semibold text-white shadow-sm shadow-black/20'
                                : 'font-medium text-white/75 hover:bg-white/10 hover:text-white'
                        }`;
                        const content = (
                            <>
                                <span
                                    className={`h-2 w-2 rounded-full transition ${
                                        isActive
                                            ? 'bg-brand-gold'
                                            : 'bg-white/35 group-hover:bg-brand-gold'
                                    }`}
                                    aria-hidden="true"
                                />
                                <span className="truncate">{item.label}</span>
                                {item.badge && (
                                    <span className={`ml-auto max-w-24 truncate rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                        isActive ? 'bg-white/15 text-white' : 'bg-white/10 text-brand-gold'
                                    }`}>
                                        {item.badge}
                                    </span>
                                )}
                            </>
                        );
                        const onClick = () => onClose();

                        return (
                            <div key={item.id}>
                                {item.sectionTitle && (
                                    <p className={`mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-white/50 ${
                                        item.sectionTitle === 'Utama' ? 'mt-0' : 'mt-5'
                                    }`}>
                                        {item.sectionTitle}
                                    </p>
                                )}
                                {item.isRoute ? (
                                    <MagneticItem
                                        component={Link}
                                        href={item.href}
                                        prefetch
                                        onClick={onClick}
                                        aria-current={isActive ? 'page' : undefined}
                                        className={className}
                                    >
                                        {content}
                                    </MagneticItem>
                                ) : (
                                    <MagneticItem
                                        component="a"
                                        href={item.href}
                                        onClick={onClick}
                                        aria-current={isActive ? 'location' : undefined}
                                        className={className}
                                    >
                                        {content}
                                    </MagneticItem>
                                )}
                            </div>
                        );
                    })}

                    <div className="mt-4 border-t border-white/15 pt-4">
                        <MagneticItem
                            component={Link}
                            href={route('profile.edit')}
                            prefetch
                            onClick={onClose}
                            aria-current={isAccountPage ? 'page' : undefined}
                            className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                                isAccountPage
                                    ? 'bg-brand-blue font-semibold text-white shadow-sm shadow-black/20'
                                    : 'text-white/75 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            <span
                                className={`h-2 w-2 rounded-full ${
                                    isAccountPage ? 'bg-brand-gold' : 'bg-white/35'
                                }`}
                                aria-hidden="true"
                            />
                            Pengaturan Akun
                        </MagneticItem>
                    </div>
                    <MagneticItem
                        component={Link}
                        href={route('logout')}
                        method="post"
                        as="button"
                        onClick={onClose}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-rose-300 transition duration-150 hover:bg-rose-500/15 hover:text-rose-100"
                    >
                        <span className="h-2 w-2 rounded-full bg-rose-400" aria-hidden="true" />
                        Keluar
                    </MagneticItem>
                </nav>

                <div className="mt-8 rounded-2xl border border-white/15 bg-white/10 p-4 text-white/85 shadow-sm backdrop-blur-md">
                    <p className="text-sm font-semibold text-brand-gold">Butuh bantuan?</p>
                    <p className="mt-1 text-xs leading-5 text-white/70">
                        Hubungi administrator sekolah untuk bantuan akses.
                    </p>
                </div>
            </aside>
        </>
    );
}
