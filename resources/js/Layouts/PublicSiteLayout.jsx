import PublicSiteHeader from '@/Components/PublicSiteHeader';
import { usePage } from '@inertiajs/react';

export default function PublicSiteLayout({ children }) {
    const { component } = usePage();
    const activePage = component === 'Home'
        ? 'home'
        : component === 'Welcome' || component === 'Auth/Register'
            ? 'spmb'
            : 'login';

    return (
        <div className="flex min-h-screen flex-col">
            <PublicSiteHeader activePage={activePage} />
            <div className="flex flex-1 flex-col">{children}</div>
        </div>
    );
}
