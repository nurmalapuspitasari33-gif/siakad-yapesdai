import { Link } from '@inertiajs/react';

export default function DashboardWorkPanel({
    title,
    description,
    actionHref,
    actionLabel,
    children,
}) {
    return (
        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
                <div className="min-w-0">
                    <h2 className="text-base font-bold text-brand-navy">{title}</h2>
                    {description && (
                        <p className="mt-1 text-sm leading-5 text-slate-600">{description}</p>
                    )}
                </div>
                {actionHref && actionLabel && (
                    <Link
                        href={actionHref}
                        className="shrink-0 rounded-lg px-2 py-1 text-sm font-semibold text-brand-blue transition hover:bg-blue-50"
                    >
                        {actionLabel} <span aria-hidden="true">→</span>
                    </Link>
                )}
            </header>
            <div className="p-4 sm:p-5">{children}</div>
        </section>
    );
}

