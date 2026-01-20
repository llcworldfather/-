// Vercel Edge Function for Text-to-Speech using Edge-TTS
export const config = {
    runtime: 'edge',
};

// Voice mapping for different languages
const VOICES: Record<string, string> = {
    'zh': 'zh-CN-liaoning-XiaobeiNeural', // 东北女声
    'en': 'en-US-AriaNeural',              // English female voice
};

/**
 * Clean markdown text for TTS
 * Remove markdown formatting, emojis, and special characters
 */
function cleanTextForTTS(text: string): string {
    return text
        // Remove markdown headers
        .replace(/#{1,6}\s*/g, '')
        // Remove bold/italic markers
        .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
        .replace(/_{1,3}([^_]+)_{1,3}/g, '$1')
        // Remove inline code
        .replace(/`([^`]+)`/g, '$1')
        // Remove links - keep text
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        // Remove images
        .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
        // Remove blockquotes
        .replace(/^>\s*/gm, '')
        // Remove list markers
        .replace(/^[-*+]\s+/gm, '')
        .replace(/^\d+\.\s+/gm, '')
        // Remove horizontal rules
        .replace(/^[-*_]{3,}$/gm, '')
        // Remove emojis (basic range)
        .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu, '')
        // Remove excess whitespace
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

/**
 * Generate SSML for Edge TTS
 */
function generateSSML(text: string, voice: string): string {
    // Escape XML special characters
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
async function synthesizeSpeech(text: string, voice: string): Promise<Uint8Array> {
    const wsUrl = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4&ConnectionId=${crypto.randomUUID().replace(/-/g, '')}`;

    const ssml = generateSSML(text, voice);

    return new Promise((resolve, reject) => {
        const audioChunks: Uint8Array[] = [];
        let resolved = false;

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            // Send configuration
            const configMessage = `Content-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}`;
            ws.send(configMessage);

            // Send SSML request
            const requestId = crypto.randomUUID().replace(/-/g, '');
            const ssmlMessage = `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nPath:ssml\r\n\r\n${ssml}`;
            ws.send(ssmlMessage);
        };

        ws.onmessage = async (event) => {
            if (typeof event.data === 'string') {
                // Check for turn.end
                if (event.data.includes('Path:turn.end')) {
                    resolved = true;
                    ws.close();

                    // Combine all audio chunks
                    const totalLength = audioChunks.reduce((acc, chunk) => acc + chunk.length, 0);
                    const result = new Uint8Array(totalLength);
                    let offset = 0;
                    for (const chunk of audioChunks) {
                        result.set(chunk, offset);
                        offset += chunk.length;
                    }
                    resolve(result);
                }
            } else if (event.data instanceof Blob) {
                // Binary audio data
                const arrayBuffer = await event.data.arrayBuffer();
                const data = new Uint8Array(arrayBuffer);

                // Find the audio data separator (two CRLFs)
                const separator = new TextEncoder().encode('\r\n\r\n');
                let separatorIndex = -1;
                for (let i = 0; i < data.length - 3; i++) {
                    if (data[i] === 0x0D && data[i + 1] === 0x0A &&
                        data[i + 2] === 0x0D && data[i + 3] === 0x0A) {
                        separatorIndex = i + 4;
                        break;
                    }
                }

                if (separatorIndex > 0 && separatorIndex < data.length) {
                    audioChunks.push(data.slice(separatorIndex));
                }
            }
        };

        ws.onerror = (error) => {
            if (!resolved) {
                reject(new Error(`WebSocket error: ${error}`));
            }
        };

        ws.onclose = () => {
            if (!resolved) {
                reject(new Error('WebSocket closed unexpectedly'));
            }
        };

        // Timeout after 30 seconds
        setTimeout(() => {
            if (!resolved) {
                ws.close();
                reject(new Error('TTS synthesis timeout'));
            }
        }, 30000);
    });
}

export default async function handler(request: Request) {
    // Only allow POST requests
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const { text, language } = await request.json();

        if (!text) {
            return new Response(JSON.stringify({ error: 'Missing text parameter' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Get voice based on language
        const voice = VOICES[language] || VOICES['en'];

        // Clean text for TTS
        const cleanedText = cleanTextForTTS(text);

        if (!cleanedText) {
            return new Response(JSON.stringify({ error: 'No speakable text provided' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Generate audio
        const audioData = await synthesizeSpeech(cleanedText, voice);

        // Return audio as MP3
        const blob = new Blob([audioData as BlobPart], { type: 'audio/mpeg' });
        return new Response(blob, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Cache-Control': 'public, max-age=3600',
            },
        });

    } catch (error) {
        console.error('TTS Error:', error);
        return new Response(JSON.stringify({ error: 'TTS synthesis failed', message: String(error) }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
