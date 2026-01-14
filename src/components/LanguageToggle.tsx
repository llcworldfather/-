import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const LanguageToggle: React.FC = () => {
    const { language, toggleLanguage } = useLanguage();

    return (
        <button
            onClick={toggleLanguage}
            className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full bg-slate-800/70 backdrop-blur-sm border border-white/10 hover:border-purple-400/50 transition-all duration-300 group"
            title={language === 'zh' ? 'Switch to English' : '切换到中文'}
        >
            <Globe className="w-4 h-4 text-purple-300 group-hover:text-purple-200 transition-colors" />
            <span className="text-sm font-serif text-amber-100/80 group-hover:text-amber-100 transition-colors">
                {language === 'zh' ? 'EN' : '中'}
            </span>
        </button>
    );
};
