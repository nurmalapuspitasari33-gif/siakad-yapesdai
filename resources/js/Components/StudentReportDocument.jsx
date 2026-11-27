import { Fragment } from 'react';

function printValue(value) {
    return value === null || value === undefined || value === '' ? '' : String(value);
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

function reportPlaceAndDate(settings) {
    const date = formatLongDate(settings.tanggal_rapor);

    return [settings.tempat_rapor, date].filter(Boolean).join(', ') || '—';
}

function competencyFontClass(value) {
    const length = String(value ?? '').length;

    if (length > 240) {
        return 'competency-long text-[8.5pt] leading-tight';
    }

    if (length > 160) {
        return 'competency-medium text-[9.5pt] leading-tight';
    }

    return 'competency-normal text-[11pt] leading-snug';
}

function IdentityEntry({ number, label, value, isSubentry = false }) {
    return (
        <tr className={`identity-line${isSubentry ? ' identity-line-subentry' : ''}`}>
            <td className="identity-number">{number}</td>
            <td className="identity-label">{label}</td>
            <td className="identity-colon">{label ? ':' : ''}</td>
            <td className="identity-value">{printValue(value)}</td>
        </tr>
    );
}

function IdentityDocument({ student, settings, isBatch = false, isLast = true }) {
    const nomorInduk = [student.nis, student.nisn].filter(Boolean).join(' / ');
    const identityEntries = [
        { number: '1', label: 'Nama Murid', value: student.nama_lengkap },
        { number: '2', label: 'Nomor Induk. NISN', value: nomorInduk },
        {
            number: '3',
            label: 'Tempat, Tanggal Lahir',
            value: [student.tempat_lahir, formatLongDate(student.tanggal_lahir)].filter(Boolean).join(', '),
        },
        { number: '4', label: 'Jenis Kelamin', value: student.jenis_kelamin },
        { number: '5', label: 'Agama', value: student.agama },
        { number: '6', label: 'Status dalam keluarga', value: student.status_keluarga },
        { number: '7', label: 'Anak ke-', value: student.anak_ke },
        { number: '8', label: 'Alamat Murid', value: student.alamat_murid },
        { number: '9', label: 'Nomor telepon rumah', value: student.telepon_rumah },
        { number: '10', label: 'Sekolah Asal', value: student.sekolah_asal },
        { number: '11', label: 'Diterima di sekolah ini', value: '' },
        { label: 'Di Kelas', value: student.diterima_di_kelas, isSubentry: true },
        { label: 'Pada Tanggal', value: formatLongDate(student.tanggal_diterima), isSubentry: true },
        { number: '12', label: 'Nama Orang Tua', value: '' },
        { label: 'Ayah', value: student.nama_ayah, isSubentry: true },
        { label: 'Ibu', value: student.nama_ibu, isSubentry: true },
        { number: '13', label: 'Alamat Orang Tua', value: student.alamat_ortu },
        { number: '14', label: 'Nomor telepon rumah', value: student.telepon_ortu },
        { number: '15', label: 'Pekerjaan Orang Tua', value: '' },
        { label: 'Ayah', value: student.pekerjaan_ayah, isSubentry: true },
        { label: 'Ibu', value: student.pekerjaan_ibu, isSubentry: true },
        { number: '16', label: 'Nama Wali Murid', value: student.nama_wali },
        { number: '17', label: 'Alamat Wali Murid', value: student.alamat_wali },
        { number: '18', label: 'Nomor telepon rumah', value: student.telepon_wali },
        { number: '19', label: 'Pekerjaan Wali Murid', value: student.pekerjaan_wali },
    ];

    return (
        <article
            className={isBatch
                ? 'identity-print-document'
                : 'print-document identity-print-document hidden bg-white text-black print:block'}
            style={isBatch && !isLast ? { breakAfter: 'page', pageBreakAfter: 'always' } : undefined}
        >
            <h1 className="identity-title">IDENTITAS MURID</h1>
            <table className="report-table identity-fields">
                <tbody>
                    {identityEntries.map((entry, index) => (
                        <IdentityEntry key={`${entry.number ?? 'sub'}-${entry.label}-${index}`} {...entry} />
                    ))}
                </tbody>
            </table>
            <table className="report-table identity-footer">
                <tbody>
                    <tr>
                        <td className="identity-photo-cell">
                            <table className="report-table identity-photo">
                                <tbody>
                                    <tr>
                                        <td>
                                            {student.foto_siswa_url ? (
                                                <img src={student.foto_siswa_url} alt="Pas foto murid" />
                                            ) : (
                                                <span>Photo 3 x 4 cm</span>
                                            )}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                        <td className="identity-signature">
                            <p>{reportPlaceAndDate(settings)}</p>
                            <p>Kepala {printValue(settings.nama_sekolah) || 'Sekolah'}</p>
                            <div className="identity-signature-space" />
                            <p className="identity-signature-name">
                                {printValue(settings.kepala_sekolah) || '____________________________'}
                            </p>
                            <p>NIKY. {printValue(settings.niky_kepala_sekolah) || '—'}</p>
                        </td>
                    </tr>
                </tbody>
            </table>
        </article>
    );
}

function ReportHeaderLine({ label, value }) {
    return (
        <>
            <td className="report-header-label">{label}</td>
            <td className="report-header-colon">:</td>
            <td className="report-header-value">{printValue(value) || '—'}</td>
        </>
    );
}

function StudentHeader({ student, settings, semester }) {
    const leftFields = [
        { label: 'Nama Murid', value: student.nama_lengkap },
        { label: 'NISN', value: student.nisn },
        { label: 'Sekolah', value: settings.nama_sekolah },
        { label: 'Alamat', value: settings.alamat },
    ];
    const rightFields = [
        { label: 'Kelas', value: student.kelas },
        { label: 'Fase', value: student.fase ? `Fase ${student.fase}` : '' },
        { label: 'Semester', value: semester.semester },
        { label: 'Tahun Ajaran', value: semester.tahun_ajaran },
    ];

    return (
        <table className="report-table report-student-header">
            <colgroup>
                <col className="report-header-label-column" />
                <col className="report-header-colon-column" />
                <col className="report-header-value-column" />
                <col className="report-header-right-label-column" />
                <col className="report-header-colon-column" />
                <col className="report-header-right-value-column" />
            </colgroup>
            <tbody>
                {leftFields.map((leftField, index) => (
                    <tr key={leftField.label}>
                        <ReportHeaderLine {...leftField} />
                        <ReportHeaderLine {...rightFields[index]} />
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function SubjectTable({ groups, showColumnHeadings = false, startingNumber = 1 }) {
    let subjectNumber = startingNumber;
    const rows = [];

    groups.forEach((group) => {
        rows.push({
            key: `${group.key}-heading`,
            type: 'group',
            prefix: group.prefix,
            title: group.title,
        });

        if (group.subjects.length === 0) {
            rows.push({
                key: `${group.key}-empty`,
                type: 'empty',
            });
        }

        group.subjects.forEach((subject) => {
            rows.push({
                key: `${group.key}-${subjectNumber}`,
                type: 'subject',
                number: subjectNumber,
                subject,
            });
            subjectNumber += 1;
        });
    });

    return (
        <table className="report-table report-subject-table">
            <colgroup>
                <col className="report-col-number" />
                <col className="report-col-name" />
                <col className="report-col-score" />
                <col className="report-col-outcome" />
            </colgroup>
            {showColumnHeadings && (
                <thead>
                    <tr>
                        <th>No.</th>
                        <th>Mata Pelajaran</th>
                        <th>Nilai<br />Akhir</th>
                        <th>Capaian Kompetensi</th>
                    </tr>
                </thead>
            )}
            <tbody>
                {rows.map((row) => row.type === 'group' ? (
                    <tr className="report-group-row" key={row.key}>
                        <td className="report-group-prefix align-top">{row.prefix}</td>
                        <td className="align-top" colSpan="3">{row.title} :</td>
                    </tr>
                ) : row.type === 'empty' ? (
                    <tr className="report-empty-row" key={row.key}>
                        <td className="align-top" colSpan="4">Belum ada data nilai.</td>
                    </tr>
                ) : (
                    <tr key={row.key}>
                        <td className="report-subject-number align-top">{row.number}</td>
                        <td className="align-top">{printValue(row.subject.nama_mapel) || '—'}</td>
                        <td className="report-subject-score align-top">{formatScore(row.subject.nilai_akhir)}</td>
                        <td className={`align-top ${competencyFontClass(row.subject.capaian_kompetensi)}`}>
                            {printValue(row.subject.capaian_kompetensi) || '—'}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function KokurikulerTable({ notes }) {
    return (
        <table className="report-table report-data-table kokurikuler-table">
            <thead>
                <tr>
                    <th>KOKURIKULER</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td className={competencyFontClass(notes.kokurikuler_deskripsi)}>
                        {printValue(notes.kokurikuler_deskripsi)}
                    </td>
                </tr>
            </tbody>
        </table>
    );
}

function ExtracurricularTable({ notes }) {
    const entries = [1, 2, 3, 4]
        .map((number) => ({
            name: notes[`ekstra_${number}_nama`],
            predicate: notes[`ekstra_${number}_ket`],
        }))
        .filter((entry) => entry.name || entry.predicate);

    return (
        <table className="report-table report-data-table extracurricular-table">
            <colgroup>
                <col className="report-col-number" />
                <col className="report-col-name" />
                <col className="report-col-outcome" />
            </colgroup>
            <thead>
                <tr>
                    <th>No.</th>
                    <th>Ekstrakurikuler</th>
                    <th>Keterangan</th>
                </tr>
            </thead>
            <tbody>
                {entries.length === 0 ? (
                    <tr>
                        <td colSpan="3">Belum ada ekstrakurikuler.</td>
                    </tr>
                ) : entries.map((entry, index) => (
                    <tr key={`${entry.name}-${index}`}>
                        <td className="report-subject-number align-top">{index + 1}</td>
                        <td className="align-top">{printValue(entry.name)}</td>
                        <td className="align-top">{printValue(entry.predicate)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function AttendanceAndNotes({ notes }) {
    const attendanceRows = [
        ['Sakit', notes.sakit ?? 0],
        ['Izin', notes.izin ?? 0],
        ['Tanpa Keterangan', notes.tanpa_keterangan ?? 0],
    ];

    return (
        <table className="report-table report-attendance-notes">
            <tbody>
                <tr>
                    <td className="report-attendance-cell">
                        <table className="report-table report-data-table attendance-table">
                            <thead>
                                <tr>
                                    <th colSpan="2">Ketidakhadiran</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendanceRows.map(([label, total]) => (
                                    <tr key={label}>
                                        <td>{label}</td>
                                        <td>{printValue(total)} Hari</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </td>
                    <td className="report-teacher-notes-cell">
                        <table className="report-table report-data-table teacher-notes-table">
                            <thead>
                                <tr>
                                    <th>Catatan Wali Kelas</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>{printValue(notes.catatan_wali_kelas)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </td>
                </tr>
            </tbody>
        </table>
    );
}

function PromotionTable({ notes }) {
    const promotion = notes.status_kenaikan;

    return (
        <table className="report-table report-data-table promotion-table">
            <thead>
                <tr>
                    <th>Kenaikan Kelas</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <span className={promotion === 'tidak_naik' ? 'promotion-choice-struck' : ''}>Naik</span>
                        {' / '}
                        <span className={promotion === 'naik' ? 'promotion-choice-struck' : ''}>Tidak Naik</span>
                        {' ke kelas : '}
                        {printValue(notes.naik_ke_kelas)}
                    </td>
                </tr>
            </tbody>
        </table>
    );
}

function ParentResponseTable() {
    return (
        <table className="report-table report-data-table parent-response-table">
            <thead>
                <tr>
                    <th>Tanggapan Orang Tua/Wali</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td />
                </tr>
            </tbody>
        </table>
    );
}

function ReportSignatures({ student, settings }) {
    return (
        <table className="report-table report-signatures">
            <tbody>
                <tr>
                    <td className="report-signature-parent">
                        <p>Orang Tua/Wali,</p>
                        <div className="report-signature-space" />
                        <div className="report-signature-rule" />
                    </td>
                    <td className="report-signature-teacher">
                        <p>{reportPlaceAndDate(settings)}</p>
                        <p>Wali Kelas,</p>
                        <div className="report-signature-space" />
                        <p className="report-signature-name">{printValue(student.wali_kelas_nama) || '—'}</p>
                        <p>NIKY. {printValue(student.wali_niky) || '—'}</p>
                    </td>
                    <td className="report-signature-principal">
                        <p>Mengetahui,</p>
                        <p>Kepala Sekolah</p>
                        <div className="report-signature-space" />
                        <p className="report-signature-name">{printValue(settings.kepala_sekolah) || '—'}</p>
                        <p>NIKY. {printValue(settings.niky_kepala_sekolah) || '—'}</p>
                    </td>
                </tr>
            </tbody>
        </table>
    );
}

function SemesterPages({ student, settings, semester }) {
    const subjects = semester.mata_pelajaran ?? [];
    const groupedSubjects = {
        umum: subjects.filter((subject) => subject.kelompok_mapel === 'umum'),
        kejuruan: subjects.filter((subject) => subject.kelompok_mapel === 'kejuruan'),
        muatan_lokal: subjects.filter((subject) => subject.kelompok_mapel === 'muatan_lokal'),
    };
    const notes = semester.catatan_rapor ?? {};

    return (
        <>
            <article className="report-print-page">
                <StudentHeader student={student} settings={settings} semester={semester} />
                <SubjectTable
                    showColumnHeadings
                    groups={[
                        { key: 'umum', prefix: 'A.', title: 'Mata Pelajaran Umum', subjects: groupedSubjects.umum },
                        { key: 'kejuruan', prefix: 'B.', title: 'Mata Pelajaran Kejuruan', subjects: groupedSubjects.kejuruan },
                    ]}
                />
            </article>
            <div className="report-page-break" style={{ pageBreakAfter: 'always' }} />

            <article className="report-print-page report-print-page-continuation">
                <StudentHeader student={student} settings={settings} semester={semester} />
                <SubjectTable
                    startingNumber={groupedSubjects.umum.length + groupedSubjects.kejuruan.length + 1}
                    groups={[
                        {
                            key: 'muatan-lokal',
                            prefix: 'C.',
                            title: 'Muatan Lokal',
                            subjects: groupedSubjects.muatan_lokal,
                        },
                    ]}
                />

                <KokurikulerTable notes={notes} />
                <ExtracurricularTable notes={notes} />
                <AttendanceAndNotes notes={notes} />
                {semester.semester === 'genap' && <PromotionTable notes={notes} />}
                <ParentResponseTable />
                <ReportSignatures student={student} settings={settings} />
            </article>
        </>
    );
}

function SemesterDocument({ student, settings, semester }) {
    return (
        <div className="print-document report-print-document hidden bg-white text-black print:block">
            <SemesterPages student={student} settings={settings} semester={semester} />
        </div>
    );
}

export default function StudentReportDocument({
    mode = 'identity',
    student = {},
    settings = {},
    semester = {},
    documents = [],
}) {
    const renderDocument = (document) => mode === 'identity'
        ? <IdentityDocument student={document.student} settings={settings} />
        : <SemesterDocument student={document.student} settings={settings} semester={document.semester} />;

    if (documents.length === 0) {
        return renderDocument({ student, semester });
    }

    if (documents.length === 1) {
        return renderDocument(documents[0]);
    }

    return (
        <div className="print-document hidden bg-white text-black print:block">
            {mode === 'identity'
                ? documents.map((document, index) => (
                    <IdentityDocument
                        key={document.student.id ?? index}
                        student={document.student}
                        settings={settings}
                        isBatch
                        isLast={index === documents.length - 1}
                    />
                ))
                : documents.map((document, index) => (
                    <Fragment key={document.student.id ?? index}>
                        <SemesterPages
                            student={document.student}
                            settings={settings}
                            semester={document.semester}
                        />
                        {index < documents.length - 1 && (
                            <div className="report-page-break" style={{ pageBreakAfter: 'always' }} />
                        )}
                    </Fragment>
                ))}
        </div>
    );
}
