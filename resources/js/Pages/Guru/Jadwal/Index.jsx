import DashboardLayout from '@/Layouts/DashboardLayout';
import ScheduleTable from '@/Components/ScheduleTable';
import roleNavigationItems from '@/Components/RoleNavigationItems';
import { Head } from '@inertiajs/react';

export default function GuruJadwalIndex({ jadwals = [], tahunAjaranAktif = null, isWaliKelas = false }) {
    return (
        <DashboardLayout
            title="Jadwal Mengajar"
            subtitle="Jadwal mata pelajaran dan kelas yang Anda ampu."
            roleLabel="Guru"
            navigation={roleNavigationItems('guru', 'jadwal', { isWaliKelas })}
        >
            <Head title="Jadwal Mengajar" />
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="font-bold text-slate-900">Jadwal pada tahun ajaran aktif</h2>
                        <p className="mt-1 text-sm text-slate-500">{tahunAjaranAktif ?? 'Belum ada tahun ajaran aktif'}</p>
                    </div>
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                        {jadwals.length} jadwal
                    </span>
                </div>
                <ScheduleTable
                    jadwals={jadwals}
                    showClass
                    emptyMessage="Jadwal mengajar Anda akan tampil setelah ditetapkan oleh administrator."
                />
            </section>
        </DashboardLayout>
    );
}
