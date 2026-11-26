import { usePage } from '@inertiajs/react';
import formatDashboardUserName from '@/Components/formatDashboardUserName';

export default function DashboardWelcomeBanner({
    name,
    context,
}) {
    const { auth = {} } = usePage().props;
    const displayName = name ?? formatDashboardUserName(auth?.user);

    return (
        <section className="relative isolate mb-6 flex items-center justify-between gap-4 overflow-hidden rounded-2xl bg-gradient-to-r from-brand-navy via-brand-blue to-brand-navy p-4 text-white shadow-md shadow-brand-navy/15 sm:px-6">
            <span className="pointer-events-none absolute -right-10 -top-24 -z-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
            <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-gold">Selamat datang</p>
                <h2 className="mt-1 truncate font-display text-lg font-bold tracking-tight sm:text-xl">
                    {displayName}
                </h2>
                {context && (
                    <p className="mt-1 truncate text-sm text-white/85">{context}</p>
                )}
            </div>
            <span className="hidden h-2.5 w-2.5 shrink-0 rounded-full bg-brand-gold sm:block" aria-hidden="true" />
        </section>
    );
}
