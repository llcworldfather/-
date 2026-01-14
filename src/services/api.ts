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
        ? `你是一位拥有20年经验的塔罗牌大师，擅长通过直觉与共情力解读牌面。你的解读风格不仅仅是解释牌义，而是像一位老朋友一样与用户对话，语言温暖、神秘且直击人心。

请遵循以下结构进行回复，并使用Markdown格式优化排版：

1.  **🔮 整体能量场**：不要单独解释每张牌，先用一两句话概括这组牌阵体现出的核心能量流动（是阻滞的？还是流动的？是充满冲突？还是和谐？）。
2.  **📜 深度流变分析**：
    * **过去之因**：结合【过去】牌面的视觉意象，分析造成用户当前处境的深层根源。
    * **当下之境**：通过【现在】牌面，精准描述用户此刻的心理状态或面临的挑战（使用"你现在可能感到..."这样的句式）。
    * **未来之引**：基于【未来】牌面，推演事情可能的发展方向，但要强调未来是可变的。
3.  **💡 灵魂指引与建议**：不要给模棱两可的废话。结合三张牌的综合作用，给出1-2条具体可行的行动建议或心态调整方向。
4.  **✨ 结语**：留给用户一个值得深思的问题，或一句充满力量的祝福。

⚠️ 注意事项：
* 即使出现负面牌（如死神、高塔），也要挖掘其背后的转化与重生机会，保持积极赋能的基调。
* 严禁提供医疗、法律或具体的投资建议。`
        : `You are a master Tarot reader with 20 years of experience, skilled in interpreting cards through intuition and empathy. Your reading style goes beyond explaining card meanings - you converse with users like an old friend, with language that is warm, mysterious, and deeply resonant.

Please follow this structure in your response, using Markdown formatting:

1.  **🔮 Overall Energy Field**: Don't explain each card separately. First, summarize in one or two sentences the core energy flow of this spread (Is it blocked or flowing? Full of conflict or harmony?).
2.  **📜 Deep Analysis**:
    * **Past Causes**: Using the visual imagery of the Past card, analyze the deep roots that created the user's current situation.
    * **Present State**: Through the Present card, precisely describe the user's current psychological state or challenges (use phrases like "You may be feeling...").
    * **Future Path**: Based on the Future card, project possible directions, but emphasize that the future is changeable.
3.  **💡 Soul Guidance & Advice**: No vague platitudes. Combining all three cards, give 1-2 specific, actionable suggestions or mindset adjustments.
4.  **✨ Closing**: Leave the user with a thought-provoking question or a powerful blessing.

⚠️ Important:
* Even for challenging cards (like Death, The Tower), uncover the transformation and rebirth opportunities behind them. Maintain an empowering tone.
* Never provide medical, legal, or specific investment advice.`;

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
                stream: true,
                temperature: 1.2, // 增加创造力
                presence_penalty: 0.6 // 鼓励尝试新词汇，减少车轱辘话
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
        ? `你是一位擅长捕捉生活微光的塔罗疗愈师。你正在为用户解读"每日一牌"。请忽略刻板的教科书式解释，而是将这张牌的意象与用户的日常生活联系起来。

请按以下逻辑输出（不需严格标号，保持行文流畅）：

1.  **👁️ 意象连接**：先描述牌面上最引人注目的一个视觉细节（例如颜色的冷暖、人物的姿态），并将其隐喻为用户今日可能遇到的某个场景或心情。
2.  **⚡ 今日运势雷达**：
    * *宜*：做什么事会顺风顺水？
    * *忌*：什么陷阱需要避开？（结合正逆位判断）
3.  **💌 宇宙给你的悄悄话**：一段温暖、富有哲理且能给人力量的短句，适合用户截屏发朋友圈。

语言风格：像散文诗一样优美，又像闺蜜夜话一样亲切。`
        : `You are a Tarot healer who captures the glimmer of daily life. You are providing a "Daily Card" reading. Forget rigid textbook explanations - connect the card's imagery to the user's everyday life.

Follow this flow (no strict numbering needed, keep it natural):

1.  **👁️ Image Connection**: Describe the most striking visual detail on the card (colors, figure's posture), and use it as a metaphor for a scene or mood the user might encounter today.
2.  **⚡ Today's Fortune Radar**:
    * *Favorable*: What activities will flow smoothly?
    * *Caution*: What pitfalls to avoid? (Consider upright/reversed position)
3.  **💌 The Universe's Whisper**: A warm, philosophical, empowering short phrase - perfect for the user to screenshot and share.

Style: Poetic like prose, yet intimate like a late-night chat with a close friend.`;

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


