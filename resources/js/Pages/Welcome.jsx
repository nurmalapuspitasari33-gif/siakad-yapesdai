import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

const slides = [
    {
        kicker: "Sistem Penerimaan Murid Baru (SPMB) • SMK Al Mu'allim Kesugihan",
        headline: 'Wujudkan Masa Depan Vokasi Unggul, Kompeten, dan Berakhlak Mulia.',
        description: 'Pendaftaran peserta didik baru berbasis NIK kini lebih cepat, transparan, dan terintegrasi langsung dengan Sistem Informasi Akademik sekolah.',
    },
    {
        kicker: 'Belajar terarah, siap melangkah',
        headline: 'Siap Kerja, Santun dalam Sikap, Tangguh di Era Industri.',
        description: 'Pilih kompetensi keahlian sesuai minatmu, lengkapi berkas secara daring, dan pantau status seleksi dari mana saja.',
    },
];

const pathways = [
    {
        title: 'Reguler',
        description: 'Jalur umum bagi calon murid yang ingin memilih kompetensi keahlian sesuai minat.',
        icon: '01',
    },
    {
        title: 'Prestasi',
        description: 'Jalur untuk calon murid dengan capaian akademik maupun nonakademik.',
        icon: '02',
    },
    {
        title: 'Beasiswa / Afirmasi',
        description: 'Informasi kategori bantuan dan ketentuan dapat dikonfirmasi kepada panitia.',
        icon: '03',
    },
];

const processSteps = [
    'Buat Akun dengan NIK KK',
    'Lengkapi Biodata & Jurusan',
    'Unggah Foto Berkas Persyaratan',
    'Cetak Bukti Formulir & Pantau Verifikasi',
];

const requiredDocuments = [
    'Kartu Keluarga',
    'Akta Kelahiran',
    'Ijazah atau SKL',
    'Pas foto',
];

export default function Welcome({
    auth = {},
    canLogin = true,
    canRegister = true,
    programKeahlians = [],
    statistics = {},
}) {
    const { props } = usePage();
    const pengaturanSekolah = props.pengaturanSekolah ?? {};
    const [activeSlide, setActiveSlide] = useState(0);
    const schoolName = pengaturanSekolah.nama_sekolah
        && pengaturanSekolah.nama_sekolah !== 'Nama Sekolah'
        ? pengaturanSekolah.nama_sekolah
        : "SMK Al Mu'allim Kesugihan";
    const spp = Number(pengaturanSekolah.tarif_spp_reguler ?? 0);
    const registerHref = auth?.user || !canRegister ? route('login') : route('register');

    return (
        <>
            <Head title={`SPMB | ${schoolName}`} />

            <main className="bg-white font-public text-slate-900">
                <section id="beranda" className="relative isolate scroll-mt-24 overflow-hidden bg-gradient-to-br from-brand-navy via-[#123f77] to-brand-blue text-white">
                    <div className="pointer-events-none absolute -right-24 -top-20 -z-10 h-96 w-96 rounded-full bg-brand-gold/20 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-32 left-1/4 -z-10 h-80 w-80 rounded-full bg-cyan-300/10 blur-3xl" />
                    <div className="mx-auto grid min-h-[480px] max-w-7xl items-center gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:py-20">
                        <div>
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold tracking-wide text-white/95">
                                <span className="h-2 w-2 rounded-full bg-brand-gold" />
                                {slides[activeSlide].kicker}
                            </span>
                            <h1 className="mt-6 max-w-3xl font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                                {slides[activeSlide].headline}
                            </h1>
                            <p className="mt-5 max-w-2xl text-base leading-7 text-blue-50 sm:text-lg">
                                {slides[activeSlide].description}
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <Link
                                    href={registerHref}
                                    className="inline-flex min-h-12 items-center justify-center rounded-full bg-brand-gold px-6 py-3 text-sm font-bold text-brand-navy shadow-lg transition hover:-translate-y-0.5 hover:bg-yellow-300"
                                >
                                    {auth?.user || !canRegister ? 'Masuk SIAKAD' : 'Daftar Sekarang'}
                                    <span className="ml-2" aria-hidden="true">→</span>
                                </Link>
                                {canLogin && (
                                    <Link
                                        href={route('login')}
                                        className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                                    >
                                        Cek Status / Login Akun
                                    </Link>
                                )}
                            </div>
                            <div className="mt-7 flex items-center gap-3">
                                {slides.map((slide, index) => (
                                    <button
                                        key={slide.headline}
                                        type="button"
                                        aria-label={`Tampilkan slide ${index + 1}`}
                                        aria-pressed={activeSlide === index}
                                        onClick={() => setActiveSlide(index)}
                                        className={`h-2.5 rounded-full transition-all ${activeSlide === index ? 'w-10 bg-brand-gold' : 'w-2.5 bg-white/50'}`}
                                    />
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setActiveSlide((current) => (current + 1) % slides.length)}
                                    className="ml-2 rounded-full px-3 py-1 text-xs font-semibold text-white/90 hover:bg-white/10"
                                >
                                    Slide berikutnya
                                </button>
                            </div>
                        </div>

                        <div className="mx-auto w-full max-w-sm">
                            <div className="rounded-[2rem] border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur">
                                <div className="flex aspect-[4/3] flex-col items-center justify-center rounded-[1.5rem] bg-white p-8 text-center text-brand-navy">
                                    <img src="/logo.png" alt="" className="h-28 w-28 object-contain" />
                                    <p className="mt-4 font-display text-lg font-extrabold">{schoolName}</p>
                                    <p className="mt-1 text-xs font-semibold tracking-wide text-slate-600">
                                        Yayasan Pengembangan Sumberdaya Insani
                                    </p>
                                </div>
                                <p className="px-3 pb-2 pt-4 text-center text-sm font-medium leading-6 text-blue-50">
                                    Satu akun dengan NIK untuk proses pendaftaran yang terhubung dengan layanan akademik.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section aria-label="Ringkasan penerimaan" className="bg-brand-navy text-white">
                    <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-white/15 px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-8">
                        {[
                            { label: 'Kompetensi Keahlian', value: statistics.competencies ?? programKeahlians.length },
                            { label: 'Jalur Seleksi', value: statistics.pathways ?? pathways.length },
                            { label: 'Status Gelombang', value: statistics.registration ?? 'Informasi tersedia' },
                        ].map((item) => (
                            <div key={item.label} className="flex min-h-24 flex-col justify-center gap-1 px-5 py-5 text-center sm:px-8">
                                <p className="text-xl font-extrabold text-brand-gold">{item.value}</p>
                                <p className="text-xs font-semibold uppercase tracking-wide text-white/80">{item.label}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section id="kompetensi-keahlian" className="scroll-mt-24 bg-slate-50 px-5 py-16 sm:px-8">
                    <div className="mx-auto max-w-7xl">
                        <div className="max-w-2xl">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-blue">Arah keahlian</p>
                            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-brand-navy">
                                Pilih kompetensi sesuai minat dan cita-cita
                            </h2>
                            <p className="mt-3 text-sm leading-6 text-slate-600">
                                Kenali program dan konsentrasi yang tersedia. Panitia akan membantu memastikan pilihan sesuai kuota tahun berjalan.
                            </p>
                        </div>
                        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {programKeahlians.length > 0 ? programKeahlians.map((program) => (
                                <article key={program.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <span className="inline-flex rounded-lg bg-blue-50 px-3 py-1 text-xs font-bold text-brand-blue">
                                        {program.kode_jurusan}
                                    </span>
                                    <h3 className="mt-4 font-display text-lg font-bold text-slate-900">{program.nama_jurusan}</h3>
                                    <ul className="mt-3 flex flex-col gap-2 text-sm text-slate-600">
                                        {(program.konsentrasi_keahlians ?? []).map((concentration) => (
                                            <li key={concentration.id} className="flex gap-2">
                                                <span className="text-brand-gold">•</span>
                                                {concentration.nama_konsentrasi}
                                            </li>
                                        ))}
                                    </ul>
                                </article>
                            )) : (
                                <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
                                    Daftar kompetensi keahlian akan ditampilkan setelah data program diperbarui oleh sekolah.
                                </p>
                            )}
                        </div>
                    </div>
                </section>

                <section id="jalur-seleksi" className="scroll-mt-24 px-5 py-16 sm:px-8">
                    <div className="mx-auto max-w-7xl">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-blue">Pendaftaran yang dibuka</p>
                        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <h2 className="font-display text-3xl font-extrabold tracking-tight text-brand-navy">Jalur penerimaan</h2>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                                    Ketentuan dan kuota tiap jalur mengikuti informasi resmi panitia SPMB.
                                </p>
                            </div>
                            <Link href={route('register')} className="text-sm font-bold text-brand-blue hover:text-brand-navy">
                                Mulai pendaftaran →
                            </Link>
                        </div>
                        <div className="mt-8 grid gap-4 md:grid-cols-3">
                            {pathways.map((pathway) => (
                                <article key={pathway.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-sm font-extrabold text-brand-blue ring-1 ring-brand-gold/40">
                                        {pathway.icon}
                                    </span>
                                    <h3 className="mt-4 font-display text-lg font-bold text-slate-900">{pathway.title}</h3>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">{pathway.description}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="persyaratan-biaya" className="scroll-mt-24 bg-blue-50/70 px-5 py-16 sm:px-8">
                    <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-blue">Siapkan dari sekarang</p>
                            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-brand-navy">Persyaratan & informasi biaya</h2>
                            <p className="mt-3 text-sm leading-6 text-slate-600">
                                Unggah foto dokumen yang terbaca jelas. Besaran biaya dan ketentuan akhir dikonfirmasi oleh panitia.
                            </p>
                            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                                {requiredDocuments.map((document) => (
                                    <li key={document} className="flex items-center gap-3 rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">✓</span>
                                        {document}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="rounded-3xl bg-brand-navy p-7 text-white shadow-xl sm:p-9">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-gold">Informasi awal</p>
                            <h3 className="mt-3 font-display text-2xl font-bold">Transparan sejak pendaftaran</h3>
                            <div className="mt-6 flex flex-col gap-4 text-sm leading-6 text-blue-50">
                                <p>
                                    {spp > 0
                                        ? `Informasi SPP reguler yang tercatat saat ini: Rp${new Intl.NumberFormat('id-ID').format(spp)} per bulan.`
                                        : 'Rincian biaya pendidikan akan disampaikan oleh panitia sesuai kebijakan sekolah.'}
                                </p>
                                <p>Jangan mengirim pembayaran kepada pihak yang tidak tercantum dalam pengumuman resmi sekolah.</p>
                            </div>
                            <a
                                href={`tel:${pengaturanSekolah.telepon || '0282695626'}`}
                                className="mt-7 inline-flex min-h-11 items-center justify-center rounded-full bg-brand-gold px-5 py-2.5 text-sm font-bold text-brand-navy hover:bg-yellow-300"
                            >
                                Hubungi Panitia
                            </a>
                        </div>
                    </div>
                </section>

                <section id="alur-pendaftaran" className="scroll-mt-24 px-5 py-16 sm:px-8">
                    <div className="mx-auto max-w-7xl">
                        <div className="mx-auto max-w-2xl text-center">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-blue">Mudah dan terarah</p>
                            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-brand-navy">Alur pendaftaran berbasis NIK</h2>
                            <p className="mt-3 text-sm leading-6 text-slate-600">
                                Gunakan NIK 16 digit sesuai Kartu Keluarga sebagai identitas akun. Email tidak wajib.
                            </p>
                        </div>
                        <ol className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {processSteps.map((step, index) => (
                                <li key={step} className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue text-sm font-extrabold text-white">
                                        {index + 1}
                                    </span>
                                    <h3 className="mt-4 font-display font-bold text-slate-900">{step}</h3>
                                    <p className="mt-2 text-xs leading-5 text-slate-600">
                                        {index === 0
                                            ? 'Buat akun dengan NIK 16 digit dari Kartu Keluarga.'
                                            : index === 1
                                                ? 'Isi data diri, asal sekolah, dan pilihan keahlian.'
                                                : index === 2
                                                    ? 'Unggah hingga 20 foto persyaratan dengan jelas.'
                                                    : 'Cetak bukti pendaftaran dan cek status seleksi.'}
                                    </p>
                                </li>
                            ))}
                        </ol>
                        <div className="mt-9 text-center">
                            <Link
                                href={registerHref}
                                className="inline-flex min-h-12 items-center justify-center rounded-full bg-brand-blue px-7 py-3 text-sm font-bold text-white shadow-md transition hover:bg-brand-navy"
                            >
                                {auth?.user || !canRegister ? 'Login SIAKAD' : 'Daftar Sekarang'}
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
}
