import { usePage } from '@inertiajs/react';
import Dropdown from '@/Components/Dropdown';
import DashboardSidebar from '@/Components/DashboardSidebar';
import formatDashboardUserName from '@/Components/formatDashboardUserName';
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useState } from 'react';

const SIDEBAR_PREFERENCE_KEY = 'siakad.dashboard.sidebar.collapsed';

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

    useEffect(() => {
        window.localStorage.setItem(SIDEBAR_PREFERENCE_KEY, String(isSidebarCollapsed));
    }, [isSidebarCollapsed]);

    useEffect(() => {
        if (!isNavigationOpen) {
            return undefined;
        }

        const previousOverflow = document.body.style.overflow;
        const closeOnEscape = (event) => {
            if (event.key === 'Escape') {
                setIsNavigationOpen(false);
            }
        };
        const closeOnDesktopResize = () => {
            if (window.matchMedia('(min-width: 1024px)').matches) {
                setIsNavigationOpen(false);
            }
        };

        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', closeOnEscape);
        window.addEventListener('resize', closeOnDesktopResize);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', closeOnEscape);
            window.removeEventListener('resize', closeOnDesktopResize);
        };
    }, [isNavigationOpen]);

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
                                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 lg:hidden"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-5 w-5" aria-hidden="true">
                                    <path d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
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
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                        {roleLabel && (
                            <span className="hidden rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-brand-navy md:inline-flex">
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
                    <>
                        {isNavigationOpen && (
                            <button
                                type="button"
                                aria-label="Tutup menu navigasi"
                                onClick={() => setIsNavigationOpen(false)}
                                className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[2px] lg:hidden"
                            />
                        )}
                        <DashboardSidebar
                            navigation={navigation}
                            isNavigationOpen={isNavigationOpen}
                            isSidebarCollapsed={isSidebarCollapsed}
                            onClose={() => setIsNavigationOpen(false)}
                        />
                    </>
                )}

                <main className="min-w-0 flex-1 px-4 pt-5 pb-8 print:p-0 sm:px-6 sm:pt-6 lg:px-8">
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
        </div>
    );
}
