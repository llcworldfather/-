
export class TtsEngine {
    private static instance: TtsEngine;
    private synthesis: SpeechSynthesis;
    // Keep references to active utterances to prevent Garbage Collection (Chrome bug)
    private activeUtterances: Set<SpeechSynthesisUtterance> = new Set();

    private constructor() {
        this.synthesis = window.speechSynthesis;
    }

    public static getInstance(): TtsEngine {
        if (!TtsEngine.instance) {
            TtsEngine.instance = new TtsEngine();
        }
        return TtsEngine.instance;
    }

    // Keep init for compatibility
    public async init(): Promise<void> {
        return Promise.resolve();
    }

    public async speak(text: string, onFirstChunk?: () => void): Promise<void> {
        // Cancel any current speaking
        this.stop();

        // Split text into sentences
        const sentences = text.match(/[^。！？.!?\n]+[。！？.!?\n]?/g) || [text];
        if (sentences.length === 0) return Promise.resolve();

        let isFirst = true;

        // Ensure voices are loaded
        let voices = this.synthesis.getVoices();
        if (voices.length === 0) {
            await new Promise<void>(resolve => {
                const onVoicesChanged = () => {
                    this.synthesis.removeEventListener('voiceschanged', onVoicesChanged);
                    resolve();
                };
                this.synthesis.addEventListener('voiceschanged', onVoicesChanged);
                setTimeout(resolve, 2000); // 2s timeout
            });
            voices = this.synthesis.getVoices();
        }

        // Select Voice: Prioritize Google Chinese, then Microsoft Chinese, then any Chinese
        const zhVoice = voices.find(v => v.name.includes('Google') && (v.lang.includes('zh') || v.lang.includes('CN')))
            || voices.find(v => v.lang.includes('zh') || v.lang.includes('CN'));

        console.log('TTS using voice:', zhVoice ? zhVoice.name : 'System Default');

        return new Promise((resolve) => {
            let currentIndex = 0;

            const speakNext = () => {
                if (currentIndex >= sentences.length) {
                    resolve();
                    return;
                }

                const chunk = sentences[currentIndex];
                if (!chunk.trim()) {
                    currentIndex++;
                    speakNext();
                    return;
                }

                // Create new utterance for each chunk
                const utterance = new SpeechSynthesisUtterance(chunk.trim());
                // IMPORTANT: Add to Set to prevent GC
                this.activeUtterances.add(utterance);

                utterance.lang = 'zh-CN';
                utterance.rate = 1.0;
                if (zhVoice) utterance.voice = zhVoice;

                utterance.onstart = () => {
                    if (isFirst && onFirstChunk) {
                        onFirstChunk();
                        isFirst = false;
                    }
                };

                utterance.onend = () => {
                    this.activeUtterances.delete(utterance); // Cleanup
                    currentIndex++;
                    speakNext();
                };

                utterance.onerror = (event) => {
                    console.error('TTS Chunk Error:', event.error, event);
                    this.activeUtterances.delete(utterance); // Cleanup

                    // If interrupted manually, stop. Otherwise try continue.
                    if (event.error === 'interrupted' || event.error === 'canceled') {
                        resolve();
                    } else {
                        // Attempt next chunk despite error
                        currentIndex++;
                        speakNext();
                    }
                };

                // Small delay to allow browser to breathe
                setTimeout(() => {
                    this.synthesis.speak(utterance);
                }, 50);
            };

            speakNext();
        });
    }

    public stop() {
        this.synthesis.cancel();
        this.activeUtterances.clear();
    }
}
