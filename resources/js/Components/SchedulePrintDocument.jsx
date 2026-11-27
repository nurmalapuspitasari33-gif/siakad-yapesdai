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

    return (
        <article className="print-document hidden schedule-print-document">
            <header className="border-b-2 border-black pb-4 text-center">
                <h1 className="text-xl font-bold uppercase">SMK Al Mu'allim Kesugihan</h1>
                <p className="mt-1 text-sm font-semibold">Yayasan Pengembangan Sumberdaya Insani (YAPESDAI)</p>
                <h2 className="mt-4 text-lg font-bold uppercase">Jadwal Mengajar Guru</h2>
            </header>

            <section className="mt-5 grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <p><strong>Nama Guru:</strong> {identity.nama_guru || '—'}</p>
                <p><strong>NIKY:</strong> {identity.nip || '—'}</p>
                <p><strong>Tahun Ajaran:</strong> {identity.tahun_ajaran || '—'}</p>
                <p><strong>Semester:</strong> {semester}</p>
            </section>

            <table className="mt-5 w-full border-collapse text-sm">
                <thead>
                    <tr>
                        <th className="border border-black px-2 py-2 text-center">Hari</th>
                        <th className="border border-black px-2 py-2 text-center">Jam Ke-</th>
                        <th className="border border-black px-2 py-2 text-center">Pukul</th>
                        <th className="border border-black px-2 py-2 text-left">Mata Pelajaran</th>
                        <th className="border border-black px-2 py-2 text-left">Kelas/Rombel</th>
                        <th className="border border-black px-2 py-2 text-left">Ruang</th>
                    </tr>
                </thead>
                <tbody>
                    {jadwals.length > 0 ? jadwals.map((jadwal) => (
                        <tr key={jadwal.id}>
                            <td className="border border-black px-2 py-2 text-center">{dayLabels[jadwal.hari] ?? jadwal.hari}</td>
                            <td className="border border-black px-2 py-2 text-center">{jadwal.jam_ke}</td>
                            <td className="whitespace-nowrap border border-black px-2 py-2 text-center">
                                {jadwal.jam_mulai}–{jadwal.jam_selesai}
                            </td>
                            <td className="border border-black px-2 py-2">{jadwal.mata_pelajaran || '—'}</td>
                            <td className="border border-black px-2 py-2">{jadwal.kelas || '—'}</td>
                            <td className="border border-black px-2 py-2">{jadwal.ruang || '—'}</td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="6" className="border border-black px-2 py-4 text-center">
                                Belum ada jadwal mengajar pada tahun ajaran aktif.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <p className="mt-4 text-sm">
                <strong>Total beban mengajar:</strong> {identity.total_jp ?? 0} JP per minggu
            </p>

            <section className="mt-12 grid grid-cols-2 gap-10 text-center text-sm">
                <div>
                    <p>Guru Pengampu,</p>
                    <div className="h-20" />
                    <p className="font-bold underline">{identity.nama_guru || '____________________'}</p>
                    <p>NIKY {identity.nip || '—'}</p>
                </div>
                <div>
                    <p>Kepala Sekolah,</p>
                    <div className="h-20" />
                    <p className="font-bold underline">{identity.kepala_sekolah || '____________________'}</p>
                    <p>SMK Al Mu'allim Kesugihan</p>
                </div>
            </section>
        </article>
    );
}
