import DashboardLayout from '@/Layouts/DashboardLayout';
import ScheduleWeekGrid from '@/Components/ScheduleWeekGrid';
import roleNavigationItems from '@/Components/RoleNavigationItems';
import { Head } from '@inertiajs/react';

export default function SiswaJadwalIndex({ jadwals = [], tahunAjaranAktif = null, isCandidate = false }) {
    const activeDays = new Set(jadwals.map((jadwal) => jadwal.hari)).size;

    return (
        <DashboardLayout
            title="Jadwal Pelajaran"
            subtitle="Jadwal kelas Anda pada tahun ajaran aktif."
            roleLabel="Siswa"
            navigation={roleNavigationItems('siswa', 'jadwal', { isCandidate })}
        >
            <Head title="Jadwal Pelajaran" />
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-50 via-white to-sky-50 px-5 py-5 sm:px-7">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Agenda kelas</p>
                            <h2 className="mt-1 text-lg font-bold text-slate-900">Jadwal pelajaran</h2>
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
                    emptyMessage="Jadwal pelajaran kelas Anda akan tampil setelah disusun oleh administrator."
                />
            </section>
        </DashboardLayout>
    );
}
