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

const days = [
    { value: 'senin', label: 'Senin' },
    { value: 'selasa', label: 'Selasa' },
    { value: 'rabu', label: 'Rabu' },
    { value: 'kamis', label: 'Kamis' },
    { value: 'jumat', label: 'Jumat' },
    { value: 'sabtu', label: 'Sabtu' },
    { value: 'minggu', label: 'Minggu' },
];

export default function JadwalIndex({
    jadwals,
    kelasOptions,
    mapelOptions,
    guruOptions,
    tahunAjaranAktif,
    filters,
}) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingJadwal, setEditingJadwal] = useState(null);
    const [deletingJadwal, setDeletingJadwal] = useState(null);
    const form = useForm({
        kelas_id: '',
        mapel_id: '',
        guru_id: '',
        ruang: '',
        hari: 'senin',
        jam_mulai: '',
        jam_selesai: '',
    });
    const filterForm = useForm({
        kelas_id: filters.kelas_id ?? '',
        hari: filters.hari ?? '',
    });
    const deleteForm = useForm({});
    const canCreate = Boolean(
        tahunAjaranAktif && kelasOptions.length && mapelOptions.length && guruOptions.length,
    );

    const closeForm = () => {
        setIsFormOpen(false);
        setEditingJadwal(null);
        form.reset();
        form.clearErrors();
    };

    const openCreateForm = () => {
        setEditingJadwal(null);
        form.setData({
            kelas_id: '',
            mapel_id: '',
            guru_id: '',
            ruang: '',
            hari: 'senin',
            jam_mulai: '',
            jam_selesai: '',
        });
        form.clearErrors();
        setIsFormOpen(true);
    };

    const openEditForm = (jadwal) => {
        setEditingJadwal(jadwal);
        form.setData({
            kelas_id: String(jadwal.kelas_id),
            mapel_id: String(jadwal.mapel_id),
            guru_id: String(jadwal.guru_id),
            ruang: jadwal.ruang ?? '',
            hari: jadwal.hari,
            jam_mulai: jadwal.jam_mulai.slice(0, 5),
            jam_selesai: jadwal.jam_selesai.slice(0, 5),
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

        if (editingJadwal) {
            form.put(route('admin.jadwal.update', editingJadwal.id), options);
            return;
        }

        form.post(route('admin.jadwal.store'), options);
    };

    const submitFilter = (event) => {
        event.preventDefault();
        filterForm.get(route('admin.jadwal.index'), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const clearFilter = () => {
        filterForm.setData({ kelas_id: '', hari: '' });
        router.get(route('admin.jadwal.index'), {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const deleteJadwal = () => {
        if (!deletingJadwal) {
            return;
        }

        deleteForm.delete(route('admin.jadwal.destroy', deletingJadwal.id), {
            preserveScroll: true,
            onSuccess: () => setDeletingJadwal(null),
        });
    };

    return (
        <DashboardLayout
            title="Manajemen Jadwal Pelajaran"
            subtitle="Atur jadwal untuk tahun ajaran aktif dan hindari waktu yang bertabrakan di kelas."
            roleLabel="Administrator"
            navigation={AdminNavigationItems('jadwal')}
        >
            <Head title="Jadwal Pelajaran" />

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-5 border-b border-slate-100 px-5 py-5 sm:px-7">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="font-bold text-slate-900">Daftar jadwal</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                {tahunAjaranAktif
                                    ? `Tahun ajaran ${tahunAjaranAktif.nama_tahun} · ${tahunAjaranAktif.semester}`
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
                            Tambah Jadwal
                        </button>
                    </div>

                    <form onSubmit={submitFilter} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="flex-1 sm:max-w-xs">
                            <label htmlFor="filter-jadwal-kelas" className="mb-1.5 block text-sm font-semibold text-slate-700">
                                Kelas
                            </label>
                            <select
                                id="filter-jadwal-kelas"
                                value={filterForm.data.kelas_id}
                                onChange={(event) => filterForm.setData('kelas_id', event.target.value)}
                                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value="">Semua kelas</option>
                                {kelasOptions.map((kelas) => (
                                    <option key={kelas.id} value={kelas.id}>{kelas.nama_kelas}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1 sm:max-w-xs">
                            <label htmlFor="filter-jadwal-hari" className="mb-1.5 block text-sm font-semibold text-slate-700">
                                Hari
                            </label>
                            <select
                                id="filter-jadwal-hari"
                                value={filterForm.data.hari}
                                onChange={(event) => filterForm.setData('hari', event.target.value)}
                                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value="">Semua hari</option>
                                {days.map((day) => (
                                    <option key={day.value} value={day.value}>{day.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={filterForm.processing}
                                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
                            >
                                Terapkan
                            </button>
                            {(filters.kelas_id || filters.hari) && (
                                <button
                                    type="button"
                                    onClick={clearFilter}
                                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 text-left">
                        <thead className="bg-slate-50">
                            <tr>
                                {['Hari & Waktu', 'Kelas', 'Mata Pelajaran', 'Guru', 'Ruang', 'Aksi'].map((label) => (
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
                            {jadwals.data.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-5 py-12 text-center text-sm text-slate-500">
                                        Belum ada jadwal yang cocok dengan filter.
                                    </td>
                                </tr>
                            ) : jadwals.data.map((jadwal) => (
                                <tr key={jadwal.id} className="hover:bg-slate-50/70">
                                    <td className="whitespace-nowrap px-5 py-4 sm:px-7">
                                        <p className="text-sm font-semibold capitalize text-slate-800">{jadwal.hari}</p>
                                        <p className="mt-1 text-xs text-indigo-700">{jadwal.jam_mulai.slice(0, 5)} – {jadwal.jam_selesai.slice(0, 5)}</p>
                                    </td>
                                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">{jadwal.kelas?.nama_kelas}</td>
                                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">{jadwal.mata_pelajaran?.nama_mapel}</td>
                                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">{jadwal.guru?.nama_lengkap}</td>
                                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">{jadwal.ruang ?? 'Belum ditentukan'}</td>
                                    <td className="whitespace-nowrap px-5 py-4 sm:px-7">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => openEditForm(jadwal)}
                                                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDeletingJadwal(jadwal)}
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
                    <AdminPagination links={jadwals.links} />
                </div>
            </section>

            <AdminResourceModal
                show={isFormOpen}
                title={editingJadwal ? 'Edit Jadwal' : 'Tambah Jadwal'}
                description="Jadwal hanya dibuat untuk tahun ajaran aktif. Jam yang beririsan pada kelas dan hari yang sama akan ditolak."
                processing={form.processing}
                submitLabel={editingJadwal ? 'Simpan Perubahan' : 'Tambah Jadwal'}
                onClose={closeForm}
                onSubmit={submitForm}
            >
                <div className="rounded-xl bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-800">
                    Tahun ajaran aktif:{' '}
                    {tahunAjaranAktif
                        ? `${tahunAjaranAktif.nama_tahun} · ${tahunAjaranAktif.semester}`
                        : 'belum ditetapkan'}
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                        <label htmlFor="jadwal-kelas" className="mb-2 block text-sm font-semibold text-slate-700">Kelas</label>
                        <select
                            id="jadwal-kelas"
                            value={form.data.kelas_id}
                            onChange={(event) => form.setData('kelas_id', event.target.value)}
                            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="">Pilih kelas</option>
                            {kelasOptions.map((kelas) => <option key={kelas.id} value={kelas.id}>{kelas.nama_kelas}</option>)}
                        </select>
                        <InputError message={form.errors.kelas_id} className="mt-2" />
                    </div>
                    <div>
                        <label htmlFor="jadwal-mapel" className="mb-2 block text-sm font-semibold text-slate-700">Mata Pelajaran</label>
                        <select
                            id="jadwal-mapel"
                            value={form.data.mapel_id}
                            onChange={(event) => form.setData('mapel_id', event.target.value)}
                            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="">Pilih mata pelajaran</option>
                            {mapelOptions.map((mapel) => <option key={mapel.id} value={mapel.id}>{mapel.kode_mapel} · {mapel.nama_mapel}</option>)}
                        </select>
                        <InputError message={form.errors.mapel_id} className="mt-2" />
                    </div>
                    <div>
                        <label htmlFor="jadwal-guru" className="mb-2 block text-sm font-semibold text-slate-700">Guru Pengampu</label>
                        <select
                            id="jadwal-guru"
                            value={form.data.guru_id}
                            onChange={(event) => form.setData('guru_id', event.target.value)}
                            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="">Pilih guru</option>
                            {guruOptions.map((guru) => <option key={guru.id} value={guru.id}>{guru.nama_lengkap}</option>)}
                        </select>
                        <InputError message={form.errors.guru_id} className="mt-2" />
                    </div>
                    <div>
                        <label htmlFor="jadwal-hari" className="mb-2 block text-sm font-semibold text-slate-700">Hari</label>
                        <select
                            id="jadwal-hari"
                            value={form.data.hari}
                            onChange={(event) => form.setData('hari', event.target.value)}
                            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            {days.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}
                        </select>
                        <InputError message={form.errors.hari} className="mt-2" />
                    </div>
                    <div>
                        <label htmlFor="jadwal-ruang" className="mb-2 block text-sm font-semibold text-slate-700">Ruang</label>
                        <input
                            id="jadwal-ruang"
                            type="text"
                            maxLength="100"
                            value={form.data.ruang}
                            onChange={(event) => form.setData('ruang', event.target.value)}
                            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <InputError message={form.errors.ruang} className="mt-2" />
                    </div>
                    <div>
                        <label htmlFor="jam-mulai" className="mb-2 block text-sm font-semibold text-slate-700">Jam Mulai</label>
                        <input
                            id="jam-mulai"
                            type="time"
                            value={form.data.jam_mulai}
                            onChange={(event) => form.setData('jam_mulai', event.target.value)}
                            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <InputError message={form.errors.jam_mulai} className="mt-2" />
                    </div>
                    <div>
                        <label htmlFor="jam-selesai" className="mb-2 block text-sm font-semibold text-slate-700">Jam Selesai</label>
                        <input
                            id="jam-selesai"
                            type="time"
                            value={form.data.jam_selesai}
                            onChange={(event) => form.setData('jam_selesai', event.target.value)}
                            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <InputError message={form.errors.jam_selesai} className="mt-2" />
                    </div>
                </div>
            </AdminResourceModal>

            <AdminDeleteModal
                show={Boolean(deletingJadwal)}
                title="Hapus jadwal?"
                description="Jadwal yang dihapus tidak dapat dikembalikan."
                processing={deleteForm.processing}
                onClose={() => setDeletingJadwal(null)}
                onConfirm={deleteJadwal}
            />
        </DashboardLayout>
    );
}
