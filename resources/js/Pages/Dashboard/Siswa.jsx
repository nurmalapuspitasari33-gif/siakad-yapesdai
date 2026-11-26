import DashboardKpiStrip from '@/Components/DashboardKpiStrip';
import DashboardWorkPanel from '@/Components/DashboardWorkPanel';
import DashboardLayout from '@/Layouts/DashboardLayout';
import roleNavigationItems from '@/Components/RoleNavigationItems';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

const numberFormatter = new Intl.NumberFormat('id-ID');
const currencyFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

function formatDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(value)) {
        return '—';
    }

    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(new Date(`${value.slice(0, 10)}T00:00:00`));
}

function formatDateTime(value) {
    const date = new Date(value);

    return value && !Number.isNaN(date.getTime())
        ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
        : '—';
}

function StatusBadge({ status }) {
    const labels = {
        pending: 'Menunggu seleksi',
        diterima: 'Diterima',
        ditolak: 'Belum diterima',
        belum_lunas: 'Belum lunas',
        lunas: 'Lunas',
        sedang_mengerjakan: 'Sedang dikerjakan',
    };
    const classes = {
        pending: 'border-amber-200 bg-amber-50 text-amber-800',
        diterima: 'border-emerald-200 bg-emerald-50 text-emerald-800',
        ditolak: 'border-rose-200 bg-rose-50 text-rose-800',
        belum_lunas: 'border-amber-200 bg-amber-50 text-amber-800',
        lunas: 'border-emerald-200 bg-emerald-50 text-emerald-800',
        sedang_mengerjakan: 'border-blue-200 bg-blue-50 text-blue-800',
    };

    return (
        <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${
            classes[status] ?? 'border-slate-200 bg-slate-50 text-slate-700'
        }`}>
            {labels[status] ?? status ?? 'Status belum tersedia'}
        </span>
    );
}

export default function SiswaDashboard({
    siswa = {},
    pendaftaran = null,
    jadwals = [],
    tagihans = [],
    ujians = [],
    ujiansAktif = [],
    hasilUjianTerakhir = null,
    nilaiRataRata = null,
    tahunAjaranAktif = null,
    attendance = {},
    tagihanSummary = {},
    hariIni = 'Hari ini',
}) {
    const [startingExamId, setStartingExamId] = useState(null);
    const statusSiswa = siswa?.status_siswa ?? 'calon_spmb';
    const isCandidate = statusSiswa === 'calon_spmb';
    const tahunAjaranLabel = [
        tahunAjaranAktif?.nama_tahun,
        tahunAjaranAktif?.semester?.toUpperCase(),
    ].filter(Boolean).join(' · ') || 'Belum ditetapkan';
    const kpis = isCandidate
        ? [
            {
                label: 'Status SPMB',
                value: pendaftaran?.status_seleksi === 'diterima'
                    ? 'Diterima'
                    : pendaftaran?.status_seleksi === 'ditolak'
                        ? 'Belum diterima'
                        : 'Menunggu',
                detail: 'Periksa perkembangan seleksi',
                icon: 'document',
                href: route('siswa.spmb.index'),
                tone: 'gold',
            },
            {
                label: 'Nomor pendaftaran',
                value: pendaftaran?.no_pendaftaran ?? 'Belum tersedia',
                detail: 'Identitas pendaftaran SPMB',
                icon: 'document',
                href: route('siswa.spmb.index'),
                tone: 'blue',
            },
            {
                label: 'Kelas',
                value: siswa?.kelas ?? 'Belum ditetapkan',
                detail: 'Terlihat setelah penempatan siswa',
                icon: 'school',
                href: route('profile.edit'),
                tone: 'green',
            },
            {
                label: 'Profil akun',
                value: 'Periksa data',
                detail: 'Email tidak wajib; NIK menjadi identitas',
                icon: 'users',
                href: route('profile.edit'),
                tone: 'blue',
            },
        ]
        : [
            {
                label: 'Pelajaran Hari Ini',
                value: numberFormatter.format(jadwals.length),
                detail: `Jadwal kelas pada hari ${hariIni}`,
                icon: 'calendar',
                href: route('siswa.jadwal.index'),
                tone: 'blue',
            },
            {
                label: 'Ujian Aktif',
                value: numberFormatter.format(ujiansAktif.length),
                detail: 'Ujian yang dapat dikerjakan atau dilanjutkan',
                icon: 'document',
                href: route('siswa.ujian.index'),
                tone: 'gold',
            },
            {
                label: 'Hasil Ujian Terbaru',
                value: hasilUjianTerakhir
                    ? Number(hasilUjianTerakhir.nilai ?? 0).toFixed(2)
                    : '—',
                detail: hasilUjianTerakhir?.judul ?? 'Belum ada hasil ujian',
                icon: 'chart',
                href: hasilUjianTerakhir
                    ? route('siswa.ujian.show', hasilUjianTerakhir.ujian_id)
                    : route('siswa.ujian.index'),
                tone: 'green',
            },
            {
                label: 'Tagihan Berjalan',
                value: numberFormatter.format(tagihanSummary.belum_lunas ?? 0),
                detail: `${currencyFormatter.format(Number(tagihanSummary.nominal_belum_lunas ?? 0))} belum lunas`,
                icon: 'wallet',
                href: route('siswa.tagihan.index'),
                tone: (tagihanSummary.belum_lunas ?? 0) > 0 ? 'gold' : 'green',
            },
        ];
    const startExam = async (ujianId) => {
        setStartingExamId(ujianId);
        const root = document.documentElement;
        const requestFullscreen = root.requestFullscreen ?? root.webkitRequestFullscreen;
        const actions = [];

        if (typeof requestFullscreen === 'function') {
            try {
                actions.push(Promise.resolve(requestFullscreen.call(root)).catch(() => undefined));
            } catch {
                actions.push(Promise.resolve());
            }
        }

        if (navigator.wakeLock?.request) {
            try {
                actions.push(navigator.wakeLock.request('screen').catch(() => undefined));
            } catch {
                actions.push(Promise.resolve());
            }
        }

        await Promise.all(actions);
        router.post(route('siswa.ujian.start', ujianId), {}, {
            onError: () => setStartingExamId(null),
            onFinish: () => setStartingExamId(null),
        });
    };

    return (
        <DashboardLayout
            title="Dasbor Siswa"
            subtitle="Jadwal, ujian, hasil belajar, dan administrasi."
            roleLabel={isCandidate ? 'Calon Siswa' : 'Siswa'}
            navigation={roleNavigationItems('siswa', 'dashboard', { isCandidate })}
        >
            <Head title="Dasbor Siswa" />

            <div className="flex flex-col gap-5">
                <section
                    aria-label="Identitas siswa"
                    className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 xl:grid-cols-4"
                >
                    {[
                        { label: 'Nama', value: siswa?.nama_lengkap ?? 'Belum tersedia' },
                        { label: 'NIK', value: siswa?.nik ?? 'Belum terdaftar' },
                        { label: 'Kelas / Rombel', value: siswa?.kelas ?? 'Belum ditetapkan' },
                        { label: 'Tahun ajaran · semester', value: tahunAjaranLabel },
                    ].map((item) => (
                        <div key={item.label} className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{item.label}</p>
                            <p className="mt-1 break-words text-sm font-bold text-slate-900">{item.value}</p>
                        </div>
                    ))}
                </section>

                <DashboardKpiStrip items={kpis} />

                <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
                    <DashboardWorkPanel
                        title={isCandidate ? 'Pendaftaran SPMB' : `Jadwal pelajaran hari ${hariIni}`}
                        description={isCandidate
                            ? 'Status pendaftaran dan langkah yang dapat dilakukan.'
                            : 'Jadwal kelas Anda dan ujian yang sedang berlangsung.'}
                        actionHref={isCandidate ? route('siswa.spmb.index') : route('siswa.jadwal.index')}
                        actionLabel={isCandidate ? 'Buka SPMB' : 'Jadwal lengkap'}
                    >
                        {isCandidate ? (
                            <div className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Nomor pendaftaran</p>
                                        <p className="mt-1 font-mono text-sm font-bold text-slate-900">
                                            {pendaftaran?.no_pendaftaran ?? 'Belum tersedia'}
                                        </p>
                                    </div>
                                    <StatusBadge status={pendaftaran?.status_seleksi ?? 'pending'} />
                                </div>
                                <p className="text-sm leading-5 text-slate-600">
                                    Lengkapi formulir dan pantau status seleksi menggunakan NIK Anda.
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-5">
                                <div>
                                    <h3 className="mb-2 text-sm font-bold text-slate-900">Jadwal hari ini</h3>
                                    {jadwals.length === 0 ? (
                                        <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
                                            Belum ada jadwal pelajaran yang tersedia.
                                        </p>
                                    ) : (
                                        <ul className="flex flex-col divide-y divide-slate-100">
                                            {jadwals.map((jadwal) => (
                                                <li key={jadwal.id} className="flex items-center justify-between gap-3 py-3 first:pt-1">
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-slate-900">{jadwal.mata_pelajaran}</p>
                                                        <p className="mt-1 text-xs text-slate-600">
                                                            {jadwal.guru ?? 'Guru belum ditetapkan'}
                                                            {jadwal.ruang ? ` · Ruang ${jadwal.ruang}` : ''}
                                                        </p>
                                                    </div>
                                                    <p className="shrink-0 text-sm font-semibold text-brand-blue">
                                                        {jadwal.jam_mulai}–{jadwal.jam_selesai}
                                                    </p>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                <div className="border-t border-slate-100 pt-4">
                                    <div className="mb-3 flex items-center justify-between gap-3">
                                        <h3 className="text-sm font-bold text-slate-900">Ujian aktif</h3>
                                        <Link href={route('siswa.ujian.index')} className="text-xs font-semibold text-brand-blue hover:underline">
                                            Semua ujian
                                        </Link>
                                    </div>
                                    {ujiansAktif.length === 0 ? (
                                        <p className="rounded-xl bg-slate-50 px-4 py-5 text-center text-sm text-slate-600">
                                            Tidak ada ujian yang sedang berlangsung.
                                        </p>
                                    ) : (
                                        <ul className="flex flex-col gap-3">
                                            {ujiansAktif.map((ujian) => (
                                                <li key={ujian.id} className="rounded-xl border border-slate-200 p-3.5">
                                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                                        <div>
                                                            <p className="text-xs font-semibold text-brand-blue">{ujian.mata_pelajaran}</p>
                                                            <p className="mt-1 font-semibold text-slate-900">{ujian.judul}</p>
                                                            <p className="mt-1 text-xs text-slate-600">
                                                                Mulai {formatDateTime(ujian.waktu_mulai)} · {ujian.durasi_menit} menit
                                                            </p>
                                                        </div>
                                                        {ujian.status_pengerjaan && <StatusBadge status={ujian.status_pengerjaan} />}
                                                    </div>
                                                    <div className="mt-3">
                                                        {ujian.dapat_dimulai || ujian.dapat_dilanjutkan ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => startExam(ujian.id)}
                                                                disabled={startingExamId !== null}
                                                                className="rounded-lg bg-brand-blue px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-navy disabled:cursor-wait disabled:opacity-60"
                                                            >
                                                                {startingExamId === ujian.id
                                                                    ? 'Menyiapkan ujian...'
                                                                    : ujian.dapat_dilanjutkan
                                                                        ? 'Lanjutkan ujian'
                                                                        : 'Mulai ujian'}
                                                            </button>
                                                        ) : (
                                                            <span className="text-xs font-semibold text-amber-800">
                                                                Soal ujian belum tersedia untuk dikerjakan.
                                                            </span>
                                                        )}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        )}
                    </DashboardWorkPanel>

                    <DashboardWorkPanel
                        title={isCandidate ? 'Profil & akun' : 'Ringkasan akademik & administrasi'}
                        description={isCandidate
                            ? 'Kelola informasi akun dan pendaftaran tanpa email wajib.'
                            : 'Pantau hasil belajar, kehadiran, dan status tagihan.'}
                    >
                        {isCandidate ? (
                            <div className="flex flex-col gap-3">
                                <p className="text-sm leading-6 text-slate-600">
                                    NIK 16 digit menjadi identitas utama akun. Jika perlu bantuan akses, hubungi admin/operator sekolah.
                                </p>
                                <Link
                                    href={route('profile.edit')}
                                    className="inline-flex w-fit items-center gap-2 rounded-lg bg-brand-blue px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-navy"
                                >
                                    Periksa profil <span aria-hidden="true">→</span>
                                </Link>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-5">
                                <section aria-label="Hasil dan kehadiran" className="rounded-xl bg-slate-50 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Hasil ujian terakhir</p>
                                            <p className="mt-1 font-semibold text-slate-900">
                                                {hasilUjianTerakhir?.judul ?? 'Belum ada hasil ujian'}
                                            </p>
                                            {hasilUjianTerakhir && (
                                                <p className="mt-1 text-sm text-slate-600">
                                                    Nilai {Number(hasilUjianTerakhir.nilai ?? 0).toFixed(2)}
                                                </p>
                                            )}
                                        </div>
                                        {hasilUjianTerakhir && (
                                            <Link
                                                href={route('siswa.ujian.show', hasilUjianTerakhir.ujian_id)}
                                                className="text-xs font-semibold text-brand-blue hover:underline"
                                            >
                                                Lihat
                                            </Link>
                                        )}
                                    </div>
                                    <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-200 pt-3">
                                        <div>
                                            <p className="text-xs text-slate-600">Rata-rata nilai</p>
                                            <p className="mt-1 text-sm font-bold text-slate-900">
                                                {nilaiRataRata === null ? '—' : Number(nilaiRataRata).toFixed(2)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-600">Kehadiran semester</p>
                                            <p className="mt-1 text-sm font-bold text-slate-900">
                                                {numberFormatter.format(Number(attendance.persentase_kehadiran ?? 0))}%
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                <section aria-label="Tagihan siswa">
                                    <div className="mb-2 flex items-center justify-between gap-3">
                                        <h3 className="text-sm font-bold text-slate-900">Tagihan terbaru</h3>
                                        <Link href={route('siswa.tagihan.index')} className="text-xs font-semibold text-brand-blue hover:underline">
                                            Riwayat tagihan
                                        </Link>
                                    </div>
                                    {tagihans.length === 0 ? (
                                        <p className="rounded-xl border border-dashed border-slate-300 px-4 py-5 text-center text-sm text-slate-600">
                                            Tidak ada tagihan untuk ditampilkan.
                                        </p>
                                    ) : (
                                        <ul className="flex flex-col divide-y divide-slate-100">
                                            {tagihans.slice(0, 3).map((tagihan) => (
                                                <li key={tagihan.id} className="flex items-center justify-between gap-3 py-2.5">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-slate-900">{tagihan.judul}</p>
                                                        <p className="mt-0.5 text-xs text-slate-600">
                                                            Jatuh tempo {formatDate(tagihan.jatuh_tempo)} · {currencyFormatter.format(Number(tagihan.nominal))}
                                                        </p>
                                                    </div>
                                                    <StatusBadge status={tagihan.status} />
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </section>

                                {pendaftaran && (
                                    <section
                                        aria-label="Status pendaftaran SPMB"
                                        className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"
                                    >
                                        <span>
                                            <span className="block text-sm font-semibold text-slate-900">Status SPMB</span>
                                            <span className="mt-0.5 block text-xs text-slate-600">
                                                {pendaftaran.no_pendaftaran}
                                            </span>
                                        </span>
                                        <span className="flex items-center gap-2">
                                            <StatusBadge status={pendaftaran.status_seleksi} />
                                            <Link
                                                href={route('siswa.spmb.index')}
                                                className="text-xs font-semibold text-brand-blue hover:underline"
                                            >
                                                Detail
                                            </Link>
                                        </span>
                                    </section>
                                )}

                                <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                                    <Link
                                        href={route('profile.edit')}
                                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-50"
                                    >
                                        Profil akun
                                    </Link>
                                    <Link
                                        href={route('profile.edit')}
                                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-50"
                                    >
                                        Ganti kata sandi
                                    </Link>
                                </div>
                            </div>
                        )}
                    </DashboardWorkPanel>
                </div>
            </div>
        </DashboardLayout>
    );
}
