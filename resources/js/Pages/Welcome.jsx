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
    const whatsappNumber = (portalContacts.nomor_whatsapp ?? '').replace(/\D/g, '').replace(/^0/, '62');
    const whatsappHref = whatsappNumber ? `https://wa.me/${whatsappNumber}` : null;

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
                            {programKeahlians.map((program) => (
                                <article key={program.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <span className="inline-flex rounded-lg bg-blue-50 px-3 py-1 text-xs font-bold text-brand-blue">
                                        {program.kode_jurusan}
                                    </span>
                                    <h3 className="mt-3 font-display text-lg font-bold text-slate-900">{program.nama_jurusan}</h3>
                                    <ul className="mt-3 flex flex-col gap-2 text-sm text-slate-600">
                                        {(program.konsentrasi_keahlians ?? []).map((concentration) => (
                                            <li key={concentration.id}>{concentration.nama_konsentrasi}</li>
                                        ))}
                                    </ul>
                                </article>
                            ))}
                            {programKeahlians.length === 0 && (
                                <p className="text-sm text-slate-600">Informasi kompetensi keahlian belum tersedia.</p>
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
                            {pathways.map((pathway) => (
                                <article key={pathway.judul} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <div className="flex items-start justify-between gap-3">
                                        <h3 className="font-display text-lg font-bold text-slate-900">{pathway.judul}</h3>
                                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                                            pathway.status_buka && statistics.registration_open
                                                ? 'bg-emerald-50 text-emerald-800'
                                                : 'bg-slate-100 text-slate-700'
                                        }`}>
                                            {pathway.status_buka && statistics.registration_open ? 'Dibuka' : 'Ditutup'}
                                        </span>
                                    </div>
                                    {pathway.badge && <p className="mt-2 text-xs font-semibold text-brand-blue">{pathway.badge}</p>}
                                    <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{pathway.deskripsi}</p>
                                    {pathway.jadwal_kuota && (
                                        <p className="mt-3 text-xs font-semibold text-slate-700">{pathway.jadwal_kuota}</p>
                                    )}
                                    {pathway.status_buka && statistics.registration_open ? (
                                        <Link href={registerHref} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-blue hover:text-brand-navy">
                                            Daftar jalur ini <ArrowIcon />
                                        </Link>
                                    ) : (
                                        <span className="mt-5 text-sm font-semibold text-slate-500">Pendaftaran belum tersedia</span>
                                    )}
                                </article>
                            ))}
                            {pathways.length === 0 && (
                                <p className="text-sm text-slate-600">Informasi jalur seleksi belum tersedia.</p>
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
                                {requirements.map((item, index) => (
                                    <li key={`${item.judul}-${index}`} className="rounded-xl border border-slate-200 bg-white p-4">
                                        <p className="font-bold text-slate-900">{item.judul}</p>
                                        {item.deskripsi && <p className="mt-1 text-sm leading-5 text-slate-600">{item.deskripsi}</p>}
                                    </li>
                                ))}
                                {requirements.length === 0 && (
                                    <li className="text-sm text-slate-600">Persyaratan belum tersedia.</li>
                                )}
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
                                <p className="mt-4 text-sm leading-6 text-blue-100">Informasi kontak panitia belum tersedia.</p>
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
                            {processSteps.map((step, index) => (
                                <li key={`${step.judul}-${index}`} className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
                                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-blue text-sm font-extrabold text-white">
                                        {index + 1}
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
