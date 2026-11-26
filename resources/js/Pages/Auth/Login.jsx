import GoogleAuthButton from '@/Components/GoogleAuthButton';
import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

export default function Login({ canResetPassword = true, status = null }) {
    const { props } = usePage();
    const googleError = props.errors?.google;
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (event) => {
        event.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Masuk Portal Akademik & SPMB" />

            <div className="text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-brand-blue ring-1 ring-blue-100">
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                        <rect x="4" y="10" width="16" height="11" rx="2.5" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" />
                    </svg>
                </span>
                <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-brand-navy">
                    Masuk Portal Akademik &amp; SPMB
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                    Gunakan 16 digit NIK sesuai Kartu Keluarga dan kata sandi akun Anda.
                </p>
            </div>

            {status && (
                <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800" role="status">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
                <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                        NIK (16 Digit)
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="text"
                        inputMode="text"
                        autoComplete="username"
                        autoFocus
                        required
                        value={data.email}
                        onChange={(event) => setData('email', event.target.value)}
                        aria-invalid={Boolean(errors.email)}
                        aria-describedby={errors.email ? 'login-identifier-error' : 'login-identifier-hint'}
                        className="mt-2 block min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10"
                        placeholder="Masukkan 16 digit NIK Anda"
                    />
                    <p id="login-identifier-hint" className="mt-1.5 text-xs leading-5 text-slate-500">
                        Akun Guru atau Admin yang belum menggunakan NIK dapat masuk dengan email terdaftar.
                    </p>
                    <InputError id="login-identifier-error" message={errors.email} className="mt-2" />
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                        Kata Sandi
                    </label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={data.password}
                        onChange={(event) => setData('password', event.target.value)}
                        aria-invalid={Boolean(errors.password)}
                        aria-describedby={errors.password ? 'password-error' : undefined}
                        className="mt-2 block min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/10"
                        placeholder="Masukkan kata sandi Anda"
                    />
                    <InputError id="password-error" message={errors.password} className="mt-2" />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                        <input
                            type="checkbox"
                            name="remember"
                            checked={data.remember}
                            onChange={(event) => setData('remember', event.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
                        />
                        Ingat saya
                    </label>
                    {canResetPassword && (
                        <Link href={route('password.request')} className="text-sm font-semibold text-brand-blue hover:text-brand-navy">
                            Lupa kata sandi?
                        </Link>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-brand-blue px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-brand-navy disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {processing ? 'Memproses...' : 'Masuk Sekarang'}
                </button>
            </form>

            <div className="my-5 flex items-center gap-3 text-xs font-medium text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />
                <span>atau</span>
                <span className="h-px flex-1 bg-slate-200" />
            </div>
            <GoogleAuthButton
                label="Masuk dengan Google"
                className="min-h-11 border-slate-200 bg-white py-2.5 text-slate-700 hover:border-brand-blue/40 hover:bg-blue-50"
            />
            {googleError && (
                <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                    {googleError}
                </p>
            )}

            <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 text-center text-sm text-slate-600">
                <p>
                    Belum punya akun?{' '}
                    <Link href={route('register')} className="font-bold text-brand-blue hover:text-brand-navy">
                        Daftar SPMB di sini
                    </Link>
                </p>
                <Link href={route('home')} className="font-semibold text-slate-500 hover:text-brand-blue">
                    ← Kembali ke Beranda SPMB
                </Link>
            </div>
        </GuestLayout>
    );
}
