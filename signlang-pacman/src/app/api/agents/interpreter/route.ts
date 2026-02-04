/**
 * =============================================================================
 * Sign Language Interpreter Agent API - Vision Enhanced
 * =============================================================================
 * 
 * POST /api/agents/interpreter
 * 
 * Gemini Vision-powered agent that recognizes sign language from camera frames
 * and translates between sign languages in real-time.
 * 
 * WORKFLOW:
 * 1. Receive camera frame (base64 image) OR detected gesture data
 * 2. Use Gemini Vision API to recognize the sign
 * 3. Translate to target sign language
 * 4. Return recognition result with translation
 * 
 * RATE LIMITING:
 * - Server-side: Max 1 vision request per 2 seconds per session
 * - Prevents API quota exhaustion
 * 
 * =============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';

// =============================================================================
// TYPES
// =============================================================================

interface InterpretRequest {
    // NEW: Image-based recognition (preferred)
    imageBase64?: string;  // Base64 encoded camera frame (JPEG/PNG)

    // Legacy: Landmark-based recognition (fallback)
    detectedSign?: {
        letter: string;
        letterConfidence: number;
        movement: {
            type: string;
            direction?: string;
            magnitude: number;
            confidence: number;
        };
    };

    sourceLanguage: string;
    targetLanguage: string;
    previousSigns?: string[];
}

interface InterpretationResult {
    interpretation: {
        recognizedSign: string;      // The recognized sign/word
        meaning: string;             // Brief definition
        confidence: number;          // 0.0 - 1.0
        isWord: boolean;             // true if word, false if letter
    };
    translation: {
        targetSign: string;          // Sign in target language
        handshape: string;           // Hand configuration
        movement: string;            // Movement description
        facialExpression?: string;   // Required facial expression
        culturalNotes?: string;      // Grammar/cultural notes
    };
    metadata: {
        processingMode: 'vision' | 'landmark' | 'fallback';
        rateLimited: boolean;
        processingTimeMs: number;
    };
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Rate limiting: Track last request time per session (simple in-memory store)
// In production, use Redis or similar
const rateLimitStore = new Map<string, number>();
const RATE_LIMIT_MS = 5000;  // 5 seconds between requests (12 RPM max)

// =============================================================================
// RATE LIMITING
// =============================================================================

function checkRateLimit(sessionId: string): { allowed: boolean; waitMs: number } {
    const now = Date.now();
    const lastRequest = rateLimitStore.get(sessionId) || 0;
    const elapsed = now - lastRequest;

    if (elapsed < RATE_LIMIT_MS) {
        return { allowed: false, waitMs: RATE_LIMIT_MS - elapsed };
    }

    rateLimitStore.set(sessionId, now);
    return { allowed: true, waitMs: 0 };
}

// Clean up old entries periodically (prevent memory leak)
setInterval(() => {
    const now = Date.now();
    for (const [key, timestamp] of rateLimitStore.entries()) {
        if (now - timestamp > 60000) { // Remove entries older than 1 minute
            rateLimitStore.delete(key);
        }
    }
}, 30000);

// =============================================================================
// VISION RECOGNITION PROMPT
// =============================================================================

function buildVisionPrompt(sourceLanguage: string, targetLanguage: string, previousSigns: string[]): string {
    const contextStr = previousSigns.length > 0
        ? `Previous signs in conversation: ${previousSigns.join(' → ')}`
        : 'This is the start of the conversation.';

    return `You are an expert sign language recognition system. Analyze this image and identify any sign language gesture being performed.

## Context
${contextStr}
Source Language: ${sourceLanguage}
Target Language: ${targetLanguage}

## Your Task
1. **Identify the Sign**: Look at the hand(s) in the image. What sign is being performed?
   - If hands are clearly forming a letter (fingerspelling), identify the letter.
   - If hands are forming a word/phrase sign, identify the word.
   - If no clear sign is detected, return "NO_SIGN".

2. **Translate**: Convert the recognized sign to ${targetLanguage}.

3. **Describe**: Provide clear instructions for how to perform this sign in ${targetLanguage}.

## Important Rules
- Be STRICT about recognition. If the gesture is unclear or the person is not signing, return "NO_SIGN".
- For fingerspelling, recognize common ASL/BSL/ISL hand positions.
- For word signs, look for common greetings, emotions, and everyday signs.
- Do NOT guess randomly. Only identify signs you are confident about.

## Output (JSON only)
{
  "interpretation": {
    "recognizedSign": "HELLO" or "A" or "NO_SIGN",
    "meaning": "A greeting" or "The letter A" or "No sign detected",
    "confidence": 0.0-1.0,
    "isWord": true/false
  },
  "translation": {
    "targetSign": "Sign name in ${targetLanguage}",
    "handshape": "Description of hand shape",
    "movement": "Description of movement",
    "facialExpression": "Required expression if any",
    "culturalNotes": "Grammar notes for ${targetLanguage}"
  }
}`;
}

// =============================================================================
// GEMINI API CALLS
// =============================================================================

async function callGeminiVisionAPI(
    imageBase64: string,
    prompt: string,
    apiKey: string
): Promise<string> {
    // Determine mime type from base64 header or default to jpeg
    let mimeType = 'image/jpeg';
    let imageData = imageBase64;

    if (imageBase64.startsWith('data:')) {
        const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
            mimeType = match[1];
            imageData = match[2];
        }
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType,
                            data: imageData
                        }
                    }
                ]
            }],
            generationConfig: {
                temperature: 0.2,  // Low for accurate recognition
                topP: 0.8,
                maxOutputTokens: 1024,
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

async function callGeminiTextAPI(prompt: string, apiKey: string): Promise<string> {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                temperature: 0.3,
                topP: 0.8,
                maxOutputTokens: 1024,
            }
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// =============================================================================
// RESPONSE PARSING
// =============================================================================

function parseVisionResponse(responseText: string, processingMode: 'vision' | 'landmark' | 'fallback', startTime: number): InterpretationResult {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('Could not parse JSON from Gemini response');
    }

    try {
        const parsed = JSON.parse(jsonMatch[0]);

        return {
            interpretation: {
                recognizedSign: parsed.interpretation?.recognizedSign || 'NO_SIGN',
                meaning: parsed.interpretation?.meaning || 'Unable to interpret',
                confidence: parsed.interpretation?.confidence || 0.5,
                isWord: parsed.interpretation?.isWord || false,
            },
            translation: {
                targetSign: parsed.translation?.targetSign || 'Unknown',
                handshape: parsed.translation?.handshape || 'Unknown',
                movement: parsed.translation?.movement || 'Unknown',
                facialExpression: parsed.translation?.facialExpression,
                culturalNotes: parsed.translation?.culturalNotes,
            },
            metadata: {
                processingMode,
                rateLimited: false,
                processingTimeMs: Date.now() - startTime,
            }
        };
    } catch {
        throw new Error('Failed to parse Gemini response as JSON');
    }
}

// =============================================================================
// FALLBACK INTERPRETATION
// =============================================================================

function getFallbackResult(reason: string, startTime: number): InterpretationResult {
    return {
        interpretation: {
            recognizedSign: 'NO_SIGN',
            meaning: reason,
            confidence: 0,
            isWord: false,
        },
        translation: {
            targetSign: 'N/A',
            handshape: 'N/A',
            movement: 'N/A',
        },
        metadata: {
            processingMode: 'fallback',
            rateLimited: reason.includes('rate'),
            processingTimeMs: Date.now() - startTime,
        }
    };
}

// =============================================================================
// MAIN API HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        const body: InterpretRequest = await request.json();

        // Generate session ID from request (use IP or generate one)
        const sessionId = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'default-session';

        // Check rate limit
        const rateCheck = checkRateLimit(sessionId);
        if (!rateCheck.allowed) {
            return NextResponse.json({
                ...getFallbackResult(`Rate limited. Please wait ${Math.ceil(rateCheck.waitMs / 1000)}s`, startTime),
                retryAfterMs: rateCheck.waitMs,
            });
        }

        // Get API key
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({
                ...getFallbackResult('GEMINI_API_KEY not configured', startTime),
                error: 'API key missing'
            }, { status: 500 });
        }

        // Set defaults
        const sourceLanguage = body.sourceLanguage || 'American Sign Language (ASL)';
        const targetLanguage = body.targetLanguage || 'British Sign Language (BSL)';
        const previousSigns = body.previousSigns || [];

        // VISION MODE: Use camera frame
        if (body.imageBase64) {
            const prompt = buildVisionPrompt(sourceLanguage, targetLanguage, previousSigns);
            const response = await callGeminiVisionAPI(body.imageBase64, prompt, apiKey);
            const result = parseVisionResponse(response, 'vision', startTime);
            return NextResponse.json(result);
        }

        // LANDMARK MODE: Use detected sign data (legacy)
        if (body.detectedSign?.letter) {
            const prompt = `Translate the sign language letter/word "${body.detectedSign.letter}" from ${sourceLanguage} to ${targetLanguage}.
            
Previous context: ${previousSigns.length > 0 ? previousSigns.join(' → ') : 'Start of conversation'}
Movement detected: ${body.detectedSign.movement?.type || 'static'}

Output JSON:
{
  "interpretation": {
    "recognizedSign": "${body.detectedSign.letter}",
    "meaning": "Brief meaning",
    "confidence": ${body.detectedSign.letterConfidence || 0.7},
    "isWord": false
  },
  "translation": {
    "targetSign": "Sign in ${targetLanguage}",
    "handshape": "Hand configuration",
    "movement": "Movement description",
    "culturalNotes": "Any grammar notes"
  }
}`;

            const response = await callGeminiTextAPI(prompt, apiKey);
            const result = parseVisionResponse(response, 'landmark', startTime);
            return NextResponse.json(result);
        }

        // No valid input
        return NextResponse.json({
            ...getFallbackResult('No image or sign data provided', startTime),
            error: 'Missing imageBase64 or detectedSign'
        }, { status: 400 });

    } catch (error) {
        console.error('Interpreter error:', error);
        return NextResponse.json({
            ...getFallbackResult(error instanceof Error ? error.message : 'Unknown error', startTime),
            error: 'Processing failed'
        }, { status: 500 });
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
