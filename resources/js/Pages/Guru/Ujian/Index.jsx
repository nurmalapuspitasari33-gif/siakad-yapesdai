import {
    AdminDeleteModal,
    AdminResourceModal,
} from '@/Components/AdminResourceModal';
import InputError from '@/Components/InputError';
import ExcelImportPanel from '@/Components/ExcelImportPanel';
import Modal from '@/Components/Modal';
import DashboardLayout from '@/Layouts/DashboardLayout';
import roleNavigationItems from '@/Components/RoleNavigationItems';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

function localDateTimeValue() {
    const date = new Date(Date.now() + 60 * 60 * 1000);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

const emptyQuestion = {
    tipe_soal: 'pg',
    bobot: '1',
    pertanyaan: '',
    opsi_a: '',
    opsi_b: '',
    opsi_c: '',
    opsi_d: '',
    opsi_e: '',
    kunci_jawaban: 'A',
    gambar_soal: null,
    gambar_a: null,
    gambar_b: null,
    gambar_c: null,
    gambar_d: null,
    gambar_e: null,
    opsi_json: {
        opsi: ['', '', '', '', ''],
        pasangan_kiri: ['', '', ''],
        pasangan_kanan: ['', '', ''],
        kunci_jawaban: [],
    },
};

export default function GuruUjianIndex({
    ujians = [],
    kelasOptions = [],
    mapelOptions = [],
    assignments = [],
    tahunAjaranAktif = null,
    isWaliKelas = false,
    waliKelasName = '',
}) {
    const [isExamModalOpen, setIsExamModalOpen] = useState(false);
    const [editingExam, setEditingExam] = useState(null);
    const [deletingExam, setDeletingExam] = useState(null);
    const [questionExamId, setQuestionExamId] = useState(null);
    const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [deletingQuestion, setDeletingQuestion] = useState(null);
    const examForm = useForm({
        kelas_id: '',
        mapel_id: '',
        judul_ujian: '',
        waktu_mulai: localDateTimeValue(),
        durasi_menit: '60',
        acak_soal: false,
        mode_ujian: 'normal',
        maks_pelanggaran: 3,
    });
    const questionForm = useForm(emptyQuestion);
    const examDeleteForm = useForm({});
    const questionDeleteForm = useForm({});
    const currentExam = ujians.find((ujian) => ujian.id === questionExamId) ?? null;
    const currentExamQuestions = currentExam?.bank_soals ?? [];
    const examModeLocked = Boolean(editingExam?.bank_soals?.length);
    const questionOptionImageFields = ['pg', 'pg_kompleks'].includes(questionForm.data.tipe_soal)
        ? ['a', 'b', 'c', 'd', 'e']
        : [];
    const availableMapelOptions = mapelOptions.filter((mapel) =>
        assignments.some((assignment) =>
            String(assignment.kelas_id) === String(examForm.data.kelas_id)
            && String(assignment.mapel_id) === String(mapel.id),
        ),
    );

    const closeExamModal = () => {
        setIsExamModalOpen(false);
        setEditingExam(null);
        examForm.reset();
        examForm.setData('waktu_mulai', localDateTimeValue());
        examForm.clearErrors();
    };

    const openCreateExam = () => {
        setEditingExam(null);
        examForm.setData({
            kelas_id: '',
            mapel_id: '',
            judul_ujian: '',
            waktu_mulai: localDateTimeValue(),
            durasi_menit: '60',
            acak_soal: false,
            mode_ujian: 'normal',
            maks_pelanggaran: 3,
        });
        examForm.clearErrors();
        setIsExamModalOpen(true);
    };

    const openEditExam = (ujian) => {
        setEditingExam(ujian);
        examForm.setData({
            kelas_id: String(ujian.kelas_id),
            mapel_id: String(ujian.mapel_id),
            judul_ujian: ujian.judul_ujian,
            waktu_mulai: ujian.waktu_mulai,
            durasi_menit: String(ujian.durasi_menit),
            acak_soal: ujian.acak_soal,
            mode_ujian: ujian.mode_ujian ?? 'normal',
            maks_pelanggaran: ujian.maks_pelanggaran ?? 3,
        });
        examForm.clearErrors();
        setIsExamModalOpen(true);
    };

    const submitExam = (event) => {
        event.preventDefault();
        const options = { preserveScroll: true, onSuccess: closeExamModal };

        if (editingExam) {
            examForm.put(route('guru.ujian.update', editingExam.id), options);
            return;
        }

        examForm.post(route('guru.ujian.store'), options);
    };

    const openQuestionManager = (ujian) => {
        setQuestionExamId(ujian.id);
        setEditingQuestion(null);
    };

    const closeQuestionModal = () => {
        setQuestionExamId(null);
        setEditingQuestion(null);
        setIsQuestionModalOpen(false);
        questionForm.reset();
        questionForm.clearErrors();
    };

    const openCreateQuestion = () => {
        setEditingQuestion(null);
        questionForm.setData(emptyQuestion);
        questionForm.clearErrors();
        setIsQuestionModalOpen(true);
    };

    const openEditQuestion = (question) => {
        setEditingQuestion(question);
        const matchingOptions = question.tipe_soal === 'menjodohkan'
            ? {
                pasangan_kiri: question.opsi_json?.pasangan_kiri ?? [],
                pasangan_kanan: question.opsi_json?.pasangan_kanan ?? [],
                kunci_jawaban: question.opsi_json?.kunci_jawaban ?? [],
            }
            : null;
        const matchingPairCount = matchingOptions
            ? Math.max(3, matchingOptions.pasangan_kiri.length, matchingOptions.pasangan_kanan.length)
            : 0;

        questionForm.setData({
            ...emptyQuestion,
            tipe_soal: question.tipe_soal ?? 'pg',
            bobot: String(question.bobot ?? 1),
            pertanyaan: question.pertanyaan,
            opsi_a: question.opsi_a,
            opsi_b: question.opsi_b,
            opsi_c: question.opsi_c,
            opsi_d: question.opsi_d,
            opsi_e: question.opsi_e,
            kunci_jawaban: question.kunci_jawaban,
            gambar_soal: null,
            gambar_a: null,
            gambar_b: null,
            gambar_c: null,
            gambar_d: null,
            gambar_e: null,
            opsi_json: {
                ...emptyQuestion.opsi_json,
                ...(question.opsi_json ?? {}),
                ...(matchingOptions ? {
                    pasangan_kiri: Array.from(
                        { length: matchingPairCount },
                        (_, index) => matchingOptions.pasangan_kiri[index] ?? '',
                    ),
                    pasangan_kanan: Array.from(
                        { length: matchingPairCount },
                        (_, index) => matchingOptions.pasangan_kanan[index] ?? '',
                    ),
                    kunci_jawaban: Array.from(
                        { length: matchingPairCount },
                        (_, index) => matchingOptions.kunci_jawaban[index] ?? '',
                    ),
                } : {}),
            },
        });
        questionForm.clearErrors();
        setIsQuestionModalOpen(true);
    };

    const submitQuestion = (event) => {
        event.preventDefault();
        if (!currentExam) {
            return;
        }

        const options = {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                setIsQuestionModalOpen(false);
                setEditingQuestion(null);
                questionForm.reset();
                questionForm.clearErrors();
            },
        };

        if (editingQuestion) {
            questionForm.transform((data) => ({ ...data, _method: 'put' })).post(
                route('guru.ujian.soal.update', [currentExam.id, editingQuestion.id]),
                options,
            );
            return;
        }

        questionForm.transform((data) => data);
        questionForm.post(route('guru.ujian.soal.store', currentExam.id), options);
    };

    const pasteImage = (field, event) => {
        const imageItem = Array.from(event.clipboardData?.items ?? [])
            .find((item) => item.type.startsWith('image/'));

        if (!imageItem) {
            return;
        }

        const blob = imageItem.getAsFile();
        if (!blob) {
            return;
        }

        event.preventDefault();
        questionForm.setData(field, new File([blob], `${field}-${Date.now()}.png`, { type: blob.type }));
    };

    const setQuestionOptionData = (key, value) => {
        questionForm.setData('opsi_json', {
            ...questionForm.data.opsi_json,
            [key]: value,
        });
    };

    const setQuestionType = (type) => {
        const nextData = { ...questionForm.data, tipe_soal: type };

        if (!['pg', 'pg_kompleks'].includes(type)) {
            ['a', 'b', 'c', 'd', 'e'].forEach((option) => {
                nextData[`gambar_${option}`] = null;
            });
        }

        questionForm.setData(nextData);
    };

    const addMatchingPair = () => {
        const options = questionForm.data.opsi_json;
        const pairCount = options.pasangan_kiri.length;
        if (pairCount >= 10) {
            return;
        }

        questionForm.setData('opsi_json', {
            ...options,
            pasangan_kiri: [...options.pasangan_kiri, ''],
            pasangan_kanan: [...options.pasangan_kanan, ''],
            kunci_jawaban: [
                ...Array.from({ length: pairCount }, (_, index) => options.kunci_jawaban[index] ?? ''),
                '',
            ],
        });
    };

    const removeMatchingPair = (removedIndex) => {
        const options = questionForm.data.opsi_json;
        const pairCount = options.pasangan_kiri.length;
        if (pairCount <= 3) {
            return;
        }

        const remainingAnswers = Array.from({ length: pairCount }, (_, index) =>
            options.kunci_jawaban[index] ?? '',
        ).filter((_, index) => index !== removedIndex).map((answer) => {
            if (answer === '') {
                return '';
            }

            const answerIndex = Number(answer);
            if (answerIndex === removedIndex) {
                return '';
            }

            return String(answerIndex > removedIndex ? answerIndex - 1 : answerIndex);
        });

        questionForm.setData('opsi_json', {
            ...options,
            pasangan_kiri: options.pasangan_kiri.filter((_, index) => index !== removedIndex),
            pasangan_kanan: options.pasangan_kanan.filter((_, index) => index !== removedIndex),
            kunci_jawaban: remainingAnswers,
        });
    };

    const deleteExam = () => {
        if (!deletingExam) {
            return;
        }

        examDeleteForm.delete(route('guru.ujian.destroy', deletingExam.id), {
            preserveScroll: true,
            onSuccess: () => setDeletingExam(null),
        });
    };

    const deleteQuestion = () => {
        if (!currentExam || !deletingQuestion) {
            return;
        }

        questionDeleteForm.delete(
            route('guru.ujian.soal.destroy', [currentExam.id, deletingQuestion.id]),
            {
                preserveScroll: true,
                onSuccess: () => setDeletingQuestion(null),
            },
        );
    };

    return (
        <DashboardLayout
            title="Ujian Online"
            subtitle="Jadwalkan ujian untuk kelas yang Anda ampu dan kelola soal pilihan ganda."
            roleLabel="Guru"
            navigation={roleNavigationItems('guru', 'ujian', { isWaliKelas, waliKelasName })}
        >
            <Head title="Ujian Online" />

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                    <div>
                        <h2 className="font-bold text-slate-900">Jadwal ujian</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {tahunAjaranAktif ?? 'Tahun ajaran aktif belum ditetapkan'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={openCreateExam}
                        disabled={assignments.length === 0}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <span className="text-lg leading-none" aria-hidden="true">+</span>
                        Buat Jadwal Ujian
                    </button>
                </div>

                <div className="w-full overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 text-left">
                        <thead className="bg-slate-50">
                            <tr>
                                {['Ujian', 'Kelas', 'Waktu Mulai', 'Durasi', 'Soal', 'Aksi'].map((heading) => (
                                    <th key={heading} className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 first:sm:px-7 last:sm:px-7">
                                        {heading}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {ujians.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-5 py-12 text-center text-sm text-slate-500">
                                        Belum ada jadwal ujian.
                                    </td>
                                </tr>
                            ) : ujians.map((ujian) => (
                                <tr key={ujian.id} className="hover:bg-slate-50/70">
                                    <td className="px-4 py-4 sm:px-7">
                                        <p className="text-sm font-semibold text-slate-900">{ujian.judul_ujian}</p>
                                        <p className="mt-1 text-xs text-slate-500">{ujian.mapel}</p>
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">{ujian.kelas}</td>
                                    <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">{ujian.waktu_mulai_label}</td>
                                    <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">{ujian.durasi_menit} menit</td>
                                    <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-indigo-700">
                                        {(ujian.bank_soals ?? []).length} soal
                                        {ujian.hasil_ujians_count > 0 && (
                                            <span className="mt-1 block text-xs font-normal text-slate-500">
                                                {ujian.hasil_ujians_count} pengerjaan
                                            </span>
                                        )}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-4 sm:px-7">
                                        <div className="flex w-max flex-nowrap items-center justify-end gap-1">
                                            <Link
                                                href={route('guru.ujian.hasil', ujian.id)}
                                                className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-lg px-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                                            >
                                                Hasil Ujian
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => openQuestionManager(ujian)}
                                                className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-lg px-2.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                                            >
                                                Kelola Soal
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => openEditExam(ujian)}
                                                className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-lg px-2.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDeletingExam(ujian)}
                                                className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-lg px-2.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                                            >
                                                Hapus
                                            </button>
                                        </div>
                                        {ujian.hasil_ujians_count > 0 && (
                                            <p className="mt-1 text-right text-[11px] leading-4 text-amber-700">
                                                Hasil pengerjaan akan tetap terkait dengan ujian ini.
                                            </p>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <AdminResourceModal
                show={isExamModalOpen}
                title={editingExam ? 'Edit Jadwal Ujian' : 'Buat Jadwal Ujian'}
                description="Pilih pasangan kelas dan mata pelajaran dari jadwal mengajar aktif Anda."
                processing={examForm.processing}
                submitLabel={editingExam ? 'Simpan Perubahan' : 'Buat Ujian'}
                onClose={closeExamModal}
                onSubmit={submitExam}
            >
                {editingExam?.hasil_ujians_count > 0 && (
                    <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-800">
                        Ujian ini sudah memiliki pengerjaan. Perubahan waktu, durasi, kelas, atau mata pelajaran juga mengubah konteks ujian; jawaban dan nilai yang tersimpan tetap ada.
                    </p>
                )}
                <div>
                    <label htmlFor="ujian-kelas" className="mb-2 block text-sm font-semibold text-slate-700">Kelas</label>
                    <select
                        id="ujian-kelas"
                        value={examForm.data.kelas_id}
                        onChange={(event) => examForm.setData({
                            ...examForm.data,
                            kelas_id: event.target.value,
                            mapel_id: '',
                        })}
                        className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                        <option value="">Pilih kelas</option>
                        {kelasOptions.map((kelas) => <option key={kelas.id} value={kelas.id}>{kelas.nama_kelas}</option>)}
                    </select>
                    <InputError message={examForm.errors.kelas_id} className="mt-2" />
                </div>
                <div>
                    <label htmlFor="ujian-mapel" className="mb-2 block text-sm font-semibold text-slate-700">Mata Pelajaran</label>
                    <select
                        id="ujian-mapel"
                        value={examForm.data.mapel_id}
                        onChange={(event) => examForm.setData('mapel_id', event.target.value)}
                        className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                        <option value="">Pilih mata pelajaran</option>
                        {availableMapelOptions.map((mapel) => <option key={mapel.id} value={mapel.id}>{mapel.kode_mapel} · {mapel.nama_mapel}</option>)}
                    </select>
                    <InputError message={examForm.errors.mapel_id} className="mt-2" />
                </div>
                <div>
                    <label htmlFor="judul-ujian" className="mb-2 block text-sm font-semibold text-slate-700">Judul Ujian</label>
                    <input
                        id="judul-ujian"
                        type="text"
                        value={examForm.data.judul_ujian}
                        onChange={(event) => examForm.setData('judul_ujian', event.target.value)}
                        className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <InputError message={examForm.errors.judul_ujian} className="mt-2" />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="waktu-mulai-ujian" className="mb-2 block text-sm font-semibold text-slate-700">Waktu Mulai (WIB)</label>
                        <input
                            id="waktu-mulai-ujian"
                            type="datetime-local"
                            value={examForm.data.waktu_mulai}
                            onChange={(event) => examForm.setData('waktu_mulai', event.target.value)}
                            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <InputError message={examForm.errors.waktu_mulai} className="mt-2" />
                    </div>
                    <div>
                        <label htmlFor="durasi-ujian" className="mb-2 block text-sm font-semibold text-slate-700">Durasi (menit)</label>
                        <input
                            id="durasi-ujian"
                            type="number"
                            min="1"
                            max="360"
                            value={examForm.data.durasi_menit}
                            onChange={(event) => examForm.setData('durasi_menit', event.target.value)}
                            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <InputError message={examForm.errors.durasi_menit} className="mt-2" />
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="mode-ujian" className="mb-2 block text-sm font-semibold text-slate-700">Mode Ujian</label>
                        <select
                            id="mode-ujian"
                            value={examForm.data.mode_ujian}
                            onChange={(event) => examForm.setData('mode_ujian', event.target.value)}
                            disabled={examModeLocked}
                            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="normal">Normal (PG &amp; Esai)</option>
                            <option value="akm">AKM (PG, PG Kompleks, Menjodohkan, Isian Singkat, Esai)</option>
                        </select>
                        {examModeLocked && (
                            <p className="mt-2 text-xs text-slate-500">
                                Mode tidak dapat diubah setelah soal dibuat. Pilih mode yang sesuai sebelum menambahkan soal.
                            </p>
                        )}
                        <InputError message={examForm.errors.mode_ujian} className="mt-2" />
                    </div>
                    <div>
                        <label htmlFor="maks-pelanggaran" className="mb-2 block text-sm font-semibold text-slate-700">Batas pelanggaran layar</label>
                        <input
                            id="maks-pelanggaran"
                            type="number"
                            min="1"
                            value={examForm.data.maks_pelanggaran}
                            onChange={(event) => examForm.setData('maks_pelanggaran', event.target.value)}
                            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <InputError message={examForm.errors.maks_pelanggaran} className="mt-2" />
                    </div>
                </div>
                <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
                    <input
                        type="checkbox"
                        checked={examForm.data.acak_soal}
                        onChange={(event) => examForm.setData('acak_soal', event.target.checked)}
                        className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>
                        <span className="block text-sm font-semibold text-slate-800">Acak urutan soal</span>
                        <span className="mt-1 block text-xs text-slate-500">Urutan soal diacak untuk setiap pengerjaan siswa.</span>
                    </span>
                </label>
                <InputError message={examForm.errors.acak_soal} />
            </AdminResourceModal>

            <Modal
                show={Boolean(currentExam) && !isQuestionModalOpen}
                onClose={closeQuestionModal}
                maxWidth="2xl"
                labelledBy="bank-soal-title"
            >
                {currentExam && (
                    <div className="flex max-h-[85vh] flex-col">
                        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-7">
                            <div>
                                <h2 id="bank-soal-title" className="text-lg font-bold text-slate-900">Bank Soal</h2>
                                <p className="mt-1 text-sm text-slate-500">{currentExam.judul_ujian} · {currentExam.kelas}</p>
                            </div>
                            <button type="button" onClick={closeQuestionModal} aria-label="Tutup bank soal" className="text-xl text-slate-400 hover:text-slate-700">×</button>
                        </div>
                        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-7">
                            <p className="text-sm text-slate-500">{currentExamQuestions.length} soal</p>
                            <button
                                type="button"
                                onClick={openCreateQuestion}
                                disabled={currentExam.hasil_ujians_count > 0}
                                className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Tambah Soal
                            </button>
                        </div>
                        <div className="px-5 py-4 sm:px-7">
                            <ExcelImportPanel
                                templateUrl={route('guru.ujian.soal.template', currentExam.id)}
                                importUrl={route('guru.ujian.soal.import', currentExam.id)}
                                title="Impor soal dari Excel"
                                description={currentExam.mode_ujian === 'akm'
                                    ? 'Gunakan template AKM untuk PG, PG Kompleks, Menjodohkan, Isian Singkat, dan Esai. Template sudah berisi contoh pasangan tanpa perlu menulis JSON.'
                                    : 'Gunakan template Normal untuk soal Pilihan Ganda (PG) dan Esai. Kolom khusus AKM tidak disertakan.'}
                                templateLabel={`Unduh template soal ${currentExam.mode_ujian === 'akm' ? 'AKM' : 'Normal'} (.xlsx)`}
                                locked={currentExam.hasil_ujians_count > 0}
                            />
                        </div>
                        <div className="flex flex-col gap-3 overflow-y-auto p-5 sm:p-7">
                            {currentExam.hasil_ujians_count > 0 && (
                                <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                    Soal dikunci karena ujian sudah memiliki pengerjaan siswa.
                                </p>
                            )}
                            {currentExamQuestions.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500">
                                    Belum ada soal. Tambahkan soal sebelum ujian dimulai.
                                </div>
                            ) : currentExamQuestions.map((soal, index) => (
                                <article key={soal.id} className="rounded-xl border border-slate-200 p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                                                Soal {index + 1} · {(soal.tipe_soal ?? 'pg').replaceAll('_', ' ')} · Bobot {soal.bobot ?? 1}
                                            </p>
                                            <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-6 text-slate-800">{soal.pertanyaan}</p>
                                        </div>
                                        <div className="flex shrink-0 gap-1">
                                            <button type="button" onClick={() => openEditQuestion(soal)} disabled={currentExam.hasil_ujians_count > 0} className="rounded-lg px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-40">Edit</button>
                                            <button type="button" onClick={() => setDeletingQuestion(soal)} disabled={currentExam.hasil_ujians_count > 0} className="rounded-lg px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-40">Hapus</button>
                                        </div>
                                    </div>
                                    {soal.gambar_soal && <img src={soal.gambar_soal} alt="" className="mt-3 max-h-40 rounded-lg object-contain" />}
                                    {soal.tipe_soal === 'pg' && (
                                        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                            {['A', 'B', 'C', 'D', 'E'].map((option) => (
                                                <p key={option} className={`rounded-lg px-3 py-2 text-xs ${
                                                    soal.kunci_jawaban === option ? 'bg-emerald-50 font-semibold text-emerald-800' : 'bg-slate-50 text-slate-600'
                                                }`}>
                                                    <span className="font-semibold">{option}.</span> {soal[`opsi_${option.toLowerCase()}`]}
                                                </p>
                                            ))}
                                        </div>
                                    )}
                                    {soal.tipe_soal === 'pg_kompleks' && (
                                        <p className="mt-3 text-xs text-slate-500">{(soal.opsi_json?.opsi ?? []).length} opsi pilihan ganda kompleks.</p>
                                    )}
                                    {soal.tipe_soal === 'menjodohkan' && (
                                        <p className="mt-3 text-xs text-slate-500">{(soal.opsi_json?.pasangan_kiri ?? []).length} pasangan.</p>
                                    )}
                                </article>
                            ))}
                        </div>
                    </div>
                )}
            </Modal>

            <AdminResourceModal
                show={isQuestionModalOpen}
                title={editingQuestion ? 'Edit Soal' : 'Tambah Soal'}
                description="Pilih tipe soal sesuai mode ujian. Jawaban PG tetap menggunakan form pilihan ganda yang sama."
                processing={questionForm.processing}
                submitLabel={editingQuestion ? 'Simpan Soal' : 'Tambah Soal'}
                onClose={() => setIsQuestionModalOpen(false)}
                onSubmit={submitQuestion}
            >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="tipe-soal" className="mb-2 block text-sm font-semibold text-slate-700">Tipe Soal</label>
                        <select
                            id="tipe-soal"
                            value={questionForm.data.tipe_soal}
                            onChange={(event) => setQuestionType(event.target.value)}
                            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="pg">Pilihan Ganda</option>
                            {currentExam?.mode_ujian === 'akm' && (
                                <>
                                    <option value="pg_kompleks">PG Kompleks</option>
                                    <option value="menjodohkan">Menjodohkan</option>
                                    <option value="isian_singkat">Isian Singkat</option>
                                </>
                            )}
                            <option value="esai">Esai</option>
                        </select>
                        <InputError message={questionForm.errors.tipe_soal} className="mt-2" />
                    </div>
                    <div>
                        <label htmlFor="bobot-soal" className="mb-2 block text-sm font-semibold text-slate-700">Bobot</label>
                        <input
                            id="bobot-soal"
                            type="number"
                            min="1"
                            max="1000"
                            value={questionForm.data.bobot}
                            onChange={(event) => questionForm.setData('bobot', event.target.value)}
                            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <InputError message={questionForm.errors.bobot} className="mt-2" />
                    </div>
                </div>
                <div>
                    <label htmlFor="pertanyaan" className="mb-2 block text-sm font-semibold text-slate-700">Pertanyaan</label>
                    <textarea
                        id="pertanyaan"
                        rows="3"
                        value={questionForm.data.pertanyaan}
                        onChange={(event) => questionForm.setData('pertanyaan', event.target.value)}
                        onPaste={(event) => pasteImage('gambar_soal', event)}
                        className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <InputError message={questionForm.errors.pertanyaan} className="mt-2" />
                </div>
                <div>
                    <label htmlFor="gambar_soal" className="mb-2 block text-sm font-semibold text-slate-700">
                        Gambar pertanyaan (opsional)
                    </label>
                    <input
                        id="gambar_soal"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) => questionForm.setData('gambar_soal', event.target.files?.[0] ?? null)}
                        className="block w-full rounded-xl border border-slate-300 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-indigo-700"
                    />
                    {editingQuestion?.gambar_soal && (
                        <img src={editingQuestion.gambar_soal} alt="" className="mt-2 max-h-28 rounded-lg object-contain" />
                    )}
                    <InputError message={questionForm.errors.gambar_soal} className="mt-2" />
                </div>
                {questionOptionImageFields.map((option, index) => {
                    const field = `gambar_${option}`;
                    const label = questionForm.data.tipe_soal === 'pg'
                        ? `Opsi ${option.toUpperCase()}`
                        : `Opsi ${index + 1}`;

                    return (
                        <div key={field}>
                            <label htmlFor={field} className="mb-2 block text-sm font-semibold text-slate-700">
                                Gambar {label} (opsional)
                            </label>
                            <input
                                id={field}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={(event) => questionForm.setData(field, event.target.files?.[0] ?? null)}
                                className="block w-full rounded-xl border border-slate-300 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-indigo-700"
                            />
                            {editingQuestion?.[field] && (
                                <img src={editingQuestion[field]} alt="" className="mt-2 max-h-28 rounded-lg object-contain" />
                            )}
                            <InputError message={questionForm.errors[field]} className="mt-2" />
                        </div>
                    );
                })}
                {Object.entries(questionForm.errors)
                    .filter(([field]) => field.startsWith('opsi_json'))
                    .map(([field, message]) => (
                        <p key={field} role="alert" className="text-sm text-rose-600">{message}</p>
                    ))}
                {questionForm.data.tipe_soal === 'pg' && (
                    <>
                        {['a', 'b', 'c', 'd', 'e'].map((option) => (
                            <div key={option}>
                                <label htmlFor={`opsi-${option}`} className="mb-2 block text-sm font-semibold capitalize text-slate-700">Opsi {option.toUpperCase()}</label>
                                <textarea
                                    id={`opsi-${option}`}
                                    rows="2"
                                    value={questionForm.data[`opsi_${option}`]}
                                    onChange={(event) => questionForm.setData(`opsi_${option}`, event.target.value)}
                                    onPaste={(event) => pasteImage(`gambar_${option}`, event)}
                                    className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                                <InputError message={questionForm.errors[`opsi_${option}`]} className="mt-2" />
                            </div>
                        ))}
                        <div>
                            <label htmlFor="kunci-jawaban" className="mb-2 block text-sm font-semibold text-slate-700">Kunci Jawaban</label>
                            <select
                                id="kunci-jawaban"
                                value={questionForm.data.kunci_jawaban}
                                onChange={(event) => questionForm.setData('kunci_jawaban', event.target.value)}
                                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                {['A', 'B', 'C', 'D', 'E'].map((option) => <option key={option} value={option}>Opsi {option}</option>)}
                            </select>
                            <InputError message={questionForm.errors.kunci_jawaban} className="mt-2" />
                        </div>
                    </>
                )}
                {questionForm.data.tipe_soal === 'pg_kompleks' && (
                    <>
                        {(questionForm.data.opsi_json.opsi ?? []).map((option, index) => (
                            <div key={index} className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    checked={(questionForm.data.opsi_json.kunci_jawaban ?? []).includes(String(index))}
                                    onChange={(event) => {
                                        const selected = questionForm.data.opsi_json.kunci_jawaban ?? [];
                                        setQuestionOptionData('kunci_jawaban', event.target.checked
                                            ? [...selected, String(index)]
                                            : selected.filter((item) => item !== String(index)));
                                    }}
                                    aria-label={`Tandai opsi ${index + 1} sebagai jawaban benar`}
                                    className="mt-3 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <textarea
                                    rows="2"
                                    value={option}
                                    onChange={(event) => {
                                        const options = [...questionForm.data.opsi_json.opsi];
                                        options[index] = event.target.value;
                                        setQuestionOptionData('opsi', options);
                                    }}
                                    onPaste={(event) => pasteImage(`gambar_${String.fromCharCode(97 + index)}`, event)}
                                    placeholder={`Opsi ${index + 1} · centang jika benar`}
                                    className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                        ))}
                        <InputError message={questionForm.errors['opsi_json.kunci_jawaban']} />
                    </>
                )}
                {questionForm.data.tipe_soal === 'menjodohkan' && (
                    <>
                        {(questionForm.data.opsi_json.pasangan_kiri ?? []).map((left, index) => (
                            <div key={index} className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-3">
                                <input
                                    value={left}
                                    onChange={(event) => {
                                        const values = [...questionForm.data.opsi_json.pasangan_kiri];
                                        values[index] = event.target.value;
                                        setQuestionOptionData('pasangan_kiri', values);
                                    }}
                                    placeholder={`Pasangan kiri ${index + 1}`}
                                    aria-label={`Pasangan kiri ${index + 1}`}
                                    className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                                <input
                                    value={questionForm.data.opsi_json.pasangan_kanan[index] ?? ''}
                                    onChange={(event) => {
                                        const values = [...questionForm.data.opsi_json.pasangan_kanan];
                                        values[index] = event.target.value;
                                        setQuestionOptionData('pasangan_kanan', values);
                                    }}
                                    placeholder={`Pasangan kanan ${index + 1}`}
                                    aria-label={`Pasangan kanan ${index + 1}`}
                                    className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                                <div className="flex items-center gap-2">
                                    <select
                                        value={questionForm.data.opsi_json.kunci_jawaban[index] ?? ''}
                                        onChange={(event) => {
                                            const values = Array.from(
                                                { length: questionForm.data.opsi_json.pasangan_kiri.length },
                                                (_, answerIndex) => questionForm.data.opsi_json.kunci_jawaban[answerIndex] ?? '',
                                            );
                                            values[index] = event.target.value;
                                            setQuestionOptionData('kunci_jawaban', values);
                                        }}
                                        aria-label={`Pasangan benar untuk baris ${index + 1}`}
                                        className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="">Pilih pasangan benar</option>
                                        {(questionForm.data.opsi_json.pasangan_kanan ?? []).map((right, rightIndex) => (
                                            <option key={rightIndex} value={String(rightIndex)}>
                                                {right || `Pasangan kanan ${rightIndex + 1}`}
                                            </option>
                                        ))}
                                    </select>
                                    {questionForm.data.opsi_json.pasangan_kiri.length > 3 && (
                                        <button
                                            type="button"
                                            onClick={() => removeMatchingPair(index)}
                                            aria-label={`Hapus pasangan ${index + 1}`}
                                            className="shrink-0 rounded-lg px-2 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                                        >
                                            Hapus
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-xs text-slate-500">Minimal 3 pasangan; maksimal 10 pasangan.</p>
                            <button
                                type="button"
                                onClick={addMatchingPair}
                                disabled={questionForm.data.opsi_json.pasangan_kiri.length >= 10}
                                className="rounded-lg border border-indigo-200 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Tambah pasangan
                            </button>
                        </div>
                    </>
                )}
                {questionForm.data.tipe_soal === 'isian_singkat' && (
                    <div>
                        <label htmlFor="jawaban-singkat" className="mb-2 block text-sm font-semibold text-slate-700">Variasi jawaban benar</label>
                        <textarea
                            id="jawaban-singkat"
                            rows="3"
                            value={(questionForm.data.opsi_json.kunci_jawaban ?? []).join('\n')}
                            onChange={(event) => setQuestionOptionData(
                                'kunci_jawaban',
                                event.target.value.split('\n').map((answer) => answer.trim()).filter(Boolean),
                            )}
                            placeholder="Satu variasi jawaban per baris"
                            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <InputError message={questionForm.errors['opsi_json.kunci_jawaban']} className="mt-2" />
                    </div>
                )}
                {questionForm.data.tipe_soal === 'esai' && (
                    <p className="rounded-xl bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
                        Jawaban esai dikoreksi guru setelah siswa menyelesaikan ujian.
                    </p>
                )}
            </AdminResourceModal>

            <AdminDeleteModal
                show={Boolean(deletingExam)}
                title={deletingExam?.hasil_ujians_count > 0 ? 'Hapus ujian beserta pengerjaan?' : 'Hapus ujian?'}
                description={deletingExam?.hasil_ujians_count > 0
                    ? `Ujian ini memiliki ${deletingExam.hasil_ujians_count} pengerjaan. Jadwal, bank soal, jawaban, dan nilai seluruh peserta akan dihapus permanen. Siswa yang sedang mengerjakan juga kehilangan sesi. Lanjutkan hanya jika ujian ini memang ingin dibuang.`
                    : 'Jadwal ujian dan bank soalnya akan dihapus permanen.'}
                processing={examDeleteForm.processing}
                confirmLabel={deletingExam?.hasil_ujians_count > 0 ? 'Hapus ujian dan hasil' : 'Ya, hapus'}
                onClose={() => setDeletingExam(null)}
                onConfirm={deleteExam}
            />
            <AdminDeleteModal
                show={Boolean(deletingQuestion)}
                title="Hapus soal?"
                description="Soal ini akan dihapus permanen dari bank soal ujian."
                processing={questionDeleteForm.processing}
                onClose={() => setDeletingQuestion(null)}
                onConfirm={deleteQuestion}
            />
        </DashboardLayout>
    );
}
