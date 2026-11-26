import { Head } from '@inertiajs/react';
import { useEffect } from 'react';

const selectionLabels = {
    pending: 'Menunggu Verifikasi',
    diterima: 'Diterima',
    ditolak: 'Tidak Diterima',
};

function PrintField({ label, value }) {
    return (
        <div className="spmb-print-field grid grid-cols-[36mm_minmax(0,1fr)] gap-1 border-b border-slate-200 py-1 print:text-[11px] print:leading-tight">
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

            <article className="print-document spmb-registration-print mx-auto max-w-4xl border border-slate-300 bg-white p-5 shadow-sm print:max-w-full print:border-0 print:p-0 print:shadow-none print:text-[11px] print:leading-tight sm:p-8">
                <header className="spmb-form-heading flex items-center justify-center gap-3 border-b-4 border-double border-slate-900 pb-2 text-center">
                    <img src="/logo.png" alt="" className="h-[18mm] w-[18mm] shrink-0 object-contain" />
                    <div>
                        <p className="font-bold uppercase tracking-wide">Panitia Sistem Penerimaan Murid Baru</p>
                        <h1 className="mt-0.5 font-display font-extrabold uppercase">
                            SMK Al Mu'allim Kesugihan
                        </h1>
                        <p className="mt-0.5 font-semibold">
                            Yayasan Pengembangan Sumberdaya Insani (YAPESDAI)
                        </p>
                    </div>
                </header>

                <h2 className="spmb-form-title mt-2 text-center font-bold uppercase">
                    Formulir Pendaftaran Murid Baru
                </h2>

                <div className="spmb-registration-meta-row mt-2 grid grid-cols-1 items-start gap-3 sm:grid-cols-[minmax(0,1fr)_26mm]">
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                        <dl className="spmb-registration-meta">
                            <dt className="font-semibold">Nomor Pendaftaran</dt>
                            <dd className="break-words">{pendaftaran.nomor || '—'}</dd>
                        </dl>
                        <dl className="spmb-registration-meta">
                            <dt className="font-semibold">Tanggal Daftar</dt>
                            <dd className="break-words">{pendaftaran.tanggal_daftar || '—'}</dd>
                        </dl>
                        <dl className="spmb-registration-meta">
                            <dt className="font-semibold">Jalur Pendaftaran</dt>
                            <dd className="break-words">{pendaftaran.jalur || '—'}</dd>
                        </dl>
                        <dl className="spmb-registration-meta">
                            <dt className="font-semibold">Status Seleksi</dt>
                            <dd className="break-words">{selectionLabels[pendaftaran.status_seleksi] ?? '—'}</dd>
                        </dl>
                    </div>
                    <div className="spmb-registration-photo flex h-[34mm] w-[26mm] shrink-0 items-center justify-center justify-self-center overflow-hidden border border-dashed border-slate-500 text-center">
                        {pendaftaran.foto_siswa_url ? (
                            <img src={pendaftaran.foto_siswa_url} alt="Pas foto calon siswa" className="h-full w-full object-cover" />
                        ) : (
                            <span>Pas Foto<br />3 × 4</span>
                        )}
                    </div>
                </div>

                <div className="spmb-registration-columns mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                    <section>
                        <h3 className="spmb-registration-section-heading border-b border-slate-700 pb-1 font-bold uppercase">
                            A. Identitas Calon Siswa
                        </h3>
                        <dl>
                            <PrintField label="NIK 16 Digit" value={pendaftaran.nik} />
                            <PrintField label="Nama Lengkap" value={pendaftaran.nama_lengkap} />
                            <PrintField label="Tempat/Tanggal Lahir" value={[pendaftaran.tempat_lahir, pendaftaran.tanggal_lahir].filter(Boolean).join(', ')} />
                            <PrintField label="Jenis Kelamin" value={pendaftaran.jenis_kelamin} />
                            <PrintField label="Alamat" value={pendaftaran.alamat} />
                            <PrintField label="No. HP/WhatsApp" value={pendaftaran.no_hp} />
                        </dl>
                    </section>

                    <div className="spmb-registration-school-data">
                        <section>
                            <h3 className="spmb-registration-section-heading border-b border-slate-700 pb-1 font-bold uppercase">
                                B. Data Asal Sekolah &amp; Pilihan
                            </h3>
                            <dl>
                                <PrintField label="Sekolah Asal" value={pendaftaran.sekolah_asal} />
                                <PrintField label="Kompetensi Keahlian" value={pendaftaran.program_keahlian} />
                                <PrintField label="Konsentrasi Keahlian" value={pendaftaran.konsentrasi_keahlian} />
                            </dl>
                        </section>

                        <section className="mt-2">
                            <h3 className="spmb-registration-section-heading border-b border-slate-700 pb-1 font-bold uppercase">
                                D. Kelengkapan Berkas
                            </h3>
                            <ul className="spmb-registration-documents mt-1 grid grid-cols-2 gap-x-2 gap-y-1">
                                {(pendaftaran.berkas ?? []).length > 0 ? pendaftaran.berkas.map((berkas, index) => (
                                    <li key={`${berkas.caption}-${index}`} className="flex items-start gap-1">
                                        <span className="inline-flex h-3 w-3 shrink-0 items-center justify-center border border-slate-700 text-[9px]">
                                            {berkas.uploaded ? '✓' : ''}
                                        </span>
                                        <span className="break-words">{berkas.caption || `Foto berkas ${index + 1}`}</span>
                                    </li>
                                )) : (
                                    <li className="col-span-2">Belum ada foto berkas persyaratan yang diunggah.</li>
                                )}
                            </ul>
                        </section>
                    </div>
                </div>

                <section className="spmb-registration-parents mt-3">
                    <h3 className="spmb-registration-section-heading border-b border-slate-700 pb-1 font-bold uppercase">
                        C. Data Orang Tua / Wali
                    </h3>
                    <div className="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                        <dl>
                            <PrintField label="Nama Ayah" value={pendaftaran.nama_ayah} />
                            <PrintField label="Pekerjaan Ayah" value={pendaftaran.pekerjaan_ayah} />
                            <PrintField label="Nama Ibu" value={pendaftaran.nama_ibu} />
                            <PrintField label="Pekerjaan Ibu" value={pendaftaran.pekerjaan_ibu} />
                            <PrintField label="Telepon Orang Tua" value={pendaftaran.telepon_ortu} />
                        </dl>
                        <dl>
                            <PrintField label="Nama Wali" value={pendaftaran.nama_wali} />
                            <PrintField label="Pekerjaan Wali" value={pendaftaran.pekerjaan_wali} />
                            <PrintField label="Telepon Wali" value={pendaftaran.telepon_wali} />
                            <PrintField label="Alamat Orang Tua" value={pendaftaran.alamat_ortu} />
                            <PrintField label="Alamat Wali" value={pendaftaran.alamat_wali} />
                        </dl>
                    </div>
                </section>

                <section className="spmb-registration-signatures mt-4 grid grid-cols-3 gap-3 text-center">
                    <div>
                        <p>Calon Murid,</p>
                        <div className="spmb-registration-signature-space h-12" />
                        <p className="font-bold underline">{pendaftaran.nama_lengkap || '________________'}</p>
                    </div>
                    <div>
                        <p>Orang Tua / Wali,</p>
                        <div className="spmb-registration-signature-space h-12" />
                        <p className="font-bold underline">{pendaftaran.nama_wali || pendaftaran.nama_ayah || pendaftaran.nama_ibu || '________________'}</p>
                    </div>
                    <div>
                        <p>Panitia Verifikator,</p>
                        <div className="spmb-registration-signature-space h-12" />
                        <p className="font-bold underline">________________</p>
                    </div>
                </section>
                <p className="spmb-registration-footnote mt-2 text-center">
                    Formulir ini merupakan bukti pendaftaran. Simpan dan tunjukkan kepada panitia saat verifikasi.
                </p>
            </article>
        </main>
    );
}
