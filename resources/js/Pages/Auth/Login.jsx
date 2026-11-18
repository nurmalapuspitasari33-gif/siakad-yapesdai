import GoogleAuthButton from '@/Components/GoogleAuthButton';
import InputError from '@/Components/InputError';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

function BenefitIcon({ type }) {
    const icons = {
        access: (
            <>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16m-6-6 6 6-6 6" />
            </>
        ),
        secure: (
            <>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 19 6v5c0 4.5-3 7.5-7 10-4-2.5-7-5.5-7-10V6l7-3Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4" />
            </>
        ),
        support: (
            <>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 13v-2a8 8 0 0 1 16 0v2" />
                <rect x="3" y="12" width="4" height="7" rx="2" />
                <rect x="17" y="12" width="4" height="7" rx="2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 19a5 5 0 0 1-5 3" />
            </>
        ),
    };

    return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            {icons[type]}
        </svg>
    );
}

function FieldIcon({ type }) {
    return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            {type === 'email' ? (
                <>
                    <rect x="3" y="5" width="18" height="14" rx="3" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4 7 8 6 8-6" />
                </>
            ) : (
                <>
                    <rect x="4" y="10" width="16" height="11" rx="2.5" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" />
                </>
            )}
        </svg>
    );
}

function PasswordToggleIcon({ visible }) {
    return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            {visible ? (
                <>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.9 5.2A10.7 10.7 0 0 1 12 5c5.5 0 9 7 9 7s-.8 1.6-2.2 3.2M6.2 6.2C3.9 7.8 3 12 3 12s3.5 7 9 7c1 0 2-.2 2.8-.5" />
                </>
            ) : (
                <>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7Z" />
                    <circle cx="12" cy="12" r="2.5" />
                </>
            )}
        </svg>
    );
}

export default function Login({ canResetPassword = true, status = null }) {
    const { props } = usePage();
    const pengaturanSekolah = props.pengaturanSekolah ?? {};
    const googleError = props.errors?.google;
    const contactPhone = pengaturanSekolah.telepon || '0282695626';
    const contactHref = pengaturanSekolah.email
        ? `mailto:${pengaturanSekolah.email}`
        : `tel:${contactPhone}`;
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });
    const [showPassword, setShowPassword] = useState(false);

    const submit = (event) => {
        event.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Login | YAPESDAI" />

            <div className="relative flex min-h-[calc(100vh-5rem)] flex-1 flex-col bg-[#F8FAFC] font-public tracking-tight text-slate-900 antialiased lg:h-[calc(100vh-5rem)] lg:min-h-0">
                <main className="relative isolate flex min-h-0 flex-1 flex-col overflow-hidden bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/50">
                    <div className="pointer-events-none absolute -right-36 top-12 -z-10 h-96 w-96 rounded-full bg-emerald-200/30 opacity-40 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-28 -left-20 -z-10 h-80 w-[60%] rounded-[50%] bg-teal-100/70 opacity-40 blur-2xl" />

                    <section className="relative mx-auto grid w-full flex-1 grid-cols-1 items-center gap-8 px-6 py-8 sm:px-8 lg:grid-cols-12 lg:gap-10 lg:px-10 lg:py-2">
                        <div className="lg:col-span-6">
                            <p className="text-2xl font-semibold tracking-normal text-emerald-700 sm:text-3xl">
                                Selamat Datang
                            </p>
                            <h1 className="mt-2 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">
                                di Sistem Informasi YAPESDAI
                            </h1>
                            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
                                Silakan masuk untuk mengakses layanan akademik dan administrasi sesuai hak akses Anda (Siswa/Santri, Guru, Wali Kelas, &amp; Admin).
                            </p>

                            <div className="mt-8 grid grid-cols-3 gap-3 border-t border-slate-200/70 pt-6 sm:gap-4 sm:pt-8">
                                {[
                                    { type: 'access', label: 'Akses Mudah' },
                                    { type: 'secure', label: 'Aman & Terpercaya' },
                                    { type: 'support', label: 'Dukungan Profesional' },
                                ].map((benefit) => (
                                    <div key={benefit.type} className="flex flex-col items-start gap-3">
                                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/80 bg-white/80 text-emerald-700 shadow-sm ring-1 ring-slate-900/5 backdrop-blur-md">
                                            <BenefitIcon type={benefit.type} />
                                        </span>
                                        <span className="text-xs font-semibold leading-5 text-slate-600 sm:text-sm">
                                            {benefit.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-center lg:col-span-6 lg:justify-end">
                            <div className="w-full max-w-md rounded-[2rem] border border-white bg-white/85 p-6 shadow-[0_20px_50px_rgb(0,0,0,0.06)] ring-1 ring-slate-900/5 backdrop-blur-2xl sm:p-8 lg:p-4">
                                <div className="text-center">
                                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white bg-emerald-50/90 text-emerald-800 shadow-sm ring-1 ring-emerald-900/5 lg:h-12 lg:w-12">
                                        <FieldIcon type="password" />
                                    </span>
                                    <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 lg:mt-2">
                                        Login Akun
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Masukkan email dan password Anda
                                    </p>
                                </div>

                                {status && (
                                    <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800" role="status">
                                        {status}
                                    </div>
                                )}

                                <form onSubmit={submit} className="mt-6 flex flex-col gap-4 lg:mt-3 lg:gap-2">
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                                            Email
                                        </label>
                                        <div className="relative mt-2 lg:mt-1">
                                            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                                                <FieldIcon type="email" />
                                            </span>
                                            <input
                                                id="email"
                                                name="email"
                                                type="email"
                                                autoComplete="username"
                                                autoFocus
                                                required
                                                value={data.email}
                                                onChange={(event) => setData('email', event.target.value)}
                                                aria-invalid={Boolean(errors.email)}
                                                aria-describedby={errors.email ? 'email-error' : undefined}
                                                className="block w-full rounded-2xl border border-transparent bg-slate-100/70 py-3.5 pl-12 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10 lg:py-2.5"
                                                placeholder="nama@email.com"
                                            />
                                        </div>
                                        <InputError id="email-error" message={errors.email} className="mt-2" />
                                    </div>

                                    <div>
                                        <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                                            Password
                                        </label>
                                        <div className="relative mt-2 lg:mt-1">
                                            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                                                <FieldIcon type="password" />
                                            </span>
                                            <input
                                                id="password"
                                                name="password"
                                                type={showPassword ? 'text' : 'password'}
                                                autoComplete="current-password"
                                                required
                                                value={data.password}
                                                onChange={(event) => setData('password', event.target.value)}
                                                aria-invalid={Boolean(errors.password)}
                                                aria-describedby={errors.password ? 'password-error' : undefined}
                                                className="block w-full rounded-2xl border border-transparent bg-slate-100/70 py-3.5 pl-12 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10 lg:py-2.5"
                                                placeholder="Masukkan kata sandi"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((isVisible) => !isVisible)}
                                                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                                                aria-pressed={showPassword}
                                                className="absolute inset-y-0 right-0 inline-flex items-center rounded-r-2xl px-4 text-emerald-700 transition hover:text-emerald-950 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-600"
                                            >
                                                <PasswordToggleIcon visible={showPassword} />
                                            </button>
                                        </div>
                                        <InputError id="password-error" message={errors.password} className="mt-2" />
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                                        <label className="inline-flex items-center gap-2.5 text-sm text-slate-600">
                                            <input
                                                type="checkbox"
                                                name="remember"
                                                checked={data.remember}
                                                onChange={(event) => setData('remember', event.target.checked)}
                                                className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                                            />
                                            Ingat saya
                                        </label>
                                        {canResetPassword && (
                                            <Link
                                                href={route('password.request')}
                                                prefetch
                                                className="text-sm font-semibold text-emerald-800 transition hover:text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
                                            >
                                                Lupa kata sandi?
                                            </Link>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-5 py-3.5 text-sm font-semibold text-white shadow-md shadow-emerald-900/15 transition hover:-translate-y-0.5 hover:bg-emerald-900 focus:outline-none focus:ring-4 focus:ring-emerald-700/15 disabled:cursor-not-allowed disabled:opacity-60 lg:min-h-10 lg:py-2"
                                    >
                                        {processing ? 'Memproses...' : 'Masuk →'}
                                    </button>
                                </form>

                                <div className="my-5 flex items-center gap-3 text-xs font-medium text-slate-400 lg:my-2">
                                    <span className="h-px flex-1 bg-slate-200" />
                                    <span>atau</span>
                                    <span className="h-px flex-1 bg-slate-200" />
                                </div>
                                <GoogleAuthButton
                                    label="Masuk dengan Google"
                                    className="min-h-12 border-slate-200/80 bg-white/90 py-3 text-slate-700 backdrop-blur-md hover:bg-white lg:min-h-9 lg:py-1.5"
                                />
                                {googleError && (
                                    <p
                                        className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                                        role="alert"
                                    >
                                        {googleError}
                                    </p>
                                )}

                                <a
                                    href={contactHref}
                                    className="mt-5 inline-flex w-full items-center justify-center gap-2 text-sm font-semibold text-emerald-800 transition hover:text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 lg:mt-2"
                                >
                                    <BenefitIcon type="support" />
                                    Hubungi Admin
                                </a>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </>
    );
}
