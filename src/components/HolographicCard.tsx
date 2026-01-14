import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface HolographicCardProps {
    children: React.ReactNode;
    className?: string;
    disabled?: boolean;
}

export const HolographicCard: React.FC<HolographicCardProps> = ({
    children,
    className = '',
    disabled = false,
}) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isPressed, setIsPressed] = useState(false);

    // Spring values for smooth animation
    const rotateX = useSpring(0, { stiffness: 300, damping: 30 });
    const rotateY = useSpring(0, { stiffness: 300, damping: 30 });

    // Transform rotation to gradient position for holographic effect
    const gradientX = useTransform(rotateY, [-20, 20], [0, 100]);
    const gradientY = useTransform(rotateX, [-20, 20], [100, 0]);

    // Transform rotation to shine position
    const shineX = useTransform(rotateY, [-20, 20], [-50, 150]);
    const shineY = useTransform(rotateX, [-20, 20], [150, -50]);

    const updateRotation = useCallback((clientX: number, clientY: number) => {
        if (!cardRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Calculate rotation based on pointer position relative to center
        // Limit rotation to ±20 degrees
        const maxRotation = 20;
        const rotateYValue = ((clientX - centerX) / (rect.width / 2)) * maxRotation;
        const rotateXValue = -((clientY - centerY) / (rect.height / 2)) * maxRotation;

        rotateX.set(Math.max(-maxRotation, Math.min(maxRotation, rotateXValue)));
        rotateY.set(Math.max(-maxRotation, Math.min(maxRotation, rotateYValue)));
    }, [rotateX, rotateY]);

    // Use global pointer move event for better tracking
    useEffect(() => {
        if (!isPressed || disabled) return;

        const handleGlobalPointerMove = (e: PointerEvent) => {
            updateRotation(e.clientX, e.clientY);
        };

        const handleGlobalPointerUp = () => {
            setIsPressed(false);
            rotateX.set(0);
            rotateY.set(0);
        };

        window.addEventListener('pointermove', handleGlobalPointerMove);
        window.addEventListener('pointerup', handleGlobalPointerUp);
        window.addEventListener('pointercancel', handleGlobalPointerUp);

        return () => {
            window.removeEventListener('pointermove', handleGlobalPointerMove);
            window.removeEventListener('pointerup', handleGlobalPointerUp);
            window.removeEventListener('pointercancel', handleGlobalPointerUp);
        };
    }, [isPressed, disabled, updateRotation, rotateX, rotateY]);

    const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        if (disabled) return;
        e.preventDefault(); // Prevent text selection and other default behaviors
        setIsPressed(true);
        updateRotation(e.clientX, e.clientY);
    }, [disabled, updateRotation]);

    if (disabled) {
        return <div className={className}>{children}</div>;
    }

    return (
        <motion.div
            ref={cardRef}
            className={`relative cursor-grab active:cursor-grabbing touch-none ${className}`}
            style={{
                transformStyle: 'preserve-3d',
                perspective: 1000,
                rotateX,
                rotateY,
            }}
            onPointerDown={handlePointerDown}
        >
            {/* Card content */}
            <div className="relative z-10">
                {children}
            </div>

            {/* Holographic rainbow overlay */}
            <motion.div
                className="holographic-overlay pointer-events-none absolute inset-0 rounded-xl z-20"
                style={{
                    opacity: isPressed ? 0.7 : 0,
                    backgroundImage: `linear-gradient(
                        115deg,
                        transparent 0%,
                        rgba(255, 0, 128, 0.3) 25%,
                        rgba(0, 255, 255, 0.3) 40%,
                        rgba(255, 255, 0, 0.3) 55%,
                        rgba(0, 255, 128, 0.3) 70%,
                        rgba(128, 0, 255, 0.3) 85%,
                        transparent 100%
                    )`,
                    backgroundSize: '200% 200%',
                    backgroundPositionX: gradientX,
                    backgroundPositionY: gradientY,
                    mixBlendMode: 'color-dodge',
                }}
            />

            {/* Shine/glare effect */}
            <motion.div
                className="holographic-shine pointer-events-none absolute inset-0 rounded-xl z-30 overflow-hidden"
                style={{
                    opacity: isPressed ? 1 : 0,
                }}
            >
                <motion.div
                    className="absolute w-[200%] h-[200%]"
                    style={{
                        background: `radial-gradient(
                            circle at center,
                            rgba(255, 255, 255, 0.8) 0%,
                            rgba(255, 255, 255, 0.4) 10%,
                            rgba(255, 255, 255, 0.1) 20%,
                            transparent 40%
                        )`,
                        left: shineX,
                        top: shineY,
                        transform: 'translate(-50%, -50%)',
                    }}
                />
            </motion.div>

            {/* Prismatic edge glow */}
            <motion.div
                className="pointer-events-none absolute inset-0 rounded-xl z-10"
                style={{
                    opacity: isPressed ? 1 : 0,
                    boxShadow: `
                        0 0 20px rgba(255, 0, 128, 0.4),
                        0 0 40px rgba(0, 255, 255, 0.3),
                        0 0 60px rgba(128, 0, 255, 0.2)
                    `,
                    transition: 'opacity 0.3s ease',
                }}
            />
        </motion.div>
    );
};
