import AdminNavigationItems from '@/Components/AdminNavigationItems';
import { AdminDeleteModal, AdminResourceModal } from '@/Components/AdminResourceModal';
import InputError from '@/Components/InputError';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';

const currencyFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

export default function BeasiswaIndex({ kategoriBeasiswas, tarif }) {
    const [editingCategory, setEditingCategory] = useState(null);
    const [deletingCategory, setDeletingCategory] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const form = useForm({
        nama_beasiswa: '',
        jenis_potongan: 'persen',
        nilai_potongan: 0,
        is_afirmasi: false,
        keterangan: '',
    });
    const deleteForm = useForm({});
    const sppBase = Number(tarif.tarif_spp_reguler);
    const practicalBase = Number(tarif.tarif_praktikum);

    const closeForm = () => {
        setIsFormOpen(false);
        setEditingCategory(null);
        form.reset();
        form.clearErrors();
    };

    const openCreateForm = () => {
        setEditingCategory(null);
        form.setData({
            nama_beasiswa: '',
            jenis_potongan: 'persen',
            nilai_potongan: 0,
            is_afirmasi: false,
            keterangan: '',
        });
        form.clearErrors();
        setIsFormOpen(true);
    };

    const openEditForm = (category) => {
        setEditingCategory(category);
        form.setData({
            nama_beasiswa: category.nama_beasiswa,
            jenis_potongan: category.jenis_potongan,
            nilai_potongan: category.nilai_potongan,
            is_afirmasi: category.is_afirmasi,
            keterangan: category.keterangan ?? '',
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

        if (editingCategory) {
            form.put(route('admin.beasiswa.update', editingCategory.id), options);
            return;
        }

        form.post(route('admin.beasiswa.store'), options);
    };

    const deleteCategory = () => {
        if (!deletingCategory) {
            return;
        }

        deleteForm.delete(route('admin.beasiswa.destroy', deletingCategory.id), {
            preserveScroll: true,
            onSuccess: () => setDeletingCategory(null),
        });
    };

    return (
        <DashboardLayout
            title="Kategori Beasiswa"
            subtitle="Atur kategori potongan dan status afirmasi yang dipakai pada pendaftaran serta tagihan."
            roleLabel="Administrator"
            navigation={AdminNavigationItems('beasiswa')}
        >
            <Head title="Kategori Beasiswa" />

            <div className="flex flex-col gap-6">
                <section className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5 text-sm leading-6 text-indigo-950 sm:p-6">
                    <h2 className="font-bold">Aturan biaya program</h2>
                    <p className="mt-2">
                        SPP Reguler {currencyFormatter.format(sppBase)}; Santri Internal {currencyFormatter.format(Math.round(sppBase * 0.3))} (diskon 70%); Santri Eksternal {currencyFormatter.format(Math.round(sppBase * 0.7))} (diskon 30%).
                    </p>
                    <p>
                        Praktikum {currencyFormatter.format(practicalBase)}; tidak ada potongan program santri.
                        Kategori Afirmasi membebaskan SPP dan Praktikum. Tagihan khusus selalu penuh untuk semua siswa.
                    </p>
                    <p className="mt-2 text-xs text-indigo-800">
                        Nilai potongan kategori non-afirmasi diterapkan pada SPP. Tarif dapat diubah pada Pengaturan Sekolah.
                    </p>
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                        <div>
                            <h2 className="font-bold text-slate-900">Daftar kategori</h2>
                            <p className="mt-1 text-sm text-slate-500">{kategoriBeasiswas.length} kategori</p>
                        </div>
                        <button
                            type="button"
                            onClick={openCreateForm}
                            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                        >
                            Tambah Kategori
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 text-left">
                            <thead className="bg-slate-50">
                                <tr>
                                    {['Nama', 'Potongan', 'Afirmasi', 'Digunakan', 'Keterangan', 'Aksi'].map((label) => (
                                        <th key={label} className="whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            {label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {kategoriBeasiswas.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-5 py-12 text-center text-sm text-slate-500">
                                            Belum ada kategori beasiswa.
                                        </td>
                                    </tr>
                                ) : kategoriBeasiswas.map((category) => (
                                    <tr key={category.id}>
                                        <td className="px-5 py-4 text-sm font-semibold text-slate-900">{category.nama_beasiswa}</td>
                                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                                            {category.jenis_potongan === 'persen'
                                                ? `${Number(category.nilai_potongan)}%`
                                                : currencyFormatter.format(Number(category.nilai_potongan))}
                                        </td>
                                        <td className="px-5 py-4 text-sm text-slate-700">{category.is_afirmasi ? 'Ya' : 'Tidak'}</td>
                                        <td className="px-5 py-4 text-sm text-slate-700">
                                            {category.siswas_count} siswa · {category.pendaftaran_spmbs_count} pendaftar
                                        </td>
                                        <td className="max-w-72 px-5 py-4 text-sm text-slate-600">{category.keterangan || '—'}</td>
                                        <td className="whitespace-nowrap px-5 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditForm(category)}
                                                    className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setDeletingCategory(category)}
                                                    className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
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
            </div>

            <AdminResourceModal
                show={isFormOpen}
                title={editingCategory ? 'Edit Kategori Beasiswa' : 'Tambah Kategori Beasiswa'}
                description="Kategori potongan dapat digunakan pada tagihan dan biodata pendaftar."
                processing={form.processing}
                submitLabel={editingCategory ? 'Simpan Perubahan' : 'Tambah Kategori'}
                onClose={closeForm}
                onSubmit={submitForm}
            >
                <div className="flex flex-col gap-4">
                    <div>
                        <label htmlFor="nama-beasiswa" className="mb-2 block text-sm font-semibold text-slate-700">Nama Kategori</label>
                        <input
                            id="nama-beasiswa"
                            value={form.data.nama_beasiswa}
                            onChange={(event) => form.setData('nama_beasiswa', event.target.value)}
                            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <InputError message={form.errors.nama_beasiswa} className="mt-2" />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="jenis-potongan" className="mb-2 block text-sm font-semibold text-slate-700">Jenis Potongan</label>
                            <select
                                id="jenis-potongan"
                                value={form.data.jenis_potongan}
                                onChange={(event) => form.setData('jenis_potongan', event.target.value)}
                                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value="persen">Persen</option>
                                <option value="nominal">Nominal (Rp)</option>
                            </select>
                            <InputError message={form.errors.jenis_potongan} className="mt-2" />
                        </div>
                        <div>
                            <label htmlFor="nilai-potongan" className="mb-2 block text-sm font-semibold text-slate-700">Nilai Potongan</label>
                            <input
                                id="nilai-potongan"
                                type="number"
                                min="0"
                                max={form.data.jenis_potongan === 'persen' ? '100' : undefined}
                                step="0.01"
                                value={form.data.nilai_potongan}
                                onChange={(event) => form.setData('nilai_potongan', event.target.value)}
                                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            <InputError message={form.errors.nilai_potongan} className="mt-2" />
                        </div>
                    </div>
                    <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 text-sm text-slate-700">
                        <input
                            type="checkbox"
                            checked={Boolean(form.data.is_afirmasi)}
                            onChange={(event) => form.setData('is_afirmasi', event.target.checked)}
                            className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Kategori afirmasi: SPP dan Praktikum menjadi Rp0; tagihan khusus tetap penuh.</span>
                    </label>
                    <InputError message={form.errors.is_afirmasi} />
                    <div>
                        <label htmlFor="keterangan-beasiswa" className="mb-2 block text-sm font-semibold text-slate-700">Keterangan</label>
                        <textarea
                            id="keterangan-beasiswa"
                            rows="3"
                            value={form.data.keterangan}
                            onChange={(event) => form.setData('keterangan', event.target.value)}
                            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <InputError message={form.errors.keterangan} className="mt-2" />
                    </div>
                </div>
            </AdminResourceModal>

            <AdminDeleteModal
                show={Boolean(deletingCategory)}
                title="Hapus kategori beasiswa?"
                description="Kategori yang sudah dipakai oleh siswa atau pendaftar tidak dapat dihapus."
                processing={deleteForm.processing}
                onClose={() => setDeletingCategory(null)}
                onConfirm={deleteCategory}
            />
        </DashboardLayout>
    );
}
