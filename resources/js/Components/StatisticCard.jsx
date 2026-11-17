const iconGraphics = {
    users: (
        <>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </>
    ),
    book: (
        <>
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
            <path d="M8 7h8M8 11h8" />
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
            <path d="M3 9h18M16 15h.01" />
            <path d="M7 5V3h10v2" />
        </>
    ),
    calendar: (
        <>
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M16 3v4M8 3v4M3 11h18M8 15h2M14 15h2" />
        </>
    ),
    school: (
        <>
            <path d="m3 10 9-7 9 7" />
            <path d="M5 9v12h14V9M9 21v-7h6v7M3 21h18" />
        </>
    ),
    check: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="m8 12 2.5 2.5L16 9" />
        </>
    ),
};

const toneStyles = {
    indigo: 'bg-emerald-50 text-emerald-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-600',
    sky: 'bg-emerald-50 text-emerald-700',
};

const accentTones = {
    'bg-indigo-500': 'emerald',
    'bg-emerald-500': 'emerald',
    'bg-amber-500': 'amber',
    'bg-sky-500': 'emerald',
};

export default function StatisticCard({ label, value, detail, icon = 'document', tone, accent }) {
    const cardTone = tone ?? accentTones[accent] ?? 'emerald';

    return (
        <article className="rounded-3xl border border-white/80 bg-white/80 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5 backdrop-blur-xl transition-all duration-150 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-2xl p-2.5 ${toneStyles[cardTone] ?? toneStyles.emerald}`}>
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
                        {iconGraphics[icon] ?? iconGraphics.document}
                    </svg>
                </span>
                <span className={`mt-1 h-2 w-2 rounded-full ${accent ?? 'bg-slate-200'}`} aria-hidden="true" />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-600">{label}</p>
            <p className="mt-1 break-words text-2xl font-bold tracking-tight text-slate-950">
                {value}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
        </article>
    );
}
