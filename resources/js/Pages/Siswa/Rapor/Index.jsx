import DashboardLayout from '@/Layouts/DashboardLayout';
import roleNavigationItems from '@/Components/RoleNavigationItems';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

const subjectGroups = [
    { key: 'umum', title: 'A. Mata Pelajaran Umum' },
    { key: 'kejuruan', title: 'B. Mata Pelajaran Kejuruan' },
    { key: 'muatan_lokal', title: 'C. Muatan Lokal' },
];

function formatScore(value) {
    return value === null || value === undefined || value === ''
        ? '—'
        : String(Math.round(Number(value)));
}

function SubjectTable({ title, subjects = [] }) {
    return (
        <section className="overflow-hidden rounded-xl border border-slate-200">
            <h3 className="bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800">{title}</h3>
            <div className="w-full overflow-x-auto">
                <table className="report-table min-w-full border-collapse text-left text-xs">
                    <thead>
                        <tr>
                            {['No.', 'Mata Pelajaran', 'Nilai Akhir', 'Capaian Kompetensi'].map((heading) => (
                                <th key={heading} className="border border-slate-300 bg-white px-3 py-2">{heading}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {subjects.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="border border-slate-300 px-3 py-3 text-center text-slate-500">
                                    Belum ada nilai pada kelompok ini.
                                </td>
                            </tr>
                        ) : subjects.map((nilai, index) => (
                            <tr key={`${nilai.kode_mapel}-${index}`}>
                                <td className="border border-slate-300 px-3 py-2 text-center">{index + 1}</td>
                                <td className="border border-slate-300 px-3 py-2">{nilai.nama_mapel}</td>
                                <td className="border border-slate-300 px-3 py-2 text-center font-semibold">{formatScore(nilai.nilai_akhir)}</td>
                                <td className="min-w-64 border border-slate-300 px-3 py-2 whitespace-pre-line">{nilai.capaian_kompetensi || '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

function AttendanceAndNotes({ catatan = {} }) {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-xl border border-slate-200 p-4">
                <h3 className="font-bold text-slate-900">Ketidakhadiran</h3>
                <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-600 sm:grid-cols-3 sm:gap-3">
                    <p>Sakit: {catatan.sakit ?? 0}</p>
                    <p>Izin: {catatan.izin ?? 0}</p>
                    <p>Alpa: {catatan.tanpa_keterangan ?? 0}</p>
                </div>
            </section>
            <section className="rounded-xl border border-slate-200 p-4">
                <h3 className="font-bold text-slate-900">Catatan Wali Kelas</h3>
                <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{catatan.catatan_wali_kelas || '—'}</p>
            </section>
        </div>
    );
}

export default function SiswaRaporIndex({
    siswa = {},
    rapor = [],
    tahunAjaranOptions = [],
    selectedTahunAjaran = '',
    selectedSemester = '',
    isCandidate = false,
    isReportReleased = false,
    tanggalRilisRapor = null,
    statusRilisRapor = 'otomatis',
}) {
    const [tahunAjaran, setTahunAjaran] = useState(selectedTahunAjaran ?? '');
    const [semester, setSemester] = useState(selectedSemester ?? '');
    const [isRaporVisible, setIsRaporVisible] = useState(true);

    const filterRapor = (event) => {
        event.preventDefault();
        router.get(
            route('siswa.rapor.index'),
            { tahun_ajaran: tahunAjaran, semester },
            { preserveScroll: true, preserveState: true },
        );
    };

    return (
        <DashboardLayout
            title="Rapor Akademik"
            subtitle="Lihat nilai akhir, capaian kompetensi, dan catatan wali kelas."
            roleLabel="Siswa"
            navigation={roleNavigationItems('siswa', 'rapor', { isCandidate })}
        >
            <Head title="Rapor Akademik" />

            <div className="flex flex-col gap-6 print:hidden">
                <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="font-bold text-slate-900">Rapor Anda</h2>
                        <p className="mt-1 text-sm text-slate-600">
                            {siswa.nama_lengkap ?? 'Nama belum tersedia'} · NISN {siswa.nisn ?? 'Belum diterbitkan'}
                        </p>
                    </div>
                </section>

                {!isReportReleased && (
                    <section
                        role="status"
                        className={`rounded-2xl border p-5 shadow-sm sm:p-7 ${
                            statusRilisRapor === 'kunci'
                                ? 'border-rose-200 bg-rose-50 text-rose-900'
                                : 'border-amber-200 bg-amber-50 text-amber-900'
                        }`}
                    >
                        <h2 className="font-bold">Rapor belum dapat diakses</h2>
                        <p className="mt-2 text-sm leading-6">
                            {statusRilisRapor === 'kunci'
                                ? 'Akses rapor sedang dikunci oleh administrator.'
                                : tanggalRilisRapor
                                    ? (
                                        <>
                                            Rapor semester ini baru dapat diakses mulai tanggal{' '}
                                            <time dateTime={tanggalRilisRapor}>{tanggalRilisRapor}</time>.
                                        </>
                                    )
                                    : 'Tanggal pembagian rapor belum ditetapkan.'}
                        </p>
                    </section>
                )}

                <section hidden={!isReportReleased} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                    <form onSubmit={filterRapor} className="flex flex-col gap-4 sm:flex-row sm:items-end">
                        <div className="flex-1">
                            <label htmlFor="tahun-ajaran-rapor" className="mb-2 block text-sm font-semibold text-slate-700">
                                Tahun Ajaran
                            </label>
                            <select
                                id="tahun-ajaran-rapor"
                                value={tahunAjaran}
                                onChange={(event) => setTahunAjaran(event.target.value)}
                                disabled={tahunAjaranOptions.length === 0}
                                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500 disabled:bg-slate-100"
                            >
                                {tahunAjaranOptions.length === 0 && <option value="">Belum ada rapor</option>}
                                {tahunAjaranOptions.map((option) => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1">
                            <label htmlFor="semester-rapor" className="mb-2 block text-sm font-semibold text-slate-700">
                                Semester
                            </label>
                            <select
                                id="semester-rapor"
                                value={semester}
                                onChange={(event) => setSemester(event.target.value)}
                                disabled={tahunAjaranOptions.length === 0}
                                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500 disabled:bg-slate-100"
                            >
                                <option value="ganjil">Ganjil</option>
                                <option value="genap">Genap</option>
                            </select>
                        </div>
                        <button
                            type="submit"
                            disabled={tahunAjaranOptions.length === 0}
                            className="rounded-xl bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Tampilkan
                        </button>
                    </form>
                </section>

                <section hidden={!isReportReleased} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                        <div>
                            <h2 className="font-bold text-slate-900">Rapor Semester</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                {selectedTahunAjaran
                                    ? `${selectedTahunAjaran} · Semester ${selectedSemester ?? '—'}`
                                    : 'Pilih tahun ajaran dan semester untuk melihat rapor.'}
                            </p>
                        </div>
                        <button
                            type="button"
                            aria-expanded={isRaporVisible}
                            aria-controls="rapor-semester"
                            onClick={() => setIsRaporVisible((visible) => !visible)}
                            className="w-fit rounded-xl border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
                        >
                            {isRaporVisible ? 'Sembunyikan Rapor' : 'Tampilkan Rapor'}
                        </button>
                    </div>

                    {isRaporVisible && (
                        <div id="rapor-semester" className="flex flex-col gap-4 p-5 sm:p-7">
                            {rapor.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-slate-300 px-5 py-12 text-center">
                                    <p className="font-semibold text-slate-800">Rapor semester belum tersedia</p>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Nilai dan catatan wali kelas akan muncul setelah diinput.
                                    </p>
                                </div>
                            ) : rapor.map((semesterRapor) => {
                                const subjects = semesterRapor.mata_pelajaran ?? [];
                                const catatan = semesterRapor.catatan_rapor ?? {};

                                return (
                                    <div key={semesterRapor.tahun_ajaran_id} className="flex flex-col gap-4">
                                        <div>
                                            <h3 className="font-bold text-slate-900">
                                                {semesterRapor.tahun_ajaran ?? 'Tahun ajaran'} · Semester {semesterRapor.semester ?? '—'}
                                            </h3>
                                            <p className="mt-1 text-sm text-slate-500">
                                                Kelas {siswa.kelas ?? '—'}{siswa.fase ? ` · Fase ${siswa.fase}` : ''}
                                            </p>
                                        </div>

                                        {subjectGroups.map((group) => (
                                            <SubjectTable
                                                key={group.key}
                                                title={group.title}
                                                subjects={subjects.filter((nilai) => nilai.kelompok_mapel === group.key)}
                                            />
                                        ))}

                                        <section className="rounded-xl border border-slate-200 p-4">
                                            <h3 className="font-bold text-slate-900">Kokurikuler · {catatan.kokurikuler_predikat || '—'}</h3>
                                            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                                                {catatan.kokurikuler_deskripsi || 'Belum ada deskripsi kokurikuler.'}
                                            </p>
                                        </section>

                                        <section className="rounded-xl border border-slate-200 p-4">
                                            <h3 className="font-bold text-slate-900">Ekstrakurikuler</h3>
                                            <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                                                <p>{catatan.ekstra_1_nama || '—'} · {catatan.ekstra_1_ket || '—'}</p>
                                                <p>{catatan.ekstra_2_nama || '—'} · {catatan.ekstra_2_ket || '—'}</p>
                                            </div>
                                        </section>

                                        <AttendanceAndNotes catatan={catatan} />

                                        {semesterRapor.semester === 'genap' && catatan.status_kenaikan && (
                                            <section className="rounded-xl border border-slate-200 p-4 text-sm">
                                                <h3 className="font-bold text-slate-900">Kenaikan Kelas</h3>
                                                <p className="mt-2 text-slate-600">
                                                    {catatan.status_kenaikan === 'naik' ? 'Naik' : 'Tidak Naik'}
                                                    {catatan.naik_ke_kelas ? ` ke ${catatan.naik_ke_kelas}` : ''}
                                                </p>
                                            </section>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                <Link href={route('siswa.dashboard')} className="text-sm font-semibold text-indigo-700 hover:text-indigo-900">
                    ← Kembali ke Dasbor
                </Link>
            </div>
        </DashboardLayout>
    );
}
