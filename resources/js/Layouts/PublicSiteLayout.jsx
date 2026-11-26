import PublicSiteHeader from '@/Components/PublicSiteHeader';
import PublicSiteFooter from '@/Components/PublicSiteFooter';
import { usePage } from '@inertiajs/react';

export default function PublicSiteLayout({ children }) {
    const { component } = usePage();
    const activePage = component === 'Welcome' || component === 'Auth/Register'
        ? 'spmb'
        : 'login';

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900">
            <PublicSiteHeader activePage={activePage} />
            <div className="flex flex-1 flex-col">{children}</div>
            <PublicSiteFooter />
        </div>
    );
}
