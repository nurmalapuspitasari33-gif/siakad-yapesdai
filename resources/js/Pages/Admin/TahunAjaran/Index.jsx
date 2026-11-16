import AdminNavigationItems from '@/Components/AdminNavigationItems';
import AdminPagination from '@/Components/AdminPagination';
import {
    AdminDeleteModal,
    AdminResourceModal,
} from '@/Components/AdminResourceModal';
import InputError from '@/Components/InputError';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function TahunAjaranIndex({ tahunAjarans }) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTahunAjaran, setEditingTahunAjaran] = useState(null);
    const [deletingTahunAjaran, setDeletingTahunAjaran] = useState(null);
    const form = useForm({
        nama_tahun: '',
        semester: 'ganjil',
    });
    const deleteForm = useForm({});

    const closeForm = () => {
        setIsFormOpen(false);
        setEditingTahunAjaran(null);
        form.reset();
        form.clearErrors();
    };

    const openCreateForm = () => {
        setEditingTahunAjaran(null);
        form.setData({ nama_tahun: '', semester: 'ganjil' });
        form.clearErrors();
        setIsFormOpen(true);
    };

    const openEditForm = (tahunAjaran) => {
        setEditingTahunAjaran(tahunAjaran);
        form.setData({
            nama_tahun: tahunAjaran.nama_tahun,
            semester: tahunAjaran.semester,
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

        if (editingTahunAjaran) {
            form.put(
                route('admin.tahun-ajaran.update', editingTahunAjaran.id),
                options,
            );
            return;
        }

        form.post(route('admin.tahun-ajaran.store'), options);
    };

    const activateTahunAjaran = (tahunAjaran) => {
        router.patch(
            route('admin.tahun-ajaran.activate', tahunAjaran.id),
            {},
            { preserveScroll: true },
        );
    };

    const deleteTahunAjaran = () => {
        if (!deletingTahunAjaran) {
            return;
        }

        deleteForm.delete(
            route('admin.tahun-ajaran.destroy', deletingTahunAjaran.id),
            {
                preserveScroll: true,
                onSuccess: () => setDeletingTahunAjaran(null),
            },
        );
    };

    return (
        <DashboardLayout
            title="Manajemen Tahun Ajaran"
            subtitle="Atur tahun ajaran dan semester yang digunakan dalam kegiatan akademik."
            roleLabel="Administrator"
            navigation={AdminNavigationItems('tahun-ajaran')}
        >
            <Head title="Tahun Ajaran" />

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                    <div>
                        <h2 className="font-bold text-slate-900">Daftar tahun ajaran</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {tahunAjarans.total} data tahun ajaran
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={openCreateForm}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        <span className="text-lg leading-none" aria-hidden="true">+</span>
                        Tambah Tahun Ajaran
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 text-left">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-7">
                                    Tahun Ajaran
                                </th>
                                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Semester
                                </th>
                                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Status
                                </th>
                                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-7">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {tahunAjarans.data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="4"
                                        className="px-5 py-12 text-center text-sm text-slate-500"
                                    >
                                        Belum ada data tahun ajaran.
                                    </td>
                                </tr>
                            ) : (
                                tahunAjarans.data.map((tahunAjaran) => (
                                    <tr key={tahunAjaran.id} className="hover:bg-slate-50/70">
                                        <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900 sm:px-7">
                                            {tahunAjaran.nama_tahun}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4 text-sm capitalize text-slate-600">
                                            {tahunAjaran.semester}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4">
                                            <span
                                                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                                                    tahunAjaran.is_aktif
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : 'bg-slate-100 text-slate-600'
                                                }`}
                                            >
                                                <span
                                                    className={`h-1.5 w-1.5 rounded-full ${
                                                        tahunAjaran.is_aktif
                                                            ? 'bg-emerald-500'
                                                            : 'bg-slate-400'
                                                    }`}
                                                />
                                                {tahunAjaran.is_aktif ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4 sm:px-7">
                                            <div className="flex justify-end gap-2">
                                                {!tahunAjaran.is_aktif && (
                                                    <button
                                                        type="button"
                                                        onClick={() => activateTahunAjaran(tahunAjaran)}
                                                        className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                                                    >
                                                        Aktifkan
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => openEditForm(tahunAjaran)}
                                                    className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setDeletingTahunAjaran(tahunAjaran)}
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
                    <AdminPagination links={tahunAjarans.links} />
                </div>
            </section>

            <AdminResourceModal
                show={isFormOpen}
                title={editingTahunAjaran ? 'Edit Tahun Ajaran' : 'Tambah Tahun Ajaran'}
                description="Isi tahun ajaran dan semester. Gunakan tombol Aktifkan untuk menetapkan semester aktif."
                processing={form.processing}
                submitLabel={editingTahunAjaran ? 'Simpan Perubahan' : 'Tambah Tahun Ajaran'}
                onClose={closeForm}
                onSubmit={submitForm}
            >
                <div>
                    <label htmlFor="nama_tahun" className="mb-2 block text-sm font-semibold text-slate-700">
                        Nama Tahun Ajaran
                    </label>
                    <input
                        id="nama_tahun"
                        name="nama_tahun"
                        type="text"
                        value={form.data.nama_tahun}
                        onChange={(event) => form.setData('nama_tahun', event.target.value)}
                        autoComplete="off"
                        placeholder="Contoh: 2026/2027"
                        className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <InputError message={form.errors.nama_tahun} className="mt-2" />
                </div>
                <div>
                    <label htmlFor="semester" className="mb-2 block text-sm font-semibold text-slate-700">
                        Semester
                    </label>
                    <select
                        id="semester"
                        name="semester"
                        value={form.data.semester}
                        onChange={(event) => form.setData('semester', event.target.value)}
                        className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                        <option value="ganjil">Ganjil</option>
                        <option value="genap">Genap</option>
                    </select>
                    <InputError message={form.errors.semester} className="mt-2" />
                </div>
            </AdminResourceModal>

            <AdminDeleteModal
                show={Boolean(deletingTahunAjaran)}
                title="Hapus tahun ajaran?"
                description="Data tahun ajaran yang dihapus tidak dapat dikembalikan. Tahun aktif atau yang masih dipakai kelas dan jadwal tidak dapat dihapus."
                processing={deleteForm.processing}
                onClose={() => setDeletingTahunAjaran(null)}
                onConfirm={deleteTahunAjaran}
            />
        </DashboardLayout>
    );
}
