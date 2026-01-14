import React from 'react';
import { Sparkles, Sun } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../i18n/translations';

interface WelcomeScreenProps {
    question: string;
    setQuestion: (q: string) => void;
    onStart: () => void;
    onDailyCard: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ question, setQuestion, onStart, onDailyCard }) => {
    const { language } = useLanguage();

    return (
        <div className="space-y-12 animate-fade-in flex flex-col items-center w-full max-w-2xl px-6 relative z-10">
            {/* Title Section */}
            <div className="relative text-center">
                <h1 className="text-6xl md:text-8xl font-serif text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-purple-200 to-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] z-10 relative tracking-wider">
                    {t('title', language)}
                </h1>
                <div className="absolute -top-6 -right-8 animate-float">
                    <Sparkles className="text-amber-200 w-10 h-10 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                </div>
                <div className="absolute -bottom-4 -left-8 animate-float" style={{ animationDelay: '2s' }}>
                    <Sparkles className="text-purple-300 w-6 h-6 filter drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]" />
                </div>
            </div>

            <p className="text-xl md:text-2xl text-purple-100/90 font-serif italic text-center leading-relaxed tracking-wide drop-shadow-md">
                {language === 'zh'
                    ? <>"向星辰低语你的困惑，<br />让古老的智慧指引方向..."</>
                    : <>"Whisper your doubts to the stars,<br />let ancient wisdom guide your way..."</>
                }
            </p>

            {/* Input Section */}
            <div className="w-full space-y-4">
                <div className="relative group">
                    <input
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder={t('inputPlaceholder', language)}
                        className="glass-input relative w-full rounded-full px-8 py-5 text-center text-lg md:text-xl font-serif shadow-inner"
                        onKeyDown={(e) => e.key === 'Enter' && question.trim() && onStart()}
                    />
                </div>

                <button
                    onClick={onStart}
                    disabled={!question.trim()}
                    className="w-full relative group overflow-hidden rounded-full py-4 px-8 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 via-purple-800 to-indigo-900 opacity-80 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
                    <div className="absolute inset-0 border border-white/10 rounded-full group-hover:border-purple-400/50 transition-colors duration-300"></div>

                    <span className="relative z-10 font-serif text-lg tracking-[0.2em] text-amber-100 uppercase flex items-center justify-center gap-3 group-hover:gap-6 transition-all duration-300">
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity">✨</span>
                        {t('startButton', language)}
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity">✨</span>
                    </span>

                    {/* Shimmer effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                </button>

                {/* Daily Card Button */}
                <button
                    onClick={onDailyCard}
                    className="w-full relative group overflow-hidden rounded-full py-3 px-6 transition-all duration-300"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-900/60 via-orange-800/60 to-amber-900/60 opacity-80 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
                    <div className="absolute inset-0 border border-amber-400/20 rounded-full group-hover:border-amber-400/50 transition-colors duration-300"></div>

                    <span className="relative z-10 font-serif text-base tracking-[0.15em] text-amber-200 flex items-center justify-center gap-3 group-hover:gap-5 transition-all duration-300">
                        <Sun className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:rotate-180 transition-all duration-700" />
                        {t('dailyCardButton', language)}
                        <Sun className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:rotate-180 transition-all duration-700" />
                    </span>

                    {/* Shimmer effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-amber-200/10 to-transparent"></div>
                </button>
            </div>
        </div>
    );
};


