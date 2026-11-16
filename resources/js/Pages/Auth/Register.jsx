import InputError from '@/Components/InputError';
import GoogleAuthButton from '@/Components/GoogleAuthButton';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Daftar Akun" />

            <form onSubmit={submit} className="flex flex-col gap-5">
                <div className="mb-1">
                    <p className="text-sm font-semibold text-indigo-700">Penerimaan siswa baru</p>
                    <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Buat akun SPMB</h1>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        Daftarkan akun calon siswa untuk melengkapi biodata dan berkas pendaftaran.
                    </p>
                </div>
                <div className="flex flex-col gap-4">
                    <GoogleAuthButton label="Daftar SPMB dengan Google" />
                    <div className="flex items-center gap-3 text-xs font-medium text-slate-400">
                        <span className="h-px flex-1 bg-slate-200" />
                        <span>atau daftar dengan email</span>
                        <span className="h-px flex-1 bg-slate-200" />
                    </div>
                </div>
                <div>
                    <InputLabel htmlFor="name" value="Nama lengkap" />

                    <TextInput
                        id="name"
                        name="name"
                        value={data.name}
                        className="mt-2 block w-full"
                        autoComplete="name"
                        isFocused={true}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                    />

                    <InputError message={errors.name} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="Alamat email" />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-2 block w-full"
                        autoComplete="username"
                        onChange={(e) => setData('email', e.target.value)}
                        required
                    />

                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="password" value="Kata sandi" />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-2 block w-full"
                        autoComplete="new-password"
                        onChange={(e) => setData('password', e.target.value)}
                        required
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div>
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Konfirmasi kata sandi"
                    />

                    <TextInput
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className="mt-2 block w-full"
                        autoComplete="new-password"
                        onChange={(e) =>
                            setData('password_confirmation', e.target.value)
                        }
                        required
                    />

                    <InputError
                        message={errors.password_confirmation}
                        className="mt-2"
                    />
                </div>

                <div className="flex flex-col-reverse items-stretch justify-between gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center">
                    <Link
                        href={route('login')}
                        className="text-center text-sm font-semibold text-indigo-700 transition hover:text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:text-left"
                    >
                        Sudah memiliki akun? Masuk
                    </Link>

                    <PrimaryButton className="w-full sm:w-auto" disabled={processing}>
                        {processing ? 'Mendaftarkan...' : 'Daftar dan lanjutkan'}
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
