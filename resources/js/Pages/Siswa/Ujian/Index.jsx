import DashboardLayout from '@/Layouts/DashboardLayout';
import roleNavigationItems from '@/Components/RoleNavigationItems';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

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

export default function SiswaUjianIndex({ ujians = [] }) {
    const [startingExamId, setStartingExamId] = useState(null);
    const wakeLockRef = useRef(null);

    useEffect(() => () => {
        wakeLockRef.current?.release();
    }, []);

    const startExam = async (ujianId) => {
        setStartingExamId(ujianId);
        const root = document.documentElement;
        const requestFullscreen = root.requestFullscreen ?? root.webkitRequestFullscreen;
        const requests = [];

        if (typeof requestFullscreen === 'function') {
            try {
                requests.push(Promise.resolve(requestFullscreen.call(root)).catch(() => undefined));
            } catch {
                requests.push(Promise.resolve());
            }
        }

        if (navigator.wakeLock?.request) {
            try {
                requests.push(navigator.wakeLock.request('screen').then((wakeLock) => {
                    wakeLockRef.current = wakeLock;
                    return wakeLock;
                }).catch(() => undefined));
            } catch {
                requests.push(Promise.resolve());
            }
        }

        await Promise.all(requests);
        router.post(route('siswa.ujian.start', ujianId), {}, {
            onError: () => setStartingExamId(null),
            onFinish: () => setStartingExamId(null),
        });
    };

    return (
        <DashboardLayout
            title="Ujian Online"
            subtitle="Daftar ujian yang dijadwalkan untuk kelas Anda. Ujian hanya dapat dimulai pada waktu yang ditentukan."
            roleLabel="Siswa"
            navigation={roleNavigationItems('siswa', 'ujian')}
        >
            <Head title="Ujian Online" />

            {ujians.length === 0 ? (
                <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center shadow-sm">
                    <p className="font-semibold text-slate-800">Tidak ada ujian aktif</p>
                    <p className="mt-1 text-sm text-slate-500">Ujian kelas Anda akan muncul di sini saat jadwalnya dimulai.</p>
                </section>
            ) : (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    {ujians.map((ujian) => {
                        const completed = ujian.status_pengerjaan === 'selesai';
                        const inProgress = ujian.status_pengerjaan === 'sedang_mengerjakan';
                        const canResume = inProgress && ujian.dapat_dilanjutkan;

                        return (
                            <article key={ujian.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md sm:p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">{ujian.mata_pelajaran ?? 'Mata Pelajaran belum tersedia'}</p>
                                        <h2 className="mt-2 text-lg font-bold text-slate-900">{ujian.judul_ujian}</h2>
                                    </div>
                                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                                        completed
                                            ? 'bg-emerald-50 text-emerald-700'
                                            : inProgress
                                              ? 'bg-indigo-50 text-indigo-700'
                                              : 'bg-amber-50 text-amber-700'
                                    }`}>
                                        {completed ? 'Selesai' : inProgress ? 'Sedang dikerjakan' : 'Tersedia'}
                                    </span>
                                </div>
                                <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm">
                                    <div>
                                        <p className="text-xs text-slate-500">Waktu mulai</p>
                                        <p className="mt-1 font-semibold text-slate-800">{formatDateTime(ujian.waktu_mulai)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Durasi</p>
                                        <p className="mt-1 font-semibold text-slate-800">{ujian.durasi_menit} menit</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Jumlah soal</p>
                                        <p className="mt-1 font-semibold text-slate-800">{ujian.jumlah_soal} soal</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Guru</p>
                                        <p className="mt-1 font-semibold text-slate-800">{ujian.guru ?? '—'}</p>
                                    </div>
                                </div>
                                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                                    {completed ? (
                                        <p className="text-sm font-semibold text-emerald-700">
                                            Nilai: {Number(ujian.skor_akhir ?? 0).toFixed(2)}
                                        </p>
                                    ) : inProgress && !canResume ? (
                                        <p className="text-sm text-amber-700">Waktu ujian berakhir. Jawaban tersimpan sedang diproses.</p>
                                    ) : (
                                        <p className="text-sm text-slate-500">
                                            {inProgress ? 'Lanjutkan pengerjaan yang tersimpan.' : 'Pastikan Anda siap sebelum memulai.'}
                                        </p>
                                    )}
                                    {completed || (inProgress && !canResume) ? (
                                        <Link
                                            href={route('siswa.ujian.show', ujian.id)}
                                            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
                                        >
                                            {completed ? 'Lihat Hasil' : 'Lihat Ringkasan'}
                                        </Link>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => startExam(ujian.id)}
                                            disabled={startingExamId === ujian.id}
                                            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60"
                                        >
                                            {startingExamId === ujian.id
                                                ? 'Menyiapkan ujian...'
                                                : canResume
                                                  ? 'Lanjutkan Ujian'
                                                  : 'Mulai Ujian'}
                                        </button>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </DashboardLayout>
    );
}
