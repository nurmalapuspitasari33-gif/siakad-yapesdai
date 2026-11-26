import InputError from '@/Components/InputError';
import GoogleAuthButton from '@/Components/GoogleAuthButton';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        nik: '',
        no_wa: '',
        email: '',
        password: '',
        password_confirmation: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

    const submit = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout activePage="spmb">
            <Head title="Pendaftaran Akun Calon Murid Baru" />

            <div className="text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-brand-gold/60 bg-amber-50 text-brand-navy shadow-sm">
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m12-13a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm2 3a4 4 0 0 1 0 8m2 2v-2a4 4 0 0 0-3-3.87" />
                    </svg>
                </span>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
                    Sistem Penerimaan Murid Baru
                </p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                    Pendaftaran Akun Calon Murid Baru
                </h1>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                    Cukup gunakan NIK 16 digit dari Kartu Keluarga tanpa wajib memiliki alamat email.
                </p>
            </div>

            <div className="mt-6 flex flex-col gap-4">
                <GoogleAuthButton
                    label="Daftar SPMB dengan Google"
                    className="min-h-12 border-slate-200 bg-white py-3 text-slate-700 hover:border-brand-blue/40 hover:bg-amber-50"
                />
                <div className="flex items-center gap-3 text-xs font-medium text-slate-400">
                    <span className="h-px flex-1 bg-slate-200" />
                    <span>atau daftar dengan NIK</span>
                    <span className="h-px flex-1 bg-slate-200" />
                </div>
            </div>

            <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
                <div>
                    <label htmlFor="nik" className="block text-sm font-semibold text-slate-700">
                        NIK (16 Digit)
                    </label>
                    <input
                        id="nik"
                        name="nik"
                        type="text"
                        inputMode="numeric"
                        value={data.nik}
                        autoComplete="off"
                        autoFocus
                        required
                        maxLength={16}
                        onChange={(event) => setData('nik', event.target.value)}
                        aria-invalid={Boolean(errors.nik)}
                        aria-describedby={errors.nik ? 'nik-error' : undefined}
                        className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-gold/30"
                        placeholder="Masukkan 16 digit NIK Anda"
                    />
                    <InputError id="nik-error" message={errors.nik} className="mt-2" />
                </div>

                <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-slate-700">
                        Nama Lengkap Sesuai Ijazah/KK
                    </label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        value={data.name}
                        autoComplete="name"
                        required
                        onChange={(event) => setData('name', event.target.value)}
                        aria-invalid={Boolean(errors.name)}
                        aria-describedby={errors.name ? 'name-error' : undefined}
                        className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-gold/30"
                        placeholder="Masukkan nama lengkap sesuai identitas"
                    />
                    <InputError id="name-error" message={errors.name} className="mt-2" />
                </div>

                <div>
                    <label htmlFor="no_wa" className="block text-sm font-semibold text-slate-700">
                        Nomor WhatsApp Aktif
                    </label>
                    <input
                        id="no_wa"
                        name="no_wa"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        value={data.no_wa}
                        required
                        onChange={(event) => setData('no_wa', event.target.value)}
                        aria-invalid={Boolean(errors.no_wa)}
                        aria-describedby={errors.no_wa ? 'no-wa-error' : undefined}
                        className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-gold/30"
                        placeholder="Contoh: 081234567890"
                    />
                    <InputError id="no-wa-error" message={errors.no_wa} className="mt-2" />
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                        Email (Opsional)
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        value={data.email}
                        autoComplete="username"
                        onChange={(event) => setData('email', event.target.value)}
                        aria-invalid={Boolean(errors.email)}
                        aria-describedby={errors.email ? 'email-error' : undefined}
                        className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-gold/30"
                        placeholder="nama@email.com"
                    />
                    <InputError id="email-error" message={errors.email} className="mt-2" />
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                        Kata Sandi
                    </label>
                    <div className="relative mt-2">
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            value={data.password}
                            autoComplete="new-password"
                            required
                            onChange={(event) => setData('password', event.target.value)}
                            aria-invalid={Boolean(errors.password)}
                            aria-describedby={errors.password ? 'password-error' : undefined}
                            className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-4 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-gold/30"
                            placeholder="Buat kata sandi"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((isVisible) => !isVisible)}
                            aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                            aria-pressed={showPassword}
                            className="absolute inset-y-0 right-0 inline-flex items-center rounded-r-xl px-4 text-brand-blue transition hover:text-brand-navy focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-gold"
                        >
                            <PasswordToggleIcon visible={showPassword} />
                        </button>
                    </div>
                    <InputError id="password-error" message={errors.password} className="mt-2" />
                </div>

                <div>
                    <label htmlFor="password_confirmation" className="block text-sm font-semibold text-slate-700">
                        Konfirmasi Kata Sandi
                    </label>
                    <div className="relative mt-2">
                        <input
                            id="password_confirmation"
                            name="password_confirmation"
                            type={showPasswordConfirmation ? 'text' : 'password'}
                            value={data.password_confirmation}
                            autoComplete="new-password"
                            required
                            onChange={(event) => setData('password_confirmation', event.target.value)}
                            aria-invalid={Boolean(errors.password_confirmation)}
                            aria-describedby={errors.password_confirmation ? 'password-confirmation-error' : undefined}
                            className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-4 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-gold/30"
                            placeholder="Ulangi kata sandi"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPasswordConfirmation((isVisible) => !isVisible)}
                            aria-label={showPasswordConfirmation ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                            aria-pressed={showPasswordConfirmation}
                            className="absolute inset-y-0 right-0 inline-flex items-center rounded-r-xl px-4 text-brand-blue transition hover:text-brand-navy focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-gold"
                        >
                            <PasswordToggleIcon visible={showPasswordConfirmation} />
                        </button>
                    </div>
                    <InputError
                        id="password-confirmation-error"
                        message={errors.password_confirmation}
                        className="mt-2"
                    />
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="mt-1 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-brand-navy px-5 py-3.5 text-sm font-semibold text-white shadow-md shadow-brand-navy/20 transition hover:-translate-y-0.5 hover:bg-brand-blue focus:outline-none focus:ring-4 focus:ring-brand-gold/40 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {processing ? 'Mendaftarkan...' : 'Buat Akun & Lanjut Pendaftaran'}
                </button>
            </form>

            <p className="mt-5 border-t border-slate-200/70 pt-5 text-center text-sm text-slate-600">
                Sudah memiliki akun SPMB atau SIAKAD?{' '}
                <Link
                    href={route('login')}
                    className="font-semibold text-brand-blue transition hover:text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2"
                >
                    Masuk di sini
                </Link>
            </p>
            <p className="mt-3 text-center text-sm">
                <Link
                    href={route('home')}
                    className="font-semibold text-slate-500 transition hover:text-brand-blue"
                >
                    ← Kembali ke Beranda SPMB
                </Link>
            </p>
        </GuestLayout>
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
