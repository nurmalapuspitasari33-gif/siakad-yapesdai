import { Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

export default function DashboardSidebar({
    navigation = [],
    isNavigationOpen,
    isSidebarCollapsed,
    onClose,
}) {
    const isAccountPage = route().current('profile.edit');
    const navigationGroups = useMemo(() => navigation.reduce((groups, item) => {
        const currentGroup = groups[groups.length - 1];

        if (item.sectionTitle || !currentGroup) {
            groups.push({
                title: item.sectionTitle ?? 'Navigasi utama',
                items: [item],
            });
        } else {
            currentGroup.items.push(item);
        }

        return groups;
    }, []), [navigation]);
    const activeGroupTitle = navigationGroups.find((group) =>
        group.items.some((item) => item.active),
    )?.title ?? null;
    const [expandedGroupTitle, setExpandedGroupTitle] = useState(activeGroupTitle);

    useEffect(() => {
        setExpandedGroupTitle(activeGroupTitle);
    }, [activeGroupTitle, navigationGroups]);

    const renderNavigationItem = (item) => {
        const isActive = Boolean(item.active);
        const className = `group flex min-h-11 items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-all duration-150 ${
            isActive
                ? 'bg-brand-blue font-semibold text-white shadow-sm shadow-black/20'
                : 'font-medium text-white/75 hover:bg-white/10 hover:text-white'
        }`;
        const content = (
            <>
                <span
                    className={`h-2 w-2 shrink-0 rounded-full transition ${
                        isActive
                            ? 'bg-brand-gold'
                            : 'bg-white/35 group-hover:bg-brand-gold'
                    }`}
                    aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.badge && (
                    <span className={`ml-auto max-w-24 shrink-0 truncate rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        isActive ? 'bg-white/15 text-white' : 'bg-white/10 text-brand-gold'
                    }`}>
                        {item.badge}
                    </span>
                )}
            </>
        );

        if (item.isRoute) {
            return (
                <Link
                    key={item.id}
                    href={item.href}
                    prefetch
                    onClick={onClose}
                    aria-current={isActive ? 'page' : undefined}
                    className={className}
                >
                    {content}
                </Link>
            );
        }

        return (
            <a
                key={item.id}
                href={item.href}
                onClick={onClose}
                aria-current={isActive ? 'location' : undefined}
                className={className}
            >
                {content}
            </a>
        );
    };

    return (
        <aside
            id="dashboard-sidebar"
            aria-label="Menu dasbor"
            className={`print:hidden fixed inset-y-0 left-0 z-50 w-[280px] max-w-[82vw] shrink-0 overflow-y-auto border-r border-white/10 bg-brand-navy p-5 pb-[env(safe-area-inset-bottom)] text-white shadow-xl shadow-brand-navy/10 transition-transform duration-300 ease-in-out ${
                isNavigationOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
            } lg:sticky lg:inset-y-auto lg:left-auto lg:top-16 lg:z-20 lg:block lg:h-[calc(100vh-4rem)] lg:max-w-none lg:translate-x-0 lg:pointer-events-auto ${
                isSidebarCollapsed
                    ? 'lg:invisible lg:w-0 lg:overflow-hidden lg:border-r-0 lg:p-0 lg:opacity-0'
                    : 'lg:visible lg:w-72 lg:opacity-100'
            }`}
        >
            <div className="mb-7 flex items-center justify-between gap-2">
                <Link
                    href="/"
                    prefetch
                    className="flex min-w-0 items-center gap-3 rounded-2xl px-2 py-1"
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
                <button
                    type="button"
                    aria-label="Tutup menu navigasi"
                    onClick={onClose}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white transition hover:bg-white/10 lg:hidden"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-5 w-5" aria-hidden="true">
                        <path d="m6 6 12 12M18 6 6 18" />
                    </svg>
                </button>
            </div>

            <nav className="flex flex-col gap-2" aria-label="Navigasi dasbor">
                {navigationGroups.map((group) => {
                    const isOpen = expandedGroupTitle === group.title;
                    const isMainGroup = group.title === 'Utama';

                    if (isMainGroup) {
                        return (
                            <div key={group.title}>
                                <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-white/50">
                                    {group.title}
                                </p>
                                {group.items.map(renderNavigationItem)}
                            </div>
                        );
                    }

                    return (
                        <section key={group.title} className="border-b border-white/10 pb-2 last:border-b-0">
                            <button
                                type="button"
                                aria-expanded={isOpen}
                                onClick={() => setExpandedGroupTitle((currentTitle) =>
                                    currentTitle === group.title ? null : group.title,
                                )}
                                className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 text-left text-xs font-bold uppercase tracking-wider text-brand-gold transition hover:bg-white/10"
                            >
                                <span className="min-w-0 truncate">{group.title}</span>
                                <svg
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                                    aria-hidden="true"
                                >
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 0 1 1.414 0L10 10.586l3.293-3.293a1 1 0 1 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 0-1.414Z" clipRule="evenodd" />
                                </svg>
                            </button>
                            <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                                <div className="min-h-0 overflow-hidden">
                                    <div className="flex flex-col gap-1 pt-1">
                                        {group.items.map(renderNavigationItem)}
                                    </div>
                                </div>
                            </div>
                        </section>
                    );
                })}

                <div className="mt-2 border-t border-white/15 pt-3">
                    <Link
                        href={route('profile.edit')}
                        prefetch
                        onClick={onClose}
                        aria-current={isAccountPage ? 'page' : undefined}
                        className={`flex min-h-11 items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
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
                    </Link>
                </div>
                <Link
                    href={route('logout')}
                    method="post"
                    as="button"
                    onClick={onClose}
                    className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-rose-300 transition duration-150 hover:bg-rose-500/15 hover:text-rose-100"
                >
                    <span className="h-2 w-2 rounded-full bg-rose-400" aria-hidden="true" />
                    Keluar
                </Link>
            </nav>

            <div className="mt-8 rounded-2xl border border-white/15 bg-white/10 p-4 text-white/85 shadow-sm backdrop-blur-md">
                <p className="text-sm font-semibold text-brand-gold">Butuh bantuan?</p>
                <p className="mt-1 text-xs leading-5 text-white/70">
                    Hubungi administrator sekolah untuk bantuan akses.
                </p>
            </div>
        </aside>
    );
}
