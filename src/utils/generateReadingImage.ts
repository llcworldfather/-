import type { DrawnCard } from './tarot';
import type { Language } from '../context/LanguageContext';

interface GenerateImageOptions {
    cards: DrawnCard[];
    summary: string;
    language: Language;
    isDaily?: boolean;
}

// Generate Pollinations.ai image URL with mystical styling
export function getMysticalImageUrl(prompt: string): string {
    const baseUrl = "https://image.pollinations.ai/prompt/";

    const encodedPrompt = encodeURIComponent(prompt);
    const seed = Math.floor(Math.random() * 1000000);
    const width = 1200;  // Match canvas dimensions
    const height = 675;

    // turbo model is faster and has fewer CORS restrictions than flux
    const model = 'turbo';

    // enhance=true lets AI optimize the prompt for better results
    // nologo=true attempts to remove watermarks
    // private=true may help with CORS restrictions
    return `${baseUrl}${encodedPrompt}?width=${width}&height=${height}&model=${model}&seed=${seed}&nologo=true&enhance=true&private=true`;
}

// Generate English prompt based on drawn tarot cards
function generateImagePrompt(cards: DrawnCard[], isDaily: boolean): string {
    const cardDescriptions = cards.map(card => {
        const orientation = card.isReversed ? 'reversed' : 'upright';
        return `${card.name} (${orientation})`;
    }).join(', ');

    const basePrompt = isDaily
        ? `A mystical daily tarot reading scene featuring ${cardDescriptions}`
        : `An enchanting three-card tarot spread showing ${cardDescriptions}`;

    // Add mystical atmosphere keywords
    const styleKeywords = [
        'ethereal purple and gold atmosphere',
        'cinematic lighting',
        'sacred geometry background',
        'mysterious fog effects',
        'art nouveau style',
        'glowing mystical energy',
        '8k resolution',
        'highly detailed tarot art'
    ].join(', ');

    return `${basePrompt}, ${styleKeywords}`;
}

// Try to load image from Pollinations.ai with timeout using fetch API
async function tryLoadPollinationsImage(url: string, timeoutMs: number = 15000): Promise<string | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        controller.abort();
        console.warn('Pollinations.ai image loading timed out, falling back to canvas');
    }, timeoutMs);

    try {
        const response = await fetch(url, {
            signal: controller.signal,
            mode: 'cors',
            referrerPolicy: 'no-referrer'
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.warn(`Pollinations.ai returned status ${response.status}, falling back to canvas`);
            return null;
        }

        const blob = await response.blob();
        console.log('Pollinations.ai image loaded successfully');
        return URL.createObjectURL(blob);
    } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
            // Timeout already logged
        } else {
            console.warn('Pollinations.ai image failed to load, falling back to canvas:', error);
        }
        return null;
    }
}

// Load image from URL
function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

// Draw background image
async function drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number): Promise<void> {
    try {
        const bgImg = await loadImage('/bg-tarot.png');
        // Draw background to cover entire canvas
        ctx.drawImage(bgImg, 0, 0, width, height);
    } catch (error) {
        console.error('Failed to load background image, using fallback gradient:', error);
        // Fallback gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#0a0118');
        gradient.addColorStop(0.3, '#1a0b2e');
        gradient.addColorStop(0.6, '#0f0720');
        gradient.addColorStop(1, '#050210');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }
}

// Draw decorative border with moon and geometric patterns
function drawDecorativeBorder(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const borderColor = 'rgba(212, 175, 55, 0.6)'; // Gold color
    const borderColorLight = 'rgba(212, 175, 55, 0.3)';
    const margin = 25;

    ctx.save();

    // --- Outer frame lines ---
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;

    // Outer rectangle
    ctx.beginPath();
    ctx.roundRect(margin, margin, width - margin * 2, height - margin * 2, 15);
    ctx.stroke();

    // Inner rectangle (slightly inset)
    ctx.strokeStyle = borderColorLight;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(margin + 8, margin + 8, width - margin * 2 - 16, height - margin * 2 - 16, 12);
    ctx.stroke();

    // --- Corner decorations ---
    const cornerSize = 60;

    // Draw corner ornaments (all four corners)
    drawCornerOrnament(ctx, margin + 5, margin + 5, cornerSize, borderColor); // Top-left
    drawCornerOrnament(ctx, width - margin - 5, margin + 5, cornerSize, borderColor, true, false); // Top-right
    drawCornerOrnament(ctx, margin + 5, height - margin - 5, cornerSize, borderColor, false, true); // Bottom-left
    drawCornerOrnament(ctx, width - margin - 5, height - margin - 5, cornerSize, borderColor, true, true); // Bottom-right

    // --- Moon crescents on sides ---
    // Left side moon
    drawMoonCrescent(ctx, margin + 30, height / 2, 20, borderColor);
    // Right side moon (mirrored)
    drawMoonCrescent(ctx, width - margin - 30, height / 2, 20, borderColor, true);

    // --- Star decorations ---
    // Scatter some small stars in corners
    drawStar(ctx, margin + 70, margin + 70, 6, borderColorLight);
    drawStar(ctx, width - margin - 70, margin + 70, 6, borderColorLight);
    drawStar(ctx, margin + 70, height - margin - 70, 6, borderColorLight);
    drawStar(ctx, width - margin - 70, height - margin - 70, 6, borderColorLight);

    ctx.restore();
}

// Draw a corner ornament (geometric L-shape with circle)
function drawCornerOrnament(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string,
    flipX: boolean = false,
    flipY: boolean = false
): void {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.5;

    const dx = flipX ? -1 : 1;
    const dy = flipY ? -1 : 1;

    // L-shaped lines
    ctx.beginPath();
    ctx.moveTo(x, y + dy * size);
    ctx.lineTo(x, y);
    ctx.lineTo(x + dx * size, y);
    ctx.stroke();

    // Small circle at corner
    ctx.beginPath();
    ctx.arc(x + dx * 15, y + dy * 15, 4, 0, Math.PI * 2);
    ctx.stroke();

    // Decorative diamond
    ctx.beginPath();
    ctx.moveTo(x + dx * 30, y);
    ctx.lineTo(x + dx * 35, y + dy * 5);
    ctx.lineTo(x + dx * 30, y + dy * 10);
    ctx.lineTo(x + dx * 25, y + dy * 5);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
}

// Draw a moon crescent
function drawMoonCrescent(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    color: string,
    mirror: boolean = false
): void {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = 'rgba(212, 175, 55, 0.15)';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    if (mirror) {
        ctx.arc(x, y, radius, -Math.PI * 0.7, Math.PI * 0.7);
        ctx.arc(x + radius * 0.4, y, radius * 0.8, Math.PI * 0.7, -Math.PI * 0.7, true);
    } else {
        ctx.arc(x, y, radius, Math.PI * 0.3, -Math.PI * 0.3);
        ctx.arc(x - radius * 0.4, y, radius * 0.8, -Math.PI * 0.3, Math.PI * 0.3, true);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
}

// Draw a simple star
function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string): void {
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;

    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2;
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angle) * size, y + Math.sin(angle) * size);
    }
    ctx.stroke();

    // Small center dot
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

// Draw a single tarot card
async function drawCard(
    ctx: CanvasRenderingContext2D,
    card: DrawnCard,
    x: number,
    y: number,
    width: number,
    height: number,
    language: Language
): Promise<void> {
    const cardName = language === 'zh' ? card.nameCn : card.name;
    const statusText = language === 'zh'
        ? (card.isReversed ? '逆位' : '正位')
        : (card.isReversed ? 'Reversed' : 'Upright');

    // Card border with golden glow
    ctx.save();
    ctx.shadowColor = 'rgba(234, 179, 8, 0.5)';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#1a1a2e';
    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = 3;

    // Rounded rectangle for card
    const radius = 10;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Draw card image
    try {
        const img = await loadImage(card.image);
        const imgPadding = 4;
        const imgWidth = width - imgPadding * 2;
        const imgHeight = height - 50; // Leave space for card name

        ctx.save();

        // Create clipping region for image
        ctx.beginPath();
        ctx.rect(x + imgPadding, y + imgPadding, imgWidth, imgHeight);
        ctx.clip();

        // Draw image (rotated if reversed)
        if (card.isReversed) {
            ctx.translate(x + width / 2, y + imgPadding + imgHeight / 2);
            ctx.rotate(Math.PI);
            ctx.drawImage(img, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
        } else {
            ctx.drawImage(img, x + imgPadding, y + imgPadding, imgWidth, imgHeight);
        }

        ctx.restore();
    } catch (error) {
        console.error('Failed to load card image:', error);
        // Fallback: draw placeholder
        ctx.fillStyle = '#2a2a4e';
        ctx.fillRect(x + 4, y + 4, width - 8, height - 50);
    }

    // Card name and status area
    ctx.fillStyle = '#0a0a1e';
    ctx.fillRect(x + 2, y + height - 45, width - 4, 43);

    // Card name
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 14px "Microsoft YaHei", serif';
    ctx.textAlign = 'center';
    ctx.fillText(cardName, x + width / 2, y + height - 25);

    // Upright/Reversed status
    ctx.fillStyle = card.isReversed ? '#f87171' : '#4ade80';
    ctx.font = '12px "Microsoft YaHei", serif';
    ctx.fillText(statusText, x + width / 2, y + height - 8);
}

// Wrap text to fit within a maximum width
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const lines: string[] = [];
    const paragraphs = text.split('\n');

    for (const paragraph of paragraphs) {
        if (!paragraph.trim()) {
            lines.push('');
            continue;
        }

        const words = paragraph.split('');
        let currentLine = '';

        for (const char of words) {
            const testLine = currentLine + char;
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = char;
            } else {
                currentLine = testLine;
            }
        }

        if (currentLine) {
            lines.push(currentLine);
        }
    }

    return lines;
}

// Extract summary from reading (first meaningful paragraph)
export function extractSummary(reading: string): string {
    // Remove markdown formatting
    const cleanText = reading
        .replace(/#{1,6}\s*/g, '')
        .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/>\s*/g, '')
        .replace(/[-*]\s*/g, '')
        .trim();

    // Split into paragraphs and get first non-empty one
    const paragraphs = cleanText.split(/\n\n+/).filter(p => p.trim().length > 20);
    const summary = paragraphs[0] || cleanText.substring(0, 200);

    // Limit length
    if (summary.length > 150) {
        return summary.substring(0, 147) + '...';
    }
    return summary;
}

// Format date according to language
function formatDate(language: Language): string {
    const now = new Date();
    if (language === 'zh') {
        return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
    }
    return now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Main function to generate reading image
export async function generateReadingImage(options: GenerateImageOptions): Promise<string> {
    const { cards, summary, language, isDaily = false } = options;

    // Try Pollinations.ai first
    try {
        const prompt = generateImagePrompt(cards, isDaily);
        const imageUrl = getMysticalImageUrl(prompt);
        console.log('Attempting to load image from Pollinations.ai...');

        const pollinationsResult = await tryLoadPollinationsImage(imageUrl, 20000);
        if (pollinationsResult) {
            return pollinationsResult;
        }
    } catch (error) {
        console.warn('Pollinations.ai error, falling back to canvas:', error);
    }

    // Fallback to Canvas generation
    console.log('Using Canvas fallback for image generation');
    const width = 1200;
    const height = 675;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // 1. Draw background
    await drawBackground(ctx, width, height);

    // 2. Draw decorative border
    drawDecorativeBorder(ctx, width, height);

    // --- Title Configuration ---
    const title = language === 'zh'
        ? (isDaily ? '今日塔罗' : '塔罗占卜')
        : (isDaily ? 'Daily Tarot' : 'Tarot Reading');

    const dateText = formatDate(language);

    const titleY = 115;
    const dateY = 180;

    // --- Step 2: Draw Title ---
    ctx.save();
    ctx.font = 'bold 80px "Microsoft YaHei", "SimHei", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = "15px";

    const titleGradient = ctx.createLinearGradient(0, titleY - 40, 0, titleY + 40);
    titleGradient.addColorStop(0, '#E6D2A0');
    titleGradient.addColorStop(0.4, '#C6A55F');
    titleGradient.addColorStop(1, '#8C6E2D');

    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 4;

    ctx.fillStyle = titleGradient;
    ctx.fillText(title, width / 2, titleY);

    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 235, 180, 0.3)';
    ctx.strokeText(title, width / 2, titleY);

    ctx.restore();
    ctx.letterSpacing = "0px";

    // --- Step 3: Draw Date ---
    ctx.save();
    ctx.font = 'bold 26px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = "5px";

    ctx.fillStyle = '#D6C088';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetY = 2;

    ctx.fillText(dateText, width / 2, dateY);

    ctx.restore();
    ctx.letterSpacing = "0px";


    // --- Step 4: Content Layout ---
    const contentY = 230;
    const cardOpacity = 0.85; // 卡牌透明度

    if (isDaily && cards.length >= 1) {
        // --- Single Card Layout (Adjusted Text Box Ratio) ---
        const cardWidth = 200;
        const cardHeight = 340;

        // 【核心调整】：调整间距和文本框宽度
        const gap = 50; // 稍微拉近一点距离
        // 之前的宽度是 480，现在改为 380，让它更接近正方形 (380x340)
        const boxWidth = 380;
        const boxHeight = cardHeight; // 高度保持与卡牌一致

        // 重新计算居中起始位置
        const totalContentWidth = cardWidth + gap + boxWidth;
        const startX = (width - totalContentWidth) / 2;

        const cardX = startX;
        const cardY = contentY;

        // Draw Card with Opacity
        ctx.save();
        ctx.globalAlpha = cardOpacity;
        await drawCard(ctx, cards[0], cardX, cardY, cardWidth, cardHeight, language);
        ctx.restore();

        // Draw Summary Box
        const boxX = cardX + cardWidth + gap;
        const boxY = cardY;

        drawSummaryBox(ctx, boxX, boxY, boxWidth, boxHeight, summary, language);

    } else {
        // --- Three Card Layout (Also centered now) ---
        const cardWidth = 140;
        const cardHeight = 240;
        const cardSpacing = 30;
        const numCards = Math.min(cards.length, 3);

        const boxWidth = 380; // 保持一致的宽度
        const boxHeight = cardHeight + 20; // 稍微高一点点
        const gap = 50;

        // Calculate total width of the whole group (Cards + Gap + Box)
        const cardsBlockWidth = numCards * cardWidth + (numCards - 1) * cardSpacing;
        const totalContentWidth = cardsBlockWidth + gap + boxWidth;

        // Center the whole group
        const startX = (width - totalContentWidth) / 2;
        const cardStartY = contentY + 30;

        // Draw Cards
        for (let i = 0; i < numCards; i++) {
            const x = startX + i * (cardWidth + cardSpacing);

            ctx.save();
            ctx.globalAlpha = cardOpacity;
            await drawCard(ctx, cards[i], x, cardStartY, cardWidth, cardHeight, language);
            ctx.restore();
        }

        // Draw Summary Box
        const boxX = startX + cardsBlockWidth + gap;
        const boxY = cardStartY - 10;

        drawSummaryBox(ctx, boxX, boxY, boxWidth, boxHeight, summary, language);
    }

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) {
                    resolve(URL.createObjectURL(blob));
                } else {
                    reject(new Error('Failed to create image blob'));
                }
            },
            'image/png',
            1.0
        );
    });
}
// Helper function to draw summary box with mystical antique style
function drawSummaryBox(
    ctx: CanvasRenderingContext2D,
    boxX: number,
    boxY: number,
    boxWidth: number,
    _maxBoxHeight: number,
    summary: string,
    language: 'zh' | 'en'
): void {
    const summaryTitle = language === 'zh' ? '核心解读' : 'Key Insight';

    // 1. 设置字体 (保持宋体/衬线体，这是古朴感的来源)
    const bodyFontFamily = '"SimSun", "Songti SC", "Noto Serif SC", serif';
    const titleFontFamily = '"SimSun", "Songti SC", "Noto Serif SC", serif';

    // 2. 绘制背景
    // 保持极低的透明度，让星空透出来，模拟“玻璃/纱幕”质感
    ctx.save();
    ctx.fillStyle = 'rgba(15, 10, 25, 0.3)'; // 深色半透明底
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, _maxBoxHeight, 8); // 使用传入的高度画满
    ctx.fill();
    ctx.restore();

    // 3. 绘制边框
    // 极细的、若隐若现的古铜色边框
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(180, 160, 120, 0.2)'; // 降低饱和度，去掉了黄气
    ctx.stroke();
    ctx.restore();

    // --- 标题部分 ---
    ctx.save();
    ctx.font = `bold 30px ${titleFontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // 【核心修改 1：标题颜色】
    // 原型图：淡香槟色/米金色 (Pale Champagne)
    // 旧版：#FFD700 (太黄) -> 新版：#F2E6CE (米白金)
    // 这种颜色在深色背景上非常高级，不刺眼
    const titleGradient = ctx.createLinearGradient(0, boxY, 0, boxY + 40);
    titleGradient.addColorStop(0, '#f5ce7bff');   // 顶部：极淡的米白
    titleGradient.addColorStop(1, '#e2d1abff');   // 底部：沉稳的米灰金
    ctx.fillStyle = titleGradient;

    // 阴影：深褐色，增加刻印感
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;

    ctx.fillText(summaryTitle, boxX + boxWidth / 2, boxY + 25);
    ctx.shadowBlur = 0; // 重置阴影

    // --- 分隔线 ---
    // 标题下方那条渐隐的线
    const lineY = boxY + 65;
    const lineGradient = ctx.createLinearGradient(boxX + 40, 0, boxX + boxWidth - 40, 0);
    lineGradient.addColorStop(0, 'rgba(200, 180, 140, 0)');
    lineGradient.addColorStop(0.5, 'rgba(200, 180, 140, 0.5)'); // 中间也只有50%透明度，非常淡
    lineGradient.addColorStop(1, 'rgba(200, 180, 140, 0)');

    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(boxX + 40, lineY);
    ctx.lineTo(boxX + boxWidth - 40, lineY);
    ctx.stroke();
    ctx.restore();

    // --- 正文部分 ---
    ctx.save();

    // 【核心修改 2：正文颜色】
    // 原型图：灰米色 (Muted Beige)
    // 旧版：#FFFCE6 (亮白/亮黄) -> 新版：#D6CDB8 (古籍纸张的颜色)
    // 这种颜色长时间阅读不累，且完美契合复古氛围
    ctx.fillStyle = '#D6CDB8';

    ctx.font = `17px ${bodyFontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // 微弱的深色描边/阴影，防止文字融入背景星光
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 2;

    const lineHeight = 28;
    const textMaxWidth = boxWidth - 50; // 左右留白
    const startTextY = boxY + 85; // 标题下移一点

    // 计算换行
    const lines = wrapText(ctx, summary, textMaxWidth);

    // 限制显示的行数
    const maxLines = Math.floor((_maxBoxHeight - 85 - 20) / lineHeight);

    lines.slice(0, maxLines).forEach((line, index) => {
        // 增加一点左边距 (boxX + 25)
        ctx.fillText(line, boxX + 25, startTextY + index * lineHeight);
    });
    ctx.restore();
}

// Download the generated image
export function downloadImage(blobUrl: string, filename: string): void {
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up blob URL after download
    setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
}
