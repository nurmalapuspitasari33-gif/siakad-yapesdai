import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link, usePage } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    const { pengaturanSekolah } = usePage().props;

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-4 py-10 sm:px-6">
            <div className="mb-6">
                <Link href="/">
                    <ApplicationLogo schoolSettings={pengaturanSekolah ?? {}} />
                </Link>
            </div>

            <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white px-6 py-7 shadow-xl shadow-slate-900/5 sm:px-8">
                {children}
            </div>
        </div>
    );
}
