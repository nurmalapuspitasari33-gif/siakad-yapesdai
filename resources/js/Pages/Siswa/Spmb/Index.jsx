import InputError from '@/Components/InputError';
import DashboardLayout from '@/Layouts/DashboardLayout';
import StudentIdentityFields, { studentIdentityDefaults } from '@/Components/StudentIdentityFields';
import roleNavigationItems from '@/Components/RoleNavigationItems';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

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

const maxPhotoBytes = 5 * 1024 * 1024;
const maxPhotoCount = 20;

async function compressPhoto(file) {
    const image = await createImageBitmap(file);
    const scale = Math.min(1, 1800 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    image.close();

    for (const quality of [0.84, 0.72, 0.6]) {
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));

        if (blob && blob.size <= maxPhotoBytes) {
            const name = file.name.replace(/\.[^.]+$/, '').slice(0, 100) || 'berkas-spmb';

            return new File([blob], `${name}.jpg`, { type: 'image/jpeg' });
        }
    }

    throw new Error(`${file.name}: ukuran foto tetap lebih dari 5 MB setelah dikompresi.`);
}

export default function SiswaSpmbIndex({
    nik = '',
    siswa = {},
    pendaftaran = null,
    berkasUrl = null,
    kategoriBeasiswas = [],
    programKeahlians = [],
    fotoSiswaUrl = null,
    uploadedDocuments = [],
    documentCount = 0,
}) {
    const { pengaturanSekolah = {} } = usePage().props;
    const form = useForm({
        nik,
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
        foto_berkas: [],
        foto_keterangan: [],
        foto_siswa: null,
    });
    const [queuedPhotos, setQueuedPhotos] = useState([]);
    const [photoProcessing, setPhotoProcessing] = useState(false);
    const [photoError, setPhotoError] = useState('');
    const queuedPhotoUrls = useRef([]);
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

    useEffect(() => {
        queuedPhotoUrls.current = queuedPhotos.map((photo) => photo.preview);
    }, [queuedPhotos]);

    useEffect(() => () => {
        queuedPhotoUrls.current.forEach((url) => URL.revokeObjectURL(url));
    }, []);

    const selectPhotos = async (event) => {
        const files = Array.from(event.target.files ?? []);
        event.target.value = '';
        setPhotoError('');

        if (documentCount + queuedPhotos.length + files.length > maxPhotoCount) {
            setPhotoError(`Maksimal ${maxPhotoCount} foto dapat diunggah untuk satu pendaftaran.`);

            return;
        }

        setPhotoProcessing(true);

        try {
            const compressedPhotos = await Promise.all(files.map(async (file) => ({
                file: await compressPhoto(file),
                caption: file.name,
            })));
            const preparedPhotos = compressedPhotos.map((photo) => ({
                ...photo,
                preview: URL.createObjectURL(photo.file),
            }));
            const nextPhotos = [...queuedPhotos, ...preparedPhotos];

            setQueuedPhotos(nextPhotos);
            form.setData({
                ...form.data,
                foto_berkas: nextPhotos.map((photo) => photo.file),
                foto_keterangan: nextPhotos.map((photo) => photo.caption),
            });
        } catch (error) {
            setPhotoError(error.message || 'Foto tidak dapat dikompresi. Pilih berkas gambar lain.');
        } finally {
            setPhotoProcessing(false);
        }
    };

    const removeQueuedPhoto = (index) => {
        const removedPhoto = queuedPhotos[index];
        URL.revokeObjectURL(removedPhoto.preview);
        const nextPhotos = queuedPhotos.filter((_, photoIndex) => photoIndex !== index);

        setQueuedPhotos(nextPhotos);
        form.setData({
            ...form.data,
            foto_berkas: nextPhotos.map((photo) => photo.file),
            foto_keterangan: nextPhotos.map((photo) => photo.caption),
        });
    };

    const updatePhotoCaption = (index, caption) => {
        const nextPhotos = queuedPhotos.map((photo, photoIndex) => (
            photoIndex === index ? { ...photo, caption } : photo
        ));

        setQueuedPhotos(nextPhotos);
        form.setData({
            ...form.data,
            foto_berkas: nextPhotos.map((photo) => photo.file),
            foto_keterangan: nextPhotos.map((photo) => photo.caption),
        });
    };

    const submit = (event) => {
        event.preventDefault();
        form.post(route('siswa.spmb.store'), {
            preserveScroll: true,
            onSuccess: () => {
                queuedPhotos.forEach((photo) => URL.revokeObjectURL(photo.preview));
                setQueuedPhotos([]);
                form.reset('foto_berkas', 'foto_keterangan');
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
                    <div className="bg-gradient-to-r from-brand-navy to-brand-blue px-6 py-6 text-white sm:px-8">
                        <p className="text-sm font-semibold text-brand-gold">Status hasil seleksi</p>
                        <h2 className="mt-2 text-xl font-bold">
                            {pendaftaran
                                ? statusLabels[pendaftaran.status_seleksi] ?? 'Status belum tersedia'
                                : 'Pendaftaran belum dikirim'}
                        </h2>
                        {pendaftaran && (
                            <p className="mt-2 text-sm text-white/85">
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
                        <div className="flex flex-wrap gap-2">
                            {pendaftaran && (
                                <Link
                                    href={route('siswa.spmb.cetak')}
                                    className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-navy"
                                >
                                    Cetak Formulir Pendaftaran
                                </Link>
                            )}
                            {berkasUrl && (
                                <a
                                    href={berkasUrl}
                                    className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
                                >
                                    Unduh berkas lama
                                </a>
                            )}
                        </div>
                    </div>
                </section>

                {canEdit ? (
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                        <div className="mb-6">
                            <h2 className="text-lg font-bold text-slate-900">Biodata pendaftaran</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Lengkapi identitas murid dan keluarga, lalu unggah foto persyaratan yang jelas.
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
                            <div>
                                <label htmlFor="nik-spmb" className="mb-2 block text-sm font-semibold text-slate-700">
                                    NIK sesuai Kartu Keluarga (16 digit)
                                </label>
                                <input
                                    id="nik-spmb"
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="off"
                                    maxLength={16}
                                    required
                                    value={form.data.nik}
                                    onChange={(event) => form.setData('nik', event.target.value)}
                                    aria-invalid={Boolean(form.errors.nik)}
                                    aria-describedby={form.errors.nik ? 'nik-spmb-error' : undefined}
                                    className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    placeholder="Masukkan 16 digit NIK"
                                />
                                <InputError id="nik-spmb-error" message={form.errors.nik} className="mt-2" />
                                <p className="mt-1 text-xs text-slate-500">
                                    NIK disimpan pada akun Anda dan tidak disalin ke biodata siswa atau data pendaftaran.
                                </p>
                            </div>
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
                                <label htmlFor="foto-siswa-spmb" className="mb-2 block text-sm font-semibold text-slate-700">
                                    Pas Foto Calon Siswa 3×4 (Opsional)
                                </label>
                                <input
                                    id="foto-siswa-spmb"
                                    type="file"
                                    accept="image/jpeg,image/png"
                                    onChange={(event) => form.setData('foto_siswa', event.target.files?.[0] ?? null)}
                                    className="block w-full rounded-xl border border-slate-300 text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700"
                                />
                                <InputError message={form.errors.foto_siswa} className="mt-2" />
                            </div>
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
                            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900">
                                            Dokumentasi &amp; Berkas Persyaratan Foto
                                        </h3>
                                        <p className="mt-1 text-xs leading-5 text-slate-600">
                                            Maksimal 20 foto, 5 MB per foto. Foto akan dikompresi otomatis sebelum diunggah.
                                        </p>
                                    </div>
                                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-brand-blue ring-1 ring-slate-200">
                                        {documentCount + queuedPhotos.length}/{maxPhotoCount} foto
                                    </span>
                                </div>

                                {uploadedDocuments.length > 0 && (
                                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                                        {uploadedDocuments.map((document) => (
                                            <article key={document.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                                                <img src={document.url} alt={document.caption || 'Foto berkas persyaratan'} className="h-28 w-full object-cover" />
                                                <div className="flex items-center justify-between gap-2 p-2">
                                                    <p className="min-w-0 truncate text-xs font-medium text-slate-700">
                                                        {document.caption || 'Berkas persyaratan'}
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (window.confirm('Hapus foto berkas ini?')) {
                                                                router.delete(route('siswa.spmb.berkas.destroy', document.id), {
                                                                    preserveScroll: true,
                                                                });
                                                            }
                                                        }}
                                                        className="shrink-0 text-xs font-bold text-rose-700 hover:text-rose-900"
                                                    >
                                                        Hapus
                                                    </button>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                )}

                                <label htmlFor="foto-berkas-spmb" className="mt-4 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-brand-blue bg-white px-4 py-2 text-sm font-semibold text-brand-blue transition hover:bg-blue-50">
                                    {photoProcessing ? 'Mengompresi foto…' : 'Pilih Foto Persyaratan'}
                                    <input
                                        id="foto-berkas-spmb"
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        multiple
                                        disabled={photoProcessing || documentCount + queuedPhotos.length >= maxPhotoCount}
                                        onChange={selectPhotos}
                                        className="sr-only"
                                    />
                                </label>

                                {queuedPhotos.length > 0 && (
                                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                                        {queuedPhotos.map((photo, index) => (
                                            <article key={photo.preview} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                                                <img src={photo.preview} alt={`Pratinjau foto ${index + 1}`} className="h-28 w-full object-cover" />
                                                <div className="flex flex-col gap-2 p-2">
                                                    <input
                                                        type="text"
                                                        value={photo.caption}
                                                        maxLength={255}
                                                        onChange={(event) => updatePhotoCaption(index, event.target.value)}
                                                        aria-label={`Keterangan foto ${index + 1}`}
                                                        placeholder="Keterangan berkas"
                                                        className="w-full rounded-lg border-slate-300 text-xs"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeQueuedPhoto(index)}
                                                        className="self-start text-xs font-bold text-rose-700 hover:text-rose-900"
                                                    >
                                                        Hapus foto
                                                    </button>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                )}

                                {(photoError || form.errors.foto_berkas || form.errors['foto_berkas.0']) && (
                                    <p role="alert" className="mt-3 text-sm font-medium text-rose-700">
                                        {photoError || form.errors.foto_berkas || form.errors['foto_berkas.0']}
                                    </p>
                                )}
                            </section>
                            {form.progress && (
                                <div>
                                    <div className="mb-1 flex justify-between text-xs font-medium text-slate-600">
                                        <span>Mengunggah berkas dan menyimpan biodata</span>
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
                                        ? 'Foto baru akan ditambahkan tanpa mengganti foto yang sudah tersimpan.'
                                        : 'Unggah minimal satu foto berkas sebelum mengirim pendaftaran.'}
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
