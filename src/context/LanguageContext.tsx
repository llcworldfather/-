import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type Language = 'zh' | 'en';

interface LanguageContextType {
    language: Language;
    toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
    children: ReactNode;
}

// Helper function to get cookie value
const getCookie = (name: string): string | null => {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
};

// Helper function to set cookie
const setCookie = (name: string, value: string, days: number = 365) => {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
};

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('zh');

    // Initialize language from cookie on mount, or detect from IP
    useEffect(() => {
        const initLanguage = async () => {
            // First check if user has a manual preference
            const preferred = getCookie('preferred-language');
            if (preferred === 'zh' || preferred === 'en') {
                setLanguage(preferred);
                return;
            }

            // Then check if we already have IP-detected language
            const detected = getCookie('detected-language');
            if (detected === 'zh' || detected === 'en') {
                setLanguage(detected);
                return;
            }

            // No cookies exist - call API to detect language from IP
            try {
                const response = await fetch('/api/detect-language');
                if (response.ok) {
                    const data = await response.json();
                    if (data.language === 'zh' || data.language === 'en') {
                        setLanguage(data.language);
                        // Cookie is set by the API response header
                    }
                }
            } catch (error) {
                // Fallback to Chinese on error
                console.log('Language detection failed, using default');
            }
        };

        initLanguage();
    }, []);

    const toggleLanguage = () => {
        setLanguage(prev => {
            const newLang = prev === 'zh' ? 'en' : 'zh';
            // Save user's manual preference
            setCookie('preferred-language', newLang);
            return newLang;
        });
    };

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
