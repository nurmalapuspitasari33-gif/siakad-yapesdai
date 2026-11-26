import { Link, usePage } from '@inertiajs/react';

export default function PublicSiteFooter() {
    const { props } = usePage();
    const pengaturanSekolah = props.pengaturanSekolah ?? {};
    const portalContacts = props.portalContacts ?? {};
    const contactHref = portalContacts.email
        ? `mailto:${portalContacts.email}`
        : portalContacts.nomor_whatsapp
            ? `https://wa.me/${portalContacts.nomor_whatsapp.replace(/\D/g, '').replace(/^0/, '62')}`
            : `tel:${portalContacts.nomor_telepon || pengaturanSekolah.telepon || '0282695626'}`;

    return (
        <footer className="shrink-0 border-t-4 border-brand-gold bg-brand-navy text-white">
            <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8 lg:py-10">
                <div className="sm:col-span-2">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white p-1.5">
                            <img
                                src="/yapesdai.png"
                                alt=""
                                className="h-full w-full object-contain"
                            />
                        </span>
                        <div>
                            <p className="font-display text-lg font-bold leading-tight">YAPESDAI</p>
                            <p className="mt-1 text-xs font-semibold tracking-wide text-brand-gold">
                                Yayasan Pengembangan Sumberdaya Insani
                            </p>
                        </div>
                    </div>
                    <p className="mt-4 max-w-xl border-l-2 border-brand-gold pl-3 text-sm leading-6 text-white/80">
                        Portal akademik dan penerimaan peserta didik baru.
                    </p>
                </div>

                <div>
                    <h2 className="border-b border-brand-gold/30 pb-2 text-xs font-bold uppercase tracking-wider text-brand-gold">
                        Tautan
                    </h2>
                    <div className="mt-3 flex flex-col items-start gap-2 text-sm text-white/80">
                        <Link href={route('login')} className="transition hover:text-brand-gold">
                            Sistem Akademik
                        </Link>
                        <Link href={route('spmb.home')} className="transition hover:text-brand-gold">
                            Informasi SPMB
                        </Link>
                    </div>
                </div>

                <div>
                    <h2 className="border-b border-brand-gold/30 pb-2 text-xs font-bold uppercase tracking-wider text-brand-gold">
                        Kontak
                    </h2>
                    <div className="mt-3 flex flex-col items-start gap-2 text-sm text-white/80">
                        {(portalContacts.alamat || pengaturanSekolah.alamat) && <p>{portalContacts.alamat || pengaturanSekolah.alamat}</p>}
                        {(portalContacts.nomor_telepon || pengaturanSekolah.telepon) && (
                            <a href={`tel:${portalContacts.nomor_telepon || pengaturanSekolah.telepon}`} className="transition hover:text-brand-gold">
                                {portalContacts.nomor_telepon || pengaturanSekolah.telepon}
                            </a>
                        )}
                        {(portalContacts.email || portalContacts.nomor_whatsapp) && (
                            <a href={contactHref} className="break-all transition hover:text-brand-gold">
                                {portalContacts.email || `WhatsApp ${portalContacts.nomor_whatsapp}`}
                            </a>
                        )}
                        {!portalContacts.nomor_telepon && !portalContacts.email && !portalContacts.nomor_whatsapp && !pengaturanSekolah.telepon && !pengaturanSekolah.email && (
                            <a href={contactHref} className="transition hover:text-brand-gold">
                                Hubungi sekolah
                            </a>
                        )}
                    </div>
                </div>
            </div>

            <div className="border-t border-white/15 px-4 py-3 text-center text-xs text-white/65">
                © 2026 YAPESDAI — Yayasan Pengembangan Sumberdaya Insani.
            </div>
        </footer>
    );
}
