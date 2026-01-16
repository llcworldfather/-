import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import type { DrawnCard } from '../utils/tarot';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../i18n/translations';
import { generateReadingImage, extractSummary, downloadImage } from '../utils/generateReadingImage';
import { HolographicCard } from './HolographicCard';

interface DailyCardRevealProps {
    card: DrawnCard | null;
    reading: string;
    isShuffling: boolean;
    isReadingComplete: boolean;
    onReset: () => void;
}

export const DailyCardReveal: React.FC<DailyCardRevealProps> = ({
    card,
    reading,
    isShuffling,
    isReadingComplete,
    onReset
}) => {
    const { language } = useLanguage();
    const [isFlipped, setIsFlipped] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    // Trigger flip after card flies in
    useEffect(() => {
        if (card && !isShuffling) {
            const timer = setTimeout(() => {
                setIsFlipped(true);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [card, isShuffling]);

    return (
        <div className="flex flex-col items-center w-full max-w-4xl">
            {/* Shuffling Animation */}
            <AnimatePresence>
                {isShuffling && (
                    <motion.div
                        className="relative w-48 h-72"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                    >
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
                                </div>
                            </motion.div>
                        ))}
                        <div className="absolute top-full mt-8 w-full text-center">
                            <p className="text-purple-300 font-serif tracking-widest animate-pulse">{t('shuffling', language)}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Card Reveal */}
            <AnimatePresence>
                {card && !isShuffling && (
                    <motion.div
                        className="flex flex-col items-center"
                        initial={{ y: -200, opacity: 0, scale: 0.5 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        transition={{ type: "spring", damping: 15, stiffness: 100 }}
                    >
                        {/* Title */}
                        <motion.div
                            className="text-amber-100/80 font-serif mb-6 text-xl tracking-[0.3em] uppercase flex items-center gap-3"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_currentColor]"></span>
                            {t('dailyCardTitle', language)}
                            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_currentColor]"></span>
                        </motion.div>

                        {/* Card Component */}
                        <HolographicCard className="w-56 h-80 md:w-64 md:h-96 mb-12">
                            <div
                                className="relative w-full h-full cursor-pointer"
                            >
                                <motion.div
                                    className="w-full h-full relative"
                                    style={{ transformStyle: 'preserve-3d' }}
                                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                                    transition={{ duration: 0.8, ease: "easeInOut" }}
                                >
                                    {/* Card Back */}
                                    <div
                                        className="absolute inset-0 rounded-xl shadow-2xl border-4 border-yellow-700/50 overflow-hidden"
                                        style={{ backfaceVisibility: 'hidden' }}
                                    >
                                        <img
                                            src="/cards/back.png"
                                            alt="Card Back"
                                            className="w-full h-full object-cover"
                                            style={{ transform: 'scale(1.15)' }}
                                        />
                                    </div>

                                    {/* Card Front */}
                                    <div
                                        className="absolute inset-0 rounded-xl shadow-2xl border-4 border-yellow-700/50 bg-slate-900 overflow-hidden flex flex-col holographic-idle-shimmer"
                                        style={{
                                            backfaceVisibility: 'hidden',
                                            transform: 'rotateY(180deg)'
                                        }}
                                    >
                                        <div className="flex-1 relative overflow-hidden bg-black">
                                            <img
                                                src={card.image}
                                                alt={card.name}
                                                className={`w-full h-full object-fill ${card.isReversed ? 'rotate-180' : ''}`}
                                            />
                                        </div>
                                        <div className="h-16 bg-slate-950 border-t border-white/10 flex flex-col items-center justify-center text-center p-2">
                                            <h2 className="text-lg font-serif text-yellow-100/90">{language === 'zh' ? card.nameCn : card.name}</h2>
                                            <span className={`text-sm font-serif ${card.isReversed ? 'text-rose-400/80' : 'text-emerald-400/80'}`}>
                                                {card.isReversed ? t('reversed', language) : t('upright', language)}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Glow Effect */}
                                <div className="absolute inset-0 rounded-xl shadow-[0_0_60px_rgba(168,85,247,0.3)] pointer-events-none"></div>
                            </div>
                        </HolographicCard>

                        {/* Reading Display */}
                        {reading && (
                            <motion.div
                                className="w-full max-w-2xl mt-24" // ★★★ 这里改成了 mt-24 (96px)，拉大间距 ★★★
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.5 }}
                            >
                                <div className="relative bg-slate-900/70 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-purple-500/20 shadow-xl">
                                    {/* Floating Pill Label */}
                                    <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 z-10">
                                        <div className="px-6 py-1.5 bg-gradient-to-r from-amber-600 to-purple-600 rounded-full shadow-[0_0_15px_rgba(217,119,6,0.3)] border border-amber-500/30">
                                            <span className="text-xs font-serif tracking-widest text-white uppercase whitespace-nowrap drop-shadow-sm">
                                                {t('dailyInsight', language)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Markdown Content */}
                                    <div className="max-w-none text-slate-200 leading-loose font-serif tracking-wide custom-markdown pt-2">
                                        <ReactMarkdown
                                            components={{
                                                h1: ({ node, ...props }) => <h1 className="text-2xl font-serif text-amber-200 mb-4 mt-6 border-b border-white/10 pb-2" {...props} />,
                                                h2: ({ node, ...props }) => <h2 className="text-xl font-serif text-purple-200 mb-3 mt-5 flex items-center gap-2" {...props} />,
                                                h3: ({ node, ...props }) => <h3 className="text-lg font-serif text-amber-100/90 mb-2 mt-4" {...props} />,
                                                h4: ({ node, ...props }) => <h4 className="text-base font-serif text-purple-100/80 mb-2 mt-3 font-bold" {...props} />,
                                                p: ({ node, ...props }) => <p className="mb-4 text-slate-300 leading-relaxed font-light" {...props} />,
                                                strong: ({ node, ...props }) => <strong className="text-amber-400 font-semibold" {...props} />,
                                                ul: ({ node, ...props }) => <ul className="space-y-2 mb-4 ml-4" {...props} />,
                                                li: ({ node, children, ...props }) => (
                                                    <li className="flex gap-3 text-slate-300" {...props}>
                                                        <span className="text-purple-400 mt-1.5 text-xs">✦</span>
                                                        <span>{children}</span>
                                                    </li>
                                                ),
                                                blockquote: ({ node, ...props }) => (
                                                    <blockquote className="border-l-2 border-purple-500/50 pl-4 my-4 italic text-purple-100/80 bg-purple-900/20 py-3 pr-4 rounded-r-lg" {...props} />
                                                ),
                                                hr: ({ node, ...props }) => <hr className="border-white/10 my-6" {...props} />
                                            }}
                                        >
                                            {reading}
                                        </ReactMarkdown>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-4">
                                    {isReadingComplete && (
                                        <motion.button
                                            onClick={async () => {
                                                if (!card) return;
                                                setIsGenerating(true);
                                                try {
                                                    const summary = extractSummary(reading);
                                                    const blobUrl = await generateReadingImage({
                                                        cards: [card],
                                                        summary,
                                                        language,
                                                        isDaily: true
                                                    });
                                                    const date = new Date().toISOString().split('T')[0];
                                                    downloadImage(blobUrl, `daily-tarot-${date}.png`);
                                                } catch (error) {
                                                    console.error('Failed to generate image:', error);
                                                } finally {
                                                    setIsGenerating(false);
                                                }
                                            }}
                                            disabled={isGenerating}
                                            className="px-8 py-3 bg-amber-600/80 hover:bg-amber-500 text-white rounded-full font-serif tracking-widest transition-all shadow-lg hover:shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.5 }}
                                        >
                                            <span>📷</span>
                                            {isGenerating ? t('generatingImage', language) : t('generateImageButton', language)}
                                        </motion.button>
                                    )}
                                    <motion.button
                                        onClick={onReset}
                                        className="px-8 py-3 bg-purple-600/80 hover:bg-purple-500 text-white rounded-full font-serif tracking-widest transition-all shadow-lg hover:shadow-purple-500/30"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 2 }}
                                    >
                                        {t('backButton', language)}
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};