import { Link } from '@inertiajs/react';

function labelFor(label) {
    return label
        .replace('&laquo; Previous', '‹ Sebelumnya')
        .replace('Next &raquo;', 'Berikutnya ›');
}

export default function AdminPagination({ links }) {
    if (!links || links.length <= 3) {
        return null;
    }

    return (
        <nav className="flex flex-wrap items-center justify-center gap-2" aria-label="Halaman daftar">
            {links.map((link, index) => {
                const label = labelFor(link.label);
                const className = `inline-flex min-h-10 items-center justify-center rounded-xl border px-3 text-sm font-medium transition ${
                    link.active
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : link.url
                          ? 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-700'
                          : 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300'
                }`;

                return link.url ? (
                    <Link
                        key={`${label}-${index}`}
                        href={link.url}
                        preserveScroll
                        aria-current={link.active ? 'page' : undefined}
                        className={className}
                    >
                        {label}
                    </Link>
                ) : (
                    <span key={`${label}-${index}`} className={className}>
                        {label}
                    </span>
                );
            })}
        </nav>
    );
}
