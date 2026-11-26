import roleNavigationItems from '@/Components/RoleNavigationItems';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, usePage } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({
    mustVerifyEmail,
    status,
    mustChangePassword = false,
    isWaliKelas = false,
    waliKelasName = '',
    isCandidate = false,
}) {
    const { auth = {} } = usePage().props;
    const user = auth?.user ?? {};
    const roleLabels = {
        admin: 'Administrator',
        guru: 'Guru',
        siswa: 'Siswa',
    };

    return (
        <DashboardLayout
            title="Pengaturan Akun"
            subtitle="Perbarui informasi profil, kata sandi, dan keamanan akun Anda."
            roleLabel={roleLabels[user.role] ?? 'Pengguna'}
            navigation={roleNavigationItems(user.role, null, {
                isWaliKelas,
                waliKelasName,
                isCandidate,
            })}
        >
            <Head title="Pengaturan Akun" />

            <div className="flex flex-col gap-6">
                {mustChangePassword && (
                    <div
                        role="alert"
                        className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900"
                    >
                        Kata sandi sementara wajib diganti sebelum Anda dapat menggunakan fitur lain.
                    </div>
                )}

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                    <UpdateProfileInformationForm
                        mustVerifyEmail={mustVerifyEmail}
                        status={status}
                    />
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                    <UpdatePasswordForm />
                </section>

                {user.role === 'admin' && (
                    <section className="rounded-2xl border border-rose-200 bg-white p-5 shadow-sm sm:p-7">
                        <DeleteUserForm className="max-w-xl" />
                    </section>
                )}
            </div>
        </DashboardLayout>
    );
}
