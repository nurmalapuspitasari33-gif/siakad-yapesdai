import DashboardKpiStrip from '@/Components/DashboardKpiStrip';
import DashboardWorkPanel from '@/Components/DashboardWorkPanel';
import DashboardLayout from '@/Layouts/DashboardLayout';
import AdminNavigationItems from '@/Components/AdminNavigationItems';
import { Head, Link } from '@inertiajs/react';

const numberFormatter = new Intl.NumberFormat('id-ID');
const currencyFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

const selectionLabels = {
    pending: 'Menunggu verifikasi',
    diterima: 'Diterima',
    ditolak: 'Ditolak',
};

const selectionTones = {
    pending: 'border-amber-200 bg-amber-50 text-amber-800',
    diterima: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    ditolak: 'border-rose-200 bg-rose-50 text-rose-800',
};

export default function AdminDashboard({
    statistics = {},
    latestPendaftarans = [],
    hariIni = 'Hari ini',
}) {
    const navigation = AdminNavigationItems('dashboard');
    const kpis = [
        {
            label: 'Siswa Aktif',
            value: numberFormatter.format(statistics.siswaAktif ?? 0),
            detail: `${numberFormatter.format(statistics.siswaTanpaKelas ?? 0)} belum masuk kelas`,
            icon: 'users',
            href: route('admin.siswa.index'),
            tone: 'blue',
        },
        {
            label: 'Guru & Wali Kelas',
            value: numberFormatter.format(statistics.guru ?? 0),
            detail: `${numberFormatter.format(statistics.waliKelas ?? 0)} bertugas sebagai wali`,
            icon: 'school',
            href: route('admin.guru.index'),
            tone: 'gold',
        },
        {
            label: 'Pendaftar SPMB',
            value: numberFormatter.format(statistics.pendaftarSpmb ?? 0),
            detail: `${numberFormatter.format(statistics.pendaftarMenunggu ?? 0)} menunggu verifikasi`,
            icon: 'document',
            href: route('admin.spmb.index'),
            tone: 'blue',
        },
        {
            label: 'Tagihan Berjalan',
            value: numberFormatter.format(statistics.tagihanBelumLunas ?? 0),
            detail: `${currencyFormatter.format(Number(statistics.nominalBelumLunas ?? 0))} belum lunas`,
            icon: 'wallet',
            href: route('admin.tagihan.index'),
            tone: 'green',
        },
    ];
    const followUps = [
        {
            label: 'Siswa aktif tanpa kelas',
            count: statistics.siswaTanpaKelas ?? 0,
            detail: 'Periksa penempatan rombel siswa.',
            status: (statistics.siswaTanpaKelas ?? 0) > 0 ? 'Perlu tindak lanjut' : 'Terkendali',
            href: route('admin.siswa.index', { kelas_id: 'tanpa_kelas' }),
            tone: 'amber',
        },
        {
            label: `Jadwal pelajaran hari ${hariIni.toLowerCase()}`,
            count: statistics.jadwalHariIni ?? 0,
            detail: 'Jadwal pada tahun ajaran aktif.',
            status: 'Hari ini',
            href: route('admin.jadwal.index', { hari: hariIni.toLowerCase() }),
            tone: 'blue',
        },
        {
            label: 'Ujian terjadwal hari ini',
            count: statistics.ujianHariIni ?? 0,
            detail: 'Pantau sesi ujian yang dimulai hari ini.',
            status: 'Hari ini',
            href: route('admin.ujian.index'),
            tone: 'blue',
        },
        {
            label: 'NIK siswa belum lengkap',
            count: statistics.siswaTanpaNIK ?? 0,
            detail: 'Identitas siswa menggunakan NIK 16 digit.',
            status: (statistics.siswaTanpaNIK ?? 0) > 0 ? 'Perlu dilengkapi' : 'Terkendali',
            href: route('admin.siswa.index'),
            tone: (statistics.siswaTanpaNIK ?? 0) > 0 ? 'amber' : 'green',
        },
    ];

    return (
        <DashboardLayout
            title="Dasbor Administrator"
            subtitle="Ringkasan operasional sekolah dan tindak lanjut akademik."
            roleLabel="Administrator"
            navigation={navigation}
        >
            <Head title="Dasbor Administrator" />

            <div className="flex flex-col gap-5">
                <DashboardKpiStrip items={kpis} />

                <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
                    <DashboardWorkPanel
                        title="Pendaftar SPMB terbaru"
                        description="Lima pendaftaran paling baru untuk ditinjau."
                        actionHref={route('admin.spmb.index')}
                        actionLabel="Semua pendaftar"
                    >
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead>
                                    <tr>
                                        <th>Nama &amp; NIK</th>
                                        <th>Pendaftaran</th>
                                        <th>Status</th>
                                        <th><span className="sr-only">Aksi</span></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {latestPendaftarans.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="py-8 text-center text-sm text-slate-500">
                                                Belum ada pendaftaran SPMB.
                                            </td>
                                        </tr>
                                    ) : latestPendaftarans.map((pendaftar) => (
                                        <tr key={pendaftar.id}>
                                            <td className="min-w-52">
                                                <p className="font-semibold text-slate-900">{pendaftar.nama}</p>
                                                <p className="mt-1 font-mono text-xs text-slate-600">
                                                    NIK {pendaftar.nik ?? 'belum lengkap'}
                                                </p>
                                            </td>
                                            <td className="min-w-36">
                                                <p className="font-mono text-xs font-semibold text-slate-800">
                                                    {pendaftar.no_pendaftaran}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-600">{pendaftar.created_at}</p>
                                            </td>
                                            <td>
                                                <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${
                                                    selectionTones[pendaftar.status] ?? 'border-slate-200 bg-slate-50 text-slate-700'
                                                }`}>
                                                    {selectionLabels[pendaftar.status] ?? pendaftar.status}
                                                </span>
                                            </td>
                                            <td>
                                                <Link
                                                    href={route('admin.spmb.index', { open: pendaftar.id })}
                                                    className="whitespace-nowrap rounded-lg px-2 py-1 text-xs font-semibold text-brand-blue transition hover:bg-blue-50"
                                                >
                                                    Tinjau
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </DashboardWorkPanel>

                    <DashboardWorkPanel
                        title="Tindak lanjut akademik"
                        description="Pemeriksaan rutin berdasarkan data sekolah."
                    >
                        <ul className="flex flex-col divide-y divide-slate-100">
                            {followUps.map((item) => (
                                <li key={item.label} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                                        item.tone === 'amber'
                                            ? 'bg-amber-50 text-amber-800'
                                            : item.tone === 'green'
                                                ? 'bg-emerald-50 text-emerald-800'
                                                : 'bg-blue-50 text-brand-blue'
                                    }`}>
                                        {numberFormatter.format(item.count)}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-sm font-semibold text-slate-900">{item.label}</span>
                                        <span className="mt-0.5 block text-xs text-slate-600">{item.detail}</span>
                                    </span>
                                    <span className="hidden shrink-0 text-xs font-semibold text-slate-600 sm:block">
                                        {item.status}
                                    </span>
                                    <Link
                                        href={item.href}
                                        aria-label={`Buka ${item.label}`}
                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-brand-blue transition hover:bg-blue-50"
                                    >
                                        <span aria-hidden="true">→</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </DashboardWorkPanel>
                </div>
            </div>
        </DashboardLayout>
    );
}
