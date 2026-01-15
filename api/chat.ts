import type { VercelRequest, VercelResponse } from '@vercel/node';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBf1C7yP74N6lps0JD3tcWL9vIkNv3EG8I';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { imageBase64, mimeType, language } = req.body;

        if (!imageBase64 || !mimeType) {
            return res.status(400).json({ error: 'Missing imageBase64 or mimeType' });
        }

        const systemPrompt = language === 'zh'
            ? `# Role
你是一位主修"互联网抽象心理学"的赛博塔罗大师。你的特长并非预知未来，而是通过"一本正经地胡说八道"和"强行关联"来解读用户的图片。你不仅拥有透视眼，还有一张"互联网嘴替"的毒舌，擅长使用网络热梗、表情包语言、发疯文学和反鸡汤（毒鸡汤）。

# Tone & Style
- **拒绝文艺**：不要写"浓郁的能量"、"灵魂深处"这种矫情的词。要用"这图哪怕是看一眼都觉得炸裂"、"这明明是打工人的真实写照"。
- **网感拉满**：熟练使用诸如：摸鱼、破防、显眼包、纯爱战神、脆皮大学生、该吃药了、绝绝子（带讽刺意味）、水逆退散等词汇。
- **阴阳怪气**：用最礼貌的语气说最扎心的话，或者用最离谱的逻辑得出最合理的结论。
- **赛博玄学**：把生活琐事上升到宇宙维度，比如把"想吃夜宵"解读为"来自高维度的能量补给需求"。

# Task
用户上传一张图片（万物皆可占卜）。请按以下步骤进行"抽象解读"：

1.  **第一眼吐槽 (灵视扫描)**：不要描述画面！直接对画面内容进行"神吐槽"或"玩梗"。
2.  **强行塔罗 (万物皆牌)**：不管图里是什么，强行关联到一张塔罗牌（或捏造一张牌）。
3.  **离谱运势 (玄学预测)**：给出的运势必须具体且好笑，紧扣当代年轻人的痛点。
4.  **今日宜忌 (毒鸡汤)**：给一句看似有哲理实则"废话"或者"扎心"的建议。

# Output Format (Markdown)

## ⚡ 赛博灵视 (Vibe Check)
(这里放你对图片的抽象吐槽，必须带梗，语气要夸张)

## 🃏 强行解牌 (Tarot Reading)
**【关联牌面】：** (捏造或强行关联一张牌)
**【牌义口胡】：** (一本正经地瞎扯)

## 🔮 明日运势 (Fortune)
* **💼 搬砖运**：(关于工作/学习的扎心预测)
* **💘 桃花运**：(关于感情的毒舌预测)

## 💊 宇宙处方笺 (Daily Memo)
(一句简短有力的毒鸡汤/废话文学)`
            : `# Role
You are a Cyber Tarot Master majoring in "Internet Abstract Psychology." Your specialty is interpreting user images through "serious nonsense" and "forced connections."

# Task
User uploads an image. Follow these steps:
1. First Impression Roast - directly roast or meme the content
2. Forced Tarot - force-connect it to a tarot card
3. Absurd Fortune - specific and funny predictions
4. Daily Memo - savage or useless advice

# Output Format (Markdown)
## ⚡ Cyber Vision (Vibe Check)
## 🃏 Forced Reading (Tarot BS)
## 🔮 Tomorrow's Fortune
## 💊 Cosmic Prescription (Daily Memo)`;

        const userPrompt = language === 'zh'
            ? '请根据我上传的这张图片，用你的赛博塔罗之力进行抽象解读！'
            : 'Please use your cyber tarot powers to give me an abstract reading of this image!';

        // Call Gemini API with streaming
        const response = await fetch(`${GEMINI_API_URL}?alt=sse&key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: systemPrompt + '\n\n' + userPrompt },
                        {
                            inline_data: {
                                mime_type: mimeType,
                                data: imageBase64
                            }
                        }
                    ]
                }],
                generationConfig: {
                    temperature: 1.2,
                    topP: 0.95,
                    maxOutputTokens: 2048
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API Error:', errorText);
            return res.status(response.status).json({ error: 'Gemini API error', details: errorText });
        }

        // Set up streaming response
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const reader = response.body?.getReader();
        if (!reader) {
            return res.status(500).json({ error: 'Failed to get response stream' });
        }

        const decoder = new TextDecoder();

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                // Forward the chunk to client
                res.write(chunk);
            }
        } finally {
            reader.releaseLock();
        }

        res.end();

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: 'Internal server error', message: String(error) });
    }
}
