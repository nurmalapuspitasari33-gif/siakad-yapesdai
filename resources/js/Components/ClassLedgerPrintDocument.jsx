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

function abbreviateSubjectName(value) {
    const name = String(value ?? '').trim();
    const normalizedName = name
        .toLocaleLowerCase('id-ID')
        .replace(/[.,]/g, '')
        .replace(/\s+/g, ' ');
    const abbreviations = {
        'pendidikan agama dan budi pekerti': 'PABP',
        'pendidikan agama islam dan budi pekerti': 'PABP',
        matematika: 'MTK',
    };

    if (abbreviations[normalizedName]) {
        return abbreviations[normalizedName];
    }

    const words = normalizedName
        .split(' ')
        .filter((word) => word && !['dan', 'serta', 'yang'].includes(word));

    if (words.length === 1) {
        return words[0].slice(0, 3).toUpperCase();
    }

    return words.map((word) => word[0]).join('').toUpperCase();
}

function subjectGroups(mataPelajarans) {
    return [
        { key: 'umum', title: 'A. Mata Pelajaran Umum', compactTitle: ['A.', 'UMUM'] },
        { key: 'kejuruan', title: 'B. Mata Pelajaran Kejuruan', compactTitle: ['B.', 'KEJURUAN'] },
        { key: 'muatan_lokal', title: 'C. Muatan Lokal', compactTitle: ['C.', 'MULOK'] },
    ].map((group) => ({
        ...group,
        subjects: mataPelajarans.filter((mapel) => mapel.kelompok_mapel === group.key),
    }));
}

function LedgerTable({ groups, students, columnCount, startingIndex = 0, showEmpty = false }) {
    const subjectColumnCount = groups.reduce(
        (total, group) => total + Math.max(group.subjects.length, 1),
        0,
    );
    const subjectColumnWidth = `${56 / subjectColumnCount}%`;

    return (
        <table className="ledger-print-table">
            <colgroup>
                <col style={{ width: '4%' }} />
                <col style={{ width: '17%' }} />
                <col style={{ width: '5%' }} />
                {groups.flatMap((group) => Array.from(
                    { length: Math.max(group.subjects.length, 1) },
                    (_, index) => (
                        <col
                            key={`${group.key}-${index}`}
                            style={{ width: subjectColumnWidth }}
                        />
                    ),
                ))}
                <col style={{ width: '7%' }} />
                <col style={{ width: '6%' }} />
                <col style={{ width: '5%' }} />
            </colgroup>
            <thead>
                <tr>
                    <th rowSpan="2">No</th>
                    <th rowSpan="2">Nama Murid</th>
                    <th rowSpan="2">NISN</th>
                    {groups.map((group) => (
                        <th
                            key={group.key}
                            colSpan={Math.max(group.subjects.length, 1)}
                            className={`ledger-group-heading ledger-group-${group.key} ${
                                group.subjects.length <= 1 ? 'ledger-group-heading-compact' : ''
                            } whitespace-normal break-words leading-tight px-2 py-1.5 uppercase`}
                        >
                            {group.subjects.length <= 1 ? (
                                <>
                                    {group.compactTitle[0]}
                                    <br />
                                    {group.compactTitle[1]}
                                </>
                            ) : group.title}
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
                                {printValue(abbreviateSubjectName(mapel.nama_mapel))}
                            </th>
                        ))
                        : [(
                            <th key={`${group.key}-empty`} className={`ledger-group-${group.key}`}>—</th>
                        )])}
                </tr>
            </thead>
            <tbody>
                {students.map((siswa, index) => (
                    <tr key={siswa.id}>
                        <td className="ledger-center">{startingIndex + index + 1}</td>
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
                {showEmpty && (
                    <tr>
                        <td colSpan={columnCount} className="ledger-empty">
                            Belum ada siswa aktif di kelas ini.
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    );
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
    const splitAt = orientation === 'landscape' && siswas.length > 20
        ? Math.ceil(siswas.length / 2)
        : siswas.length;
    const firstPageStudents = siswas.slice(0, splitAt);
    const continuationStudents = siswas.slice(splitAt);

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
                                <img
                                    src={assetUrls.logoSekolah || '/logo.png'}
                                    alt="Logo sekolah"
                                    onError={(event) => {
                                        if (event.currentTarget.dataset.fallbackAttempted !== 'true') {
                                            event.currentTarget.dataset.fallbackAttempted = 'true';
                                            event.currentTarget.src = assetUrls.logoYapesdai || '/yapesdai.png';
                                        }
                                    }}
                                />
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

            <LedgerTable
                groups={groups}
                students={firstPageStudents}
                columnCount={columnCount}
                showEmpty={siswas.length === 0}
            />
            {continuationStudents.length > 0 && (
                <>
                    <div className="ledger-page-break" />
                    <LedgerTable
                        groups={groups}
                        students={continuationStudents}
                        columnCount={columnCount}
                        startingIndex={firstPageStudents.length}
                    />
                </>
            )}

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
