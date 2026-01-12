export interface TarotCard {
    id: number;
    name: string;
    nameCn: string;
    type: 'major' | 'minor';
    suit?: 'wands' | 'cups' | 'swords' | 'pentacles';
    number: number;
    image: string;
}

const majorArcana: Omit<TarotCard, 'type' | 'id' | 'image'>[] = [
    { name: 'The Fool', nameCn: '愚者', number: 0 },
    { name: 'The Magician', nameCn: '魔术师', number: 1 },
    { name: 'The High Priestess', nameCn: '女祭司', number: 2 },
    { name: 'The Empress', nameCn: '皇后', number: 3 },
    { name: 'The Emperor', nameCn: '皇帝', number: 4 },
    { name: 'The Hierophant', nameCn: '教皇', number: 5 },
    { name: 'The Lovers', nameCn: '恋人', number: 6 },
    { name: 'The Chariot', nameCn: '战车', number: 7 },
    { name: 'Strength', nameCn: '力量', number: 8 },
    { name: 'The Hermit', nameCn: '隐士', number: 9 },
    { name: 'Wheel of Fortune', nameCn: '命运之轮', number: 10 },
    { name: 'Justice', nameCn: '正义', number: 11 },
    { name: 'The Hanged Man', nameCn: '倒吊人', number: 12 },
    { name: 'Death', nameCn: '死神', number: 13 },
    { name: 'Temperance', nameCn: '节制', number: 14 },
    { name: 'The Devil', nameCn: '恶魔', number: 15 },
    { name: 'The Tower', nameCn: '高塔', number: 16 },
    { name: 'The Star', nameCn: '星星', number: 17 },
    { name: 'The Moon', nameCn: '月亮', number: 18 },
    { name: 'The Sun', nameCn: '太阳', number: 19 },
    { name: 'Judgement', nameCn: '审判', number: 20 },
    { name: 'The World', nameCn: '世界', number: 21 },
];

const suits: { type: 'wands' | 'cups' | 'swords' | 'pentacles'; nameCn: string }[] = [
    { type: 'wands', nameCn: '权杖' },
    { type: 'cups', nameCn: '圣杯' },
    { type: 'swords', nameCn: '宝剑' },
    { type: 'pentacles', nameCn: '星币' },
];

const ranks = [
    { name: 'Ace', nameCn: '首牌', number: 1 },
    { name: 'Two', nameCn: '二', number: 2 },
    { name: 'Three', nameCn: '三', number: 3 },
    { name: 'Four', nameCn: '四', number: 4 },
    { name: 'Five', nameCn: '五', number: 5 },
    { name: 'Six', nameCn: '六', number: 6 },
    { name: 'Seven', nameCn: '七', number: 7 },
    { name: 'Eight', nameCn: '八', number: 8 },
    { name: 'Nine', nameCn: '九', number: 9 },
    { name: 'Ten', nameCn: '十', number: 10 },
    { name: 'Page', nameCn: '侍从', number: 11 },
    { name: 'Knight', nameCn: '骑士', number: 12 },
    { name: 'Queen', nameCn: '王后', number: 13 },
    { name: 'King', nameCn: '国王', number: 14 },
];

export const cards: TarotCard[] = [
    ...majorArcana.map((card, index) => ({
        id: index,
        ...card,
        type: 'major' as const,
        image: `/cards/m${card.number.toString().padStart(2, '0')}.jpg`
    })),
    ...suits.flatMap((suit, suitIndex) =>
        ranks.map((rank, rankIndex) => ({
            id: 22 + suitIndex * 14 + rankIndex,
            name: `${rank.name} of ${suit.type.charAt(0).toUpperCase() + suit.type.slice(1)}`,
            nameCn: `${suit.nameCn}${rank.nameCn}`,
            type: 'minor' as const,
            suit: suit.type,
            number: rank.number,
            image: `/cards/${suit.type.charAt(0)}${rank.number.toString().padStart(2, '0')}.jpg`
        }))
    ),
];
