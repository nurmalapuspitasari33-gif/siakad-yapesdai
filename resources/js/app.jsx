import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { PersistentDashboardLayout } from '@/Layouts/DashboardLayout';
import PublicSiteLayout from '@/Layouts/PublicSiteLayout';
import { createRoot } from 'react-dom/client';

const withDashboardLayout = (page) => (
    <PersistentDashboardLayout>{page}</PersistentDashboardLayout>
);
const withPublicSiteLayout = (page) => (
    <PublicSiteLayout>{page}</PublicSiteLayout>
);
const publicPageNames = new Set([
    'Welcome',
    'Auth/ConfirmPassword',
    'Auth/ForgotPassword',
    'Auth/Login',
    'Auth/Register',
    'Auth/ResetPassword',
    'Auth/VerifyEmail',
]);

createInertiaApp({
    title: (title) => title || 'YAPESDAI',
    resolve: async (name) => {
        const page = await resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        );

        if (/^(Admin|Guru|Siswa|Profile)\//.test(name) || /^Dashboard\/(Admin|Guru|Siswa)$/.test(name)) {
            page.default.layout = withDashboardLayout;
        } else if (publicPageNames.has(name)) {
            page.default.layout = withPublicSiteLayout;
        }

        return page;
    },
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: { color: '#004A99', showSpinner: true },
});
