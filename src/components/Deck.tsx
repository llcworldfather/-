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
                            className={`w-48 h-72 rounded-xl shadow-2xl cursor-pointer hover:-translate-y-12 transition-transform duration-300 relative group overflow-hidden border-2 border-yellow-600/50 bg-slate-900 ${(drawnIndices.includes(i) || drawnIndices.length >= 3) ? 'pointer-events-none' : ''}`}
                            initial={{ opacity: 0, x: -100 }}
                            animate={{
                                x: 0,
                                y: drawnIndices.includes(i) ? -1000 : 0, // Slide up off screen
                                opacity: drawnIndices.includes(i) ? 0 : 1, // Fade out as it goes
                                scale: drawnIndices.includes(i) ? 0.8 : 1, // Shrink slightly
                            }}
                            transition={{ duration: 1.5, ease: "easeInOut", delay: drawnIndices.includes(i) ? 0 : i * 0.02 }}
                            onClick={() => !drawnIndices.includes(i) && drawnIndices.length < 3 && onDraw(i)}
                            whileHover={{ scale: 1.05, zIndex: 100 }}
                        >
                            {/* Dissolve Particles - Rendered ON TOP of card content, independent opacity */}
                            {drawnIndices.includes(i) && (
                                <div className="absolute inset-0 z-50 pointer-events-none">
                                    {[...Array(30)].map((_, p) => ( // Increased to 30 particles
                                        <div
                                            key={p}
                                            className="particle-sparkle"
                                            style={{
                                                top: `${50 + (Math.random() - 0.5) * 40}%`, // Start closer to center
                                                left: `${50 + (Math.random() - 0.5) * 40}%`,
                                                '--tx': `${(Math.random() - 0.5) * 300}px`, // Wider explosion
                                                '--ty': `${(Math.random() - 0.5) * 300}px`,
                                                animationDuration: `${0.6 + Math.random() * 0.4}s`,
                                                animationDelay: `${Math.random() * 0.2}s`
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
                                <div className="absolute inset-2 border border-yellow-600/30 rounded-lg flex items-center justify-center bg-[#1a0b2e]">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/40 via-transparent to-transparent opacity-50"></div>
                                    <div className="w-full h-full opacity-30 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-24 h-24 border-2 border-yellow-600/40 rotate-45 flex items-center justify-center transition-transform duration-700 group-hover:rotate-180">
                                            <div className="w-16 h-16 border border-yellow-600/30 rotate-45"></div>
                                        </div>
                                    </div>
                                    <div className="absolute top-2 bottom-2 left-1/2 w-px bg-gradient-to-b from-transparent via-yellow-600/20 to-transparent"></div>
                                    <div className="absolute left-2 right-2 top-1/2 h-px bg-gradient-to-r from-transparent via-yellow-600/20 to-transparent"></div>
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
