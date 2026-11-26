const weekDays = [
    { key: 'senin', label: 'Senin', tone: 'border-emerald-200 bg-emerald-50 text-emerald-700', bar: 'bg-emerald-500' },
    { key: 'selasa', label: 'Selasa', tone: 'border-sky-200 bg-sky-50 text-sky-700', bar: 'bg-sky-500' },
    { key: 'rabu', label: 'Rabu', tone: 'border-violet-200 bg-violet-50 text-violet-700', bar: 'bg-violet-500' },
    { key: 'kamis', label: 'Kamis', tone: 'border-amber-200 bg-amber-50 text-amber-700', bar: 'bg-amber-500' },
    { key: 'jumat', label: 'Jumat', tone: 'border-rose-200 bg-rose-50 text-rose-700', bar: 'bg-rose-500' },
    { key: 'sabtu', label: 'Sabtu', tone: 'border-teal-200 bg-teal-50 text-teal-700', bar: 'bg-teal-500' },
];

export default function ScheduleWeekGrid({
    jadwals = [],
    renderActions = null,
    emptyMessage = 'Jadwal belum tersedia.',
}) {
    if (jadwals.length === 0) {
        return (
            <div className="px-5 py-16 text-center sm:px-7">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-7 w-7" aria-hidden="true">
                        <rect x="3" y="5" width="18" height="16" rx="2" />
                        <path d="M16 3v4M8 3v4M3 11h18" />
                    </svg>
                </div>
                <p className="mt-4 font-semibold text-slate-800">Jadwal belum tersedia</p>
                <p className="mt-1 text-sm text-slate-500">{emptyMessage}</p>
            </div>
        );
    }

    const jadwalsByDay = weekDays.map((day) => ({
        ...day,
        jadwals: jadwals.filter((jadwal) => jadwal.hari === day.key),
    }));

    return (
        <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
            {jadwalsByDay.map((day) => (
                <section
                    key={day.key}
                    aria-label={`Jadwal hari ${day.label}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                >
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <h3 className="font-bold text-slate-800">{day.label}</h3>
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${day.tone}`}>
                            {day.jadwals.length} jadwal
                        </span>
                    </div>

                    {day.jadwals.length === 0 ? (
                        <div className="flex min-h-24 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/70 px-3 text-center text-xs text-slate-400">
                            Tidak ada jadwal
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {day.jadwals.map((jadwal) => (
                                <article
                                    key={jadwal.id}
                                    className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm"
                                >
                                    <div className={`absolute inset-y-0 left-0 w-1 ${day.bar}`} />
                                    <div className="pl-2">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
                                                <circle cx="12" cy="12" r="9" />
                                                <path d="M12 7v5l3 2" />
                                            </svg>
                                            <span>{jadwal.jam_mulai} – {jadwal.jam_selesai}</span>
                                        </div>
                                        <h4 className="mt-2 font-semibold leading-snug text-slate-900">
                                            {jadwal.mata_pelajaran}
                                        </h4>
                                        {(jadwal.kelas || jadwal.guru || jadwal.ruang) && (
                                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                                                {jadwal.kelas && <span>Kelas {jadwal.kelas}</span>}
                                                {jadwal.guru && <span>Guru {jadwal.guru}</span>}
                                                {jadwal.ruang && <span>Ruang {jadwal.ruang}</span>}
                                            </div>
                                        )}
                                        {renderActions?.(jadwal)}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            ))}
        </div>
    );
}
