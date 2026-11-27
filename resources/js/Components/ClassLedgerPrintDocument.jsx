import { usePage } from '@inertiajs/react';

function printValue(value) {
    return value === null || value === undefined || value === '' ? '—' : String(value);
}

function formatScore(value) {
    return value === null || value === undefined || value === ''
        ? '—'
        : String(Math.round(Number(value)));
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

function subjectGroups(mataPelajarans) {
    return [
        { key: 'umum', title: 'A. Mata Pelajaran Umum', compactTitle: 'A. UMUM' },
        { key: 'kejuruan', title: 'B. Mata Pelajaran Kejuruan', compactTitle: 'B. KEJURUAN' },
        { key: 'muatan_lokal', title: 'C. Muatan Lokal', compactTitle: 'C. MULOK' },
    ].map((group) => ({
        ...group,
        subjects: mataPelajarans.filter((mapel) => mapel.kelompok_mapel === group.key),
    }));
}

export default function ClassLedgerPrintDocument({
    settings = {},
    orientation = 'landscape',
    kelas = null,
    fase = null,
    namaWaliKelas = null,
    waliNiky = null,
    tahunAjaran = null,
    mataPelajarans = [],
    siswas = [],
}) {
    const { assetUrls = {} } = usePage().props;
    const placeAndDate = [
        settings.tempat_rapor,
        formatLongDate(settings.tanggal_rapor),
    ].filter(Boolean).join(', ');
    const groups = subjectGroups(mataPelajarans);
    const columnCount = 6 + groups.reduce(
        (total, group) => total + Math.max(group.subjects.length, 1),
        0,
    );

    return (
        <section
            className={`print-document ledger-print-document hidden bg-white text-black print:block ${
                orientation === 'portrait' ? 'ledger-print-portrait' : 'ledger-print-landscape'
            }`}
        >
            <header className="ledger-school-heading">
                <table className="report-table ledger-school-heading-table">
                    <tbody>
                        <tr>
                            <td className="ledger-school-logo-cell">
                                <img src={assetUrls.logoSekolah || '/logo.png'} alt="Logo sekolah" />
                            </td>
                            <td className="ledger-school-info">
                                <h1>{printValue(settings.nama_sekolah)}</h1>
                                <p>NPSN: {printValue(settings.npsn)}</p>
                                <p>{printValue(settings.alamat)}</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </header>

            <h2 className="ledger-title">LEGER NILAI KELAS</h2>
            <p className="ledger-class-identity">
                Kelas: {printValue(kelas)}{fase ? ` · Fase ${fase}` : ''}
                {' · '}Tahun Ajaran: {printValue(tahunAjaran?.nama_tahun)}
                {' · '}Semester: {printValue(tahunAjaran?.semester)}
            </p>

            <table className="ledger-print-table">
                <thead>
                    <tr>
                        <th rowSpan="2">No</th>
                        <th rowSpan="2">Nama Murid</th>
                        <th rowSpan="2">NISN</th>
                        {groups.map((group) => (
                            <th
                                key={group.key}
                                colSpan={Math.max(group.subjects.length, 1)}
                                className={`ledger-group-heading ledger-group-${group.key} whitespace-normal break-words leading-tight px-2 py-1.5 uppercase`}
                            >
                                {group.subjects.length <= 1 ? group.compactTitle : group.title}
                            </th>
                        ))}
                        <th rowSpan="2">Jumlah Nilai</th>
                        <th rowSpan="2">Rata-rata</th>
                        <th rowSpan="2">Ranking</th>
                    </tr>
                    <tr>
                        {groups.flatMap((group) => group.subjects.length > 0
                            ? group.subjects.map((mapel) => (
                                <th
                                    key={`${group.key}-${mapel.id}`}
                                    className={`ledger-group-${group.key}`}
                                    title={mapel.nama_mapel}
                                >
                                    {printValue(mapel.kode_mapel || mapel.nama_mapel)}
                                </th>
                            ))
                            : [(
                                <th key={`${group.key}-empty`} className={`ledger-group-${group.key}`}>—</th>
                            )])}
                    </tr>
                </thead>
                <tbody>
                    {siswas.map((siswa, index) => (
                        <tr key={siswa.id}>
                            <td className="ledger-center">{index + 1}</td>
                            <td>{printValue(siswa.nama_lengkap)}</td>
                            <td className="ledger-center">{printValue(siswa.nisn)}</td>
                            {groups.flatMap((group) => group.subjects.length > 0
                                ? group.subjects.map((mapel) => (
                                    <td
                                        key={`${group.key}-${mapel.id}`}
                                        className="ledger-center"
                                    >
                                        {formatScore(siswa.nilai?.[mapel.id]?.nilai_akhir)}
                                    </td>
                                ))
                                : [(
                                    <td key={`${group.key}-empty`} className="ledger-center">—</td>
                                )])}
                            <td className="ledger-center">{siswa.has_nilai ? printValue(siswa.jumlah_nilai) : '—'}</td>
                            <td className="ledger-center">
                                {siswa.rata_rata === null || siswa.rata_rata === undefined
                                    ? '—'
                                    : formatScore(siswa.rata_rata)}
                            </td>
                            <td className="ledger-center">{printValue(siswa.ranking)}</td>
                        </tr>
                    ))}
                    {siswas.length === 0 && (
                        <tr>
                            <td colSpan={columnCount} className="ledger-empty">
                                Belum ada siswa aktif di kelas ini.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <footer>
                <table className="report-table ledger-signatures">
                    <tbody>
                        <tr>
                            <td>
                                <p>{placeAndDate || '........................................'}</p>
                                <p>Wali Kelas,</p>
                                <div className="ledger-signature-space" />
                                <p className="ledger-signature-name">{printValue(namaWaliKelas)}</p>
                                <p>NIKY. {printValue(waliNiky)}</p>
                            </td>
                            <td>
                                <p>Mengetahui,</p>
                                <p>Kepala Sekolah</p>
                                <div className="ledger-signature-space" />
                                <p className="ledger-signature-name">{printValue(settings.kepala_sekolah)}</p>
                                <p>NIKY. {printValue(settings.niky_kepala_sekolah)}</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </footer>
        </section>
    );
}
