import { usePage } from '@inertiajs/react';

export default function ApplicationLogo(props) {
    const { assetUrls = {} } = usePage().props;

    return (
        <img
            {...props}
            src={assetUrls.logoSekolah}
            alt="Logo SMK Al Mu'allim Kesugihan"
        />
    );
}
