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
            presensi_manual_sakit: note.presensi_manual_sakit ?? null,
            presensi_manual_izin: note.presensi_manual_izin ?? null,
            presensi_manual_tanpa_keterangan: note.presensi_manual_tanpa_keterangan ?? null,
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
    waliKelasName = '',
    tahunAjaran = null,
    tahunAjaranAktif = null,
    templateKokurikuler = '',
    ekstrakurikulers = [],
    mataPelajarans = [],
    monitoringNilai = [],
    siswas = [],
}) {
    const { pengaturanSekolah = {} } = usePage().props;
    const [activeTab, setActiveTab] = useState('monitoring');
    const [printTarget, setPrintTarget] = useState(null);
    const [isLedgerPrinting, setIsLedgerPrinting] = useState(false);
    const [ledgerPrintSiswas, setLedgerPrintSiswas] = useState([]);
    const [ledgerOrientation, setLedgerOrientation] = useState('landscape');
    const [selectedPrintStudentId, setSelectedPrintStudentId] = useState('all');
    const [isLedgerTableExpanded, setIsLedgerTableExpanded] = useState(true);
    const [expandedStudentIds, setExpandedStudentIds] = useState(() => new Set());
    const form = useForm({
        kelas_id: selectedKelasId,
        catatan_rapor: initialNotes(siswas, templateKokurikuler),
    });
    const groupedSubjects = useMemo(() => subjectGroups.map((group) => ({
        ...group,
        subjects: mataPelajarans.filter((mapel) => mapel.kelompok_mapel === group.key),
    })), [mataPelajarans]);
    const hasPromotionTerm = tahunAjaran?.semester === 'genap';
    const selectedPrintStudent = siswas.find((siswa) => String(siswa.id) === selectedPrintStudentId);
    const selectedPrintStudents = selectedPrintStudentId === 'all' || !selectedPrintStudent
        ? siswas
        : [selectedPrintStudent];
    const printSelectionId = selectedPrintStudent ? selectedPrintStudentId : 'all';

    useEffect(() => {
        form.setData({
            kelas_id: selectedKelasId,
            catatan_rapor: initialNotes(siswas, templateKokurikuler),
        });
        form.clearErrors();
    }, [siswas, selectedKelasId, templateKokurikuler]);

    useEffect(() => {
        setExpandedStudentIds(new Set());
    }, [selectedKelasId]);

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
            setLedgerPrintSiswas([]);
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

    const toggleStudentCard = (studentId) => {
        setExpandedStudentIds((current) => {
            const next = new Set(current);

            if (next.has(studentId)) {
                next.delete(studentId);
            } else {
                next.add(studentId);
            }

            return next;
        });
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

    const updateAttendance = (index, key, manualKey, value) => {
        form.setData('catatan_rapor', form.data.catatan_rapor.map((note, noteIndex) =>
            noteIndex === index
                ? { ...note, [key]: value, [manualKey]: value }
                : note,
        ));
    };

    const saveNotes = (event) => {
        event.preventDefault();
        form.post(route('guru.rapor-wali.store'), {
            preserveScroll: true,
            onError: (errors) => {
                const erroredStudentIds = Object.keys(errors)
                    .map((key) => key.match(/^catatan_rapor\.(\d+)\./))
                    .map((match) => match ? siswas[Number(match[1])]?.id : null)
                    .filter((studentId) => studentId !== null && studentId !== undefined);

                if (erroredStudentIds.length > 0) {
                    setExpandedStudentIds(new Set(erroredStudentIds));
                }

                if (Object.keys(errors).some((key) => key.includes('.ekstra_'))) {
                    setActiveTab('ekstrakurikuler');
                } else {
                    setActiveTab('absensi');
                }
            },
        });
    };

    const setPrint = (mode) => {
        setIsLedgerPrinting(false);
        setPrintTarget({
            mode,
            documents: selectedPrintStudents.map((student) => ({
                student,
                semester: mode === 'semester' && tahunAjaran ? {
                    ...tahunAjaran,
                    tahun_ajaran: tahunAjaran.nama_tahun,
                    mata_pelajaran: mataPelajarans.map((mapel) => ({
                        ...mapel,
                        ...(student.nilai?.[mapel.id] ?? {}),
                    })),
                    catatan_rapor: student.catatan_rapor,
                } : {},
            })),
        });
    };

    const printLedger = () => {
        setPrintTarget(null);
        setLedgerPrintSiswas(selectedPrintStudents);
        setIsLedgerPrinting(true);
    };

    return (
        <DashboardLayout
            title="Rapor Kelas Wali"
            subtitle="Kelola catatan rapor, pantau nilai akhir dan capaian, serta cetak dokumen siswa."
            roleLabel="Wali Kelas"
            navigation={roleNavigationItems('guru', 'rapor-wali', { isWaliKelas: kelasOptions.length > 0, waliKelasName })}
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
                    <>
                        <nav className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm lg:grid-cols-4" role="tablist" aria-label="Rapor kelas wali">
                            {[
                                ['monitoring', 'Monitoring Nilai Mapel'],
                                ['absensi', 'Rekap Absensi & Catatan'],
                                ['ekstrakurikuler', 'Ekstrakurikuler'],
                                ['cetak', 'Cetak Rapor & Leger'],
                            ].map(([tab, label]) => (
                                <button
                                    key={tab}
                                    type="button"
                                    role="tab"
                                    aria-selected={activeTab === tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                                        activeTab === tab
                                            ? 'bg-indigo-600 text-white'
                                            : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </nav>

                        {activeTab === 'monitoring' && (
                            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                                <div className="mb-5">
                                    <h2 className="font-bold text-slate-900">Monitoring Kelengkapan Nilai Mapel</h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Status menunjukkan jumlah siswa aktif yang sudah memiliki nilai akhir pada tahun ajaran aktif.
                                    </p>
                                </div>
                                {monitoringNilai.length === 0 ? (
                                    <p className="py-8 text-center text-sm text-slate-500">Belum ada mata pelajaran pada jadwal kelas ini.</p>
                                ) : (
                                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                                        <table className="min-w-full divide-y divide-slate-100 text-left">
                                            <thead className="bg-slate-50">
                                                <tr>
                                                    {['Mata Pelajaran', 'Guru Mapel', 'Nilai Terisi', 'Status'].map((heading) => (
                                                        <th key={heading} className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                            {heading}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {monitoringNilai.map((mapel) => {
                                                    const status = {
                                                        lengkap: ['Lengkap', 'bg-emerald-100 text-emerald-800'],
                                                        sebagian: ['Sebagian', 'bg-amber-100 text-amber-800'],
                                                        belum: ['Belum Input', 'bg-red-100 text-red-800'],
                                                    }[mapel.status] ?? ['Belum Input', 'bg-red-100 text-red-800'];

                                                    return (
                                                        <tr key={mapel.id}>
                                                            <td className="px-4 py-4">
                                                                <p className="text-sm font-semibold text-slate-800">{mapel.nama_mapel}</p>
                                                                <p className="text-xs text-slate-500">{mapel.kode_mapel}</p>
                                                            </td>
                                                            <td className="px-4 py-4 text-sm text-slate-600">{mapel.nama_guru ?? '—'}</td>
                                                            <td className="px-4 py-4 text-sm text-slate-700">
                                                                {mapel.siswa_terisi} / {mapel.jumlah_siswa} siswa
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <span className={`rounded-full px-3 py-1 text-xs font-bold ${status[1]}`}>{status[0]}</span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </section>
                        )}

                        {activeTab !== 'monitoring' && (
                    <form onSubmit={saveNotes} className="flex flex-col gap-5">
                        {activeTab !== 'cetak' && (
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="font-bold text-slate-900">
                                        {activeTab === 'absensi' ? 'Rekap Absensi & Catatan Wali Kelas' : 'Input Ekstrakurikuler Siswa'}
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        {activeTab === 'absensi'
                                            ? 'Jumlah ketidakhadiran dihitung dari presensi dan dapat disesuaikan secara manual.'
                                            : 'Pilih kegiatan dari master ekstrakurikuler aktif dan tentukan predikat setiap siswa.'}
                                    </p>
                                </div>
                                <button
                                    type="submit"
                                    disabled={form.processing || siswas.length === 0}
                                    className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {form.processing
                                        ? 'Menyimpan...'
                                        : activeTab === 'absensi'
                                            ? 'Simpan Catatan Rapor'
                                            : 'Simpan Ekstrakurikuler'}
                                </button>
                            </div>

                            {siswas.length === 0 ? (
                                <p className="py-8 text-center text-sm text-slate-500">Belum ada siswa aktif di kelas ini.</p>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {siswas.map((siswa, index) => {
                                        const note = form.data.catatan_rapor[index] ?? {};
                                        const isComplete = noteIsComplete(note);
                                        const isExpanded = expandedStudentIds.has(siswa.id);

                                        return (
                                            <article key={siswa.id} className="rounded-xl border border-slate-200">
                                                <button
                                                    type="button"
                                                    aria-expanded={isExpanded}
                                                    aria-controls={`catatan-siswa-${siswa.id}`}
                                                    aria-label={`${isExpanded ? 'Tutup' : 'Buka'} data ${siswa.nama_lengkap}`}
                                                    onClick={() => toggleStudentCard(siswa.id)}
                                                    className="flex w-full flex-col gap-3 rounded-xl p-4 text-left hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 lg:flex-row lg:items-center lg:justify-between"
                                                >
                                                    <span className="min-w-0 flex-1">
                                                        <span className="flex flex-wrap items-center gap-2">
                                                            <span className="text-sm font-bold text-slate-900">{siswa.nama_lengkap}</span>
                                                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                                                isComplete
                                                                    ? 'bg-emerald-50 text-emerald-700'
                                                                    : 'bg-amber-50 text-amber-700'
                                                            }`}>
                                                                {isComplete ? 'Sudah Diisi' : 'Belum Diisi'}
                                                            </span>
                                                        </span>
                                                        <span className="mt-1 block text-xs text-slate-500">
                                                            NISN {siswa.nisn || '—'} · Total Nilai {siswa.has_nilai ? siswa.jumlah_nilai : '—'} · Ranking {siswa.ranking ?? '—'}
                                                        </span>
                                                    </span>
                                                    <span className="inline-flex shrink-0 items-center gap-2 text-xs font-semibold text-slate-600">
                                                        {isExpanded ? 'Tutup' : 'Buka'}
                                                        <span aria-hidden="true" className="text-lg leading-none">
                                                            {isExpanded ? '−' : '+'}
                                                        </span>
                                                    </span>
                                                </button>

                                                <div id={`catatan-siswa-${siswa.id}`} hidden={!isExpanded} className="border-t border-slate-100 p-4">
                                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                                                            <div className="space-y-4">
                                                                {activeTab === 'absensi' && (
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
                                                                )}
                                                                {activeTab === 'ekstrakurikuler' && (
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
                                                                )}
                                                            </div>
                                                            <div className="space-y-3">
                                                                {activeTab === 'absensi' && (
                                                                <>
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
                                                                            ['sakit', 'Sakit', 'presensi_manual_sakit'],
                                                                            ['izin', 'Izin', 'presensi_manual_izin'],
                                                                            ['tanpa_keterangan', 'Alpa', 'presensi_manual_tanpa_keterangan'],
                                                                        ].map(([key, label, manualKey]) => (
                                                                            <label key={key} className="text-xs text-slate-600">
                                                                                {label}
                                                                                <input
                                                                                    type="number"
                                                                                    min="0"
                                                                                    max="366"
                                                                                    value={note[key]}
                                                                                    onChange={(event) => updateAttendance(index, key, manualKey, event.target.value)}
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
                                                                </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                        )}
                        {activeTab === 'cetak' && (
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                            <div className="mb-4 flex flex-col gap-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h2 className="font-bold text-slate-900">Tabel Leger Rekap Nilai Kelas</h2>
                                        <p className="text-sm text-slate-500">{kelas} {fase ? `· Fase ${fase}` : ''} · {siswas.length} murid</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsLedgerTableExpanded((expanded) => !expanded)}
                                        aria-expanded={isLedgerTableExpanded}
                                        aria-controls="tabel-leger-kelas"
                                        disabled={siswas.length === 0}
                                        className="self-start rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                    >
                                        {isLedgerTableExpanded ? 'Sembunyikan tabel' : 'Tampilkan tabel'}
                                    </button>
                                </div>
                                <div className="grid gap-3 lg:grid-cols-[minmax(12rem,1fr)_auto] lg:items-end">
                                    <div>
                                        <label htmlFor="siswa-cetak-rapor-wali" className="mb-1.5 block text-xs font-semibold text-slate-600">
                                            Pilih siswa untuk dicetak
                                        </label>
                                        <select
                                            id="siswa-cetak-rapor-wali"
                                            value={printSelectionId}
                                            onChange={(event) => setSelectedPrintStudentId(event.target.value)}
                                            disabled={siswas.length === 0}
                                            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-slate-100"
                                        >
                                            <option value="all">Semua siswa</option>
                                            {siswas.map((siswa) => (
                                                <option key={siswa.id} value={String(siswa.id)}>
                                                    {siswa.nama_lengkap}{siswa.nisn ? ` · ${siswa.nisn}` : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Pilih satu siswa atau semua siswa untuk identitas, rapor, maupun leger.
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setPrint('identity')}
                                            disabled={selectedPrintStudents.length === 0}
                                            className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Cetak Identitas Murid
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPrint('semester')}
                                            disabled={!tahunAjaran || selectedPrintStudents.length === 0}
                                            className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Cetak Rapor Semester
                                        </button>
                                        <div className="flex items-center gap-2">
                                            <label htmlFor="orientasi-leger" className="text-xs font-semibold text-slate-600">
                                                Orientasi
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
                                        </div>
                                        <button
                                            type="button"
                                            onClick={printLedger}
                                            disabled={selectedPrintStudents.length === 0}
                                            className="rounded-xl bg-slate-800 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Cetak Leger Kelas
                                        </button>
                                    </div>
                                </div>
                            </div>
                            {siswas.length === 0 ? (
                                <p className="py-10 text-center text-sm text-slate-500">Belum ada siswa aktif di kelas ini.</p>
                            ) : (
                                <div id="tabel-leger-kelas" className={isLedgerTableExpanded ? '' : 'hidden'}>
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
                                                </tr>
                                            ))}
                                        </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                            <InputError message={form.errors.kelas_id} className="mt-3" />
                        </section>
                        )}
                    </form>
                        )}
                    </>
                ) : (
                    <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center shadow-sm">
                        <p className="text-sm text-slate-500">Belum ada kelas yang ditetapkan sebagai kelas wali pada tahun ajaran aktif.</p>
                    </section>
                )}
            </div>

            {printTarget && (
                <StudentReportDocument
                    mode={printTarget.mode}
                    settings={pengaturanSekolah}
                    documents={printTarget.documents}
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
                    siswas={ledgerPrintSiswas}
                />
            )}
        </DashboardLayout>
    );
}
