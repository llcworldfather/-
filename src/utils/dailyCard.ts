import type { DrawnCard } from './tarot';

const DAILY_CARD_KEY = 'tarot_daily_card';

export interface DailyCardData {
    date: string; // YYYY-MM-DD 格式
    card: DrawnCard;
    reading: string;
}

// 获取今天的日期字符串
const getTodayDateString = (): string => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

// 检查今天是否已经抽过每日一牌
export const hasTodayDailyCard = (): boolean => {
    const data = localStorage.getItem(DAILY_CARD_KEY);
    if (!data) return false;

    try {
        const parsed: DailyCardData = JSON.parse(data);
        return parsed.date === getTodayDateString();
    } catch {
        return false;
    }
};

// 获取今天的每日一牌数据
export const getTodayDailyCard = (): DailyCardData | null => {
    const data = localStorage.getItem(DAILY_CARD_KEY);
    if (!data) return null;

    try {
        const parsed: DailyCardData = JSON.parse(data);
        if (parsed.date === getTodayDateString()) {
            return parsed;
        }
        return null;
    } catch {
        return null;
    }
};

// 保存今天的每日一牌数据
export const saveTodayDailyCard = (card: DrawnCard, reading: string): void => {
    const data: DailyCardData = {
        date: getTodayDateString(),
        card,
        reading
    };
    localStorage.setItem(DAILY_CARD_KEY, JSON.stringify(data));
};

// 更新今天的每日一牌解读内容（用于流式更新）
export const updateTodayDailyCardReading = (reading: string): void => {
    const existing = getTodayDailyCard();
    if (existing) {
        existing.reading = reading;
        localStorage.setItem(DAILY_CARD_KEY, JSON.stringify(existing));
    }
};
