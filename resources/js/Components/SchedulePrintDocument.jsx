const dayLabels = {
    senin: 'Senin',
    selasa: 'Selasa',
    rabu: 'Rabu',
    kamis: 'Kamis',
    jumat: 'Jumat',
    sabtu: 'Sabtu',
    minggu: 'Minggu',
};

export default function SchedulePrintDocument({ jadwals = [], identity = {} }) {
    const semester = identity.semester
        ? `${identity.semester.charAt(0).toUpperCase()}${identity.semester.slice(1)}`
        : '—';
    const hasAssignedRoom = jadwals.some((jadwal) => jadwal.ruang);
    const jadwalPerHari = jadwals.reduce((groups, jadwal) => {
        const currentGroup = groups[groups.length - 1];

        if (currentGroup?.hari === jadwal.hari) {
            currentGroup.jadwals.push(jadwal);
        } else {
            groups.push({ hari: jadwal.hari, jadwals: [jadwal] });
        }

        return groups;
    }, []);

    return (
        <article className="print-document hidden schedule-print-document">
            <header className="border-b-2 border-black pb-3 text-center">
                <h1 className="text-lg font-bold uppercase">SMK Al Mu'allim Kesugihan</h1>
                <p className="mt-1 text-xs font-semibold">Yayasan Pengembangan Sumberdaya Insani (YAPESDAI)</p>
                <h2 className="mt-2 text-base font-bold uppercase">Jadwal Mengajar Guru</h2>
            </header>

            <section className="schedule-print-info mt-3 grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                <p><strong>Nama Guru:</strong> {identity.nama_guru || '—'}</p>
                <p><strong>NIKY:</strong> {identity.nip || '—'}</p>
                <p><strong>Tahun Ajaran:</strong> {identity.tahun_ajaran || '—'}</p>
                <p><strong>Semester:</strong> {semester}</p>
            </section>

            <table className="schedule-print-table mt-3 w-full border-collapse text-sm">
                <colgroup>
                    <col style={{ width: hasAssignedRoom ? '12%' : '14%' }} />
                    <col style={{ width: hasAssignedRoom ? '20%' : '24%' }} />
                    <col style={{ width: hasAssignedRoom ? '31%' : '34%' }} />
                    <col style={{ width: hasAssignedRoom ? '25%' : '28%' }} />
                    {hasAssignedRoom && <col style={{ width: '12%' }} />}
                </colgroup>
                <thead>
                    <tr>
                        <th className="border border-black px-2 py-2 text-center">Hari</th>
                        <th className="border border-black px-2 py-2 text-center">Jam / Pukul</th>
                        <th className="border border-black px-2 py-2 text-left">Mata Pelajaran</th>
                        <th className="border border-black px-2 py-2 text-left">Kelas/Rombel</th>
                        {hasAssignedRoom && (
                            <th className="border border-black px-2 py-2 text-left">Ruang</th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {jadwals.length > 0 ? jadwalPerHari.map((group) => group.jadwals.map((jadwal, index) => (
                        <tr key={jadwal.id}>
                            {index === 0 && (
                                <td
                                    rowSpan={group.jadwals.length}
                                    className="border border-black px-2 py-2 text-center align-middle"
                                >
                                    {dayLabels[group.hari] ?? group.hari}
                                </td>
                            )}
                            <td className="whitespace-nowrap border border-black px-2 py-2 text-center">
                                <strong>{jadwal.jam_ke}</strong>
                                <br />
                                {jadwal.jam_mulai}–{jadwal.jam_selesai}
                            </td>
                            <td className="border border-black px-2 py-2">{jadwal.mata_pelajaran || '—'}</td>
                            <td className="border border-black px-2 py-2">{jadwal.kelas || '—'}</td>
                            {hasAssignedRoom && (
                                <td className="border border-black px-2 py-2">{jadwal.ruang || '—'}</td>
                            )}
                        </tr>
                    ))) : (
                        <tr>
                            <td colSpan={hasAssignedRoom ? 5 : 4} className="border border-black px-2 py-4 text-center">
                                Belum ada jadwal mengajar pada tahun ajaran aktif.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <p className="schedule-print-total mt-3 text-sm">
                <strong>Total beban mengajar:</strong> {identity.total_jp ?? 0} JP per minggu
            </p>

            <section className="schedule-print-signatures mt-8 grid grid-cols-2 gap-10 text-center text-sm">
                <div>
                    <p>Guru Pengampu,</p>
                    <div className="schedule-print-signature-space h-16" />
                    <p className="font-bold underline">{identity.nama_guru || '____________________'}</p>
                    <p>NIKY {identity.nip || '—'}</p>
                </div>
                <div>
                    <p>Kepala Sekolah,</p>
                    <div className="schedule-print-signature-space h-16" />
                    <p className="font-bold underline">{identity.kepala_sekolah || '____________________'}</p>
                    <p>SMK Al Mu'allim Kesugihan</p>
                </div>
            </section>
        </article>
    );
}
