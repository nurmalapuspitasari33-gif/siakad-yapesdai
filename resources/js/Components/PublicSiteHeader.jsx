import { Link, usePage } from '@inertiajs/react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const navigationItems = [
    { label: 'Beranda', href: '#beranda' },
    { label: 'Program Keahlian', href: '#program-keahlian' },
    { label: 'Jalur Seleksi', href: '#jalur-seleksi' },
    { label: 'Persyaratan & Biaya', href: '#persyaratan-biaya' },
    { label: 'Alur Pendaftaran', href: '#alur-pendaftaran' },
];

export default function PublicSiteHeader() {
    const { component, props } = usePage();
    const auth = props.auth ?? {};
    const tahunAjaranAktif = props.tahunAjaranAktif;
    const [activeSection, setActiveSection] = useState('#beranda');
    const [activePill, setActivePill] = useState({ left: 0, top: 0, width: 0, height: 0 });
    const headerRef = useRef(null);
    const navigationItemRefs = useRef({});
    const scrollAnimationRef = useRef(null);

    const scrollToSection = (href) => {
        const section = document.getElementById(href.slice(1));

        if (!section) {
            return;
        }

        if (scrollAnimationRef.current !== null) {
            window.cancelAnimationFrame(scrollAnimationRef.current);
        }

        const startPosition = window.scrollY;
        const headerHeight = headerRef.current?.offsetHeight ?? 0;
        const targetPosition = Math.max(
            0,
            startPosition + section.getBoundingClientRect().top - headerHeight - 24,
        );

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            window.scrollTo(0, targetPosition);

            return;
        }

        const duration = 700;
        let startTime = null;
        const animateScroll = (timestamp) => {
            startTime ??= timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const easedProgress = progress < 0.5
                ? 4 * progress ** 3
                : 1 - ((-2 * progress + 2) ** 3) / 2;

            window.scrollTo(
                0,
                startPosition + (targetPosition - startPosition) * easedProgress,
            );

            if (progress < 1) {
                scrollAnimationRef.current = window.requestAnimationFrame(animateScroll);
            } else {
                scrollAnimationRef.current = null;
            }
        };

        scrollAnimationRef.current = window.requestAnimationFrame(animateScroll);
    };

    const handleNavigationClick = (event, href) => {
        if (component !== 'Welcome') {
            return;
        }

        event.preventDefault();
        setActiveSection(href);
        scrollToSection(href);
    };

    useEffect(() => {
        let animationFrame = null;

        const updateActiveSection = () => {
            animationFrame = null;
            const activationLine = window.innerHeight * 0.35;
            let nextActiveSection = navigationItems[0].href;

            navigationItems.forEach((item) => {
                const section = document.getElementById(item.href.slice(1));

                if (section && section.getBoundingClientRect().top <= activationLine) {
                    nextActiveSection = item.href;
                }
            });

            setActiveSection((currentSection) => (
                currentSection === nextActiveSection ? currentSection : nextActiveSection
            ));
        };

        const scheduleSectionUpdate = () => {
            if (animationFrame === null) {
                animationFrame = window.requestAnimationFrame(updateActiveSection);
            }
        };

        scheduleSectionUpdate();
        window.addEventListener('scroll', scheduleSectionUpdate, { passive: true });
        window.addEventListener('resize', scheduleSectionUpdate);

        return () => {
            window.removeEventListener('scroll', scheduleSectionUpdate);
            window.removeEventListener('resize', scheduleSectionUpdate);

            if (animationFrame !== null) {
                window.cancelAnimationFrame(animationFrame);
            }

            if (scrollAnimationRef.current !== null) {
                window.cancelAnimationFrame(scrollAnimationRef.current);
            }
        };
    }, []);

    useLayoutEffect(() => {
        const navigationItem = navigationItemRefs.current[activeSection];

        if (!navigationItem) {
            return undefined;
        }

        const updateActivePill = () => {
            setActivePill({
                left: navigationItem.offsetLeft,
                top: navigationItem.offsetTop,
                width: navigationItem.offsetWidth,
                height: navigationItem.offsetHeight,
            });
        };

        updateActivePill();
        window.addEventListener('resize', updateActivePill);

        return () => window.removeEventListener('resize', updateActivePill);
    }, [activeSection]);

    return (
        <header ref={headerRef} className="sticky top-0 z-40 text-white shadow-lg">
            <div className="bg-[#0B2C59]">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                    <Link href={route('home')} aria-label="YAPESDAI — Portal SPMB" className="flex min-w-0 items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white p-1.5">
                            <img src="/yapesdai.png" alt="" className="h-full w-full object-contain" />
                        </span>
                        <span className="min-w-0">
                            <span className="block truncate font-display text-sm font-extrabold sm:text-base">YAPESDAI</span>
                            <span className="block truncate text-[10px] font-medium text-brand-gold sm:text-xs">
                                Yayasan Pengembangan Sumberdaya Insani
                            </span>
                        </span>
                    </Link>
                    <div className="flex shrink-0 items-center gap-3">
                        <span className="hidden text-xs font-medium text-amber-300 sm:block">
                            {tahunAjaranAktif?.label ?? 'Tahun ajaran aktif belum ditetapkan'}
                        </span>
                        <Link href={auth.user ? route('dashboard') : route('login')} className="rounded-full border border-white/35 px-4 py-2 text-xs font-bold transition hover:border-[#FACC15] hover:text-[#FACC15]">
                            Login SIAKAD
                        </Link>
                    </div>
                </div>
            </div>
            <div className="bg-[#004A99]">
                <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
                    <nav aria-label="Navigasi utama" className="relative flex min-w-0 flex-1 items-center gap-1 overflow-x-auto overscroll-x-contain scroll-smooth no-scrollbar">
                    <span
                        aria-hidden="true"
                        className="pointer-events-none absolute left-0 z-0 rounded-md bg-white shadow-sm"
                        style={{
                            height: activePill.height,
                            width: activePill.width,
                            transform: `translate(${activePill.left}px, ${activePill.top}px)`,
                        }}
                    />
                    {navigationItems.map((item) => (
                        <a
                            key={item.href}
                            ref={(element) => {
                                navigationItemRefs.current[item.href] = element;
                            }}
                            href={`${route('home')}${item.href}`}
                            onClick={(event) => handleNavigationClick(event, item.href)}
                            aria-current={activeSection === item.href ? 'location' : undefined}
                            className={`relative z-10 whitespace-nowrap rounded-md px-3.5 py-1.5 text-xs font-bold transition-colors ${
                                activeSection === item.href
                                    ? 'text-[#0B2C59]'
                                    : 'text-white hover:bg-white/10'
                            }`}
                        >
                            {item.label}
                        </a>
                    ))}
                    </nav>
                    <Link href={auth.user ? route('dashboard') : route('register')} className="inline-flex shrink-0 items-center justify-center rounded-full bg-white px-5 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-[#0B2C59] transition-colors hover:bg-amber-100 sm:text-xs">
                        Daftar Sekarang
                    </Link>
                </div>
            </div>
        </header>
    );
}
