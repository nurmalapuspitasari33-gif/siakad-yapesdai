import AdminNavigationItems from '@/Components/AdminNavigationItems';
import AdminPagination from '@/Components/AdminPagination';
import ExcelImportPanel from '@/Components/ExcelImportPanel';
import {
    AdminDeleteModal,
    AdminResourceModal,
} from '@/Components/AdminResourceModal';
import InputError from '@/Components/InputError';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function GuruIndex({ gurus }) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingGuru, setEditingGuru] = useState(null);
    const [deletingGuru, setDeletingGuru] = useState(null);
    const [resettingGuru, setResettingGuru] = useState(null);
    const form = useForm({
        nip: '',
        nama_lengkap: '',
        email: '',
        no_wa: '',
        password: '',
        is_wali_kelas: false,
    });
    const deleteForm = useForm({});
    const resetPasswordForm = useForm({});

    const closeForm = () => {
        setIsFormOpen(false);
        setEditingGuru(null);
        form.reset();
        form.clearErrors();
    };

    const openCreateForm = () => {
        setEditingGuru(null);
        form.setData({
            nip: '',
            nama_lengkap: '',
            email: '',
            no_wa: '',
            password: '',
            is_wali_kelas: false,
        });
        form.clearErrors();
        setIsFormOpen(true);
    };

    const openEditForm = (guru) => {
        setEditingGuru(guru);
        form.setData({
            nip: guru.nip,
            nama_lengkap: guru.nama_lengkap,
            email: guru.user.email,
            no_wa: guru.user.no_wa ?? '',
            password: '',
            is_wali_kelas: guru.is_wali_kelas,
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

        if (editingGuru) {
            form.put(route('admin.guru.update', editingGuru.id), options);
            return;
        }

        form.post(route('admin.guru.store'), options);
    };

    const deleteGuru = () => {
        if (!deletingGuru) {
            return;
        }

        deleteForm.delete(route('admin.guru.destroy', deletingGuru.id), {
            preserveScroll: true,
            onSuccess: () => setDeletingGuru(null),
        });
    };

    const closeResetPassword = () => {
        setResettingGuru(null);
        resetPasswordForm.reset();
        resetPasswordForm.clearErrors();
    };

    const submitResetPassword = (event) => {
        event.preventDefault();

        if (!resettingGuru) {
            return;
        }

        resetPasswordForm.patch(route('admin.guru.reset-password', resettingGuru.id), {
            preserveScroll: true,
            onSuccess: closeResetPassword,
        });
    };

    return (
        <DashboardLayout
            title="Manajemen Guru"
            subtitle="Kelola akun, NIKY, dan penugasan wali kelas guru."
            roleLabel="Administrator"
            navigation={AdminNavigationItems('guru')}
        >
            <Head title="Data Guru" />

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                    <div>
                        <h2 className="font-bold text-slate-900">Daftar guru</h2>
                        <p className="mt-1 text-sm text-slate-500">{gurus.total} guru terdaftar</p>
                    </div>
                    <button
                        type="button"
                        onClick={openCreateForm}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        <span className="text-lg leading-none" aria-hidden="true">+</span>
                        Tambah Guru
                    </button>
                </div>

                <div className="px-5 py-4 sm:px-7">
                    <ExcelImportPanel
                        templateUrl={route('admin.guru.template')}
                        importUrl={route('admin.guru.import')}
                        description="Kolom: NIKY, nama, email, WhatsApp, status wali kelas, dan nama kelas wali."
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 text-left">
                        <thead className="bg-slate-50">
                            <tr>
                                {['NIKY', 'Nama Lengkap', 'Email', 'No. WhatsApp', 'Status', 'Aksi'].map((label) => (
                                    <th
                                        key={label}
                                        className="whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 first:sm:px-7 last:sm:px-7"
                                    >
                                        {label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {gurus.data.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-5 py-12 text-center text-sm text-slate-500">
                                        Belum ada data guru.
                                    </td>
                                </tr>
                            ) : gurus.data.map((guru) => (
                                <tr key={guru.id} className="hover:bg-slate-50/70">
                                    <td className="whitespace-nowrap px-5 py-4 font-mono text-sm font-semibold text-slate-700 sm:px-7">
                                        {guru.nip}
                                    </td>
                                    <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-900">
                                        {guru.nama_lengkap}
                                    </td>
                                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                                        {guru.user.email}
                                    </td>
                                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                                        {guru.user.no_wa || '—'}
                                    </td>
                                    <td className="whitespace-nowrap px-5 py-4">
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                            guru.is_wali_kelas
                                                ? 'bg-indigo-50 text-indigo-700'
                                                : 'bg-slate-100 text-slate-600'
                                        }`}>
                                            {guru.is_wali_kelas ? 'Wali Kelas' : 'Guru'}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-5 py-4 sm:px-7">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => openEditForm(guru)}
                                                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setResettingGuru(guru)}
                                                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-50"
                                            >
                                                Reset Password
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDeletingGuru(guru)}
                                                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
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
                <div className="border-t border-slate-100 px-5 py-4 sm:px-7">
                    <AdminPagination links={gurus.links} />
                </div>
            </section>

            <AdminResourceModal
                show={isFormOpen}
                title={editingGuru ? 'Edit Data Guru' : 'Tambah Guru'}
                description="Data akun pengguna dan profil guru akan disimpan bersamaan."
                processing={form.processing}
                submitLabel={editingGuru ? 'Simpan Perubahan' : 'Tambah Guru'}
                onClose={closeForm}
                onSubmit={submitForm}
            >
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                        <label htmlFor="niky-guru" className="mb-2 block text-sm font-semibold text-slate-700">NIKY</label>
                        <input
                            id="niky-guru"
                            value={form.data.nip}
                            onChange={(event) => form.setData('nip', event.target.value)}
                            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <InputError message={form.errors.nip} className="mt-2" />
                    </div>
                    <div>
                        <label htmlFor="nama-guru" className="mb-2 block text-sm font-semibold text-slate-700">Nama Lengkap</label>
                        <input
                            id="nama-guru"
                            value={form.data.nama_lengkap}
                            onChange={(event) => form.setData('nama_lengkap', event.target.value)}
                            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <InputError message={form.errors.nama_lengkap} className="mt-2" />
                    </div>
                    <div>
                        <label htmlFor="email-guru" className="mb-2 block text-sm font-semibold text-slate-700">Email Akun</label>
                        <input
                            id="email-guru"
                            type="email"
                            autoComplete="email"
                            value={form.data.email}
                            onChange={(event) => form.setData('email', event.target.value)}
                            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <InputError message={form.errors.email} className="mt-2" />
                    </div>
                    <div>
                        <label htmlFor="wa-guru" className="mb-2 block text-sm font-semibold text-slate-700">No. WhatsApp</label>
                        <input
                            id="wa-guru"
                            type="tel"
                            value={form.data.no_wa}
                            onChange={(event) => form.setData('no_wa', event.target.value)}
                            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <InputError message={form.errors.no_wa} className="mt-2" />
                    </div>
                    <div className="sm:col-span-2">
                        <label htmlFor="password-guru" className="mb-2 block text-sm font-semibold text-slate-700">
                            Kata Sandi {editingGuru && <span className="font-normal text-slate-400">(kosongkan jika tidak diubah)</span>}
                        </label>
                        <input
                            id="password-guru"
                            type="password"
                            autoComplete="new-password"
                            value={form.data.password}
                            onChange={(event) => form.setData('password', event.target.value)}
                            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <InputError message={form.errors.password} className="mt-2" />
                    </div>
                    <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 sm:col-span-2">
                        <input
                            type="checkbox"
                            checked={form.data.is_wali_kelas}
                            onChange={(event) => form.setData('is_wali_kelas', event.target.checked)}
                            className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>
                            <span className="block text-sm font-semibold text-slate-800">Guru bertugas sebagai wali kelas</span>
                            <span className="mt-1 block text-xs text-slate-500">Guru ini akan tersedia pada pilihan wali kelas.</span>
                        </span>
                    </label>
                    <InputError message={form.errors.is_wali_kelas} className="sm:col-span-2" />
                </div>
            </AdminResourceModal>

            <AdminDeleteModal
                show={Boolean(deletingGuru)}
                title="Hapus akun guru?"
                description="Guru yang masih mengampu jadwal, ujian, atau kelas wali tidak dapat dihapus."
                processing={deleteForm.processing}
                onClose={() => setDeletingGuru(null)}
                onConfirm={deleteGuru}
            />

            <AdminResourceModal
                show={Boolean(resettingGuru)}
                title="Reset kata sandi akun guru?"
                description={`Kata sandi akun ${resettingGuru?.nama_lengkap ?? 'guru'} akan diatur ulang.`}
                processing={resetPasswordForm.processing}
                processingLabel="Mereset..."
                submitLabel="Reset Password"
                onClose={closeResetPassword}
                onSubmit={submitResetPassword}
            >
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                    Kata sandi baru adalah <span className="font-bold">password</span>. Sampaikan kata sandi ini secara aman kepada guru terkait.
                </p>
            </AdminResourceModal>
        </DashboardLayout>
    );
}
