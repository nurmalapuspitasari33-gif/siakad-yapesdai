import DashboardLayout from '@/Layouts/DashboardLayout';
import ScheduleTable from '@/Components/ScheduleTable';
import roleNavigationItems from '@/Components/RoleNavigationItems';
import { Head } from '@inertiajs/react';

export default function SiswaJadwalIndex({ jadwals = [], tahunAjaranAktif = null }) {
    return (
        <DashboardLayout
            title="Jadwal Pelajaran"
            subtitle="Jadwal kelas Anda pada tahun ajaran aktif."
            roleLabel="Siswa"
            navigation={roleNavigationItems('siswa', 'jadwal')}
        >
            <Head title="Jadwal Pelajaran" />
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                <div className="mb-5">
                    <h2 className="font-bold text-slate-900">Jadwal kelas</h2>
                    <p className="mt-1 text-sm text-slate-500">{tahunAjaranAktif ?? 'Belum ada tahun ajaran aktif'}</p>
                </div>
                <ScheduleTable
                    jadwals={jadwals}
                    showGuru
                    showClass={false}
                    emptyMessage="Jadwal pelajaran kelas Anda akan tampil setelah disusun oleh administrator."
                />
            </section>
        </DashboardLayout>
    );
}
