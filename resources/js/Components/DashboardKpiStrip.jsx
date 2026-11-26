import { Link } from '@inertiajs/react';

const iconGraphics = {
    users: (
        <>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </>
    ),
    school: (
        <>
            <path d="m3 10 9-7 9 7" />
            <path d="M5 9v12h14V9M9 21v-7h6v7M3 21h18" />
        </>
    ),
    document: (
        <>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
            <path d="M14 2v6h6M8 13h8M8 17h8" />
        </>
    ),
    wallet: (
        <>
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 9h18M16 15h.01M7 5V3h10v2" />
        </>
    ),
    calendar: (
        <>
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M16 3v4M8 3v4M3 10h18" />
        </>
    ),
    book: (
        <>
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
            <path d="M8 7h8M8 11h8" />
        </>
    ),
    check: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="m8 12 2.5 2.5L16 9" />
        </>
    ),
    chart: (
        <>
            <path d="M4 19V5M4 19h17" />
            <path d="m7 15 4-4 3 2 5-6" />
        </>
    ),
};

const toneStyles = {
    blue: 'bg-blue-50 text-brand-blue group-hover:bg-brand-blue group-hover:text-white',
    gold: 'bg-amber-50 text-amber-700 group-hover:bg-amber-500 group-hover:text-white',
    green: 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white',
};

export default function DashboardKpiStrip({ items = [] }) {
    return (
        <section
            aria-label="Ringkasan cepat"
            className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${
                items.length === 3 ? 'xl:grid-cols-3' : 'xl:grid-cols-4'
            }`}
        >
            {items.map((item) => (
                <Link
                    key={item.label}
                    href={item.href}
                    className="group flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-100"
                >
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${toneStyles[item.tone] ?? toneStyles.blue}`}>
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-5 w-5"
                            aria-hidden="true"
                        >
                            {iconGraphics[item.icon] ?? iconGraphics.document}
                        </svg>
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold text-slate-600">
                            {item.label}
                        </span>
                        <span className="mt-0.5 block truncate text-lg font-bold leading-6 text-slate-950">
                            {item.value}
                        </span>
                        <span className="mt-0.5 block truncate text-xs leading-4 text-slate-600">
                            {item.detail}
                        </span>
                    </span>
                    <span className="shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-brand-blue" aria-hidden="true">
                        →
                    </span>
                </Link>
            ))}
        </section>
    );
}
