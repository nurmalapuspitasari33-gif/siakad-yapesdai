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

function calculateEndTime(startTime, jumlahJp) {
    if (!startTime || !jumlahJp) {
        return '';
    }

    const [hours, minutes] = startTime.split(':').map(Number);
    const endMinutes = (hours * 60) + minutes + (Number(jumlahJp) * 40);

    if (endMinutes >= 24 * 60) {
        return '';
    }

    return `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;
}

export default function JadwalIndex({
    jadwals,
    kelasOptions,
    tugasMengajarOptions,
    tahunAjaranAktif,
    filters,
}) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingJadwal, setEditingJadwal] = useState(null);
    const [deletingJadwal, setDeletingJadwal] = useState(null);
    const form = useForm({
        tugas_mengajar_id: '',
        jumlah_jp: '1',
        ruang: '',
        hari: 'senin',
        jam_mulai: '',
    });
    const filterForm = useForm({
        kelas_id: filters.kelas_id ?? '',
        hari: filters.hari ?? '',
    });
    const deleteForm = useForm({});
    const canCreate = Boolean(tahunAjaranAktif && tugasMengajarOptions.length);
    const selectedTugasMengajar = tugasMengajarOptions.find(
        (tugasMengajar) => String(tugasMengajar.id) === form.data.tugas_mengajar_id,
    );
    const jamSelesai = calculateEndTime(form.data.jam_mulai, form.data.jumlah_jp);
    const tersediaJp = selectedTugasMengajar
        ? selectedTugasMengajar.jp_per_minggu
            - selectedTugasMengajar.jp_terjadwal
            + (editingJadwal?.tugas_mengajar_id === selectedTugasMengajar.id
                ? Number(editingJadwal.jumlah_jp ?? 0)
                : 0)
        : 0;

    const closeForm = () => {
        setIsFormOpen(false);
        setEditingJadwal(null);
        form.reset();
        form.clearErrors();
    };

    const openCreateForm = () => {
        setEditingJadwal(null);
        form.setData({
            tugas_mengajar_id: '',
            jumlah_jp: '1',
            ruang: '',
            hari: 'senin',
            jam_mulai: '',
        });
        form.clearErrors();
        setIsFormOpen(true);
    };

    const openEditForm = (jadwal) => {
        setEditingJadwal(jadwal);
        form.setData({
            tugas_mengajar_id: jadwal.tugas_mengajar_id ? String(jadwal.tugas_mengajar_id) : '',
            jumlah_jp: jadwal.jumlah_jp === null || jadwal.jumlah_jp === undefined
                ? ''
                : String(jadwal.jumlah_jp),
            ruang: jadwal.ruang ?? '',
            hari: jadwal.hari,
            jam_mulai: jadwal.jam_mulai.slice(0, 5),
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
            subtitle="Susun jadwal dari pembagian tugas mengajar dan cegah bentrok kelas maupun guru."
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

                <div className="w-full overflow-x-auto">
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
                                    <td colSpan="6" className="px-5 py-12 text-center text-sm text-slate-500">
                                        {tugasMengajarOptions.length
                                            ? 'Belum ada jadwal yang cocok dengan filter.'
                                            : 'Tambahkan pembagian tugas mengajar terlebih dahulu agar dapat menyusun jadwal.'}
                                    </td>
                                </tr>
                            ) : jadwals.data.map((jadwal) => (
                                <tr key={jadwal.id} className="hover:bg-slate-50/70">
                                    <td className="whitespace-nowrap px-5 py-4 sm:px-7">
                                        <p className="text-sm font-semibold capitalize text-slate-800">{jadwal.hari}</p>
                                        <p className="mt-1 text-xs text-indigo-700">{jadwal.jam_mulai.slice(0, 5)} – {jadwal.jam_selesai.slice(0, 5)}</p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {jadwal.jumlah_jp ? `${jadwal.jumlah_jp} JP` : 'Jadwal lama'}
                                        </p>
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
                description="Pilih penugasan yang sudah dibuat. Satu JP berdurasi 40 menit; jam selesai dihitung otomatis. Buat sesi terpisah jika ada jeda."
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
                    <div className="sm:col-span-2">
                        <label htmlFor="jadwal-tugas-mengajar" className="mb-2 block text-sm font-semibold text-slate-700">
                            Penugasan Mengajar
                        </label>
                        <select
                            id="jadwal-tugas-mengajar"
                            value={form.data.tugas_mengajar_id}
                            onChange={(event) => form.setData('tugas_mengajar_id', event.target.value)}
                            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="">Pilih guru, kelas, dan mata pelajaran</option>
                            {tugasMengajarOptions.map((tugasMengajar) => (
                                <option
                                    key={tugasMengajar.id}
                                    value={tugasMengajar.id}
                                    disabled={tugasMengajar.jp_terjadwal >= tugasMengajar.jp_per_minggu
                                        && editingJadwal?.tugas_mengajar_id !== tugasMengajar.id}
                                >
                                    {tugasMengajar.guru.nama_lengkap} · {tugasMengajar.kelas.nama_kelas} · {tugasMengajar.mata_pelajaran.nama_mapel} ({tugasMengajar.jp_terjadwal}/{tugasMengajar.jp_per_minggu} JP)
                                </option>
                            ))}
                        </select>
                        <InputError message={form.errors.tugas_mengajar_id} className="mt-2" />
                        {editingJadwal && !editingJadwal.tugas_mengajar_id && (
                            <p className="mt-2 text-xs text-amber-700">
                                Jadwal lama saat ini {editingJadwal.jam_mulai.slice(0, 5)}–{editingJadwal.jam_selesai.slice(0, 5)} dan belum terhubung ke penugasan. Pilih penugasan serta JP yang sesuai; waktu selesai akan dihitung ulang.
                            </p>
                        )}
                    </div>
                    <div>
                        <label htmlFor="jadwal-jumlah-jp" className="mb-2 block text-sm font-semibold text-slate-700">
                            Jumlah JP pada sesi
                        </label>
                        <input
                            id="jadwal-jumlah-jp"
                            type="number"
                            min="1"
                            max={selectedTugasMengajar ? Math.max(tersediaJp, 1) : 255}
                            step="1"
                            value={form.data.jumlah_jp}
                            onChange={(event) => form.setData('jumlah_jp', event.target.value)}
                            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <p className="mt-1 text-xs text-slate-500">
                            {selectedTugasMengajar
                                ? `Sisa target penugasan: ${Math.max(tersediaJp, 0)} JP.`
                                : 'Pilih penugasan untuk melihat sisa target JP.'}{' '}
                            Satu JP = 40 menit.
                        </p>
                        <InputError message={form.errors.jumlah_jp} className="mt-2" />
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
                        <span className="mb-2 block text-sm font-semibold text-slate-700">Jam Selesai</span>
                        <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                            {jamSelesai || 'Akan dihitung dari jam mulai dan jumlah JP'}
                        </p>
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
