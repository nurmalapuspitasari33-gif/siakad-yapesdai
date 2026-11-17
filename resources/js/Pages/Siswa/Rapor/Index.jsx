import StudentReportDocument from '@/Components/StudentReportDocument';
import DashboardLayout from '@/Layouts/DashboardLayout';
import roleNavigationItems from '@/Components/RoleNavigationItems';
import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const subjectGroups = [
    { key: 'umum', title: 'A. Mata Pelajaran Umum' },
    { key: 'kejuruan', title: 'B. Mata Pelajaran Kejuruan' },
    { key: 'muatan_lokal', title: 'C. Muatan Lokal' },
];

function SubjectTable({ title, subjects = [] }) {
    return (
        <section className="overflow-hidden rounded-xl border border-slate-200">
            <h3 className="bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800">{title}</h3>
            <div className="overflow-x-auto">
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
                                <td className="border border-slate-300 px-3 py-2 text-center font-semibold">{nilai.nilai_akhir ?? '—'}</td>
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
                <div className="mt-3 grid grid-cols-3 gap-3 text-sm text-slate-600">
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

export default function SiswaRaporIndex({ siswa = {}, rapor = [], isCandidate = false }) {
    const { pengaturanSekolah = {} } = usePage().props;
    const [printTarget, setPrintTarget] = useState(null);

    useEffect(() => {
        if (!printTarget) {
            return undefined;
        }

        const handleAfterPrint = () => setPrintTarget(null);
        window.addEventListener('afterprint', handleAfterPrint);
        window.print();

        return () => window.removeEventListener('afterprint', handleAfterPrint);
    }, [printTarget]);

    return (
        <DashboardLayout
            title="Rapor Akademik"
            subtitle="Lihat nilai akhir, capaian kompetensi, catatan wali kelas, dan cetak dokumen rapor."
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
                    <button
                        type="button"
                        onClick={() => setPrintTarget({ mode: 'identity' })}
                        className="rounded-xl border border-indigo-200 px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
                    >
                        Cetak Identitas Murid (1 Halaman)
                    </button>
                </section>

                {rapor.length === 0 ? (
                    <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center shadow-sm">
                        <p className="font-semibold text-slate-800">Rapor semester belum tersedia</p>
                        <p className="mt-1 text-sm text-slate-500">Dokumen identitas tetap dapat dicetak. Nilai dan catatan rapor akan muncul setelah diinput.</p>
                    </section>
                ) : rapor.map((semester) => {
                    const subjects = semester.mata_pelajaran ?? [];
                    const catatan = semester.catatan_rapor ?? {};

                    return (
                        <section key={semester.tahun_ajaran_id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="font-bold text-slate-900">
                                        {semester.tahun_ajaran ?? 'Tahun ajaran'} · Semester {semester.semester ?? '—'}
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Kelas {siswa.kelas ?? '—'}{siswa.fase ? ` · Fase ${siswa.fase}` : ''}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setPrintTarget({ mode: 'semester', semester })}
                                    className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                                >
                                    Cetak Rapor Semester (2 Halaman)
                                </button>
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

                            {semester.semester === 'genap' && catatan.status_kenaikan && (
                                <section className="rounded-xl border border-slate-200 p-4 text-sm">
                                    <h3 className="font-bold text-slate-900">Kenaikan Kelas</h3>
                                    <p className="mt-2 text-slate-600">
                                        {catatan.status_kenaikan === 'naik' ? 'Naik' : 'Tidak Naik'}
                                        {catatan.naik_ke_kelas ? ` ke ${catatan.naik_ke_kelas}` : ''}
                                    </p>
                                </section>
                            )}
                        </section>
                    );
                })}

                <Link href={route('siswa.dashboard')} className="text-sm font-semibold text-indigo-700 hover:text-indigo-900">
                    ← Kembali ke Dasbor
                </Link>
            </div>

            {printTarget && (
                <StudentReportDocument
                    mode={printTarget.mode}
                    student={siswa}
                    settings={pengaturanSekolah}
                    semester={printTarget.semester}
                />
            )}
        </DashboardLayout>
    );
}
