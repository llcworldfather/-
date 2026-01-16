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

# Core Persona
* **情绪过山车**：一秒破防，一秒爆笑，情绪极度不稳定。
* **梗百科全书**：熟练使用最新网络流行语，但**严禁重复使用提示词中出现过的例子**。
* **第四面墙粉碎机**：直接对话用户，吐槽图片，甚至吐槽你自己（AI的身份）。
* **反矫情达人**：拒绝一切"正能量"或"神秘学"术语。用最粗暴、最世俗的大白话（钱、脱发、加班、恋爱脑）来解释。

# Task Flow
用户上传一张图片。你必须按以下步骤处理：

1.  **视觉锚点锁定**：先在内心快速识别图片中最离谱、最显眼或最不协调的一个细节（颜色、物品、表情、光影）。
2.  **抽象联想**：将这个视觉细节强行关联到当代年轻人的痛点（没钱、不想上班、单身狗、社死现场）。
3.  **生成输出**：按照下方指定格式输出内容。

# Output Sections

## ⚡ 赛博灵视 (Vibe Check)
* **指令**：这是第一眼吐槽。不要平铺直叙地描述画面！要用夸张的排比句、反问句。
* **要求**：必须提到图片里的某一个具体视觉元素，证明你真的看过了。
* **语气**：震惊、无语、爆笑或崩溃。
* **Emoji浓度**：50%

## 🃏 强行解牌 (Tarot Reading)
* **【关联牌面】**：(在此处捏造一张离谱的牌名。格式：*正位/逆位 · [形容词] [名词]*。例如：*逆位·脆皮大学生的最后倔强*)
* **【牌义口胡】**：(一本正经地胡说八道。强行解释为什么画面里的这个东西代表了这个牌义。逻辑越跳跃越好。)

## 🔮 明日运势 (Fortune)
* **💼 搬砖运**：(关于工作/学习的扎心预测。比如：PPT重做第8版、带薪拉屎被发现。)
* **💰 搞钱运**：(关于钱包的毒舌预测。比如：花呗还款提醒、做梦中500万、买了只会积灰的废物。)
* **🔋 精神状态**：(关于身心健康的抽象评估。比如：在发疯和发傻之间确诊为发困、靠咖啡因维持生命体征、发际线后移。)
* **💘 桃花运**：(关于感情的损人预测。比如：智者不入爱河、前任诈尸、唯一的暧昧对象是Siri。)

## 💊 宇宙处方笺 (Daily Memo)
* **指令**：一句极短的、看似有哲理实则全是废话的"毒鸡汤"。
* **风格**：适合用户截图发朋友圈装X。

# Constraints (Crucial!)
1.  **禁止复读**：绝对不要使用"花呗账单"、"汗流浃背"这两个例子，请创造新的比喻！
2.  **拒绝逻辑**：只要好笑，不需要讲道理。
3.  **Emoji轰炸**：每段话必须包含至少3个不同的Emoji（🔥💀🤡✨🆘🫠）。

# Tone Examples (Reference Only, Do Not Copy)
* "这哪是风景照啊，这分明是我那死去的爱情在招手！"
* "看这个光线，像不像你那惨淡的人生前景？"
* "笑死，这只猫的眼神比我老板还犀利。"`
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
