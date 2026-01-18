import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { DrawnCard } from '../utils/tarot';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../i18n/translations';
import { HolographicCard } from './HolographicCard';

export type ReadingMode = 'normal' | 'roast' | 'crazy';

interface CardRevealProps {
    cards: DrawnCard[];
    onComplete: (mode: ReadingMode) => void;
}

export const CardReveal: React.FC<CardRevealProps> = ({ cards, onComplete }) => {
    const { language } = useLanguage();
    const positions = [t('past', language), t('present', language), t('future', language)];

    // 翻牌音效
    const flipSoundRef = useRef<HTMLAudioElement | null>(null);

    // 初始化翻牌音效
    useEffect(() => {
        flipSoundRef.current = new Audio('/audio/card-flip.wav');
        flipSoundRef.current.preload = 'auto';
        return () => {
            if (flipSoundRef.current) {
                flipSoundRef.current.pause();
                flipSoundRef.current = null;
            }
        };
    }, []);

    // 播放翻牌音效，配合卡牌翻转动画的延迟
    useEffect(() => {
        const playFlipSound = () => {
            if (flipSoundRef.current) {
                // 克隆音频元素以便同时播放多个音效
                const sound = flipSoundRef.current.cloneNode() as HTMLAudioElement;
                sound.play().catch(err => {
                    console.warn('无法播放翻牌音效:', err);
                });
            }
        };

        // 为每张卡牌设置翻转音效的定时器（与动画延迟同步）
        const timers = cards.map((_, index) => {
            return setTimeout(() => {
                playFlipSound();
            }, index * 500); // 与动画 delay: index * 0.5 同步
        });

        return () => {
            timers.forEach(timer => clearTimeout(timer));
        };
    }, [cards]);

    return (
        <div className="flex flex-col items-center w-full max-w-6xl">
            <div className="flex flex-col md:flex-row gap-4 md:gap-8 mb-24 items-center justify-center w-full">
                {cards.map((card, index) => {
                    const position = positions[index];
                    const cardName = language === 'zh' ? card.nameCn : card.name;
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
                            <HolographicCard className="w-48 h-72 md:w-56 md:h-80">
                                <div className="relative w-full h-full [transform-style:preserve-3d] transition-all duration-700 animate-[flip_1s_ease_forwards] shadow-2xl" style={{ animationDelay: `${index * 0.5}s` }}>
                                    {/* Card Back - visible initially */}
                                    <div
                                        className="absolute inset-0 w-full h-full rounded-xl border-4 border-yellow-700/50 shadow-[0_0_30px_rgba(234,179,8,0.15)] overflow-hidden"
                                        style={{ backfaceVisibility: 'hidden' }}
                                    >
                                        <img
                                            src="/cards/back.png"
                                            alt="Card Back"
                                            className="w-full h-full object-cover"
                                            style={{ transform: 'scale(1.15)' }}
                                        />
                                    </div>
                                    {/* Card Front - visible after flip */}
                                    <div
                                        className="absolute inset-0 w-full h-full bg-slate-900 rounded-xl border-4 border-yellow-700/50 shadow-[0_0_30px_rgba(234,179,8,0.15)] overflow-hidden flex flex-col holographic-idle-shimmer"
                                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                                    >
                                        <div className="flex-1 relative overflow-hidden bg-black">
                                            <img
                                                src={card.image}
                                                alt={card.name}
                                                className={`w-full h-full object-fill ${card.isReversed ? 'rotate-180' : ''}`}
                                            />
                                        </div>
                                        <div className="h-14 bg-slate-950 border-t border-white/10 flex flex-col items-center justify-center text-center p-1">
                                            <h2 className="text-base font-serif text-yellow-100/90">{cardName}</h2>
                                            <span className={`text-xs font-serif ${card.isReversed ? 'text-rose-400/80' : 'text-emerald-400/80'}`}>
                                                {card.isReversed ? t('reversed', language) : t('upright', language)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </HolographicCard>
                        </motion.div>
                    );
                })}
            </div>

            {/* Three button options: Normal, Roast, and Crazy */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.5 }}
                className="flex flex-col sm:flex-row gap-4 mt-12"
            >
                <button
                    onClick={() => onComplete('normal')}
                    className="relative z-50 px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-full font-serif tracking-widest transition-all shadow-lg hover:shadow-purple-500/30 animate-pulse"
                >
                    ✨ {t('interpretButton', language)}
                </button>
                <button
                    onClick={() => onComplete('roast')}
                    className="relative z-50 px-8 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-full font-serif tracking-widest transition-all shadow-lg hover:shadow-orange-500/30"
                >
                    {t('roastButton', language)}
                </button>
                <button
                    onClick={() => onComplete('crazy')}
                    className="relative z-50 px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full font-serif tracking-widest transition-all shadow-lg hover:shadow-cyan-500/30"
                >
                    {t('crazyButton', language)}
                </button>
            </motion.div>
        </div>
    );
};
