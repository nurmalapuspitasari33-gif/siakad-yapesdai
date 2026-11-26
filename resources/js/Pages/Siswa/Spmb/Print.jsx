import { Head } from '@inertiajs/react';
import { useEffect } from 'react';

const selectionLabels = {
    pending: 'Menunggu Verifikasi',
    diterima: 'Diterima',
    ditolak: 'Tidak Diterima',
};

function PrintField({ label, value }) {
    return (
        <div className="grid grid-cols-[150px_1fr] gap-2 border-b border-slate-200 py-1.5 text-sm">
            <dt className="font-semibold">{label}</dt>
            <dd className="break-words">{value || '—'}</dd>
        </div>
    );
}

export default function SiswaSpmbPrint({ pendaftaran = {} }) {
    useEffect(() => {
        const timer = window.setTimeout(() => window.print(), 400);

        return () => window.clearTimeout(timer);
    }, []);

    return (
        <main className="min-h-screen bg-slate-100 px-4 py-6 font-public text-slate-900 sm:px-8">
            <Head title={`Formulir SPMB ${pendaftaran.nomor ?? ''}`} />
            <div className="print:hidden mx-auto mb-4 flex max-w-4xl justify-end">
                <button
                    type="button"
                    onClick={() => window.print()}
                    className="rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-navy"
                >
                    Cetak Formulir
                </button>
            </div>

            <article className="print-document mx-auto max-w-4xl border border-slate-300 bg-white p-8 shadow-sm sm:p-10">
                <header className="flex items-center justify-center gap-4 border-b-2 border-slate-900 pb-4 text-center">
                    <img src="/logo.png" alt="" className="h-16 w-16 object-contain" />
                    <div>
                        <p className="text-sm font-bold uppercase tracking-wide">Panitia Sistem Penerimaan Murid Baru</p>
                        <h1 className="mt-1 font-display text-xl font-extrabold uppercase">
                            SMK Al Mu'allim Kesugihan
                        </h1>
                        <p className="mt-1 text-sm font-semibold">
                            Yayasan Pengembangan Sumberdaya Insani (YAPESDAI)
                        </p>
                    </div>
                </header>

                <div className="mt-5 flex flex-wrap items-start justify-between gap-5">
                    <div className="min-w-0 flex-1">
                        <h2 className="text-center text-lg font-bold uppercase">Formulir Pendaftaran Murid Baru</h2>
                        <dl className="mt-3">
                            <PrintField label="Nomor Pendaftaran" value={pendaftaran.nomor} />
                            <PrintField label="Tanggal Daftar" value={pendaftaran.tanggal_daftar} />
                            <PrintField label="Jalur Pendaftaran" value={pendaftaran.jalur} />
                            <PrintField label="Status Seleksi" value={selectionLabels[pendaftaran.status_seleksi] ?? '—'} />
                        </dl>
                    </div>
                    <div className="flex h-36 w-28 shrink-0 items-center justify-center overflow-hidden border border-dashed border-slate-500 text-center text-xs">
                        {pendaftaran.foto_siswa_url ? (
                            <img src={pendaftaran.foto_siswa_url} alt="Pas foto calon siswa" className="h-full w-full object-cover" />
                        ) : (
                            <span className="px-2">Pas Foto<br />3 × 4</span>
                        )}
                    </div>
                </div>

                <section className="mt-6">
                    <h3 className="border-b border-slate-700 pb-1 text-sm font-bold uppercase">A. Identitas Calon Siswa</h3>
                    <dl className="mt-1">
                        <PrintField label="NIK (16 Digit)" value={pendaftaran.nik} />
                        <PrintField label="Nama Lengkap" value={pendaftaran.nama_lengkap} />
                        <PrintField label="Tempat, Tanggal Lahir" value={[pendaftaran.tempat_lahir, pendaftaran.tanggal_lahir].filter(Boolean).join(', ')} />
                        <PrintField label="Jenis Kelamin" value={pendaftaran.jenis_kelamin} />
                        <PrintField label="Alamat" value={pendaftaran.alamat} />
                        <PrintField label="No. HP / WhatsApp" value={pendaftaran.no_hp} />
                    </dl>
                </section>

                <section className="mt-5">
                    <h3 className="border-b border-slate-700 pb-1 text-sm font-bold uppercase">B. Data Asal Sekolah &amp; Pilihan</h3>
                    <dl className="mt-1">
                        <PrintField label="Sekolah Asal" value={pendaftaran.sekolah_asal} />
                        <PrintField label="Kompetensi Keahlian" value={pendaftaran.program_keahlian} />
                        <PrintField label="Konsentrasi Keahlian" value={pendaftaran.konsentrasi_keahlian} />
                    </dl>
                </section>

                <section className="mt-5">
                    <h3 className="border-b border-slate-700 pb-1 text-sm font-bold uppercase">C. Data Orang Tua / Wali</h3>
                    <dl className="mt-1">
                        <PrintField label="Nama Ayah" value={pendaftaran.nama_ayah} />
                        <PrintField label="Nama Ibu" value={pendaftaran.nama_ibu} />
                        <PrintField label="Nama Wali" value={pendaftaran.nama_wali} />
                        <PrintField label="Telepon Orang Tua" value={pendaftaran.telepon_ortu} />
                        <PrintField label="Telepon Wali" value={pendaftaran.telepon_wali} />
                        <PrintField label="Pekerjaan Ayah" value={pendaftaran.pekerjaan_ayah} />
                        <PrintField label="Pekerjaan Ibu" value={pendaftaran.pekerjaan_ibu} />
                        <PrintField label="Pekerjaan Wali" value={pendaftaran.pekerjaan_wali} />
                        <PrintField label="Alamat Orang Tua" value={pendaftaran.alamat_ortu} />
                        <PrintField label="Alamat Wali" value={pendaftaran.alamat_wali} />
                    </dl>
                </section>

                <section className="mt-5">
                    <h3 className="border-b border-slate-700 pb-1 text-sm font-bold uppercase">D. Kelengkapan Berkas</h3>
                    <ul className="mt-2 grid grid-cols-2 gap-2 text-sm">
                        {(pendaftaran.berkas ?? []).length > 0 ? pendaftaran.berkas.map((berkas, index) => (
                            <li key={`${berkas.caption}-${index}`} className="flex items-center gap-2">
                                <span className="inline-flex h-4 w-4 items-center justify-center border border-slate-700 text-[10px]">
                                    {berkas.uploaded ? '✓' : ''}
                                </span>
                                {berkas.caption || `Foto berkas ${index + 1}`}
                            </li>
                        )) : (
                            <li className="col-span-2 text-slate-700">Belum ada foto berkas persyaratan yang diunggah.</li>
                        )}
                    </ul>
                </section>

                <section className="mt-10 grid grid-cols-3 gap-5 text-center text-xs">
                    <div>
                        <p>Calon Murid,</p>
                        <div className="h-16" />
                        <p className="font-bold underline">{pendaftaran.nama_lengkap || '________________'}</p>
                    </div>
                    <div>
                        <p>Orang Tua / Wali,</p>
                        <div className="h-16" />
                        <p className="font-bold underline">{pendaftaran.nama_wali || pendaftaran.nama_ayah || pendaftaran.nama_ibu || '________________'}</p>
                    </div>
                    <div>
                        <p>Panitia Verifikator,</p>
                        <div className="h-16" />
                        <p className="font-bold underline">________________</p>
                    </div>
                </section>
                <p className="mt-6 text-center text-[10px] text-slate-600">
                    Formulir ini merupakan bukti pendaftaran. Simpan dan tunjukkan kepada panitia saat verifikasi.
                </p>
            </article>
        </main>
    );
}
