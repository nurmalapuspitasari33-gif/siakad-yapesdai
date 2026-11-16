import InputError from '@/Components/InputError';

export function studentIdentityDefaults() {
    return {
        nis: '',
        tempat_lahir: '',
        tanggal_lahir: '',
        jenis_kelamin: '',
        agama: '',
        status_keluarga: '',
        anak_ke: '',
        alamat_murid: '',
        telepon_rumah: '',
        sekolah_asal: '',
        diterima_di_kelas: '',
        tanggal_diterima: '',
        nama_ayah: '',
        nama_ibu: '',
        alamat_ortu: '',
        telepon_ortu: '',
        pekerjaan_ayah: '',
        pekerjaan_ibu: '',
        nama_wali: '',
        alamat_wali: '',
        telepon_wali: '',
        pekerjaan_wali: '',
        foto_siswa: null,
        ukuran_seragam: '',
        tipe_program: 'reguler',
        kategori_beasiswa_id: '',
    };
}

function TextField({ form, name, label, type = 'text', ...inputProps }) {
    return (
        <div>
            <label htmlFor={`identitas-${name}`} className="mb-2 block text-sm font-semibold text-slate-700">
                {label}
            </label>
            <input
                id={`identitas-${name}`}
                type={type}
                value={form.data[name] ?? ''}
                onChange={(event) => form.setData(name, event.target.value)}
                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                {...inputProps}
            />
            <InputError message={form.errors[name]} className="mt-2" />
        </div>
    );
}

function SelectField({ form, name, label, options }) {
    return (
        <div>
            <label htmlFor={`identitas-${name}`} className="mb-2 block text-sm font-semibold text-slate-700">
                {label}
            </label>
            <select
                id={`identitas-${name}`}
                value={form.data[name] ?? ''}
                onChange={(event) => form.setData(name, event.target.value)}
                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </select>
            <InputError message={form.errors[name]} className="mt-2" />
        </div>
    );
}

function TextAreaField({ form, name, label }) {
    return (
        <div className="sm:col-span-2">
            <label htmlFor={`identitas-${name}`} className="mb-2 block text-sm font-semibold text-slate-700">
                {label}
            </label>
            <textarea
                id={`identitas-${name}`}
                rows="2"
                value={form.data[name] ?? ''}
                onChange={(event) => form.setData(name, event.target.value)}
                className="block w-full rounded-xl border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            <InputError message={form.errors[name]} className="mt-2" />
        </div>
    );
}

export default function StudentIdentityFields({
    form,
    kategoriBeasiswas = [],
    includeAdmissionFields = false,
}) {
    return (
        <div className="flex flex-col gap-5">
            <div>
                <h3 className="font-semibold text-slate-900">Identitas Murid</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                    Pas foto wajib berorientasi potret dengan rasio 3:4. Ukuran berkas maksimal 2 MB.
                </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField form={form} name="nis" label="NIS" maxLength="255" />
                <TextField form={form} name="tempat_lahir" label="Tempat Lahir" maxLength="100" />
                <TextField form={form} name="tanggal_lahir" label="Tanggal Lahir" type="date" />
                <SelectField
                    form={form}
                    name="jenis_kelamin"
                    label="Jenis Kelamin"
                    options={[
                        { value: '', label: 'Pilih jenis kelamin' },
                        { value: 'L', label: 'Laki-laki' },
                        { value: 'P', label: 'Perempuan' },
                    ]}
                />
                <TextField form={form} name="agama" label="Agama" maxLength="50" />
                <TextField form={form} name="status_keluarga" label="Status dalam Keluarga" maxLength="50" />
                <TextField form={form} name="anak_ke" label="Anak Ke-" type="number" min="1" max="30" />
                <TextField form={form} name="telepon_rumah" label="Telepon Rumah" type="tel" maxLength="30" />
                <TextAreaField form={form} name="alamat_murid" label="Alamat Murid" />
                <TextField form={form} name="sekolah_asal" label="Sekolah Asal" maxLength="255" />
                {includeAdmissionFields && (
                    <>
                        <TextField form={form} name="diterima_di_kelas" label="Diterima di Kelas" maxLength="255" />
                        <TextField form={form} name="tanggal_diterima" label="Tanggal Diterima" type="date" />
                    </>
                )}
            </div>

            <div>
                <h3 className="font-semibold text-slate-900">Data Orang Tua / Wali</h3>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField form={form} name="nama_ayah" label="Nama Ayah" maxLength="255" />
                <TextField form={form} name="pekerjaan_ayah" label="Pekerjaan Ayah" maxLength="255" />
                <TextField form={form} name="nama_ibu" label="Nama Ibu" maxLength="255" />
                <TextField form={form} name="pekerjaan_ibu" label="Pekerjaan Ibu" maxLength="255" />
                <TextField form={form} name="telepon_ortu" label="Telepon Orang Tua" type="tel" maxLength="30" />
                <TextAreaField form={form} name="alamat_ortu" label="Alamat Orang Tua" />
                <TextField form={form} name="nama_wali" label="Nama Wali (opsional)" maxLength="255" />
                <TextField form={form} name="pekerjaan_wali" label="Pekerjaan Wali" maxLength="255" />
                <TextField form={form} name="telepon_wali" label="Telepon Wali" type="tel" maxLength="30" />
                <TextAreaField form={form} name="alamat_wali" label="Alamat Wali" />
            </div>

            <div>
                <h3 className="font-semibold text-slate-900">Program dan Beasiswa</h3>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <SelectField
                    form={form}
                    name="tipe_program"
                    label="Program"
                    options={[
                        { value: 'reguler', label: 'Reguler' },
                        { value: 'santri_internal', label: 'Santri Internal PP Al Fiel Kesugihan' },
                        { value: 'santri_eksternal', label: 'Santri Eksternal di luar PP Al Fiel Kesugihan' },
                    ]}
                />
                <SelectField
                    form={form}
                    name="kategori_beasiswa_id"
                    label="Kategori Beasiswa / Afirmasi"
                    options={[
                        { value: '', label: 'Pilih kategori (opsional)' },
                        ...kategoriBeasiswas.map((category) => ({
                            value: String(category.id),
                            label: category.nama_beasiswa,
                        })),
                    ]}
                />
                <SelectField
                    form={form}
                    name="ukuran_seragam"
                    label="Ukuran Seragam"
                    options={[
                        { value: '', label: 'Pilih ukuran' },
                        ...['S', 'M', 'L', 'XL', 'XXL'].map((size) => ({ value: size, label: size })),
                    ]}
                />
                <div>
                    <label htmlFor="foto-siswa" className="mb-2 block text-sm font-semibold text-slate-700">Pas Foto 3x4</label>
                    <input
                        id="foto-siswa"
                        type="file"
                        accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                        onChange={(event) => form.setData('foto_siswa', event.target.files?.[0] ?? null)}
                        className="block w-full rounded-xl border border-slate-300 text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700"
                    />
                    <InputError message={form.errors.foto_siswa} className="mt-2" />
                </div>
            </div>
        </div>
    );
}
