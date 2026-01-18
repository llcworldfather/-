import React, { useEffect, useRef } from 'react';

export const StarryBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        window.addEventListener('resize', resize);
        resize();

        // Mouse state
        let mouse = { x: width / 2, y: height / 2 };
        const handleMouseMove = (e: MouseEvent) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };
        window.addEventListener('mousemove', handleMouseMove);

        // Star Interface
        interface Star {
            x: number;
            y: number;
            size: number;
            opacity: number;
            speed: number;
            depth: number;
            color: string;
        }

        const stars: Star[] = [];
        const numStars = 300; // Increased count
        const colors = ['#ffffff', '#ffe9c4', '#d4f1f9', '#e6e6fa']; // Star colors

        for (let i = 0; i < numStars; i++) {
            const depth = Math.random();
            stars.push({
                x: Math.random() * width,
                y: Math.random() * height,
                size: Math.random() * 2 + (depth * 2), // Bigger stars
                opacity: Math.random(),
                speed: 0.2 + Math.random() * 0.5,
                depth: depth,
                color: colors[Math.floor(Math.random() * colors.length)]
            });
        }

        let shootingStar = {
            x: 0,
            y: 0,
            length: 100,
            speed: 15,
            opacity: 0,
            active: false
        };

        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            // Parallax target
            const targetX = (mouse.x - width / 2) * 0.05;
            const targetY = (mouse.y - height / 2) * 0.05;

            stars.forEach(star => {
                // Parallax movement
                const moveX = targetX * star.depth;
                const moveY = targetY * star.depth;

                // Natural drift
                star.y -= star.speed;

                // Wrap around
                const renderX = (star.x + moveX + width) % width;
                const renderY = (star.y + moveY + height) % height;
                if (renderY < 0) star.y += height; // Reset position effectively

                // Draw Star
                ctx.beginPath();
                ctx.fillStyle = star.color;
                ctx.globalAlpha = star.opacity; // Use globalAlpha for cleaner opacity
                ctx.arc(renderX, renderY, star.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0; // Reset

                // Twinkle
                star.opacity += (Math.random() - 0.5) * 0.05;
                if (star.opacity < 0.1) star.opacity = 0.1;
                if (star.opacity > 1) star.opacity = 1;

                // Helper for position reset check
                if (star.y < -50) {
                    star.y = height + 50;
                    star.x = Math.random() * width;
                }

                // Constellations (Mouse proximity)
                const dx = renderX - mouse.x;
                const dy = renderY - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 150) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(167, 139, 250, ${0.4 * (1 - dist / 150)})`;
                    ctx.lineWidth = 1;
                    ctx.moveTo(renderX, renderY);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.stroke();
                }
            });

            // Shooting Star logic (same as before)
            if (!shootingStar.active && Math.random() < 0.01) { // 1% chance per frame
                shootingStar.active = true;
                shootingStar.x = Math.random() * width;
                shootingStar.y = Math.random() * (height / 2);
                shootingStar.opacity = 1;
            }

            if (shootingStar.active) {
                const tailX = shootingStar.x - shootingStar.length;
                const tailY = shootingStar.y - shootingStar.length;
                const grad = ctx.createLinearGradient(shootingStar.x, shootingStar.y, tailX, tailY);
                grad.addColorStop(0, `rgba(255,255,255,${shootingStar.opacity})`);
                grad.addColorStop(1, 'rgba(255,255,255,0)');

                ctx.beginPath();
                ctx.strokeStyle = grad;
                ctx.lineWidth = 2;
                ctx.moveTo(shootingStar.x, shootingStar.y);
                ctx.lineTo(tailX, tailY);
                ctx.stroke();

                shootingStar.x += shootingStar.speed;
                shootingStar.y += shootingStar.speed;
                shootingStar.opacity -= 0.02;
                if (shootingStar.opacity <= 0) shootingStar.active = false;
            }

            requestAnimationFrame(animate);
        };

        const animationId = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationId);
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
            {/* Deep Space Gradient */}
            {/* Deep Space Gradient - Pure Black/void to remove central glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#050510] via-[#020202] to-[#000000]"></div>

            {/* Canvas */}
            <canvas ref={canvasRef} className="absolute inset-0 opacity-90" />



            {/* Zodiac Rings - Double Layer */}
            {/* Outer Ring */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] opacity-[0.05] animate-[spin_120s_linear_infinite]">
                <svg viewBox="0 0 100 100" className="w-full h-full fill-current text-purple-200">
                    <path d="M50 0 A50 50 0 1 1 49.9 0 Z M50 1 A49 49 0 1 1 49.9 1 Z" /> {/* Thin rim */}
                    {[...Array(12)].map((_, i) => (
                        <text key={i} x="50" y="8" transform={`rotate(${i * 30} 50 50)`} fontSize="4" textAnchor="middle" fontWeight="bold">
                            {['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'][i]}
                        </text>
                    ))}
                </svg>
            </div>
            {/* Inner Ring - Counter Rotation */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-[0.04] animate-[spin_100s_linear_infinite_reverse]">
                <svg viewBox="0 0 100 100" className="w-full h-full fill-current text-amber-100">
                    <circle cx="50" cy="50" r="49" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 2" />
                    <path d="M50 2 L50 15" stroke="currentColor" strokeWidth="0.5" />
                    <path d="M50 85 L50 98" stroke="currentColor" strokeWidth="0.5" />
                    <path d="M2 50 L15 50" stroke="currentColor" strokeWidth="0.5" />
                    <path d="M85 50 L98 50" stroke="currentColor" strokeWidth="0.5" />
                    <rect x="35" y="35" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="0.2" transform="rotate(45 50 50)" />
                </svg>
            </div>

            {/* Floating Runes - Enhanced Visibility */}
            <div className="absolute inset-0">
                <div className="absolute top-1/4 left-1/4 text-2xl text-amber-100/30 font-serif animate-float blur-[1px]">ᚲ</div>
                <div className="absolute bottom-1/3 right-1/4 text-3xl text-purple-200/30 font-serif animate-float-delayed blur-[1px]">ᛃ</div>
                <div className="absolute top-1/2 left-1/5 text-xl text-blue-200/30 font-serif animate-pulse-glow">✧</div>
            </div>
        </div>
    );
};
