import React from 'react';
import { motion } from 'framer-motion';

interface DeckProps {
    stage: 'shuffling' | 'drawing';
    onDraw: (index?: number) => void;
    drawnIndices?: number[];
}

export const Deck: React.FC<DeckProps> = ({ stage, onDraw, drawnIndices = [] }) => {
    return (
        <div className="relative w-full h-[500px] flex items-center justify-center perspective-1000">
            {stage === 'shuffling' && (
                <div className="relative w-48 h-72">
                    {[...Array(5)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute inset-0 rounded-xl shadow-2xl backface-hidden overflow-hidden border-2 border-yellow-600/50 bg-slate-900"
                            initial={{ x: 0, y: 0, rotate: 0 }}
                            animate={{
                                x: [0, 50, -50, 0],
                                rotate: [0, 5, -5, 0],
                                y: [0, -10, 0]
                            }}
                            transition={{
                                repeat: Infinity,
                                duration: 0.5,
                                delay: i * 0.05,
                                repeatType: "mirror"
                            }}
                            style={{ zIndex: i }}
                        >
                            {/* Card Back Design */}
                            <div className="absolute inset-2 border border-yellow-600/30 rounded-lg flex items-center justify-center bg-[#1a0b2e]">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/40 via-transparent to-transparent opacity-50"></div>
                                <div className="w-full h-full opacity-30 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-24 h-24 border-2 border-yellow-600/40 rotate-45 flex items-center justify-center">
                                        <div className="w-16 h-16 border border-yellow-600/30 rotate-45"></div>
                                    </div>
                                </div>
                                <div className="absolute top-2 bottom-2 left-1/2 w-px bg-gradient-to-b from-transparent via-yellow-600/20 to-transparent"></div>
                                <div className="absolute left-2 right-2 top-1/2 h-px bg-gradient-to-r from-transparent via-yellow-600/20 to-transparent"></div>
                            </div>
                        </motion.div>
                    ))}
                    <div className="absolute top-full mt-8 w-full text-center">
                        <p className="text-purple-300 font-serif tracking-widest animate-pulse">洗牌中...</p>
                    </div>
                </div>
            )}

            {stage === 'drawing' && (
                <div className="flex justify-center -space-x-48 hover:-space-x-32 transition-all duration-500 px-4">
                    {[...Array(22)].map((_, i) => (
                        <motion.div
                            key={i}
                            className={`w-48 h-72 rounded-xl shadow-2xl cursor-pointer hover:-translate-y-12 hover:shadow-[0_0_40px_rgba(168,85,247,0.6),0_0_60px_rgba(251,191,36,0.3)] transition-all duration-300 relative group overflow-hidden border-2 border-yellow-600/50 hover:border-amber-400/80 bg-slate-900 ${(drawnIndices.includes(i) || drawnIndices.length >= 3) ? 'pointer-events-none' : ''}`}
                            initial={{ opacity: 0, x: -100 }}
                            animate={{
                                x: 0,
                                y: drawnIndices.includes(i) ? -500 : 0,
                                opacity: drawnIndices.includes(i) ? 0 : 1,
                                scale: drawnIndices.includes(i) ? 0.3 : 1,
                                rotate: drawnIndices.includes(i) ? 15 : 0,
                                zIndex: drawnIndices.includes(i) ? 200 : 1, // Put selected card on top
                            }}
                            transition={{
                                duration: drawnIndices.includes(i) ? 2 : 0.5,
                                ease: drawnIndices.includes(i) ? [0.4, 0, 0.2, 1] : "easeInOut",
                                delay: drawnIndices.includes(i) ? 0 : i * 0.02
                            }}
                            onClick={() => !drawnIndices.includes(i) && drawnIndices.length < 3 && onDraw(i)}
                            whileHover={{ scale: 1.05, zIndex: 100 }}
                        >
                            {/* Selection Flash - Bright Glow Effect */}
                            {drawnIndices.includes(i) && (
                                <motion.div
                                    className="absolute inset-0 z-40 rounded-xl pointer-events-none"
                                    initial={{ opacity: 0, boxShadow: '0 0 0px rgba(251,191,36,0)' }}
                                    animate={{
                                        opacity: [0, 1, 0],
                                        boxShadow: [
                                            '0 0 0px rgba(251,191,36,0)',
                                            '0 0 80px rgba(251,191,36,0.9), 0 0 120px rgba(168,85,247,0.7)',
                                            '0 0 0px rgba(251,191,36,0)'
                                        ]
                                    }}
                                    transition={{ duration: 1.2, ease: "easeOut" }}
                                />
                            )}

                            {/* Dissolve Particles - More Visible */}
                            {drawnIndices.includes(i) && (
                                <div className="absolute inset-0 z-50 pointer-events-none">
                                    {[...Array(50)].map((_, p) => (
                                        <div
                                            key={p}
                                            className="particle-sparkle"
                                            style={{
                                                top: `${50 + (Math.random() - 0.5) * 60}%`,
                                                left: `${50 + (Math.random() - 0.5) * 60}%`,
                                                '--tx': `${(Math.random() - 0.5) * 400}px`,
                                                '--ty': `${(Math.random() - 0.5) * 400}px`,
                                                animationDuration: `${0.8 + Math.random() * 0.6}s`,
                                                animationDelay: `${Math.random() * 0.3}s`,
                                                width: `${4 + Math.random() * 4}px`,
                                                height: `${4 + Math.random() * 4}px`,
                                            } as React.CSSProperties}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Card Content Wrapper - Handles Dissolve */}
                            <motion.div
                                className="w-full h-full"
                                animate={{
                                    opacity: drawnIndices.includes(i) ? 0 : 1,
                                    filter: "none"
                                }}
                                transition={{ duration: 1.5 }}
                            >
                                {/* Card Back Design */}
                                <div className="absolute inset-2 border border-yellow-600/30 rounded-lg flex items-center justify-center bg-[#1a0b2e] overflow-hidden">
                                    {/* Base radial glow */}
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/40 via-transparent to-transparent opacity-50"></div>

                                    {/* Stardust texture */}
                                    <div className="w-full h-full opacity-30 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>

                                    {/* Corner Ornaments */}
                                    <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-amber-500/30 rounded-tl-sm"></div>
                                    <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-amber-500/30 rounded-tr-sm"></div>
                                    <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-amber-500/30 rounded-bl-sm"></div>
                                    <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-amber-500/30 rounded-br-sm"></div>

                                    {/* Outer decorative ring */}
                                    <div className="absolute inset-6 border border-purple-500/20 rounded-md"></div>

                                    {/* Mystical symbols in corners */}
                                    <span className="absolute top-5 left-5 text-amber-400/20 text-xs font-serif">✧</span>
                                    <span className="absolute top-5 right-5 text-amber-400/20 text-xs font-serif">✧</span>
                                    <span className="absolute bottom-5 left-5 text-amber-400/20 text-xs font-serif">✧</span>
                                    <span className="absolute bottom-5 right-5 text-amber-400/20 text-xs font-serif">✧</span>

                                    {/* Central diamond design */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-24 h-24 border-2 border-yellow-600/40 rotate-45 flex items-center justify-center transition-transform duration-700 group-hover:rotate-180">
                                            <div className="w-16 h-16 border border-yellow-600/30 rotate-45"></div>
                                        </div>
                                    </div>

                                    {/* Decorative circles */}
                                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-3 h-3 border border-purple-400/20 rounded-full"></div>
                                    <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-3 h-3 border border-purple-400/20 rounded-full"></div>

                                    {/* Vertical and horizontal lines */}
                                    <div className="absolute top-2 bottom-2 left-1/2 w-px bg-gradient-to-b from-transparent via-yellow-600/20 to-transparent"></div>
                                    <div className="absolute left-2 right-2 top-1/2 h-px bg-gradient-to-r from-transparent via-yellow-600/20 to-transparent"></div>

                                    {/* Rune symbols on sides */}
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-300/15 text-lg font-serif">ᚲ</span>
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-300/15 text-lg font-serif">ᛃ</span>

                                    {/* Top and bottom mystical text */}
                                    <span className="absolute top-8 left-1/2 -translate-x-1/2 text-amber-300/15 text-[8px] tracking-[0.3em] font-serif">ARCANA</span>
                                    <span className="absolute bottom-8 left-1/2 -translate-x-1/2 text-amber-300/15 text-[8px] tracking-[0.3em] font-serif">MYSTIC</span>
                                </div>

                                <div className="absolute inset-0 bg-purple-500/0 group-hover:bg-purple-500/10 transition-colors duration-300"></div>
                            </motion.div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};
