import { usePage } from '@inertiajs/react';

function printValue(value) {
    return value === null || value === undefined || value === '' ? '—' : String(value);
}

function formatLongDate(value) {
    if (!value) {
        return '';
    }

    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));

    if (!match) {
        return String(value);
    }

    const [, year, month, day] = match;
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(date);
}

function programTypeLabel(value) {
    return {
        reguler: 'Reguler',
        santri_internal: 'Santri Internal',
        santri_eksternal: 'Santri Eksternal',
    }[value] ?? printValue(value);
}

function selectionLabel(value) {
    return {
        pending: 'Pending',
        diterima: 'Diterima',
        ditolak: 'Ditolak',
    }[value] ?? printValue(value);
}

export default function SpmbApplicantReportDocument({
    settings = {},
    pendaftarans = [],
}) {
    const { assetUrls = {} } = usePage().props;
    const schoolSettings = settings ?? {};
    const placeAndDate = [
        schoolSettings.tempat_rapor,
        formatLongDate(schoolSettings.tanggal_rapor),
    ].filter(Boolean).join(', ');

    return (
        <section className="print-document spmb-print-document hidden bg-white text-black print:block">
            <header className="spmb-report-school-heading">
                <img src={assetUrls.logoSekolah} alt="" className="spmb-report-logo" />
                <div>
                    <h1>{printValue(schoolSettings.nama_sekolah)}</h1>
                    <p>NPSN: {printValue(schoolSettings.npsn)}</p>
                    <p>{printValue(schoolSettings.alamat)}</p>
                    <p>
                        {[schoolSettings.telepon, schoolSettings.email].filter(Boolean).join(' · ') || '—'}
                    </p>
                </div>
            </header>

            <h2 className="spmb-report-title">REKAP PENDAFTAR SPMB</h2>
            <p className="spmb-report-total">Jumlah pendaftar: {pendaftarans.length}</p>

            <table className="spmb-report-table">
                <colgroup>
                    <col className="spmb-col-number" />
                    <col className="spmb-col-registration" />
                    <col className="spmb-col-name" />
                    <col className="spmb-col-nisn" />
                    <col className="spmb-col-school" />
                    <col className="spmb-col-program" />
                    <col className="spmb-col-type" />
                    <col className="spmb-col-status" />
                </colgroup>
                <thead>
                    <tr>
                        <th className="text-[9pt] leading-tight px-2 py-1.5 whitespace-normal break-words">No.</th>
                        <th className="text-[9pt] leading-tight px-2 py-1.5 whitespace-normal break-words">Nomor Pendaftaran</th>
                        <th className="text-[9pt] leading-tight px-2 py-1.5 whitespace-normal break-words">Nama Lengkap</th>
                        <th className="text-[9pt] leading-tight px-2 py-1.5 whitespace-normal break-words">NISN</th>
                        <th className="text-[9pt] leading-tight px-2 py-1.5 whitespace-normal break-words">Asal Sekolah</th>
                        <th className="text-[9pt] leading-tight px-2 py-1.5 whitespace-normal break-words">Program &amp; Konsentrasi Keahlian</th>
                        <th className="text-[9pt] leading-tight px-2 py-1.5 whitespace-normal break-words">Tipe Program</th>
                        <th className="text-[9pt] leading-tight px-2 py-1.5 whitespace-normal break-words">Status Seleksi</th>
                    </tr>
                </thead>
                <tbody>
                    {pendaftarans.map((pendaftaran, index) => (
                        <tr key={pendaftaran.no_pendaftaran}>
                            <td className="text-[9pt] leading-tight px-2 py-1.5 whitespace-normal break-words">{index + 1}</td>
                            <td className="text-[9pt] leading-tight px-2 py-1.5 whitespace-normal break-words">{printValue(pendaftaran.no_pendaftaran)}</td>
                            <td className="text-[9pt] leading-tight px-2 py-1.5 whitespace-normal break-words">{printValue(pendaftaran.nama_lengkap)}</td>
                            <td className="text-[9pt] leading-tight px-2 py-1.5 whitespace-normal break-words">{printValue(pendaftaran.nisn)}</td>
                            <td className="text-[9pt] leading-tight px-2 py-1.5 whitespace-normal break-words">{printValue(pendaftaran.asal_sekolah)}</td>
                            <td className="text-[9pt] leading-tight px-2 py-1.5 whitespace-normal break-words">
                                {printValue(pendaftaran.program_keahlian)}
                                {pendaftaran.konsentrasi_keahlian && (
                                    <><br />{pendaftaran.konsentrasi_keahlian}</>
                                )}
                            </td>
                            <td className="text-[9pt] leading-tight px-2 py-1.5 whitespace-normal break-words">{programTypeLabel(pendaftaran.tipe_program)}</td>
                            <td className="text-[9pt] leading-tight px-2 py-1.5 whitespace-normal break-words">{selectionLabel(pendaftaran.status_seleksi)}</td>
                        </tr>
                    ))}
                    {pendaftarans.length === 0 && (
                        <tr>
                            <td colSpan="8" className="spmb-report-empty">
                                Tidak ada pendaftar sesuai filter.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <footer className="spmb-report-signatures">
                <div>
                    <p>Panitia SPMB,</p>
                    <div className="spmb-report-signature-space" />
                    <p className="spmb-report-signature-name">________________________</p>
                    <p>NIKY. __________________</p>
                </div>
                <div>
                    <p>{placeAndDate || '........................................'}</p>
                    <p>Kepala Sekolah,</p>
                    <div className="spmb-report-signature-space" />
                    <p className="spmb-report-signature-name">
                        {printValue(schoolSettings.kepala_sekolah)}
                    </p>
                    <p>NIKY. {printValue(schoolSettings.niky_kepala_sekolah)}</p>
                </div>
            </footer>
        </section>
    );
}
