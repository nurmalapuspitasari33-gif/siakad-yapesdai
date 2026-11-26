import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const DEFAULT_HERO_KICKER = 'SISTEM PENERIMAAN MURID BARU (SPMB) • YAPESDAI';

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

function ChevronIcon({ direction = 'right' }) {
    return (
        <svg
            aria-hidden="true"
            className={`h-5 w-5 ${direction === 'left' ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m9 18 6-6-6-6" />
        </svg>
    );
}

function SectionMark() {
    return (
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#0B2C59] bg-[#0B2C59]" aria-hidden="true">
            <span className="h-5 w-[3px] rounded-full bg-[#FACC15]" />
        </span>
    );
}

const defaultPathways = [
    {
        judul: 'Jalur Reguler',
        badge: 'Penerimaan Umum',
        deskripsi: 'Jalur penerimaan bagi calon murid baru sesuai minat dan kuota program keahlian.',
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
        judul: 'Surat Keterangan Sehat / Bebas Buta Warna',
        deskripsi: 'Surat sehat dan keterangan bebas buta warna untuk program keahlian terkait.',
    },
];

const defaultProcessSteps = [
    {
        judul: 'Buat Akun dengan NIK 16 Digit',
        deskripsi: 'Daftarkan akun menggunakan NIK yang tercantum pada Kartu Keluarga.',
    },
    {
        judul: 'Lengkapi Biodata & Pilih Jurusan',
        deskripsi: 'Isi data diri, asal sekolah, dan pilihan program keahlian.',
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

function StatisticsIcon({ name }) {
    const icons = {
        competencies: (
            <>
                <path d="M2 9.5 12 4l10 5.5-10 5.5L2 9.5Z" />
                <path d="M6 12v5c3.5 2.5 8.5 2.5 12 0v-5M22 9.5V16" />
            </>
        ),
        pathways: (
            <>
                <circle cx="6" cy="6" r="2" />
                <circle cx="18" cy="18" r="2" />
                <path d="M8 6h3a3 3 0 0 1 3 3v6a3 3 0 0 0 3 3h1M6 8v6a3 3 0 0 0 3 3h2" />
            </>
        ),
        registration: (
            <>
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M16 3v4M8 3v4M3 11h18M8 15h3M8 18h6" />
            </>
        ),
        identity: (
            <>
                <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
                <circle cx="12" cy="9" r="2" />
                <path d="M8.5 16a3.5 3.5 0 0 1 7 0" />
            </>
        ),
    };

    return (
        <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {icons[name]}
        </svg>
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
    const [autoSlideResetKey, setAutoSlideResetKey] = useState(0);
    const [isHeroPaused, setIsHeroPaused] = useState(false);
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
    const sharedSettings = usePage().props.pengaturanSekolah ?? {};
    const helpdeskPhone = portalContacts.nomor_telepon || sharedSettings.telepon || '0282695626';
    const whatsappNumber = (portalContacts.nomor_whatsapp || helpdeskPhone).replace(/\D/g, '').replace(/^0/, '62');
    const whatsappHref = whatsappNumber ? `https://wa.me/${whatsappNumber}` : null;
    const helpdeskEmail = portalContacts.email || sharedSettings.email;
    const helpdeskAddress = portalContacts.alamat || sharedSettings.alamat;
    const registrationIsOpen = Boolean(statistics.registration_open);
    const statisticsItems = [
        {
            label: 'Program Keahlian',
            value: statistics.competencies ?? 0,
            icon: 'competencies',
        },
        {
            label: 'Jalur Seleksi',
            value: Math.max(3, Number(statistics.pathways) || 0),
            icon: 'pathways',
        },
        {
            label: 'Status Gelombang',
            value: wave?.nama_gelombang ?? (registrationIsOpen ? 'Pendaftaran Dibuka' : 'Pendaftaran Ditutup'),
            icon: 'registration',
        },
        {
            label: 'Pendaftaran Online',
            value: 'NIK 16 Digit',
            icon: 'identity',
        },
    ];
    const academicYearLabel = wave?.tahun_ajaran
        || tahunAjaranAktif?.nama_tahun
        || tahunAjaranAktif?.tahun;
    const registrationStatus = wave?.status_label
        || (registrationIsOpen ? 'Pendaftaran Dibuka' : 'Pendaftaran Ditutup');

    useEffect(() => {
        if (slides.length <= 1 || isHeroPaused) {
            return undefined;
        }

        const intervalId = window.setInterval(() => {
            setActiveSlide((current) => (current + 1) % slides.length);
        }, 1000);

        return () => window.clearInterval(intervalId);
    }, [slides.length, autoSlideResetKey, isHeroPaused]);

    const resetAutoSlideTimer = () => {
        setAutoSlideResetKey((current) => current + 1);
    };

    const changeSlide = (direction) => {
        setActiveSlide((current) => (
            slides.length === 0 ? 0 : (current + direction + slides.length) % slides.length
        ));
        resetAutoSlideTimer();
    };

    const selectSlide = (index) => {
        setActiveSlide(index);
        resetAutoSlideTimer();
    };

    return (
        <>
            <Head title="YAPESDAI | Portal SPMB" />

            <main className="bg-white font-public text-slate-900">
                <section
                    id="beranda"
                    aria-label="Informasi utama SPMB"
                    onMouseEnter={() => setIsHeroPaused(true)}
                    onMouseLeave={() => setIsHeroPaused(false)}
                    onTouchStart={() => setIsHeroPaused(true)}
                    onTouchEnd={() => setIsHeroPaused(false)}
                    onTouchCancel={() => setIsHeroPaused(false)}
                    className="relative isolate h-[400px] w-full scroll-mt-32 overflow-hidden rounded-t-none rounded-b-3xl bg-gradient-to-br from-slate-50 via-white to-amber-50 shadow-sm md:h-[460px] md:rounded-b-[2.5rem]"
                >
                    <div
                        className="absolute inset-0 flex h-full w-full transition-transform duration-500 ease-in-out"
                        style={{ transform: `translateX(-${activeSlide * 100}%)` }}
                    >
                        {displaySlides.map((slide, index) => {
                            const hasImage = Boolean(slide?.gambar_url);

                            return (
                                <div
                                    key={slide?.id ?? `default-slide-${index}`}
                                    aria-hidden={activeSlide !== index}
                                    className="relative flex h-full w-full shrink-0 items-center bg-gradient-to-br from-slate-50 via-white to-amber-50"
                                >
                                    {hasImage && (
                                        <>
                                            <img
                                                src={slide.gambar_url}
                                                alt=""
                                                className="absolute inset-0 h-full w-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-r from-[#0B2447]/90 via-[#0B2447]/65 to-transparent" />
                                        </>
                                    )}

                                    <div className="relative z-10 flex h-full w-full items-center pl-16 pr-14 py-8 md:pl-20 md:pr-20 sm:py-12">
                                        {slide ? (
                                            <div className="max-w-2xl">
                                                <p className={`text-xs font-bold uppercase tracking-[0.16em] sm:text-sm ${
                                                    hasImage ? 'text-amber-300' : 'text-[#004A99]'
                                                }`}>
                                                    {slide.kicker || DEFAULT_HERO_KICKER}
                                                </p>
                                                <h1 className={`mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl ${
                                                    hasImage ? 'text-white' : 'text-[#0B2C59]'
                                                }`}>
                                                    {slide.judul}
                                                </h1>
                                                <p className={`mt-4 max-w-xl text-sm leading-6 sm:text-base sm:leading-7 ${
                                                    hasImage ? 'text-white/90' : 'text-slate-700'
                                                }`}>
                                                    {slide.subjudul}
                                                </p>
                                                <Link
                                                    href={slide.cta_url || registerHref}
                                                    tabIndex={activeSlide === index ? undefined : -1}
                                                    className={`mt-7 inline-flex min-h-11 items-center gap-2 rounded-full px-6 py-3 text-sm font-bold uppercase tracking-wide shadow-md transition focus:outline-none focus:ring-4 focus:ring-[#FACC15]/50 ${
                                                        hasImage
                                                            ? 'bg-amber-400 text-[#0B2447] hover:bg-amber-300'
                                                            : 'bg-[#0B2C59] text-white hover:bg-[#004A99]'
                                                    }`}
                                                >
                                                    {slide.cta_label || 'Daftar Sekarang'}
                                                    <ArrowIcon />
                                                </Link>
                                            </div>
                                        ) : (
                                            <div className="max-w-xl">
                                                <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#004A99]">
                                                    {DEFAULT_HERO_KICKER}
                                                </p>
                                                <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight text-[#0B2C59] sm:text-4xl">
                                                    Informasi Penerimaan Murid Baru
                                                </h1>
                                                <p className="mt-4 text-sm leading-6 text-slate-700">
                                                    Informasi SPMB dan pilihan program keahlian YAPESDAI.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {slides.length > 1 && (
                        <>
                            <button
                                type="button"
                                aria-label="Slide sebelumnya"
                                onClick={() => changeSlide(-1)}
                                className="absolute left-4 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-[#0B2C59]/70 text-[#FACC15] shadow-md backdrop-blur-md transition-colors duration-200 hover:bg-[#004A99]/90 focus:outline-none focus:ring-4 focus:ring-[#FACC15]/50 md:left-8"
                            >
                                <ChevronIcon direction="left" />
                            </button>
                            <button
                                type="button"
                                aria-label="Slide berikutnya"
                                onClick={() => changeSlide(1)}
                                className="absolute right-4 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-[#0B2C59]/70 text-[#FACC15] shadow-md backdrop-blur-md transition-colors duration-200 hover:bg-[#004A99]/90 focus:outline-none focus:ring-4 focus:ring-[#FACC15]/50 md:right-8"
                            >
                                <ChevronIcon />
                            </button>
                        </>
                    )}
                </section>

                {slides.length > 0 && (
                    <div className="mx-auto my-3 flex max-w-6xl items-center justify-center gap-2 px-4">
                        {slides.map((slide, index) => (
                            <button
                                key={slide.id}
                                type="button"
                                aria-label={`Tampilkan slide ${index + 1}`}
                                aria-pressed={activeSlide === index}
                                onClick={() => selectSlide(index)}
                                className={`h-2.5 transition-all ${
                                    activeSlide === index ? 'w-8 rounded-full bg-[#0B2C59]' : 'w-2.5 rounded-full bg-slate-300'
                                }`}
                            />
                        ))}
                    </div>
                )}

                <section
                    aria-label="Ringkasan penerimaan"
                    className="relative mx-auto mt-6 max-w-6xl overflow-hidden rounded-2xl border-t-2 border-amber-400 bg-gradient-to-r from-[#0B2447] via-[#12366B] to-[#0B2447] text-white shadow-xl shadow-slate-900/15"
                >
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(250,204,21,0.12),transparent_38%),radial-gradient(ellipse_at_bottom_right,rgba(56,189,248,0.12),transparent_42%)]"
                    />
                    <div className="relative grid grid-cols-2 sm:grid-cols-4">
                        {statisticsItems.map((item) => (
                            <div
                                key={item.label}
                                className="flex min-h-32 flex-col items-center justify-center border-b border-white/10 px-3 py-5 text-center transition-colors hover:bg-white/[0.05] sm:border-b-0 sm:border-r sm:border-white/10 sm:last:border-r-0"
                            >
                                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-amber-300">
                                    <StatisticsIcon name={item.icon} />
                                </span>
                                <p className="text-base font-extrabold text-white sm:text-xl">{item.value}</p>
                                <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-blue-100 sm:text-xs">
                                    {item.label}
                                </p>
                            </div>
                        ))}
                    </div>
                    <div className="relative flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-t border-white/15 px-4 py-2 text-center text-xs text-blue-100">
                        {academicYearLabel && <span>Tahun Ajaran {academicYearLabel}</span>}
                        {academicYearLabel && <span aria-hidden="true">·</span>}
                        <span className="inline-flex items-center gap-2">
                            {registrationIsOpen && (
                                <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                                </span>
                            )}
                            {registrationStatus}
                        </span>
                        {wave && (
                            <>
                                <span aria-hidden="true">·</span>
                                <span>Kuota {wave.kuota}</span>
                            </>
                        )}
                    </div>
                </section>

                <section                 id="program-keahlian" className="scroll-mt-32 px-4 py-10 sm:px-6 sm:py-12">
                    <div className="mx-auto max-w-6xl">
                        <div className="flex items-center gap-3">
                            <SectionMark />
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-blue">Program keahlian</p>
                                <h2 className="font-display text-xl font-extrabold text-[#0B2C59] sm:text-2xl">
                                    Program Keahlian
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
                                    Informasi program keahlian dapat dikonfirmasi kepada panitia SPMB.
                                    <Link href={route('register')} className="ml-1 font-bold text-brand-blue hover:text-brand-navy">
                                        Buat akun untuk mulai mendaftar.
                                    </Link>
                                </article>
                            )}
                        </div>
                    </div>
                </section>

                <section id="jalur-seleksi" className="scroll-mt-32 bg-slate-50 px-4 py-10 sm:px-6 sm:py-12">
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
                                        {pathway.status_buka ? (
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
                        </div>
                    </div>
                </section>

                <section id="persyaratan-biaya" className="scroll-mt-32 px-4 py-10 sm:px-6 sm:py-12">
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
                            <a
                                href={whatsappHref}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#0B2C59] transition hover:bg-amber-50"
                            >
                                WhatsApp {portalContacts.nomor_whatsapp || helpdeskPhone}
                            </a>
                            {helpdeskEmail && (
                                <a href={`mailto:${helpdeskEmail}`} className="mt-4 block break-all text-sm text-blue-100 hover:text-white">
                                    {helpdeskEmail}
                                </a>
                            )}
                            {helpdeskAddress && <p className="mt-2 text-sm leading-6 text-blue-100">{helpdeskAddress}</p>}
                            <p className="mt-2 text-sm text-blue-100">Telepon: {helpdeskPhone}</p>
                        </aside>
                    </div>
                </section>

                <section id="alur-pendaftaran" className="scroll-mt-32 bg-blue-50/60 px-4 py-10 sm:px-6 sm:py-12">
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
