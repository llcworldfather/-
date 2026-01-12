import type { TarotCard } from '../data/cards';
import { cards } from '../data/cards';

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
