import AdminNavigationItems from '@/Components/AdminNavigationItems';
import AdminPagination from '@/Components/AdminPagination';
import {
    AdminDeleteModal,
    AdminResourceModal,
} from '@/Components/AdminResourceModal';
import InputError from '@/Components/InputError';
import SpmbApplicantReportDocument from '@/Components/SpmbApplicantReportDocument';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

const selectionLabels = {
    pending: 'Menunggu Seleksi',
    diterima: 'Diterima',
    ditolak: 'Ditolak',
};

function SelectionBadge({ status }) {
    const style = {
        pending: 'bg-amber-50 text-amber-700',
        diterima: 'bg-emerald-50 text-emerald-700',
        ditolak: 'bg-rose-50 text-rose-700',
    }[status] ?? 'bg-slate-100 text-slate-600';

    return (
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${style}`}>
            {selectionLabels[status] ?? status}
        </span>
    );
}

export default function SpmbIndex({
    pendaftarans,
    kelasOptions,
    tahunAjaranAktif,
    fotoSiswaUrls = {},
    programKeahlians = [],
    printPendaftarans = [],
    filters = {},
}) {
    const [acceptingPendaftaran, setAcceptingPendaftaran] = useState(null);
    const [rejectingPendaftaran, setRejectingPendaftaran] = useState(null);
    const [viewingPendaftaran, setViewingPendaftaran] = useState(null);
    const form = useForm({ kelas_id: '' });
    const rejectForm = useForm({});
    const filterForm = useForm({
        program_keahlian_id: filters.program_keahlian_id ?? '',
        konsentrasi_keahlian_id: filters.konsentrasi_keahlian_id ?? '',
        status_seleksi: filters.status_seleksi ?? '',
    });
    const { pengaturanSekolah = {} } = usePage().props;
    const selectedFilterProgram = programKeahlians.find(
        (program) => String(program.id) === String(filterForm.data.program_keahlian_id),
    );

    const eligibleClassesFor = (pendaftaran) => (
        pendaftaran?.program_keahlian_id
            ? kelasOptions.filter((kelas) => (
                String(kelas.program_keahlian_id) === String(pendaftaran.program_keahlian_id)
                && String(kelas.konsentrasi_keahlian_id) === String(pendaftaran.konsentrasi_keahlian_id)
            ))
            : kelasOptions
    );

    const openAcceptModal = (pendaftaran) => {
        setAcceptingPendaftaran(pendaftaran);
        form.setData('kelas_id', String(eligibleClassesFor(pendaftaran)[0]?.id ?? ''));
        form.clearErrors();
    };

    const acceptPendaftaran = (event) => {
        event.preventDefault();
        if (!acceptingPendaftaran) {
            return;
        }

        form.patch(route('admin.spmb.accept', acceptingPendaftaran.id), {
            preserveScroll: true,
            onSuccess: () => setAcceptingPendaftaran(null),
        });
    };

    const rejectPendaftaran = () => {
        if (!rejectingPendaftaran) {
            return;
        }

        rejectForm.patch(route('admin.spmb.reject', rejectingPendaftaran.id), {
            preserveScroll: true,
            onSuccess: () => setRejectingPendaftaran(null),
        });
    };

    const submitFilter = (event) => {
        event.preventDefault();
        filterForm.get(route('admin.spmb.index'), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const resetFilter = () => {
        filterForm.setData({
            program_keahlian_id: '',
            konsentrasi_keahlian_id: '',
            status_seleksi: '',
        });
        router.get(route('admin.spmb.index'), {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    return (
        <DashboardLayout
            title="Manajemen SPMB"
            subtitle="Tinjau biodata calon siswa, periksa berkas, dan tetapkan hasil seleksi."
            roleLabel="Administrator"
            navigation={AdminNavigationItems('spmb')}
        >
            <Head title="Pendaftaran SPMB" />

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                    <div>
                        <h2 className="font-bold text-slate-900">Daftar pendaftar</h2>
                        <p className="mt-1 text-sm text-slate-500">{pendaftarans.total} pendaftaran</p>
                    </div>
                    <div className="flex flex-col gap-2 sm:items-end">
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="rounded-xl border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
                        >
                            Cetak Rekap Pendaftar
                        </button>
                        <p className="rounded-xl bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-800">
                            Tahun ajaran aktif:{' '}
                            {tahunAjaranAktif
                                ? `${tahunAjaranAktif.nama_tahun} · ${tahunAjaranAktif.semester}`
                                : 'belum ditetapkan'}
                        </p>
                    </div>
                </div>

                <form
                    onSubmit={submitFilter}
                    className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:flex-wrap sm:items-end sm:px-7"
                >
                    <div className="min-w-52 flex-1">
                        <label htmlFor="filter-spmb-program" className="mb-1.5 block text-xs font-semibold text-slate-600">
                            Program Keahlian
                        </label>
                        <select
                            id="filter-spmb-program"
                            value={filterForm.data.program_keahlian_id}
                            onChange={(event) => {
                                filterForm.setData('program_keahlian_id', event.target.value);
                                filterForm.setData('konsentrasi_keahlian_id', '');
                            }}
                            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="">Semua Program</option>
                            {programKeahlians.map((program) => (
                                <option key={program.id} value={program.id}>{program.nama_jurusan}</option>
                            ))}
                        </select>
                    </div>
                    <div className="min-w-52 flex-1">
                        <label htmlFor="filter-spmb-konsentrasi" className="mb-1.5 block text-xs font-semibold text-slate-600">
                            Konsentrasi Keahlian
                        </label>
                        <select
                            id="filter-spmb-konsentrasi"
                            value={filterForm.data.konsentrasi_keahlian_id}
                            onChange={(event) => filterForm.setData('konsentrasi_keahlian_id', event.target.value)}
                            disabled={!selectedFilterProgram}
                            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-slate-100"
                        >
                            <option value="">Semua Konsentrasi</option>
                            {(selectedFilterProgram?.konsentrasi_keahlians ?? []).map((concentration) => (
                                <option key={concentration.id} value={concentration.id}>
                                    {concentration.nama_konsentrasi}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="min-w-40 flex-1">
                        <label htmlFor="filter-spmb-status" className="mb-1.5 block text-xs font-semibold text-slate-600">
                            Status Seleksi
                        </label>
                        <select
                            id="filter-spmb-status"
                            value={filterForm.data.status_seleksi}
                            onChange={(event) => filterForm.setData('status_seleksi', event.target.value)}
                            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="">Semua</option>
                            <option value="pending">Pending</option>
                            <option value="diterima">Diterima</option>
                            <option value="ditolak">Ditolak</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={filterForm.processing}
                        className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
                    >
                        Terapkan
                    </button>
                    <button
                        type="button"
                        onClick={resetFilter}
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                        Reset
                    </button>
                </form>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 text-left">
                        <thead className="bg-slate-50">
                            <tr>
                                {['No. Pendaftaran', 'Calon Siswa', 'Biodata', 'Asal Sekolah', 'Program / Konsentrasi', 'Berkas', 'Status', 'Aksi'].map((label) => (
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
                            {pendaftarans.data.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-5 py-12 text-center text-sm text-slate-500">
                                        Belum ada pendaftaran SPMB.
                                    </td>
                                </tr>
                            ) : pendaftarans.data.map((pendaftaran) => (
                                <tr key={pendaftaran.id} className="hover:bg-slate-50/70">
                                    <td className="whitespace-nowrap px-5 py-4 font-mono text-xs font-semibold text-slate-700 sm:px-7">
                                        {pendaftaran.no_pendaftaran}
                                    </td>
                                    <td className="whitespace-nowrap px-5 py-4">
                                        <p className="text-sm font-semibold text-slate-900">
                                            {pendaftaran.user?.siswa?.nama_lengkap ?? pendaftaran.user?.name ?? '—'}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {pendaftaran.user?.email ?? 'Akun tidak tersedia'}
                                            {pendaftaran.user?.siswa?.nisn && ` · NISN ${pendaftaran.user.siswa.nisn}`}
                                        </p>
                                    </td>
                                    <td className="whitespace-nowrap px-5 py-4">
                                        <button
                                            type="button"
                                            onClick={() => setViewingPendaftaran(pendaftaran)}
                                            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50"
                                        >
                                            Lihat Biodata
                                        </button>
                                    </td>
                                    <td className="max-w-56 px-5 py-4 text-sm text-slate-600">
                                        {pendaftaran.sekolah_asal ?? pendaftaran.asal_sekolah}
                                    </td>
                                    <td className="px-5 py-4 text-sm text-slate-600">
                                        <p className="font-medium text-slate-800">
                                            {pendaftaran.program_keahlian?.nama_jurusan ?? '—'}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {pendaftaran.konsentrasi_keahlian?.nama_konsentrasi ?? 'Konsentrasi belum dipilih'}
                                        </p>
                                    </td>
                                    <td className="whitespace-nowrap px-5 py-4">
                                        {pendaftaran.berkas_path ? (
                                            <a
                                                href={route('admin.spmb.berkas', pendaftaran.id)}
                                                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50"
                                            >
                                                Unduh berkas
                                            </a>
                                        ) : (
                                            <span className="text-xs text-slate-400">Belum diunggah</span>
                                        )}
                                    </td>
                                    <td className="whitespace-nowrap px-5 py-4">
                                        <SelectionBadge status={pendaftaran.status_seleksi} />
                                    </td>
                                    <td className="whitespace-nowrap px-5 py-4 sm:px-7">
                                        {pendaftaran.status_seleksi === 'pending' ? (
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    disabled={eligibleClassesFor(pendaftaran).length === 0}
                                                    onClick={() => openAcceptModal(pendaftaran)}
                                                    className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    Terima
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setRejectingPendaftaran(pendaftaran)}
                                                    className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                                                >
                                                    Tolak
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="block text-right text-xs text-slate-400">
                                                {pendaftaran.user?.siswa?.kelas?.nama_kelas ?? '—'}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="border-t border-slate-100 px-5 py-4 sm:px-7">
                    <AdminPagination links={pendaftarans.links} />
                </div>
            </section>

            <AdminResourceModal
                show={Boolean(viewingPendaftaran)}
                title="Biodata Pendaftar"
                description="Data identitas yang dikirim calon siswa."
                processing={false}
                submitLabel="Tutup"
                onClose={() => setViewingPendaftaran(null)}
                onSubmit={(event) => {
                    event.preventDefault();
                    setViewingPendaftaran(null);
                }}
            >
                {viewingPendaftaran && (() => {
                    const student = viewingPendaftaran.user?.siswa;
                    const programLabels = {
                        reguler: 'Reguler',
                        santri_internal: 'Santri Internal PP Al Fiel Kesugihan',
                        santri_eksternal: 'Santri Eksternal',
                    };
                    const details = [
                        ['Nama Lengkap', student?.nama_lengkap],
                        ['NIS', viewingPendaftaran.nis ?? student?.nis],
                        ['NISN', student?.nisn],
                        ['No. WhatsApp Wali', student?.no_wa_wali],
                        ['Tempat, Tanggal Lahir', [viewingPendaftaran.tempat_lahir, viewingPendaftaran.tanggal_lahir?.slice(0, 10)].filter(Boolean).join(', ')],
                        ['Jenis Kelamin', viewingPendaftaran.jenis_kelamin],
                        ['Agama', viewingPendaftaran.agama],
                        ['Status Keluarga / Anak Ke', [viewingPendaftaran.status_keluarga, viewingPendaftaran.anak_ke].filter(Boolean).join(' / ')],
                        ['Alamat Murid', viewingPendaftaran.alamat_murid],
                        ['Telepon Rumah', viewingPendaftaran.telepon_rumah],
                        ['Sekolah Asal', viewingPendaftaran.sekolah_asal ?? viewingPendaftaran.asal_sekolah],
                        ['Program Keahlian', viewingPendaftaran.program_keahlian?.nama_jurusan],
                        ['Konsentrasi Keahlian', viewingPendaftaran.konsentrasi_keahlian?.nama_konsentrasi],
                        ['Program', programLabels[viewingPendaftaran.tipe_program] ?? 'Reguler'],
                        ['Kategori Beasiswa', viewingPendaftaran.kategori_beasiswa?.nama_beasiswa],
                        ['Ukuran Seragam', viewingPendaftaran.ukuran_seragam],
                        ['Nama Ayah / Pekerjaan', [viewingPendaftaran.nama_ayah, viewingPendaftaran.pekerjaan_ayah].filter(Boolean).join(' / ')],
                        ['Nama Ibu / Pekerjaan', [viewingPendaftaran.nama_ibu, viewingPendaftaran.pekerjaan_ibu].filter(Boolean).join(' / ')],
                        ['Alamat Orang Tua', viewingPendaftaran.alamat_ortu],
                        ['Telepon Orang Tua', viewingPendaftaran.telepon_ortu],
                        ['Nama Wali / Pekerjaan', [viewingPendaftaran.nama_wali, viewingPendaftaran.pekerjaan_wali].filter(Boolean).join(' / ')],
                        ['Alamat Wali', viewingPendaftaran.alamat_wali],
                        ['Telepon Wali', viewingPendaftaran.telepon_wali],
                    ];

                    return (
                        <div className="flex flex-col gap-4">
                            {fotoSiswaUrls[viewingPendaftaran.id] && (
                                <img
                                    src={fotoSiswaUrls[viewingPendaftaran.id]}
                                    alt={`Pas foto ${student?.nama_lengkap ?? 'calon siswa'}`}
                                    className="h-32 w-24 rounded-lg border border-slate-200 object-cover"
                                />
                            )}
                            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                                {details.map(([label, value]) => (
                                    <div key={label} className="rounded-lg bg-slate-50 p-3">
                                        <dt className="text-xs font-semibold text-slate-500">{label}</dt>
                                        <dd className="mt-1 whitespace-pre-line text-slate-800">{value || '—'}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    );
                })()}
            </AdminResourceModal>

            <AdminResourceModal
                show={Boolean(acceptingPendaftaran)}
                title="Terima calon siswa"
                description="Pilih kelas pada tahun ajaran aktif yang sesuai dengan Program dan Konsentrasi Keahlian pendaftar."
                processing={form.processing}
                submitLabel="Terima Siswa"
                onClose={() => setAcceptingPendaftaran(null)}
                onSubmit={acceptPendaftaran}
            >
                <div>
                    <label htmlFor="kelas-terima" className="mb-2 block text-sm font-semibold text-slate-700">
                        Kelas tujuan
                    </label>
                    <select
                        id="kelas-terima"
                        value={form.data.kelas_id}
                        onChange={(event) => form.setData('kelas_id', event.target.value)}
                        className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                        <option value="">Pilih kelas</option>
                        {eligibleClassesFor(acceptingPendaftaran).map((kelas) => (
                            <option key={kelas.id} value={kelas.id}>{kelas.nama_kelas}</option>
                        ))}
                    </select>
                    <InputError message={form.errors.kelas_id} className="mt-2" />
                    {acceptingPendaftaran?.program_keahlian_id && eligibleClassesFor(acceptingPendaftaran).length === 0 && (
                        <p className="mt-2 text-sm text-rose-600">
                            Belum ada kelas pada tahun ajaran aktif yang sesuai. Atur Program dan Konsentrasi pada menu Kelas terlebih dahulu.
                        </p>
                    )}
                </div>
            </AdminResourceModal>

            <AdminDeleteModal
                show={Boolean(rejectingPendaftaran)}
                title="Tolak pendaftaran?"
                description="Status seleksi pendaftar akan ditandai sebagai ditolak."
                confirmLabel="Ya, tolak"
                processing={rejectForm.processing}
                onClose={() => setRejectingPendaftaran(null)}
                onConfirm={rejectPendaftaran}
            />
            <SpmbApplicantReportDocument
                settings={pengaturanSekolah}
                pendaftarans={printPendaftarans}
            />
        </DashboardLayout>
    );
}
