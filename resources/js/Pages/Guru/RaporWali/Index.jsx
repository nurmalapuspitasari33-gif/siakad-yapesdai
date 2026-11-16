import InputError from '@/Components/InputError';
import ClassLedgerPrintDocument from '@/Components/ClassLedgerPrintDocument';
import StudentReportDocument from '@/Components/StudentReportDocument';
import DashboardLayout from '@/Layouts/DashboardLayout';
import roleNavigationItems from '@/Components/RoleNavigationItems';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

const subjectGroups = [
    {
        key: 'umum',
        title: 'A. Mata Pelajaran Umum',
        headerClass: 'bg-blue-100 text-blue-900',
        subjectClass: 'bg-blue-50',
    },
    {
        key: 'kejuruan',
        title: 'B. Mata Pelajaran Kejuruan',
        headerClass: 'bg-emerald-100 text-emerald-900',
        subjectClass: 'bg-emerald-50',
    },
    {
        key: 'muatan_lokal',
        title: 'C. Muatan Lokal',
        headerClass: 'bg-violet-100 text-violet-900',
        subjectClass: 'bg-violet-50',
    },
];

const predicates = ['Amat Baik', 'Baik', 'Cukup', 'Kurang'];

function generatedDescription(template, predicate) {
    return predicate ? template.split('{predikat}').join(predicate) : '';
}

function initialNotes(siswas, template) {
    return siswas.map((siswa) => {
        const note = siswa.catatan_rapor ?? {};
        const predicate = note.kokurikuler_predikat ?? '';

        return {
            siswa_id: siswa.id,
            kokurikuler_predikat: predicate,
            kokurikuler_deskripsi: note.kokurikuler_deskripsi || generatedDescription(template, predicate),
            ekstra_1_nama: note.ekstra_1_nama ?? '',
            ekstra_1_ket: note.ekstra_1_ket ?? '',
            ekstra_2_nama: note.ekstra_2_nama ?? '',
            ekstra_2_ket: note.ekstra_2_ket ?? '',
            ekstra_3_nama: note.ekstra_3_nama ?? '',
            ekstra_3_ket: note.ekstra_3_ket ?? '',
            ekstra_4_nama: note.ekstra_4_nama ?? '',
            ekstra_4_ket: note.ekstra_4_ket ?? '',
            sakit: note.sakit ?? 0,
            izin: note.izin ?? 0,
            tanpa_keterangan: note.tanpa_keterangan ?? 0,
            catatan_wali_kelas: note.catatan_wali_kelas ?? '',
            status_kenaikan: note.status_kenaikan ?? '',
            naik_ke_kelas: note.naik_ke_kelas ?? '',
        };
    });
}

function noteIsComplete(note) {
    const textFields = [
        note.kokurikuler_predikat,
        note.kokurikuler_deskripsi,
        note.ekstra_1_nama,
        note.ekstra_1_ket,
        note.ekstra_2_nama,
        note.ekstra_2_ket,
        note.ekstra_3_nama,
        note.ekstra_3_ket,
        note.ekstra_4_nama,
        note.ekstra_4_ket,
        note.catatan_wali_kelas,
        note.status_kenaikan,
        note.naik_ke_kelas,
    ];

    return textFields.some((value) => typeof value === 'string' && value.trim() !== '')
        || ['sakit', 'izin', 'tanpa_keterangan'].some((key) => Number(note[key]) > 0);
}

function LegendGroup({ group }) {
    return (
        <th
            colSpan={Math.max(group.subjects.length * 2, 1)}
            className={`border border-slate-400 px-2 py-2 text-center ${group.headerClass}`}
        >
            {group.title}
        </th>
    );
}

export default function GuruRaporWaliIndex({
    kelasOptions = [],
    selectedKelasId = '',
    kelas = null,
    fase = null,
    namaWaliKelas = null,
    waliNiky = null,
    tahunAjaran = null,
    tahunAjaranAktif = null,
    templateKokurikuler = '',
    ekstrakurikulers = [],
    mataPelajarans = [],
    siswas = [],
}) {
    const { pengaturanSekolah = {} } = usePage().props;
    const [printTarget, setPrintTarget] = useState(null);
    const [isLedgerPrinting, setIsLedgerPrinting] = useState(false);
    const [ledgerOrientation, setLedgerOrientation] = useState('landscape');
    const [expandedStudents, setExpandedStudents] = useState({});
    const form = useForm({
        kelas_id: selectedKelasId,
        catatan_rapor: initialNotes(siswas, templateKokurikuler),
    });
    const groupedSubjects = useMemo(() => subjectGroups.map((group) => ({
        ...group,
        subjects: mataPelajarans.filter((mapel) => mapel.kelompok_mapel === group.key),
    })), [mataPelajarans]);
    const hasPromotionTerm = tahunAjaran?.semester === 'genap';

    useEffect(() => {
        form.setData({
            kelas_id: selectedKelasId,
            catatan_rapor: initialNotes(siswas, templateKokurikuler),
        });
        form.clearErrors();
    }, [siswas, selectedKelasId, templateKokurikuler]);

    useEffect(() => {
        setExpandedStudents({});
    }, [selectedKelasId]);

    useEffect(() => {
        const erroredStudentIds = Object.keys(form.errors)
            .map((key) => /^catatan_rapor\.(\d+)\./.exec(key))
            .filter(Boolean)
            .map(([, index]) => siswas[Number(index)]?.id)
            .filter(Boolean);

        if (erroredStudentIds.length > 0) {
            setExpandedStudents((current) => ({
                ...current,
                ...Object.fromEntries(erroredStudentIds.map((id) => [id, true])),
            }));
        }
    }, [form.errors, siswas]);

    useEffect(() => {
        if (!printTarget && !isLedgerPrinting) {
            return undefined;
        }

        const ledgerPageStyle = isLedgerPrinting ? document.createElement('style') : null;

        if (ledgerPageStyle) {
            const orientation = ledgerOrientation === 'portrait' ? 'portrait' : 'landscape';
            ledgerPageStyle.textContent = `@page { size: A4 ${orientation}; }`;
            document.head.appendChild(ledgerPageStyle);
        }

        const handleAfterPrint = () => {
            ledgerPageStyle?.remove();
            setPrintTarget(null);
            setIsLedgerPrinting(false);
        };
        window.addEventListener('afterprint', handleAfterPrint);
        window.print();

        return () => {
            window.removeEventListener('afterprint', handleAfterPrint);
            ledgerPageStyle?.remove();
        };
    }, [printTarget, isLedgerPrinting, ledgerOrientation]);

    const changeClass = (event) => {
        router.get(route('guru.rapor-wali.index'), { kelas_id: event.target.value }, {
            preserveScroll: true,
            replace: true,
        });
    };

    const updateNote = (index, key, value) => {
        form.setData('catatan_rapor', form.data.catatan_rapor.map((note, noteIndex) =>
            noteIndex === index ? { ...note, [key]: value } : note,
        ));
    };

    const updatePredicate = (index, predicate) => {
        form.setData('catatan_rapor', form.data.catatan_rapor.map((note, noteIndex) =>
            noteIndex === index ? {
                ...note,
                kokurikuler_predikat: predicate,
                kokurikuler_deskripsi: generatedDescription(templateKokurikuler, predicate),
            } : note,
        ));
    };

    const saveNotes = (event) => {
        event.preventDefault();
        form.post(route('guru.rapor-wali.store'), { preserveScroll: true });
    };

    const setPrint = (student, mode) => {
        setIsLedgerPrinting(false);
        const semester = tahunAjaran ? {
            ...tahunAjaran,
            mata_pelajaran: mataPelajarans.map((mapel) => ({
                ...mapel,
                ...(student.nilai?.[mapel.id] ?? {}),
            })),
            catatan_rapor: student.catatan_rapor,
        } : {};

        setPrintTarget({
            mode,
            student,
            semester: mode === 'semester' ? semester : null,
        });
    };

    const printLedger = () => {
        setPrintTarget(null);
        setIsLedgerPrinting(true);
    };

    return (
        <DashboardLayout
            title="Rapor Kelas Wali"
            subtitle="Kelola catatan rapor, pantau nilai akhir dan capaian, serta cetak dokumen siswa."
            roleLabel="Wali Kelas"
            navigation={roleNavigationItems('guru', 'rapor-wali', { isWaliKelas: true })}
        >
            <Head title="Rapor Kelas Wali" />

            <div className="flex flex-col gap-5 print:hidden">
                <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-end sm:justify-between">
                    <div className="w-full sm:max-w-xs">
                        <label htmlFor="kelas-rapor-wali" className="mb-2 block text-sm font-semibold text-slate-700">Pilih kelas wali</label>
                        <select
                            id="kelas-rapor-wali"
                            value={selectedKelasId}
                            onChange={changeClass}
                            disabled={kelasOptions.length === 0}
                            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-slate-100"
                        >
                            <option value="">Belum ada kelas wali</option>
                            {kelasOptions.map((option) => (
                                <option key={option.id} value={option.id}>{option.nama_kelas}</option>
                            ))}
                        </select>
                    </div>
                    <div className="text-sm text-slate-600">
                        <p>{tahunAjaranAktif ?? 'Tahun ajaran aktif belum ditetapkan'}</p>
                        <p className="mt-1">Wali kelas: {namaWaliKelas ?? '—'}{waliNiky ? ` · NIKY ${waliNiky}` : ''}</p>
                    </div>
                </section>

                {kelas ? (
                    <form onSubmit={saveNotes} className="flex flex-col gap-5">
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="font-bold text-slate-900">Catatan Kokurikuler dan Rapor Wali</h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Pilih predikat untuk membuat deskripsi otomatis; deskripsi dapat disunting sebelum disimpan.
                                    </p>
                                </div>
                                <button
                                    type="submit"
                                    disabled={form.processing || siswas.length === 0}
                                    className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {form.processing ? 'Menyimpan...' : 'Simpan Catatan Rapor'}
                                </button>
                            </div>

                            {siswas.length === 0 ? (
                                <p className="py-8 text-center text-sm text-slate-500">Belum ada siswa aktif di kelas ini.</p>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {siswas.map((siswa, index) => {
                                        const note = form.data.catatan_rapor[index] ?? {};
                                        const isExpanded = Boolean(expandedStudents[siswa.id]);
                                        const isComplete = noteIsComplete(note);
                                        const panelId = `catatan-siswa-${siswa.id}`;

                                        return (
                                            <article key={siswa.id} className="rounded-xl border border-slate-200">
                                                <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h3 className="text-sm font-bold text-slate-900">{siswa.nama_lengkap}</h3>
                                                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                                                isComplete
                                                                    ? 'bg-emerald-50 text-emerald-700'
                                                                    : 'bg-amber-50 text-amber-700'
                                                            }`}>
                                                                {isComplete ? 'Sudah Diisi' : 'Belum Diisi'}
                                                            </span>
                                                        </div>
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            NISN {siswa.nisn || '—'} · Total Nilai {siswa.has_nilai ? siswa.jumlah_nilai : '—'} · Ranking {siswa.ranking ?? '—'}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <button type="button" onClick={() => setPrint(siswa, 'identity')} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-slate-50">
                                                            Cetak Identitas Murid (1 Halaman)
                                                        </button>
                                                        <button type="button" onClick={() => setPrint(siswa, 'semester')} disabled={!tahunAjaran} className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
                                                            Cetak Rapor Semester (2 Halaman)
                                                        </button>
                                                        <button
                                                            type="button"
                                                            aria-expanded={isExpanded}
                                                            aria-controls={panelId}
                                                            onClick={() => setExpandedStudents((current) => ({
                                                                ...current,
                                                                [siswa.id]: !current[siswa.id],
                                                            }))}
                                                            className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                                                        >
                                                            {isExpanded ? 'Tutup Catatan ▲' : 'Input Catatan ▼'}
                                                        </button>
                                                    </div>
                                                </div>

                                                {isExpanded && (
                                                    <div id={panelId} className="border-t border-slate-100 p-4">
                                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                                                            <div className="space-y-4">
                                                                <div>
                                                                    <label htmlFor={`predikat-${siswa.id}`} className="mb-1.5 block text-xs font-semibold text-slate-700">Predikat Kokurikuler</label>
                                                                    <select
                                                                        id={`predikat-${siswa.id}`}
                                                                        value={note.kokurikuler_predikat}
                                                                        onChange={(event) => updatePredicate(index, event.target.value)}
                                                                        className="block w-full rounded-lg border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                                    >
                                                                        <option value="">Pilih predikat</option>
                                                                        {predicates.map((predicate) => <option key={predicate} value={predicate}>{predicate}</option>)}
                                                                    </select>
                                                                    <InputError message={form.errors[`catatan_rapor.${index}.kokurikuler_predikat`]} className="mt-1" />
                                                                </div>
                                                                <div className="space-y-2 rounded-lg bg-slate-50 p-3">
                                                                    {[1, 2, 3, 4].map((number) => (
                                                                        <div key={number} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                                                                            <label htmlFor={`ekstra-nama-${number}-${siswa.id}`} className="text-xs font-semibold text-slate-700 sm:col-span-2">
                                                                                Ekstra {number}
                                                                            </label>
                                                                            <div className="sm:col-span-6">
                                                                                <select
                                                                                    id={`ekstra-nama-${number}-${siswa.id}`}
                                                                                    aria-label={`Nama Kegiatan Ekstrakurikuler ${number}`}
                                                                                    value={note[`ekstra_${number}_nama`]}
                                                                                    onChange={(event) => updateNote(index, `ekstra_${number}_nama`, event.target.value)}
                                                                                    className="block w-full rounded-lg border-slate-300 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                                                >
                                                                                    <option value="">Pilih ekstrakurikuler</option>
                                                                                    {ekstrakurikulers.map((ekstrakurikuler) => (
                                                                                        <option key={ekstrakurikuler.id} value={ekstrakurikuler.nama_ekstra}>
                                                                                            {ekstrakurikuler.nama_ekstra}
                                                                                        </option>
                                                                                    ))}
                                                                                    {note[`ekstra_${number}_nama`]
                                                                                        && !ekstrakurikulers.some((item) => item.nama_ekstra === note[`ekstra_${number}_nama`])
                                                                                        && (
                                                                                            <option value={note[`ekstra_${number}_nama`]}>
                                                                                                {note[`ekstra_${number}_nama`]} (nonaktif)
                                                                                            </option>
                                                                                        )}
                                                                                </select>
                                                                                <InputError
                                                                                    message={form.errors[`catatan_rapor.${index}.ekstra_${number}_nama`]}
                                                                                    className="mt-1"
                                                                                />
                                                                            </div>
                                                                            <div className="sm:col-span-4">
                                                                                <select
                                                                                    id={`ekstra-predikat-${number}-${siswa.id}`}
                                                                                    aria-label={`Predikat Ekstrakurikuler ${number}`}
                                                                                    value={note[`ekstra_${number}_ket`]}
                                                                                    onChange={(event) => updateNote(index, `ekstra_${number}_ket`, event.target.value)}
                                                                                    className="block w-full rounded-lg border-slate-300 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                                                >
                                                                                    <option value="">Pilih predikat</option>
                                                                                    {predicates.map((predicate) => (
                                                                                        <option key={predicate} value={predicate}>{predicate}</option>
                                                                                    ))}
                                                                                </select>
                                                                                <InputError
                                                                                    message={form.errors[`catatan_rapor.${index}.ekstra_${number}_ket`]}
                                                                                    className="mt-1"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="space-y-3">
                                                                <div>
                                                                    <label htmlFor={`deskripsi-${siswa.id}`} className="mb-1.5 block text-xs font-semibold text-slate-700">Deskripsi Kokurikuler</label>
                                                                    <textarea
                                                                        id={`deskripsi-${siswa.id}`}
                                                                        rows="3"
                                                                        maxLength="5000"
                                                                        value={note.kokurikuler_deskripsi}
                                                                        onChange={(event) => updateNote(index, 'kokurikuler_deskripsi', event.target.value)}
                                                                        className="block w-full rounded-lg border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                                    />
                                                                    <InputError message={form.errors[`catatan_rapor.${index}.kokurikuler_deskripsi`]} className="mt-1" />
                                                                </div>
                                                                <div>
                                                                    <label htmlFor={`catatan-wali-${siswa.id}`} className="mb-1.5 block text-xs font-semibold text-slate-700">Catatan Wali Kelas</label>
                                                                    <textarea
                                                                        id={`catatan-wali-${siswa.id}`}
                                                                        rows="2"
                                                                        maxLength="5000"
                                                                        value={note.catatan_wali_kelas}
                                                                        onChange={(event) => updateNote(index, 'catatan_wali_kelas', event.target.value)}
                                                                        className="block w-full rounded-lg border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                                    />
                                                                    <InputError message={form.errors[`catatan_rapor.${index}.catatan_wali_kelas`]} className="mt-1" />
                                                                </div>
                                                                <div>
                                                                    <p className="mb-1.5 text-xs font-semibold text-slate-700">Ketidakhadiran (hari)</p>
                                                                    <div className="grid grid-cols-3 gap-2">
                                                                        {[
                                                                            ['sakit', 'Sakit'],
                                                                            ['izin', 'Izin'],
                                                                            ['tanpa_keterangan', 'Alpa'],
                                                                        ].map(([key, label]) => (
                                                                            <label key={key} className="text-xs text-slate-600">
                                                                                {label}
                                                                                <input
                                                                                    type="number"
                                                                                    min="0"
                                                                                    max="366"
                                                                                    value={note[key]}
                                                                                    onChange={(event) => updateNote(index, key, event.target.value)}
                                                                                    className="mt-1 block w-full rounded-lg border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                                                />
                                                                                <InputError message={form.errors[`catatan_rapor.${index}.${key}`]} className="mt-1" />
                                                                            </label>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                {hasPromotionTerm && (
                                                                    <div className="grid grid-cols-2 gap-3">
                                                                        <div>
                                                                            <label htmlFor={`kenaikan-${siswa.id}`} className="mb-1.5 block text-xs font-semibold text-slate-700">Kenaikan Kelas</label>
                                                                            <select
                                                                                id={`kenaikan-${siswa.id}`}
                                                                                value={note.status_kenaikan}
                                                                                onChange={(event) => updateNote(index, 'status_kenaikan', event.target.value)}
                                                                                className="block w-full rounded-lg border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                                            >
                                                                                <option value="">Belum ditentukan</option>
                                                                                <option value="naik">Naik</option>
                                                                                <option value="tidak_naik">Tidak Naik</option>
                                                                            </select>
                                                                            <InputError message={form.errors[`catatan_rapor.${index}.status_kenaikan`]} className="mt-1" />
                                                                        </div>
                                                                        <div>
                                                                            <label htmlFor={`kelas-tujuan-${siswa.id}`} className="mb-1.5 block text-xs font-semibold text-slate-700">Naik ke Kelas</label>
                                                                            <input
                                                                                id={`kelas-tujuan-${siswa.id}`}
                                                                                value={note.naik_ke_kelas}
                                                                                onChange={(event) => updateNote(index, 'naik_ke_kelas', event.target.value)}
                                                                                disabled={note.status_kenaikan !== 'naik'}
                                                                                className="block w-full rounded-lg border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-slate-100"
                                                                            />
                                                                            <InputError message={form.errors[`catatan_rapor.${index}.naik_ke_kelas`]} className="mt-1" />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </article>
                                        );
                                    })}
                                </div>
                            )}
                        </section>

                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="font-bold text-slate-900">Tabel Leger Rekap Nilai Kelas</h2>
                                    <p className="text-sm text-slate-500">{kelas} {fase ? `· Fase ${fase}` : ''} · {siswas.length} murid</p>
                                </div>
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                    <label htmlFor="orientasi-leger" className="text-xs font-semibold text-slate-600">
                                        Orientasi cetak
                                    </label>
                                    <select
                                        id="orientasi-leger"
                                        value={ledgerOrientation}
                                        onChange={(event) => setLedgerOrientation(event.target.value)}
                                        className="rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="landscape">Landscape (Disarankan)</option>
                                        <option value="portrait">Portrait</option>
                                    </select>
                                    <button
                                        type="button"
                                        onClick={printLedger}
                                        disabled={siswas.length === 0}
                                        className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Cetak Leger Kelas
                                    </button>
                                </div>
                            </div>
                            {siswas.length === 0 ? (
                                <p className="py-10 text-center text-sm text-slate-500">Belum ada siswa aktif di kelas ini.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="report-table min-w-max border-collapse text-[10px]">
                                        <thead>
                                            <tr>
                                                <th rowSpan="3" className="border border-slate-400 bg-slate-100 px-2 py-2">No</th>
                                                <th rowSpan="3" className="border border-slate-400 bg-slate-100 px-2 py-2">Nama Murid</th>
                                                <th rowSpan="3" className="border border-slate-400 bg-slate-100 px-2 py-2">NISN</th>
                                                {groupedSubjects.map((group) => (
                                                    <LegendGroup key={group.key} group={group} />
                                                ))}
                                                <th colSpan="2" className="border border-slate-400 bg-emerald-100 px-2 py-2">Kokurikuler</th>
                                                <th colSpan="2" className="border border-slate-400 bg-amber-100 px-2 py-2">Ekstrakurikuler 1</th>
                                                <th colSpan="2" className="border border-slate-400 bg-amber-100 px-2 py-2">Ekstrakurikuler 2</th>
                                                <th colSpan="2" className="border border-slate-400 bg-amber-100 px-2 py-2">Ekstrakurikuler 3</th>
                                                <th colSpan="2" className="border border-slate-400 bg-amber-100 px-2 py-2">Ekstrakurikuler 4</th>
                                                <th colSpan="3" className="border border-slate-400 bg-sky-100 px-2 py-2">Ketidakhadiran</th>
                                                <th rowSpan="3" className="border border-slate-400 bg-slate-100 px-2 py-2">Catatan Wali Kelas</th>
                                                <th rowSpan="3" className="border border-slate-400 bg-slate-100 px-2 py-2">Jumlah Nilai</th>
                                                <th rowSpan="3" className="border border-slate-400 bg-slate-100 px-2 py-2">Ranking</th>
                                                <th rowSpan="3" className="border border-slate-400 bg-slate-100 px-2 py-2 print:hidden">Cetak</th>
                                            </tr>
                                            <tr>
                                                {groupedSubjects.map((group) => group.subjects.length === 0 ? (
                                                    <th key={group.key} rowSpan="2" className={`border border-slate-400 px-2 py-2 ${group.subjectClass}`}>—</th>
                                                ) : group.subjects.map((mapel) => (
                                                    <th key={mapel.id} colSpan="2" className={`border border-slate-400 px-2 py-2 ${group.subjectClass}`}>{mapel.nama_mapel}</th>
                                                )))}
                                                <th rowSpan="2" className="border border-slate-400 px-2 py-2">Predikat</th>
                                                <th rowSpan="2" className="border border-slate-400 px-2 py-2">Deskripsi Otomatis</th>
                                                <th rowSpan="2" className="border border-slate-400 px-2 py-2">Nama</th>
                                                <th rowSpan="2" className="border border-slate-400 px-2 py-2">Keterangan</th>
                                                <th rowSpan="2" className="border border-slate-400 px-2 py-2">Nama</th>
                                                <th rowSpan="2" className="border border-slate-400 px-2 py-2">Keterangan</th>
                                                <th rowSpan="2" className="border border-slate-400 px-2 py-2">Nama</th>
                                                <th rowSpan="2" className="border border-slate-400 px-2 py-2">Keterangan</th>
                                                <th rowSpan="2" className="border border-slate-400 px-2 py-2">Nama</th>
                                                <th rowSpan="2" className="border border-slate-400 px-2 py-2">Keterangan</th>
                                                <th rowSpan="2" className="border border-slate-400 px-2 py-2">Sakit</th>
                                                <th rowSpan="2" className="border border-slate-400 px-2 py-2">Izin</th>
                                                <th rowSpan="2" className="border border-slate-400 px-2 py-2">Tanpa Keterangan</th>
                                            </tr>
                                            <tr>
                                                {groupedSubjects.flatMap((group) => group.subjects.flatMap((mapel) => (
                                                    [
                                                        <th key={`${mapel.id}-na`} className={`border border-slate-400 px-2 py-2 ${group.subjectClass}`}>NA</th>,
                                                        <th key={`${mapel.id}-capaian`} className={`border border-slate-400 px-2 py-2 ${group.subjectClass}`}>Capaian</th>,
                                                    ]
                                                )))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {siswas.map((siswa, index) => (
                                                <tr key={siswa.id}>
                                                    <td className="border border-slate-400 px-2 py-2 text-center">{index + 1}</td>
                                                    <td className="min-w-40 border border-slate-400 px-2 py-2">{siswa.nama_lengkap}</td>
                                                    <td className="border border-slate-400 px-2 py-2">{siswa.nisn}</td>
                                                    {groupedSubjects.map((group) => group.subjects.length === 0 ? (
                                                        <td key={group.key} className="border border-slate-400 px-2 py-2 text-center">—</td>
                                                    ) : group.subjects.flatMap((mapel) => (
                                                        [
                                                            <td key={`${mapel.id}-na`} className="border border-slate-400 px-2 py-2 text-center">{siswa.nilai?.[mapel.id]?.nilai_akhir ?? '—'}</td>,
                                                            <td key={`${mapel.id}-capaian`} className="min-w-36 border border-slate-400 px-2 py-2">{siswa.nilai?.[mapel.id]?.capaian_kompetensi ?? '—'}</td>,
                                                        ]
                                                    )))}
                                                    <td className="border border-slate-400 px-2 py-2">{siswa.catatan_rapor.kokurikuler_predikat ?? '—'}</td>
                                                    <td className="min-w-48 border border-slate-400 px-2 py-2">{siswa.catatan_rapor.kokurikuler_deskripsi ?? '—'}</td>
                                                    <td className="border border-slate-400 px-2 py-2">{siswa.catatan_rapor.ekstra_1_nama ?? '—'}</td>
                                                    <td className="border border-slate-400 px-2 py-2">{siswa.catatan_rapor.ekstra_1_ket ?? '—'}</td>
                                                    <td className="border border-slate-400 px-2 py-2">{siswa.catatan_rapor.ekstra_2_nama ?? '—'}</td>
                                                    <td className="border border-slate-400 px-2 py-2">{siswa.catatan_rapor.ekstra_2_ket ?? '—'}</td>
                                                    <td className="border border-slate-400 px-2 py-2">{siswa.catatan_rapor.ekstra_3_nama ?? '—'}</td>
                                                    <td className="border border-slate-400 px-2 py-2">{siswa.catatan_rapor.ekstra_3_ket ?? '—'}</td>
                                                    <td className="border border-slate-400 px-2 py-2">{siswa.catatan_rapor.ekstra_4_nama ?? '—'}</td>
                                                    <td className="border border-slate-400 px-2 py-2">{siswa.catatan_rapor.ekstra_4_ket ?? '—'}</td>
                                                    <td className="border border-slate-400 px-2 py-2 text-center">{siswa.catatan_rapor.sakit}</td>
                                                    <td className="border border-slate-400 px-2 py-2 text-center">{siswa.catatan_rapor.izin}</td>
                                                    <td className="border border-slate-400 px-2 py-2 text-center">{siswa.catatan_rapor.tanpa_keterangan}</td>
                                                    <td className="min-w-40 border border-slate-400 px-2 py-2">{siswa.catatan_rapor.catatan_wali_kelas ?? '—'}</td>
                                                    <td className="border border-slate-400 px-2 py-2 text-center font-bold">{siswa.has_nilai ? siswa.jumlah_nilai : '—'}</td>
                                                    <td className="border border-slate-400 px-2 py-2 text-center font-bold">{siswa.ranking ?? '—'}</td>
                                                    <td className="print:hidden border border-slate-400 px-2 py-2">
                                                        <div className="flex min-w-48 flex-col gap-1">
                                                            <button type="button" onClick={() => setPrint(siswa, 'identity')} className="rounded bg-indigo-50 px-2 py-1 text-left text-[10px] font-semibold text-indigo-700 hover:bg-indigo-100">
                                                                Cetak Identitas Murid (1 Halaman)
                                                            </button>
                                                            <button type="button" onClick={() => setPrint(siswa, 'semester')} disabled={!tahunAjaran} className="rounded bg-indigo-600 px-2 py-1 text-left text-[10px] font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
                                                                Cetak Rapor Semester (2 Halaman)
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            <InputError message={form.errors.kelas_id} className="mt-3" />
                        </section>
                    </form>
                ) : (
                    <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center shadow-sm">
                        <p className="text-sm text-slate-500">Belum ada kelas yang ditetapkan sebagai kelas wali pada tahun ajaran aktif.</p>
                    </section>
                )}
            </div>

            {printTarget && (
                <StudentReportDocument
                    mode={printTarget.mode}
                    student={printTarget.student}
                    settings={pengaturanSekolah}
                    semester={printTarget.semester}
                />
            )}
            {isLedgerPrinting && (
                <ClassLedgerPrintDocument
                    settings={pengaturanSekolah}
                    orientation={ledgerOrientation}
                    kelas={kelas}
                    fase={fase}
                    namaWaliKelas={namaWaliKelas}
                    waliNiky={waliNiky}
                    tahunAjaran={tahunAjaran}
                    mataPelajarans={mataPelajarans}
                    siswas={siswas}
                />
            )}
        </DashboardLayout>
    );
}
