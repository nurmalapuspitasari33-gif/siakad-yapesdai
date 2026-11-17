import GoogleAuthButton from '@/Components/GoogleAuthButton';
import PublicSiteHeader from '@/Components/PublicSiteHeader';
import { Head, Link } from '@inertiajs/react';

const registrationSteps = [
    {
        number: '01',
        label: 'Pendaftaran',
        title: 'Buat Akun',
        description: 'Daftar melalui email atau akun Google.',
    },
    {
        number: '02',
        label: 'Seleksi',
        title: 'Lengkapi Berkas',
        description: 'Isi data dan unggah dokumen persyaratan.',
    },
    {
        number: '03',
        label: 'Pengumuman',
        title: 'Pantau Hasil',
        description: 'Periksa status seleksi melalui akun Anda.',
    },
];

const requiredDocuments = [
    'Kartu Keluarga',
    'Akta Kelahiran',
    'Ijazah atau SKL',
    'Pas Foto',
];

const helpdeskAddress = 'Jl. Kemerdekaan Timur No. 06, Kesugihan Kidul, Kec. Kesugihan, Kab. Cilacap, Jawa Tengah 53274';
const helpdeskPhone = '0282695626';

function StepIcon({ number }) {
    const icons = {
        '01': (
            <>
                <rect x="4" y="5" width="16" height="15" rx="3" />
                <path d="M8 3v4m8-4v4M7.5 11h9M8 15h3" />
            </>
        ),
        '02': (
            <>
                <path d="M8 4h8l4 4v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3Z" />
                <path d="M14 4v5h5m-10 5 2 2 4-4" />
            </>
        ),
        '03': (
            <>
                <path d="M3 11v2a2 2 0 0 0 2 2h2l3 5h3l-2-5 9 3V6l-9 3H5a2 2 0 0 0-2 2Z" />
                <path d="M20 9a3 3 0 0 1 0 6" />
            </>
        ),
    };

    return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {icons[number]}
        </svg>
    );
}

export default function Welcome({
    auth = {},
    canLogin = true,
    canRegister = true,
    pengaturanSekolah = {},
}) {
    const schoolName = pengaturanSekolah?.nama_sekolah ?? "SMK Al Mu'allim Kesugihan";
    const contactEmail = pengaturanSekolah?.email;
    const contactPhone = pengaturanSekolah?.telepon || helpdeskPhone;

    return (
        <>
            <Head title={`SPMB | ${schoolName}`} />

            <div className="relative min-h-screen bg-[#F8FAFC] font-public tracking-tight text-slate-900 antialiased">
                <PublicSiteHeader activePage="spmb" />

                <main className="relative isolate overflow-hidden bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/50">
                    <div className="pointer-events-none absolute -right-36 top-16 -z-10 h-96 w-96 rounded-full bg-emerald-200/30 opacity-40 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-28 left-1/4 -z-10 h-72 w-[60%] rounded-[50%] bg-teal-100/70 opacity-40 blur-2xl" />

                    <section className="relative mx-auto max-w-7xl px-4 pb-14 pt-12 sm:px-6 sm:pb-16 sm:pt-16 lg:px-8">
                        <div className="max-w-3xl">
                            <span className="inline-flex items-center rounded-full border border-emerald-200/70 bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-800">
                                Penerimaan Peserta Didik Baru
                            </span>
                            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">
                                Selamat Datang Calon Santri dan Murid Baru
                            </h1>
                            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                                Mari bergabung bersama kami di lingkungan pendidikan yang Islami, berkualitas, dan berkarakter.
                            </p>

                            {!auth?.user && canRegister && (
                                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                                    <Link
                                        href={route('register')}
                                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-emerald-800 px-7 py-3.5 text-sm font-semibold text-white shadow-md shadow-emerald-900/15 transition hover:-translate-y-0.5 hover:bg-emerald-900 focus:outline-none focus:ring-4 focus:ring-emerald-700/15"
                                    >
                                        Daftar Sekarang <span aria-hidden="true">→</span>
                                    </Link>
                                    <GoogleAuthButton
                                        label="Daftar dengan Google"
                                        className="min-h-12 border-slate-200/80 bg-white/90 px-6 py-3.5 font-medium text-slate-800 backdrop-blur-md hover:bg-white sm:w-auto"
                                    />
                                </div>
                            )}

                            {auth?.user && (
                                <Link
                                    href={route('dashboard')}
                                    className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-emerald-800 px-7 py-3.5 text-sm font-semibold text-white shadow-md shadow-emerald-900/15 transition hover:bg-emerald-900"
                                >
                                    Lanjutkan ke Portal <span aria-hidden="true">→</span>
                                </Link>
                            )}
                        </div>

                        <div className="mt-10 rounded-3xl border border-white bg-white/85 p-2 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5 backdrop-blur-xl sm:p-6">
                            <div className="grid grid-cols-1 divide-y divide-slate-200/60 md:grid-cols-3 md:divide-x md:divide-y-0">
                                {registrationSteps.map((step) => (
                                    <article key={step.number} className="flex items-center gap-4 px-4 py-5 sm:px-5 md:py-3">
                                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                                            <StepIcon number={step.number} />
                                        </span>
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                                                {step.label}
                                            </p>
                                            <h2 className="mt-0.5 font-bold text-slate-900">{step.title}</h2>
                                            <p className="mt-1 text-sm leading-5 text-slate-500">{step.description}</p>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section id="informasi" className="relative mx-auto grid max-w-7xl grid-cols-1 gap-5 px-4 pb-16 sm:px-6 lg:grid-cols-2 lg:px-8">
                        <article className="rounded-3xl border border-white/80 bg-white/80 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5 backdrop-blur-xl sm:p-8">
                            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a9 9 0 1 0 9 9" />
                                </svg>
                            </span>
                            <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">
                                Persyaratan Berkas Utama
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                Siapkan dokumen berikut untuk melengkapi data pendaftaran:
                            </p>
                            <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {requiredDocuments.map((document) => (
                                    <li key={document} className="flex items-center gap-3 rounded-2xl bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-700">
                                        <span className="h-2 w-2 rounded-full bg-emerald-600" aria-hidden="true" />
                                        {document}
                                    </li>
                                ))}
                            </ul>
                            <p className="mt-5 text-sm leading-6 text-slate-500">
                                Pilihan jenjang dan program keahlian mengikuti layanan serta kuota yang tersedia. Konfirmasi informasi tahun berjalan kepada panitia.
                            </p>
                        </article>

                        <article className="rounded-3xl border border-white/80 bg-white/80 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5 backdrop-blur-xl sm:p-8">
                            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z" />
                                    <circle cx="12" cy="10" r="2.25" />
                                </svg>
                            </span>
                            <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">
                                Bantuan Panitia
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                Hubungi panitia SPMB jika membutuhkan informasi lebih lanjut.
                            </p>
                            <address className="mt-5 not-italic text-sm leading-6 text-slate-700">
                                {helpdeskAddress}
                            </address>
                            <a
                                href={`tel:${contactPhone}`}
                                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 transition hover:text-emerald-950"
                            >
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 3.75h3l1.5 4.5-2.25 1.5a15 15 0 0 0 7.5 7.5l1.5-2.25 4.5 1.5v3A1.5 1.5 0 0 1 18.75 21 15.75 15.75 0 0 1 3 5.25 1.5 1.5 0 0 1 4.5 3.75Z" />
                                </svg>
                                {contactPhone}
                            </a>
                            <a
                                href={contactEmail ? `mailto:${contactEmail}` : `tel:${contactPhone}`}
                                className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-800 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
                            >
                                Kirim Email
                            </a>
                        </article>
                    </section>
                </main>

                <footer className="border-t border-slate-200/70 bg-white/70 px-4 py-6 text-center text-xs text-slate-500 backdrop-blur sm:px-6">
                    <p>SPMB YAPESDAI · {schoolName} · © 2026 YAPESDAI</p>
                </footer>
            </div>
        </>
    );
}
