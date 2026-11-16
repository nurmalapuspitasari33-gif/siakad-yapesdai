import InputError from '@/Components/InputError';
import DashboardLayout from '@/Layouts/DashboardLayout';
import StudentIdentityFields, { studentIdentityDefaults } from '@/Components/StudentIdentityFields';
import roleNavigationItems from '@/Components/RoleNavigationItems';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

const statusLabels = {
    pending: 'Menunggu Seleksi',
    diterima: 'Diterima',
    ditolak: 'Ditolak',
};

const currencyFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

export default function SiswaSpmbIndex({
    siswa = {},
    pendaftaran = null,
    berkasUrl = null,
    kategoriBeasiswas = [],
    programKeahlians = [],
    fotoSiswaUrl = null,
}) {
    const { pengaturanSekolah = {} } = usePage().props;
    const form = useForm({
        ...studentIdentityDefaults(),
        ...siswa,
        program_keahlian_id: String(
            pendaftaran?.program_keahlian_id ?? siswa?.program_keahlian_id ?? '',
        ),
        konsentrasi_keahlian_id: String(
            pendaftaran?.konsentrasi_keahlian_id ?? siswa?.konsentrasi_keahlian_id ?? '',
        ),
        sekolah_asal: pendaftaran?.asal_sekolah ?? siswa?.sekolah_asal ?? '',
        no_wa_wali: siswa?.no_wa_wali ?? '',
        berkas: null,
        foto_siswa: null,
    });
    const sppBase = Number(pengaturanSekolah?.tarif_spp_reguler ?? 0);
    const practicalBase = Number(pengaturanSekolah?.tarif_praktikum ?? 0);
    const programDiscounts = {
        reguler: 0,
        santri_internal: 70,
        santri_eksternal: 30,
    };
    const programSpp = Math.round(sppBase * (100 - (programDiscounts[form.data.tipe_program] ?? 0)) / 100);
    const selectedCategory = kategoriBeasiswas.find(
        (category) => String(category.id) === String(form.data.kategori_beasiswa_id),
    );
    const estimatedSpp = selectedCategory?.is_afirmasi
        ? 0
        : selectedCategory?.jenis_potongan === 'persen'
            ? Math.max(0, Math.round(programSpp * (100 - Number(selectedCategory.nilai_potongan)) / 100))
            : Math.max(0, programSpp - Number(selectedCategory?.nilai_potongan ?? 0));
    const estimatedPractical = selectedCategory?.is_afirmasi ? 0 : practicalBase;
    const canEdit = !pendaftaran || pendaftaran.can_edit;
    const navigation = roleNavigationItems('siswa', 'spmb', { isCandidate: true });
    const selectedProgram = programKeahlians.find(
        (program) => String(program.id) === String(form.data.program_keahlian_id),
    );

    const submit = (event) => {
        event.preventDefault();
        form.post(route('siswa.spmb.store'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                form.reset('berkas');
                form.reset('foto_siswa');
            },
        });
    };

    return (
        <DashboardLayout
            title="Formulir SPMB"
            subtitle="Lengkapi biodata dan unggah berkas persyaratan untuk proses penerimaan siswa baru."
            roleLabel="Calon Siswa"
            navigation={navigation}
        >
            <Head title="Formulir SPMB" />

            <div className="flex flex-col gap-6">
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="bg-gradient-to-r from-indigo-700 to-violet-700 px-6 py-6 text-white sm:px-8">
                        <p className="text-sm font-semibold text-indigo-200">Status hasil seleksi</p>
                        <h2 className="mt-2 text-xl font-bold">
                            {pendaftaran
                                ? statusLabels[pendaftaran.status_seleksi] ?? 'Status belum tersedia'
                                : 'Pendaftaran belum dikirim'}
                        </h2>
                        {pendaftaran && (
                            <p className="mt-2 text-sm text-indigo-100">
                                Nomor pendaftaran: <span className="font-semibold">{pendaftaran.no_pendaftaran}</span>
                            </p>
                        )}
                    </div>
                    <div className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                        <p className="text-sm leading-6 text-slate-600">
                            {pendaftaran?.status_seleksi === 'diterima'
                                ? 'Selamat, pendaftaran Anda diterima. Silakan lanjutkan melalui Dasbor Siswa.'
                                : pendaftaran?.status_seleksi === 'ditolak'
                                  ? 'Hasil seleksi telah ditetapkan. Hubungi panitia sekolah untuk informasi lebih lanjut.'
                                  : 'Pastikan data dan dokumen yang diunggah sudah benar sebelum dikirim.'}
                        </p>
                        {berkasUrl && (
                            <a
                                href={berkasUrl}
                                className="shrink-0 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
                            >
                                Unduh berkas saat ini
                            </a>
                        )}
                    </div>
                </section>

                {canEdit ? (
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                        <div className="mb-6">
                            <h2 className="text-lg font-bold text-slate-900">Biodata pendaftaran</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Lengkapi identitas murid dan keluarga. Berkas persyaratan PDF/JPG maksimal 5 MB.
                            </p>
                        </div>
                        <div className="mb-6 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm leading-6 text-indigo-950">
                            <h3 className="font-bold">Informasi program dan biaya</h3>
                            <ul className="mt-1 list-inside list-disc">
                                <li>Reguler: SPP {currencyFormatter.format(sppBase)}.</li>
                                <li>Santri Internal: potongan 70%, SPP {currencyFormatter.format(Math.round(sppBase * 0.3))}.</li>
                                <li>Santri Eksternal: potongan 30%, SPP {currencyFormatter.format(Math.round(sppBase * 0.7))}.</li>
                                <li>Praktikum {currencyFormatter.format(practicalBase)} tanpa potongan program Santri.</li>
                            </ul>
                            <p className="mt-2">
                                Kategori afirmasi membebaskan SPP dan Praktikum. Tagihan khusus seperti seragam, PKL, dan kunjungan industri tetap penuh.
                                Potongan kategori non-afirmasi berlaku untuk SPP.
                            </p>
                            <p className="mt-2 font-semibold">
                                Perkiraan berdasarkan pilihan saat ini: SPP {currencyFormatter.format(estimatedSpp)} dan Praktikum {currencyFormatter.format(estimatedPractical)}.
                            </p>
                            <p className="mt-1 text-xs text-indigo-800">
                                Nilai dapat berubah mengikuti kebijakan sekolah; nominal di atas belum menghitung tagihan khusus.
                            </p>
                        </div>
                        <form onSubmit={submit} className="flex flex-col gap-5">
                            <StudentIdentityFields
                                form={form}
                                kategoriBeasiswas={kategoriBeasiswas}
                            />
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="program-keahlian-spmb" className="mb-2 block text-sm font-semibold text-slate-700">
                                        Program Keahlian
                                    </label>
                                    <select
                                        id="program-keahlian-spmb"
                                        value={form.data.program_keahlian_id}
                                        onChange={(event) => {
                                            form.setData('program_keahlian_id', event.target.value);
                                            form.setData('konsentrasi_keahlian_id', '');
                                        }}
                                        className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="">-- Pilih Program Keahlian --</option>
                                        {programKeahlians.map((program) => (
                                            <option key={program.id} value={program.id}>
                                                {program.nama_jurusan}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={form.errors.program_keahlian_id} className="mt-2" />
                                </div>
                                <div>
                                    <label htmlFor="konsentrasi-keahlian-spmb" className="mb-2 block text-sm font-semibold text-slate-700">
                                        Konsentrasi Keahlian
                                    </label>
                                    <select
                                        id="konsentrasi-keahlian-spmb"
                                        value={form.data.konsentrasi_keahlian_id}
                                        onChange={(event) => form.setData('konsentrasi_keahlian_id', event.target.value)}
                                        disabled={!selectedProgram}
                                        className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-slate-100"
                                    >
                                        <option value="">-- Pilih Konsentrasi Keahlian --</option>
                                        {(selectedProgram?.konsentrasi_keahlians ?? []).map((concentration) => (
                                            <option key={concentration.id} value={concentration.id}>
                                                {concentration.nama_konsentrasi}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={form.errors.konsentrasi_keahlian_id} className="mt-2" />
                                </div>
                            </div>
                            {fotoSiswaUrl && !form.data.foto_siswa && (
                                <div className="flex items-center gap-4">
                                    <img src={fotoSiswaUrl} alt="Pas foto siswa saat ini" className="h-24 w-20 rounded-lg border border-slate-200 object-cover" />
                                    <p className="text-sm text-slate-500">Pas foto saat ini</p>
                                </div>
                            )}
                            <div>
                                <label htmlFor="no-wa-wali" className="mb-2 block text-sm font-semibold text-slate-700">
                                    No. WhatsApp Wali
                                </label>
                                <input
                                    id="no-wa-wali"
                                    type="tel"
                                    value={form.data.no_wa_wali}
                                    onChange={(event) => form.setData('no_wa_wali', event.target.value)}
                                    className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                                <InputError message={form.errors.no_wa_wali} className="mt-2" />
                            </div>
                            <div>
                                <label htmlFor="berkas-spmb" className="mb-2 block text-sm font-semibold text-slate-700">
                                    Berkas Persyaratan
                                </label>
                                <input
                                    id="berkas-spmb"
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,application/pdf,image/jpeg"
                                    onChange={(event) => form.setData('berkas', event.target.files?.[0] ?? null)}
                                    className="block w-full rounded-xl border border-slate-300 text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
                                />
                                <InputError message={form.errors.berkas} className="mt-2" />
                            </div>
                            {form.progress && (
                                <div>
                                    <div className="mb-1 flex justify-between text-xs font-medium text-slate-600">
                                        <span>Mengunggah berkas</span>
                                        <span>{form.progress.percentage}%</span>
                                    </div>
                                    <progress
                                        value={form.progress.percentage}
                                        max="100"
                                        className="h-2 w-full overflow-hidden rounded-full accent-indigo-600"
                                    />
                                </div>
                            )}
                            <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-xs leading-5 text-slate-500">
                                    {pendaftaran?.has_berkas
                                        ? 'Pilih berkas baru hanya jika ingin mengganti unggahan sebelumnya.'
                                        : 'Berkas wajib diunggah untuk mengirim pendaftaran.'}
                                </p>
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {form.processing ? 'Menyimpan...' : 'Simpan Pendaftaran'}
                                </button>
                            </div>
                        </form>
                    </section>
                ) : (
                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <p className="text-sm leading-6 text-slate-600">
                            Biodata tidak dapat diubah setelah hasil seleksi ditetapkan.{' '}
                            {pendaftaran?.status_seleksi === 'diterima' && (
                                <Link href={route('siswa.dashboard')} className="font-semibold text-indigo-700 hover:text-indigo-900">
                                    Buka Dasbor Siswa
                                </Link>
                            )}
                        </p>
                    </section>
                )}
            </div>
        </DashboardLayout>
    );
}
