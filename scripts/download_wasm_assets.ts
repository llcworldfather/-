
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const DEST_DIR = path.join(PUBLIC_DIR, 'sherpa-onnx-wasm');

if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true });
}

const FILES = [
    {
        name: 'sherpa-onnx-wasm-main-tts.js',
        url: 'https://huggingface.co/spaces/k2-fsa/web-assembly-zh-en-tts-matcha/resolve/main/sherpa-onnx-wasm-main-tts.js'
    },
    {
        name: 'sherpa-onnx-wasm-main-tts.wasm',
        url: 'https://huggingface.co/spaces/k2-fsa/web-assembly-zh-en-tts-matcha/resolve/main/sherpa-onnx-wasm-main-tts.wasm'
    },
    {
        name: 'sherpa-onnx-tts.js',
        url: 'https://huggingface.co/spaces/k2-fsa/web-assembly-zh-en-tts-matcha/resolve/main/sherpa-onnx-tts.js'
    },
    {
        name: 'model.onnx',
        url: 'https://huggingface.co/csukuangfj/vits-zh-aishell3/resolve/main/vits-aishell3.int8.onnx'
    },
    {
        name: 'tokens.txt',
        url: 'https://huggingface.co/csukuangfj/vits-zh-aishell3/resolve/main/tokens.txt'
    },
    {
        name: 'lexicon.txt',
        url: 'https://huggingface.co/csukuangfj/vits-zh-aishell3/resolve/main/lexicon.txt'
    }
];

async function downloadFile(url: string, destPath: string) {
    console.log(`Downloading ${url} -> ${destPath}...`);
    const writer = fs.createWriteStream(destPath);

    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });

        response.data.pipe(writer);

        return new Promise<void>((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (error) {
        writer.close();
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath); // Clean up partial file
        throw error;
    }
}

async function main() {
    console.log('Starting assets download...');
    try {
        for (const file of FILES) {
            const destPath = path.join(DEST_DIR, file.name);
            if (fs.existsSync(destPath)) {
                // Check if file is empty or very small (failed download)
                const stats = fs.statSync(destPath);
                if (stats.size > 1000) {
                    console.log(`File ${file.name} (size: ${stats.size}) already exists. Skipping.`);
                    continue;
                }
                console.log(`File ${file.name} exists but seems invalid (size: ${stats.size}). Re-downloading.`);
            }
            await downloadFile(file.url, destPath);
            console.log(`Downloaded ${file.name}`);
        }
        console.log('All assets downloaded successfully.');
    } catch (error) {
        console.error('Download failed:', error);
        process.exit(1);
    }
}

main();
