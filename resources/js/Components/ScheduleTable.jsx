const dayLabels = {
    senin: 'Senin',
    selasa: 'Selasa',
    rabu: 'Rabu',
    kamis: 'Kamis',
    jumat: 'Jumat',
    sabtu: 'Sabtu',
    minggu: 'Minggu',
};

export default function ScheduleTable({
    jadwals = [],
    emptyMessage = 'Jadwal belum tersedia.',
    showClass = true,
    showGuru = false,
}) {
    if (jadwals.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center">
                <p className="font-semibold text-slate-700">Jadwal belum tersedia</p>
                <p className="mt-1 text-sm text-slate-500">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-100 text-left">
                <thead className="bg-slate-50">
                    <tr>
                        {['Hari', 'Waktu', 'Mata Pelajaran', ...(showClass ? ['Kelas'] : []), ...(showGuru ? ['Guru'] : [])].map((heading) => (
                            <th
                                key={heading}
                                className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                {heading}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                    {jadwals.map((jadwal) => (
                        <tr key={jadwal.id} className="hover:bg-slate-50/70">
                            <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold capitalize text-slate-800">
                                {dayLabels[jadwal.hari] ?? jadwal.hari}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-indigo-700">
                                {jadwal.jam_mulai} – {jadwal.jam_selesai}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-700">
                                {jadwal.mata_pelajaran}
                            </td>
                            {showClass && (
                                <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                                    {jadwal.kelas}
                                </td>
                            )}
                            {showGuru && (
                                <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                                    {jadwal.guru}
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
