import { usePage } from '@inertiajs/react';

export default function DashboardWelcomeBanner({
    name,
    role,
    context,
}) {
    const { auth = {}, tahunAjaranAktif = null, semesterAktif = null } = usePage().props;
    const activeYear = typeof tahunAjaranAktif === 'string'
        ? tahunAjaranAktif
        : tahunAjaranAktif?.nama_tahun ?? 'Belum tersedia';
    const activeSemester = semesterAktif
        ?? (typeof tahunAjaranAktif === 'object' ? tahunAjaranAktif?.semester : null)
        ?? 'Belum tersedia';

    return (
        <section className="relative isolate mb-6 flex flex-col justify-between gap-4 overflow-hidden rounded-3xl bg-gradient-to-r from-brand-navy via-brand-blue to-brand-navy p-5 text-white shadow-lg shadow-brand-navy/20 sm:flex-row sm:items-center sm:px-7 sm:py-5">
            <span className="pointer-events-none absolute -right-10 -top-24 -z-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
            <div>
                <p className="text-sm font-medium text-brand-gold">Selamat datang</p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight">
                    {name ?? auth?.user?.name ?? 'Pengguna'}
                </h2>
                <p className="mt-1 text-sm text-white/85">
                    {role}{context ? ` · ${context}` : ''}
                </p>
            </div>
            <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium text-white backdrop-blur-md">
                    <span className="text-white/75">Tahun Ajaran</span>
                    <span className="font-bold">{activeYear}</span>
                </span>
                <span className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium text-white backdrop-blur-md">
                    <span className="text-white/75">Semester</span>
                    <span className="font-bold capitalize">{activeSemester}</span>
                </span>
            </div>
        </section>
    );
}
