import type { Language } from '../context/LanguageContext';

type TranslationKey =
    // Welcome Screen
    | 'title'
    | 'subtitle'
    | 'inputPlaceholder'
    | 'startButton'
    | 'dailyCardButton'
    // Deck
    | 'shuffling'
    | 'drawPrompt'
    | 'drawComplete'
    // Card Reveal
    | 'past'
    | 'present'
    | 'future'
    | 'interpretButton'
    | 'upright'
    | 'reversed'
    // Daily Card
    | 'dailyCardTitle'
    | 'dailyInsight'
    | 'backButton'
    // Reading Display
    | 'readingTitle'
    | 'loading'
    | 'resetButton'
    // Image Generation
    | 'generateImageButton'
    | 'generatingImage';

const translations: Record<Language, Record<TranslationKey, string>> = {
    zh: {
        // Welcome Screen
        title: '神秘塔罗',
        subtitle: '"向星辰低语你的困惑，让古老的智慧指引方向..."',
        inputPlaceholder: '在此输入你的问题...',
        startButton: '开启命运之门',
        dailyCardButton: '每日一牌',
        // Deck
        shuffling: '洗牌中...',
        drawPrompt: '请抽取你的第 {n} 张牌 ({current}/3)',
        drawComplete: '命运之轮开始转动...',
        // Card Reveal
        past: '过去',
        present: '现在',
        future: '未来',
        interpretButton: '解读牌意',
        upright: '正位',
        reversed: '逆位',
        // Daily Card
        dailyCardTitle: '今日之牌',
        dailyInsight: '今日启示',
        backButton: '返回',
        // Reading Display
        readingTitle: '星辰启示',
        loading: '正在聆听宇宙的低语...',
        resetButton: '探索新的命运',
        // Image Generation
        generateImageButton: '生成图片',
        generatingImage: '生成中...'
    },
    en: {
        // Welcome Screen
        title: 'Mystic Tarot',
        subtitle: '"Whisper your doubts to the stars, let ancient wisdom guide your way..."',
        inputPlaceholder: 'Enter your question here...',
        startButton: 'Open the Gate of Destiny',
        dailyCardButton: 'Daily Card',
        // Deck
        shuffling: 'Shuffling...',
        drawPrompt: 'Draw your card #{n} ({current}/3)',
        drawComplete: 'The Wheel of Fortune turns...',
        // Card Reveal
        past: 'Past',
        present: 'Present',
        future: 'Future',
        interpretButton: 'Interpret',
        upright: 'Upright',
        reversed: 'Reversed',
        // Daily Card
        dailyCardTitle: 'Card of the Day',
        dailyInsight: 'Daily Insight',
        backButton: 'Back',
        // Reading Display
        readingTitle: 'Celestial Revelation',
        loading: 'Listening to the whispers of the universe...',
        resetButton: 'Explore New Destiny',
        // Image Generation
        generateImageButton: 'Generate Image',
        generatingImage: 'Generating...'
    }
};

export const t = (key: TranslationKey, language: Language, params?: Record<string, string | number>): string => {
    let text = translations[language][key];
    if (params) {
        Object.entries(params).forEach(([k, v]) => {
            text = text.replace(`{${k}}`, String(v));
        });
    }
    return text;
};

export type { TranslationKey };
