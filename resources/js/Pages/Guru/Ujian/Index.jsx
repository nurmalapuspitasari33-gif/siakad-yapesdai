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
    pertanyaan: '',
    opsi_a: '',
    opsi_b: '',
    opsi_c: '',
    opsi_d: '',
    opsi_e: '',
    kunci_jawaban: 'A',
};

export default function GuruUjianIndex({
    ujians = [],
    kelasOptions = [],
    mapelOptions = [],
    assignments = [],
    tahunAjaranAktif = null,
    isWaliKelas = false,
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
    });
    const questionForm = useForm(emptyQuestion);
    const examDeleteForm = useForm({});
    const questionDeleteForm = useForm({});
    const currentExam = ujians.find((ujian) => ujian.id === questionExamId) ?? null;
    const currentExamQuestions = currentExam?.bank_soals ?? [];
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
        questionForm.setData({
            pertanyaan: question.pertanyaan,
            opsi_a: question.opsi_a,
            opsi_b: question.opsi_b,
            opsi_c: question.opsi_c,
            opsi_d: question.opsi_d,
            opsi_e: question.opsi_e,
            kunci_jawaban: question.kunci_jawaban,
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
            onSuccess: () => {
                setIsQuestionModalOpen(false);
                setEditingQuestion(null);
                questionForm.reset();
                questionForm.clearErrors();
            },
        };

        if (editingQuestion) {
            questionForm.put(
                route('guru.ujian.soal.update', [currentExam.id, editingQuestion.id]),
                options,
            );
            return;
        }

        questionForm.post(route('guru.ujian.soal.store', currentExam.id), options);
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
            navigation={roleNavigationItems('guru', 'ujian', { isWaliKelas })}
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

                <div className="overflow-x-auto">
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
                                        <div className="flex flex-wrap justify-end gap-1">
                                            <Link
                                                href={route('guru.ujian.hasil', ujian.id)}
                                                className="rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                                            >
                                                Hasil Ujian
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => openQuestionManager(ujian)}
                                                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                                            >
                                                Kelola Soal
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => openEditExam(ujian)}
                                                disabled={ujian.hasil_ujians_count > 0}
                                                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDeletingExam(ujian)}
                                                disabled={ujian.hasil_ujians_count > 0}
                                                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                Hapus
                                            </button>
                                        </div>
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
                            <p className="text-sm text-slate-500">{currentExamQuestions.length} soal pilihan ganda</p>
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
                                description="Kolom soal dan opsi A–E; kunci jawaban harus A, B, C, D, atau E."
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
                                            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Soal {index + 1}</p>
                                            <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-6 text-slate-800">{soal.pertanyaan}</p>
                                        </div>
                                        <div className="flex shrink-0 gap-1">
                                            <button type="button" onClick={() => openEditQuestion(soal)} disabled={currentExam.hasil_ujians_count > 0} className="rounded-lg px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-40">Edit</button>
                                            <button type="button" onClick={() => setDeletingQuestion(soal)} disabled={currentExam.hasil_ujians_count > 0} className="rounded-lg px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-40">Hapus</button>
                                        </div>
                                    </div>
                                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                        {['A', 'B', 'C', 'D', 'E'].map((option) => (
                                            <p key={option} className={`rounded-lg px-3 py-2 text-xs ${
                                                soal.kunci_jawaban === option ? 'bg-emerald-50 font-semibold text-emerald-800' : 'bg-slate-50 text-slate-600'
                                            }`}>
                                                <span className="font-semibold">{option}.</span> {soal[`opsi_${option.toLowerCase()}`]}
                                            </p>
                                        ))}
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                )}
            </Modal>

            <AdminResourceModal
                show={isQuestionModalOpen}
                title={editingQuestion ? 'Edit Soal' : 'Tambah Soal'}
                description="Masukkan pertanyaan, lima pilihan jawaban, dan kunci jawaban."
                processing={questionForm.processing}
                submitLabel={editingQuestion ? 'Simpan Soal' : 'Tambah Soal'}
                onClose={() => setIsQuestionModalOpen(false)}
                onSubmit={submitQuestion}
            >
                <div>
                    <label htmlFor="pertanyaan" className="mb-2 block text-sm font-semibold text-slate-700">Pertanyaan</label>
                    <textarea
                        id="pertanyaan"
                        rows="3"
                        value={questionForm.data.pertanyaan}
                        onChange={(event) => questionForm.setData('pertanyaan', event.target.value)}
                        className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <InputError message={questionForm.errors.pertanyaan} className="mt-2" />
                </div>
                {['a', 'b', 'c', 'd', 'e'].map((option) => (
                    <div key={option}>
                        <label htmlFor={`opsi-${option}`} className="mb-2 block text-sm font-semibold capitalize text-slate-700">Opsi {option.toUpperCase()}</label>
                        <textarea
                            id={`opsi-${option}`}
                            rows="2"
                            value={questionForm.data[`opsi_${option}`]}
                            onChange={(event) => questionForm.setData(`opsi_${option}`, event.target.value)}
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
            </AdminResourceModal>

            <AdminDeleteModal
                show={Boolean(deletingExam)}
                title="Hapus ujian?"
                description="Ujian dan bank soalnya akan dihapus. Ujian yang sudah memiliki pengerjaan tidak dapat dihapus."
                processing={examDeleteForm.processing}
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
