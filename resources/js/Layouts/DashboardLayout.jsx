import { Link, usePage } from '@inertiajs/react';
import Dropdown from '@/Components/Dropdown';
import DashboardSidebar from '@/Components/DashboardSidebar';
import formatDashboardUserName from '@/Components/formatDashboardUserName';
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useState } from 'react';

const SIDEBAR_PREFERENCE_KEY = 'siakad.dashboard.sidebar.collapsed';

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
    const {
        auth = {},
        flash = {},
        activeTahunAjaran = null,
    } = usePage().props;
    const user = auth?.user;
    const userName = formatDashboardUserName(user);
    const [isNavigationOpen, setIsNavigationOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() =>
        typeof window !== 'undefined'
        && window.localStorage.getItem(SIDEBAR_PREFERENCE_KEY) === 'true',
    );
    const activePageLabel = title ?? navigation.find((item) => item.active)?.label ?? 'Dasbor';
    const academicTerm = activeTahunAjaran?.label ?? 'Belum ditetapkan';
    const mobileQuickLinks = mobileQuickLinksFor(user?.role, navigation, route().current('profile.edit'));

    useEffect(() => {
        window.localStorage.setItem(SIDEBAR_PREFERENCE_KEY, String(isSidebarCollapsed));
    }, [isSidebarCollapsed]);

    return (
        <div className="dashboard-theme min-h-screen bg-slate-50 font-sans antialiased tracking-tight text-slate-900 print:min-h-0 print:bg-white">
            <header className="sticky top-0 z-40 border-b border-slate-200 bg-white print:hidden">
                <div className="flex h-16 w-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
                    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                        {navigation.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setIsNavigationOpen((open) => !open)}
                                aria-label={isNavigationOpen ? 'Tutup navigasi' : 'Buka navigasi'}
                                aria-expanded={isNavigationOpen}
                                aria-controls="dashboard-sidebar"
                                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 lg:hidden"
                            >
                                <span className="text-lg" aria-hidden="true">
                                    {isNavigationOpen ? '×' : '☰'}
                                </span>
                            </button>
                        )}
                        {navigation.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
                                aria-label={isSidebarCollapsed ? 'Tampilkan navigasi samping' : 'Sembunyikan navigasi samping'}
                                aria-expanded={!isSidebarCollapsed}
                                aria-controls="dashboard-sidebar"
                                className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-brand-navy transition hover:border-brand-gold hover:bg-amber-50 lg:inline-flex"
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className={`h-5 w-5 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`}
                                    aria-hidden="true"
                                >
                                    <rect x="3" y="4" width="18" height="16" rx="2" />
                                    <path d="M9 4v16M14 9l-2 3 2 3" />
                                </svg>
                            </button>
                        )}
                        <div className="min-w-0">
                            <h1
                                aria-describedby={subtitle ? 'dashboard-page-subtitle' : undefined}
                                className="truncate text-sm font-bold text-brand-navy sm:text-base"
                            >
                                {activePageLabel}
                            </h1>
                            {subtitle && (
                                <span id="dashboard-page-subtitle" className="sr-only">
                                    {subtitle}
                                </span>
                            )}
                            <div className="mt-0.5 flex min-w-0 items-center gap-1.5 sm:hidden">
                                {roleLabel && (
                                    <span className="truncate text-[10px] font-semibold text-slate-600">
                                        {roleLabel}
                                    </span>
                                )}
                                <span aria-hidden="true" className="text-[10px] text-slate-400">·</span>
                                <span className="truncate text-[10px] font-medium text-slate-500">
                                    {academicTerm}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                        {roleLabel && (
                            <span className="hidden rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-brand-navy sm:inline-flex">
                                {roleLabel}
                            </span>
                        )}
                        <span
                            title="Tahun ajaran dan semester aktif"
                            className="hidden max-w-56 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-brand-navy md:inline-flex"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0" aria-hidden="true">
                                <rect x="3" y="5" width="18" height="16" rx="2" />
                                <path d="M16 3v4M8 3v4M3 10h18" />
                            </svg>
                            <span className="truncate">{academicTerm}</span>
                        </span>
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button
                                    type="button"
                                    aria-label={`Menu akun ${userName}`}
                                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1.5 pr-3 text-left transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-brand-blue/10"
                                >
                                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 font-semibold text-brand-blue">
                                        {userName.charAt(0).toUpperCase()}
                                    </span>
                                    <span className="hidden max-w-36 sm:block">
                                        <span className="block truncate text-xs font-semibold text-slate-800">
                                            {userName}
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
                    <DashboardSidebar
                        navigation={navigation}
                        isNavigationOpen={isNavigationOpen}
                        isSidebarCollapsed={isSidebarCollapsed}
                        onClose={() => setIsNavigationOpen(false)}
                    />
                )}

                <main className="min-w-0 flex-1 px-4 pt-5 pb-20 print:p-0 sm:px-6 sm:pt-6 md:pb-8 lg:px-8">
                    <div className="w-full print:max-w-none">
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
