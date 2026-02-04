/**
 * =============================================================================
 * Sign Language Researcher Agent API
 * =============================================================================
 * 
 * POST /api/agents/researcher
 * 
 * Gemini-powered agent that researches sign language linguistics.
 * Provides information about:
 * - Whether a sign is initialized
 * - The movement description
 * - Word families and related signs
 * - Cross-language equivalents
 * 
 * =============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';

// Request body type
interface ResearchRequest {
    word: string;
    sourceLanguage: string;
    targetLanguage?: string;
}

// Response type
interface SignResearch {
    word: string;
    isInitialized: boolean;
    initializationLetter: string | null;
    movementDescription: string;
    handshapeDescription: string;
    family: {
        name: string;
        description: string;
        relatedWords: string[];
        sharedMovement: string;
    } | null;
    culturalContext: string;
    targetEquivalent?: {
        word: string;
        isInitialized: boolean;
        movement: string;
        handshape: string;
    };
}

// Gemini API configuration
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

/**
 * Build the research prompt for Gemini
 */
function buildResearchPrompt(request: ResearchRequest): string {
    const basePrompt = `You are an expert sign language linguist specializing in American Sign Language (ASL) and other sign languages worldwide.

Research the sign for the word "${request.word}" in ${request.sourceLanguage}.

Provide a structured analysis with the following information:

1. **Initialization Status**: Is this an "initialized sign"? (A sign where the handshape uses the first letter of the English word)
   - If yes, what letter does it use?

2. **Handshape Description**: Describe the hand position/shape required

3. **Movement Description**: Describe the movement required to form this sign
   - Direction of movement
   - Type of movement (circular, arc, tap, shake, forward push, etc.)
   - Starting and ending positions

4. **Word Family** (if applicable): 
   - Does this sign belong to a family of related signs that share the same movement but use different letters?
   - List related words in the same family
   - Describe what movement they all share

5. **Cultural Context**: Any important cultural notes about this sign

${request.targetLanguage ? `
6. **Translation to ${request.targetLanguage}**:
   - What is the equivalent sign in ${request.targetLanguage}?
   - Is it also an initialized sign?
   - How does the movement differ?
` : ''}

Format your response as JSON with this structure:
{
  "word": "${request.word}",
  "isInitialized": true/false,
  "initializationLetter": "X" or null,
  "handshapeDescription": "description",
  "movementDescription": "description",
  "family": {
    "name": "family name",
    "description": "what connects these words",
    "relatedWords": ["word1", "word2"],
    "sharedMovement": "description of shared movement"
  } or null,
  "culturalContext": "notes"${request.targetLanguage ? `,
  "targetEquivalent": {
    "word": "equivalent word",
    "isInitialized": true/false,
    "movement": "movement description",
    "handshape": "handshape description"
  }` : ''}
}`;

    return basePrompt;
}

/**
 * Call Gemini API
 */
async function callGeminiAPI(prompt: string, apiKey: string): Promise<string> {
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
                temperature: 0.7,
                topP: 0.8,
                topK: 40,
                maxOutputTokens: 2048,
            }
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Extract text from Gemini response
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
        throw new Error('No response text from Gemini');
    }

    return text;
}

/**
 * Parse Gemini response to structured data
 */
function parseGeminiResponse(responseText: string): SignResearch {
    // Try to extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('Could not parse JSON from Gemini response');
    }

    try {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
            word: parsed.word || '',
            isInitialized: parsed.isInitialized || false,
            initializationLetter: parsed.initializationLetter || null,
            movementDescription: parsed.movementDescription || 'Unknown movement',
            handshapeDescription: parsed.handshapeDescription || 'Unknown handshape',
            family: parsed.family || null,
            culturalContext: parsed.culturalContext || '',
            targetEquivalent: parsed.targetEquivalent,
        };
    } catch {
        throw new Error('Failed to parse Gemini response as JSON');
    }
}

/**
 * Main API handler
 */
export async function POST(request: NextRequest) {
    try {
        const body: ResearchRequest = await request.json();

        // Validate request
        if (!body.word) {
            return NextResponse.json(
                { error: 'Missing required field: word' },
                { status: 400 }
            );
        }

        if (!body.sourceLanguage) {
            body.sourceLanguage = 'ASL'; // Default to ASL
        }

        // Get API key from environment
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                {
                    error: 'Gemini API key not configured',
                    message: 'Please set GEMINI_API_KEY in your .env.local file'
                },
                { status: 500 }
            );
        }

        // Build prompt and call Gemini
        const prompt = buildResearchPrompt(body);
        const geminiResponse = await callGeminiAPI(prompt, apiKey);
        const research = parseGeminiResponse(geminiResponse);

        return NextResponse.json(research);

    } catch (error) {
        console.error('Researcher agent error:', error);
        return NextResponse.json(
            {
                error: 'Research failed',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

/**
 * Handle OPTIONS for CORS
 */
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
