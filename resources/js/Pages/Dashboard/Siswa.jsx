import DashboardLayout from '@/Layouts/DashboardLayout';
import DashboardWelcomeBanner from '@/Components/DashboardWelcomeBanner';
import roleNavigationItems from '@/Components/RoleNavigationItems';
import StatisticCard from '@/Components/StatisticCard';
import { Head, Link } from '@inertiajs/react';

const numberFormatter = new Intl.NumberFormat('id-ID');

const dayLabels = {
    senin: 'Senin',
    selasa: 'Selasa',
    rabu: 'Rabu',
    kamis: 'Kamis',
    jumat: 'Jumat',
    sabtu: 'Sabtu',
    minggu: 'Minggu',
};

const currencyFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

function formatDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.slice(0, 10))) {
        return '—';
    }

    const date = new Date(`${value.slice(0, 10)}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(date);
}

function formatDateTime(value) {
    const date = new Date(value);

    if (!value || Number.isNaN(date.getTime())) {
        return '—';
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
}

function StatusBadge({ status }) {
    const labels = {
        pending: 'Menunggu seleksi',
        diterima: 'Diterima',
        ditolak: 'Belum diterima',
        belum_lunas: 'Belum lunas',
        lunas: 'Lunas',
    };
    const styles = {
        pending: 'bg-amber-50 text-amber-700 ring-amber-200',
        diterima: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
        ditolak: 'bg-rose-50 text-rose-700 ring-rose-200',
        belum_lunas: 'bg-amber-50 text-amber-700 ring-amber-200',
        lunas: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    };

    return (
        <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
                styles[status] ?? 'bg-slate-100 text-slate-600 ring-slate-200'
            }`}
        >
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
}) {
    const statusSiswa = siswa?.status_siswa ?? 'calon_spmb';
    const isCandidate = statusSiswa === 'calon_spmb';
    const selectionLabels = {
        pending: 'Menunggu seleksi',
        diterima: 'Diterima',
        ditolak: 'Belum diterima',
    };
    const selectionStatus = pendaftaran?.status_seleksi;
    const statisticCards = isCandidate
        ? [
              {
                  label: 'Status akun',
                  value: 'Calon Siswa',
                  detail: 'Akun penerimaan siswa baru',
                  icon: 'users',
                  tone: 'indigo',
              },
              {
                  label: 'Nomor pendaftaran',
                  value: pendaftaran?.no_pendaftaran ?? 'Belum tersedia',
                  detail: 'Nomor registrasi SPMB Anda',
                  icon: 'document',
                  tone: 'sky',
              },
              {
                  label: 'Status seleksi',
                  value: selectionLabels[selectionStatus] ?? 'Belum ada status',
                  detail: 'Pantau perkembangan pendaftaran',
                  icon: 'check',
                  tone: selectionStatus === 'diterima'
                      ? 'emerald'
                      : selectionStatus === 'ditolak'
                          ? 'amber'
                          : 'sky',
              },
          ]
        : [
              {
                  label: 'Status siswa',
                  value: statusSiswa === 'aktif' ? 'Aktif' : statusSiswa,
                  detail: statusSiswa === 'aktif' ? 'Terdaftar sebagai siswa aktif' : 'Status akun siswa',
                  icon: 'check',
                  tone: statusSiswa === 'aktif' ? 'emerald' : 'indigo',
              },
              {
                  label: 'Kelas',
                  value: siswa?.kelas ?? 'Belum ditetapkan',
                  detail: 'Penempatan kelas saat ini',
                  icon: 'school',
                  tone: 'sky',
              },
              {
                  label: 'Jadwal pelajaran',
                  value: numberFormatter.format(jadwals.length),
                  detail: 'Jadwal pada tahun ajaran aktif',
                  icon: 'calendar',
                  tone: 'indigo',
              },
              {
                  label: 'Ujian aktif',
                  value: numberFormatter.format(ujians.length),
                  detail: 'Ujian yang tersedia untuk kelas Anda',
                  icon: 'document',
                  tone: 'amber',
              },
          ];

    return (
        <DashboardLayout
            title={`Halo, ${siswa?.nama_lengkap ?? 'Siswa'}`}
            subtitle={
                isCandidate
                    ? 'Pantau perkembangan proses pendaftaran SPMB Anda.'
                    : `Informasi akademik ${siswa?.kelas ? `kelas ${siswa.kelas}` : 'Anda'} dalam satu dasbor.`
            }
            roleLabel={isCandidate ? 'Calon Siswa' : 'Siswa'}
            navigation={roleNavigationItems('siswa', 'dashboard', { isCandidate })}
        >
            <Head title="Dasbor Siswa" />

            <DashboardWelcomeBanner
                name={siswa?.nama_lengkap}
                role={isCandidate ? 'Calon Siswa' : 'Siswa'}
                context={siswa?.kelas ? `Kelas ${siswa.kelas}` : null}
            />

            <section
                aria-label="Ringkasan siswa"
                className={`mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 ${
                    isCandidate ? 'xl:grid-cols-3' : 'xl:grid-cols-4'
                }`}
            >
                {statisticCards.map((card) => (
                    <StatisticCard key={card.label} {...card} />
                ))}
            </section>

            {isCandidate ? (
                <section
                    id="status-spmb"
                    className="scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                    <div className="bg-gradient-to-r from-indigo-700 to-violet-700 px-6 py-7 text-white sm:px-8">
                        <p className="text-sm font-semibold text-indigo-200">Penerimaan siswa baru</p>
                        <h2 className="mt-2 text-xl font-bold sm:text-2xl">Status seleksi SPMB</h2>
                        <p className="mt-2 max-w-xl text-sm leading-6 text-indigo-100">
                            Informasi pendaftaran Anda ditampilkan di bawah ini. Periksa kembali secara berkala untuk pembaruan.
                        </p>
                    </div>
                    <div className="p-6 sm:p-8">
                        {pendaftaran ? (
                            <div className="flex flex-col justify-between gap-5 rounded-xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Nomor pendaftaran
                                    </p>
                                    <p className="mt-1 text-lg font-bold text-slate-900">
                                        {pendaftaran.no_pendaftaran}
                                    </p>
                                </div>
                                <StatusBadge status={pendaftaran.status_seleksi} />
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-slate-300 px-5 py-8 text-center">
                                <p className="font-semibold text-slate-800">
                                    Data pendaftaran belum tersedia
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                    Hubungi panitia SPMB untuk melengkapi informasi pendaftaran Anda.
                                </p>
                            </div>
                        )}
                        <div className="mt-5">
                            <Link
                                href={route('siswa.spmb.index')}
                                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                            >
                                Lengkapi formulir SPMB <span aria-hidden="true">→</span>
                            </Link>
                        </div>
                    </div>
                </section>
            ) : statusSiswa === 'aktif' ? (
                <div className="flex flex-col gap-6">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-4">
                        <div>
                            <p className="text-sm font-semibold text-indigo-900">Status siswa aktif</p>
                            <p className="mt-1 text-sm text-indigo-700">
                                {siswa.kelas ? `Kelas ${siswa.kelas}` : 'Kelas belum ditetapkan'}
                            </p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-700 shadow-sm">
                            Tahun ajaran aktif
                        </span>
                    </div>

                    <section
                        id="jadwal-pelajaran"
                        className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
                    >
                        <div className="mb-5">
                            <h2 className="text-lg font-bold text-slate-900">Jadwal pelajaran</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Jadwal untuk kelas Anda pada tahun ajaran aktif.
                            </p>
                        </div>
                        <div className="mb-4">
                            <Link
                                href={route('siswa.jadwal.index')}
                                className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 transition hover:text-indigo-900"
                            >
                                Buka tampilan jadwal <span aria-hidden="true">→</span>
                            </Link>
                        </div>
                        {jadwals.length === 0 ? (
                            <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                                Belum ada jadwal pelajaran yang tersedia.
                            </p>
                        ) : (
                            <div className="flex flex-col divide-y divide-slate-100">
                                {jadwals.map((jadwal) => (
                                    <div
                                        key={jadwal.id}
                                        className="flex flex-col justify-between gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                                    >
                                        <div>
                                            <p className="font-semibold text-slate-900">
                                                {jadwal.mata_pelajaran}
                                            </p>
                                            <p className="mt-1 text-sm text-slate-500">
                                                {dayLabels[jadwal.hari] ?? jadwal.hari ?? '—'} · {jadwal.guru ?? '—'}
                                            </p>
                                        </div>
                                        <p className="text-sm font-semibold text-indigo-700">
                                            {jadwal.jam_mulai} – {jadwal.jam_selesai}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                        <section
                            id="tagihan-spp"
                            className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
                        >
                            <div className="mb-5">
                                <h2 className="text-lg font-bold text-slate-900">Tagihan SPP</h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Status pembayaran tagihan Anda.
                                </p>
                            </div>
                            {tagihans.length === 0 ? (
                                <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                                    Tidak ada tagihan untuk ditampilkan.
                                </p>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {tagihans.map((tagihan) => (
                                        <article
                                            key={tagihan.id}
                                            className="rounded-xl border border-slate-200 p-4"
                                        >
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div>
                                                    <p className="font-semibold text-slate-900">
                                                        {tagihan.judul}
                                                    </p>
                                                    <p className="mt-1 text-sm text-slate-500">
                                                        Jatuh tempo {formatDate(tagihan.jatuh_tempo)}
                                                    </p>
                                                </div>
                                                <StatusBadge status={tagihan.status} />
                                            </div>
                                            <p className="mt-4 text-base font-bold text-slate-900">
                                                {currencyFormatter.format(Number(tagihan.nominal))}
                                            </p>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section
                            id="ujian-aktif"
                            className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
                        >
                            <div className="mb-5">
                                <h2 className="text-lg font-bold text-slate-900">Ujian aktif</h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Ujian yang belum berakhir untuk kelas Anda.
                                </p>
                            </div>
                            {ujians.length === 0 ? (
                                <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                                    Belum ada ujian aktif yang dijadwalkan.
                                </p>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {ujians.map((ujian) => (
                                        <article
                                            key={ujian.id}
                                            className="rounded-xl border border-slate-200 p-4"
                                        >
                                            <p className="font-semibold text-slate-900">{ujian.judul}</p>
                                            <p className="mt-1 text-sm text-slate-500">
                                                {ujian.mata_pelajaran ?? 'Mata Pelajaran belum tersedia'} · {formatDateTime(ujian.waktu_mulai)}
                                            </p>
                                            <p className="mt-3 text-xs font-semibold text-indigo-700">
                                                Durasi {ujian.durasi_menit} menit
                                            </p>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            ) : (
                <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <p className="font-semibold text-slate-900">Informasi akademik</p>
                    <p className="mt-2 text-sm text-slate-500">
                        Status siswa Anda saat ini: {statusSiswa}.
                    </p>
                </section>
            )}
        </DashboardLayout>
    );
}
