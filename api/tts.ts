// Vercel Serverless Function for Text-to-Speech using Edge-TTS
// Using Node.js runtime for full WebSocket support
import type { VercelRequest, VercelResponse } from '@vercel/node';

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
 * Generate SSML for Edge TTS
 */
function generateSSML(text: string, voice: string): string {
    const escapedText = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

    return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <voice name="${voice}">
        <prosody rate="0%" pitch="0%">
            ${escapedText}
        </prosody>
    </voice>
</speak>`;
}

/**
 * Connect to Edge TTS WebSocket and generate audio
 */
async function synthesizeSpeech(text: string, voice: string): Promise<Buffer> {
    // Dynamic import for ws package
    const WebSocket = (await import('ws')).default;

    const connectionId = [...Array(32)].map(() => Math.random().toString(16)[2]).join('');
    const wsUrl = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4&ConnectionId=${connectionId}`;

    const ssml = generateSSML(text, voice);

    return new Promise((resolve, reject) => {
        const audioChunks: Buffer[] = [];
        let resolved = false;

        const ws = new WebSocket(wsUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
                'Origin': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold'
            }
        });

        ws.on('open', () => {
            // Send configuration
            const configMessage = `Content-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}`;
            ws.send(configMessage);

            // Send SSML request
            const requestId = [...Array(32)].map(() => Math.random().toString(16)[2]).join('');
            const ssmlMessage = `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nPath:ssml\r\n\r\n${ssml}`;
            ws.send(ssmlMessage);
        });

        ws.on('message', (data: Buffer | string) => {
            if (typeof data === 'string') {
                if (data.includes('Path:turn.end')) {
                    resolved = true;
                    ws.close();
                    resolve(Buffer.concat(audioChunks));
                }
            } else if (Buffer.isBuffer(data)) {
                // Find the audio data separator (two CRLFs)
                const separator = Buffer.from('\r\n\r\n');
                const separatorIndex = data.indexOf(separator);

                if (separatorIndex > 0 && separatorIndex + 4 < data.length) {
                    audioChunks.push(data.slice(separatorIndex + 4));
                }
            }
        });

        ws.on('error', (error) => {
            if (!resolved) {
                console.error('WebSocket error:', error);
                reject(error);
            }
        });

        ws.on('close', () => {
            if (!resolved) {
                reject(new Error('WebSocket closed unexpectedly'));
            }
        });

        // Timeout after 60 seconds
        setTimeout(() => {
            if (!resolved) {
                ws.close();
                reject(new Error('TTS synthesis timeout'));
            }
        }, 60000);
    });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { text, language } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Missing text parameter' });
        }

        // Get voice based on language
        const voice = VOICES[language] || VOICES['en'];

        // Clean text for TTS
        const cleanedText = cleanTextForTTS(text);

        if (!cleanedText) {
            return res.status(400).json({ error: 'No speakable text provided' });
        }

        // Limit text length to avoid timeout
        const limitedText = cleanedText.substring(0, 3000);

        // Generate audio
        const audioData = await synthesizeSpeech(limitedText, voice);

        // Return audio as MP3
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
