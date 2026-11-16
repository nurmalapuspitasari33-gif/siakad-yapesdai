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
        <section className="mb-6 flex flex-col justify-between gap-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-700 p-6 text-white shadow-sm sm:flex-row sm:items-center">
            <div>
                <p className="text-sm font-medium text-indigo-100">Selamat datang</p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                    {name ?? auth?.user?.name ?? 'Pengguna'}
                </h2>
                <p className="mt-2 text-sm text-blue-100">
                    {role}{context ? ` · ${context}` : ''}
                </p>
            </div>
            <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-medium text-white">
                    <span className="text-blue-200">Tahun Ajaran</span>
                    <span className="font-bold">{activeYear}</span>
                </span>
                <span className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-medium text-white">
                    <span className="text-blue-200">Semester</span>
                    <span className="font-bold capitalize">{activeSemester}</span>
                </span>
            </div>
        </section>
    );
}
