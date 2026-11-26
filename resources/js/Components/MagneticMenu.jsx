import { forwardRef, useEffect, useState } from 'react';

const MagneticItem = forwardRef(function MagneticItem({
    component: Component = 'div',
    children,
    className = '',
    onMouseLeave,
    onMouseMove,
    style,
    ...props
}, ref) {
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isMagnetEnabled, setIsMagnetEnabled] = useState(false);

    useEffect(() => {
        const pointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
        const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

        const updateMagnetAvailability = () => {
            const isEnabled = pointerQuery.matches && !reducedMotionQuery.matches;

            setIsMagnetEnabled(isEnabled);

            if (!isEnabled) {
                setOffset({ x: 0, y: 0 });
            }
        };

        updateMagnetAvailability();
        pointerQuery.addEventListener('change', updateMagnetAvailability);
        reducedMotionQuery.addEventListener('change', updateMagnetAvailability);

        return () => {
            pointerQuery.removeEventListener('change', updateMagnetAvailability);
            reducedMotionQuery.removeEventListener('change', updateMagnetAvailability);
        };
    }, []);

    const handleMouseMove = (event) => {
        if (isMagnetEnabled) {
            const bounds = event.currentTarget.getBoundingClientRect();

            if (bounds.width > 0 && bounds.height > 0) {
                const x = ((event.clientX - bounds.left + offset.x) / bounds.width - 0.5) * 8;
                const y = ((event.clientY - bounds.top + offset.y) / bounds.height - 0.5) * 8;

                setOffset({
                    x: Math.max(-4, Math.min(4, x)),
                    y: Math.max(-4, Math.min(4, y)),
                });
            }
        }

        onMouseMove?.(event);
    };

    const handleMouseLeave = (event) => {
        setOffset({ x: 0, y: 0 });
        onMouseLeave?.(event);
    };

    return (
        <Component
            {...props}
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={`transform-gpu translate-x-[var(--magnetic-x)] translate-y-[var(--magnetic-y)] transition-[transform,color,background-color,border-color,box-shadow] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95 motion-reduce:transform-none motion-reduce:transition-none ${className}`}
            style={{
                ...style,
                '--magnetic-x': `${offset.x}px`,
                '--magnetic-y': `${offset.y}px`,
            }}
        >
            {children}
        </Component>
    );
});

export default MagneticItem;
