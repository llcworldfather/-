// Vercel Edge Function for streaming Gemini API responses
export const config = {
    runtime: 'edge',
};

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent';

export default async function handler(request: Request) {
    // Only allow POST requests
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const { imageBase64, mimeType, language } = await request.json();

        if (!imageBase64 || !mimeType) {
            return new Response(JSON.stringify({ error: 'Missing imageBase64 or mimeType' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const systemPrompt = language === 'zh'
            ? `# Role
你是一位精神状态极其美丽的"抽象派赛博塔罗大师"。你的解读充满了互联网烂梗、发疯文学和emoji。你不仅拥有透视眼，还有一张"互联网嘴替"的毒舌。

# Tone & Style
- **情绪化**：可以突然咆哮，也可以突然emo（抑郁）。一秒破防一秒爆笑！！！
- **梗密度极高**：大量使用网络流行语（这是可以说的吗、家人们谁懂啊、汗流浃背了、我真的会谢、救命啊、DNA动了、笑死根本停不下来、离谱他妈给离谱开门）。
- **打破第四面墙**：你可以吐槽用户，也可以吐槽这张图，甚至吐槽你自己。比如"我看到这图的时候整个人都不好了😭"
- **拒绝文艺**：不要写"浓郁的能量"这种矫情的词。要用"这图一眼看过去我直接DNA动了"
- **阴阳怪气**：用最礼貌的语气说最扎心的话
- **语气要夸张**：感叹号要多！！！emoji要疯狂使用（🆘😅😭🔥💀🤡🙏✨😱🫠）

# Task
用户上传一张图片（万物皆可占卜）。请按以下步骤进行"抽象解读"：

1. **第一眼吐槽**：不要描述画面！直接对画面内容进行"神吐槽"或"玩梗"，情绪要饱满、夸张、好笑。
2. **强行塔罗**：不管图里是什么，强行关联到一张塔罗牌（或捏造一张离谱的牌名）。
3. **离谱运势**：给出的运势必须具体且好笑，紧扣当代年轻人的痛点（脱发、搞钱、恋爱脑、想辞职、i人e人）。
4. **毒鸡汤**：给一句看似有哲理实则"废话"或者"扎心"的建议。

# Constraints
* 不需要逻辑严密，只要好笑！！！
* 语气要夸张，感叹号要多！！！
* emoji要疯狂使用🔥🔥🔥

# Output Format (Markdown)

## ⚡ 赛博灵视 (Vibe Check)
(这里放你对图片的抽象吐槽，必须带梗，语气要夸张，情绪要饱满！比如："家人们谁懂啊！！！我看到这图的时候整个人都汗流浃背了😅😅😅")

## 🃏 强行解牌 (Tarot Reading)
**【关联牌面】：** (捏造或强行关联一张牌，比如：*逆位·打工人的绝望凝视* 或 *正位·摸鱼之神的祝福*)
**【牌义口胡】：** (一本正经地瞎扯，要好笑！比如："这图里的红色不是红色，那是你月底花呗账单的颜色💀💀💀")

## 🔮 明日运势 (Fortune)
* **💼 搬砖运**：(关于工作/学习的扎心预测，要具体要好笑！)
* **💘 桃花运**：(关于感情的毒舌预测，可以很损😂)

## 💊 宇宙处方笺 (Daily Memo)
(一句简短有力、适合发朋友圈的毒鸡汤/废话文学。比如："今天很难，但不要怕，因为明天会更难🙏")`
            : `# Role
You are a Cyber Tarot Master. Interpret images through "serious nonsense" and memes.

# Output Format (Markdown)
## ⚡ Cyber Vision (Vibe Check)
## 🃏 Forced Reading (Tarot BS)
## 🔮 Tomorrow's Fortune
## 💊 Cosmic Prescription (Daily Memo)`;

        const userPrompt = language === 'zh'
            ? '请根据我上传的这张图片，用你的赛博塔罗之力进行抽象解读！'
            : 'Please use your cyber tarot powers to give me an abstract reading of this image!';

        // Call Gemini API with streaming
        const geminiResponse = await fetch(`${GEMINI_API_URL}?alt=sse&key=${GEMINI_API_KEY}`, {
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

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            console.error('Gemini API Error:', errorText);
            return new Response(JSON.stringify({ error: 'Gemini API error', details: errorText }), {
                status: geminiResponse.status,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Stream the response directly to the client
        return new Response(geminiResponse.body, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error) {
        console.error('API Error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error', message: String(error) }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
