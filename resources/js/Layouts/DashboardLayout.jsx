import { Link, usePage } from '@inertiajs/react';
import Dropdown from '@/Components/Dropdown';
import { createContext, useCallback, useContext, useLayoutEffect, useState } from 'react';

const mobileNavigationIcons = {
    home: (
        <>
            <path d="m3 10 9-7 9 7" />
            <path d="M5 9v12h14V9M9 21v-7h6v7" />
        </>
    ),
    calendar: (
        <>
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M16 3v4M8 3v4M3 11h18M8 15h2M14 15h2" />
        </>
    ),
    clipboard: (
        <>
            <path d="M9 4.5h6a2 2 0 0 1 2 2V8H7V6.5a2 2 0 0 1 2-2Z" />
            <rect x="5" y="6" width="14" height="16" rx="2" />
            <path d="M9 13h6M9 17h6" />
        </>
    ),
    document: (
        <>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
            <path d="M14 2v6h6M8 13h8M8 17h8" />
        </>
    ),
    user: (
        <>
            <circle cx="12" cy="8" r="4" />
            <path d="M5 21a7 7 0 0 1 14 0" />
        </>
    ),
    check: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="m8 12 2.5 2.5L16 9" />
        </>
    ),
};

const mobileNavigationTones = [
    'bg-blue-50 text-brand-blue',
    'bg-amber-50 text-amber-700',
    'bg-amber-50 text-amber-600',
    'bg-sky-50 text-sky-600',
];

function mobileQuickLinksFor(role, navigation, isAccountPage) {
    const findNavigationItem = (id, label, icon) => {
        const item = navigation.find((navigationItem) => navigationItem.id === id);

        return item ? { ...item, label, icon } : null;
    };
    const profileLink = {
        id: 'profile',
        label: 'Profil',
        href: route('profile.edit'),
        isRoute: true,
        active: isAccountPage,
        icon: 'user',
    };
    const dashboard = findNavigationItem('dashboard', 'Ringkasan', 'home');
    const schedule = findNavigationItem('jadwal', 'Jadwal', 'calendar');

    if (role === 'admin') {
        return [
            dashboard,
            schedule,
            findNavigationItem('ujian', 'Ujian', 'clipboard'),
            profileLink,
        ].filter(Boolean);
    }

    if (role === 'guru') {
        return [
            dashboard,
            schedule,
            findNavigationItem('ujian', 'Ujian', 'clipboard'),
            findNavigationItem('rapor-wali', 'Rapor', 'document') ?? profileLink,
        ].filter(Boolean);
    }

    if (role === 'siswa' && navigation.some((item) => item.id === 'spmb')) {
        return [
            dashboard,
            findNavigationItem('spmb', 'SPMB', 'document'),
            {
                id: 'status-spmb',
                label: 'Status',
                href: `${route('siswa.dashboard')}#status-spmb`,
                isRoute: true,
                active: false,
                icon: 'check',
            },
            profileLink,
        ].filter(Boolean);
    }

    if (role === 'siswa') {
        return [
            dashboard,
            schedule,
            findNavigationItem('ujian', 'Ujian', 'clipboard'),
            findNavigationItem('rapor', 'Rapor', 'document') ?? profileLink,
        ].filter(Boolean);
    }

    return [dashboard, schedule, profileLink].filter(Boolean);
}

const DashboardLayoutContext = createContext(null);

function sameNavigation(previous = [], next = []) {
    return previous.length === next.length && previous.every((item, index) => {
        const nextItem = next[index];

        return item.id === nextItem.id
            && item.label === nextItem.label
            && item.href === nextItem.href
            && item.active === nextItem.active
            && item.sectionTitle === nextItem.sectionTitle
            && item.isRoute === nextItem.isRoute
            && item.badge === nextItem.badge;
    });
}

export function PersistentDashboardLayout({ children }) {
    const [layoutConfig, setLayoutConfig] = useState({
        title: '',
        subtitle: '',
        roleLabel: '',
        navigation: [],
    });
    const updateLayout = useCallback((nextConfig) => {
        setLayoutConfig((previousConfig) => {
            const isUnchanged = previousConfig.title === nextConfig.title
                && previousConfig.subtitle === nextConfig.subtitle
                && previousConfig.roleLabel === nextConfig.roleLabel
                && sameNavigation(previousConfig.navigation, nextConfig.navigation);

            return isUnchanged ? previousConfig : nextConfig;
        });
    }, []);

    return (
        <DashboardLayoutContext.Provider value={updateLayout}>
            <DashboardFrame {...layoutConfig}>{children}</DashboardFrame>
        </DashboardLayoutContext.Provider>
    );
}

// Page wrappers provide their current metadata while this outer frame stays mounted.
export default function DashboardLayout(props) {
    const updateLayout = useContext(DashboardLayoutContext);
    const { children, ...layoutConfig } = props;

    useLayoutEffect(() => {
        updateLayout?.(layoutConfig);
    }, [updateLayout, layoutConfig.title, layoutConfig.subtitle, layoutConfig.roleLabel, layoutConfig.navigation]);

    return updateLayout
        ? children
        : <DashboardFrame {...layoutConfig}>{children}</DashboardFrame>;
}

function DashboardFrame({
    title,
    subtitle,
    roleLabel,
    navigation = [],
    children,
}) {
    const { auth = {}, assetUrls = {}, flash = {}, pengaturanSekolah = {} } = usePage().props;
    const user = auth?.user;
    const userName = user?.name ?? 'Pengguna';
    const [isNavigationOpen, setIsNavigationOpen] = useState(false);
    const isAccountPage = route().current('profile.edit');
    const accountLink = (
        <Link
            href={route('profile.edit')}
            prefetch
            onClick={() => setIsNavigationOpen(false)}
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
        </Link>
    );
    const logoutLink = (
        <Link
            href={route('logout')}
            method="post"
            as="button"
            onClick={() => setIsNavigationOpen(false)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-rose-600 transition duration-150 hover:bg-rose-50 hover:text-rose-700"
        >
            <span className="h-2 w-2 rounded-full bg-rose-400" aria-hidden="true" />
            Keluar
        </Link>
    );
    const mobileQuickLinks = mobileQuickLinksFor(user?.role, navigation, isAccountPage);

    return (
        <div className="dashboard-theme min-h-screen bg-gradient-to-br from-blue-50/50 via-slate-50 to-amber-50/30 font-sans antialiased tracking-tight text-slate-900 print:min-h-0 print:bg-white">
            <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/75 backdrop-blur-xl print:hidden">
                <div className="flex h-16 w-full items-center justify-between gap-4 px-6 lg:px-10">
                    <div className="flex min-w-0 items-center gap-3">
                        {navigation.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setIsNavigationOpen((open) => !open)}
                                aria-label={isNavigationOpen ? 'Tutup navigasi' : 'Buka navigasi'}
                                aria-expanded={isNavigationOpen}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 lg:hidden"
                            >
                                <span className="text-lg" aria-hidden="true">
                                    {isNavigationOpen ? '×' : '☰'}
                                </span>
                            </button>
                        )}
                        <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-900 sm:text-base">
                                {title}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                                {subtitle}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="hidden rounded-full border border-brand-gold/60 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-brand-navy sm:inline-flex">
                            {roleLabel}
                        </span>
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button
                                    type="button"
                                    aria-label={`Menu akun ${userName}`}
                                    className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 p-1.5 pr-3 text-left transition hover:bg-white focus:outline-none focus:ring-4 focus:ring-brand-blue/10"
                                >
                                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 font-semibold text-brand-blue">
                                        {userName.charAt(0).toUpperCase()}
                                    </span>
                                    <span className="hidden max-w-36 sm:block">
                                        <span className="block truncate text-xs font-semibold text-slate-800">
                                            {userName}
                                        </span>
                                        <span className="block truncate text-[11px] text-slate-500">
                                            {roleLabel}
                                        </span>
                                    </span>
                                    <svg className="h-4 w-4 text-slate-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 0 1 1.414 0L10 10.586l3.293-3.293a1 1 0 1 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 0-1.414Z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </Dropdown.Trigger>
                            <Dropdown.Content contentClasses="py-1 bg-white/95 backdrop-blur-xl">
                                <Dropdown.Link href={route('profile.edit')} prefetch>
                                    Pengaturan Akun
                                </Dropdown.Link>
                                <Dropdown.Link href={route('logout')} method="post" as="button">
                                    Keluar
                                </Dropdown.Link>
                            </Dropdown.Content>
                        </Dropdown>
                    </div>
                </div>
            </header>

            <div className="flex w-full">
                {navigation.length > 0 && (
                    <>
                        {isNavigationOpen && (
                            <button
                                type="button"
                                aria-label="Tutup navigasi"
                                onClick={() => setIsNavigationOpen(false)}
                                className="fixed inset-16 z-10 bg-slate-950/20 backdrop-blur-sm print:hidden lg:hidden"
                            />
                        )}
                        <aside
                            className={`print:hidden ${
                                isNavigationOpen ? 'block' : 'hidden'
                            } fixed inset-y-16 left-0 z-20 w-72 overflow-y-auto border-r border-white/10 bg-brand-navy p-5 text-white shadow-xl shadow-brand-navy/10 lg:sticky lg:top-16 lg:block lg:h-[calc(100vh-4rem)] lg:w-72 lg:shrink-0`}
                        >
                            <Link
                                href="/"
                                prefetch
                                className="mb-7 flex items-center gap-3 rounded-2xl px-2 py-1"
                                aria-label={`${pengaturanSekolah?.nama_sekolah ?? 'SIAKAD Sekolah'}, beranda`}
                            >
                                <img
                                    src={assetUrls.logoSekolah}
                                    alt=""
                                    className="h-10 w-10 shrink-0 rounded-xl border border-white/20 bg-white object-contain p-1"
                                />
                                <span className="min-w-0">
                                    <span className="block break-words text-[13px] font-bold leading-4 text-white">
                                        {pengaturanSekolah?.nama_sekolah ?? 'SIAKAD Sekolah'}
                                    </span>
                                    <span className="block text-xs text-white/65">
                                        Portal akademik terpadu
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
                                    const onClick = () => setIsNavigationOpen(false);

                                    return item.isRoute ? (
                                        <div key={item.id}>
                                            {item.sectionTitle && (
                                                <p className={`mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-white/50 ${
                                                    item.sectionTitle === 'Utama' ? 'mt-0' : 'mt-5'
                                                }`}>
                                                    {item.sectionTitle}
                                                </p>
                                            )}
                                            <Link
                                                href={item.href}
                                                prefetch
                                                onClick={onClick}
                                                aria-current={isActive ? 'page' : undefined}
                                                className={className}
                                            >
                                                {content}
                                            </Link>
                                        </div>
                                    ) : (
                                        <div key={item.id}>
                                            {item.sectionTitle && (
                                                <p className={`mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-white/50 ${
                                                    item.sectionTitle === 'Utama' ? 'mt-0' : 'mt-5'
                                                }`}>
                                                    {item.sectionTitle}
                                                </p>
                                            )}
                                            <a
                                                href={item.href}
                                                onClick={onClick}
                                                aria-current={isActive ? 'location' : undefined}
                                                className={className}
                                            >
                                                {content}
                                            </a>
                                        </div>
                                    );
                                })}
                                <div className="mt-4 border-t border-white/15 pt-4">
                                    {accountLink}
                                </div>
                                {logoutLink}
                            </nav>

                            <div className="mt-8 rounded-2xl border border-white/15 bg-white/10 p-4 text-white/85 shadow-sm backdrop-blur-md">
                                <p className="text-sm font-semibold text-brand-gold">Butuh bantuan?</p>
                                <p className="mt-1 text-xs leading-5 text-white/70">
                                    Hubungi administrator sekolah untuk bantuan akses.
                                </p>
                            </div>
                        </aside>
                    </>
                )}

                <main className="min-w-0 flex-1 px-6 pt-6 pb-20 print:p-0 sm:pt-8 md:pb-8 lg:px-10">
                    <div className="w-full print:max-w-none">
                        <div className="mb-6 print:hidden">
                            <p className="mb-2 text-sm font-semibold text-brand-blue">
                                {roleLabel}
                            </p>
                            <h1 className="font-display text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">
                                {title}
                            </h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                                {subtitle}
                            </p>
                        </div>
                        {flash.success && (
                            <div
                                role="status"
                                className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 print:hidden"
                            >
                                {flash.success}
                            </div>
                        )}
                        {flash.error && (
                            <div
                                role="alert"
                                className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800 print:hidden"
                            >
                                {flash.error}
                            </div>
                        )}
                        {children}
                    </div>
                </main>
            </div>

            {mobileQuickLinks.length > 0 && (
                <nav
                    className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/70 bg-white/90 shadow-[0_-8px_24px_rgb(15,23,42,0.04)] backdrop-blur-xl md:hidden print:hidden"
                    aria-label="Navigasi cepat"
                >
                    <div className="mx-auto grid max-w-xl grid-cols-4">
                        {mobileQuickLinks.map((item, index) => (
                            <Link
                                key={item.id}
                                href={item.href}
                                prefetch
                                onClick={() => setIsNavigationOpen(false)}
                                aria-label={item.badge ? `${item.label} · ${item.badge}` : item.label}
                                aria-current={item.active ? 'page' : undefined}
                                className={`flex min-w-0 flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] font-semibold transition ${
                                    item.active ? 'text-brand-blue' : 'text-slate-500 hover:text-brand-navy'
                                }`}
                            >
                                <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                                    item.active ? 'bg-blue-50 text-brand-blue' : mobileNavigationTones[index]
                                }`}>
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                    >
                                        {mobileNavigationIcons[item.icon] ?? mobileNavigationIcons.document}
                                    </svg>
                                </span>
                                <span className="block max-w-full truncate">{item.label}</span>
                                {item.badge && <span className="block max-w-full truncate text-[8px] font-medium">{item.badge}</span>}
                            </Link>
                        ))}
                    </div>
                </nav>
            )}
        </div>
    );
}
