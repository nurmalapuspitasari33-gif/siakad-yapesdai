import DashboardLayout from '@/Layouts/DashboardLayout';
import roleNavigationItems from '@/Components/RoleNavigationItems';
import { Head, Link } from '@inertiajs/react';

const percentageFormatter = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 1,
});

function formatDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return '—';
    }

    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(new Date(`${value}T00:00:00Z`));
}

const absenceStyles = {
    S: 'bg-amber-50 text-amber-700',
    I: 'bg-sky-50 text-sky-700',
    A: 'bg-rose-50 text-rose-700',
};

export default function SiswaPresensiIndex({
    siswa = {},
    tahunAjaran = null,
    ringkasan = {},
    ketidakhadiran = [],
    isCandidate = false,
}) {
    const cards = [
        {
            label: 'Persentase kehadiran',
            value: `${percentageFormatter.format(Number(ringkasan.persentase_kehadiran ?? 0))}%`,
            detail: `${ringkasan.hadir ?? 0} dari ${ringkasan.total_sesi ?? 0} sesi`,
            color: 'text-emerald-800',
        },
        { label: 'Sakit', value: ringkasan.sakit ?? 0, color: 'text-amber-700' },
        { label: 'Izin', value: ringkasan.izin ?? 0, color: 'text-sky-700' },
        { label: 'Alfa', value: ringkasan.alfa ?? 0, color: 'text-rose-700' },
    ];

    return (
        <DashboardLayout
            title="Riwayat Kehadiran"
            subtitle="Pantau persentase kehadiran dan rincian ketidakhadiran pada semester berjalan."
            roleLabel="Siswa"
            navigation={roleNavigationItems('siswa', 'presensi', { isCandidate })}
        >
            <Head title="Riwayat Kehadiran" />

            <div className="flex flex-col gap-6">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="font-bold text-slate-900">{siswa.nama_lengkap ?? 'Siswa'}</h2>
                            <p className="mt-1 text-sm text-slate-600">
                                Kelas {siswa.kelas ?? 'Belum ditetapkan'}
                            </p>
                        </div>
                        <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                            {tahunAjaran
                                ? `${tahunAjaran.nama_tahun} · Semester ${tahunAjaran.semester}`
                                : 'Tahun ajaran aktif belum ditetapkan'}
                        </span>
                    </div>
                </section>

                <section aria-label="Ringkasan kehadiran" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {cards.map((card) => (
                        <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <p className="text-sm font-medium text-slate-500">{card.label}</p>
                            <p className={`mt-2 text-3xl font-bold ${card.color}`}>{card.value}</p>
                            {card.detail && <p className="mt-1 text-xs text-slate-500">{card.detail}</p>}
                        </article>
                    ))}
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
                        <h2 className="font-bold text-slate-900">Rincian ketidakhadiran</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Menampilkan sakit, izin, dan alfa pada semester berjalan.
                        </p>
                    </div>

                    {ketidakhadiran.length === 0 ? (
                        <div className="px-5 py-12 text-center">
                            <p className="font-semibold text-slate-800">Belum ada ketidakhadiran</p>
                            <p className="mt-1 text-sm text-slate-500">
                                Rincian presensi akan muncul setelah guru mengisi presensi kelas.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {ketidakhadiran.map((item) => (
                                <article key={item.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                                    <div>
                                        <p className="font-semibold text-slate-900">
                                            {item.mata_pelajaran ?? 'Mata pelajaran tidak tersedia'}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500">{formatDate(item.tanggal)}</p>
                                    </div>
                                    <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${absenceStyles[item.status] ?? 'bg-slate-100 text-slate-600'}`}>
                                        {item.status_label}
                                    </span>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                <Link href={route('siswa.dashboard')} className="text-sm font-semibold text-emerald-800 hover:text-emerald-950">
                    ← Kembali ke Dasbor
                </Link>
            </div>
        </DashboardLayout>
    );
}
