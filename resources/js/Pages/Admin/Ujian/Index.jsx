import AdminNavigationItems from '@/Components/AdminNavigationItems';
import { AdminDeleteModal } from '@/Components/AdminResourceModal';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, usePoll } from '@inertiajs/react';
import { useState } from 'react';

const numberFormatter = new Intl.NumberFormat('id-ID');

function formatDateTime(value) {
    if (!value) {
        return '—';
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

function StatusBadge({ status }) {
    const labels = {
        belum_mulai: 'Belum mulai',
        sedang_mengerjakan: 'Sedang mengerjakan',
        selesai: 'Selesai',
    };
    const styles = {
        belum_mulai: 'bg-slate-100 text-slate-600',
        sedang_mengerjakan: 'bg-amber-50 text-amber-700',
        selesai: 'bg-emerald-50 text-emerald-700',
    };

    return (
        <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${styles[status] ?? 'bg-slate-100 text-slate-600'}`}>
            {labels[status] ?? status}
        </span>
    );
}

export default function ExamMonitoring({ examOptions, selectedExam, filters, statistics, students }) {
    const [resetStudent, setResetStudent] = useState(null);
    const [processingReset, setProcessingReset] = useState(false);

    usePoll(5000, { only: ['students', 'statistics'] });

    function selectExam(event) {
        router.get(
            route('admin.ujian.index'),
            { ujian_id: event.target.value || null },
            { preserveScroll: true, preserveState: true, replace: true },
        );
    }

    function resetSession() {
        if (!selectedExam || !resetStudent) {
            return;
        }

        router.delete(
            route('admin.ujian.reset-session', {
                ujian: selectedExam.id,
                siswa: resetStudent.id,
            }),
            {
                preserveScroll: true,
                onStart: () => setProcessingReset(true),
                onSuccess: () => setResetStudent(null),
                onFinish: () => setProcessingReset(false),
            },
        );
    }

    const summaryCards = [
        { label: 'Total peserta kelas', value: statistics.totalPeserta, accent: 'bg-indigo-500' },
        { label: 'Sedang mengerjakan', value: statistics.sedangMengerjakan, accent: 'bg-amber-500' },
        { label: 'Sudah selesai', value: statistics.sudahSelesai, accent: 'bg-emerald-500' },
        { label: 'Belum mulai', value: statistics.belumMulai, accent: 'bg-slate-400' },
    ];

    return (
        <DashboardLayout
            title="Monitoring Ujian"
            subtitle="Pantau perkembangan peserta secara berkala dan reset sesi yang mengalami kendala teknis."
            roleLabel="Administrator"
            navigation={AdminNavigationItems('ujian')}
        >
            <Head title="Monitoring Ujian" />

            <div className="flex flex-col gap-6">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                        <div>
                            <label htmlFor="monitoring-ujian" className="mb-1.5 block text-sm font-semibold text-slate-700">
                                Jadwal ujian
                            </label>
                            <select
                                id="monitoring-ujian"
                                value={filters.ujian_id}
                                onChange={selectExam}
                                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                {examOptions.length === 0 && <option value="">Belum ada jadwal ujian</option>}
                                {examOptions.map((exam) => (
                                    <option key={exam.id} value={exam.id}>
                                        {exam.judul_ujian} · {exam.kelas ?? 'Kelas tidak tersedia'} · {exam.mata_pelajaran ?? 'Mapel tidak tersedia'}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
                            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" aria-hidden="true" />
                            Diperbarui otomatis tiap 5 detik
                        </div>
                    </div>
                    {selectedExam && (
                        <p className="mt-4 text-sm text-slate-500">
                            {selectedExam.kelas} · {selectedExam.mata_pelajaran}
                        </p>
                    )}
                </section>

                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Ringkasan peserta">
                    {summaryCards.map((card) => (
                        <article key={card.label} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className={`h-1 ${card.accent}`} />
                            <div className="p-5">
                                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                                    {numberFormatter.format(card.value)}
                                </p>
                            </div>
                        </article>
                    ))}
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                        <h2 className="font-bold text-slate-900">
                            {selectedExam ? `Peserta ${selectedExam.judul_ujian}` : 'Daftar peserta'}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {selectedExam ? `Kelas ${selectedExam.kelas} · ${students.length} siswa aktif` : 'Pilih jadwal ujian untuk melihat peserta.'}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                            Tindakan hanya tersedia untuk mereset sesi siswa yang sedang mengerjakan.
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 text-left">
                            <thead className="bg-slate-50">
                                <tr>
                                    {['No.', 'NISN', 'Nama Siswa', 'Status Pengerjaan', 'Aktivitas Terakhir', 'Tindakan'].map((heading) => (
                                        <th key={heading} scope="col" className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 first:sm:px-6">
                                            {heading}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {students.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-5 py-12 text-center text-sm text-slate-500">
                                            {selectedExam ? 'Belum ada siswa aktif di kelas ini.' : 'Pilih jadwal ujian untuk memuat daftar peserta.'}
                                        </td>
                                    </tr>
                                ) : students.map((student, index) => (
                                    <tr key={student.id} className="transition hover:bg-slate-50/70">
                                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500 sm:px-6">{index + 1}</td>
                                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">{student.nisn || '—'}</td>
                                        <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-slate-900">{student.nama_lengkap}</td>
                                        <td className="whitespace-nowrap px-4 py-4"><StatusBadge status={student.status_pengerjaan} /></td>
                                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500">{formatDateTime(student.updated_at)}</td>
                                        <td className="whitespace-nowrap px-4 py-4">
                                            {student.status_pengerjaan === 'sedang_mengerjakan' ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setResetStudent(student)}
                                                    className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                                                >
                                                    Reset Sesi Ujian
                                                </button>
                                            ) : (
                                                <span
                                                    className="text-sm text-slate-300"
                                                    title="Reset sesi hanya tersedia selama siswa masih mengerjakan."
                                                >
                                                    —
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            <AdminDeleteModal
                show={Boolean(resetStudent)}
                title="Reset sesi ujian?"
                description={`Sesi aktif ${resetStudent?.nama_lengkap ?? 'siswa'} akan dihapus. Siswa dapat memulai ulang ujian dan jawaban yang belum dikirim tidak dapat dipulihkan.`}
                processing={processingReset}
                confirmLabel="Reset sesi"
                onClose={() => setResetStudent(null)}
                onConfirm={resetSession}
            />
        </DashboardLayout>
    );
}
