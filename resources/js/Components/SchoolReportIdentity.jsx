export function SchoolReportLetterhead({ settings = {}, title, subtitle }) {
    const contact = [settings?.telepon, settings?.email].filter(Boolean).join(' · ');

    return (
        <header className="flex items-center justify-center gap-4 border-b-2 border-slate-900 pb-4 text-center">
            <img
                src="/logo.png"
                alt="Logo SMK Al Mu'allim Kesugihan"
                className="h-16 w-16 shrink-0 object-contain print:h-16 print:w-16"
            />
            <div>
                <p className="text-xl font-bold uppercase text-slate-950">
                    {settings?.nama_sekolah ?? "SMK Al Mu'allim Kesugihan"}
                </p>
                {settings?.npsn && <p className="mt-1 text-xs text-slate-700">NPSN {settings.npsn}</p>}
                {settings?.alamat && <p className="mt-1 whitespace-pre-line text-xs text-slate-700">{settings.alamat}</p>}
                {contact && <p className="mt-1 text-xs text-slate-700">{contact}</p>}
                <h2 className="mt-3 text-lg font-bold uppercase text-slate-950">{title}</h2>
                {subtitle && <p className="mt-1 text-sm text-slate-700">{subtitle}</p>}
            </div>
        </header>
    );
}

export function PrincipalSignature({ settings = {} }) {
    return (
        <div className="min-w-52 text-center text-sm">
            <p>Kepala Sekolah,</p>
            <div className="h-16" />
            <p className="border-t border-slate-500 pt-2 font-semibold">
                {settings?.kepala_sekolah || '_________________________'}
            </p>
            <p className="mt-1 text-xs text-slate-700">
                NIKY: {settings?.niky_kepala_sekolah || '—'}
            </p>
        </div>
    );
}
