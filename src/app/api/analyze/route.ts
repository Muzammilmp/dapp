import { NextRequest, NextResponse } from 'next/server';

// Recommended models for face/attractiveness classification
// 1. nateraw/vit-age-classifier (for age estimation)
// 2. prithivMLmods/Face-Real-Fake-Classifier (for quality)
const MODEL_URL = 'https://api-inference.huggingface.co/models/nateraw/vit-age-classifier';

export async function POST(req: NextRequest) {
    try {
        const { imageData } = await req.json();

        if (!imageData) {
            return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
        }

        const apiKey = process.env.HUGGINGFACE_API_KEY;
        if (!apiKey || apiKey === 'your_api_key_here') {
            console.warn('HUGGINGFACE_API_KEY is missing or placeholder. Using fallback pseudo-random logic.');
            // Return an empty array to trigger client-side pseudo-random fallback
            return NextResponse.json([]);
        }

        const response = await fetch(MODEL_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ inputs: imageData }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('HuggingFace API error:', errorText);
            return NextResponse.json({ error: 'AI analysis failed' }, { status: response.status });
        }

        const result = await response.json();
        return NextResponse.json(result);
    } catch (err) {
        console.error('API Error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}