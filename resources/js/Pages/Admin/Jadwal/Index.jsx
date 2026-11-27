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
];

const filterDays = [...days, { value: 'minggu', label: 'Minggu' }];

const breakIntervals = [{ start: 9 * 60 + 40, end: 10 * 60 }, { start: 12 * 60, end: 12 * 60 + 30 }];

function timeToMinutes(time) {
    const [hours, minutes] = time.slice(0, 5).split(':').map(Number);

    return (hours * 60) + minutes;
}

function formatTime(minutes) {
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

function startsDuringBreak(startTime) {
    if (!startTime) {
        return false;
    }

    const startMinutes = timeToMinutes(startTime);

    return breakIntervals.some(
        (interval) => startMinutes >= interval.start && startMinutes < interval.end,
    );
}

function maximumPeriodForDay(day) {
    return day === 'jumat' ? 5 : 9;
}

function findPeriodForStartTime(startTime, jamKeOptions) {
    return jamKeOptions.find((option) => option.jam_mulai === startTime.slice(0, 5))?.jam_ke ?? '';
}

function getPeriodRange(startTime, jumlahJp, day, jamKeOptions) {
    const firstPeriod = findPeriodForStartTime(startTime, jamKeOptions);

    if (!firstPeriod || !jumlahJp) {
        return '';
    }

    const lastPeriod = Number(firstPeriod) + Number(jumlahJp) - 1;

    if (lastPeriod > maximumPeriodForDay(day)) {
        return '';
    }

    return `Jam ke-${firstPeriod}${lastPeriod > firstPeriod ? `–${lastPeriod}` : ''}`;
}

function calculateEndTime(startTime, jumlahJp) {
    if (!startTime || !jumlahJp) {
        return '';
    }

    const startMinutes = timeToMinutes(startTime);
    let endMinutes = startMinutes + (Number(jumlahJp) * 40);

    if (startsDuringBreak(startTime)) {
        return '';
    }

    breakIntervals.forEach((interval) => {
        if (startMinutes < interval.end && endMinutes > interval.start) {
            endMinutes += interval.end - interval.start;
        }
    });

    if (endMinutes >= 24 * 60) {
        return '';
    }

    return formatTime(endMinutes);
}

function formatTeachingIntervals(startTime, endTime) {
    const sessionStart = timeToMinutes(startTime);
    const sessionEnd = timeToMinutes(endTime);
    const intervals = [];
    let intervalStart = sessionStart;

    breakIntervals.forEach((breakInterval) => {
        if (intervalStart < breakInterval.start && sessionEnd > breakInterval.start) {
            intervals.push(`${formatTime(intervalStart)}–${formatTime(breakInterval.start)}`);
            intervalStart = Math.max(intervalStart, breakInterval.end);
        }
    });

    if (intervalStart < sessionEnd) {
        intervals.push(`${formatTime(intervalStart)}–${formatTime(sessionEnd)}`);
    }

    return intervals.join(' · istirahat · ');
}

export default function JadwalIndex({
    jadwals,
    kelasOptions,
    tugasMengajarOptions,
    tahunAjaranAktif,
    filters,
    jamKeOptions,
    canGenerateSchedule,
    hasExistingSchedules,
}) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isGenerateOpen, setIsGenerateOpen] = useState(false);
    const [editingJadwal, setEditingJadwal] = useState(null);
    const [deletingJadwal, setDeletingJadwal] = useState(null);
    const form = useForm({
        tugas_mengajar_id: '',
        jumlah_jp: '1',
        ruang: '',
        hari: 'senin',
        jam_ke_mulai: '1',
    });
    const generateForm = useForm({});
    const filterForm = useForm({
        kelas_id: filters.kelas_id ?? '',
        hari: filters.hari ?? '',
    });
    const deleteForm = useForm({});
    const canCreate = Boolean(tahunAjaranAktif && tugasMengajarOptions.length);
    const selectedTugasMengajar = tugasMengajarOptions.find(
        (tugasMengajar) => String(tugasMengajar.id) === form.data.tugas_mengajar_id,
    );
    const jamKeMulai = Number(form.data.jam_ke_mulai);
    const jamMulai = jamKeOptions.find((option) => option.jam_ke === jamKeMulai)?.jam_mulai ?? '';
    const jamSelesai = calculateEndTime(jamMulai, form.data.jumlah_jp);
    const rentangJamSesi = jamSelesai
        ? formatTeachingIntervals(jamMulai, jamSelesai)
        : '';
    const rentangJamKe = jamKeMulai >= 1
        && form.data.jumlah_jp
        && jamKeMulai + Number(form.data.jumlah_jp) - 1 <= maximumPeriodForDay(form.data.hari)
        ? `Jam ke-${jamKeMulai}${jamKeMulai + Number(form.data.jumlah_jp) - 1 > jamKeMulai
            ? `–${jamKeMulai + Number(form.data.jumlah_jp) - 1}`
            : ''}`
        : '';
    const sesiMelewatiBatasHari = jamKeMulai >= 1
        && form.data.jumlah_jp
        && jamKeMulai + Number(form.data.jumlah_jp) - 1 > maximumPeriodForDay(form.data.hari);
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
            jam_ke_mulai: '1',
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
            jam_ke_mulai: String(findPeriodForStartTime(jadwal.jam_mulai, jamKeOptions)),
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

    const changeScheduleDay = (hari) => {
        const jamKeMulai = Math.max(
            1,
            Math.min(Number(form.data.jam_ke_mulai) || 1, maximumPeriodForDay(hari)),
        );

        form.setData({
            ...form.data,
            hari,
            jam_ke_mulai: String(jamKeMulai),
        });
    };

    const submitGenerateForm = (event) => {
        event.preventDefault();
        generateForm.post(route('admin.jadwal.generate'), {
            preserveScroll: true,
            onSuccess: () => setIsGenerateOpen(false),
        });
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
            subtitle="Susun jadwal dari pembagian tugas mengajar. Istirahat setiap hari: 09.40–10.00 dan 12.00–12.30."
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
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <button
                                type="button"
                                onClick={() => setIsGenerateOpen(true)}
                                disabled={!canGenerateSchedule}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Generate Otomatis
                            </button>
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
                    </div>
                    {hasExistingSchedules && (
                        <p className="text-xs text-slate-500">
                            Generator hanya tersedia sebelum ada jadwal tersimpan agar jadwal semester berjalan tetap aman.
                        </p>
                    )}

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
                                {filterDays.map((day) => (
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
                                {['Hari & Jam ke-', 'Kelas', 'Mata Pelajaran', 'Guru', 'Ruang', 'Aksi'].map((label) => (
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
                                        <p className="mt-1 text-xs font-semibold text-slate-700">
                                            {getPeriodRange(jadwal.jam_mulai, jadwal.jumlah_jp, jadwal.hari, jamKeOptions)
                                                || 'Jam lama / nonbaku'}
                                        </p>
                                        <p className="mt-1 text-xs text-indigo-700">
                                            {jadwal.tugas_mengajar_id
                                                ? formatTeachingIntervals(jadwal.jam_mulai, jadwal.jam_selesai)
                                                : `${jadwal.jam_mulai.slice(0, 5)} – ${jadwal.jam_selesai.slice(0, 5)}`}
                                        </p>
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
                show={isGenerateOpen}
                title="Generate Jadwal Otomatis"
                description="Generator menyusun seluruh JP target untuk tahun ajaran aktif tanpa mengubah jadwal yang sudah tersimpan."
                processing={generateForm.processing}
                submitLabel="Generate Jadwal"
                onClose={() => setIsGenerateOpen(false)}
                onSubmit={submitGenerateForm}
            >
                <div className="space-y-3 rounded-xl bg-indigo-50 px-4 py-4 text-sm leading-6 text-indigo-900">
                    <p>
                        Generator mengatur jadwal Senin–Sabtu, maksimal 9 jam ke- per hari dan 5 jam ke- pada Jumat. Jam istirahat 09.40–10.00 serta 12.00–12.30 tidak dihitung sebagai JP.
                    </p>
                    <p>
                        Target JP setiap penugasan akan disebar dengan blok maksimal 3 jam ke- berurutan. Bentrok guru maupun kelas dihindari. Jika semua JP tidak dapat ditempatkan, generator tidak menyimpan jadwal parsial.
                    </p>
                </div>
            </AdminResourceModal>

            <AdminResourceModal
                show={isFormOpen}
                title={editingJadwal ? 'Edit Jadwal' : 'Tambah Jadwal'}
                description="Pilih penugasan yang sudah dibuat. Satu JP berdurasi 40 menit; jam selesai disesuaikan otomatis jika sesi melewati waktu istirahat."
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
                <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                    Jam ke-1 dimulai pukul 07.00 dan setiap JP berlangsung 40 menit. Istirahat setiap hari pukul 09.40–10.00 dan 12.00–12.30 tidak dihitung sebagai JP. Hari Jumat hanya sampai jam ke-5; generator menyusun jadwal Senin–Sabtu.
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
                            onChange={(event) => changeScheduleDay(event.target.value)}
                            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            {days.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}
                            {editingJadwal?.hari === 'minggu' && (
                                <option value="minggu">Minggu (jadwal lama)</option>
                            )}
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
                        <label htmlFor="jadwal-jam-ke-mulai" className="mb-2 block text-sm font-semibold text-slate-700">
                            Mulai Jam ke-
                        </label>
                        <select
                            id="jadwal-jam-ke-mulai"
                            value={form.data.jam_ke_mulai}
                            onChange={(event) => form.setData('jam_ke_mulai', event.target.value)}
                            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="">Pilih jam ke-</option>
                            {jamKeOptions
                                .filter((option) => option.jam_ke <= maximumPeriodForDay(form.data.hari))
                                .map((option) => (
                                    <option key={option.jam_ke} value={option.jam_ke}>
                                        Jam ke-{option.jam_ke} · {option.jam_mulai}
                                    </option>
                                ))}
                        </select>
                        <InputError message={form.errors.jam_ke_mulai} className="mt-2" />
                        {editingJadwal && !findPeriodForStartTime(editingJadwal.jam_mulai, jamKeOptions) && (
                            <p className="mt-2 text-xs text-amber-700">
                                Jadwal lama mulai pukul {editingJadwal.jam_mulai.slice(0, 5)} di luar jam ke- standar. Pilih jam ke- baru; waktu jadwal akan disesuaikan saat disimpan.
                            </p>
                        )}
                    </div>
                    <div>
                        <span className="mb-2 block text-sm font-semibold text-slate-700">Periode & Waktu</span>
                        <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                            {sesiMelewatiBatasHari
                                ? 'Sesi melewati batas jam belajar hari ini'
                                : (
                                    <>
                                        {rentangJamKe && <span className="block font-semibold">{rentangJamKe}</span>}
                                        {rentangJamSesi || 'Waktu selesai dihitung dari jam ke- dan jumlah JP'}
                                    </>
                                )}
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
