/**
 * =============================================================================
 * Sign Language Translation API
 * =============================================================================
 * 
 * POST /api/translate
 * 
 * Gemini Vision-powered API that analyzes video frames of sign language
 * and translates between different sign languages.
 * 
 * INPUT:
 * - frames: Array of base64 encoded images (camera frames)
 * - sourceRegion: Source sign language region
 * - targetRegion: Target sign language region
 * 
 * OUTPUT:
 * - sourceText: Recognized text from sign language
 * - gloss: ASL gloss notation
 * - targetText: Translated text
 * - explanation: Detailed explanation of signs
 * - visualDescription: How to perform the signs in target language
 * - grammarStructure: Breakdown of grammar components
 * - initializedSignsFound: Array of initialized signs detected
 * 
 * =============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { SYSTEM_PROMPT } from '@/lib/constants';
import { Region } from '@/lib/types';

// =============================================================================
// TYPES
// =============================================================================

interface TranslateRequest {
    frames: string[];  // Array of base64 encoded images
    sourceRegion: string;
    targetRegion: string;
    detectedSigns?: string[]; // Signs detected by client-side hybrid recognizer
}

interface GrammarStructure {
    label: string;
    word: string;
    type: 'subject' | 'verb' | 'object' | 'pronoun' | 'other';
}

interface InitializedSign {
    word: string;
    type: string;
    kineticObservation: string;
    glossCandidate: string;
    isExactMatch: boolean;
}

interface TranslationResult {
    sourceText: string;
    gloss: string;
    targetText: string;
    explanation: string;
    visualDescription: string;
    grammarStructure: GrammarStructure[];
    initializedSignsFound: InitializedSign[];
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// =============================================================================
// TRANSLATION PROMPT
// =============================================================================

function buildTranslationPrompt(sourceRegion: string, targetRegion: string, detectedSigns: string[] = []): string {
    // Map string regions to Region enum values for SYSTEM_PROMPT
    const sourceMap: Record<string, Region> = {
        'American Sign Language (ASL)': Region.ASL,
        'British Sign Language (BSL)': Region.BSL,
        'Australian Sign Language (Auslan)': Region.AUSLAN,
        'French Sign Language (LSF)': Region.FSL,
        'Japanese Sign Language (JSL)': Region.JSL,
    };

    const source = sourceMap[sourceRegion] || Region.ASL;
    const target = sourceMap[targetRegion] || Region.BSL;

    // Format detected signs for the prompt
    const detectedSignsContext = detectedSigns.length > 0
        ? `\n\n## DETECTED SIGNS (MediaPipe Analysis):\nThe following signs were detected with high confidence by the gesture engine: [ ${detectedSigns.join(', ')} ].\nUSE THESE AS STRONG HINTS, but verify with the visual context.`
        : '';

    // Use the optimized SYSTEM_PROMPT from constants.ts
    // This prompt is specifically designed to:
    // - Detect full sequences like "MAN HE HAVE CAR"
    // - Look for objects (CAR, CELLPHONE) and verbs (HAVE, WANT)
    // - Handle ASL grammar structures (Topic-Comment, Pronoun Doubling)
    return SYSTEM_PROMPT(source, target) + detectedSignsContext;
}

// =============================================================================
// GEMINI VISION API
// =============================================================================

async function callGeminiVisionAPI(
    frames: string[],
    prompt: string,
    apiKey: string
): Promise<string> {
    // Build content parts with text prompt and multiple images
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
        { text: prompt }
    ];

    // Add each frame as an inline image
    for (const frame of frames) {
        let mimeType = 'image/jpeg';
        let imageData = frame;

        if (frame.startsWith('data:')) {
            const match = frame.match(/^data:([^;]+);base64,(.+)$/);
            if (match) {
                mimeType = match[1];
                imageData = match[2];
            }
        }

        parts.push({
            inlineData: {
                mimeType,
                data: imageData
            }
        });
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts
            }],
            generationConfig: {
                temperature: 0.3,  // Lower for accuracy
                topP: 0.9,
                maxOutputTokens: 2048,
            }
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini Vision API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
        throw new Error('No response from Gemini Vision API');
    }

    return text;
}

// =============================================================================
// RESPONSE PARSING
// =============================================================================

function parseTranslationResponse(responseText: string): TranslationResult {
    // Clean up the response - remove markdown code blocks if present
    let cleanedText = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
        cleanedText = jsonMatch[1].trim();
    } else {
        // Try to find raw JSON
        const rawJsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (rawJsonMatch) {
            cleanedText = rawJsonMatch[0];
        }
    }

    console.log('Cleaned Text:', cleanedText);

    try {
        const parsed = JSON.parse(cleanedText);

        return {
            sourceText: parsed.sourceText || 'Unable to interpret',
            gloss: parsed.gloss || '',
            targetText: parsed.targetText || parsed.sourceText || '',
            explanation: parsed.explanation || 'No explanation available',
            visualDescription: parsed.visualDescription || '',
            grammarStructure: Array.isArray(parsed.grammarStructure) ? parsed.grammarStructure : [],
            initializedSignsFound: Array.isArray(parsed.initializedSignsFound) ? parsed.initializedSignsFound : [],
        };
    } catch (error) {
        console.error('Failed to parse Gemini response:', error);
        throw new Error('Failed to parse translation response as JSON');
    }
}

// =============================================================================
// MAIN API HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
    try {
        const body: TranslateRequest = await request.json();

        // Validate request
        if (!body.frames || !Array.isArray(body.frames) || body.frames.length === 0) {
            return NextResponse.json(
                { error: 'Missing or empty frames array' },
                { status: 400 }
            );
        }

        // Get API key
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                {
                    error: 'GEMINI_API_KEY not configured',
                    message: 'Please set GEMINI_API_KEY in your .env.local file'
                },
                { status: 500 }
            );
        }

        // Set defaults
        const sourceRegion = body.sourceRegion || 'American Sign Language (ASL)';
        const targetRegion = body.targetRegion || 'British Sign Language (BSL)';

        // Build prompt and call Gemini Vision
        const prompt = buildTranslationPrompt(sourceRegion, targetRegion, body.detectedSigns);
        const geminiResponse = await callGeminiVisionAPI(body.frames, prompt, apiKey);
        const result = parseTranslationResponse(geminiResponse);

        return NextResponse.json(result);

    } catch (error) {
        console.error('Translation API error:', error);
        return NextResponse.json(
            {
                error: 'Translation failed',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
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
