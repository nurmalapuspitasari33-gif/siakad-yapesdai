import AdminNavigationItems from '@/Components/AdminNavigationItems';
import AdminPagination from '@/Components/AdminPagination';
import {
    AdminDeleteModal,
    AdminResourceModal,
} from '@/Components/AdminResourceModal';
import InputError from '@/Components/InputError';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

const subjectGroups = {
    umum: {
        label: 'A. Mata Pelajaran Umum',
        className: 'bg-blue-50 text-blue-700 ring-blue-200',
    },
    kejuruan: {
        label: 'B. Mata Pelajaran Kejuruan',
        className: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    },
    muatan_lokal: {
        label: 'C. Muatan Lokal',
        className: 'bg-violet-50 text-violet-700 ring-violet-200',
    },
};

export default function MataPelajaranIndex({
    mataPelajarans,
    filters,
    ekstrakurikulers = [],
    templateKokurikuler,
    konsentrasiKeahlians = [],
    mapelOptions = [],
    activeTab: initialTab = 'mapel',
}) {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingMapel, setEditingMapel] = useState(null);
    const [deletingMapel, setDeletingMapel] = useState(null);
    const [editingEkstrakurikuler, setEditingEkstrakurikuler] = useState(null);
    const ekstraFormRef = useRef(null);
    const form = useForm({
        kode_mapel: '',
        nama_mapel: '',
        kelompok_mapel: 'umum',
    });
    const ekstraForm = useForm({
        nama_ekstra: '',
        is_aktif: true,
    });
    const kokurikulerForm = useForm({
        template_kokurikuler: templateKokurikuler ?? '',
    });
    const [selectedKonsentrasiId, setSelectedKonsentrasiId] = useState(
        String(konsentrasiKeahlians[0]?.id ?? ''),
    );
    const [mapelToAdd, setMapelToAdd] = useState({
        umum: '',
        kejuruan: '',
        muatan_lokal: '',
    });
    const urutanRaporForm = useForm({
        mapel_ids: konsentrasiKeahlians[0]?.mata_pelajaran_ids ?? [],
    });
    const searchForm = useForm({
        search: filters.search ?? '',
    });
    const deleteForm = useForm({});

    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    const selectedKonsentrasi = konsentrasiKeahlians.find(
        (konsentrasi) => String(konsentrasi.id) === selectedKonsentrasiId,
    );
    const mapelById = new Map(mapelOptions.map((mapel) => [Number(mapel.id), mapel]));
    const mapelIdsError = urutanRaporForm.errors.mapel_ids
        ?? Object.entries(urutanRaporForm.errors)
            .find(([key]) => key.startsWith('mapel_ids.'))?.[1];

    const closeForm = () => {
        setIsFormOpen(false);
        setEditingMapel(null);
        form.reset();
        form.clearErrors();
    };

    const openCreateForm = () => {
        setEditingMapel(null);
        form.setData({ kode_mapel: '', nama_mapel: '', kelompok_mapel: 'umum' });
        form.clearErrors();
        setIsFormOpen(true);
    };

    const openEditForm = (mapel) => {
        setEditingMapel(mapel);
        form.setData({
            kode_mapel: mapel.kode_mapel,
            nama_mapel: mapel.nama_mapel,
            kelompok_mapel: mapel.kelompok_mapel ?? 'umum',
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

        if (editingMapel) {
            form.put(route('admin.mapel.update', editingMapel.id), options);
            return;
        }

        form.post(route('admin.mapel.store'), options);
    };

    const submitSearch = (event) => {
        event.preventDefault();
        searchForm.get(route('admin.mapel.index'), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const clearSearch = () => {
        searchForm.setData('search', '');
        router.get(route('admin.mapel.index'), {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const deleteMapel = () => {
        if (!deletingMapel) {
            return;
        }

        deleteForm.delete(route('admin.mapel.destroy', deletingMapel.id), {
            preserveScroll: true,
            onSuccess: () => setDeletingMapel(null),
        });
    };

    const resetEkstrakurikulerForm = () => {
        setEditingEkstrakurikuler(null);
        ekstraForm.reset();
        ekstraForm.clearErrors();
    };

    const openEkstrakurikulerForm = (ekstrakurikuler) => {
        setEditingEkstrakurikuler(ekstrakurikuler);
        ekstraForm.setData({
            nama_ekstra: ekstrakurikuler.nama_ekstra,
            is_aktif: Boolean(ekstrakurikuler.is_aktif),
        });
        ekstraForm.clearErrors();
        ekstraFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const submitEkstrakurikuler = (event) => {
        event.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                resetEkstrakurikulerForm();
                setActiveTab('ekstrakurikuler');
            },
        };

        if (editingEkstrakurikuler) {
            ekstraForm.put(
                route('admin.ekstrakurikuler.update', editingEkstrakurikuler.id),
                options,
            );
            return;
        }

        ekstraForm.post(route('admin.ekstrakurikuler.store'), options);
    };

    const submitKokurikulerTemplate = (event) => {
        event.preventDefault();
        kokurikulerForm.put(route('admin.mapel.template-kokurikuler.update'), {
            preserveScroll: true,
        });
    };

    const submitUrutanRapor = (event) => {
        event.preventDefault();

        if (!selectedKonsentrasi) {
            return;
        }

        urutanRaporForm.put(
            route('admin.mapel.urutan-rapor.update', selectedKonsentrasi.id),
            { preserveScroll: true },
        );
    };

    const changeSelectedKonsentrasi = (concentrationId) => {
        const concentration = konsentrasiKeahlians.find(
            (item) => String(item.id) === concentrationId,
        );

        setSelectedKonsentrasiId(concentrationId);
        urutanRaporForm.setData('mapel_ids', concentration?.mata_pelajaran_ids ?? []);
        urutanRaporForm.clearErrors();
        setMapelToAdd({ umum: '', kejuruan: '', muatan_lokal: '' });
    };

    const addMapelToRapor = (kelompok) => {
        const mapelId = Number(mapelToAdd[kelompok]);

        if (
            !mapelId
            || urutanRaporForm.data.mapel_ids.some((id) => Number(id) === mapelId)
        ) {
            return;
        }

        urutanRaporForm.setData('mapel_ids', [
            ...urutanRaporForm.data.mapel_ids.map(Number),
            mapelId,
        ]);
        setMapelToAdd((current) => ({ ...current, [kelompok]: '' }));
    };

    const removeMapelFromRapor = (mapelId) => {
        urutanRaporForm.setData(
            'mapel_ids',
            urutanRaporForm.data.mapel_ids.filter((id) => Number(id) !== mapelId),
        );
    };

    const moveMapelInRapor = (kelompok, index, direction) => {
        const mapelIds = urutanRaporForm.data.mapel_ids.map(Number);
        const groupIds = mapelIds.filter(
            (id) => mapelById.get(id)?.kelompok_mapel === kelompok,
        );
        const targetIndex = index + direction;

        if (targetIndex < 0 || targetIndex >= groupIds.length) {
            return;
        }

        [groupIds[index], groupIds[targetIndex]] = [groupIds[targetIndex], groupIds[index]];

        let groupIndex = 0;
        urutanRaporForm.setData(
            'mapel_ids',
            mapelIds.map((id) => (
                mapelById.get(id)?.kelompok_mapel === kelompok
                    ? groupIds[groupIndex++]
                    : id
            )),
        );
    };

    return (
        <DashboardLayout
            title="Manajemen Mata Pelajaran"
            subtitle="Kelola mata pelajaran, urutan mapel rapor per konsentrasi, dan master kegiatan."
            roleLabel="Administrator"
            navigation={AdminNavigationItems('mata-pelajaran')}
        >
            <Head title="Mata Pelajaran" />

            <div
                role="tablist"
                aria-label="Master data mata pelajaran"
                className="flex flex-wrap gap-2 border-b border-slate-200"
            >
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'mapel'}
                    onClick={() => setActiveTab('mapel')}
                    className={`rounded-t-xl px-4 py-2.5 text-sm font-semibold transition ${
                        activeTab === 'mapel'
                            ? 'border-b-2 border-indigo-600 bg-white text-indigo-700'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                >
                    Daftar Mata Pelajaran
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'ekstrakurikuler'}
                    onClick={() => setActiveTab('ekstrakurikuler')}
                    className={`rounded-t-xl px-4 py-2.5 text-sm font-semibold transition ${
                        activeTab === 'ekstrakurikuler'
                            ? 'border-b-2 border-indigo-600 bg-white text-indigo-700'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                >
                    Master Ekstrakurikuler
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'kokurikuler'}
                    onClick={() => setActiveTab('kokurikuler')}
                    className={`rounded-t-xl px-4 py-2.5 text-sm font-semibold transition ${
                        activeTab === 'kokurikuler'
                            ? 'border-b-2 border-indigo-600 bg-white text-indigo-700'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                >
                    Templat Kokurikuler
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'urutan-rapor'}
                    onClick={() => setActiveTab('urutan-rapor')}
                    className={`rounded-t-xl px-4 py-2.5 text-sm font-semibold transition ${
                        activeTab === 'urutan-rapor'
                            ? 'border-b-2 border-indigo-600 bg-white text-indigo-700'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                >
                    Urutan Mapel Rapor
                </button>
            </div>

            <section
                role="tabpanel"
                aria-hidden={activeTab !== 'mapel'}
                hidden={activeTab !== 'mapel'}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
                <div className="flex flex-col gap-5 border-b border-slate-100 px-5 py-5 sm:px-7">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="font-bold text-slate-900">Daftar mata pelajaran</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                {mataPelajarans.total} mata pelajaran terdaftar
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={openCreateForm}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            <span className="text-lg leading-none" aria-hidden="true">+</span>
                            Tambah Mata Pelajaran
                        </button>
                    </div>

                    <form
                        onSubmit={submitSearch}
                        className="flex flex-col gap-2 sm:flex-row"
                        role="search"
                    >
                        <label htmlFor="search-mapel" className="sr-only">
                            Cari kode atau nama mata pelajaran
                        </label>
                        <input
                            id="search-mapel"
                            type="search"
                            value={searchForm.data.search}
                            onChange={(event) => searchForm.setData('search', event.target.value)}
                            placeholder="Cari kode atau nama mata pelajaran..."
                            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:max-w-md"
                        />
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={searchForm.processing}
                                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
                            >
                                Cari
                            </button>
                            {filters.search && (
                                <button
                                    type="button"
                                    onClick={clearSearch}
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
                                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-7">
                                    Kode Mapel
                                </th>
                                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Nama Mata Pelajaran
                                </th>
                                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Kelompok
                                </th>
                                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-7">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {mataPelajarans.data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="4"
                                        className="px-5 py-12 text-center text-sm text-slate-500"
                                    >
                                        {filters.search
                                            ? 'Tidak ada mata pelajaran yang cocok dengan pencarian.'
                                            : 'Belum ada data mata pelajaran.'}
                                    </td>
                                </tr>
                            ) : (
                                mataPelajarans.data.map((mapel) => (
                                    <tr key={mapel.id} className="hover:bg-slate-50/70">
                                        <td className="whitespace-nowrap px-5 py-4 font-mono text-sm font-semibold text-indigo-700 sm:px-7">
                                            {mapel.kode_mapel}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-slate-800">
                                            {mapel.nama_mapel}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4 text-sm">
                                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${(subjectGroups[mapel.kelompok_mapel] ?? subjectGroups.umum).className}`}>
                                                {(subjectGroups[mapel.kelompok_mapel] ?? subjectGroups.umum).label}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4 sm:px-7">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditForm(mapel)}
                                                    className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setDeletingMapel(mapel)}
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
                    <AdminPagination links={mataPelajarans.links} />
                </div>
            </section>

            {activeTab === 'mapel' && (
                <>
                    <AdminResourceModal
                        show={isFormOpen}
                        title={editingMapel ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}
                        description="Masukkan kode mapel unik dan nama yang akan tampil di jadwal serta ujian."
                        processing={form.processing}
                        submitLabel={editingMapel ? 'Simpan Perubahan' : 'Tambah Mata Pelajaran'}
                        onClose={closeForm}
                        onSubmit={submitForm}
                    >
                        <div>
                            <label htmlFor="kode_mapel" className="mb-2 block text-sm font-semibold text-slate-700">
                                Kode Mapel
                            </label>
                            <input
                                id="kode_mapel"
                                name="kode_mapel"
                                type="text"
                                value={form.data.kode_mapel}
                                onChange={(event) => form.setData('kode_mapel', event.target.value)}
                                autoComplete="off"
                                placeholder="Contoh: MAT-001"
                                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            <InputError message={form.errors.kode_mapel} className="mt-2" />
                        </div>
                        <div>
                            <label htmlFor="nama_mapel" className="mb-2 block text-sm font-semibold text-slate-700">
                                Nama Mata Pelajaran
                            </label>
                            <input
                                id="nama_mapel"
                                name="nama_mapel"
                                type="text"
                                value={form.data.nama_mapel}
                                onChange={(event) => form.setData('nama_mapel', event.target.value)}
                                placeholder="Contoh: Matematika"
                                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            <InputError message={form.errors.nama_mapel} className="mt-2" />
                        </div>
                        <div>
                            <label htmlFor="kelompok-mapel" className="mb-2 block text-sm font-semibold text-slate-700">
                                Kelompok Mata Pelajaran
                            </label>
                            <select
                                id="kelompok-mapel"
                                value={form.data.kelompok_mapel}
                                onChange={(event) => form.setData('kelompok_mapel', event.target.value)}
                                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value="umum">A. Mata Pelajaran Umum</option>
                                <option value="kejuruan">B. Mata Pelajaran Kejuruan</option>
                                <option value="muatan_lokal">C. Muatan Lokal</option>
                            </select>
                            <InputError message={form.errors.kelompok_mapel} className="mt-2" />
                        </div>
                    </AdminResourceModal>

                    <AdminDeleteModal
                        show={Boolean(deletingMapel)}
                        title="Hapus mata pelajaran?"
                        description="Mata pelajaran yang masih digunakan oleh jadwal, ujian, nilai, atau pengaturan urutan rapor tidak dapat dihapus."
                        processing={deleteForm.processing}
                        onClose={() => setDeletingMapel(null)}
                        onConfirm={deleteMapel}
                    />
                </>
            )}

            {activeTab === 'ekstrakurikuler' && (
                <section
                    role="tabpanel"
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                    <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
                        <h2 className="font-bold text-slate-900">
                            {editingEkstrakurikuler ? 'Edit ekstrakurikuler' : 'Master ekstrakurikuler'}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {editingEkstrakurikuler
                                ? `Perbarui nama atau status ${editingEkstrakurikuler.nama_ekstra}.`
                                : 'Kelola kegiatan yang tersedia pada input rapor wali kelas.'}
                        </p>
                    </div>

                    <form
                        ref={ekstraFormRef}
                        onSubmit={submitEkstrakurikuler}
                        className="grid gap-4 border-b border-slate-100 px-5 py-5 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end sm:px-7"
                    >
                        <div>
                            <label htmlFor="nama-ekstra" className="mb-2 block text-sm font-semibold text-slate-700">
                                Nama Ekstrakurikuler
                            </label>
                            <input
                                id="nama-ekstra"
                                type="text"
                                value={ekstraForm.data.nama_ekstra}
                                onChange={(event) => ekstraForm.setData('nama_ekstra', event.target.value)}
                                maxLength="255"
                                required
                                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            <InputError message={ekstraForm.errors.nama_ekstra} className="mt-2" />
                        </div>

                        <label className="flex items-center gap-2 pb-2 text-sm font-medium text-slate-700">
                            <input
                                type="checkbox"
                                checked={ekstraForm.data.is_aktif}
                                onChange={(event) => ekstraForm.setData('is_aktif', event.target.checked)}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            Aktif
                        </label>

                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={ekstraForm.processing}
                                className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {ekstraForm.processing
                                    ? 'Menyimpan...'
                                    : editingEkstrakurikuler ? 'Simpan Perubahan' : 'Tambah'}
                            </button>
                            {editingEkstrakurikuler && (
                                <button
                                    type="button"
                                    onClick={resetEkstrakurikulerForm}
                                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                            )}
                        </div>
                    </form>

                    <div className="w-full overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 text-left">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th>Nama Ekstrakurikuler</th>
                                    <th>Status</th>
                                    <th className="text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {ekstrakurikulers.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="px-5 py-8 text-center text-sm text-slate-500">
                                            Belum ada ekstrakurikuler.
                                        </td>
                                    </tr>
                                ) : ekstrakurikulers.map((ekstrakurikuler) => (
                                    <tr key={ekstrakurikuler.id}>
                                        <td className="font-medium text-slate-800">{ekstrakurikuler.nama_ekstra}</td>
                                        <td>
                                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                ekstrakurikuler.is_aktif
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : 'bg-slate-100 text-slate-600'
                                            }`}>
                                                {ekstrakurikuler.is_aktif ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => openEkstrakurikulerForm(ekstrakurikuler)}
                                                    className="rounded-xl px-3 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
                                                >
                                                    Edit
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {activeTab === 'kokurikuler' && (
                <section
                    role="tabpanel"
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                    <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
                        <h2 className="font-bold text-slate-900">Templat Deskripsi Kokurikuler</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Templat ini membantu wali kelas menyusun deskripsi kokurikuler pada rapor.
                        </p>
                    </div>

                    <form onSubmit={submitKokurikulerTemplate} className="space-y-4 px-5 py-5 sm:px-7">
                        <div>
                            <label
                                htmlFor="template-kokurikuler"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                Isi templat
                            </label>
                            <textarea
                                id="template-kokurikuler"
                                value={kokurikulerForm.data.template_kokurikuler}
                                onChange={(event) => kokurikulerForm.setData('template_kokurikuler', event.target.value)}
                                rows="5"
                                maxLength="5000"
                                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            <p className="mt-2 text-xs text-slate-500">
                                Gunakan placeholder {'{predikat}'} untuk mengisi predikat pilihan wali kelas.
                                Jika dikosongkan, sistem menggunakan templat bawaan.
                            </p>
                            <InputError message={kokurikulerForm.errors.template_kokurikuler} className="mt-2" />
                        </div>

                        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                            <button
                                type="submit"
                                disabled={kokurikulerForm.processing}
                                className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {kokurikulerForm.processing ? 'Menyimpan...' : 'Simpan Templat'}
                            </button>
                        </div>
                    </form>
                </section>
            )}

            {activeTab === 'urutan-rapor' && (
                <section
                    role="tabpanel"
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                    <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
                        <h2 className="font-bold text-slate-900">Urutan Mata Pelajaran Rapor</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Pilih mata pelajaran dan atur urutannya secara terpisah untuk setiap konsentrasi keahlian.
                        </p>
                    </div>

                    {konsentrasiKeahlians.length === 0 ? (
                        <div className="px-5 py-10 text-center sm:px-7">
                            <p className="font-semibold text-slate-800">
                                Belum ada konsentrasi keahlian.
                            </p>
                            <p className="mt-2 text-sm text-slate-500">
                                Tambahkan konsentrasi keahlian terlebih dahulu melalui menu Data Kelas.
                            </p>
                            <Link
                                href={route('admin.kelas.index')}
                                className="mt-4 inline-flex rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                            >
                                Buka Data Kelas
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-4 border-b border-slate-100 px-5 py-5 sm:px-7 md:grid-cols-[minmax(0,1fr)_20rem] md:items-end">
                                <div>
                                    <label
                                        htmlFor="konsentrasi-urutan-rapor"
                                        className="mb-2 block text-sm font-semibold text-slate-700"
                                    >
                                        Konsentrasi Keahlian
                                    </label>
                                    <select
                                        id="konsentrasi-urutan-rapor"
                                        value={selectedKonsentrasiId}
                                        onChange={(event) => changeSelectedKonsentrasi(event.target.value)}
                                        className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        {konsentrasiKeahlians.map((konsentrasi) => (
                                            <option key={konsentrasi.id} value={konsentrasi.id}>
                                                {konsentrasi.nama_konsentrasi}
                                                {konsentrasi.program_keahlian
                                                    ? ` - ${konsentrasi.program_keahlian}`
                                                    : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <p className="text-sm text-slate-500">
                                    Mata pelajaran yang dipilih akan tampil di rapor siswa pada konsentrasi ini.
                                </p>
                            </div>

                            <form onSubmit={submitUrutanRapor} className="space-y-5 px-5 py-5 sm:px-7">
                                {Object.entries(subjectGroups).map(([kelompok, group]) => {
                                    const groupMapels = urutanRaporForm.data.mapel_ids
                                        .map((id) => mapelById.get(Number(id)))
                                        .filter((mapel) => mapel?.kelompok_mapel === kelompok);
                                    const availableMapels = mapelOptions.filter(
                                        (mapel) => mapel.kelompok_mapel === kelompok
                                            && !urutanRaporForm.data.mapel_ids
                                                .map(Number)
                                                .includes(Number(mapel.id)),
                                    );

                                    return (
                                        <div
                                            key={kelompok}
                                            className="rounded-2xl border border-slate-200"
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                                                <h3 className="text-sm font-bold text-slate-800">
                                                    {group.label}
                                                </h3>
                                                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${group.className}`}>
                                                    {groupMapels.length} mapel
                                                </span>
                                            </div>

                                            <ol className="divide-y divide-slate-100">
                                                {groupMapels.length === 0 ? (
                                                    <li className="px-4 py-4 text-sm text-slate-500">
                                                        Belum ada mata pelajaran di kelompok ini.
                                                    </li>
                                                ) : groupMapels.map((mapel, index) => (
                                                    <li
                                                        key={mapel.id}
                                                        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                                                    >
                                                        <div className="flex min-w-0 items-center gap-3">
                                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                                                                {index + 1}
                                                            </span>
                                                            <div className="min-w-0">
                                                                <p className="truncate text-sm font-semibold text-slate-800">
                                                                    {mapel.nama_mapel}
                                                                </p>
                                                                <p className="text-xs text-slate-500">
                                                                    {mapel.kode_mapel}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => moveMapelInRapor(kelompok, index, -1)}
                                                                disabled={index === 0}
                                                                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                                                                aria-label={`Naikkan ${mapel.nama_mapel}`}
                                                            >
                                                                Naik
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => moveMapelInRapor(kelompok, index, 1)}
                                                                disabled={index === groupMapels.length - 1}
                                                                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                                                                aria-label={`Turunkan ${mapel.nama_mapel}`}
                                                            >
                                                                Turun
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeMapelFromRapor(Number(mapel.id))}
                                                                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                                                            >
                                                                Hapus
                                                            </button>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ol>

                                            <div className="flex flex-col gap-2 border-t border-slate-100 px-4 py-4 sm:flex-row">
                                                <select
                                                    aria-label={`Pilih mapel kelompok ${group.label}`}
                                                    value={mapelToAdd[kelompok]}
                                                    onChange={(event) => setMapelToAdd((current) => ({
                                                        ...current,
                                                        [kelompok]: event.target.value,
                                                    }))}
                                                    className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                >
                                                    <option value="">Pilih mata pelajaran untuk ditambahkan</option>
                                                    {availableMapels.map((mapel) => (
                                                        <option key={mapel.id} value={mapel.id}>
                                                            {mapel.nama_mapel} ({mapel.kode_mapel})
                                                        </option>
                                                    ))}
                                                </select>
                                                <button
                                                    type="button"
                                                    onClick={() => addMapelToRapor(kelompok)}
                                                    disabled={!mapelToAdd[kelompok]}
                                                    className="shrink-0 rounded-xl border border-indigo-200 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    Tambah Mapel
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}

                                <InputError message={mapelIdsError} />
                                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                                    <button
                                        type="submit"
                                        disabled={urutanRaporForm.processing || urutanRaporForm.data.mapel_ids.length === 0}
                                        className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {urutanRaporForm.processing ? 'Menyimpan...' : 'Simpan Urutan Rapor'}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </section>
            )}
        </DashboardLayout>
    );
}
