import React from 'react';
import { motion } from 'framer-motion';
import type { DrawnCard } from '../utils/tarot';

interface CardRevealProps {
    cards: DrawnCard[];
    onComplete: () => void;
}

export const CardReveal: React.FC<CardRevealProps> = ({ cards, onComplete }) => {
    // Using simplified staggered animation for 3 cards
    return (
        <div className="flex flex-col items-center w-full max-w-6xl">
            <div className="flex flex-col md:flex-row gap-4 md:gap-8 mb-8 items-center justify-center w-full">
                {cards.map((card, index) => {
                    const position = ['过去', '现在', '未来'][index];
                    return (
                        <motion.div
                            key={card.id}
                            className="flex flex-col items-center group perspective-1000"
                            initial={{ scale: 0.8, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.5, type: "spring", damping: 12 }}
                        >
                            <div className="text-amber-100/80 font-serif mb-4 text-base tracking-[0.2em] uppercase flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-amber-400 shadow-[0_0_5px_currentColor]"></span>
                                {position}
                                <span className="w-1 h-1 rounded-full bg-amber-400 shadow-[0_0_5px_currentColor]"></span>
                            </div>
                            <div className="relative w-48 h-72 md:w-56 md:h-80 [transform-style:preserve-3d] transition-all duration-700 animate-[flip_1s_ease_forwards] shadow-2xl" style={{ animationDelay: `${index * 0.5}s` }}>
                                <div className="absolute inset-0 w-full h-full bg-slate-900 rounded-xl border-4 border-yellow-700/50 shadow-[0_0_30px_rgba(234,179,8,0.15)] overflow-hidden flex flex-col" style={{ transform: 'rotateY(180deg)' }}>
                                    {/* Card Back (visible before flip due to preserve-3d) - Applied same design as Deck */}
                                    <div className="absolute inset-0 backface-hidden flex items-center justify-center bg-[#1a0b2e] z-[-1]" style={{ transform: 'rotateY(180deg)' }}>
                                        <div className="absolute inset-2 border border-yellow-600/30 rounded-lg flex items-center justify-center">
                                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/40 via-transparent to-transparent opacity-50"></div>
                                            <div className="w-full h-full opacity-30 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
                                            <div className="w-24 h-24 border-2 border-yellow-600/40 rotate-45 flex items-center justify-center">
                                                <div className="w-16 h-16 border border-yellow-600/30 rotate-45"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 relative overflow-hidden bg-black">
                                        <img
                                            src={card.image}
                                            alt={card.name}
                                            className={`w-full h-full object-fill opacity-0 animate-[fade-in_1s_ease_forwards] ${card.isReversed ? 'rotate-180' : ''}`}
                                            style={{ animationDelay: `${1 + index * 0.5}s` }}
                                        />
                                    </div>
                                    <div className="h-14 bg-slate-950 border-t border-white/10 flex flex-col items-center justify-center text-center p-1">
                                        <h2 className="text-base font-serif text-yellow-100/90">{card.nameCn}</h2>
                                        <span className={`text-xs font-serif ${card.isReversed ? 'text-rose-400/80' : 'text-emerald-400/80'}`}>
                                            {card.isReversed ? '逆位' : '正位'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <motion.button
                onClick={onComplete}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.5 }}
                className="mt-8 px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-full font-serif tracking-widest transition-all shadow-lg hover:shadow-purple-500/30 animate-pulse"
            >
                解读牌意
            </motion.button>
        </div>
    );
};

