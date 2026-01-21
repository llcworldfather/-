
import { VolcengineTTS } from '../api/volc_tts';
import fs from 'fs';
import path from 'path';

// Load env or use hardcoded for test (using the ones from tts.ts fallback for now)
// Load env or use hardcoded for test (using the ones from tts.ts fallback for now)
const ACCESS_KEY = process.env.VOLC_ACCESS_KEY || 'YOUR_ACCESS_KEY';
const SECRET_KEY = process.env.VOLC_SECRET_KEY || 'YOUR_SECRET_KEY';
const APP_ID = process.env.VOLC_APP_ID || 'YOUR_APP_ID';

async function testTTS() {
    console.log('Testing Volcengine TTS...');

    // We need to polyfill fetch if running in Node < 18 (though user likely has recent node)
    // If not, we might need to install node-fetch.
    // Assuming Node 18+ which has global fetch.

    const tts = new VolcengineTTS({
        accessKeyId: ACCESS_KEY,
        secretAccessKey: SECRET_KEY,
        appId: APP_ID,
        host: 'openspeech.bytedance.com'
    });

    try {
        const text = "你好，这是一个测试语音。";
        console.log(`Synthesizing text: "${text}"`);

        const audioBuffer = await tts.synthesize(text, 'BV700_streaming');

        const outputPath = path.join(process.cwd(), 'test_output.mp3');
        fs.writeFileSync(outputPath, audioBuffer);

        console.log(`Success! Audio saved to ${outputPath}`);
    } catch (error) {
        const errObj = {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            details: error
        };
        fs.writeFileSync('error.log', JSON.stringify(errObj, null, 2));
        console.error('TTS Test Failed. details written to error.log');
    }
}

testTTS();
