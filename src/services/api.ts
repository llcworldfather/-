import type { DrawnCard } from '../utils/tarot';
import type { Language } from '../context/LanguageContext';

const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || '';
const API_URL = 'https://api.deepseek.com/chat/completions';

// 获取位置名称
const getPositionNames = (language: Language) =>
    language === 'zh' ? ['过去', '现在', '未来'] : ['Past', 'Present', 'Future'];

// 获取正逆位文本
const getOrientationText = (isReversed: boolean, language: Language) =>
    language === 'zh'
        ? (isReversed ? '逆位' : '正位')
        : (isReversed ? 'Reversed' : 'Upright');

export async function checkApiKey(): Promise<boolean> {
    return !!API_KEY;
}

export async function getTarotReading(
    question: string,
    cards: DrawnCard[],
    language: Language,
    onChunk: (chunk: string) => void
): Promise<void> {
    const positions = getPositionNames(language);
    const cardDescriptions = cards.map((card, index) => {
        const position = positions[index];
        const orientation = getOrientationText(card.isReversed, language);
        const cardName = language === 'zh' ? card.nameCn : card.name;
        return `${position}: ${cardName} - ${orientation}`;
    }).join('\n');

    if (!API_KEY) {
        console.warn('Deepseek API Key is missing. Using mock response.');
        const mockResponse = language === 'zh'
            ? `(模拟回应) 塔罗牌感应到了关于"${question}"的能量...\n\n${cardDescriptions}\n\n这些牌象征着... [请配置 VITE_DEEPSEEK_API_KEY 以获取真实解读]`
            : `(Mock Response) The tarot senses your question "${question}"...\n\n${cardDescriptions}\n\nThese cards symbolize... [Please configure VITE_DEEPSEEK_API_KEY for real readings]`;

        let i = 0;
        const interval = setInterval(() => {
            if (i < mockResponse.length) {
                onChunk(mockResponse[i]);
                i++;
            } else {
                clearInterval(interval);
            }
        }, 30);
        return;
    }

    const systemPrompt = language === 'zh'
        ? '你是一位神秘而智慧的塔罗牌占卜师。请根据用户的问题和抽到的三张牌（过去、现在、未来）进行解读。请用中文回答，语言风格要神秘、优雅且富有洞察力。解读应包含每张牌的含义以及它们作为一个整体的启示。'
        : 'You are a mysterious and wise tarot reader. Please interpret the three cards drawn (Past, Present, Future) based on the user\'s question. Respond in English with a mysterious, elegant, and insightful style. Include the meaning of each card and their collective guidance.';

    const userPrompt = language === 'zh'
        ? `问题: "${question}". 抽牌结果:\n${cardDescriptions}\n请解读。`
        : `Question: "${question}". Cards drawn:\n${cardDescriptions}\nPlease interpret.`;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                stream: true
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) throw new Error('Response body is unavailable');

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') return;

                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices[0]?.delta?.content || '';
                        if (content) {
                            onChunk(content);
                        }
                    } catch (e) {
                        console.error('Error parsing SSE message:', e);
                    }
                }
            }
        }

    } catch (error) {
        console.error('Failed to fetch reading:', error);
        const errorMessage = language === 'zh'
            ? "\n\n[灵界静默：连接断开，请稍后再试]"
            : "\n\n[The spirits are silent: Connection lost, please try again later]";
        onChunk(errorMessage);
    }
}

// 每日一牌专属解读
export async function getDailyCardReading(
    card: DrawnCard,
    language: Language,
    onChunk: (chunk: string) => void
): Promise<void> {
    const orientation = getOrientationText(card.isReversed, language);
    const cardName = language === 'zh' ? card.nameCn : card.name;
    const cardDescription = `${cardName} - ${orientation}`;

    if (!API_KEY) {
        console.warn('Deepseek API Key is missing. Using mock response.');
        const mockResponse = language === 'zh'
            ? `(模拟回应) 今日之牌：${cardDescription}\n\n这张牌为你今日带来的启示是... [请配置 VITE_DEEPSEEK_API_KEY 以获取真实解读]`
            : `(Mock Response) Card of the Day: ${cardDescription}\n\nThis card brings you today's insight... [Please configure VITE_DEEPSEEK_API_KEY for real readings]`;

        let i = 0;
        const interval = setInterval(() => {
            if (i < mockResponse.length) {
                onChunk(mockResponse[i]);
                i++;
            } else {
                clearInterval(interval);
            }
        }, 30);
        return;
    }

    const systemPrompt = language === 'zh'
        ? '你是一位神秘而智慧的塔罗牌占卜师，专门提供每日一牌解读。请根据用户抽到的这张牌，为ta解读今日的运势和启示。语言风格要神秘、温暖且富有启发性。内容应包含：1. 这张牌的核心含义 2. 今日的指引和建议 3. 需要注意的事项 4. 一句鼓励的话语。请用中文回答，篇幅适中。'
        : 'You are a mysterious and wise tarot reader specializing in daily card readings. Interpret the drawn card for today\'s fortune and guidance. Use a mysterious, warm, and inspiring tone. Include: 1. Core meaning of the card 2. Today\'s guidance and advice 3. Things to be mindful of 4. An encouraging message. Respond in English with moderate length.';

    const userPrompt = language === 'zh'
        ? `今日抽到的牌是：${cardDescription}\n请为我解读今日启示。`
        : `Today's card is: ${cardDescription}\nPlease interpret today's insight for me.`;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                stream: true
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) throw new Error('Response body is unavailable');

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') return;

                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices[0]?.delta?.content || '';
                        if (content) {
                            onChunk(content);
                        }
                    } catch (e) {
                        console.error('Error parsing SSE message:', e);
                    }
                }
            }
        }

    } catch (error) {
        console.error('Failed to fetch daily reading:', error);
        const errorMessage = language === 'zh'
            ? "\n\n[灵界静默：连接断开，请稍后再试]"
            : "\n\n[The spirits are silent: Connection lost, please try again later]";
        onChunk(errorMessage);
    }
}


