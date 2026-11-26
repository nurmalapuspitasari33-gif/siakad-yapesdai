import AdminNavigationItems from '@/Components/AdminNavigationItems';
import AdminPagination from '@/Components/AdminPagination';
import ExcelImportPanel from '@/Components/ExcelImportPanel';
import {
    AdminDeleteModal,
    AdminResourceModal,
} from '@/Components/AdminResourceModal';
import InputError from '@/Components/InputError';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

function dateInputValue(value) {
    return value ? String(value).slice(0, 10) : '';
}

const emptyFormData = {
    nik: '',
    nisn: '',
    nis: '',
    nama_lengkap: '',
    email: '',
    password: '',
    kelas_id: '',
    program_keahlian_id: '',
    konsentrasi_keahlian_id: '',
    no_wa_wali: '',
    tipe_program: 'reguler',
    kategori_beasiswa_id: '',
    jenis_kelamin: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    agama: '',
    alamat_murid: '',
    nama_ayah: '',
    nama_ibu: '',
    sekolah_asal: '',
    status_keluarga: '',
    anak_ke: '',
    telepon_rumah: '',
    diterima_di_kelas: '',
    tanggal_diterima: '',
    alamat_ortu: '',
    telepon_ortu: '',
    pekerjaan_ayah: '',
    pekerjaan_ibu: '',
    nama_wali: '',
    alamat_wali: '',
    telepon_wali: '',
    pekerjaan_wali: '',
};

export default function SiswaIndex({
    siswas,
    kelasOptions = [],
    programKeahlians = [],
    kategoriBeasiswas = [],
    filters = {},
    tanpaKelasCount = 0,
}) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingSiswa, setEditingSiswa] = useState(null);
    const [deletingSiswa, setDeletingSiswa] = useState(null);
    const [resettingSiswa, setResettingSiswa] = useState(null);
    const [dismissedTemporaryPassword, setDismissedTemporaryPassword] = useState(null);
    const { flash = {} } = usePage().props;
    const temporaryPassword = String(flash.temporaryPasswordStudent ?? '') === String(resettingSiswa?.id ?? '')
        && flash.temporaryPassword !== dismissedTemporaryPassword
        ? flash.temporaryPassword
        : null;

    // Single student class actions
    const [assignClassSiswa, setAssignClassSiswa] = useState(null);
    const [removeClassSiswa, setRemoveClassSiswa] = useState(null);

    // Multi-select mass action states
    const [selectedSiswaIds, setSelectedSiswaIds] = useState([]);
    const [isBatchClassModalOpen, setIsBatchClassModalOpen] = useState(false);
    const [isBatchRemoveModalOpen, setIsBatchRemoveModalOpen] = useState(false);

    const form = useForm({ ...emptyFormData });
    const filterForm = useForm({
        kelas_id: filters.kelas_id ?? '',
        program_keahlian_id: filters.program_keahlian_id ?? '',
        konsentrasi_keahlian_id: filters.konsentrasi_keahlian_id ?? '',
    });
    const deleteForm = useForm({});
    const resetPasswordForm = useForm({});
    const singleClassForm = useForm({
        kelas_id: '',
    });
    const batchClassForm = useForm({
        siswa_ids: [],
        kelas_id: '',
    });
    const selectedProgram = programKeahlians.find(
        (program) => String(program.id) === String(form.data.program_keahlian_id),
    );
    const selectedFilterProgram = programKeahlians.find(
        (program) => String(program.id) === String(filterForm.data.program_keahlian_id),
    );

    const isAllSelected =
        siswas.data.length > 0 &&
        siswas.data.every((s) => selectedSiswaIds.includes(s.id));

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedSiswaIds([]);
        } else {
            setSelectedSiswaIds(siswas.data.map((s) => s.id));
        }
    };

    const toggleSelectSiswa = (id) => {
        if (selectedSiswaIds.includes(id)) {
            setSelectedSiswaIds(selectedSiswaIds.filter((item) => item !== id));
        } else {
            setSelectedSiswaIds([...selectedSiswaIds, id]);
        }
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setEditingSiswa(null);
        form.reset();
        form.clearErrors();
    };

    const openCreateForm = () => {
        setEditingSiswa(null);
        form.setData({ ...emptyFormData });
        form.clearErrors();
        setIsFormOpen(true);
    };

    const openEditForm = (siswa) => {
        setEditingSiswa(siswa);
        form.setData({
            nik: siswa.user?.nik ?? '',
            nisn: siswa.nisn ?? '',
            nis: siswa.nis ?? '',
            nama_lengkap: siswa.nama_lengkap ?? '',
            email: siswa.user?.email ?? '',
            password: '',
            kelas_id: siswa.kelas_id ? String(siswa.kelas_id) : '',
            program_keahlian_id: siswa.program_keahlian_id ? String(siswa.program_keahlian_id) : '',
            konsentrasi_keahlian_id: siswa.konsentrasi_keahlian_id ? String(siswa.konsentrasi_keahlian_id) : '',
            no_wa_wali: siswa.no_wa_wali ?? '',
            tipe_program: siswa.tipe_program ?? 'reguler',
            kategori_beasiswa_id: siswa.kategori_beasiswa_id ? String(siswa.kategori_beasiswa_id) : '',
            jenis_kelamin: siswa.jenis_kelamin ?? '',
            tempat_lahir: siswa.tempat_lahir ?? '',
            tanggal_lahir: dateInputValue(siswa.tanggal_lahir),
            agama: siswa.agama ?? '',
            alamat_murid: siswa.alamat_murid ?? '',
            nama_ayah: siswa.nama_ayah ?? '',
            nama_ibu: siswa.nama_ibu ?? '',
            sekolah_asal: siswa.sekolah_asal ?? '',
            status_keluarga: siswa.status_keluarga ?? '',
            anak_ke: siswa.anak_ke === null || siswa.anak_ke === undefined ? '' : String(siswa.anak_ke),
            telepon_rumah: siswa.telepon_rumah ?? '',
            diterima_di_kelas: siswa.diterima_di_kelas ?? '',
            tanggal_diterima: dateInputValue(siswa.tanggal_diterima),
            alamat_ortu: siswa.alamat_ortu ?? '',
            telepon_ortu: siswa.telepon_ortu ?? '',
            pekerjaan_ayah: siswa.pekerjaan_ayah ?? '',
            pekerjaan_ibu: siswa.pekerjaan_ibu ?? '',
            nama_wali: siswa.nama_wali ?? '',
            alamat_wali: siswa.alamat_wali ?? '',
            telepon_wali: siswa.telepon_wali ?? '',
            pekerjaan_wali: siswa.pekerjaan_wali ?? '',
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

        if (editingSiswa) {
            form.put(route('admin.siswa.update', editingSiswa.id), options);
            return;
        }

        form.post(route('admin.siswa.store'), options);
    };

    const submitFilter = (event) => {
        event.preventDefault();
        filterForm.get(route('admin.siswa.index'), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const setDirectFilter = (val) => {
        const nextFilters = {
            ...filterForm.data,
            kelas_id: val,
        };
        filterForm.setData(nextFilters);
        router.get(
            route('admin.siswa.index'),
            Object.fromEntries(
                Object.entries(nextFilters).filter(([, value]) => value !== ''),
            ),
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const clearFilter = () => {
        filterForm.setData({
            kelas_id: '',
            program_keahlian_id: '',
            konsentrasi_keahlian_id: '',
        });
        router.get(route('admin.siswa.index'), {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const deleteSiswa = () => {
        if (!deletingSiswa) {
            return;
        }

        deleteForm.delete(route('admin.siswa.destroy', deletingSiswa.id), {
            preserveScroll: true,
            onSuccess: () => setDeletingSiswa(null),
        });
    };

    const closeResetPassword = () => {
        if (temporaryPassword) {
            setDismissedTemporaryPassword(temporaryPassword);
        }

        setResettingSiswa(null);
        resetPasswordForm.reset();
        resetPasswordForm.clearErrors();
    };

    const submitResetPassword = (event) => {
        event.preventDefault();
        if (!resettingSiswa) {
            return;
        }

        if (temporaryPassword) {
            closeResetPassword();
            return;
        }

        resetPasswordForm.patch(route('admin.siswa.reset-password', resettingSiswa.id), {
            preserveScroll: true,
            onSuccess: () => resetPasswordForm.reset(),
        });
    };

    // Quick Action: Atur / Pindah Kelas (Single)
    const openAssignClass = (siswa) => {
        setAssignClassSiswa(siswa);
        singleClassForm.setData('kelas_id', siswa.kelas_id ? String(siswa.kelas_id) : '');
        singleClassForm.clearErrors();
    };

    const submitAssignClass = (event) => {
        event.preventDefault();
        if (!assignClassSiswa) {
            return;
        }

        singleClassForm.patch(route('admin.siswa.update-kelas', assignClassSiswa.id), {
            preserveScroll: true,
            onSuccess: () => setAssignClassSiswa(null),
        });
    };

    // Quick Action: Keluarkan dari Kelas (Single)
    const openRemoveClass = (siswa) => {
        setRemoveClassSiswa(siswa);
    };

    const confirmRemoveClass = () => {
        if (!removeClassSiswa) {
            return;
        }

        singleClassForm.setData('kelas_id', '');
        singleClassForm.patch(route('admin.siswa.update-kelas', removeClassSiswa.id), {
            preserveScroll: true,
            onSuccess: () => setRemoveClassSiswa(null),
        });
    };

    // Mass Action: Atur / Pindah Kelas (Batch)
    const openBatchAssignClass = () => {
        batchClassForm.setData({
            siswa_ids: selectedSiswaIds,
            kelas_id: '',
        });
        batchClassForm.clearErrors();
        setIsBatchClassModalOpen(true);
    };

    const submitBatchAssignClass = (event) => {
        event.preventDefault();
        batchClassForm.setData('siswa_ids', selectedSiswaIds);
        batchClassForm.patch(route('admin.siswa.batch-update-kelas'), {
            preserveScroll: true,
            onSuccess: () => {
                setIsBatchClassModalOpen(false);
                setSelectedSiswaIds([]);
            },
        });
    };

    // Mass Action: Keluarkan dari Kelas (Batch)
    const submitBatchRemoveClass = () => {
        router.patch(
            route('admin.siswa.batch-update-kelas'),
            {
                siswa_ids: selectedSiswaIds,
                kelas_id: null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsBatchRemoveModalOpen(false);
                    setSelectedSiswaIds([]);
                },
            },
        );
    };

    const programLabels = {
        reguler: 'Reguler',
        santri_internal: 'Santri Internal',
        santri_eksternal: 'Santri Eksternal',
    };

    return (
        <DashboardLayout
            title="Manajemen Siswa"
            subtitle="Kelola akun siswa aktif, penempatan kelas, NISN, dan biodata rapor."
            roleLabel="Administrator"
            navigation={AdminNavigationItems('siswa')}
        >
            <Head title="Data Siswa" />

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-5 border-b border-slate-100 px-5 py-5 sm:px-7">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="font-bold text-slate-900">Daftar Siswa Aktif</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Total {siswas.total} siswa aktif terdaftar
                                {tanpaKelasCount > 0 && (
                                    <span className="ml-2 font-medium text-amber-600">
                                        ({tanpaKelasCount} belum masuk kelas)
                                    </span>
                                )}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={openCreateForm}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                        >
                            <span className="text-lg leading-none" aria-hidden="true">+</span>
                            Tambah Siswa
                        </button>
                    </div>

                    {/* Filter Bar */}
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <form onSubmit={submitFilter} className="flex flex-wrap items-center gap-2">
                            <label htmlFor="filter-kelas" className="text-sm font-semibold text-slate-700">
                                Filter Kelas:
                            </label>
                            <select
                                id="filter-kelas"
                                value={filterForm.data.kelas_id}
                                onChange={(event) => filterForm.setData('kelas_id', event.target.value)}
                                className="block rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:min-w-[220px]"
                            >
                                <option value="">Semua Siswa</option>
                                <option value="tanpa_kelas" className="font-semibold text-amber-700">
                                    ⚠️ Belum Punya Kelas ({tanpaKelasCount})
                                </option>
                                <optgroup label="Pilih Berdasarkan Kelas">
                                    {kelasOptions.map((kelas) => (
                                        <option key={kelas.id} value={kelas.id}>
                                            {kelas.nama_kelas}
                                        </option>
                                    ))}
                                </optgroup>
                            </select>
                            <select
                                aria-label="Filter Program Keahlian"
                                value={filterForm.data.program_keahlian_id}
                                onChange={(event) => {
                                    filterForm.setData('program_keahlian_id', event.target.value);
                                    filterForm.setData('konsentrasi_keahlian_id', '');
                                }}
                                className="block rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:min-w-[220px]"
                            >
                                <option value="">Semua Program Keahlian</option>
                                {programKeahlians.map((program) => (
                                    <option key={program.id} value={program.id}>
                                        {program.nama_jurusan}
                                    </option>
                                ))}
                            </select>
                            <select
                                aria-label="Filter Konsentrasi Keahlian"
                                value={filterForm.data.konsentrasi_keahlian_id}
                                onChange={(event) => filterForm.setData('konsentrasi_keahlian_id', event.target.value)}
                                disabled={!selectedFilterProgram}
                                className="block rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:min-w-[220px] disabled:bg-slate-100"
                            >
                                <option value="">Semua Konsentrasi</option>
                                {(selectedFilterProgram?.konsentrasi_keahlians ?? []).map((concentration) => (
                                    <option key={concentration.id} value={concentration.id}>
                                        {concentration.nama_konsentrasi}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="submit"
                                disabled={filterForm.processing}
                                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
                            >
                                Terapkan
                            </button>
                            {filters.kelas_id || filters.program_keahlian_id || filters.konsentrasi_keahlian_id ? (
                                <button
                                    type="button"
                                    onClick={clearFilter}
                                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                                >
                                    Reset
                                </button>
                            ) : null}
                        </form>

                        {/* Quick filter pills */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                            <button
                                type="button"
                                onClick={() => setDirectFilter('')}
                                className={`rounded-lg px-2.5 py-1.5 font-medium transition ${
                                    !filters.kelas_id
                                        ? 'bg-slate-900 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                Semua
                            </button>
                            <button
                                type="button"
                                onClick={() => setDirectFilter('tanpa_kelas')}
                                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-medium transition ${
                                    filters.kelas_id === 'tanpa_kelas'
                                        ? 'bg-amber-600 text-white'
                                        : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                                }`}
                            >
                                <span>⚠️ Belum Punya Kelas</span>
                                <span className="rounded-full bg-white/40 px-1.5 py-0.2 text-[10px] font-bold">
                                    {tanpaKelasCount}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Batch Actions Toolbar */}
                {selectedSiswaIds.length > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-100 bg-indigo-50/80 px-5 py-3 sm:px-7">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                                {selectedSiswaIds.length}
                            </span>
                            <span className="text-sm font-semibold text-indigo-900">
                                siswa dipilih
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={openBatchAssignClass}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                            >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                                Atur / Pindah Kelas Massal
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsBatchRemoveModalOpen(true)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-50"
                            >
                                Keluarkan dari Kelas ({selectedSiswaIds.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedSiswaIds([])}
                                className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800"
                            >
                                Batal Pilih
                            </button>
                        </div>
                    </div>
                )}

                {/* Import Excel Panel */}
                <div className="px-5 py-4 sm:px-7">
                    <ExcelImportPanel
                        templateUrl={route('admin.siswa.template')}
                        importUrl={route('admin.siswa.import')}
                        description="Impor data siswa aktif ke kelas pada tahun ajaran aktif. NIK 16 digit menjadi kunci utama; format kolom NIK sebagai teks agar nol di depan tetap tersimpan. Format tanggal lahir: YYYY-MM-DD."
                    />
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 text-left">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="w-10 px-5 py-3 sm:px-7">
                                    <input
                                        type="checkbox"
                                        aria-label="Pilih semua siswa di halaman ini"
                                        checked={isAllSelected}
                                        onChange={toggleSelectAll}
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                </th>
                                <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    NISN / NIS
                                </th>
                                <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Nama Lengkap & Akun
                                </th>
                                <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Kelas
                                </th>
                                <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Program Keahlian & Beasiswa
                                </th>
                                <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    WhatsApp Wali
                                </th>
                                <th className="whitespace-nowrap px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-7">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {siswas.data.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-5 py-12 text-center text-sm text-slate-500">
                                        Tidak ada data siswa aktif yang cocok dengan filter yang dipilih.
                                    </td>
                                </tr>
                            ) : (
                                siswas.data.map((siswa) => {
                                    const isSelected = selectedSiswaIds.includes(siswa.id);
                                    return (
                                        <tr
                                            key={siswa.id}
                                            className={`transition hover:bg-slate-50/70 ${
                                                isSelected ? 'bg-indigo-50/40' : ''
                                            }`}
                                        >
                                            <td className="w-10 px-5 py-4 sm:px-7">
                                                <input
                                                    type="checkbox"
                                                    aria-label={`Pilih ${siswa.nama_lengkap}`}
                                                    checked={isSelected}
                                                    onChange={() => toggleSelectSiswa(siswa.id)}
                                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-4 font-mono text-sm font-semibold text-slate-700">
                                                {siswa.nisn}
                                                {siswa.nis && (
                                                    <p className="font-sans text-xs font-normal text-slate-500">
                                                        NIS: {siswa.nis}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-4">
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {siswa.nama_lengkap}
                                                </p>
                                                <p className="font-mono text-xs text-slate-600">
                                                    NIK: {siswa.user?.nik ?? '—'}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {siswa.user?.email ?? 'Tanpa email'}
                                                </p>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-4 text-sm">
                                                {siswa.kelas ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="inline-flex items-center rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
                                                            {siswa.kelas.nama_kelas}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 border border-amber-200">
                                                        ⚠️ Belum Masuk Kelas
                                                    </span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-4 text-sm">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-xs font-semibold text-slate-800">
                                                        {siswa.program_keahlian?.nama_jurusan ?? 'Program belum ditentukan'}
                                                    </span>
                                                    {siswa.konsentrasi_keahlian && (
                                                        <span className="text-[11px] text-slate-500">
                                                            {siswa.konsentrasi_keahlian.nama_konsentrasi}
                                                        </span>
                                                    )}
                                                    <span className="text-xs font-medium text-slate-800">
                                                        {programLabels[siswa.tipe_program] ?? siswa.tipe_program}
                                                    </span>
                                                    {siswa.kategori_beasiswa && (
                                                        <span className="inline-flex items-center text-[11px] font-semibold text-emerald-700">
                                                            ★ {siswa.kategori_beasiswa.nama_beasiswa}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                                                {siswa.no_wa_wali || '—'}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-right sm:px-7">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {/* Quick Action: Atur / Pindah Kelas */}
                                                    <button
                                                        type="button"
                                                        onClick={() => openAssignClass(siswa)}
                                                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                                                            !siswa.kelas_id
                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                                                                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                                                        }`}
                                                        title={siswa.kelas_id ? 'Pindahkan ke kelas lain' : 'Masukkan ke dalam kelas'}
                                                    >
                                                        {siswa.kelas_id ? 'Pindah Kelas' : 'Atur Kelas'}
                                                    </button>

                                                    {/* Quick Action: Keluarkan dari Kelas */}
                                                    {siswa.kelas_id && (
                                                        <button
                                                            type="button"
                                                            onClick={() => openRemoveClass(siswa)}
                                                            className="rounded-lg px-2.5 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-50"
                                                            title="Keluarkan siswa dari kelas"
                                                        >
                                                            Keluarkan
                                                        </button>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={() => openEditForm(siswa)}
                                                        className="rounded-lg px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setResettingSiswa(siswa)}
                                                        className="rounded-lg px-2 py-1 text-xs font-medium text-amber-700 transition hover:bg-amber-50"
                                                    >
                                                        Reset PW
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeletingSiswa(siswa)}
                                                        className="rounded-lg px-2 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-50"
                                                    >
                                                        Hapus
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="border-t border-slate-100 px-5 py-4 sm:px-7">
                    <AdminPagination links={siswas.links} />
                </div>
            </section>

            {/* Form Modal: Tambah & Edit Siswa Aktif (Ringkas & max-h-[90vh] overflow-y-auto) */}
            <AdminResourceModal
                show={isFormOpen}
                maxWidth="2xl"
                title={editingSiswa ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
                description="Kelola akun pengguna, penempatan kelas, dan data inti siswa aktif."
                processing={form.processing}
                submitLabel={editingSiswa ? 'Simpan Perubahan' : 'Tambah Siswa'}
                onClose={closeForm}
                onSubmit={submitForm}
                panelClassName="max-h-[90vh] overflow-y-auto"
            >
                <div className="pr-1">
                    {/* Bagian 1: Data Pokok & Akun */}
                    <div className="mb-6">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                            1. Informasi Akun & Penempatan Kelas
                        </h3>
                        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="nik-siswa" className="mb-1.5 block text-xs font-semibold text-slate-700">
                                    NIK 16 Digit {!editingSiswa && <span className="text-rose-500">*</span>}
                                </label>
                                <input
                                    id="nik-siswa"
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]{16}"
                                    maxLength={16}
                                    required={!editingSiswa}
                                    value={form.data.nik}
                                    onChange={(event) => form.setData('nik', event.target.value)}
                                    placeholder="Masukkan NIK dari KK"
                                    className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                                <InputError message={form.errors.nik} className="mt-1" />
                            </div>

                            <div>
                                <label htmlFor="nisn-siswa" className="mb-1.5 block text-xs font-semibold text-slate-700">
                                    NISN <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    id="nisn-siswa"
                                    type="text"
                                    required
                                    value={form.data.nisn}
                                    onChange={(event) => form.setData('nisn', event.target.value)}
                                    placeholder="Contoh: 0012345678"
                                    className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                                <InputError message={form.errors.nisn} className="mt-1" />
                            </div>

                            <div>
                                <label htmlFor="nis-siswa" className="mb-1.5 block text-xs font-semibold text-slate-700">
                                    NIS (Nomor Induk Siswa)
                                </label>
                                <input
                                    id="nis-siswa"
                                    type="text"
                                    value={form.data.nis}
                                    onChange={(event) => form.setData('nis', event.target.value)}
                                    placeholder="Contoh: SMK-2026001"
                                    className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                                <InputError message={form.errors.nis} className="mt-1" />
                            </div>

                            <div className="sm:col-span-2">
                                <label htmlFor="nama-siswa" className="mb-1.5 block text-xs font-semibold text-slate-700">
                                    Nama Lengkap <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    id="nama-siswa"
                                    type="text"
                                    required
                                    value={form.data.nama_lengkap}
                                    onChange={(event) => form.setData('nama_lengkap', event.target.value)}
                                    placeholder="Nama lengkap siswa"
                                    className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                                <InputError message={form.errors.nama_lengkap} className="mt-1" />
                            </div>

                            <div>
                                <label htmlFor="email-siswa" className="mb-1.5 block text-xs font-semibold text-slate-700">
                                    Email Akun (opsional)
                                </label>
                                <input
                                    id="email-siswa"
                                    type="email"
                                    autoComplete="email"
                                    value={form.data.email}
                                    onChange={(event) => form.setData('email', event.target.value)}
                                    placeholder="siswa@sekolah.sch.id"
                                    className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                                <InputError message={form.errors.email} className="mt-1" />
                            </div>

                            <div>
                                <label htmlFor="password-siswa" className="mb-1.5 block text-xs font-semibold text-slate-700">
                                    Kata Sandi {editingSiswa ? <span className="font-normal text-slate-400">(kosongkan jika tetap)</span> : <span className="text-rose-500">*</span>}
                                </label>
                                <input
                                    id="password-siswa"
                                    type="password"
                                    required={!editingSiswa}
                                    autoComplete="new-password"
                                    value={form.data.password}
                                    onChange={(event) => form.setData('password', event.target.value)}
                                    placeholder={editingSiswa ? '••••••••' : 'Minimal 8 karakter'}
                                    className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                                <InputError message={form.errors.password} className="mt-1" />
                            </div>

                            <div>
                                <label htmlFor="kelas-siswa" className="mb-1.5 block text-xs font-semibold text-slate-700">
                                    Kelas
                                </label>
                                <select
                                    id="kelas-siswa"
                                    value={form.data.kelas_id}
                                    onChange={(event) => form.setData('kelas_id', event.target.value)}
                                    className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    <option value="">-- Belum Masuk Kelas --</option>
                                    {kelasOptions.map((kelas) => (
                                        <option key={kelas.id} value={kelas.id}>
                                            {kelas.nama_kelas}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={form.errors.kelas_id} className="mt-1" />
                            </div>

                            <div>
                                <label htmlFor="program-keahlian-siswa" className="mb-1.5 block text-xs font-semibold text-slate-700">
                                    Program Keahlian
                                </label>
                                <select
                                    id="program-keahlian-siswa"
                                    value={form.data.program_keahlian_id}
                                    onChange={(event) => {
                                        form.setData('program_keahlian_id', event.target.value);
                                        form.setData('konsentrasi_keahlian_id', '');
                                    }}
                                    className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    <option value="">-- Belum Ditentukan --</option>
                                    {programKeahlians.map((program) => (
                                        <option key={program.id} value={program.id}>
                                            {program.nama_jurusan}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={form.errors.program_keahlian_id} className="mt-1" />
                            </div>

                            <div>
                                <label htmlFor="konsentrasi-keahlian-siswa" className="mb-1.5 block text-xs font-semibold text-slate-700">
                                    Konsentrasi Keahlian
                                </label>
                                <select
                                    id="konsentrasi-keahlian-siswa"
                                    value={form.data.konsentrasi_keahlian_id}
                                    onChange={(event) => form.setData('konsentrasi_keahlian_id', event.target.value)}
                                    disabled={!selectedProgram}
                                    className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-slate-100"
                                >
                                    <option value="">-- Belum Ditentukan --</option>
                                    {(selectedProgram?.konsentrasi_keahlians ?? []).map((concentration) => (
                                        <option key={concentration.id} value={concentration.id}>
                                            {concentration.nama_konsentrasi}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={form.errors.konsentrasi_keahlian_id} className="mt-1" />
                            </div>

                            <div>
                                <label htmlFor="wa-wali-siswa" className="mb-1.5 block text-xs font-semibold text-slate-700">
                                    No. WhatsApp Wali
                                </label>
                                <input
                                    id="wa-wali-siswa"
                                    type="tel"
                                    value={form.data.no_wa_wali}
                                    onChange={(event) => form.setData('no_wa_wali', event.target.value)}
                                    placeholder="08xxxxxxxxxx"
                                    className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                                <InputError message={form.errors.no_wa_wali} className="mt-1" />
                            </div>

                            <div>
                                <label htmlFor="tipe-program" className="mb-1.5 block text-xs font-semibold text-slate-700">
                                    Tipe Program <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    id="tipe-program"
                                    required
                                    value={form.data.tipe_program}
                                    onChange={(event) => form.setData('tipe_program', event.target.value)}
                                    className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    <option value="reguler">Reguler</option>
                                    <option value="santri_internal">Santri Internal PP Al Fiel Kesugihan</option>
                                    <option value="santri_eksternal">Santri Eksternal di luar PP Al Fiel Kesugihan</option>
                                </select>
                                <InputError message={form.errors.tipe_program} className="mt-1" />
                            </div>

                            <div>
                                <label htmlFor="kategori-beasiswa" className="mb-1.5 block text-xs font-semibold text-slate-700">
                                    Kategori Beasiswa / Afirmasi
                                </label>
                                <select
                                    id="kategori-beasiswa"
                                    value={form.data.kategori_beasiswa_id}
                                    onChange={(event) => form.setData('kategori_beasiswa_id', event.target.value)}
                                    className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    <option value="">-- Tidak Ada Beasiswa --</option>
                                    {kategoriBeasiswas.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.nama_beasiswa}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={form.errors.kategori_beasiswa_id} className="mt-1" />
                            </div>
                        </div>
                    </div>

                    {/* Bagian 2: Informasi Singkat Biodata Rapor */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                        <div className="mb-3">
                            <h3 className="text-sm font-bold text-slate-800">
                                2. Biodata Rapor & Identitas Cetak
                            </h3>
                            <p className="text-xs text-slate-500">
                                Lengkapi data yang ditampilkan pada buku induk, rapor, dan cetak identitas.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                                <label htmlFor="jenis-kelamin" className="mb-1 block text-xs font-semibold text-slate-700">
                                    Jenis Kelamin
                                </label>
                                <select
                                    id="jenis-kelamin"
                                    value={form.data.jenis_kelamin}
                                    onChange={(event) => form.setData('jenis_kelamin', event.target.value)}
                                    className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    <option value="">-- Pilih --</option>
                                    <option value="L">Laki-laki</option>
                                    <option value="P">Perempuan</option>
                                </select>
                                <InputError message={form.errors.jenis_kelamin} className="mt-1" />
                            </div>

                            <div>
                                <label htmlFor="agama" className="mb-1 block text-xs font-semibold text-slate-700">
                                    Agama
                                </label>
                                <select
                                    id="agama"
                                    value={form.data.agama}
                                    onChange={(event) => form.setData('agama', event.target.value)}
                                    className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    <option value="">-- Pilih Agama --</option>
                                    <option value="Islam">Islam</option>
                                    <option value="Kristen">Kristen</option>
                                    <option value="Katolik">Katolik</option>
                                    <option value="Hindu">Hindu</option>
                                    <option value="Buddha">Buddha</option>
                                    <option value="Konghucu">Konghucu</option>
                                </select>
                                <InputError message={form.errors.agama} className="mt-1" />
                            </div>

                            <div>
                                <label htmlFor="tempat-lahir" className="mb-1 block text-xs font-semibold text-slate-700">
                                    Tempat Lahir
                                </label>
                                <input
                                    id="tempat-lahir"
                                    type="text"
                                    value={form.data.tempat_lahir}
                                    onChange={(event) => form.setData('tempat_lahir', event.target.value)}
                                    placeholder="Kota / Kabupaten"
                                    className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                                <InputError message={form.errors.tempat_lahir} className="mt-1" />
                            </div>

                            <div>
                                <label htmlFor="tanggal-lahir" className="mb-1 block text-xs font-semibold text-slate-700">
                                    Tanggal Lahir
                                </label>
                                <input
                                    id="tanggal-lahir"
                                    type="date"
                                    value={form.data.tanggal_lahir}
                                    onChange={(event) => form.setData('tanggal_lahir', event.target.value)}
                                    className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                                <InputError message={form.errors.tanggal_lahir} className="mt-1" />
                            </div>

                            <div>
                                <label htmlFor="nama-ayah" className="mb-1 block text-xs font-semibold text-slate-700">
                                    Nama Ayah
                                </label>
                                <input
                                    id="nama-ayah"
                                    type="text"
                                    value={form.data.nama_ayah}
                                    onChange={(event) => form.setData('nama_ayah', event.target.value)}
                                    className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                                <InputError message={form.errors.nama_ayah} className="mt-1" />
                            </div>

                            <div>
                                <label htmlFor="nama-ibu" className="mb-1 block text-xs font-semibold text-slate-700">
                                    Nama Ibu
                                </label>
                                <input
                                    id="nama-ibu"
                                    type="text"
                                    value={form.data.nama_ibu}
                                    onChange={(event) => form.setData('nama_ibu', event.target.value)}
                                    className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                                <InputError message={form.errors.nama_ibu} className="mt-1" />
                            </div>

                            <div className="sm:col-span-2">
                                <label htmlFor="sekolah-asal" className="mb-1 block text-xs font-semibold text-slate-700">
                                    Sekolah Asal
                                </label>
                                <input
                                    id="sekolah-asal"
                                    type="text"
                                    value={form.data.sekolah_asal}
                                    onChange={(event) => form.setData('sekolah_asal', event.target.value)}
                                    placeholder="SMP / MTs Asal"
                                    className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                                <InputError message={form.errors.sekolah_asal} className="mt-1" />
                            </div>

                            <div className="sm:col-span-2">
                                <label htmlFor="alamat-murid" className="mb-1 block text-xs font-semibold text-slate-700">
                                    Alamat Tempat Tinggal Murid
                                </label>
                                <textarea
                                    id="alamat-murid"
                                    rows="2"
                                    value={form.data.alamat_murid}
                                    onChange={(event) => form.setData('alamat_murid', event.target.value)}
                                    placeholder="Alamat domisili lengkap siswa"
                                    className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                                <InputError message={form.errors.alamat_murid} className="mt-1" />
                            </div>

                                <div className="sm:col-span-2 border-t border-slate-200 pt-4">
                                    <h4 className="text-sm font-bold text-slate-800">
                                        Data Tambahan Identitas Cetak
                                    </h4>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Semua isian berikut opsional dan akan ditampilkan pada cetak identitas siswa.
                                    </p>
                                </div>

                                <div>
                                    <label htmlFor="status-keluarga" className="mb-1 block text-xs font-semibold text-slate-700">
                                        Status dalam Keluarga
                                    </label>
                                    <input
                                        id="status-keluarga"
                                        type="text"
                                        maxLength="50"
                                        value={form.data.status_keluarga}
                                        onChange={(event) => form.setData('status_keluarga', event.target.value)}
                                        className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    <InputError message={form.errors.status_keluarga} className="mt-1" />
                                </div>

                                <div>
                                    <label htmlFor="anak-ke" className="mb-1 block text-xs font-semibold text-slate-700">
                                        Anak Ke-
                                    </label>
                                    <input
                                        id="anak-ke"
                                        type="number"
                                        min="1"
                                        max="30"
                                        value={form.data.anak_ke}
                                        onChange={(event) => form.setData('anak_ke', event.target.value)}
                                        className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    <InputError message={form.errors.anak_ke} className="mt-1" />
                                </div>

                                <div>
                                    <label htmlFor="telepon-rumah" className="mb-1 block text-xs font-semibold text-slate-700">
                                        Nomor Telepon Rumah Murid
                                    </label>
                                    <input
                                        id="telepon-rumah"
                                        type="tel"
                                        maxLength="30"
                                        value={form.data.telepon_rumah}
                                        onChange={(event) => form.setData('telepon_rumah', event.target.value)}
                                        className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    <InputError message={form.errors.telepon_rumah} className="mt-1" />
                                </div>

                                <div>
                                    <label htmlFor="diterima-di-kelas" className="mb-1 block text-xs font-semibold text-slate-700">
                                        Diterima di Kelas
                                    </label>
                                    <input
                                        id="diterima-di-kelas"
                                        type="text"
                                        maxLength="255"
                                        value={form.data.diterima_di_kelas}
                                        onChange={(event) => form.setData('diterima_di_kelas', event.target.value)}
                                        className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    <InputError message={form.errors.diterima_di_kelas} className="mt-1" />
                                </div>

                                <div>
                                    <label htmlFor="tanggal-diterima" className="mb-1 block text-xs font-semibold text-slate-700">
                                        Tanggal Diterima
                                    </label>
                                    <input
                                        id="tanggal-diterima"
                                        type="date"
                                        value={form.data.tanggal_diterima}
                                        onChange={(event) => form.setData('tanggal_diterima', event.target.value)}
                                        className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    <InputError message={form.errors.tanggal_diterima} className="mt-1" />
                                </div>

                                <div>
                                    <label htmlFor="pekerjaan-ayah" className="mb-1 block text-xs font-semibold text-slate-700">
                                        Pekerjaan Ayah
                                    </label>
                                    <input
                                        id="pekerjaan-ayah"
                                        type="text"
                                        maxLength="255"
                                        value={form.data.pekerjaan_ayah}
                                        onChange={(event) => form.setData('pekerjaan_ayah', event.target.value)}
                                        className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    <InputError message={form.errors.pekerjaan_ayah} className="mt-1" />
                                </div>

                                <div>
                                    <label htmlFor="pekerjaan-ibu" className="mb-1 block text-xs font-semibold text-slate-700">
                                        Pekerjaan Ibu
                                    </label>
                                    <input
                                        id="pekerjaan-ibu"
                                        type="text"
                                        maxLength="255"
                                        value={form.data.pekerjaan_ibu}
                                        onChange={(event) => form.setData('pekerjaan_ibu', event.target.value)}
                                        className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    <InputError message={form.errors.pekerjaan_ibu} className="mt-1" />
                                </div>

                                <div>
                                    <label htmlFor="telepon-ortu" className="mb-1 block text-xs font-semibold text-slate-700">
                                        Nomor Telepon Orang Tua
                                    </label>
                                    <input
                                        id="telepon-ortu"
                                        type="tel"
                                        maxLength="30"
                                        value={form.data.telepon_ortu}
                                        onChange={(event) => form.setData('telepon_ortu', event.target.value)}
                                        className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    <InputError message={form.errors.telepon_ortu} className="mt-1" />
                                </div>

                                <div className="sm:col-span-2">
                                    <label htmlFor="alamat-ortu" className="mb-1 block text-xs font-semibold text-slate-700">
                                        Alamat Orang Tua
                                    </label>
                                    <textarea
                                        id="alamat-ortu"
                                        rows="2"
                                        maxLength="2000"
                                        value={form.data.alamat_ortu}
                                        onChange={(event) => form.setData('alamat_ortu', event.target.value)}
                                        className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    <InputError message={form.errors.alamat_ortu} className="mt-1" />
                                </div>

                                <div>
                                    <label htmlFor="nama-wali" className="mb-1 block text-xs font-semibold text-slate-700">
                                        Nama Wali Murid
                                    </label>
                                    <input
                                        id="nama-wali"
                                        type="text"
                                        maxLength="255"
                                        value={form.data.nama_wali}
                                        onChange={(event) => form.setData('nama_wali', event.target.value)}
                                        className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    <InputError message={form.errors.nama_wali} className="mt-1" />
                                </div>

                                <div>
                                    <label htmlFor="pekerjaan-wali" className="mb-1 block text-xs font-semibold text-slate-700">
                                        Pekerjaan Wali Murid
                                    </label>
                                    <input
                                        id="pekerjaan-wali"
                                        type="text"
                                        maxLength="255"
                                        value={form.data.pekerjaan_wali}
                                        onChange={(event) => form.setData('pekerjaan_wali', event.target.value)}
                                        className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    <InputError message={form.errors.pekerjaan_wali} className="mt-1" />
                                </div>

                                <div>
                                    <label htmlFor="telepon-wali" className="mb-1 block text-xs font-semibold text-slate-700">
                                        Nomor Telepon Wali Murid
                                    </label>
                                    <input
                                        id="telepon-wali"
                                        type="tel"
                                        maxLength="30"
                                        value={form.data.telepon_wali}
                                        onChange={(event) => form.setData('telepon_wali', event.target.value)}
                                        className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    <InputError message={form.errors.telepon_wali} className="mt-1" />
                                </div>

                                <div className="sm:col-span-2">
                                    <label htmlFor="alamat-wali" className="mb-1 block text-xs font-semibold text-slate-700">
                                        Alamat Wali Murid
                                    </label>
                                    <textarea
                                        id="alamat-wali"
                                        rows="2"
                                        maxLength="2000"
                                        value={form.data.alamat_wali}
                                        onChange={(event) => form.setData('alamat_wali', event.target.value)}
                                        className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    <InputError message={form.errors.alamat_wali} className="mt-1" />
                                </div>
                            </div>
                        </div>
                    </div>
            </AdminResourceModal>

            {/* Modal: Atur / Pindah Kelas (Single Siswa) */}
            <Modal
                show={Boolean(assignClassSiswa)}
                onClose={() => setAssignClassSiswa(null)}
                maxWidth="md"
            >
                <form onSubmit={submitAssignClass} className="p-6">
                    <h2 className="text-lg font-bold text-slate-900">
                        {assignClassSiswa?.kelas_id ? 'Pindahkan Siswa ke Kelas Lain' : 'Atur Kelas Siswa'}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Pilih kelas baru untuk siswa <span className="font-semibold text-slate-800">{assignClassSiswa?.nama_lengkap}</span>.
                    </p>

                    <div className="mt-4">
                        <label htmlFor="assign-kelas" className="mb-1.5 block text-sm font-semibold text-slate-700">
                            Pilih Kelas Tujuan
                        </label>
                        <select
                            id="assign-kelas"
                            value={singleClassForm.data.kelas_id}
                            onChange={(event) => singleClassForm.setData('kelas_id', event.target.value)}
                            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="">-- Belum Masuk Kelas (Keluarkan dari Kelas) --</option>
                            {kelasOptions.map((kelas) => (
                                <option key={kelas.id} value={kelas.id}>
                                    {kelas.nama_kelas}
                                </option>
                            ))}
                        </select>
                        <InputError message={singleClassForm.errors.kelas_id} className="mt-2" />
                    </div>

                    <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <SecondaryButton onClick={() => setAssignClassSiswa(null)}>
                            Batal
                        </SecondaryButton>
                        <button
                            type="submit"
                            disabled={singleClassForm.processing}
                            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                        >
                            {singleClassForm.processing ? 'Menyimpan...' : 'Simpan Kelas'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal: Keluarkan dari Kelas (Single Siswa) */}
            <Modal
                show={Boolean(removeClassSiswa)}
                onClose={() => setRemoveClassSiswa(null)}
                maxWidth="md"
            >
                <div className="p-6">
                    <h2 className="text-lg font-bold text-slate-900">
                        Keluarkan dari Kelas?
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        Siswa <span className="font-semibold text-slate-900">{removeClassSiswa?.nama_lengkap}</span> akan dikeluarkan dari kelas <span className="font-semibold text-slate-900">{removeClassSiswa?.kelas?.nama_kelas}</span>.
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                        Akun siswa tetap aktif dan dapat dimasukkan kembali ke kelas kapan saja.
                    </p>

                    <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <SecondaryButton onClick={() => setRemoveClassSiswa(null)}>
                            Batal
                        </SecondaryButton>
                        <button
                            type="button"
                            disabled={singleClassForm.processing}
                            onClick={confirmRemoveClass}
                            className="inline-flex items-center justify-center rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60"
                        >
                            {singleClassForm.processing ? 'Memproses...' : 'Ya, Keluarkan dari Kelas'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal: Atur / Pindah Kelas Massal (Batch) */}
            <Modal
                show={isBatchClassModalOpen}
                onClose={() => setIsBatchClassModalOpen(false)}
                maxWidth="md"
            >
                <form onSubmit={submitBatchAssignClass} className="p-6">
                    <h2 className="text-lg font-bold text-slate-900">
                        Atur / Pindah Kelas Massal
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Tentukan kelas tujuan untuk <span className="font-bold text-indigo-700">{selectedSiswaIds.length} siswa</span> yang dipilih.
                    </p>

                    <div className="mt-4">
                        <label htmlFor="batch-kelas" className="mb-1.5 block text-sm font-semibold text-slate-700">
                            Kelas Tujuan
                        </label>
                        <select
                            id="batch-kelas"
                            value={batchClassForm.data.kelas_id}
                            onChange={(event) => batchClassForm.setData('kelas_id', event.target.value)}
                            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="">-- Belum Masuk Kelas (Keluarkan dari Kelas) --</option>
                            {kelasOptions.map((kelas) => (
                                <option key={kelas.id} value={kelas.id}>
                                    {kelas.nama_kelas}
                                </option>
                            ))}
                        </select>
                        <InputError message={batchClassForm.errors.kelas_id} className="mt-2" />
                    </div>

                    <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <SecondaryButton onClick={() => setIsBatchClassModalOpen(false)}>
                            Batal
                        </SecondaryButton>
                        <button
                            type="submit"
                            disabled={batchClassForm.processing}
                            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                        >
                            {batchClassForm.processing ? 'Memproses...' : 'Terapkan ke Semua Siswa Terpilih'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal: Keluarkan dari Kelas Massal (Batch) */}
            <Modal
                show={isBatchRemoveModalOpen}
                onClose={() => setIsBatchRemoveModalOpen(false)}
                maxWidth="md"
            >
                <div className="p-6">
                    <h2 className="text-lg font-bold text-slate-900">
                        Keluarkan Siswa Terpilih dari Kelas?
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        Sebanyak <span className="font-bold text-rose-600">{selectedSiswaIds.length} siswa</span> yang dipilih akan dikeluarkan dari kelas masing-masing.
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                        Akun siswa tetap aktif dan dapat dimasukkan kembali ke kelas kapan saja.
                    </p>

                    <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <SecondaryButton onClick={() => setIsBatchRemoveModalOpen(false)}>
                            Batal
                        </SecondaryButton>
                        <button
                            type="button"
                            onClick={submitBatchRemoveClass}
                            className="inline-flex items-center justify-center rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700"
                        >
                            Ya, Keluarkan Semua dari Kelas
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal: Hapus Siswa */}
            <AdminDeleteModal
                show={Boolean(deletingSiswa)}
                title="Hapus akun siswa?"
                description={`Akun siswa "${deletingSiswa?.nama_lengkap ?? ''}" akan dihapus. Siswa dengan tagihan, hasil ujian, nilai, atau riwayat SPMB tidak dapat dihapus.`}
                processing={deleteForm.processing}
                onClose={() => setDeletingSiswa(null)}
                onConfirm={deleteSiswa}
            />

            {/* Modal: Reset Password Siswa */}
            <AdminResourceModal
                show={Boolean(resettingSiswa)}
                title="Reset kata sandi akun siswa?"
                description={temporaryPassword
                    ? `Kredensial sementara untuk ${resettingSiswa?.nama_lengkap ?? 'siswa'} hanya ditampilkan pada respons ini.`
                    : `Kata sandi akun ${resettingSiswa?.nama_lengkap ?? 'siswa'} akan diatur ulang.`}
                processing={resetPasswordForm.processing}
                processingLabel="Mereset..."
                submitLabel={temporaryPassword ? 'Selesai' : 'Buat Kredensial Sementara'}
                onClose={closeResetPassword}
                onSubmit={submitResetPassword}
            >
                {temporaryPassword ? (
                    <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                        <p>
                            Sampaikan kata sandi ini secara aman. Siswa wajib menggantinya saat login berikutnya.
                        </p>
                        <code className="select-all rounded-lg bg-white px-3 py-2 text-base font-bold tracking-wider">
                            {temporaryPassword}
                        </code>
                    </div>
                ) : (
                    <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                        Sistem akan membuat kata sandi acak yang hanya ditampilkan sekali. Siswa wajib menggantinya saat login berikutnya.
                    </p>
                )}
            </AdminResourceModal>
        </DashboardLayout>
    );
}
