import InputError from '@/Components/InputError';
import DashboardLayout from '@/Layouts/DashboardLayout';
import roleNavigationItems from '@/Components/RoleNavigationItems';
import { Head, router, useForm } from '@inertiajs/react';
import { useEffect } from 'react';

function initialScores(siswas) {
    return siswas.map((siswa) => ({
        siswa_id: siswa.id,
        nilai_akhir: siswa.nilai?.nilai_akhir ?? '',
        capaian_kompetensi: siswa.nilai?.capaian_kompetensi ?? '',
    }));
}

export default function GuruNilaiIndex({
    kelasOptions = [],
    mapelOptions = [],
    assignments = [],
    siswas = [],
    filters = {},
    tahunAjaranAktif = null,
    isWaliKelas = false,
}) {
    const filterForm = useForm({
        kelas_id: filters?.kelas_id ?? '',
        mapel_id: filters?.mapel_id ?? '',
    });
    const form = useForm({
        kelas_id: filters?.kelas_id ?? '',
        mapel_id: filters?.mapel_id ?? '',
        nilai: initialScores(siswas),
    });
    const availableMapelOptions = mapelOptions.filter((mapel) =>
        assignments.some((assignment) =>
            String(assignment.kelas_id) === String(filterForm.data.kelas_id)
            && String(assignment.mapel_id) === String(mapel.id),
        ),
    );

    useEffect(() => {
        form.setData({
            kelas_id: filters?.kelas_id ?? '',
            mapel_id: filters?.mapel_id ?? '',
            nilai: initialScores(siswas),
        });
        filterForm.setData({
            kelas_id: filters?.kelas_id ?? '',
            mapel_id: filters?.mapel_id ?? '',
        });
    }, [siswas, filters.kelas_id, filters.mapel_id]);

    const applyFilter = (event) => {
        event.preventDefault();
        router.get(route('guru.nilai.index'), filterForm.data, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const updateScore = (index, key, value) => {
        form.setData('nilai', form.data.nilai.map((row, rowIndex) =>
            rowIndex === index ? { ...row, [key]: value } : row,
        ));
    };

    const saveGrades = (event) => {
        event.preventDefault();
        form.post(route('guru.nilai.store'), {
            preserveScroll: true,
        });
    };

    return (
        <DashboardLayout
            title="Input Nilai"
            subtitle="Masukkan nilai akhir dan capaian kompetensi untuk mata pelajaran yang Anda ampu."
            roleLabel="Guru"
            navigation={roleNavigationItems('guru', 'nilai', { isWaliKelas })}
        >
            <Head title="Input Nilai" />

            <div className="flex flex-col gap-5">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                    <div className="mb-5">
                        <h2 className="font-bold text-slate-900">Pilih kelas dan mata pelajaran</h2>
                        <p className="mt-1 text-sm text-slate-500">{tahunAjaranAktif ?? 'Tahun ajaran aktif belum ditetapkan'}</p>
                    </div>
                    <form onSubmit={applyFilter} className="grid grid-cols-1 items-end gap-4 sm:grid-cols-[1fr_1fr_auto]">
                        <div>
                            <label htmlFor="nilai-kelas" className="mb-2 block text-sm font-semibold text-slate-700">Kelas</label>
                            <select
                                id="nilai-kelas"
                                value={filterForm.data.kelas_id}
                                onChange={(event) => filterForm.setData({
                                    kelas_id: event.target.value,
                                    mapel_id: '',
                                })}
                                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value="">Pilih kelas</option>
                                {kelasOptions.map((kelas) => <option key={kelas.id} value={kelas.id}>{kelas.nama_kelas}</option>)}
                            </select>
                            <InputError message={filterForm.errors.kelas_id} className="mt-2" />
                        </div>
                        <div>
                            <label htmlFor="nilai-mapel" className="mb-2 block text-sm font-semibold text-slate-700">Mata Pelajaran</label>
                            <select
                                id="nilai-mapel"
                                value={filterForm.data.mapel_id}
                                onChange={(event) => filterForm.setData('mapel_id', event.target.value)}
                                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value="">Pilih mata pelajaran</option>
                                {availableMapelOptions.map((mapel) => <option key={mapel.id} value={mapel.id}>{mapel.kode_mapel} · {mapel.nama_mapel}</option>)}
                            </select>
                            <InputError message={filterForm.errors.mapel_id} className="mt-2" />
                        </div>
                        <button
                            type="submit"
                            disabled={filterForm.processing || !filterForm.data.kelas_id || !filterForm.data.mapel_id}
                            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Tampilkan Siswa
                        </button>
                    </form>
                </section>

                {siswas.length > 0 && (
                    <form onSubmit={saveGrades} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                            <div>
                                <h2 className="font-bold text-slate-900">Daftar nilai siswa</h2>
                                <p className="mt-1 text-sm text-slate-500">{siswas.length} siswa</p>
                            </div>
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {form.processing ? 'Menyimpan...' : 'Simpan Nilai'}
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100 text-left">
                                <thead className="bg-slate-50">
                                    <tr>
                                        {['Siswa', 'Nilai Akhir', 'Capaian Kompetensi'].map((heading) => (
                                            <th key={heading} className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 first:sm:px-7">
                                                {heading}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {siswas.map((siswa, index) => {
                                        const row = form.data.nilai[index];

                                        return (
                                            <tr key={siswa.id}>
                                                <td className="whitespace-nowrap px-4 py-4 sm:px-7">
                                                    <p className="text-sm font-semibold text-slate-900">{siswa.nama_lengkap}</p>
                                                    <p className="mt-1 text-xs text-slate-500">{siswa.nisn}</p>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        step="0.01"
                                                        aria-label={`Nilai akhir ${siswa.nama_lengkap}`}
                                                        value={row?.nilai_akhir ?? ''}
                                                        onChange={(event) => updateScore(index, 'nilai_akhir', event.target.value)}
                                                        className="w-28 rounded-lg border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                    />
                                                    <InputError message={form.errors[`nilai.${index}.nilai_akhir`]} className="mt-1" />
                                                </td>
                                                <td className="min-w-72 px-4 py-4">
                                                    <textarea
                                                        rows="2"
                                                        maxLength="5000"
                                                        aria-label={`Capaian kompetensi ${siswa.nama_lengkap}`}
                                                        value={row?.capaian_kompetensi ?? ''}
                                                        onChange={(event) => updateScore(index, 'capaian_kompetensi', event.target.value)}
                                                        className="min-w-64 rounded-lg border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                    />
                                                    <InputError message={form.errors[`nilai.${index}.capaian_kompetensi`]} className="mt-1" />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </form>
                )}
            </div>
        </DashboardLayout>
    );
}
