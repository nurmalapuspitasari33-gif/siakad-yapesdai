import InputError from '@/Components/InputError';
import AdminNavigationItems from '@/Components/AdminNavigationItems';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function PengaturanSekolahIndex() {
    const { pengaturanSekolah = {} } = usePage().props;
    const form = useForm({
        nama_sekolah: pengaturanSekolah?.nama_sekolah ?? '',
        npsn: pengaturanSekolah?.npsn ?? '',
        alamat: pengaturanSekolah?.alamat ?? '',
        tempat_rapor: pengaturanSekolah?.tempat_rapor ?? '',
        tanggal_rapor: String(pengaturanSekolah?.tanggal_rapor ?? '').slice(0, 10),
        telepon: pengaturanSekolah?.telepon ?? '',
        email: pengaturanSekolah?.email ?? '',
        kepala_sekolah: pengaturanSekolah?.kepala_sekolah ?? '',
        niky_kepala_sekolah: pengaturanSekolah?.niky_kepala_sekolah ?? '',
        tarif_spp_reguler: pengaturanSekolah?.tarif_spp_reguler ?? '0.00',
        tarif_praktikum: pengaturanSekolah?.tarif_praktikum ?? '0.00',
        info_spmb: pengaturanSekolah?.info_spmb ?? '',
        template_kokurikuler: pengaturanSekolah?.template_kokurikuler ?? '',
        logo: null,
    });
    const [logoPreview, setLogoPreview] = useState(pengaturanSekolah?.logo_url ?? null);

    useEffect(() => {
        if (!form.data.logo) {
            setLogoPreview(pengaturanSekolah?.logo_url ?? null);

            return undefined;
        }

        const previewUrl = URL.createObjectURL(form.data.logo);
        setLogoPreview(previewUrl);

        return () => URL.revokeObjectURL(previewUrl);
    }, [form.data.logo, pengaturanSekolah?.logo_url]);

    const submit = (event) => {
        event.preventDefault();
        form.transform((data) => ({ ...data, _method: 'put' }));
        form.post(route('admin.pengaturan.update'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => form.reset('logo'),
        });
    };

    return (
        <DashboardLayout
            title="Pengaturan Sekolah"
            subtitle="Kelola identitas sekolah yang ditampilkan pada portal publik dan rapor."
            roleLabel="Administrator"
            navigation={AdminNavigationItems('pengaturan')}
        >
            <Head title="Pengaturan Sekolah" />

            <form onSubmit={submit} className="flex flex-col gap-6">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-slate-900">Identitas sekolah</h2>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                            Informasi ini digunakan bersama pada landing page, dasbor, dan dokumen rapor.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div className="md:col-span-2">
                            <label htmlFor="nama-sekolah" className="mb-2 block text-sm font-semibold text-slate-700">
                                Nama Sekolah
                            </label>
                            <input
                                id="nama-sekolah"
                                type="text"
                                value={form.data.nama_sekolah}
                                onChange={(event) => form.setData('nama_sekolah', event.target.value)}
                                required
                                maxLength="255"
                                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            <InputError message={form.errors.nama_sekolah} className="mt-2" />
                        </div>

                        <div>
                            <label htmlFor="npsn" className="mb-2 block text-sm font-semibold text-slate-700">
                                NPSN
                            </label>
                            <input
                                id="npsn"
                                type="text"
                                value={form.data.npsn}
                                onChange={(event) => form.setData('npsn', event.target.value)}
                                maxLength="20"
                                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            <InputError message={form.errors.npsn} className="mt-2" />
                        </div>

                        <div>
                            <label htmlFor="telepon-sekolah" className="mb-2 block text-sm font-semibold text-slate-700">
                                Telepon Sekolah
                            </label>
                            <input
                                id="telepon-sekolah"
                                type="tel"
                                value={form.data.telepon}
                                onChange={(event) => form.setData('telepon', event.target.value)}
                                maxLength="30"
                                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            <InputError message={form.errors.telepon} className="mt-2" />
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="alamat-sekolah" className="mb-2 block text-sm font-semibold text-slate-700">
                                Alamat Sekolah
                            </label>
                            <textarea
                                id="alamat-sekolah"
                                rows="3"
                                value={form.data.alamat}
                                onChange={(event) => form.setData('alamat', event.target.value)}
                                maxLength="2000"
                                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            <InputError message={form.errors.alamat} className="mt-2" />
                        </div>

                        <div>
                            <label htmlFor="email-sekolah" className="mb-2 block text-sm font-semibold text-slate-700">
                                Email Sekolah
                            </label>
                            <input
                                id="email-sekolah"
                                type="email"
                                value={form.data.email}
                                onChange={(event) => form.setData('email', event.target.value)}
                                maxLength="255"
                                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            <InputError message={form.errors.email} className="mt-2" />
                        </div>

                        <div>
                            <label htmlFor="kepala-sekolah" className="mb-2 block text-sm font-semibold text-slate-700">
                                Kepala Sekolah
                            </label>
                            <input
                                id="kepala-sekolah"
                                type="text"
                                value={form.data.kepala_sekolah}
                                onChange={(event) => form.setData('kepala_sekolah', event.target.value)}
                                maxLength="255"
                                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            <InputError message={form.errors.kepala_sekolah} className="mt-2" />
                        </div>

                        <div>
                            <label htmlFor="niky-kepala-sekolah" className="mb-2 block text-sm font-semibold text-slate-700">
                                NIKY Kepala Sekolah
                            </label>
                            <input
                                id="niky-kepala-sekolah"
                                type="text"
                                value={form.data.niky_kepala_sekolah}
                                onChange={(event) => form.setData('niky_kepala_sekolah', event.target.value)}
                                maxLength="50"
                                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            <InputError message={form.errors.niky_kepala_sekolah} className="mt-2" />
                        </div>

                        <div>
                            <label htmlFor="tempat-rapor" className="mb-2 block text-sm font-semibold text-slate-700">
                                Tempat Rapor
                            </label>
                            <input
                                id="tempat-rapor"
                                type="text"
                                value={form.data.tempat_rapor}
                                onChange={(event) => form.setData('tempat_rapor', event.target.value)}
                                maxLength="100"
                                placeholder="Contoh: Kesugihan"
                                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            <InputError message={form.errors.tempat_rapor} className="mt-2" />
                        </div>

                        <div>
                            <label htmlFor="tanggal-rapor" className="mb-2 block text-sm font-semibold text-slate-700">
                                Tanggal Rapor
                            </label>
                            <input
                                id="tanggal-rapor"
                                type="date"
                                value={form.data.tanggal_rapor}
                                onChange={(event) => form.setData('tanggal_rapor', event.target.value)}
                                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            <InputError message={form.errors.tanggal_rapor} className="mt-2" />
                        </div>

                        <div>
                            <label htmlFor="tarif-spp-reguler" className="mb-2 block text-sm font-semibold text-slate-700">
                                Tarif Dasar SPP Reguler (Rp)
                            </label>
                            <input
                                id="tarif-spp-reguler"
                                type="number"
                                min="0"
                                step="1000"
                                value={form.data.tarif_spp_reguler}
                                onChange={(event) => form.setData('tarif_spp_reguler', event.target.value)}
                                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            <InputError message={form.errors.tarif_spp_reguler} className="mt-2" />
                        </div>

                        <div>
                            <label htmlFor="tarif-praktikum" className="mb-2 block text-sm font-semibold text-slate-700">
                                Tarif Praktikum (Rp)
                            </label>
                            <input
                                id="tarif-praktikum"
                                type="number"
                                min="0"
                                step="1000"
                                value={form.data.tarif_praktikum}
                                onChange={(event) => form.setData('tarif_praktikum', event.target.value)}
                                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            <InputError message={form.errors.tarif_praktikum} className="mt-2" />
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="logo-sekolah" className="mb-2 block text-sm font-semibold text-slate-700">
                                Logo Sekolah
                            </label>
                            <div className="flex flex-col gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 sm:flex-row sm:items-center">
                                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="Pratinjau logo sekolah" className="h-full w-full object-contain p-2" />
                                    ) : (
                                        <span className="text-xs font-medium text-slate-400">Belum ada logo</span>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <input
                                        id="logo-sekolah"
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                                        onChange={(event) => form.setData('logo', event.target.files?.[0] ?? null)}
                                        className="block w-full rounded-lg border border-slate-300 bg-white text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
                                    />
                                    <p className="mt-2 text-xs text-slate-500">Format JPG, PNG, atau WEBP. Ukuran maksimal 2 MB.</p>
                                    <InputError message={form.errors.logo} className="mt-2" />
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="info-spmb" className="mb-2 block text-sm font-semibold text-slate-700">
                                Informasi SPMB
                            </label>
                            <textarea
                                id="info-spmb"
                                rows="4"
                                value={form.data.info_spmb}
                                onChange={(event) => form.setData('info_spmb', event.target.value)}
                                maxLength="5000"
                                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            <p className="mt-2 text-xs text-slate-500">Informasi ini akan ditampilkan pada bagian pendaftaran di landing page.</p>
                            <InputError message={form.errors.info_spmb} className="mt-2" />
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="template-kokurikuler" className="mb-2 block text-sm font-semibold text-slate-700">
                                Templat Deskripsi Kokurikuler
                            </label>
                            <textarea
                                id="template-kokurikuler"
                                rows="5"
                                value={form.data.template_kokurikuler}
                                onChange={(event) => form.setData('template_kokurikuler', event.target.value)}
                                maxLength="5000"
                                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            <p className="mt-2 text-xs text-slate-500">
                                Gunakan placeholder {'{predikat}'} untuk mengisi predikat yang dipilih Wali Kelas.
                            </p>
                            <InputError message={form.errors.template_kokurikuler} className="mt-2" />
                        </div>
                    </div>

                    <div className="mt-7 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs leading-5 text-slate-500">
                            Perubahan identitas akan langsung digunakan oleh halaman publik dan cetak rapor.
                        </p>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {form.processing ? 'Menyimpan...' : 'Simpan Pengaturan'}
                        </button>
                    </div>
                </section>
            </form>

        </DashboardLayout>
    );
}
