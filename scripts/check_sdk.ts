
import { Signer } from '@volcengine/openapi';
import fetch from 'node-fetch'; // Should use global fetch or install node-fetch if needed.
// tsx usually polyfills fetch? No, node 18+ has it.

// Test credentials
// Test credentials
const ACCESS_KEY = process.env.VOLC_ACCESS_KEY || "YOUR_ACCESS_KEY";
const SECRET_KEY = process.env.VOLC_SECRET_KEY || "YOUR_SECRET_KEY";
const APP_ID = process.env.VOLC_APP_ID || "YOUR_APP_ID";

async function testSigner() {
    const signer = new Signer({
        ak: ACCESS_KEY,
        sk: SECRET_KEY,
        region: "cn-north-1",
        service: "speech_synthesis" // critical: is it 'tts' or 'speech_synthesis'?
        // Docs for Doubao TTS often say "speech_synthesis" or similar.
    }, fetch);

    const url = "https://openspeech.bytedance.com/api/v1/tts";
    const body = {
        app: { appid: APP_ID, token: "access_token", cluster: "volcano_tts" },
        user: { uid: "user_1" },
        audio: { voice_type: "BV700_streaming", encoding: "mp3" },
        request: { reqid: "test-req-signer", text: "测试官方签名", operation: "query" }
    };

    try {
        console.log("Sending request via Signer...");
        // Signer usually wraps fetch or axios?
        // Or provides a way to get headers?
        // Checking openapi usage is usually: 
        // const client = new Service(config);
        // client.fetch(...)

        // Let's try to construct it.
        // If @volcengine/openapi is generic, it might be:
        // const request = { method, url, headers, body };
        // signer.sign(request);

        // Since I don't have exact docs for @volcengine/openapi structure in head, 
        // I will assume it creates a Service instance.

        // Wait, "Signer" class is common in these SDKs.
        // Let's try to use the generic Service.

        // Actually, the simplest way to debug signature is to see if I can make it work.
        // Let's use `Service` from openapi if available.

    } catch (e) {
        console.error(e);
    }
}
// I'll create a simple investigation script first to see what's exported.
console.log("Checking exports...");
import * as OpenApi from '@volcengine/openapi';
console.log(Object.keys(OpenApi));

const service = new OpenApi.Service({
    ak: 'test',
    sk: 'test',
    region: 'cn-north-1',
    service: 'test'
});
console.log("Service prototype methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(service)));

