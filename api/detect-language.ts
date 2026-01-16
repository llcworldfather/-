// Vercel Edge Function for detecting user's country from IP
export const config = {
    runtime: 'edge',
};

export default async function handler(request: Request) {
    // Get country from Vercel's geolocation header
    const country = request.headers.get('x-vercel-ip-country') || 'US';

    // Chinese-speaking regions
    const chineseRegions = ['CN', 'TW', 'HK', 'MO', 'SG'];

    // Determine language based on country
    const language = chineseRegions.includes(country) ? 'zh' : 'en';

    return new Response(JSON.stringify({
        language,
        country,
    }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            // Set cookie for detected language
            'Set-Cookie': `detected-language=${language}; Path=/; Max-Age=31536000; SameSite=Lax`
        },
    });
}
