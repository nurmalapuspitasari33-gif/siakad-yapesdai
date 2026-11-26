import AdminNavigationItems from '@/Components/AdminNavigationItems';
import AdminPagination from '@/Components/AdminPagination';
import {
    AdminDeleteModal,
    AdminResourceModal,
} from '@/Components/AdminResourceModal';
import InputError from '@/Components/InputError';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function KelasIndex({
    daftarKelas,
    tahunAjarans,
    guruWaliKelas,
    programKeahlians = [],
}) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingKelas, setEditingKelas] = useState(null);
    const [deletingKelas, setDeletingKelas] = useState(null);
    const [masterFormTarget, setMasterFormTarget] = useState(null);
    const [deletingMaster, setDeletingMaster] = useState(null);
    const form = useForm({
        tahun_ajaran_id: '',
        wali_kelas_id: '',
        program_keahlian_id: '',
        konsentrasi_keahlian_id: '',
        nama_kelas: '',
        tingkat: '',
        fase: '',
    });
    const deleteForm = useForm({});
    const masterForm = useForm({
        kode_jurusan: '',
        nama_jurusan: '',
        keterangan: '',
        program_keahlian_id: '',
        kode_konsentrasi: '',
        nama_konsentrasi: '',
    });
    const masterDeleteForm = useForm({});
    const selectedProgram = programKeahlians.find(
        (program) => String(program.id) === String(form.data.program_keahlian_id),
    );

    const closeForm = () => {
        setIsFormOpen(false);
        setEditingKelas(null);
        form.reset();
        form.clearErrors();
    };

    const openCreateForm = () => {
        setEditingKelas(null);
        form.setData({
            tahun_ajaran_id: String(tahunAjarans[0]?.id ?? ''),
            wali_kelas_id: '',
            program_keahlian_id: '',
            konsentrasi_keahlian_id: '',
            nama_kelas: '',
            tingkat: '',
            fase: '',
        });
        form.clearErrors();
        setIsFormOpen(true);
    };

    const openEditForm = (kelas) => {
        setEditingKelas(kelas);
        form.setData({
            tahun_ajaran_id: String(kelas.tahun_ajaran_id),
            wali_kelas_id: kelas.wali_kelas_id ? String(kelas.wali_kelas_id) : '',
            program_keahlian_id: kelas.program_keahlian_id ? String(kelas.program_keahlian_id) : '',
            konsentrasi_keahlian_id: kelas.konsentrasi_keahlian_id ? String(kelas.konsentrasi_keahlian_id) : '',
            nama_kelas: kelas.nama_kelas,
            tingkat: String(kelas.tingkat),
            fase: kelas.fase ?? '',
        });
        form.clearErrors();
        setIsFormOpen(true);
    };

    const submitForm = (event) => {
        event.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: closeForm,
        };

        if (editingKelas) {
            form.put(route('admin.kelas.update', editingKelas.id), options);
            return;
        }

        form.post(route('admin.kelas.store'), options);
    };

    const deleteKelas = () => {
        if (!deletingKelas) {
            return;
        }

        deleteForm.delete(route('admin.kelas.destroy', deletingKelas.id), {
            preserveScroll: true,
            onSuccess: () => setDeletingKelas(null),
        });
    };

    const closeMasterForm = () => {
        setMasterFormTarget(null);
        masterForm.reset();
        masterForm.clearErrors();
    };

    const openProgramForm = (program = null) => {
        setMasterFormTarget({ type: 'program', record: program });
        masterForm.setData({
            kode_jurusan: program?.kode_jurusan ?? '',
            nama_jurusan: program?.nama_jurusan ?? '',
            keterangan: program?.keterangan ?? '',
            program_keahlian_id: '',
            kode_konsentrasi: '',
            nama_konsentrasi: '',
        });
        masterForm.clearErrors();
    };

    const openConcentrationForm = (program, concentration = null) => {
        setMasterFormTarget({ type: 'concentration', record: concentration, program });
        masterForm.setData({
            kode_jurusan: '',
            nama_jurusan: '',
            keterangan: '',
            program_keahlian_id: String(concentration?.program_keahlian_id ?? program.id),
            kode_konsentrasi: concentration?.kode_konsentrasi ?? '',
            nama_konsentrasi: concentration?.nama_konsentrasi ?? '',
        });
        masterForm.clearErrors();
    };

    const submitMasterForm = (event) => {
        event.preventDefault();
        if (!masterFormTarget) {
            return;
        }

        const options = {
            preserveScroll: true,
            onSuccess: closeMasterForm,
        };

        if (masterFormTarget.type === 'program') {
            if (masterFormTarget.record) {
                masterForm.put(route('admin.program-keahlian.update', masterFormTarget.record.id), options);
            } else {
                masterForm.post(route('admin.program-keahlian.store'), options);
            }

            return;
        }

        if (masterFormTarget.record) {
            masterForm.put(
                route('admin.konsentrasi-keahlian.update', masterFormTarget.record.id),
                options,
            );
        } else {
            masterForm.post(
                route('admin.program-keahlian.konsentrasi.store', masterFormTarget.program.id),
                options,
            );
        }
    };

    const deleteMaster = () => {
        if (!deletingMaster) {
            return;
        }

        const url = deletingMaster.type === 'program'
            ? route('admin.program-keahlian.destroy', deletingMaster.record.id)
            : route('admin.konsentrasi-keahlian.destroy', deletingMaster.record.id);

        masterDeleteForm.delete(url, {
            preserveScroll: true,
            onSuccess: () => setDeletingMaster(null),
        });
    };

    return (
        <DashboardLayout
            title="Manajemen Kelas"
            subtitle="Atur kelas, tahun ajaran, tingkat, dan guru yang bertugas sebagai wali kelas."
            roleLabel="Administrator"
            navigation={AdminNavigationItems('kelas')}
        >
            <Head title="Data Kelas" />

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                    <div>
                        <h2 className="font-bold text-slate-900">Daftar kelas</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {daftarKelas.total} kelas terdaftar
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={openCreateForm}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        <span className="text-lg leading-none" aria-hidden="true">+</span>
                        Tambah Kelas
                    </button>
                </div>

                <div className="w-full overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 text-left">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-7">
                                    Nama Kelas
                                </th>
                                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Tingkat
                                </th>
                                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Fase
                                </th>
                                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Tahun Ajaran
                                </th>
                                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Wali Kelas
                                </th>
                                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Program Keahlian
                                </th>
                                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Konsentrasi
                                </th>
                                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-7">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {daftarKelas.data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="8"
                                        className="px-5 py-12 text-center text-sm text-slate-500"
                                    >
                                        Belum ada data kelas.
                                    </td>
                                </tr>
                            ) : (
                                daftarKelas.data.map((kelas) => (
                                    <tr key={kelas.id} className="hover:bg-slate-50/70">
                                        <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900 sm:px-7">
                                            {kelas.nama_kelas}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                                            Tingkat {kelas.tingkat}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                                            {kelas.fase ?? '—'}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                                            {kelas.tahun_ajaran
                                                ? `${kelas.tahun_ajaran.nama_tahun} · ${kelas.tahun_ajaran.semester}`
                                                : '—'}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                                            {kelas.wali_kelas?.nama_lengkap ?? 'Belum ditentukan'}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                                            {kelas.program_keahlian?.nama_jurusan ?? '—'}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                                            {kelas.konsentrasi_keahlian?.nama_konsentrasi ?? '—'}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4 sm:px-7">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditForm(kelas)}
                                                    className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setDeletingKelas(kelas)}
                                                    className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                                                >
                                                    Hapus
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="border-t border-slate-100 px-5 py-4 sm:px-7">
                    <AdminPagination links={daftarKelas.links} />
                </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                    <div>
                        <h2 className="font-bold text-slate-900">Program & Konsentrasi Keahlian</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Kelola program dan konsentrasi yang digunakan pada pendaftaran, kelas, dan data siswa.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => openProgramForm()}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                    >
                        <span className="text-lg leading-none" aria-hidden="true">+</span>
                        Tambah Program
                    </button>
                </div>
                <div className="divide-y divide-slate-100">
                    {programKeahlians.length === 0 ? (
                        <p className="px-5 py-8 text-center text-sm text-slate-500">
                            Belum ada Program Keahlian.
                        </p>
                    ) : programKeahlians.map((program) => (
                        <div key={program.id} className="flex flex-col gap-4 px-5 py-5 sm:px-7">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <h3 className="font-semibold text-slate-900">
                                        {program.kode_jurusan} · {program.nama_jurusan}
                                    </h3>
                                    {program.keterangan && (
                                        <p className="mt-1 text-sm text-slate-500">{program.keterangan}</p>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => openConcentrationForm(program)}
                                        className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                                    >
                                        Tambah Konsentrasi
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => openProgramForm(program)}
                                        className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50"
                                    >
                                        Edit Program
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDeletingMaster({ type: 'program', record: program })}
                                        className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                                    >
                                        Hapus
                                    </button>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {(program.konsentrasi_keahlians ?? []).map((concentration) => (
                                    <div
                                        key={concentration.id}
                                        className="inline-flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                                    >
                                        <span className="font-semibold">{concentration.kode_konsentrasi}</span>
                                        <span>{concentration.nama_konsentrasi}</span>
                                        <button
                                            type="button"
                                            onClick={() => openConcentrationForm(program, concentration)}
                                            className="rounded-lg px-2 py-1 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDeletingMaster({ type: 'concentration', record: concentration })}
                                            className="rounded-lg px-2 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                                        >
                                            Hapus
                                        </button>
                                    </div>
                                ))}
                                {(program.konsentrasi_keahlians ?? []).length === 0 && (
                                    <span className="text-sm text-slate-400">Belum ada Konsentrasi Keahlian.</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <AdminResourceModal
                show={isFormOpen}
                title={editingKelas ? 'Edit Kelas' : 'Tambah Kelas'}
                description="Lengkapi identitas kelas dan tentukan wali kelas bila sudah tersedia."
                processing={form.processing}
                submitLabel={editingKelas ? 'Simpan Perubahan' : 'Tambah Kelas'}
                onClose={closeForm}
                onSubmit={submitForm}
            >
                <div>
                    <label htmlFor="nama_kelas" className="mb-2 block text-sm font-semibold text-slate-700">
                        Nama Kelas
                    </label>
                    <input
                        id="nama_kelas"
                        name="nama_kelas"
                        type="text"
                        value={form.data.nama_kelas}
                        onChange={(event) => form.setData('nama_kelas', event.target.value)}
                        placeholder="Contoh: X IPA 1"
                        className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <InputError message={form.errors.nama_kelas} className="mt-2" />
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                        <label htmlFor="program-keahlian-kelas" className="mb-2 block text-sm font-semibold text-slate-700">
                            Program Keahlian
                        </label>
                        <select
                            id="program-keahlian-kelas"
                            value={form.data.program_keahlian_id}
                            onChange={(event) => {
                                form.setData('program_keahlian_id', event.target.value);
                                form.setData('konsentrasi_keahlian_id', '');
                            }}
                            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="">-- Kelas Umum / Belum Ditentukan --</option>
                            {programKeahlians.map((program) => (
                                <option key={program.id} value={program.id}>
                                    {program.nama_jurusan}
                                </option>
                            ))}
                        </select>
                        <InputError message={form.errors.program_keahlian_id} className="mt-2" />
                    </div>
                    <div>
                        <label htmlFor="konsentrasi-keahlian-kelas" className="mb-2 block text-sm font-semibold text-slate-700">
                            Konsentrasi Keahlian
                        </label>
                        <select
                            id="konsentrasi-keahlian-kelas"
                            value={form.data.konsentrasi_keahlian_id}
                            onChange={(event) => form.setData('konsentrasi_keahlian_id', event.target.value)}
                            disabled={!selectedProgram}
                            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-slate-100"
                        >
                            <option value="">-- Pilih Konsentrasi Keahlian --</option>
                            {(selectedProgram?.konsentrasi_keahlians ?? []).map((concentration) => (
                                <option key={concentration.id} value={concentration.id}>
                                    {concentration.nama_konsentrasi}
                                </option>
                            ))}
                        </select>
                        <InputError message={form.errors.konsentrasi_keahlian_id} className="mt-2" />
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                        <label htmlFor="tingkat" className="mb-2 block text-sm font-semibold text-slate-700">
                            Tingkat
                        </label>
                        <input
                            id="tingkat"
                            name="tingkat"
                            type="number"
                            min="1"
                            max="12"
                            value={form.data.tingkat}
                            onChange={(event) => form.setData('tingkat', event.target.value)}
                            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <InputError message={form.errors.tingkat} className="mt-2" />
                    </div>
                    <div>
                        <label htmlFor="tahun_ajaran_id" className="mb-2 block text-sm font-semibold text-slate-700">
                            Tahun Ajaran
                        </label>
                        <select
                            id="tahun_ajaran_id"
                            name="tahun_ajaran_id"
                            value={form.data.tahun_ajaran_id}
                            onChange={(event) => form.setData('tahun_ajaran_id', event.target.value)}
                            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="">Pilih tahun ajaran</option>
                            {tahunAjarans.map((tahunAjaran) => (
                                <option key={tahunAjaran.id} value={tahunAjaran.id}>
                                    {tahunAjaran.nama_tahun} · {tahunAjaran.semester}
                                </option>
                            ))}
                        </select>
                        <InputError message={form.errors.tahun_ajaran_id} className="mt-2" />
                    </div>
                </div>
                <div>
                    <label htmlFor="wali_kelas_id" className="mb-2 block text-sm font-semibold text-slate-700">
                        Wali Kelas <span className="font-normal text-slate-400">(opsional)</span>
                    </label>
                    <select
                        id="wali_kelas_id"
                        name="wali_kelas_id"
                        value={form.data.wali_kelas_id}
                        onChange={(event) => form.setData('wali_kelas_id', event.target.value)}
                        className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                        <option value="">Belum ditentukan</option>
                        {guruWaliKelas.map((guru) => (
                            <option key={guru.id} value={guru.id}>
                                {guru.nama_lengkap}
                            </option>
                        ))}
                    </select>
                    <InputError message={form.errors.wali_kelas_id} className="mt-2" />
                </div>
                <div>
                    <label htmlFor="fase-kelas" className="mb-2 block text-sm font-semibold text-slate-700">
                        Fase Kurikulum Merdeka
                    </label>
                    <select
                        id="fase-kelas"
                        value={form.data.fase}
                        onChange={(event) => form.setData('fase', event.target.value)}
                        className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                        <option value="">Pilih fase</option>
                        <option value="E">Fase E</option>
                        <option value="F">Fase F</option>
                    </select>
                    <InputError message={form.errors.fase} className="mt-2" />
                </div>
            </AdminResourceModal>

            <AdminResourceModal
                show={Boolean(masterFormTarget)}
                title={masterFormTarget?.type === 'program'
                    ? `${masterFormTarget.record ? 'Edit' : 'Tambah'} Program Keahlian`
                    : `${masterFormTarget?.record ? 'Edit' : 'Tambah'} Konsentrasi Keahlian`}
                description={masterFormTarget?.type === 'program'
                    ? 'Lengkapi kode dan nama Program Keahlian.'
                    : 'Lengkapi kode dan nama Konsentrasi Keahlian.'}
                processing={masterForm.processing}
                submitLabel="Simpan"
                onClose={closeMasterForm}
                onSubmit={submitMasterForm}
            >
                {masterFormTarget?.type === 'program' ? (
                    <>
                        <div>
                            <label htmlFor="kode-jurusan" className="mb-2 block text-sm font-semibold text-slate-700">
                                Kode Program
                            </label>
                            <input
                                id="kode-jurusan"
                                value={masterForm.data.kode_jurusan}
                                onChange={(event) => masterForm.setData('kode_jurusan', event.target.value)}
                                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            <InputError message={masterForm.errors.kode_jurusan} className="mt-2" />
                        </div>
                        <div>
                            <label htmlFor="nama-jurusan" className="mb-2 block text-sm font-semibold text-slate-700">
                                Nama Program Keahlian
                            </label>
                            <input
                                id="nama-jurusan"
                                value={masterForm.data.nama_jurusan}
                                onChange={(event) => masterForm.setData('nama_jurusan', event.target.value)}
                                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            <InputError message={masterForm.errors.nama_jurusan} className="mt-2" />
                        </div>
                        <div>
                            <label htmlFor="keterangan-program" className="mb-2 block text-sm font-semibold text-slate-700">
                                Keterangan <span className="font-normal text-slate-400">(opsional)</span>
                            </label>
                            <textarea
                                id="keterangan-program"
                                rows="3"
                                value={masterForm.data.keterangan}
                                onChange={(event) => masterForm.setData('keterangan', event.target.value)}
                                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            <InputError message={masterForm.errors.keterangan} className="mt-2" />
                        </div>
                    </>
                ) : (
                    <>
                        {!masterFormTarget?.record && (
                            <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                                Program: <span className="font-semibold">{masterFormTarget?.program?.nama_jurusan}</span>
                            </p>
                        )}
                        {masterFormTarget?.record && (
                            <div>
                                <label htmlFor="program-keahlian-konsentrasi" className="mb-2 block text-sm font-semibold text-slate-700">
                                    Program Keahlian
                                </label>
                                <select
                                    id="program-keahlian-konsentrasi"
                                    value={masterForm.data.program_keahlian_id}
                                    onChange={(event) => masterForm.setData('program_keahlian_id', event.target.value)}
                                    className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    {programKeahlians.map((program) => (
                                        <option key={program.id} value={program.id}>{program.nama_jurusan}</option>
                                    ))}
                                </select>
                                <InputError message={masterForm.errors.program_keahlian_id} className="mt-2" />
                            </div>
                        )}
                        <div>
                            <label htmlFor="kode-konsentrasi" className="mb-2 block text-sm font-semibold text-slate-700">
                                Kode Konsentrasi
                            </label>
                            <input
                                id="kode-konsentrasi"
                                value={masterForm.data.kode_konsentrasi}
                                onChange={(event) => masterForm.setData('kode_konsentrasi', event.target.value)}
                                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            <InputError message={masterForm.errors.kode_konsentrasi} className="mt-2" />
                        </div>
                        <div>
                            <label htmlFor="nama-konsentrasi" className="mb-2 block text-sm font-semibold text-slate-700">
                                Nama Konsentrasi Keahlian
                            </label>
                            <input
                                id="nama-konsentrasi"
                                value={masterForm.data.nama_konsentrasi}
                                onChange={(event) => masterForm.setData('nama_konsentrasi', event.target.value)}
                                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            <InputError message={masterForm.errors.nama_konsentrasi} className="mt-2" />
                        </div>
                    </>
                )}
            </AdminResourceModal>

            <AdminDeleteModal
                show={Boolean(deletingKelas)}
                title="Hapus kelas?"
                description="Kelas yang masih memiliki siswa, jadwal, atau ujian tidak dapat dihapus."
                processing={deleteForm.processing}
                onClose={() => setDeletingKelas(null)}
                onConfirm={deleteKelas}
            />
            <AdminDeleteModal
                show={Boolean(deletingMaster)}
                title={deletingMaster?.type === 'program'
                    ? 'Hapus Program Keahlian?'
                    : 'Hapus Konsentrasi Keahlian?'}
                description={deletingMaster?.type === 'program'
                    ? 'Program yang sudah digunakan oleh kelas, siswa, atau pendaftar tidak dapat dihapus.'
                    : 'Konsentrasi yang sudah digunakan oleh kelas, siswa, atau pendaftar tidak dapat dihapus.'}
                processing={masterDeleteForm.processing}
                onClose={() => setDeletingMaster(null)}
                onConfirm={deleteMaster}
            />
        </DashboardLayout>
    );
}
