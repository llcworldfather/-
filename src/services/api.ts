import type { DrawnCard } from '../utils/tarot';

const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || '';
const API_URL = 'https://api.deepseek.com/chat/completions';

export async function checkApiKey(): Promise<boolean> {
    return !!API_KEY;
}

export async function getTarotReading(
    question: string,
    cards: DrawnCard[],
    onChunk: (chunk: string) => void
): Promise<void> { // Changed return type to void as we use callback
    const cardDescriptions = cards.map((card, index) => {
        const position = ['过去', '现在', '未来'][index];
        const orientation = card.isReversed ? '逆位' : '正位';
        return `${position}: ${card.nameCn} (${card.name}) - ${orientation}`;
    }).join('\n');

    if (!API_KEY) {
        console.warn('Deepseek API Key is missing. Using mock response.');
        const mockResponse = `(模拟回应) 塔罗牌感应到了关于"${question}"的能量...\n\n${cardDescriptions}\n\n这些牌象征着... [请配置 VITE_DEEPSEEK_API_KEY 以获取真实解读]`;

        // Simulate streaming for mock response
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
                    {
                        role: 'system',
                        content: '你是一位神秘而智慧的塔罗牌占卜师。请根据用户的问题和抽到的三张牌（过去、现在、未来）进行解读。请用中文回答，语言风格要神秘、优雅且富有洞察力。解读应包含每张牌的含义以及它们作为一个整体的启示。'
                    },
                    {
                        role: 'user',
                        content: `问题: "${question}". 抽牌结果:\n${cardDescriptions}\n请解读。`
                    }
                ],
                stream: true // Enable streaming
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
        onChunk("\n\n[灵界静默：连接断开，请稍后再试]");
    }
}
