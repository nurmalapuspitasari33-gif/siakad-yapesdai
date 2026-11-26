import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

function ArrowIcon({ direction = 'right' }) {
    return (
        <svg
            aria-hidden="true"
            className={`h-4 w-4 ${direction === 'left' ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
        </svg>
    );
}

function SectionMark() {
    return (
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-brand-blue">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="m12 2 2.6 6.1L21 11l-6.4 2.9L12 20l-2.6-6.1L3 11l6.4-2.9L12 2Zm7 14 .9 2.1L22 19l-2.1.9L19 22l-.9-2.1L16 19l2.1-.9L19 16Z" />
            </svg>
        </span>
    );
}

const defaultPathways = [
    {
        judul: 'Jalur Reguler',
        badge: 'Penerimaan Umum',
        deskripsi: 'Jalur penerimaan bagi calon murid baru sesuai minat dan kuota kompetensi keahlian.',
        syarat_utama: 'NIK 16 digit, Kartu Keluarga, dan biodata calon murid.',
        jadwal_kuota: 'Mengikuti periode gelombang pendaftaran aktif.',
        status_buka: true,
    },
    {
        judul: 'Jalur Prestasi Akademik / Non-Akademik',
        badge: 'Akademik & Non-Akademik',
        deskripsi: 'Jalur bagi calon murid yang memiliki capaian akademik maupun non-akademik.',
        syarat_utama: 'NIK 16 digit, Kartu Keluarga, dan bukti prestasi yang dapat diverifikasi.',
        jadwal_kuota: 'Berkas prestasi diverifikasi oleh panitia SPMB.',
        status_buka: true,
    },
    {
        judul: 'Jalur Afirmasi / Beasiswa',
        badge: 'Dukungan Pendidikan',
        deskripsi: 'Jalur dukungan pendidikan bagi calon murid yang memenuhi kriteria afirmasi sekolah.',
        syarat_utama: 'NIK 16 digit, Kartu Keluarga, dan dokumen pendukung sesuai kategori.',
        jadwal_kuota: 'Kuota dan ketentuan mengikuti kebijakan sekolah.',
        status_buka: true,
    },
];

const defaultRequirements = [
    {
        judul: 'Kartu Keluarga & NIK 16 Digit',
        deskripsi: 'Foto atau pindai Kartu Keluarga yang jelas dan terbaca.',
    },
    {
        judul: 'Akta Kelahiran',
        deskripsi: 'Foto atau pindai akta kelahiran calon murid.',
    },
    {
        judul: 'Ijazah / SKL SMP/MTs',
        deskripsi: 'Ijazah atau Surat Keterangan Lulus dari SMP/MTs.',
    },
    {
        judul: 'Pas Foto Terbaru',
        deskripsi: 'Pas foto calon murid dengan tampilan yang jelas.',
    },
    {
        judul: 'Surat Keterangan Sehat',
        deskripsi: 'Termasuk keterangan bebas buta warna untuk kompetensi keahlian terkait.',
    },
];

const defaultProcessSteps = [
    {
        judul: 'Buat Akun dengan NIK 16 Digit',
        deskripsi: 'Daftarkan akun menggunakan NIK yang tercantum pada Kartu Keluarga.',
    },
    {
        judul: 'Lengkapi Biodata & Pilih Kompetensi Keahlian',
        deskripsi: 'Isi data diri, asal sekolah, dan pilihan kompetensi keahlian.',
    },
    {
        judul: 'Unggah Foto Berkas Persyaratan',
        deskripsi: 'Unggah foto dokumen persyaratan dengan hasil yang jelas dan terbaca.',
    },
    {
        judul: 'Cetak Formulir & Pantau Hasil Verifikasi',
        deskripsi: 'Cetak bukti pendaftaran dan pantau status verifikasi secara berkala.',
    },
];

export default function Welcome({
    auth = {},
    canLogin = true,
    canRegister = true,
    programKeahlians = [],
    slides = [],
    pathways = [],
    requirements = [],
    processSteps = [],
    wave = null,
    statistics = {},
    portalContacts = {},
    tahunAjaranAktif = null,
}) {
    const [activeSlide, setActiveSlide] = useState(0);
    const displaySlides = slides.length > 0 ? slides : [null];
    const registerHref = auth?.user || !canRegister ? route('login') : route('register');
    const sortedProgramKeahlians = [...programKeahlians].sort((first, second) =>
        (first.kode_jurusan ?? '').localeCompare(second.kode_jurusan ?? '', undefined, { numeric: true }),
    );
    const displayPathways = (pathways.length > 0 ? pathways : defaultPathways).map((pathway, index) => ({
        ...pathway,
        syarat_utama: pathway.syarat_utama
            || defaultPathways[index]?.syarat_utama
            || 'Gunakan NIK 16 digit dan lengkapi dokumen sesuai ketentuan sekolah.',
    }));
    const displayRequirements = requirements.length > 0 ? requirements : defaultRequirements;
    const displayProcessSteps = defaultProcessSteps.map((step, index) => ({
        ...step,
        ...(processSteps[index] ?? {}),
        number: String(index + 1).padStart(2, '0'),
    }));
    const whatsappNumber = (portalContacts.nomor_whatsapp ?? '').replace(/\D/g, '').replace(/^0/, '62');
    const whatsappHref = whatsappNumber ? `https://wa.me/${whatsappNumber}` : null;
    const helpdeskPhone = portalContacts.nomor_telepon || '0282695626';

    const changeSlide = (direction) => {
        setActiveSlide((current) => (
            slides.length === 0 ? 0 : (current + direction + slides.length) % slides.length
        ));
    };

    return (
        <>
            <Head title="YAPESDAI | Portal SPMB" />

            <main className="bg-white font-public text-slate-900">
                <div className="mx-auto mt-6 max-w-6xl px-4 sm:px-6">
                    <section
                        id="beranda"
                        aria-label="Informasi utama SPMB"
                        className="relative isolate h-[380px] scroll-mt-32 overflow-hidden border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-amber-50 shadow-sm sm:h-[420px]"
                    >
                        <div
                            className="absolute inset-0 flex h-full w-full transition-transform duration-500 ease-in-out"
                            style={{ transform: `translateX(-${activeSlide * 100}%)` }}
                        >
                            {displaySlides.map((slide, index) => (
                                <div
                                    key={slide?.id ?? `default-slide-${index}`}
                                    aria-hidden={activeSlide !== index}
                                    className="relative flex h-full w-full shrink-0 items-center bg-gradient-to-br from-slate-50 via-white to-amber-50"
                                >
                                    {slide?.gambar_url && (
                                        <>
                                            <img
                                                src={slide.gambar_url}
                                                alt=""
                                                className="absolute inset-0 h-full w-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/35" />
                                        </>
                                    )}

                                    <div className="relative z-10 flex h-full w-full items-center px-14 py-8 sm:px-20 sm:py-12">
                                        {slide ? (
                                            <div className="max-w-2xl">
                                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#004A99] sm:text-sm">
                                                    {slide.kicker}
                                                </p>
                                                <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight text-[#0B2C59] sm:text-4xl lg:text-5xl">
                                                    {slide.judul}
                                                </h1>
                                                <p className="mt-4 max-w-xl text-sm leading-6 text-slate-700 sm:text-base sm:leading-7">
                                                    {slide.subjudul}
                                                </p>
                                                <Link
                                                    href={slide.cta_url || registerHref}
                                                    tabIndex={activeSlide === index ? undefined : -1}
                                                    className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#0B2C59] px-6 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-md transition hover:bg-[#004A99] focus:outline-none focus:ring-4 focus:ring-[#FACC15]/50"
                                                >
                                                    {slide.cta_label || 'Daftar Sekarang'}
                                                    <ArrowIcon />
                                                </Link>
                                            </div>
                                        ) : (
                                            <div className="max-w-xl">
                                                <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#004A99]">
                                                    Portal SPMB
                                                </p>
                                                <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight text-[#0B2C59] sm:text-4xl">
                                                    Informasi Penerimaan Murid Baru
                                                </h1>
                                                <p className="mt-4 text-sm leading-6 text-slate-700">
                                                    Konten penerimaan akan ditampilkan setelah dikelola oleh administrator sekolah.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {slides.length > 1 && (
                            <>
                                <button
                                    type="button"
                                    aria-label="Slide sebelumnya"
                                    onClick={() => changeSlide(-1)}
                                    className="absolute left-3 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#0B2C59] shadow-md transition hover:bg-amber-50 focus:outline-none focus:ring-4 focus:ring-[#FACC15]/50 sm:left-5"
                                >
                                    <ArrowIcon direction="left" />
                                </button>
                                <button
                                    type="button"
                                    aria-label="Slide berikutnya"
                                    onClick={() => changeSlide(1)}
                                    className="absolute right-3 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#0B2C59] shadow-md transition hover:bg-amber-50 focus:outline-none focus:ring-4 focus:ring-[#FACC15]/50 sm:right-5"
                                >
                                    <ArrowIcon />
                                </button>
                            </>
                        )}
                    </section>

                    {slides.length > 0 && (
                        <div className="my-3 flex items-center justify-center gap-2 bg-white">
                            {slides.map((slide, index) => (
                                <button
                                    key={slide.id}
                                    type="button"
                                    aria-label={`Tampilkan slide ${index + 1}`}
                                    aria-pressed={activeSlide === index}
                                    onClick={() => setActiveSlide(index)}
                                    className={`h-2.5 transition-all ${
                                        activeSlide === index ? 'w-8 rounded-full bg-[#0B2C59]' : 'w-2.5 rounded-full bg-slate-300'
                                    }`}
                                />
                            ))}
                        </div>
                    )}

                    <section aria-label="Ringkasan penerimaan" className="rounded-2xl bg-[#0B2C59] text-white shadow-sm">
                        <div className="grid grid-cols-2 divide-x divide-white/15 sm:grid-cols-4">
                            {[
                                { label: 'Kompetensi Keahlian', value: statistics.competencies ?? 0 },
                                { label: 'Jalur Seleksi', value: statistics.pathways ?? 0 },
                                { label: wave?.nama_gelombang ?? 'Pendaftaran Ditutup', value: statistics.registration ?? 'Pendaftaran Ditutup' },
                                { label: 'Pendaftaran Online', value: 'NIK 16 Digit' },
                            ].map((item) => (
                                <div key={item.label} className="flex min-h-24 flex-col items-center justify-center gap-1 px-3 py-5 text-center sm:min-h-32">
                                    <p className="text-lg font-extrabold text-white sm:text-2xl">{item.value}</p>
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-blue-100 sm:text-xs">
                                        {item.label}
                                    </p>
                                </div>
                            ))}
                        </div>
                        {wave && (
                            <p className="border-t border-white/15 px-4 py-2 text-center text-xs text-blue-100">
                                Tahun Ajaran {wave.tahun_ajaran} · {wave.status_label} · Kuota {wave.kuota}
                            </p>
                        )}
                    </section>
                </div>

                <section id="kompetensi-keahlian" className="scroll-mt-32 px-4 py-12 sm:px-6 sm:py-16">
                    <div className="mx-auto max-w-6xl">
                        <div className="flex items-center gap-3">
                            <SectionMark />
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-blue">Program keahlian</p>
                                <h2 className="font-display text-xl font-extrabold text-[#0B2C59] sm:text-2xl">
                                    Kompetensi Keahlian
                                </h2>
                            </div>
                        </div>
                        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {sortedProgramKeahlians.map((program) => (
                                <article key={program.id} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <span className="inline-flex w-fit rounded-lg bg-blue-50 px-3 py-1 text-xs font-bold tracking-wide text-brand-blue">
                                        {program.kode_jurusan}
                                    </span>
                                    <h3 className="mt-3 font-display text-lg font-bold text-slate-900">{program.nama_jurusan}</h3>
                                    <ul className="mt-4 flex flex-1 flex-col gap-2 text-sm text-slate-600">
                                        {(program.konsentrasi_keahlians ?? []).map((concentration) => (
                                            <li key={concentration.id} className="flex items-start gap-2">
                                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold" aria-hidden="true" />
                                                <span>{concentration.nama_konsentrasi}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <Link
                                        href={route('register')}
                                        className="mt-5 inline-flex w-fit items-center gap-1.5 border-t border-slate-100 pt-4 text-sm font-bold text-brand-blue transition hover:text-brand-navy"
                                    >
                                        Daftar Jurusan Ini <ArrowIcon />
                                    </Link>
                                </article>
                            ))}
                            {sortedProgramKeahlians.length === 0 && (
                                <article className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm leading-6 text-slate-600 sm:col-span-2 lg:col-span-3">
                                    Informasi kompetensi keahlian dapat dikonfirmasi kepada panitia SPMB.
                                    <Link href={route('register')} className="ml-1 font-bold text-brand-blue hover:text-brand-navy">
                                        Buat akun untuk mulai mendaftar.
                                    </Link>
                                </article>
                            )}
                        </div>
                    </div>
                </section>

                <section id="jalur-seleksi" className="scroll-mt-32 bg-slate-50 px-4 py-12 sm:px-6 sm:py-16">
                    <div className="mx-auto max-w-6xl">
                        <div className="flex items-center gap-3">
                            <SectionMark />
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-blue">Informasi penerimaan</p>
                                <h2 className="font-display text-xl font-extrabold text-[#0B2C59] sm:text-2xl">
                                    Pendaftaran yang Dibuka
                                </h2>
                            </div>
                        </div>
                        <div className="mt-6 grid gap-4 md:grid-cols-3">
                            {displayPathways.map((pathway) => {
                                const isRegistrationOpen = pathway.status_buka && statistics.registration_open;

                                return (
                                    <article key={pathway.judul} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                        <div className="flex items-start justify-between gap-3">
                                            <h3 className="font-display text-lg font-bold text-slate-900">{pathway.judul}</h3>
                                            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                                                isRegistrationOpen
                                                    ? 'bg-emerald-50 text-emerald-800'
                                                    : 'bg-slate-100 text-slate-700'
                                            }`}>
                                                {isRegistrationOpen ? 'Dibuka' : 'Ditutup'}
                                            </span>
                                        </div>
                                        {pathway.badge && <p className="mt-2 text-xs font-semibold text-brand-blue">{pathway.badge}</p>}
                                        <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{pathway.deskripsi}</p>
                                        <div className="mt-4 rounded-xl bg-slate-50 p-3">
                                            <p className="text-[10px] font-bold uppercase tracking-wide text-brand-navy">Syarat utama</p>
                                            <p className="mt-1 text-xs leading-5 text-slate-600">{pathway.syarat_utama}</p>
                                        </div>
                                        {pathway.jadwal_kuota && (
                                            <p className="mt-3 text-xs font-semibold text-slate-700">{pathway.jadwal_kuota}</p>
                                        )}
                                        {isRegistrationOpen ? (
                                            <Link href={registerHref} className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-brand-navy px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-blue">
                                                Daftar Jalur Ini <ArrowIcon />
                                            </Link>
                                        ) : (
                                            <span className="mt-5 inline-flex w-fit items-center rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
                                                Pendaftaran Ditutup
                                            </span>
                                        )}
                                    </article>
                                );
                            })}
                            {displayPathways.length === 0 && (
                                <p className="text-sm text-slate-600">Informasi jalur seleksi sedang disiapkan.</p>
                            )}
                        </div>
                    </div>
                </section>

                <section id="persyaratan-biaya" className="scroll-mt-32 px-4 py-12 sm:px-6 sm:py-16">
                    <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.2fr_0.8fr]">
                        <div>
                            <div className="flex items-center gap-3">
                                <SectionMark />
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-blue">Dokumen dan informasi</p>
                                    <h2 className="font-display text-xl font-extrabold text-[#0B2C59] sm:text-2xl">
                                        Persyaratan &amp; Biaya
                                    </h2>
                                </div>
                            </div>
                            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                                {displayRequirements.map((item, index) => (
                                    <li key={`${item.judul}-${index}`} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
                                        <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" />
                                            </svg>
                                        </span>
                                        <span>
                                            <span className="block font-bold text-slate-900">{item.judul}</span>
                                            {item.deskripsi && <span className="mt-1 block text-sm leading-5 text-slate-600">{item.deskripsi}</span>}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <aside className="rounded-2xl bg-[#0B2C59] p-6 text-white sm:p-8">
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-200">Bantuan pendaftaran</p>
                            <h3 className="mt-2 font-display text-xl font-bold">Hubungi Panitia SPMB</h3>
                            {portalContacts.nomor_whatsapp ? (
                                <a
                                    href={whatsappHref}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#0B2C59] transition hover:bg-amber-50"
                                >
                                    WhatsApp {portalContacts.nomor_whatsapp}
                                </a>
                            ) : (
                                <a
                                    href={`tel:${helpdeskPhone}`}
                                    className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#0B2C59] transition hover:bg-amber-50"
                                >
                                    Hubungi Panitia · {helpdeskPhone}
                                </a>
                            )}
                            {portalContacts.email && <p className="mt-4 break-all text-sm text-blue-100">{portalContacts.email}</p>}
                            {portalContacts.alamat && <p className="mt-2 text-sm leading-6 text-blue-100">{portalContacts.alamat}</p>}
                            {portalContacts.nomor_telepon && <p className="mt-2 text-sm text-blue-100">Telepon: {portalContacts.nomor_telepon}</p>}
                        </aside>
                    </div>
                </section>

                <section id="alur-pendaftaran" className="scroll-mt-32 bg-blue-50/60 px-4 py-12 sm:px-6 sm:py-16">
                    <div className="mx-auto max-w-6xl">
                        <div className="flex items-center gap-3">
                            <SectionMark />
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-blue">Langkah demi langkah</p>
                                <h2 className="font-display text-xl font-extrabold text-[#0B2C59] sm:text-2xl">
                                    Alur Pendaftaran SPMB
                                </h2>
                            </div>
                        </div>
                        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {displayProcessSteps.map((step) => (
                                <li key={step.number} className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
                                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-blue text-sm font-extrabold text-white">
                                        {step.number}
                                    </span>
                                    <h3 className="mt-4 font-bold text-slate-900">{step.judul}</h3>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">{step.deskripsi}</p>
                                </li>
                            ))}
                        </ol>
                        <div className="mt-8 text-center">
                            <Link
                                href={registerHref}
                                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand-blue px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-navy"
                            >
                                Daftar Sekarang <ArrowIcon />
                            </Link>
                            <p className="mt-2 text-xs text-slate-600">
                                {tahunAjaranAktif?.label ?? 'Tahun ajaran aktif belum ditetapkan'}
                            </p>
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
}
