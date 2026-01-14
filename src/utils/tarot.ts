import type { TarotCard } from '../data/cards';
import { cards } from '../data/cards';

// 带逆位信息的抽牌结果类型
export type DrawnCard = TarotCard & { isReversed: boolean };

export const shuffleDeck = (deck: TarotCard[] = cards): TarotCard[] => {
    const newDeck = [...deck];
    for (let i = newDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
};

export const drawCards = (deck: TarotCard[], count: number = 1): TarotCard[] => {
    return deck.slice(0, count);
};

// 抽取一张牌并随机决定正逆位（50%概率逆位）
export const drawCardWithReversed = (card: TarotCard): DrawnCard => {
    return {
        ...card,
        isReversed: Math.random() < 0.5
    };
};
