/**
 * =============================================================================
 * Visual Reference Generation API - Gemini Native Image Generation
 * =============================================================================
 * 
 * POST /api/visual
 * 
 * Generates visual demonstration images for sign language gestures using
 * Gemini's native image generation (gemini-2.5-flash-image).
 * 
 * INPUT:
 * - description: Text description of the sign to visualize
 * - targetRegion: Target sign language region
 * 
 * OUTPUT:
 * - image: Base64 encoded image or URL of the generated demonstration
 * - description: Detailed description of how to perform the sign
 * 
 * =============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// =============================================================================
// TYPES
// =============================================================================

interface VisualRequest {
    description: string;
    targetRegion: string;
}

// =============================================================================
// RATE LIMITING
// =============================================================================

// Simple in-memory rate limiter
const rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 requests per minute

function checkRateLimit(key: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
        // Reset or create new entry
        rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
        return { allowed: true };
    }

    if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
        return { allowed: false, retryAfter };
    }

    entry.count++;
    return { allowed: true };
}

// =============================================================================
// GEMINI AI CLIENT
// =============================================================================

let aiClient: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
    if (!aiClient) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY not configured');
        }
        aiClient = new GoogleGenAI({ apiKey });
    }
    return aiClient;
}

// =============================================================================
// IMAGE GENERATION WITH GEMINI NATIVE
// =============================================================================

// Correct model for Gemini native image generation
const IMAGE_MODEL = 'gemini-2.0-flash-exp-image-generation';

// Fallback to Imagen 3 if Gemini image gen fails
const IMAGEN_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:generateImages';

async function generateWithImagen(prompt: string, apiKey: string): Promise<string | null> {
    try {
        const response = await fetch(`${IMAGEN_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                instances: [{ prompt }],
                parameters: { sampleCount: 1, aspectRatio: "1:1", personGeneration: "allow_adult" }
            }),
        });

        if (!response.ok) return null;

        const data = await response.json();
        const imageData = data.predictions?.[0]?.bytesBase64Encoded;
        return imageData ? `data:image/png;base64,${imageData}` : null;
    } catch {
        return null;
    }
}

async function generateSignVisual(description: string): Promise<string | null> {
    const ai = getAI();
    const prompt = `A professional clear instructional illustration of a person performing this sign language gesture: ${description}. White background, minimalist, high contrast.`;

    try {
        // Try Gemini native image generation first
        const response = await ai.models.generateContent({
            model: IMAGE_MODEL,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                responseModalities: ['image', 'text']
            }
        });

        // Extract image from response parts
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }

        // Fallback to Imagen if no image in response
        console.log('Gemini image gen returned no image, trying Imagen...');
        return await generateWithImagen(prompt, process.env.GEMINI_API_KEY!);
    } catch (error) {
        console.error("Gemini image generation failed:", error);
        // Fallback to Imagen
        return await generateWithImagen(prompt, process.env.GEMINI_API_KEY!);
    }
}

// =============================================================================
// TEXT DESCRIPTION GENERATION (FALLBACK)
// =============================================================================

async function generateTextDescription(description: string, targetRegion: string): Promise<string> {
    try {
        const ai = getAI();
        const prompt = `You are an expert sign language instructor. Provide a brief, helpful description of how to perform this sign.

Sign: ${description}
Target Language: ${targetRegion}

Provide a 2-3 sentence description of:
1. Hand shape and position
2. Movement required
3. Any facial expression needed

Keep it concise and practical.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: { parts: [{ text: prompt }] },
            config: {
                temperature: 0.4,
                maxOutputTokens: 256,
            }
        });

        return response.candidates?.[0]?.content?.parts?.[0]?.text || 'Sign language demonstration';
    } catch {
        return 'Sign language demonstration';
    }
}

// =============================================================================
// MAIN API HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
    try {
        // Check rate limit (using IP or fallback to global)
        const clientIP = request.headers.get('x-forwarded-for') || 'global';
        const rateCheck = checkRateLimit(clientIP);

        if (!rateCheck.allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Please wait before requesting more images.', retryAfter: rateCheck.retryAfter },
                { status: 429 }
            );
        }

        const body: VisualRequest = await request.json();

        // Validate request
        if (!body.description) {
            return NextResponse.json(
                { error: 'Missing description' },
                { status: 400 }
            );
        }

        // Extract the sign word from the description
        const signWord = body.description.match(/"([^"]+)"/)?.[1] ||
            body.description.split(' ').slice(-2, -1)[0] ||
            'sign';

        // Check API key
        if (!process.env.GEMINI_API_KEY) {
            // Return placeholder if no API key
            return NextResponse.json({
                image: `https://placehold.co/400x400/8b5cf6/white?text=${encodeURIComponent(signWord.toUpperCase())}`,
                description: `Learn to sign: ${signWord}`
            });
        }

        // Set defaults
        const targetRegion = body.targetRegion || 'British Sign Language (BSL)';

        // Generate image with Gemini native
        console.log(`Generating image for sign: ${signWord} in ${targetRegion}`);
        const generatedImage = await generateSignVisual(body.description);

        // Generate text description in parallel
        const textDescription = await generateTextDescription(body.description, targetRegion);

        if (generatedImage) {
            // Successfully generated image
            return NextResponse.json({
                image: generatedImage,
                description: textDescription
            });
        } else {
            // Fallback to placeholder with description
            console.log('Image generation failed, using placeholder');
            return NextResponse.json({
                image: `https://placehold.co/400x400/4f46e5/white?text=${encodeURIComponent(signWord.toUpperCase())}`,
                description: textDescription
            });
        }

    } catch (error) {
        console.error('Visual generation API error:', error);

        // Return placeholder on error
        return NextResponse.json({
            image: 'https://placehold.co/400x400/ef4444/white?text=Visual+Error',
            description: 'Visual generation failed. Please try again.'
        });
    }
}

// =============================================================================
// CORS HANDLER
// =============================================================================

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
