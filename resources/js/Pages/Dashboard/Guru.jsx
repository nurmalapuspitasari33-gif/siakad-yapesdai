import DashboardKpiStrip from '@/Components/DashboardKpiStrip';
import DashboardWorkPanel from '@/Components/DashboardWorkPanel';
import DashboardLayout from '@/Layouts/DashboardLayout';
import roleNavigationItems from '@/Components/RoleNavigationItems';
import { Head, Link } from '@inertiajs/react';

const numberFormatter = new Intl.NumberFormat('id-ID');

export default function GuruDashboard({
    guru = {},
    jadwals = [],
    jadwalHariIni = [],
    hariIni = 'hari ini',
    ujiansAktif = 0,
    bankSoalAktif = 0,
    kelasWalian = [],
}) {
    const isWaliKelas = Boolean(guru?.is_wali_kelas);
    const navigation = roleNavigationItems('guru', 'dashboard', {
        isWaliKelas,
        waliKelasName: guru?.wali_kelas_nama_kelas ?? '',
    });
    const mataPelajaranCount = new Set(
        jadwals.map((jadwal) => jadwal.mapel_id ?? jadwal.mata_pelajaran).filter(Boolean),
    ).size;
    const kelasCount = new Set(
        jadwals.map((jadwal) => jadwal.kelas_id ?? jadwal.kelas).filter(Boolean),
    ).size;
    const jumlahSiswaWalian = Number(guru?.jumlah_siswa_walian ?? 0);
    const kpis = [
        {
            label: 'Kelas & Mapel Diampu',
            value: `${numberFormatter.format(kelasCount)} / ${numberFormatter.format(mataPelajaranCount)}`,
            detail: 'Jumlah kelas / mata pelajaran',
            icon: 'school',
            href: route('guru.jadwal.index'),
            tone: 'blue',
        },
        {
            label: 'Jadwal Mengajar Hari Ini',
            value: numberFormatter.format(jadwalHariIni.length),
            detail: `Jadwal hari ${hariIni}`,
            icon: 'calendar',
            href: route('guru.jadwal.index'),
            tone: 'gold',
        },
        {
            label: 'Ujian & Bank Soal',
            value: numberFormatter.format(ujiansAktif),
            detail: `${numberFormatter.format(bankSoalAktif)} soal pada ujian aktif`,
            icon: 'document',
            href: route('guru.ujian.index'),
            tone: 'blue',
        },
        ...(isWaliKelas ? [{
            label: 'Siswa Perwalian',
            value: numberFormatter.format(jumlahSiswaWalian),
            detail: `${numberFormatter.format(kelasWalian.length)} kelas wali aktif`,
            icon: 'users',
            href: route('guru.rapor-wali.index'),
            tone: 'green',
        }] : []),
    ];

    return (
        <DashboardLayout
            title="Dasbor Guru"
            subtitle="Jadwal mengajar, aktivitas penilaian, dan tugas perwalian."
            roleLabel={isWaliKelas ? 'Guru · Wali Kelas' : 'Guru'}
            navigation={navigation}
        >
            <Head title="Dasbor Guru" />

            <div className="flex flex-col gap-5">
                <DashboardKpiStrip items={kpis} />

                <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
                    <DashboardWorkPanel
                        title={`Jadwal mengajar hari ${hariIni}`}
                        description="Jadwal tahun ajaran aktif sesuai akun Anda."
                        actionHref={route('guru.jadwal.index')}
                        actionLabel="Jadwal lengkap"
                    >
                        {jadwalHariIni.length === 0 ? (
                            <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
                                Tidak ada jadwal mengajar hari ini.
                            </p>
                        ) : (
                            <ul className="flex flex-col divide-y divide-slate-100">
                                {jadwalHariIni.map((jadwal) => (
                                    <li key={jadwal.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-slate-900">
                                                {jadwal.jam_mulai}–{jadwal.jam_selesai} · {jadwal.mata_pelajaran}
                                            </p>
                                            <p className="mt-1 text-sm text-slate-600">
                                                {jadwal.kelas ? `Kelas ${jadwal.kelas}` : 'Kelas belum ditentukan'}
                                                {' · '}
                                                {jadwal.ruang ? `Ruang ${jadwal.ruang}` : 'Ruang belum ditentukan'}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 flex-wrap gap-2">
                                            <Link
                                                href={route('guru.nilai.index')}
                                                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-brand-blue transition hover:bg-blue-50"
                                            >
                                                Input Nilai
                                            </Link>
                                            <Link
                                                href={route('guru.jadwal.index', { jadwal_id: jadwal.id })}
                                                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-brand-blue transition hover:bg-blue-50"
                                            >
                                                Absensi
                                            </Link>
                                            <Link
                                                href={route('guru.ujian.index')}
                                                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-brand-blue transition hover:bg-blue-50"
                                            >
                                                Ujian
                                            </Link>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </DashboardWorkPanel>

                    <DashboardWorkPanel
                        title="Tugas akademik & perwalian"
                        description="Akses langsung ke pekerjaan yang perlu diselesaikan."
                    >
                        <div className="flex flex-col gap-2">
                            <Link
                                href={route('guru.nilai.index')}
                                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-3 transition hover:border-blue-200 hover:bg-blue-50/60"
                            >
                                <span>
                                    <span className="block text-sm font-semibold text-slate-900">Input Nilai</span>
                                    <span className="mt-0.5 block text-xs text-slate-600">Perbarui nilai siswa pada kelas dan mapel yang diampu.</span>
                                </span>
                                <span className="text-brand-blue" aria-hidden="true">→</span>
                            </Link>
                            <Link
                                href={route('guru.hasil-ujian.index')}
                                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-3 transition hover:border-blue-200 hover:bg-blue-50/60"
                            >
                                <span>
                                    <span className="block text-sm font-semibold text-slate-900">Monitoring &amp; Hasil Ujian</span>
                                    <span className="mt-0.5 block text-xs text-slate-600">Tinjau pengerjaan dan tindak lanjut penilaian.</span>
                                </span>
                                <span className="text-brand-blue" aria-hidden="true">→</span>
                            </Link>
                            <Link
                                href={route('guru.ujian.index')}
                                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-3 transition hover:border-blue-200 hover:bg-blue-50/60"
                            >
                                <span>
                                    <span className="block text-sm font-semibold text-slate-900">Ujian &amp; Bank Soal</span>
                                    <span className="mt-0.5 block text-xs text-slate-600">
                                        {numberFormatter.format(ujiansAktif)} ujian aktif · {numberFormatter.format(bankSoalAktif)} soal.
                                    </span>
                                </span>
                                <span className="text-brand-blue" aria-hidden="true">→</span>
                            </Link>

                            {isWaliKelas && (
                                <div className="mt-2 border-t border-slate-100 pt-4">
                                    <div className="mb-3 flex items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900">Rapor kelas wali</h3>
                                            <p className="mt-0.5 text-xs text-slate-600">
                                                {numberFormatter.format(jumlahSiswaWalian)} siswa perwalian.
                                            </p>
                                        </div>
                                        <Link
                                            href={route('guru.rapor-wali.index')}
                                            className="shrink-0 rounded-lg bg-brand-blue px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-navy"
                                        >
                                            Buka rapor
                                        </Link>
                                    </div>
                                    <ul className="flex flex-col gap-2">
                                        {kelasWalian.map((kelas) => (
                                            <li key={kelas.nama_kelas} className="rounded-xl bg-slate-50 px-3 py-2.5">
                                                <div className="flex items-center justify-between gap-3">
                                                    <span className="text-sm font-semibold text-slate-800">{kelas.nama_kelas}</span>
                                                    <span className="text-xs text-slate-600">{kelas.jumlah_siswa} siswa</span>
                                                </div>
                                                <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                                                    <span className="text-slate-600">Catatan rapor terisi</span>
                                                    <span className="font-semibold text-slate-800">
                                                        {kelas.jumlah_catatan_rapor}/{kelas.jumlah_siswa}
                                                    </span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </DashboardWorkPanel>
                </div>
            </div>
        </DashboardLayout>
    );
}
