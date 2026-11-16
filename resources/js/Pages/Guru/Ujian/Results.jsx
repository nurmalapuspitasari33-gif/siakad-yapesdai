import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import DashboardLayout from '@/Layouts/DashboardLayout';
import roleNavigationItems from '@/Components/RoleNavigationItems';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

const statusStyles = {
    belum_mulai: 'bg-slate-100 text-slate-700',
    sedang_mengerjakan: 'bg-amber-100 text-amber-800',
    selesai: 'bg-emerald-100 text-emerald-800',
};

export default function GuruUjianResults({ ujian, students = [], isWaliKelas = false }) {
    const [resetTarget, setResetTarget] = useState(null);
    const resetForm = useForm({});

    const resetSession = (event) => {
        event.preventDefault();

        if (!resetTarget) {
            return;
        }

        resetForm.delete(
            route('guru.ujian.reset-session', [ujian.id, resetTarget.id]),
            {
                preserveScroll: true,
                onSuccess: () => setResetTarget(null),
            },
        );
    };

    return (
        <DashboardLayout
            title="Hasil Ujian"
            subtitle="Pantau status pengerjaan dan skor seluruh siswa pada ujian ini."
            roleLabel="Guru"
            navigation={roleNavigationItems('guru', 'hasil-ujian', { isWaliKelas })}
        >
            <Head title={`Hasil Ujian · ${ujian.judul_ujian}`} />

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                    <div className="flex items-start gap-3">
                        <Link
                            href={route('guru.ujian.index')}
                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                            Kembali
                        </Link>
                        <div>
                            <h2 className="font-bold text-slate-900">{ujian.judul_ujian}</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                {ujian.kelas} · {ujian.mata_pelajaran} · {students.length} siswa
                            </p>
                        </div>
                    </div>
                    <a
                        href={route('guru.ujian.hasil.export', ujian.id)}
                        className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                    >
                        Export Hasil ke Excel (.xlsx)
                    </a>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 text-left">
                        <thead className="bg-slate-50">
                            <tr>
                                {['Nama', 'NISN', 'Status Mengerjakan', 'Waktu Selesai', 'Skor Akhir', 'Aksi'].map((heading) => (
                                    <th key={heading} className="whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        {heading}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {students.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-5 py-12 text-center text-sm text-slate-500">
                                        Belum ada siswa aktif di kelas ini.
                                    </td>
                                </tr>
                            ) : students.map((student) => (
                                <tr key={student.id} className="hover:bg-slate-50/70">
                                    <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-900">
                                        {student.nama_lengkap}
                                    </td>
                                    <td className="whitespace-nowrap px-5 py-4 font-mono text-sm text-slate-600">
                                        {student.nisn || '—'}
                                    </td>
                                    <td className="whitespace-nowrap px-5 py-4">
                                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[student.status_pengerjaan] ?? statusStyles.belum_mulai}`}>
                                            {student.status_label}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                                        {student.waktu_selesai ?? '—'}
                                    </td>
                                    <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-800">
                                        {student.skor_akhir ?? '—'}
                                    </td>
                                    <td className="whitespace-nowrap px-5 py-4">
                                        <button
                                            type="button"
                                            onClick={() => setResetTarget(student)}
                                            disabled={student.status_pengerjaan !== 'sedang_mengerjakan'}
                                            className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            Reset Sesi Ujian
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <Modal
                show={Boolean(resetTarget)}
                onClose={() => setResetTarget(null)}
                maxWidth="md"
                labelledBy="reset-exam-session-title"
            >
                <form onSubmit={resetSession} className="p-6">
                    <h2 id="reset-exam-session-title" className="text-lg font-bold text-slate-900">
                        Reset sesi ujian?
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        Sesi pengerjaan {resetTarget?.nama_lengkap} akan dihapus. Siswa dapat memulai ulang ujian.
                    </p>
                    <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <SecondaryButton onClick={() => setResetTarget(null)}>
                            Batal
                        </SecondaryButton>
                        <button
                            type="submit"
                            disabled={resetForm.processing}
                            className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {resetForm.processing ? 'Mereset...' : 'Reset Sesi Ujian'}
                        </button>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
}
