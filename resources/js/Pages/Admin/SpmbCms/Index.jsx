import AdminNavigationItems from '@/Components/AdminNavigationItems';
import InputError from '@/Components/InputError';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

const tabs = [
    { id: 'gelombang', label: 'Gelombang Pendaftaran' },
    { id: 'banner', label: 'Hero Slider & Gambar' },
    { id: 'konten', label: 'Jalur, Persyaratan & Kontak' },
];

const emptyWave = {
    nama_gelombang: '',
    tahun_ajaran: '',
    tanggal_mulai: '',
    tanggal_selesai: '',
    kuota: '',
    keterangan: '',
};

const emptyBanner = {
    kicker: '',
    judul: '',
    subjudul: '',
    gambar: null,
    cta_label: 'Daftar Sekarang',
    cta_url: '/register',
    urutan: 0,
    is_active: true,
};

const emptyContents = {
    jalur_seleksi: [],
    persyaratan: [],
    alur: [],
    kontak: {
        nomor_whatsapp: '',
        nomor_telepon: '',
        email: '',
        alamat: '',
    },
};

function Field({ id, label, error, children }) {
    return (
        <div>
            <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</label>
            {children}
            <InputError message={error} className="mt-1.5" />
        </div>
    );
}

function TextInput({ id, value, onChange, type = 'text', ...props }) {
    return (
        <input
            id={id}
            type={type}
            value={value ?? ''}
            onChange={(event) => onChange(event.target.value)}
            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            {...props}
        />
    );
}

function TextArea({ id, value, onChange, rows = 3 }) {
    return (
        <textarea
            id={id}
            rows={rows}
            value={value ?? ''}
            onChange={(event) => onChange(event.target.value)}
            className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
    );
}

export default function SpmbCmsIndex({ gelombangs = [], banners = [], contents = {} }) {
    const [activeTab, setActiveTab] = useState('gelombang');
    const [editingWave, setEditingWave] = useState(null);
    const [editingBanner, setEditingBanner] = useState(null);
    const [isBannerSubmitting, setIsBannerSubmitting] = useState(false);
    const waveForm = useForm(emptyWave);
    const bannerForm = useForm(emptyBanner);
    const contentsForm = useForm({
        ...emptyContents,
        ...contents,
        kontak: { ...emptyContents.kontak, ...(contents.kontak ?? {}) },
    });
    const waveAction = useForm({});
    const bannerAction = useForm({});

    const openWaveForm = (wave = null) => {
        setEditingWave(wave);
        waveForm.clearErrors();
        waveForm.setData(wave ? {
            nama_gelombang: wave.nama_gelombang,
            tahun_ajaran: wave.tahun_ajaran,
            tanggal_mulai: wave.tanggal_mulai,
            tanggal_selesai: wave.tanggal_selesai,
            kuota: wave.kuota,
            keterangan: wave.keterangan ?? '',
        } : emptyWave);
    };

    const submitWave = (event) => {
        event.preventDefault();
        const options = { preserveScroll: true, onSuccess: () => openWaveForm() };

        if (editingWave) {
            waveForm.put(route('admin.spmb-cms.gelombang.update', editingWave.id), options);
        } else {
            waveForm.post(route('admin.spmb-cms.gelombang.store'), options);
        }
    };

    const openBannerForm = (banner = null) => {
        setEditingBanner(banner);
        bannerForm.clearErrors();
        bannerForm.setData(banner ? {
            kicker: banner.kicker,
            judul: banner.judul,
            subjudul: banner.subjudul,
            gambar: null,
            cta_label: banner.cta_label,
            cta_url: banner.cta_url,
            urutan: banner.urutan,
            is_active: banner.is_active,
        } : emptyBanner);
    };

    const submitBanner = (event) => {
        event.preventDefault();
        const isEditing = Boolean(editingBanner);
        const submitUrl = isEditing
            ? route('admin.spmb-cms.banner.update', editingBanner.id)
            : route('admin.spmb-cms.banner.store');

        bannerForm.clearErrors();
        router.post(
            submitUrl,
            {
                ...bannerForm.data,
                is_active: bannerForm.data.is_active ? '1' : '0',
                ...(isEditing ? { _method: 'put' } : {}),
            },
            {
                preserveScroll: true,
                forceFormData: true,
                onStart: () => setIsBannerSubmitting(true),
                onError: (errors) => bannerForm.setError(errors),
                onSuccess: () => openBannerForm(),
                onFinish: () => setIsBannerSubmitting(false),
            },
        );
    };

    const updateContentRow = (section, index, field, value) => {
        const nextRows = [...contentsForm.data[section]];
        nextRows[index] = { ...nextRows[index], [field]: value };
        contentsForm.setData(section, nextRows);
    };

    const addContentRow = (section, row) => {
        contentsForm.setData(section, [...contentsForm.data[section], row]);
    };

    const removeContentRow = (section, index) => {
        contentsForm.setData(
            section,
            contentsForm.data[section].filter((_, rowIndex) => rowIndex !== index),
        );
    };

    const updateWaveStatus = (wave, action) => {
        const routeName = action === 'activate'
            ? 'admin.spmb-cms.gelombang.activate'
            : action === 'close'
                ? 'admin.spmb-cms.gelombang.close'
                : 'admin.spmb-cms.gelombang.destroy';
        const method = action === 'destroy' ? 'delete' : 'patch';

        if (action === 'destroy' && !window.confirm(`Hapus gelombang "${wave.nama_gelombang}"?`)) {
            return;
        }

        waveAction[method](route(routeName, wave.id), { preserveScroll: true });
    };

    const deleteBanner = (banner) => {
        if (!window.confirm(`Hapus slide "${banner.judul}"? Gambar yang tersimpan juga akan dihapus.`)) {
            return;
        }

        bannerAction.delete(route('admin.spmb-cms.banner.destroy', banner.id), { preserveScroll: true });
    };

    return (
        <DashboardLayout
            title="Gelombang & Konten SPMB"
            subtitle="Kelola periode penerimaan dan seluruh informasi yang ditampilkan di Portal SPMB."
            roleLabel="Administrator"
            navigation={AdminNavigationItems('spmb-cms')}
        >
            <Head title="Gelombang & Konten SPMB" />

            <div className="flex flex-col gap-6">
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex min-w-0 gap-2 overflow-x-auto overscroll-x-contain border-b border-slate-200 px-4 pt-3 no-scrollbar sm:px-6">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                aria-pressed={activeTab === tab.id}
                                className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold transition ${
                                    activeTab === tab.id
                                        ? 'border-indigo-600 text-indigo-700'
                                        : 'border-transparent text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'gelombang' && (
                        <div className="grid gap-6 p-5 lg:grid-cols-[minmax(280px,0.8fr)_1.2fr] sm:p-7">
                            <form onSubmit={submitWave} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                                <div>
                                    <h2 className="font-bold text-slate-900">{editingWave ? 'Ubah Gelombang' : 'Tambah Gelombang'}</h2>
                                    <p className="mt-1 text-xs leading-5 text-slate-600">Periode aktif akan mengaitkan pendaftar baru secara otomatis.</p>
                                </div>
                                <Field id="wave-name" label="Nama Gelombang" error={waveForm.errors.nama_gelombang}>
                                    <TextInput id="wave-name" value={waveForm.data.nama_gelombang} onChange={(value) => waveForm.setData('nama_gelombang', value)} />
                                </Field>
                                <Field id="wave-year" label="Tahun Ajaran" error={waveForm.errors.tahun_ajaran}>
                                    <TextInput id="wave-year" placeholder="2026/2027" value={waveForm.data.tahun_ajaran} onChange={(value) => waveForm.setData('tahun_ajaran', value)} />
                                </Field>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field id="wave-start" label="Tanggal Mulai" error={waveForm.errors.tanggal_mulai}>
                                        <TextInput id="wave-start" type="date" value={waveForm.data.tanggal_mulai} onChange={(value) => waveForm.setData('tanggal_mulai', value)} />
                                    </Field>
                                    <Field id="wave-end" label="Tanggal Selesai" error={waveForm.errors.tanggal_selesai}>
                                        <TextInput id="wave-end" type="date" value={waveForm.data.tanggal_selesai} onChange={(value) => waveForm.setData('tanggal_selesai', value)} />
                                    </Field>
                                </div>
                                <Field id="wave-quota" label="Kuota" error={waveForm.errors.kuota}>
                                    <TextInput id="wave-quota" type="number" min="1" value={waveForm.data.kuota} onChange={(value) => waveForm.setData('kuota', value)} />
                                </Field>
                                <Field id="wave-note" label="Keterangan" error={waveForm.errors.keterangan}>
                                    <TextArea id="wave-note" value={waveForm.data.keterangan} onChange={(value) => waveForm.setData('keterangan', value)} />
                                </Field>
                                <div className="flex flex-wrap gap-2">
                                    <button type="submit" disabled={waveForm.processing} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                                        {waveForm.processing ? 'Menyimpan…' : editingWave ? 'Simpan Perubahan' : 'Tambah Gelombang'}
                                    </button>
                                    {editingWave && (
                                        <button type="button" onClick={() => openWaveForm()} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">
                                            Batal
                                        </button>
                                    )}
                                </div>
                            </form>

                            <div>
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <div>
                                        <h2 className="font-bold text-slate-900">Gelombang Pendaftaran</h2>
                                        <p className="mt-1 text-sm text-slate-600">{gelombangs.length} gelombang terdaftar</p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3">
                                    {gelombangs.map((wave) => (
                                        <article key={wave.id} className="rounded-2xl border border-slate-200 p-4">
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h3 className="font-bold text-slate-900">{wave.nama_gelombang}</h3>
                                                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${wave.is_active ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                                                            {wave.is_active ? 'Aktif' : 'Ditutup'}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 text-sm text-slate-600">Tahun ajaran {wave.tahun_ajaran} · Kuota {wave.kuota}</p>
                                                    <p className="mt-1 text-xs text-slate-500">{wave.tanggal_mulai} – {wave.tanggal_selesai}</p>
                                                    <p className="mt-2 text-xs font-semibold text-slate-700">{wave.pendaftaran_spmbs_count} pendaftar terkait</p>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    <button type="button" onClick={() => openWaveForm(wave)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700">Edit</button>
                                                    {wave.is_active ? (
                                                        <button type="button" onClick={() => updateWaveStatus(wave, 'close')} className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-800">Tutup</button>
                                                    ) : (
                                                        <button type="button" onClick={() => updateWaveStatus(wave, 'activate')} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white">Aktifkan</button>
                                                    )}
                                                    <button type="button" onClick={() => updateWaveStatus(wave, 'destroy')} className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700">Hapus</button>
                                                </div>
                                            </div>
                                            {wave.keterangan && <p className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-600">{wave.keterangan}</p>}
                                        </article>
                                    ))}
                                    {gelombangs.length === 0 && (
                                        <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-600">Belum ada gelombang. Tambahkan gelombang untuk menyiapkan periode penerimaan.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'banner' && (
                        <div className="grid gap-6 p-5 lg:grid-cols-[minmax(300px,0.9fr)_1.1fr] sm:p-7">
                            <form onSubmit={submitBanner} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                                <div>
                                    <h2 className="font-bold text-slate-900">{editingBanner ? 'Edit Slide Hero' : 'Tambah Slide Hero'}</h2>
                                    <p className="mt-1 text-xs leading-5 text-slate-600">Gambar JPG, PNG, atau WebP maksimal 5 MB. Kosongkan gambar untuk tampilan gradien.</p>
                                </div>
                                <Field id="banner-kicker" label="Kicker" error={bannerForm.errors.kicker}>
                                    <TextInput id="banner-kicker" value={bannerForm.data.kicker} onChange={(value) => bannerForm.setData('kicker', value)} />
                                </Field>
                                <Field id="banner-title" label="Judul" error={bannerForm.errors.judul}>
                                    <TextInput id="banner-title" value={bannerForm.data.judul} onChange={(value) => bannerForm.setData('judul', value)} />
                                </Field>
                                <Field id="banner-subtitle" label="Subjudul" error={bannerForm.errors.subjudul}>
                                    <TextArea id="banner-subtitle" value={bannerForm.data.subjudul} onChange={(value) => bannerForm.setData('subjudul', value)} />
                                </Field>
                                {editingBanner?.gambar_url && (
                                    <img src={editingBanner.gambar_url} alt="Gambar banner saat ini" className="h-36 w-full rounded-xl object-cover" />
                                )}
                                <Field id="banner-image" label={editingBanner ? 'Ganti Gambar (opsional)' : 'Gambar (opsional)'} error={bannerForm.errors.gambar ?? bannerForm.errors.image}>
                                    <input
                                        id="banner-image"
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={(event) => bannerForm.setData('gambar', event.target.files?.[0] ?? null)}
                                        className="block w-full rounded-xl border border-slate-300 bg-white text-sm text-slate-700 file:mr-3 file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-semibold file:text-brand-blue"
                                    />
                                </Field>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field id="banner-cta" label="Label Tombol" error={bannerForm.errors.cta_label}>
                                        <TextInput id="banner-cta" value={bannerForm.data.cta_label} onChange={(value) => bannerForm.setData('cta_label', value)} />
                                    </Field>
                                    <Field id="banner-url" label="URL Internal" error={bannerForm.errors.cta_url}>
                                        <TextInput id="banner-url" value={bannerForm.data.cta_url} onChange={(value) => bannerForm.setData('cta_url', value)} />
                                    </Field>
                                </div>
                                <div className="grid items-end gap-4 sm:grid-cols-2">
                                    <Field id="banner-order" label="Urutan" error={bannerForm.errors.urutan}>
                                        <TextInput id="banner-order" type="number" min="0" value={bannerForm.data.urutan} onChange={(value) => bannerForm.setData('urutan', value)} />
                                    </Field>
                                    <label className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-slate-700">
                                        <input type="checkbox" checked={Boolean(bannerForm.data.is_active)} onChange={(event) => bannerForm.setData('is_active', event.target.checked)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                        Tampilkan di portal
                                    </label>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button type="submit" disabled={isBannerSubmitting} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                                        {isBannerSubmitting ? 'Menyimpan...' : editingBanner ? 'Simpan Perubahan' : 'Tambah Slide'}
                                    </button>
                                    {editingBanner && <button type="button" onClick={() => openBannerForm()} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">Batal</button>}
                                </div>
                            </form>

                            <div>
                                <h2 className="mb-3 font-bold text-slate-900">Slide Portal</h2>
                                <div className="flex flex-col gap-3">
                                    {banners.map((banner) => (
                                        <article key={banner.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                                            {banner.gambar_url && <img src={banner.gambar_url} alt="" className="h-40 w-full object-cover" />}
                                            <div className="p-4">
                                                <div className="flex flex-wrap items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold uppercase tracking-wide text-brand-blue">{banner.kicker}</p>
                                                        <h3 className="mt-1 font-bold text-slate-900">{banner.judul}</h3>
                                                        <p className="mt-2 line-clamp-3 text-sm leading-5 text-slate-600">{banner.subjudul}</p>
                                                    </div>
                                                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${banner.is_active ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                                                        {banner.is_active ? 'Aktif' : 'Nonaktif'}
                                                    </span>
                                                </div>
                                                <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                                                    <button type="button" onClick={() => openBannerForm(banner)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700">Edit</button>
                                                    <button type="button" onClick={() => deleteBanner(banner)} className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700">Hapus</button>
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                    {banners.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-600">Belum ada slide hero. Tambahkan slide agar portal menampilkan banner.</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'konten' && (
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                contentsForm.put(route('admin.spmb-cms.contents.update'), { preserveScroll: true });
                            }}
                            className="flex flex-col gap-8 p-5 sm:p-7"
                        >
                            <ContentList
                                title="Jalur Seleksi"
                                section="jalur_seleksi"
                                rows={contentsForm.data.jalur_seleksi}
                                onAdd={() => addContentRow('jalur_seleksi', { judul: '', badge: '', deskripsi: '', jadwal_kuota: '', status_buka: true })}
                                onRemove={(index) => removeContentRow('jalur_seleksi', index)}
                                onChange={updateContentRow}
                                errors={contentsForm.errors}
                                fields={[
                                    { key: 'judul', label: 'Nama Jalur' },
                                    { key: 'badge', label: 'Badge (opsional)' },
                                    { key: 'deskripsi', label: 'Deskripsi', multiline: true },
                                    { key: 'jadwal_kuota', label: 'Jadwal / Kuota', multiline: true },
                                ]}
                                withOpenStatus
                            />
                            <ContentList
                                title="Persyaratan & Biaya"
                                section="persyaratan"
                                rows={contentsForm.data.persyaratan}
                                onAdd={() => addContentRow('persyaratan', { judul: '', deskripsi: '' })}
                                onRemove={(index) => removeContentRow('persyaratan', index)}
                                onChange={updateContentRow}
                                errors={contentsForm.errors}
                                fields={[
                                    { key: 'judul', label: 'Nama Persyaratan / Biaya' },
                                    { key: 'deskripsi', label: 'Keterangan', multiline: true },
                                ]}
                            />
                            <ContentList
                                title="Alur Pendaftaran"
                                section="alur"
                                rows={contentsForm.data.alur}
                                onAdd={() => addContentRow('alur', { judul: '', deskripsi: '' })}
                                onRemove={(index) => removeContentRow('alur', index)}
                                onChange={updateContentRow}
                                errors={contentsForm.errors}
                                fields={[
                                    { key: 'judul', label: 'Judul Langkah' },
                                    { key: 'deskripsi', label: 'Keterangan', multiline: true },
                                ]}
                            />

                            <section>
                                <div className="mb-4">
                                    <h2 className="font-bold text-slate-900">Helpdesk & Kontak</h2>
                                    <p className="mt-1 text-sm text-slate-600">Kontak ini muncul pada portal publik dan footer.</p>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {[
                                        ['nomor_whatsapp', 'Nomor WhatsApp Panitia'],
                                        ['nomor_telepon', 'Nomor Telepon'],
                                        ['email', 'Email'],
                                        ['alamat', 'Alamat'],
                                    ].map(([field, label]) => (
                                        <Field key={field} id={`contact-${field}`} label={label} error={contentsForm.errors[`kontak.${field}`]}>
                                            {field === 'alamat' ? (
                                                <TextArea id={`contact-${field}`} value={contentsForm.data.kontak[field]} onChange={(value) => contentsForm.setData('kontak', { ...contentsForm.data.kontak, [field]: value })} rows={2} />
                                            ) : (
                                                <TextInput
                                                    id={`contact-${field}`}
                                                    type={field === 'email' ? 'email' : 'text'}
                                                    placeholder={field === 'nomor_whatsapp' ? 'Contoh: 6281234567890' : undefined}
                                                    value={contentsForm.data.kontak[field]}
                                                    onChange={(value) => contentsForm.setData('kontak', { ...contentsForm.data.kontak, [field]: value })}
                                                />
                                            )}
                                        </Field>
                                    ))}
                                </div>
                            </section>

                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
                                <InputError message={contentsForm.errors.jalur_seleksi || contentsForm.errors.persyaratan || contentsForm.errors.alur} />
                                <button type="submit" disabled={contentsForm.processing} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                                    {contentsForm.processing ? 'Menyimpan…' : 'Simpan Konten Portal'}
                                </button>
                            </div>
                        </form>
                    )}
                </section>
            </div>
        </DashboardLayout>
    );
}

function ContentList({ title, section, rows, fields, onAdd, onRemove, onChange, errors, withOpenStatus = false }) {
    return (
        <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="font-bold text-slate-900">{title}</h2>
                    <p className="mt-1 text-sm text-slate-600">{rows.length} item ditampilkan pada portal</p>
                </div>
                <button type="button" onClick={onAdd} className="rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-sm font-semibold text-indigo-800 hover:bg-indigo-100">
                    Tambah Item
                </button>
            </div>
            <div className="flex flex-col gap-3">
                {rows.map((row, index) => (
                    <article key={`${section}-${index}`} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
                        {fields.map((field) => (
                            <Field
                                key={field.key}
                                id={`${section}-${index}-${field.key}`}
                                label={field.label}
                                error={errors[`${section}.${index}.${field.key}`]}
                            >
                                {field.multiline ? (
                                    <TextArea
                                        id={`${section}-${index}-${field.key}`}
                                        value={row[field.key]}
                                        onChange={(value) => onChange(section, index, field.key, value)}
                                    />
                                ) : (
                                    <TextInput
                                        id={`${section}-${index}-${field.key}`}
                                        value={row[field.key]}
                                        onChange={(value) => onChange(section, index, field.key, value)}
                                    />
                                )}
                            </Field>
                        ))}
                        <div className="flex items-center justify-between gap-3 sm:col-span-2">
                            {withOpenStatus ? (
                                <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(row.status_buka)}
                                        onChange={(event) => onChange(section, index, 'status_buka', event.target.checked)}
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    Tampilkan sebagai jalur buka
                                </label>
                            ) : <span />}
                            <button type="button" onClick={() => onRemove(index)} className="text-sm font-semibold text-rose-700 hover:text-rose-900">
                                Hapus item
                            </button>
                        </div>
                    </article>
                ))}
                {rows.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-600">Belum ada item. Tambahkan konten untuk ditampilkan pada portal.</p>}
            </div>
        </section>
    );
}
