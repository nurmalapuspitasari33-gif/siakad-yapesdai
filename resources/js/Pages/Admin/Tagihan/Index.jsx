import AdminNavigationItems from '@/Components/AdminNavigationItems';
import AdminPagination from '@/Components/AdminPagination';
import { AdminResourceModal } from '@/Components/AdminResourceModal';
import InputError from '@/Components/InputError';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

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

function localDateValue() {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function normalizeWhatsAppNumber(value) {
    const number = value?.replace(/\D/g, '') ?? '';

    if (number.startsWith('0')) {
        return `62${number.slice(1)}`;
    }

    if (number.startsWith('8')) {
        return `62${number}`;
    }

    return number;
}

function createWhatsAppMessage(tagihan) {
    const amount = currencyFormatter.format(Number(tagihan.nominal));
    const namaSiswa = tagihan.siswa?.nama_lengkap ?? 'Siswa';

    return [
        `Yth. Wali dari ${namaSiswa},`,
        '',
        'Kami mengingatkan tagihan sekolah berikut:',
        `Siswa: ${namaSiswa}`,
        `Kelas: ${tagihan.siswa?.kelas?.nama_kelas ?? 'Belum ditentukan'}`,
        `Tagihan: ${tagihan.judul_tagihan}`,
        `Nominal: ${amount}`,
        `Jatuh tempo: ${formatDate(tagihan.jatuh_tempo)}`,
        '',
        'Terima kasih.',
    ].join('\n');
}

function StatusBadge({ status, kind = 'payment' }) {
    const labels = kind === 'payment'
        ? { belum_lunas: 'Belum lunas', lunas: 'Lunas' }
        : { belum_terkirim: 'Belum dikirim', terkirim: 'Terkirim' };
    const styles = status === 'lunas' || status === 'terkirim'
        ? 'bg-emerald-50 text-emerald-700'
        : 'bg-amber-50 text-amber-700';

    return (
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles}`}>
            {labels[status] ?? status}
        </span>
    );
}

export default function TagihanIndex({ tagihans, kelasOptions, filters, tarif }) {
    const [isGenerateOpen, setIsGenerateOpen] = useState(false);
    const form = useForm({
        target: 'semua',
        kelas_id: '',
        jenis_tagihan: 'spp',
        judul_tagihan: '',
        nominal: tarif.tarif_spp_reguler ?? '0.00',
        jatuh_tempo: localDateValue(),
    });
    const filterForm = useForm({ status: filters.status ?? '' });
    const paidForm = useForm({});

    const closeGenerateModal = () => {
        setIsGenerateOpen(false);
        form.reset();
        form.setData('jatuh_tempo', localDateValue());
        form.clearErrors();
    };

    const generateBills = (event) => {
        event.preventDefault();
        form.post(route('admin.tagihan.generate'), {
            preserveScroll: true,
            onSuccess: closeGenerateModal,
        });
    };

    const changeBillType = (jenisTagihan) => {
        const nominal = jenisTagihan === 'spp'
            ? tarif.tarif_spp_reguler
            : jenisTagihan === 'praktikum'
                ? tarif.tarif_praktikum
                : '';

        form.setData({
            ...form.data,
            jenis_tagihan: jenisTagihan,
            nominal,
        });
    };

    const applyFilter = (event) => {
        event.preventDefault();
        filterForm.get(route('admin.tagihan.index'), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const markPaid = (tagihan) => {
        paidForm.patch(route('admin.tagihan.mark-paid', tagihan.id), {
            preserveScroll: true,
        });
    };

    const markWhatsAppSent = (event, tagihan) => {
        if (!tagihan.siswa?.no_wa_wali) {
            event.preventDefault();
            return;
        }

        router.patch(route('admin.tagihan.mark-whatsapp-sent', tagihan.id), {}, {
            preserveScroll: true,
        });
    };

    return (
        <DashboardLayout
            title="Tagihan Sekolah"
            subtitle="Terbitkan tagihan untuk siswa aktif, pantau pembayaran, dan kirim pengingat melalui WhatsApp."
            roleLabel="Administrator"
            navigation={AdminNavigationItems('tagihan')}
        >
            <Head title="Manajemen Tagihan Sekolah" />

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-5 border-b border-slate-100 px-5 py-5 sm:px-7">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="font-bold text-slate-900">Daftar tagihan siswa</h2>
                            <p className="mt-1 text-sm text-slate-500">{tagihans.total} tagihan</p>
                            <p className="mt-1 text-xs text-slate-400">
                                Tautan WhatsApp dibuka untuk pengiriman manual; status diperbarui saat tombol Kirim WA diklik.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsGenerateOpen(true)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                        >
                            <span className="text-lg leading-none" aria-hidden="true">+</span>
                            Generate Tagihan Massal
                        </button>
                    </div>
                    <form onSubmit={applyFilter} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="w-full sm:max-w-xs">
                            <label htmlFor="status-tagihan" className="mb-1.5 block text-sm font-semibold text-slate-700">
                                Status pembayaran
                            </label>
                            <select
                                id="status-tagihan"
                                value={filterForm.data.status}
                                onChange={(event) => filterForm.setData('status', event.target.value)}
                                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value="">Semua status</option>
                                <option value="belum_lunas">Belum lunas</option>
                                <option value="lunas">Lunas</option>
                            </select>
                        </div>
                        <button
                            type="submit"
                            disabled={filterForm.processing}
                            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
                        >
                            Terapkan
                        </button>
                        {filters.status && (
                            <Link
                                href={route('admin.tagihan.index')}
                                preserveState
                                preserveScroll
                                className="rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                            >
                                Reset
                            </Link>
                        )}
                    </form>
                </div>

                <div className="w-full overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 text-left">
                        <thead className="bg-slate-50">
                            <tr>
                                {['Siswa', 'Jenis', 'Tagihan', 'Nominal', 'Jatuh Tempo', 'Pembayaran', 'WhatsApp', 'Aksi'].map((label) => (
                                    <th key={label} className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 first:sm:px-7 last:sm:px-7">
                                        {label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {tagihans.data.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-5 py-12 text-center text-sm text-slate-500">
                                        Belum ada tagihan untuk ditampilkan.
                                    </td>
                                </tr>
                            ) : tagihans.data.map((tagihan) => {
                                const siswa = tagihan.siswa;
                                const phone = normalizeWhatsAppNumber(siswa?.no_wa_wali);
                                const whatsappUrl = phone
                                    ? `https://wa.me/${phone}?text=${encodeURIComponent(createWhatsAppMessage(tagihan))}`
                                    : null;

                                return (
                                    <tr key={tagihan.id} className="hover:bg-slate-50/70">
                                        <td className="whitespace-nowrap px-4 py-4 sm:px-7">
                                            <p className="text-sm font-semibold text-slate-900">{siswa?.nama_lengkap ?? 'Data siswa tidak tersedia'}</p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {siswa?.kelas?.nama_kelas ?? 'Belum ditentukan'}
                                                {siswa?.no_wa_wali ? ` · ${siswa.no_wa_wali}` : ' · Nomor wali belum tersedia'}
                                            </p>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-xs font-semibold uppercase text-slate-500">
                                            {tagihan.jenis_tagihan?.replaceAll('_', ' ') ?? '—'}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-slate-700">{tagihan.judul_tagihan}</td>
                                        <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-slate-800">
                                            {currencyFormatter.format(Number(tagihan.nominal))}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">{formatDate(tagihan.jatuh_tempo)}</td>
                                        <td className="whitespace-nowrap px-4 py-4"><StatusBadge status={tagihan.status_bayar} /></td>
                                        <td className="whitespace-nowrap px-4 py-4">
                                            <div className="flex flex-col items-start gap-2">
                                                <StatusBadge status={tagihan.status_wa} kind="whatsapp" />
                                                {whatsappUrl ? (
                                                    <a
                                                        href={whatsappUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(event) => markWhatsAppSent(event, tagihan)}
                                                        className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                                                    >
                                                        Kirim WA
                                                    </a>
                                                ) : (
                                                    <span className="text-xs text-slate-400">Nomor tidak tersedia</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 sm:px-7">
                                            {tagihan.status_bayar === 'belum_lunas' ? (
                                                <button
                                                    type="button"
                                                    onClick={() => markPaid(tagihan)}
                                                    disabled={paidForm.processing}
                                                    className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50 disabled:opacity-50"
                                                >
                                                    Tandai Lunas
                                                </button>
                                            ) : (
                                                <span className="text-xs font-medium text-emerald-700">Selesai</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="border-t border-slate-100 px-5 py-4 sm:px-7">
                    <AdminPagination links={tagihans.links} />
                </div>
            </section>

            <AdminResourceModal
                show={isGenerateOpen}
                title="Generate Tagihan Massal"
                description="Tagihan dibuat untuk seluruh siswa aktif pada cakupan yang dipilih."
                processing={form.processing}
                submitLabel="Buat Tagihan"
                onClose={closeGenerateModal}
                onSubmit={generateBills}
            >
                <div>
                    <label htmlFor="jenis-tagihan" className="mb-2 block text-sm font-semibold text-slate-700">Jenis Tagihan</label>
                    <select
                        id="jenis-tagihan"
                        value={form.data.jenis_tagihan}
                        onChange={(event) => changeBillType(event.target.value)}
                        className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                        <option value="spp">SPP</option>
                        <option value="praktikum">Praktikum</option>
                        <option value="khusus_non_afirmasi">Khusus Non-Afirmasi (Seragam, PKL, Kunjungan Industri)</option>
                    </select>
                    <InputError message={form.errors.jenis_tagihan} className="mt-2" />
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                        {form.data.jenis_tagihan === 'spp'
                            ? 'Nominal dasar mengikuti tarif SPP Reguler; diskon program Santri dan kategori beasiswa dihitung otomatis.'
                            : form.data.jenis_tagihan === 'praktikum'
                                ? 'Nominal mengikuti tarif Praktikum. Afirmasi gratis; siswa lainnya membayar penuh.'
                                : 'Nominal penuh dibebankan kepada semua siswa tanpa potongan.'}
                    </p>
                </div>
                <div>
                    <label htmlFor="cakupan-tagihan" className="mb-2 block text-sm font-semibold text-slate-700">Cakupan siswa</label>
                    <select
                        id="cakupan-tagihan"
                        value={form.data.target}
                        onChange={(event) => form.setData({ ...form.data, target: event.target.value, kelas_id: '' })}
                        className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                        <option value="semua">Semua siswa aktif</option>
                        <option value="kelas">Pilih kelas</option>
                    </select>
                    <InputError message={form.errors.target} className="mt-2" />
                </div>
                {form.data.target === 'kelas' && (
                    <div>
                        <label htmlFor="kelas-tagihan" className="mb-2 block text-sm font-semibold text-slate-700">Kelas</label>
                        <select
                            id="kelas-tagihan"
                            value={form.data.kelas_id}
                            onChange={(event) => form.setData('kelas_id', event.target.value)}
                            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="">Pilih kelas</option>
                            {kelasOptions.map((kelas) => <option key={kelas.id} value={kelas.id}>{kelas.nama_kelas}</option>)}
                        </select>
                        <InputError message={form.errors.kelas_id} className="mt-2" />
                    </div>
                )}
                <div>
                    <label htmlFor="judul-tagihan" className="mb-2 block text-sm font-semibold text-slate-700">Judul Tagihan</label>
                    <input
                        id="judul-tagihan"
                        type="text"
                        value={form.data.judul_tagihan}
                        onChange={(event) => form.setData('judul_tagihan', event.target.value)}
                        className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <InputError message={form.errors.judul_tagihan} className="mt-2" />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="nominal-tagihan" className="mb-2 block text-sm font-semibold text-slate-700">Nominal Dasar (Rp)</label>
                        <input
                            id="nominal-tagihan"
                            type="number"
                            min="1"
                            step="1000"
                            value={form.data.nominal}
                            onChange={(event) => form.setData('nominal', event.target.value)}
                            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <InputError message={form.errors.nominal} className="mt-2" />
                    </div>
                    <div>
                        <label htmlFor="jatuh-tempo-tagihan" className="mb-2 block text-sm font-semibold text-slate-700">Jatuh Tempo</label>
                        <input
                            id="jatuh-tempo-tagihan"
                            type="date"
                            value={form.data.jatuh_tempo}
                            onChange={(event) => form.setData('jatuh_tempo', event.target.value)}
                            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <InputError message={form.errors.jatuh_tempo} className="mt-2" />
                    </div>
                </div>
            </AdminResourceModal>
        </DashboardLayout>
    );
}
