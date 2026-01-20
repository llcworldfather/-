// Vercel Serverless Function for Text-to-Speech
// Using Node.js runtime and edge-tts-client
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { EdgeTTS } from 'edge-tts-client';

// Voice mapping for different languages
const VOICES: Record<string, string> = {
    'zh': 'zh-CN-liaoning-XiaobeiNeural', // 东北女声
    'en': 'en-US-AriaNeural',              // English female voice
};

/**
 * Clean markdown text for TTS
 */
function cleanTextForTTS(text: string): string {
    return text
        .replace(/#{1,6}\s*/g, '')
        .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
        .replace(/_{1,3}([^_]+)_{1,3}/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
        .replace(/^>\s*/gm, '')
        .replace(/^[-*+]\s+/gm, '')
        .replace(/^\d+\.\s+/gm, '')
        .replace(/^[-*_]{3,}$/gm, '')
        .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu, '')
        .replace(/[✨✦★☆●○◆◇□■▲△▼▽]/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

/**
 * Use Google Translate TTS as fallback
 */
async function synthesizeWithGoogleTTS(text: string, lang: string): Promise<Buffer> {
    const maxLength = 200;
    const chunks: string[] = [];
    const sentences = text.split(/(?<=[。！？.!?])\s*/);
    let currentChunk = '';

    for (const sentence of sentences) {
        if ((currentChunk + sentence).length <= maxLength) {
            currentChunk += sentence;
        } else {
            if (currentChunk) chunks.push(currentChunk);
            currentChunk = sentence.substring(0, maxLength);
        }
    }
    if (currentChunk) chunks.push(currentChunk);

    const audioBuffers: Buffer[] = [];

    for (const chunk of chunks.slice(0, 10)) {
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(chunk)}`;
        try {
            const response = await fetch(url, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                audioBuffers.push(Buffer.from(arrayBuffer));
            }
        } catch (e) {
            console.error('Chunk TTS failed:', e);
        }
    }

    return Buffer.concat(audioBuffers);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { text, language } = req.body;
        if (!text) return res.status(400).json({ error: 'Missing text parameter' });

        const voice = VOICES[language] || VOICES['en'];
        const cleanedText = cleanTextForTTS(text);
        if (!cleanedText) return res.status(400).json({ error: 'No speakable text provided' });

        const limitedText = cleanedText.substring(0, 3000);

        try {
            // Try Edge TTS first using the library
            const tts = new EdgeTTS({
                voice: voice,
                lang: language === 'zh' ? 'zh-CN' : 'en-US',
                outputFormat: 'audio-24khz-48kbitrate-mono-mp3'
            });

            const result = await tts.synthesize(limitedText);
            const audioData = Buffer.from(result, 'base64'); // base64 string from library

            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Cache-Control', 'public, max-age=3600');
            return res.send(audioData);

        } catch (edgeError) {
            console.error('Edge TTS failed:', edgeError);

            // Fallback to Google TTS
            console.log('Falling back to Google TTS...');
            const googleLang = language === 'zh' ? 'zh-CN' : 'en-US';
            const audioData = await synthesizeWithGoogleTTS(limitedText, googleLang);

            if (audioData.length === 0) {
                throw new Error('All TTS methods failed');
            }

            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Cache-Control', 'public, max-age=3600');
            return res.send(audioData);
        }

    } catch (error) {
        console.error('TTS Error:', error);
        return res.status(500).json({
            error: 'TTS synthesis failed',
            message: error instanceof Error ? error.message : String(error)
        });
    }
}
