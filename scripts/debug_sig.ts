
import crypto from 'crypto';

function hmac(key: string | Buffer, data: string): Buffer {
    return crypto.createHmac('sha256', key).update(data).digest();
}

function sha256(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
}

// Test credentials
// Test credentials
const ak = process.env.VOLC_ACCESS_KEY || "YOUR_ACCESS_KEY";
const sk = process.env.VOLC_SECRET_KEY || "YOUR_SECRET_KEY";
const region = "cn-north-1";
const service = "speech_synthesis"; // Try 'tts' or 'speech_synthesis'
const host = "openspeech.bytedance.com";
const path = "/api/v1/tts";
const method = "POST";
const date = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
const shortDate = date.slice(0, 8);

const requestBody = JSON.stringify({
    app: { appid: "7969668769", token: "access_token", cluster: "volcano_tts" },
    user: { uid: "user_1" },
    audio: { voice_type: "BV700_streaming", encoding: "mp3", speed_ratio: 1.0, volume_ratio: 1.0, pitch_ratio: 1.0 },
    request: { reqid: "test-req-id", text: "test", operation: "query" }
});

const contentSha256 = sha256(requestBody);
// Headers must be sorted
const canonicalHeaders = `content-type:application/json; charset=utf-8\nhost:${host}\nx-content-sha256:${contentSha256}\nx-date:${date}\n`;
const signedHeaders = 'content-type;host;x-content-sha256;x-date';
const canonicalRequest = [method, path, '', canonicalHeaders, signedHeaders, contentSha256].join('\n');

const credentialScope = `${shortDate}/${region}/${service}/request`;
const stringToSign = ['HMAC-SHA256', date, credentialScope, sha256(canonicalRequest)].join('\n');

const kDate = hmac(sk, shortDate); // Volcengine uses SK directly, not "VOLC" + SK?
const kRegion = hmac(kDate, region);
const kService = hmac(kRegion, service);
const kSigning = hmac(kService, 'request');
const signature = hmac(kSigning, stringToSign).toString('hex');

console.log("Authorization:", `HMAC-SHA256 Credential=${ak}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`);
console.log("X-Date:", date);
console.log("X-Content-Sha256:", contentSha256);
console.log("String to Sign:\n" + stringToSign);
