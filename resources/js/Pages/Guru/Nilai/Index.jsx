import InputError from '@/Components/InputError';
import DashboardLayout from '@/Layouts/DashboardLayout';
import roleNavigationItems from '@/Components/RoleNavigationItems';
import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

function initialScores(siswas) {
    return siswas.map((siswa) => ({
        siswa_id: siswa.id,
        nilai_akhir: siswa.nilai?.nilai_akhir ?? '',
        capaian_kompetensi: siswa.nilai?.capaian_kompetensi ?? '',
    }));
}

export default function GuruNilaiIndex({
    kelasOptions = [],
    mapelOptions = [],
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
    const filterForm = useForm({
        kelas_id: filters?.kelas_id ?? '',
        mapel_id: filters?.mapel_id ?? '',
    });
    const form = useForm({
        kelas_id: filters?.kelas_id ?? '',
        mapel_id: filters?.mapel_id ?? '',
        nilai: initialScores(siswas),
    });
    const availableMapelOptions = mapelOptions.filter((mapel) =>
        assignments.some((assignment) =>
            String(assignment.kelas_id) === String(filterForm.data.kelas_id)
            && String(assignment.mapel_id) === String(mapel.id),
        ),
    );

    useEffect(() => {
        form.setData({
            kelas_id: filters?.kelas_id ?? '',
            mapel_id: filters?.mapel_id ?? '',
            nilai: initialScores(siswas),
        });
        filterForm.setData({
            kelas_id: filters?.kelas_id ?? '',
            mapel_id: filters?.mapel_id ?? '',
        });
        setSelectedStudentIds([]);
        setUjianId(ujians[0]?.id ? String(ujians[0].id) : '');
        setImportError('');
    }, [siswas, ujians, filters.kelas_id, filters.mapel_id]);

    const applyFilter = (event) => {
        event.preventDefault();
        router.get(route('guru.nilai.index'), filterForm.data, {
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

        const fill = {
            sourceIndex: index,
            targetIndex: index,
            key,
            value: form.data.nilai[index]?.[key] ?? '',
        };

        fillRangeRef.current = fill;
        setFillRange(fill);
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
        const trackFillTarget = (event) => {
            if (!fillRangeRef.current) {
                return;
            }

            const target = document.elementFromPoint(event.clientX, event.clientY)
                ?.closest('[data-fill-index][data-fill-key]');

            if (target) {
                extendFillRef.current(Number(target.dataset.fillIndex), target.dataset.fillKey);
            }
        };

        window.addEventListener('pointermove', trackFillTarget);
        window.addEventListener('pointerup', finishFill);
        window.addEventListener('pointercancel', finishFill);
        window.addEventListener('blur', finishFill);

        return () => {
            window.removeEventListener('pointermove', trackFillTarget);
            window.removeEventListener('pointerup', finishFill);
            window.removeEventListener('pointercancel', finishFill);
            window.removeEventListener('blur', finishFill);
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
            kelas_id: filterForm.data.kelas_id,
            mapel_id: filterForm.data.mapel_id,
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
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                    <div className="mb-5">
                        <h2 className="font-bold text-slate-900">Pilih kelas dan mata pelajaran</h2>
                        <p className="mt-1 text-sm text-slate-500">{tahunAjaranAktif ?? 'Tahun ajaran aktif belum ditetapkan'}</p>
                    </div>
                    <form onSubmit={applyFilter} className="grid grid-cols-1 items-end gap-4 sm:grid-cols-[1fr_1fr_auto]">
                        <div>
                            <label htmlFor="nilai-kelas" className="mb-2 block text-sm font-semibold text-slate-700">Kelas</label>
                            <select
                                id="nilai-kelas"
                                value={filterForm.data.kelas_id}
                                onChange={(event) => filterForm.setData({
                                    kelas_id: event.target.value,
                                    mapel_id: '',
                                })}
                                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value="">Pilih kelas</option>
                                {kelasOptions.map((kelas) => <option key={kelas.id} value={kelas.id}>{kelas.nama_kelas}</option>)}
                            </select>
                            <InputError message={filterForm.errors.kelas_id} className="mt-2" />
                        </div>
                        <div>
                            <label htmlFor="nilai-mapel" className="mb-2 block text-sm font-semibold text-slate-700">Mata Pelajaran</label>
                            <select
                                id="nilai-mapel"
                                value={filterForm.data.mapel_id}
                                onChange={(event) => filterForm.setData('mapel_id', event.target.value)}
                                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value="">Pilih mata pelajaran</option>
                                {availableMapelOptions.map((mapel) => <option key={mapel.id} value={mapel.id}>{mapel.kode_mapel} · {mapel.nama_mapel}</option>)}
                            </select>
                            <InputError message={filterForm.errors.mapel_id} className="mt-2" />
                        </div>
                        <button
                            type="submit"
                            disabled={filterForm.processing || !filterForm.data.kelas_id || !filterForm.data.mapel_id}
                            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Tampilkan Siswa
                        </button>
                    </form>
                </section>

                {siswas.length > 0 && (
                    <div className="flex flex-col gap-4">
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
                            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                                <div>
                                    <h2 className="font-bold text-slate-900">Daftar nilai siswa</h2>
                                    <p className="mt-1 text-sm text-slate-500">{siswas.length} siswa</p>
                                </div>
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {form.processing ? 'Menyimpan...' : 'Simpan Nilai'}
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-100 text-left">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-7">
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
                                            {['Siswa', 'Nilai Akhir', 'Capaian Kompetensi'].map((heading) => (
                                                <th key={heading} className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 first:sm:px-7">
                                                    {heading}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {siswas.map((siswa, index) => {
                                            const row = form.data.nilai[index];

                                            return (
                                                <tr key={siswa.id}>
                                                    <td className="px-4 py-4 sm:px-7">
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
                                                    <td className="whitespace-nowrap px-4 py-4">
                                                        <p className="text-sm font-semibold text-slate-900">{siswa.nama_lengkap}</p>
                                                        <p className="mt-1 text-xs text-slate-500">{siswa.nisn}</p>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div
                                                            className="group relative w-28"
                                                            data-fill-index={index}
                                                            data-fill-key="nilai_akhir"
                                                        >
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                step="0.01"
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
                                                    </td>
                                                    <td className="min-w-72 px-4 py-4">
                                                        <div
                                                            className="group relative min-w-64"
                                                            data-fill-index={index}
                                                            data-fill-key="capaian_kompetensi"
                                                        >
                                                            <textarea
                                                                rows="2"
                                                                maxLength="5000"
                                                                aria-label={`Capaian kompetensi ${siswa.nama_lengkap}`}
                                                                value={row?.capaian_kompetensi ?? ''}
                                                                onChange={(event) => updateScore(index, 'capaian_kompetensi', event.target.value)}
                                                                className={`min-w-64 rounded-lg border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                                                                    fillRange?.key === 'capaian_kompetensi'
                                                                        && index > fillRange.sourceIndex
                                                                        && index <= fillRange.targetIndex
                                                                        ? 'border-indigo-500 bg-indigo-50'
                                                                        : ''
                                                                }`}
                                                            />
                                                            <button
                                                                type="button"
                                                                aria-label={`Tarik untuk menyalin capaian kompetensi dari ${siswa.nama_lengkap} ke bawah`}
                                                                title="Tarik ke bawah untuk menyalin capaian ini"
                                                                onPointerDown={(event) => startFill(event, index, 'capaian_kompetensi')}
                                                                onClick={(event) => {
                                                                    if (event.detail === 0) {
                                                                        copyScoreDown(
                                                                            index,
                                                                            index + 1,
                                                                            'capaian_kompetensi',
                                                                            row?.capaian_kompetensi ?? '',
                                                                        );
                                                                    }
                                                                }}
                                                                className="absolute -bottom-1 -right-1 z-10 h-3 w-3 touch-none cursor-ns-resize rounded-sm border border-white bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                            />
                                                        </div>
                                                        <InputError message={form.errors[`nilai.${index}.capaian_kompetensi`]} className="mt-1" />
                                                    </td>
                                                </tr>
                                            );
                                        })}
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
