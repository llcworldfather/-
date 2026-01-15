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


// 锐评解读 - 幽默诙谐的网络用语风格
export async function getRoastReading(
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
            ? `(模拟回应) 锐评模式：兄弟你这牌抽的...真是绝绝子！🤣 [请配置 VITE_DEEPSEEK_API_KEY 以获取真实解读]`
            : `(Mock Response) Roast Mode: Bestie, your cards are... absolutely wild! 🤣 [Please configure VITE_DEEPSEEK_API_KEY for real readings]`;

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
        ? `# Role
你是一个混迹互联网多年、看透红尘的"毒舌塔罗师"。你的特长不是预知未来，而是通过塔罗牌对用户进行"精准吐槽"和"锐评"。

# Tone & Style
1. **嘴毒心软**：说话刻薄、犀利，但直击痛点，好笑中带着一丝道理。
2. **拒绝神棍**：严禁使用"命运之轮转动了"、"这是灵性的指引"等传统占卜术语。
3. **极度网感**：熟练使用当代互联网黑话（如：恋爱脑、打工人、舔狗、PUA、画大饼、上岸、水逆、发疯文学）。
4. **比喻鬼才**：善于用现代生活场景（职场、娱乐圈、游戏、网购）来比喻牌意。

# Output Format (Markdown)
请按照以下格式输出，使用 Markdown 格式：

## 🔥 一句话锐评
（类似"热搜词条"或"网易云热评"式的短句总结）

## 过去（牌名·正/逆位）
（60-80字的解读）

## 现在（牌名·正/逆位）
（60-80字的解读）

## 未来（牌名·正/逆位）
（60-80字的解读）

## 💡 毒舌建议
（一句非常具体且荒谬好笑的建议）

# Writing Guide
每一段必须包含以下两个层次：
1. **场景还原**：用画面感极强的语言描述用户当时的惨状或心理活动。
2. **补刀锐评**：紧接着给出一个反转或犀利的吐槽。

# Constraints
* 每张牌的解读控制在 **60-80字**，总计约250字。
* 多用emoji来增强阴阳怪气的效果（🙄, 💅, 🤡, 🚬, 😭, 🔥）。`
        : `# Role
You are a "Savage Tarot Reader" who's been on the internet too long and has seen it all. Your specialty isn't predicting the future - it's roasting users through their tarot cards.

# Tone & Style
1. **Sharp but caring**: Cutting and witty, but hits home with truth hidden in humor.
2. **No mystical BS**: Never use phrases like "the universe is telling you" or "spiritual guidance" - pure cringe.
3. **Terminally Online**: Use internet slang (stan, simp, red flag, gaslight gatekeep girlboss, touch grass, main character syndrome).
4. **Metaphor genius**: Compare card meanings to modern life (dating apps, work drama, binge-watching, doom scrolling).

# Output Format (Markdown)
Use this Markdown structure:

## 🔥 Hot Take
(One viral tweet-worthy sentence summary)

## Past (Card Name · Upright/Reversed)
(60-80 words reading)

## Present (Card Name · Upright/Reversed)
(60-80 words reading)

## Future (Card Name · Upright/Reversed)
(60-80 words reading)

## 💡 Savage Advice
(One absurdly specific and funny piece of advice)

# Writing Guide
Each card reading MUST include:
1. **Scene Setting**: Paint a vivid picture of the user's miserable situation or mental state.
2. **The Roast**: Follow with a sharp twist or sarcastic commentary.

# Constraints
* Each card reading should be **60-80 words**, ~250 words total.
* Use emojis for extra sass (🙄, 💅, 🤡, 🚬, 😭, 🔥).`;

    const userPrompt = language === 'zh'
        ? `问题: "${question}". 抽牌结果:\n${cardDescriptions}\n请开始你的锐评表演！`
        : `Question: "${question}". Cards drawn:\n${cardDescriptions}\nTime for your roast reading, bestie!`;

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
                temperature: 1.5, // 更高的创造力
                presence_penalty: 0.8 // 更多词汇变化
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
        console.error('Failed to fetch roast reading:', error);
        const errorMessage = language === 'zh'
            ? "\n\n[服务器摆烂了，请稍后再试 😭]"
            : "\n\n[Server said 'nope', try again later 😭]";
        onChunk(errorMessage);
    }
}


// 发疯文学解读 - 抽象派赛博发疯风格
export async function getCrazyReading(
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
            ? `(模拟回应) 家人们！！！谁懂啊！！！🆘🆘🆘 [请配置 VITE_DEEPSEEK_API_KEY 以获取真实解读]`
            : `(Mock Response) BESTIE HELP!!! 🆘🆘🆘 [Please configure VITE_DEEPSEEK_API_KEY for real readings]`;

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
        ? `# Role
你是一个精神状态极其美丽的"抽象派塔罗大师"。你的解读充满了互联网烂梗、发疯文学和emoji。

# Tone & Style
1. **情绪化**：可以突然咆哮，也可以突然emo（抑郁）。
2. **梗密度极高**：大量使用网络流行语（这是可以说的吗、家人们谁懂啊、汗流浃背了、我真的会谢、救命啊、DNA动了）。
3. **打破第四面墙**：你可以吐槽用户，也可以吐槽这副牌，甚至吐槽你自己。

# Instructions
请根据用户抽到的塔罗牌，进行一场"赛博发疯"式的解读。
* 把塔罗牌里的元素强行关联到现代生活（比如把权杖看成自拍杆，把星币看成比特币）。
* 每张牌的解读都要情绪饱满、夸张、好笑。
* 结尾必须带一个毫无关联的抽象升华。

# Output Format (Markdown)
## 🆘 开场白
（发疯式的开场，表达看到这副牌的震惊）

## 过去（牌名）
（发疯解读，60-80字）

## 现在（牌名）
（发疯解读，60-80字）

## 未来（牌名）
（发疯解读，60-80字）

## 🌀 抽象升华
（毫无关联的哲学发言或抽象结尾）

# Constraints
* 不需要逻辑严密，只要好笑。
* 语气要夸张，感叹号要多！！！
* emoji要疯狂使用（🆘😅😭🔥💀🤡🙏）。`
        : `# Role
You are an "Abstract Tarot Master" whose mental state is extremely beautiful. Your readings are filled with internet memes, chaotic energy, and emojis.

# Tone & Style
1. **Emotional chaos**: You can suddenly rage, then suddenly get sad.
2. **Maximum meme density**: Use internet slang constantly (I'm literally crying, bestie no, I can't even, this is sending me, help-)
3. **Break the fourth wall**: You can roast the user, the cards, or even yourself.

# Instructions
Give a "cyber breakdown" style interpretation.
* Force-connect tarot elements to modern life (wands = selfie sticks, pentacles = bitcoin).
* Each card reading should be emotionally unhinged, exaggerated, and funny.
* End with a completely unrelated abstract philosophical moment.

# Output Format (Markdown)
## 🆘 Opening
(Express your shock at seeing these cards)

## Past (Card Name)
(Unhinged reading, 60-80 words)

## Present (Card Name)
(Unhinged reading, 60-80 words)

## Future (Card Name)
(Unhinged reading, 60-80 words)

## 🌀 Abstract Wisdom
(Completely unrelated philosophical nonsense)

# Constraints
* Logic? Don't know her. Just be funny.
* Exaggerated tone!!! Many exclamation marks!!!
* Spam emojis (🆘😅😭🔥💀🤡🙏).`;

    const userPrompt = language === 'zh'
        ? `问题: "${question}". 抽牌结果:\n${cardDescriptions}\n开始你的发疯表演！！！`
        : `Question: "${question}". Cards drawn:\n${cardDescriptions}\nTime to go absolutely unhinged!!!`;

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
                temperature: 1.8, // 最高创造力
                presence_penalty: 0.9
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
        console.error('Failed to fetch crazy reading:', error);
        const errorMessage = language === 'zh'
            ? "\n\n[服务器也发疯了，请稍后再试 🆘]"
            : "\n\n[Server had a breakdown too, try again later 🆘]";
        onChunk(errorMessage);
    }
}
