import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../i18n/translations';
import type { DrawnCard } from '../utils/tarot';
import { generateReadingImage, extractSummary, downloadImage } from '../utils/generateReadingImage';

interface ReadingDisplayProps {
    reading: string;
    cards: DrawnCard[];
    isReadingComplete: boolean;
    onReset: () => void;
}

export const ReadingDisplay: React.FC<ReadingDisplayProps> = ({ reading, cards, isReadingComplete, onReset }) => {
    const { language } = useLanguage();
    const [isGenerating, setIsGenerating] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel w-full max-w-4xl rounded-2xl p-8 md:p-12 relative overflow-hidden"
        >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>

            <h2 className="text-4xl md:text-5xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-purple-100 to-amber-100 mb-10 flex items-center justify-center gap-4 drop-shadow-sm">
                <span className="text-2xl text-amber-400 animate-pulse">✨</span>
                {t('readingTitle', language)}
                <span className="text-2xl text-amber-400 animate-pulse">✨</span>
            </h2>

            <div className="max-w-none text-slate-200 leading-loose font-serif tracking-wide custom-markdown">
                {reading ? (
                    <ReactMarkdown
                        components={{
                            h1: ({ node, ...props }) => <h1 className="text-3xl font-serif text-amber-200 mb-6 mt-10 border-b border-white/10 pb-2" {...props} />,
                            h2: ({ node, ...props }) => <h2 className="text-2xl font-serif text-purple-200 mb-4 mt-8 flex items-center gap-2" {...props} />,
                            h3: ({ node, ...props }) => <h3 className="text-xl font-serif text-amber-100/90 mb-3 mt-6" {...props} />,
                            h4: ({ node, ...props }) => <h4 className="text-lg font-serif text-purple-100/80 mb-2 mt-4 font-bold" {...props} />,
                            p: ({ node, ...props }) => <p className="mb-6 text-slate-300 leading-relaxed font-light" {...props} />,
                            strong: ({ node, ...props }) => <strong className="text-amber-400 font-semibold" {...props} />,
                            ul: ({ node, ...props }) => <ul className="space-y-2 mb-6 ml-4" {...props} />,
                            li: ({ node, children, ...props }) => (
                                <li className="flex gap-3 text-slate-300" {...props}>
                                    <span className="text-purple-400 mt-1.5 text-xs">✦</span>
                                    <span>{children}</span>
                                </li>
                            ),
                            blockquote: ({ node, ...props }) => (
                                <blockquote className="border-l-2 border-purple-500/50 pl-6 my-6 italic text-purple-100/80 bg-purple-900/20 py-4 pr-4 rounded-r-lg" {...props} />
                            ),
                            hr: ({ node, ...props }) => <hr className="border-white/10 my-8" {...props} />
                        }}
                    >
                        {reading}
                    </ReactMarkdown>
                ) : (
                    <div className="flex flex-col items-center gap-4 text-purple-200/80 py-12">
                        <div className="w-12 h-12 rounded-full border-2 border-t-amber-400 border-r-transparent border-b-purple-400 border-l-transparent animate-spin"></div>
                        <span className="tracking-widest animate-pulse">{t('loading', language)}</span>
                    </div>
                )}
            </div>

            <div className="mt-16 flex flex-col sm:flex-row justify-center items-center gap-4">
                {isReadingComplete && cards.length > 0 && (
                    <button
                        onClick={async () => {
                            setIsGenerating(true);
                            try {
                                const summary = extractSummary(reading);
                                const blobUrl = await generateReadingImage({
                                    cards,
                                    summary,
                                    language,
                                    isDaily: false
                                });
                                const date = new Date().toISOString().split('T')[0];
                                downloadImage(blobUrl, `tarot-reading-${date}.png`);
                            } catch (error) {
                                console.error('Failed to generate image:', error);
                            } finally {
                                setIsGenerating(false);
                            }
                        }}
                        disabled={isGenerating}
                        className="group relative px-10 py-4 rounded-full border border-purple-500/30 hover:border-purple-400/50 bg-purple-500/10 hover:bg-purple-500/20 transition-all duration-500 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1s_infinite]"></div>
                        <span className="flex items-center gap-3 text-sm uppercase tracking-[0.2em] text-purple-200 group-hover:text-purple-100 transition-colors">
                            <span className="transition-transform group-hover:scale-110 duration-500">📷</span>
                            {isGenerating ? t('generatingImage', language) : t('generateImageButton', language)}
                        </span>
                    </button>
                )}
                <button
                    onClick={onReset}
                    className="group relative px-10 py-4 rounded-full border border-white/10 hover:border-amber-500/50 bg-white/5 hover:bg-white/10 transition-all duration-500 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1s_infinite]"></div>
                    <span className="flex items-center gap-3 text-sm uppercase tracking-[0.2em] text-slate-300 group-hover:text-amber-100 transition-colors">
                        <span className="transition-transform group-hover:-rotate-180 duration-500">🔮</span>
                        {t('resetButton', language)}
                    </span>
                </button>
            </div>
        </motion.div>
    );
};
