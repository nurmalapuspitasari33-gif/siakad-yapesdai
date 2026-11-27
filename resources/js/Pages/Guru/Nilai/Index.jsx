import InputError from '@/Components/InputError';
import DashboardLayout from '@/Layouts/DashboardLayout';
import roleNavigationItems from '@/Components/RoleNavigationItems';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

function initialScores(siswas) {
    const capaianKompetensi = siswas.find((siswa) => siswa.nilai?.capaian_kompetensi)?.nilai?.capaian_kompetensi ?? '';

    return siswas.map((siswa) => {
        const score = siswa.nilai?.nilai_akhir;

        return {
            siswa_id: siswa.id,
            nilai_akhir: score == null || score === '' ? '' : String(Math.round(Number(score))),
            capaian_kompetensi: capaianKompetensi,
        };
    });
}

export default function GuruNilaiIndex({
    assignments = [],
    siswas = [],
    ujians = [],
    filters = {},
    tahunAjaranAktif = null,
    isWaliKelas = false,
    waliKelasName = '',
}) {
    const [ujianId, setUjianId] = useState('');
    const [selectedStudentIds, setSelectedStudentIds] = useState([]);
    const [isImporting, setIsImporting] = useState(false);
    const [importError, setImportError] = useState('');
    const [fillRange, setFillRange] = useState(null);
    const fillRangeRef = useRef(null);
    const finishFillRef = useRef(() => {});
    const extendFillRef = useRef(() => {});
    const startAutoScrollRef = useRef(() => {});
    const autoScrollFrameRef = useRef(null);
    const pointerPositionRef = useRef({ x: 0, y: 0 });
    const form = useForm({
        kelas_id: filters?.kelas_id ?? '',
        mapel_id: filters?.mapel_id ?? '',
        nilai: initialScores(siswas),
    });
    const selectedAssignment = assignments.find((assignment) =>
        String(assignment.kelas_id) === String(filters?.kelas_id)
        && String(assignment.mapel_id) === String(filters?.mapel_id),
    ) ?? null;
    const sameSubjectAssignments = selectedAssignment
        ? assignments.filter((assignment) => String(assignment.mapel_id) === String(selectedAssignment.mapel_id))
        : [];

    useEffect(() => {
        form.setData({
            kelas_id: filters?.kelas_id ?? '',
            mapel_id: filters?.mapel_id ?? '',
            nilai: initialScores(siswas),
        });
        setSelectedStudentIds([]);
        setUjianId(ujians[0]?.id ? String(ujians[0].id) : '');
        setImportError('');
    }, [siswas, ujians, filters.kelas_id, filters.mapel_id]);

    const openAssignment = (assignment) => {
        router.get(route('guru.nilai.index'), {
            kelas_id: assignment.kelas_id,
            mapel_id: assignment.mapel_id,
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const returnToAssignments = () => {
        router.get(route('guru.nilai.index'), {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const updateScore = (index, key, value) => {
        form.setData('nilai', form.data.nilai.map((row, rowIndex) =>
            rowIndex === index ? { ...row, [key]: value } : row,
        ));
    };

    const updateCompetency = (value) => {
        form.setData('nilai', form.data.nilai.map((row) => ({
            ...row,
            capaian_kompetensi: value,
        })));
    };

    const copyScoreDown = (sourceIndex, targetIndex, key, value) => {
        if (targetIndex <= sourceIndex) {
            return;
        }

        form.setData('nilai', form.data.nilai.map((row, rowIndex) =>
            rowIndex > sourceIndex && rowIndex <= targetIndex
                ? { ...row, [key]: value }
                : row,
        ));
    };

    const startFill = (event, index, key) => {
        event.preventDefault();
        pointerPositionRef.current = { x: event.clientX, y: event.clientY };

        const fill = {
            sourceIndex: index,
            targetIndex: index,
            key,
            value: form.data.nilai[index]?.[key] ?? '',
        };

        fillRangeRef.current = fill;
        setFillRange(fill);
        startAutoScrollRef.current();
    };

    const extendFill = (index, key) => {
        const currentFill = fillRangeRef.current;

        if (!currentFill || currentFill.key !== key) {
            return;
        }

        const targetIndex = Math.max(currentFill.sourceIndex, index);

        if (currentFill.targetIndex === targetIndex) {
            return;
        }

        const fill = {
            ...currentFill,
            targetIndex,
        };

        fillRangeRef.current = fill;
        setFillRange(fill);
    };

    extendFillRef.current = extendFill;

    finishFillRef.current = () => {
        const currentFill = fillRangeRef.current;

        if (!currentFill) {
            return;
        }

        copyScoreDown(
            currentFill.sourceIndex,
            currentFill.targetIndex,
            currentFill.key,
            currentFill.value,
        );
        fillRangeRef.current = null;
        setFillRange(null);
    };

    useEffect(() => {
        const finishFill = () => finishFillRef.current();
        const trackFillAtPointer = () => {
            const { x, y } = pointerPositionRef.current;
            const target = document.elementFromPoint(x, y)
                ?.closest('[data-fill-index][data-fill-key]');

            if (target) {
                extendFillRef.current(Number(target.dataset.fillIndex), target.dataset.fillKey);
            }
        };
        const trackFillTarget = (event) => {
            if (!fillRangeRef.current) {
                return;
            }

            pointerPositionRef.current = { x: event.clientX, y: event.clientY };
            trackFillAtPointer();
        };
        const autoScroll = () => {
            if (!fillRangeRef.current) {
                autoScrollFrameRef.current = null;
                return;
            }

            const { y } = pointerPositionRef.current;
            const edgeSize = 64;
            let scrollAmount = 0;

            if (y > window.innerHeight - edgeSize) {
                scrollAmount = Math.ceil(((y - (window.innerHeight - edgeSize)) / edgeSize) * 16);
            } else if (y < edgeSize) {
                scrollAmount = -Math.ceil(((edgeSize - y) / edgeSize) * 16);
            }

            if (scrollAmount !== 0) {
                window.scrollBy(0, scrollAmount);
            }

            trackFillAtPointer();
            autoScrollFrameRef.current = window.requestAnimationFrame(autoScroll);
        };
        const stopAutoScroll = () => {
            finishFill();

            if (autoScrollFrameRef.current !== null) {
                window.cancelAnimationFrame(autoScrollFrameRef.current);
                autoScrollFrameRef.current = null;
            }
        };

        startAutoScrollRef.current = () => {
            if (autoScrollFrameRef.current !== null) {
                window.cancelAnimationFrame(autoScrollFrameRef.current);
            }

            autoScrollFrameRef.current = window.requestAnimationFrame(autoScroll);
        };

        window.addEventListener('pointermove', trackFillTarget);
        window.addEventListener('pointerup', stopAutoScroll);
        window.addEventListener('pointercancel', stopAutoScroll);
        window.addEventListener('blur', stopAutoScroll);

        return () => {
            window.removeEventListener('pointermove', trackFillTarget);
            window.removeEventListener('pointerup', stopAutoScroll);
            window.removeEventListener('pointercancel', stopAutoScroll);
            window.removeEventListener('blur', stopAutoScroll);

            if (autoScrollFrameRef.current !== null) {
                window.cancelAnimationFrame(autoScrollFrameRef.current);
            }
        };
    }, []);

    const saveGrades = (event) => {
        event.preventDefault();
        form.post(route('guru.nilai.store'), {
            preserveScroll: true,
        });
    };

    const importExamResults = () => {
        setImportError('');
        setIsImporting(true);
        router.post(route('guru.nilai.import-ujian'), {
            kelas_id: selectedAssignment.kelas_id,
            mapel_id: selectedAssignment.mapel_id,
            ujian_id: ujianId,
            siswa_ids: selectedStudentIds,
        }, {
            preserveScroll: true,
            onError: (errors) => setImportError(Object.values(errors)[0] ?? 'Nilai CBT gagal ditarik.'),
            onFinish: () => setIsImporting(false),
        });
    };

    return (
        <DashboardLayout
            title="Input Nilai"
            subtitle="Masukkan nilai akhir dan capaian kompetensi untuk mata pelajaran yang Anda ampu."
            roleLabel="Guru"
            navigation={roleNavigationItems('guru', 'nilai', { isWaliKelas, waliKelasName })}
        >
            <Head title="Input Nilai" />

            <div className="flex flex-col gap-5">
                {!selectedAssignment ? (
                    assignments.length > 0 ? (
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                            <div className="mb-5">
                                <h2 className="font-bold text-slate-900">Pembagian tugas mengajar</h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    {tahunAjaranAktif ?? 'Tahun ajaran aktif belum ditetapkan'}
                                </p>
                            </div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {assignments.map((assignment) => {
                                    const statusStyle = assignment.status_nilai === 'Lengkap'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-amber-100 text-amber-800';

                                    return (
                                        <button
                                            key={`${assignment.kelas_id}-${assignment.mapel_id}`}
                                            type="button"
                                            onClick={() => openAssignment(assignment)}
                                            className="group flex min-h-56 flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                                        >
                                            <div className="flex w-full items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                                                        {assignment.kode_mapel}
                                                    </p>
                                                    <h3 className="mt-1 text-lg font-bold text-slate-900">
                                                        {assignment.nama_mapel}
                                                    </h3>
                                                </div>
                                                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${statusStyle}`}>
                                                    {assignment.status_nilai}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                                    {assignment.nama_kelas}
                                                </span>
                                                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">
                                                    {assignment.kompetensi_keahlian ?? 'Kompetensi belum ditentukan'}
                                                </span>
                                                {assignment.team_teaching && (
                                                    <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-800">
                                                        Team Teaching
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-auto flex w-full items-center justify-between gap-3 text-sm">
                                                <span className="text-slate-600">
                                                    {assignment.jumlah_nilai} dari {assignment.jumlah_siswa} siswa sudah dinilai
                                                </span>
                                                <span className="shrink-0 font-semibold text-indigo-700 transition group-hover:translate-x-1">
                                                    Klik untuk Input Nilai →
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    ) : (
                        <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center shadow-sm">
                            <h2 className="text-lg font-bold text-slate-900">Belum ada pembagian tugas mengajar</h2>
                            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
                                {tahunAjaranAktif
                                    ? 'Belum ada jadwal mata pelajaran yang ditetapkan untuk Anda pada semester aktif.'
                                    : 'Tahun ajaran dan semester aktif belum ditetapkan. Periksa jadwal mengajar Anda setelah semester diaktifkan.'}
                            </p>
                            <Link
                                href={route('guru.jadwal.index')}
                                className="mt-5 inline-flex rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                            >
                                Buka Jadwal Mengajar
                            </Link>
                        </section>
                    )
                ) : (
                    <div className="flex flex-col gap-4">
                        <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <button
                                    type="button"
                                    onClick={returnToAssignments}
                                    className="self-start rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                >
                                    ← Kembali ke Daftar Tugas
                                </button>
                                <div>
                                    <h2 className="font-bold text-slate-900">{selectedAssignment.nama_mapel}</h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        {selectedAssignment.nama_kelas} · {selectedAssignment.kompetensi_keahlian ?? 'Kompetensi belum ditentukan'}
                                    </p>
                                </div>
                            </div>
                            {sameSubjectAssignments.length > 1 && (
                                <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700 sm:min-w-56">
                                    Pindah kelas untuk mata pelajaran ini
                                    <select
                                        value={selectedAssignment.kelas_id}
                                        onChange={(event) => {
                                            const assignment = sameSubjectAssignments.find(
                                                (item) => String(item.kelas_id) === event.target.value,
                                            );

                                            if (assignment) {
                                                openAssignment(assignment);
                                            }
                                        }}
                                        className="rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        {sameSubjectAssignments.map((assignment) => (
                                            <option key={assignment.kelas_id} value={assignment.kelas_id}>
                                                {assignment.nama_kelas}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            )}
                        </section>

                        <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:p-6">
                            <div className="min-w-0 flex-1">
                                <label htmlFor="ujian-cbt" className="mb-2 block text-sm font-semibold text-slate-700">
                                    Sumber nilai CBT
                                </label>
                                <select
                                    id="ujian-cbt"
                                    value={ujianId}
                                    onChange={(event) => setUjianId(event.target.value)}
                                    disabled={ujians.length === 0}
                                    className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-slate-100"
                                >
                                    <option value="">Pilih ujian</option>
                                    {ujians.map((ujian) => (
                                        <option key={ujian.id} value={ujian.id}>
                                            {ujian.judul_ujian} · {ujian.waktu_mulai}
                                        </option>
                                    ))}
                                </select>
                                <p className="mt-2 text-xs text-slate-500">
                                    Tanpa memilih siswa, sistem hanya mengisi nilai yang masih kosong. Centang siswa untuk memperbarui nilainya dari ujian ini.
                                </p>
                                {importError && <p role="alert" className="mt-2 text-sm text-red-600">{importError}</p>}
                            </div>
                            <button
                                type="button"
                                onClick={importExamResults}
                                disabled={isImporting || !ujianId || ujians.length === 0}
                                className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isImporting ? 'Menarik Nilai...' : 'Tarik Nilai Ujian'}
                            </button>
                        </section>

                        <form onSubmit={saveGrades} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                                <div>
                                    <h2 className="font-bold text-slate-900">Daftar nilai siswa</h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        {siswas.length} siswa · Nilai akhir bilangan bulat 0–100
                                    </p>
                                </div>
                                <button
                                    type="submit"
                                    disabled={form.processing || siswas.length === 0}
                                    className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {form.processing ? 'Menyimpan...' : 'Simpan Nilai'}
                                </button>
                            </div>
                            <div className="border-b border-slate-100 px-5 py-4 sm:px-7">
                                <label htmlFor="capaian-kompetensi" className="mb-1.5 block text-sm font-semibold text-slate-700">
                                    Capaian kompetensi
                                </label>
                                <textarea
                                    id="capaian-kompetensi"
                                    rows="2"
                                    maxLength="5000"
                                    aria-describedby="capaian-kompetensi-hint"
                                    value={form.data.nilai[0]?.capaian_kompetensi ?? ''}
                                    onChange={(event) => updateCompetency(event.target.value)}
                                    className="block w-full max-w-3xl rounded-lg border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                                <p id="capaian-kompetensi-hint" className="mt-1 text-xs text-slate-500">
                                    Capaian ini berlaku untuk seluruh siswa pada mata pelajaran yang dipilih.
                                </p>
                                <InputError message={form.errors['nilai.0.capaian_kompetensi']} className="mt-1" />
                            </div>
                            <div className="w-full overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-100 text-left">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-7">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedStudentIds(
                                                        selectedStudentIds.length === siswas.length ? [] : siswas.map((siswa) => siswa.id),
                                                    )}
                                                    className="underline underline-offset-2"
                                                    aria-label="Pilih semua siswa untuk impor nilai CBT"
                                                >
                                                    Pilih
                                                </button>
                                            </th>
                                            {['Siswa', 'Nilai Akhir'].map((heading) => (
                                                <th key={heading} className="whitespace-nowrap px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 first:sm:px-7">
                                                    {heading}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {siswas.length > 0 ? siswas.map((siswa, index) => {
                                            const row = form.data.nilai[index];

                                            return (
                                                <tr key={siswa.id}>
                                                    <td className="px-4 py-2 sm:px-7">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedStudentIds.includes(siswa.id)}
                                                            onChange={(event) => setSelectedStudentIds((current) => event.target.checked
                                                                ? [...current, siswa.id]
                                                                : current.filter((id) => id !== siswa.id))}
                                                            aria-label={`Pilih ${siswa.nama_lengkap} untuk impor CBT`}
                                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-2">
                                                        <p className="text-sm font-semibold text-slate-900">{siswa.nama_lengkap}</p>
                                                        <p className="mt-0.5 text-xs text-slate-500">{siswa.nisn}</p>
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <div
                                                            className="group relative w-28"
                                                            data-fill-index={index}
                                                            data-fill-key="nilai_akhir"
                                                        >
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                step="1"
                                                                aria-label={`Nilai akhir ${siswa.nama_lengkap}`}
                                                                value={row?.nilai_akhir ?? ''}
                                                                onChange={(event) => updateScore(index, 'nilai_akhir', event.target.value)}
                                                                className={`w-full rounded-lg border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                                                                    fillRange?.key === 'nilai_akhir'
                                                                        && index > fillRange.sourceIndex
                                                                        && index <= fillRange.targetIndex
                                                                        ? 'border-indigo-500 bg-indigo-50'
                                                                        : ''
                                                                }`}
                                                            />
                                                            <button
                                                                type="button"
                                                                aria-label={`Tarik untuk menyalin nilai akhir dari ${siswa.nama_lengkap} ke bawah`}
                                                                title="Tarik ke bawah untuk menyalin nilai ini"
                                                                onPointerDown={(event) => startFill(event, index, 'nilai_akhir')}
                                                                onClick={(event) => {
                                                                    if (event.detail === 0) {
                                                                        copyScoreDown(
                                                                            index,
                                                                            index + 1,
                                                                            'nilai_akhir',
                                                                            row?.nilai_akhir ?? '',
                                                                        );
                                                                    }
                                                                }}
                                                                className="absolute -bottom-1 -right-1 z-10 h-3 w-3 touch-none cursor-ns-resize rounded-sm border border-white bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                            />
                                                        </div>
                                                        <InputError message={form.errors[`nilai.${index}.nilai_akhir`]} className="mt-1" />
                                                        <p className="mt-2 text-[11px] font-semibold text-slate-600">
                                                            Nilai akhir rapor: {siswa.nilai_rapor ?? '—'}
                                                        </p>
                                                        {siswa.kontribusi_guru?.length > 0 && (
                                                            <ul className="mt-1 flex flex-col gap-0.5 text-[10px] leading-4 text-slate-500">
                                                                {siswa.kontribusi_guru.map((contribution) => (
                                                                    <li key={`${siswa.id}-${contribution.guru_id}`}>
                                                                        {contribution.nama_guru}: {contribution.nilai_akhir}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        }) : (
                                            <tr>
                                                <td colSpan="3" className="px-4 py-8 text-center text-sm text-slate-500">
                                                    Belum ada siswa aktif di kelas ini.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
