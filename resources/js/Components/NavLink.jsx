import { Link } from '@inertiajs/react';

export default function NavLink({
    active = false,
    className = '',
    children,
    ...props
}) {
    return (
        <Link
            {...props}
            className={
                'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-semibold leading-5 transition duration-150 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ' +
                (active
                    ? 'border-indigo-600 text-slate-950 focus:border-indigo-700'
                    : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-950 focus:border-slate-300 focus:text-slate-900') +
                className
            }
        >
            {children}
        </Link>
    );
}
