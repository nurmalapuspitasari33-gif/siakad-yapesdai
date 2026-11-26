import DashboardLayout from '@/Layouts/DashboardLayout';
import roleNavigationItems from '@/Components/RoleNavigationItems';
import { Head } from '@inertiajs/react';

const currencyFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

function formatDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.slice(0, 10))) {
        return '—';
    }

    const date = new Date(`${value.slice(0, 10)}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(date);
}

export default function SiswaTagihanIndex({
    tagihans = [],
    kategoriBeasiswa = null,
    isCandidate = false,
}) {
    return (
        <DashboardLayout
            title="Riwayat Tagihan SPP"
            subtitle="Lihat nominal, tanggal jatuh tempo, dan status pembayaran tagihan Anda."
            roleLabel="Siswa"
            navigation={roleNavigationItems('siswa', 'tagihan', { isCandidate })}
        >
            <Head title="Tagihan SPP" />

            <div className="flex flex-col gap-6">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h2 className="font-bold text-slate-900">Kategori Beasiswa</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Informasi beasiswa dan potongan biaya pendidikan Anda.
                            </p>
                        </div>
                        {kategoriBeasiswa && (
                            <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                {kategoriBeasiswa.nama_beasiswa}
                            </span>
                        )}
                    </div>

                    {kategoriBeasiswa ? (
                        <div className="mt-4 flex flex-col gap-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between">
                            <p>
                                Potongan{' '}
                                <span className="font-semibold">
                                    {kategoriBeasiswa.jenis_potongan === 'persen'
                                        ? `${Number(kategoriBeasiswa.nilai_potongan)}%`
                                        : currencyFormatter.format(Number(kategoriBeasiswa.nilai_potongan))}
                                </span>
                            </p>
                            {kategoriBeasiswa.is_afirmasi && (
                                <span className="w-fit rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                                    Program afirmasi
                                </span>
                            )}
                            {kategoriBeasiswa.keterangan && (
                                <p className="text-sm text-slate-600">{kategoriBeasiswa.keterangan}</p>
                            )}
                        </div>
                    ) : (
                        <p className="mt-4 rounded-xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
                            Belum ada kategori beasiswa yang tercatat.
                        </p>
                    )}
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                    <div className="mb-5 flex items-center justify-between gap-3">
                        <div>
                            <h2 className="font-bold text-slate-900">Riwayat tagihan dan pelunasan</h2>
                            <p className="mt-1 text-sm text-slate-500">{tagihans.length} tagihan tercatat</p>
                        </div>
                        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                            Riwayat pribadi
                        </span>
                    </div>
                    {tagihans.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center">
                            <p className="font-semibold text-slate-800">Belum ada tagihan</p>
                            <p className="mt-1 text-sm text-slate-500">Tagihan SPP Anda akan ditampilkan di halaman ini.</p>
                        </div>
                    ) : (
                        <div className="w-full overflow-x-auto rounded-xl border border-slate-200">
                            <table className="min-w-full divide-y divide-slate-100 text-left">
                                <thead className="bg-slate-50">
                                    <tr>
                                        {['Tagihan', 'Jatuh Tempo', 'Nominal', 'Status'].map((heading) => (
                                            <th key={heading} className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                {heading}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {tagihans.map((tagihan) => (
                                        <tr key={tagihan.id}>
                                            <td className="px-4 py-4 text-sm font-semibold text-slate-800">{tagihan.judul_tagihan}</td>
                                            <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">{formatDate(tagihan.jatuh_tempo)}</td>
                                            <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-slate-800">
                                                {currencyFormatter.format(Number(tagihan.nominal))}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-4">
                                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                                    tagihan.status_bayar === 'lunas'
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : 'bg-amber-50 text-amber-700'
                                                }`}>
                                                    {tagihan.status_bayar === 'lunas' ? 'Lunas' : 'Belum lunas'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </DashboardLayout>
    );
}
