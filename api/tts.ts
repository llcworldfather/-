import type { VercelRequest, VercelResponse } from '@vercel/node';
import { tts } from 'edge-tts';

// Voice configuration with expressive styles
const VOICES = {
    'zh': {
        voice: 'zh-CN-XiaoxiaoNeural', // 晓晓 - 活泼、有表现力的女声
        rate: '+10%',  // 语速稍快，更活泼
        pitch: '+5Hz', // 音调稍高，更有表现力
        volume: '+0%',
    },
    'en': {
        voice: 'en-US-AriaNeural', // Aria - 表现力丰富的女声
        rate: '+5%',
        pitch: '+0Hz',
        volume: '+0%',
    },
};

/**
 * Clean text for TTS - remove markdown and special characters
 */
function cleanTextForTTS(text: string): string {
    return text
        .replace(/<mark>/g, '')       // Remove <mark> tags
        .replace(/<\/mark>/g, '')
        .replace(/#{1,6}\s*/g, '')    // Headers
        .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')  // Bold/italic
        .replace(/_{1,3}([^_]+)_{1,3}/g, '$1')
        .replace(/`([^`]+)`/g, '$1')  // Code
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Links
        .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')   // Images
        .replace(/^>\s*/gm, '')       // Blockquotes
        .replace(/^[-*+]\s+/gm, '')   // Lists
        .replace(/^\d+\.\s+/gm, '')   // Numbered lists
        .replace(/^[-*_]{3,}$/gm, '') // Horizontal rules
        .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu, '')
        .replace(/[✨✦★☆●○◆◇□■▲△▼▽]/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

/**
 * Add natural pauses for more expressive reading
 */
function addNaturalPauses(text: string): string {
    return text
        // 中文标点后添加停顿标记
        .replace(/([。！？])/g, '$1...')    // 句末长停顿
        .replace(/([，、；：])/g, '$1..')   // 句中短停顿
        // 英文标点后添加停顿
        .replace(/([.!?])\s/g, '$1... ')   // 句末长停顿
        .replace(/([,;:])\s/g, '$1.. ');   // 句中短停顿
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { text, language } = req.body;
        if (!text) return res.status(400).json({ error: 'Missing text parameter' });

        const lang = language === 'zh' ? 'zh' : 'en';
        const voiceConfig = VOICES[lang];

        let cleanedText = cleanTextForTTS(text);
        if (!cleanedText) return res.status(400).json({ error: 'No speakable text provided' });

        // 添加自然停顿
        cleanedText = addNaturalPauses(cleanedText);

        // Limit text length to prevent timeout (approx 5000 chars)
        const limitedText = cleanedText.substring(0, 5000);

        // Generate audio using Edge TTS
        const audioData = await tts(limitedText, {
            voice: voiceConfig.voice,
            rate: voiceConfig.rate,
            pitch: voiceConfig.pitch,
            volume: voiceConfig.volume,
        });

        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Cache-Control', 'public, max-age=3600');

        return res.send(audioData);

    } catch (error) {
        console.error('TTS Error:', error);
        return res.status(500).json({
            error: 'TTS synthesis failed',
            message: error instanceof Error ? error.message : String(error)
        });
    }
}
