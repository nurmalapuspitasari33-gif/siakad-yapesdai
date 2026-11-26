import DashboardLayout from '@/Layouts/DashboardLayout';
import ScheduleWeekGrid from '@/Components/ScheduleWeekGrid';
import roleNavigationItems from '@/Components/RoleNavigationItems';
import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const attendanceStatuses = [
    { value: 'H', label: 'Hadir' },
    { value: 'S', label: 'Sakit' },
    { value: 'I', label: 'Izin' },
    { value: 'A', label: 'Alfa' },
];

function localDateString() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

export default function GuruJadwalIndex({
    jadwals = [],
    openJadwalId = null,
    tahunAjaranAktif = null,
    isWaliKelas = false,
    waliKelasName = '',
}) {
    const [selectedJadwal, setSelectedJadwal] = useState(
        () => jadwals.find((jadwal) => Number(jadwal.id) === Number(openJadwalId)) ?? null,
    );
    const [tanggal, setTanggal] = useState(localDateString);
    const [materiJurnal, setMateriJurnal] = useState('');
    const [presensi, setPresensi] = useState({});
    const [loadingAttendance, setLoadingAttendance] = useState(false);
    const [savingAttendance, setSavingAttendance] = useState(false);
    const [attendanceError, setAttendanceError] = useState('');
    const activeDays = new Set(jadwals.map((jadwal) => jadwal.hari)).size;

    useEffect(() => {
        if (!selectedJadwal || !tanggal) {
            return undefined;
        }

        let isCurrentRequest = true;
        setLoadingAttendance(true);
        setAttendanceError('');

        fetch(`${route('guru.presensi.show', selectedJadwal.id)}?tanggal=${encodeURIComponent(tanggal)}`, {
            headers: { Accept: 'application/json' },
        })
            .then(async (response) => {
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message ?? 'Presensi pada tanggal tersebut gagal dimuat.');
                }

                return data;
            })
            .then((data) => {
                if (!isCurrentRequest) {
                    return;
                }

                setPresensi(Object.fromEntries(
                    selectedJadwal.siswas.map((siswa) => [
                        siswa.id,
                        data.presensi?.[siswa.id] ?? 'H',
                    ]),
                ));
                setMateriJurnal(data.materi_jurnal ?? '');
            })
            .catch((error) => {
                if (isCurrentRequest) {
                    setAttendanceError(error.message);
                }
            })
            .finally(() => {
                if (isCurrentRequest) {
                    setLoadingAttendance(false);
                }
            });

        return () => {
            isCurrentRequest = false;
        };
    }, [selectedJadwal, tanggal]);

    const saveAttendance = (event) => {
        event.preventDefault();

        if (!selectedJadwal) {
            return;
        }

        setSavingAttendance(true);
        router.post(route('guru.presensi.store', selectedJadwal.id), {
            tanggal,
            materi_jurnal: materiJurnal,
            presensi: selectedJadwal.siswas.map((siswa) => ({
                siswa_id: siswa.id,
                status: presensi[siswa.id] ?? 'H',
            })),
        }, {
            preserveScroll: true,
            onSuccess: () => setSelectedJadwal(null),
            onError: (errors) => setAttendanceError(errors.presensi ?? errors.tanggal ?? 'Presensi gagal disimpan.'),
            onFinish: () => setSavingAttendance(false),
        });
    };

    return (
        <DashboardLayout
            title="Jadwal Mengajar"
            subtitle="Jadwal mata pelajaran dan kelas yang Anda ampu."
            roleLabel="Guru"
            navigation={roleNavigationItems('guru', 'jadwal', { isWaliKelas, waliKelasName })}
        >
            <Head title="Jadwal Mengajar" />
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-50 via-white to-sky-50 px-5 py-5 sm:px-7">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Agenda mengajar</p>
                            <h2 className="mt-1 text-lg font-bold text-slate-900">Jadwal pada tahun ajaran aktif</h2>
                            <p className="mt-1 text-sm text-slate-500">{tahunAjaranAktif ?? 'Belum ada tahun ajaran aktif'}</p>
                        </div>
                        <div className="flex gap-2">
                            <div className="rounded-2xl border border-white bg-white/80 px-4 py-2 text-center shadow-sm">
                                <p className="text-lg font-bold text-slate-900">{jadwals.length}</p>
                                <p className="text-[11px] font-medium text-slate-500">Jadwal</p>
                            </div>
                            <div className="rounded-2xl border border-white bg-white/80 px-4 py-2 text-center shadow-sm">
                                <p className="text-lg font-bold text-slate-900">{activeDays}</p>
                                <p className="text-[11px] font-medium text-slate-500">Hari aktif</p>
                            </div>
                        </div>
                    </div>
                </div>

                <ScheduleWeekGrid
                    jadwals={jadwals}
                    renderActions={(jadwal) => (
                        <button
                            type="button"
                            onClick={() => {
                                setTanggal(localDateString());
                                setSelectedJadwal(jadwal);
                            }}
                            disabled={jadwal.siswas.length === 0}
                            className="mt-3 w-full rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Isi Presensi &amp; Jurnal
                        </button>
                    )}
                    emptyMessage="Jadwal mengajar Anda akan tampil setelah ditetapkan oleh administrator."
                />
            </section>
            {selectedJadwal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="presensi-modal-title"
                        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
                    >
                        <div className="mb-5 flex items-start justify-between gap-4">
                            <div>
                                <h2 id="presensi-modal-title" className="text-lg font-bold text-slate-900">
                                    Presensi &amp; Jurnal
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    {selectedJadwal.kelas} · {selectedJadwal.mata_pelajaran}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedJadwal(null)}
                                className="rounded-lg px-3 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100"
                            >
                                Tutup
                            </button>
                        </div>
                        <form onSubmit={saveAttendance} className="flex flex-col gap-5">
                            <label className="block text-sm font-semibold text-slate-700">
                                Tanggal pertemuan
                                <input
                                    type="date"
                                    required
                                    value={tanggal}
                                    onChange={(event) => setTanggal(event.target.value)}
                                    className="mt-2 block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:max-w-xs"
                                />
                            </label>
                            <label className="block text-sm font-semibold text-slate-700">
                                Materi / jurnal pembelajaran
                                <textarea
                                    rows="3"
                                    maxLength="10000"
                                    value={materiJurnal}
                                    onChange={(event) => setMateriJurnal(event.target.value)}
                                    className="mt-2 block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </label>
                            {attendanceError && (
                                <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                                    {attendanceError}
                                </p>
                            )}
                            <div className="overflow-x-auto rounded-xl border border-slate-200">
                                <table className="min-w-full divide-y divide-slate-100 text-left">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Siswa</th>
                                            <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {selectedJadwal.siswas.map((siswa) => (
                                            <tr key={siswa.id}>
                                                <td className="px-4 py-3">
                                                    <p className="text-sm font-semibold text-slate-800">{siswa.nama_lengkap}</p>
                                                    <p className="text-xs text-slate-500">{siswa.nisn || '—'}</p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-2">
                                                        {attendanceStatuses.map((status) => (
                                                            <button
                                                                key={status.value}
                                                                type="button"
                                                                aria-pressed={(presensi[siswa.id] ?? 'H') === status.value}
                                                                onClick={() => setPresensi((current) => ({
                                                                    ...current,
                                                                    [siswa.id]: status.value,
                                                                }))}
                                                                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                                                                    (presensi[siswa.id] ?? 'H') === status.value
                                                                        ? 'bg-indigo-700 text-white'
                                                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                                }`}
                                                            >
                                                                {status.value}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setSelectedJadwal(null)}
                                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={loadingAttendance || savingAttendance || selectedJadwal.siswas.length === 0}
                                    className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {savingAttendance ? 'Menyimpan...' : 'Simpan Presensi'}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
        </DashboardLayout>
    );
}
