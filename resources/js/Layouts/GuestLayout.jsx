export default function GuestLayout({ children }) {
    return (
        <section className="w-full max-w-lg rounded-3xl border border-white/70 bg-white p-6 shadow-[0_24px_70px_rgba(2,12,27,0.35)] sm:p-9">
            {children}
        </section>
    );
}
