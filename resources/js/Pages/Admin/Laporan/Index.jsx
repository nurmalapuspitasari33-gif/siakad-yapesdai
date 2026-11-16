import AdminNavigationItems from '@/Components/AdminNavigationItems';
import InputError from '@/Components/InputError';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

const numberFormatter = new Intl.NumberFormat('id-ID');
const currencyFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

function PrintHeading({ schoolSettings, title, yearLabel }) {
    return (
        <header className="hidden print:block executive-report-print-heading">
            <h1>{schoolSettings?.nama_sekolah ?? 'Nama Sekolah'}</h1>
            <p>
                {[schoolSettings?.alamat, schoolSettings?.npsn ? `NPSN ${schoolSettings.npsn}` : null]
                    .filter(Boolean)
                    .join(' · ') || 'Alamat sekolah belum diatur'}
            </p>
            <h2>{title}</h2>
            <p>Tahun Ajaran: {yearLabel}</p>
        </header>
    );
}

function ReportTable({ headers, rows, emptyMessage, renderRow }) {
    return (
        <div className="overflow-x-auto executive-report-table-wrapper">
            <table className="report-table executive-report-table min-w-full text-left">
                <thead>
                    <tr>
                        {headers.map((header) => (
                            <th key={header} scope="col">
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.length ? rows.map(renderRow) : (
                        <tr>
                            <td colSpan={headers.length} className="text-center text-slate-500">
                                {emptyMessage}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

function ReportAccordion({ id, title, description, isOpen, onToggle, onPrint, children }) {
    return (
        <section
            data-report-print={id}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
            <div className="flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 print:hidden">
                <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`${id}-content`}
                    onClick={onToggle}
                    className="flex min-w-0 flex-1 items-start gap-3 text-left"
                >
                    <span
                        aria-hidden="true"
                        className={`mt-0.5 text-sm text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    >
                        ▼
                    </span>
                    <span>
                        <span className="block font-bold text-slate-900">{title}</span>
                        <span className="mt-1 block text-sm font-normal text-slate-500">{description}</span>
                    </span>
                </button>
                <button
                    type="button"
                    onClick={onPrint}
                    className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 sm:self-center"
                >
                    <span aria-hidden="true">⎙</span>
                    Cetak Laporan (Print A4)
                </button>
            </div>
            <div id={`${id}-content`} className="executive-report-content" hidden={!isOpen}>
                {children}
            </div>
        </section>
    );
}

function CompletenessBadge({ complete }) {
    return (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
            complete ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
        }`}>
            {complete ? 'Lengkap' : 'Belum Lengkap'}
        </span>
    );
}

export default function LaporanIndex({
    tahunAjaranOptions = [],
    filters,
    laporanKeuangan = [],
    demografiSiswa = [],
    monitoringNilai = [],
}) {
    const { pengaturanSekolah } = usePage().props;
    const filterForm = useForm(filters);
    const [openReports, setOpenReports] = useState([]);
    const selectedYear = tahunAjaranOptions.find(
        (option) => String(option.id) === String(filterForm.data.tahun_ajaran_id),
    );
    const yearLabel = selectedYear
        ? `${selectedYear.nama_tahun} · ${selectedYear.semester}`
        : 'Semua Tahun Ajaran';

    const applyFilters = (event) => {
        event.preventDefault();
        filterForm.get(route('admin.laporan.index'), {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const toggleReport = (id) => {
        setOpenReports((current) => (
            current.includes(id)
                ? current.filter((reportId) => reportId !== id)
                : [...current, id]
        ));
    };

    const printReport = (id) => {
        document.body.dataset.adminReportPrint = id;

        try {
            window.print();
        } finally {
            delete document.body.dataset.adminReportPrint;
        }
    };

    return (
        <DashboardLayout
            title="Laporan Sekolah"
            subtitle="Tinjau rekap keuangan, demografi siswa, dan ketuntasan input nilai."
            roleLabel="Administrator"
            navigation={AdminNavigationItems('laporan')}
        >
            <Head title="Laporan Sekolah" />

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 print:hidden">
                <form onSubmit={applyFilters} className="flex flex-col gap-4 sm:flex-row sm:items-end">
                    <div className="w-full sm:max-w-md">
                        <label htmlFor="filter-tahun-ajaran" className="mb-1.5 block text-sm font-semibold text-slate-700">
                            Tahun Ajaran
                        </label>
                        <select
                            id="filter-tahun-ajaran"
                            value={filterForm.data.tahun_ajaran_id}
                            onChange={(event) => filterForm.setData('tahun_ajaran_id', event.target.value)}
                            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="">Semua tahun ajaran</option>
                            {tahunAjaranOptions.map((tahunAjaran) => (
                                <option key={tahunAjaran.id} value={tahunAjaran.id}>
                                    {tahunAjaran.nama_tahun} · {tahunAjaran.semester}
                                    {tahunAjaran.is_aktif ? ' (Aktif)' : ''}
                                </option>
                            ))}
                        </select>
                        <InputError message={filterForm.errors.tahun_ajaran_id} className="mt-1" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="submit"
                            disabled={filterForm.processing}
                            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
                        >
                            {filterForm.processing ? 'Memuat...' : 'Terapkan Filter'}
                        </button>
                        <Link
                            href={route('admin.laporan.index')}
                            preserveScroll
                            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                            Kembali ke Tahun Aktif
                        </Link>
                    </div>
                </form>
            </section>

            <div className="space-y-4">
                <ReportAccordion
                    id="keuangan"
                    title="Laporan Rekapitulasi Keuangan per Kelas"
                    description="Ringkasan tagihan, pembayaran, dan tunggakan siswa aktif."
                    isOpen={openReports.includes('keuangan')}
                    onToggle={() => toggleReport('keuangan')}
                    onPrint={() => printReport('keuangan')}
                >
                    <PrintHeading
                        schoolSettings={pengaturanSekolah}
                        title="Laporan Rekapitulasi Keuangan per Kelas"
                        yearLabel={yearLabel}
                    />
                    <ReportTable
                        headers={['Kelas', 'Jumlah Siswa', 'Total Tagihan (Rp)', 'Total Terbayar / Lunas (Rp)', 'Total Tunggakan (Rp)', 'Pelunasan (%)']}
                        rows={laporanKeuangan}
                        emptyMessage="Belum ada data kelas untuk tahun ajaran ini."
                        renderRow={(row) => (
                            <tr key={row.kelas_id}>
                                <td className="font-semibold text-slate-800">{row.nama_kelas}</td>
                                <td>{numberFormatter.format(row.jumlah_siswa)}</td>
                                <td>{currencyFormatter.format(Number(row.total_tagihan))}</td>
                                <td>{currencyFormatter.format(Number(row.total_terbayar))}</td>
                                <td>{currencyFormatter.format(Number(row.total_tunggakan))}</td>
                                <td>{Number(row.persentase_pelunasan).toFixed(2)}%</td>
                            </tr>
                        )}
                    />
                </ReportAccordion>

                <ReportAccordion
                    id="demografi"
                    title="Laporan Demografi Siswa, Santri, & Beasiswa"
                    description="Rekap siswa aktif menurut program keahlian, jenis kelamin, tipe program, dan afirmasi."
                    isOpen={openReports.includes('demografi')}
                    onToggle={() => toggleReport('demografi')}
                    onPrint={() => printReport('demografi')}
                >
                    <PrintHeading
                        schoolSettings={pengaturanSekolah}
                        title="Laporan Demografi Siswa, Santri, & Beasiswa"
                        yearLabel={yearLabel}
                    />
                    <ReportTable
                        headers={['Program Keahlian', 'Konsentrasi Keahlian', 'Jumlah Aktif', 'Laki-laki', 'Perempuan', 'Reguler', 'Santri Internal', 'Santri Eksternal', 'Beasiswa', 'Afirmasi']}
                        rows={demografiSiswa}
                        emptyMessage="Belum ada siswa aktif untuk tahun ajaran ini."
                        renderRow={(row, index) => (
                            <tr key={`${row.program_keahlian}-${row.konsentrasi_keahlian}-${index}`}>
                                <td className="font-semibold text-slate-800">{row.program_keahlian}</td>
                                <td>{row.konsentrasi_keahlian}</td>
                                <td>{numberFormatter.format(row.jumlah_aktif)}</td>
                                <td>{numberFormatter.format(row.laki_laki)}</td>
                                <td>{numberFormatter.format(row.perempuan)}</td>
                                <td>{numberFormatter.format(row.reguler)}</td>
                                <td>{numberFormatter.format(row.santri_internal)}</td>
                                <td>{numberFormatter.format(row.santri_eksternal)}</td>
                                <td>{numberFormatter.format(row.beasiswa)}</td>
                                <td>{numberFormatter.format(row.afirmasi)}</td>
                            </tr>
                        )}
                    />
                </ReportAccordion>

                <ReportAccordion
                    id="ketuntasan"
                    title="Laporan Monitoring Ketuntasan Input Nilai Guru"
                    description="Pantau jumlah nilai yang sudah diinput untuk setiap mata pelajaran dan kelas."
                    isOpen={openReports.includes('ketuntasan')}
                    onToggle={() => toggleReport('ketuntasan')}
                    onPrint={() => printReport('ketuntasan')}
                >
                    <PrintHeading
                        schoolSettings={pengaturanSekolah}
                        title="Laporan Monitoring Ketuntasan Input Nilai Guru"
                        yearLabel={yearLabel}
                    />
                    <ReportTable
                        headers={['Tahun Ajaran', 'Kelas', 'Kode Mapel', 'Mata Pelajaran', 'Guru Pengampu', 'Nilai Terinput', 'Status']}
                        rows={monitoringNilai}
                        emptyMessage="Belum ada jadwal mata pelajaran untuk tahun ajaran ini."
                        renderRow={(row, index) => {
                            const isComplete = row.jumlah_nilai >= row.total_siswa;

                            return (
                                <tr key={`${row.nama_tahun}-${row.nama_kelas}-${row.kode_mapel}-${row.nama_guru}-${index}`}>
                                    <td>{row.nama_tahun} · {row.semester}</td>
                                    <td className="font-semibold text-slate-800">{row.nama_kelas}</td>
                                    <td>{row.kode_mapel}</td>
                                    <td>{row.nama_mapel}</td>
                                    <td>{row.nama_guru}</td>
                                    <td>{numberFormatter.format(row.jumlah_nilai)} / {numberFormatter.format(row.total_siswa)} Siswa</td>
                                    <td><CompletenessBadge complete={isComplete} /></td>
                                </tr>
                            );
                        }}
                    />
                </ReportAccordion>
            </div>
        </DashboardLayout>
    );
}
