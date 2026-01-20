// Vercel Serverless Function for Text-to-Speech
// Using Node.js runtime and Google Translate TTS as a reliable fallback
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Voice mapping (used for language selection logic, though Google TTS voice selection is limited)
const LANGUAGES = {
    'zh': 'zh-CN',
    'en': 'en-US',
};

/**
 * Clean text for TTS
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
 * Synthesize speech using Google Translate TTS API (Unverified/Free endpoint)
 * This is robust and doesn't require keys, but has quality limits.
 */
async function synthesizeWithGoogleTTS(text: string, lang: string): Promise<Buffer> {
    // Google TTS requires text to be < 200 chars per request approx.
    const maxLength = 180;
    const chunks: string[] = [];

    // Split text by punctuation to preserve flow
    const sentences = text.split(/([。！？.!?\n]+)/);
    let currentChunk = '';

    for (const segment of sentences) {
        if (!segment.trim()) continue;

        if ((currentChunk + segment).length <= maxLength) {
            currentChunk += segment;
        } else {
            if (currentChunk) chunks.push(currentChunk);
            // If the segment itself is too long, hard split it
            if (segment.length > maxLength) {
                let remaining = segment;
                while (remaining.length > 0) {
                    chunks.push(remaining.substring(0, maxLength));
                    remaining = remaining.substring(maxLength);
                }
                currentChunk = '';
            } else {
                currentChunk = segment;
            }
        }
    }
    if (currentChunk) chunks.push(currentChunk);

    // Limit to first 20 chunks to prevent timeout (approx 3600 chars)
    const activeChunks = chunks.slice(0, 20);

    const audioBuffers: Buffer[] = [];

    for (const chunk of activeChunks) {
        // Build URL
        // client=tw-ob is the standard "free" client ID used by many libraries
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(chunk)}`;

        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                audioBuffers.push(Buffer.from(arrayBuffer));
            } else {
                console.warn(`Google TTS chunk failed: ${response.status}`);
            }
        } catch (e) {
            console.error('TTS chunk fetch error:', e);
        }
    }

    if (audioBuffers.length === 0) {
        throw new Error('Failed to generate any audio chunks');
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

        const lang = LANGUAGES[language] || 'en-US';
        const cleanedText = cleanTextForTTS(text);

        if (!cleanedText) return res.status(400).json({ error: 'No speakable text provided' });

        // Generate audio using Google TTS
        const audioData = await synthesizeWithGoogleTTS(cleanedText, lang);

        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        // Vercel Serverless Functions limit response size (~4.5MB), but MP3 is small enough.

        return res.send(audioData);

    } catch (error) {
        console.error('TTS General Error:', error);
        return res.status(500).json({
            error: 'TTS synthesis failed',
            message: error instanceof Error ? error.message : String(error)
        });
    }
}
