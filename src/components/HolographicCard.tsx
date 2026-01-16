import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, useSpring, useTransform, useMotionTemplate, AnimatePresence, MotionValue } from 'framer-motion';
import { X } from 'lucide-react';


interface HolographicCardProps {
    children: React.ReactNode;
    className?: string;
    disabled?: boolean;
}

// Long press threshold in milliseconds
const LONG_PRESS_THRESHOLD = 300;

export const HolographicCard: React.FC<HolographicCardProps> = ({
    children,
    className = '',
    disabled = false,
}) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isPressed, setIsPressed] = useState(false);
    const [isGyroActive, setIsGyroActive] = useState(false);
    const [gyroPermissionNeeded, setGyroPermissionNeeded] = useState(false);

    // Focus mode state
    const [isFocusMode, setIsFocusMode] = useState(false);
    const pressStartTime = useRef<number>(0);
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isLongPress = useRef(false);

    // Spring values for smooth animation (normal mode)
    const rotateX = useSpring(0, { stiffness: 300, damping: 30 });
    const rotateY = useSpring(0, { stiffness: 300, damping: 30 });

    // Spring values for focus mode (360° rotation)
    const focusRotateX = useSpring(0, { stiffness: 100, damping: 20 });
    const focusRotateY = useSpring(0, { stiffness: 100, damping: 20 });

    // Create explicit transform string
    const transform = useMotionTemplate`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    const focusTransform = useMotionTemplate`perspective(1200px) rotateX(${focusRotateX}deg) rotateY(${focusRotateY}deg)`;

    // Transform rotation to gradient position for holographic effect
    const gradientX = useTransform(rotateY, [-20, 20], [0, 100]);
    const gradientY = useTransform(rotateX, [-20, 20], [100, 0]);
    const focusGradientX = useTransform(focusRotateY, [-180, 180], [0, 100]);
    const focusGradientY = useTransform(focusRotateX, [-180, 180], [100, 0]);

    // Transform rotation to shine position
    const shineX = useTransform(rotateY, [-20, 20], [-50, 150]);
    const shineY = useTransform(rotateX, [-20, 20], [150, -50]);
    const focusShineX = useTransform(focusRotateY, [-180, 180], [-50, 150]);
    const focusShineY = useTransform(focusRotateX, [-180, 180], [150, -50]);

    // Handle device orientation for gyroscope effect
    const handleDeviceOrientation = useCallback((event: DeviceOrientationEvent) => {
        const { beta, gamma } = event;
        if (beta === null || gamma === null) return;

        const maxRotation = 15;

        const rotateXValue = Math.max(-maxRotation, Math.min(maxRotation, (beta - 45) / 4));
        const rotateYValue = Math.max(-maxRotation, Math.min(maxRotation, gamma / 4));

        rotateX.set(rotateXValue);
        rotateY.set(rotateYValue);
    }, [rotateX, rotateY]);

    // Request gyroscope permission (needed for iOS 13+)
    const requestGyroPermission = useCallback(async () => {
        const DeviceOrientationEventiOS = DeviceOrientationEvent as unknown as {
            requestPermission?: () => Promise<'granted' | 'denied'>;
        };

        if (typeof DeviceOrientationEventiOS.requestPermission === 'function') {
            try {
                const permission = await DeviceOrientationEventiOS.requestPermission();
                if (permission === 'granted') {
                    window.addEventListener('deviceorientation', handleDeviceOrientation);
                    setIsGyroActive(true);
                    setGyroPermissionNeeded(false);
                }
            } catch (error) {
                console.error('Gyroscope permission denied:', error);
            }
        }
    }, [handleDeviceOrientation]);

    // Initialize gyroscope on mount
    useEffect(() => {
        if (disabled) return;

        if (!window.DeviceOrientationEvent) return;

        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (!isTouchDevice) return;

        const DeviceOrientationEventiOS = DeviceOrientationEvent as unknown as {
            requestPermission?: () => Promise<'granted' | 'denied'>;
        };

        if (typeof DeviceOrientationEventiOS.requestPermission === 'function') {
            setGyroPermissionNeeded(true);
        } else {
            window.addEventListener('deviceorientation', handleDeviceOrientation);
            setIsGyroActive(true);
        }

        return () => {
            window.removeEventListener('deviceorientation', handleDeviceOrientation);
        };
    }, [disabled, handleDeviceOrientation]);

    const updateRotation = useCallback((clientX: number, clientY: number) => {
        if (!cardRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const maxRotation = 15;
        const rotateYValue = -((clientX - centerX) / (rect.width / 2)) * maxRotation;
        const rotateXValue = ((clientY - centerY) / (rect.height / 2)) * maxRotation;

        rotateX.set(Math.max(-maxRotation, Math.min(maxRotation, rotateXValue)));
        rotateY.set(Math.max(-maxRotation, Math.min(maxRotation, rotateYValue)));
    }, [rotateX, rotateY]);

    // Focus mode drag handling
    const focusDragStart = useRef<{ x: number; y: number; rotX: number; rotY: number } | null>(null);

    const handleFocusDragStart = useCallback((clientX: number, clientY: number) => {
        focusDragStart.current = {
            x: clientX,
            y: clientY,
            rotX: focusRotateX.get(),
            rotY: focusRotateY.get(),
        };
    }, [focusRotateX, focusRotateY]);

    const handleFocusDragMove = useCallback((clientX: number, clientY: number) => {
        if (!focusDragStart.current) return;

        const deltaX = clientX - focusDragStart.current.x;
        const deltaY = clientY - focusDragStart.current.y;

        // Sensitivity factor for rotation
        const sensitivity = 0.5;

        focusRotateY.set(focusDragStart.current.rotY + deltaX * sensitivity);
        focusRotateX.set(focusDragStart.current.rotX - deltaY * sensitivity);
    }, [focusRotateX, focusRotateY]);

    const handleFocusDragEnd = useCallback(() => {
        focusDragStart.current = null;
    }, []);

    // Global pointer events for normal mode
    useEffect(() => {
        if (isGyroActive || isFocusMode) return;
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
    }, [isPressed, disabled, isGyroActive, isFocusMode, updateRotation, rotateX, rotateY]);

    // Handle pointer down - start long press timer
    const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        if (disabled || isFocusMode) return;

        if (gyroPermissionNeeded) {
            requestGyroPermission();
            return;
        }

        if (isGyroActive) return;

        e.preventDefault();
        pressStartTime.current = Date.now();
        isLongPress.current = false;

        // Start long press timer
        longPressTimer.current = setTimeout(() => {
            isLongPress.current = true;
            setIsPressed(true);
            updateRotation(e.clientX, e.clientY);
        }, LONG_PRESS_THRESHOLD);
    }, [disabled, isFocusMode, gyroPermissionNeeded, isGyroActive, requestGyroPermission, updateRotation]);

    // Handle pointer up - check if short or long press
    const handlePointerUp = useCallback((_e: React.PointerEvent<HTMLDivElement>) => {
        if (disabled || isFocusMode) return;

        // Clear long press timer
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }

        const pressDuration = Date.now() - pressStartTime.current;

        // If it was a short press (not a long press), enter focus mode
        if (!isLongPress.current && pressDuration < LONG_PRESS_THRESHOLD) {
            setIsFocusMode(true);
            focusRotateX.set(0);
            focusRotateY.set(0);
        }

        setIsPressed(false);
        rotateX.set(0);
        rotateY.set(0);
    }, [disabled, isFocusMode, focusRotateX, focusRotateY, rotateX, rotateY]);

    // Close focus mode
    const closeFocusMode = useCallback(() => {
        setIsFocusMode(false);
        focusRotateX.set(0);
        focusRotateY.set(0);
    }, [focusRotateX, focusRotateY]);

    // Prevent body scroll when focus mode is open
    useEffect(() => {
        if (isFocusMode) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isFocusMode]);

    if (disabled) {
        return <div className={className}>{children}</div>;
    }

    // Holographic effect layers component (reusable)
    const HolographicEffects = ({
        isActive,
        gX,
        gY,
        sX,
        sY
    }: {
        isActive: boolean;
        gX: MotionValue<number>;
        gY: MotionValue<number>;
        sX: MotionValue<number>;
        sY: MotionValue<number>;
    }) => (
        <>
            {/* Holographic rainbow overlay */}
            <motion.div
                className="holographic-overlay pointer-events-none absolute inset-0 rounded-xl z-20"
                style={{
                    opacity: isActive ? 0.7 : 0,
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
                    backgroundPositionX: gX,
                    backgroundPositionY: gY,
                    mixBlendMode: 'color-dodge',
                }}
            />

            {/* Shine/glare effect */}
            <motion.div
                className="holographic-shine pointer-events-none absolute inset-0 rounded-xl z-30 overflow-hidden"
                style={{ opacity: isActive ? 1 : 0 }}
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
                        left: sX,
                        top: sY,
                        transform: 'translate(-50%, -50%)',
                    }}
                />
            </motion.div>

            {/* Prismatic edge glow */}
            <motion.div
                className="pointer-events-none absolute inset-0 rounded-xl z-10"
                style={{
                    opacity: isActive ? 1 : 0,
                    boxShadow: `
                        0 0 20px rgba(255, 0, 128, 0.4),
                        0 0 40px rgba(0, 255, 255, 0.3),
                        0 0 60px rgba(128, 0, 255, 0.2)
                    `,
                    transition: 'opacity 0.3s ease',
                }}
            />
        </>
    );

    return (
        <>
            {/* Normal card view */}
            <motion.div
                ref={cardRef}
                className={`relative cursor-grab active:cursor-grabbing touch-none ${className}`}
                style={{
                    transformStyle: 'preserve-3d',
                    transform,
                }}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerCancel={() => {
                    if (longPressTimer.current) {
                        clearTimeout(longPressTimer.current);
                        longPressTimer.current = null;
                    }
                    setIsPressed(false);
                }}
            >
                <div className="relative z-10">
                    {children}
                </div>

                <HolographicEffects
                    isActive={isPressed || isGyroActive}
                    gX={gradientX}
                    gY={gradientY}
                    sX={shineX}
                    sY={shineY}
                />
            </motion.div>

            {/* Focus mode modal */}
            <AnimatePresence>
                {isFocusMode && (
                    <motion.div
                        className="fixed inset-0 z-[1000] flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Backdrop */}
                        <motion.div
                            className="absolute inset-0 bg-black/95 backdrop-blur-md"
                            onClick={closeFocusMode}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        />

                        {/* Close button */}
                        <button
                            onClick={closeFocusMode}
                            className="absolute top-6 right-6 z-[1001] p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>

                        {/* Hint text */}
                        <motion.p
                            className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 text-sm tracking-wider z-[1001]"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            拖动卡牌 360° 旋转 | Drag to rotate
                        </motion.p>

                        {/* Enlarged card with 360° rotation - TRUE 3D DUAL FACE */}
                        <motion.div
                            className="relative cursor-grab active:cursor-grabbing touch-none z-[1001]"
                            style={{
                                transformStyle: 'preserve-3d',
                                transform: focusTransform,
                                scale: 1.3,
                            }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onPointerDown={(e) => {
                                e.preventDefault();
                                handleFocusDragStart(e.clientX, e.clientY);
                            }}
                            onPointerMove={(e) => {
                                if (focusDragStart.current) {
                                    handleFocusDragMove(e.clientX, e.clientY);
                                }
                            }}
                            onPointerUp={handleFocusDragEnd}
                            onPointerLeave={handleFocusDragEnd}
                            onPointerCancel={handleFocusDragEnd}
                        >
                            {/* FRONT FACE - Card Content */}
                            <div
                                className="relative z-10"
                                style={{
                                    backfaceVisibility: 'hidden',
                                    WebkitBackfaceVisibility: 'hidden',
                                }}
                            >
                                {children}
                            </div>

                            {/* BACK FACE - Card Back Image */}
                            <div
                                className="absolute inset-0 rounded-xl overflow-hidden"
                                style={{
                                    backfaceVisibility: 'hidden',
                                    WebkitBackfaceVisibility: 'hidden',
                                    transform: 'rotateY(180deg)',
                                }}
                            >
                                {/* Card back image */}
                                <img
                                    src="/cards/back.png"
                                    alt="Card Back"
                                    className="w-full h-full object-cover"
                                    style={{
                                        // Scale up slightly to crop out black edges
                                        transform: 'scale(1.15)',
                                    }}
                                />

                                {/* Holographic overlay on back */}
                                <motion.div
                                    className="absolute inset-0 opacity-30 pointer-events-none"
                                    style={{
                                        background: `linear-gradient(
                                            135deg,
                                            transparent 0%,
                                            rgba(255, 0, 128, 0.3) 25%,
                                            rgba(0, 255, 255, 0.3) 50%,
                                            rgba(255, 255, 0, 0.3) 75%,
                                            transparent 100%
                                        )`,
                                        backgroundSize: '200% 200%',
                                        backgroundPositionX: focusGradientX,
                                        backgroundPositionY: focusGradientY,
                                        mixBlendMode: 'color-dodge',
                                    }}
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
