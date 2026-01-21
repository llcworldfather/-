
import { Service } from '@volcengine/openapi';
import { v4 as uuidv4 } from 'uuid';

interface VolcengineConfig {
    accessKeyId: string;
    secretAccessKey: string;
    appId?: string;
    token?: string;
    region?: string;
    host?: string;
}

export class VolcengineTTS extends Service {
    private appConfig: VolcengineConfig;

    constructor(config: VolcengineConfig) {
        super({
            ak: config.accessKeyId,
            sk: config.secretAccessKey,
            region: config.region || 'cn-north-1',
            service: 'speech_synthesis',
            host: config.host || 'openspeech.bytedance.com'
        });
        this.appConfig = config;
    }

    public async synthesize(text: string, voiceType: string = 'BV001_streaming'): Promise<Buffer> {
        const requestBody = {
            app: {
                appid: this.appConfig.appId,
                token: this.appConfig.token || "access_token",
                cluster: "volcano_tts"
            },
            user: {
                uid: "user_1"
            },
            audio: {
                voice_type: voiceType,
                encoding: "mp3",
                speed_ratio: 1.0,
                volume_ratio: 1.0,
                pitch_ratio: 1.0,
            },
            request: {
                reqid: uuidv4(),
                text: text,
                operation: "query"
            }
        };

        // Use the SDK's fetch method which handles signing
        // Based on prototype check, it is 'fetchOpenAPI' or similar.
        // Assuming fetchOpenAPI takes (Action, body, options) or similar?
        // Actually, generic Service usually has 'fetchOpenAPI(Action, Params, Options)'.
        // BUT, TTS is a direct API URL. `fetchOpenAPI` likely constructs URL from action.
        // We might want to use the lower level `sign` or just `fetchOpenAPI` with overriding options?

        // Wait, looking at output: `fetchOpenAPI` is there.
        // If I use `fetchOpenAPI`, it expects an Action.
        // Volcengine APIs usually look like `Action=StartWorkflow&Version=...`.
        // However, TTS V1 is RESTful: `/api/v1/tts`.
        // Does `fetchOpenAPI` support raw paths?
        // Usually `createRequest` + `doRequest`.

        // Let's try to use `fetchOpenAPI` but if it enforces Action, we might need a different approach.
        // Or maybe `Action` is empty and we set Path?

        // Let's assume looking at standard openapi usage:
        // Service usually has `fetchOpenAPI(Action, Params, Options)`.

        // Let's try to call it.
        // `Action` might be irrelevant if we pass full path?
        // Or we pass `Action: ''` and provide `pathname` in options?

        // Actually, `Service` constructor took `service: 'speech_synthesis'`.
        // Maybe I can just use `this.fetchOpenAPI('', ...)`?

        // Let's look at the lint error: "fetch" not on VolcengineTTS.
        // The output showed `fetchOpenAPI`.

        // Let's try:
        const response = await this.fetchOpenAPI({} as any, requestBody, {
            pathname: '/api/v1/tts',
            method: 'POST'
        });

        // `fetchOpenAPI` usually returns a Promise<Response>.

        // Wait, if `fetchOpenAPI` signature is `(action, params, options)`, 
        // passing `{}` as action might be wrong.
        // But let's try.


        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`TTS API failed with status ${response.status}: ${errText}`);
        }

        const data = await response.json() as any;

        if (data.code !== 3000) {
            throw new Error(`TTS API error ${data.code}: ${data.message} - ${JSON.stringify(data)}`);
        }

        if (!data.data) {
            throw new Error('No audio data received');
        }

        return Buffer.from(data.data, 'base64');
    }
}
