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

export default function TugasMengajarIndex({
    tugasMengajars,
    guruOptions,
    kelasOptions,
    mapelOptions,
    tahunAjaranAktif,
}) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTugasMengajar, setEditingTugasMengajar] = useState(null);
    const [deletingTugasMengajar, setDeletingTugasMengajar] = useState(null);
    const form = useForm({
        guru_id: '',
        kelas_id: '',
        mapel_id: '',
        jp_per_minggu: '1',
    });
    const deleteForm = useForm({});
    const canCreate = Boolean(
        tahunAjaranAktif && guruOptions.length && kelasOptions.length && mapelOptions.length,
    );

    const closeForm = () => {
        setIsFormOpen(false);
        setEditingTugasMengajar(null);
        form.reset();
        form.clearErrors();
    };

    const openCreateForm = () => {
        setEditingTugasMengajar(null);
        form.setData({
            guru_id: '',
            kelas_id: '',
            mapel_id: '',
            jp_per_minggu: '1',
        });
        form.clearErrors();
        setIsFormOpen(true);
    };

    const openEditForm = (tugasMengajar) => {
        setEditingTugasMengajar(tugasMengajar);
        form.setData({
            guru_id: String(tugasMengajar.guru.id),
            kelas_id: String(tugasMengajar.kelas.id),
            mapel_id: String(tugasMengajar.mata_pelajaran.id),
            jp_per_minggu: String(tugasMengajar.jp_per_minggu),
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

        if (editingTugasMengajar) {
            form.put(route('admin.tugas-mengajar.update', editingTugasMengajar.id), options);
            return;
        }

        form.post(route('admin.tugas-mengajar.store'), options);
    };

    const deleteTugasMengajar = () => {
        if (!deletingTugasMengajar) {
            return;
        }

        deleteForm.delete(route('admin.tugas-mengajar.destroy', deletingTugasMengajar.id), {
            preserveScroll: true,
            onSuccess: () => setDeletingTugasMengajar(null),
        });
    };

    return (
        <DashboardLayout
            title="Pembagian Tugas Mengajar"
            subtitle="Tetapkan guru, kelas, mata pelajaran, dan target JP mingguan sebelum menyusun jadwal."
            roleLabel="Administrator"
            navigation={AdminNavigationItems('tugas-mengajar')}
        >
            <Head title="Pembagian Tugas Mengajar" />

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                    <div>
                        <h2 className="font-bold text-slate-900">Daftar penugasan</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {tahunAjaranAktif
                                ? `${tahunAjaranAktif.nama_tahun} · ${tahunAjaranAktif.semester} · ${tugasMengajars.total} penugasan`
                                : 'Belum ada tahun ajaran aktif'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={openCreateForm}
                        disabled={!canCreate}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <span className="text-lg leading-none" aria-hidden="true">+</span>
                        Tambah Penugasan
                    </button>
                </div>

                <div className="border-b border-slate-100 bg-indigo-50/70 px-5 py-4 text-sm leading-6 text-indigo-900 sm:px-7">
                    Masukkan target JP untuk setiap guru, kelas, dan mata pelajaran. Satu JP berdurasi 40 menit; jadwal tidak dapat melebihi target mingguan.
                </div>

                <div className="w-full overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 text-left">
                        <thead className="bg-slate-50">
                            <tr>
                                {['Guru', 'Kelas', 'Mata Pelajaran', 'JP Target/Minggu', 'Sudah Dijadwalkan', 'Aksi'].map((label) => (
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
                            {tugasMengajars.data.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-5 py-12 text-center text-sm text-slate-500">
                                        Belum ada pembagian tugas mengajar untuk tahun ajaran aktif.
                                    </td>
                                </tr>
                            ) : tugasMengajars.data.map((tugasMengajar) => (
                                <tr key={tugasMengajar.id} className="hover:bg-slate-50/70">
                                    <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-900 sm:px-7">
                                        {tugasMengajar.guru.nama_lengkap}
                                    </td>
                                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                                        {tugasMengajar.kelas.nama_kelas}
                                    </td>
                                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                                        {tugasMengajar.mata_pelajaran.nama_mapel}
                                    </td>
                                    <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-800">
                                        {tugasMengajar.jp_per_minggu} JP
                                    </td>
                                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                                        {tugasMengajar.jp_terjadwal} / {tugasMengajar.jp_per_minggu} JP
                                    </td>
                                    <td className="whitespace-nowrap px-5 py-4 sm:px-7">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => openEditForm(tugasMengajar)}
                                                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDeletingTugasMengajar(tugasMengajar)}
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
                    <AdminPagination links={tugasMengajars.links} />
                </div>
            </section>

            <AdminResourceModal
                show={isFormOpen}
                title={editingTugasMengajar ? 'Edit Penugasan Mengajar' : 'Tambah Penugasan Mengajar'}
                description="Penugasan berlaku untuk tahun ajaran aktif dan akan menjadi sumber pilihan pada form jadwal."
                processing={form.processing}
                submitLabel={editingTugasMengajar ? 'Simpan Perubahan' : 'Tambah Penugasan'}
                onClose={closeForm}
                onSubmit={submitForm}
                maxWidth="2xl"
            >
                <div className="rounded-xl bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-800">
                    Tahun ajaran aktif:{' '}
                    {tahunAjaranAktif
                        ? `${tahunAjaranAktif.nama_tahun} · ${tahunAjaranAktif.semester}`
                        : 'belum ditetapkan'}
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                        <label htmlFor="tugas-mengajar-guru" className="mb-2 block text-sm font-semibold text-slate-700">
                            Guru
                        </label>
                        <select
                            id="tugas-mengajar-guru"
                            value={form.data.guru_id}
                            onChange={(event) => form.setData('guru_id', event.target.value)}
                            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="">Pilih guru</option>
                            {guruOptions.map((guru) => (
                                <option key={guru.id} value={guru.id}>{guru.nama_lengkap}</option>
                            ))}
                        </select>
                        <InputError message={form.errors.guru_id} className="mt-2" />
                    </div>
                    <div>
                        <label htmlFor="tugas-mengajar-kelas" className="mb-2 block text-sm font-semibold text-slate-700">
                            Kelas
                        </label>
                        <select
                            id="tugas-mengajar-kelas"
                            value={form.data.kelas_id}
                            onChange={(event) => form.setData('kelas_id', event.target.value)}
                            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="">Pilih kelas</option>
                            {kelasOptions.map((kelas) => (
                                <option key={kelas.id} value={kelas.id}>{kelas.nama_kelas}</option>
                            ))}
                        </select>
                        <InputError message={form.errors.kelas_id} className="mt-2" />
                    </div>
                    <div>
                        <label htmlFor="tugas-mengajar-mapel" className="mb-2 block text-sm font-semibold text-slate-700">
                            Mata Pelajaran
                        </label>
                        <select
                            id="tugas-mengajar-mapel"
                            value={form.data.mapel_id}
                            onChange={(event) => form.setData('mapel_id', event.target.value)}
                            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="">Pilih mata pelajaran</option>
                            {mapelOptions.map((mapel) => (
                                <option key={mapel.id} value={mapel.id}>
                                    {mapel.kode_mapel} · {mapel.nama_mapel}
                                </option>
                            ))}
                        </select>
                        <InputError message={form.errors.mapel_id} className="mt-2" />
                    </div>
                    <div>
                        <label htmlFor="tugas-mengajar-jp" className="mb-2 block text-sm font-semibold text-slate-700">
                            Target JP per Minggu
                        </label>
                        <input
                            id="tugas-mengajar-jp"
                            type="number"
                            min="1"
                            max="255"
                            step="1"
                            value={form.data.jp_per_minggu}
                            onChange={(event) => form.setData('jp_per_minggu', event.target.value)}
                            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <p className="mt-1 text-xs text-slate-500">Jumlah ini fleksibel; jadwal akan mengurangi sisa target.</p>
                        <InputError message={form.errors.jp_per_minggu} className="mt-2" />
                    </div>
                </div>
            </AdminResourceModal>

            <AdminDeleteModal
                show={Boolean(deletingTugasMengajar)}
                title="Hapus penugasan mengajar?"
                description="Penugasan yang sudah digunakan oleh jadwal tidak dapat dihapus."
                processing={deleteForm.processing}
                onClose={() => setDeletingTugasMengajar(null)}
                onConfirm={deleteTugasMengajar}
            />
        </DashboardLayout>
    );
}
