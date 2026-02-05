import { GoogleGenAI } from "@google/genai";
import { Region, TranslationResult } from "../components/translate/types";
import { SYSTEM_PROMPT } from "../components/translate/constants";

// Using NEXT_PUBLIC_GEMINI_API_KEY as per Next.js convention
const getAI = () => new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '' });

export async function translateSign(
    frames: string[],
    sourceRegion: Region,
    targetRegion: Region
): Promise<TranslationResult> {
    const ai = getAI();

    // Sample fewer frames to reduce payload size and improve reliability
    const sampledFrames = frames.filter((_, i) => i % 2 === 0).slice(0, 10);

    const imageParts = sampledFrames.map(base64 => ({
        inlineData: {
            mimeType: 'image/jpeg',
            data: base64.split(',')[1]
        }
    }));

    const userPrompt = `Carefully analyze this sequence of ${sampledFrames.length} frames showing sign language.

TASK: Identify the signs being performed in ${sourceRegion} and translate to ${targetRegion}.

CRITICAL INSTRUCTIONS:
1. Look at hand positions, movements, and orientations across frames.
2. **PRONOUN SENSITIVITY:** You MUST detect pointing gestures. 
   - Pointing to self = "I" or "ME"
   - Pointing to camera/front = "YOU"
   - Pointing to side = "HE" or "SHE"
   - DO NOT skip these pronouns. Even quick pointing gestures count.
3. Identify each distinct sign/gesture in order.
4. Common signs to look for: greetings (HELLO, HI), pronouns (I, YOU, HE, SHE), verbs (HAVE, WANT, LIKE), objects (CAR, PHONE, BOOK).
5. If no clear signs are visible, provide your best interpretation of the gestures.

Return ONLY valid JSON matching this exact structure:
{
  "sourceText": "Natural English sentence",
  "gloss": "SIGN1 SIGN2 SIGN3",
  "grammarStructure": [{"label": "Type", "word": "SIGN", "type": "subject|verb|object|pronoun|other"}],
  "targetText": "Translation in target sign language",
  "explanation": "Brief description of what you observed, specifically mentioning if you saw pointing gestures for pronouns.",
  "visualDescription": "How to perform the main sign in target language",
  "initializedSignsFound": []
}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    ...imageParts,
                    { text: userPrompt }
                ]
            },
            config: {
                systemInstruction: SYSTEM_PROMPT(sourceRegion, targetRegion),
                responseMimeType: 'application/json',
            }
        });

        // Get the text response safely
        let text = '';
        try {
            const unsafeResponse = response as any;
            if (typeof unsafeResponse.text === 'function') {
                text = unsafeResponse.text();
            } else {
                text = unsafeResponse.text || '';
            }
        } catch (e) {
            // Fallback for different SDK versions
            const unsafeResponse = response as any;
            if (unsafeResponse.candidates?.[0]?.content?.parts?.[0]?.text) {
                text = unsafeResponse.candidates[0].content.parts[0].text;
            }
        }

        if (!text) {
            throw new Error("Empty response from AI");
        }

        // Clean up potential markdown code blocks
        const cleanText = text
            .replace(/```json\s*/gi, '')
            .replace(/```\s*/g, '')
            .trim();

        console.log("Cleaned AI response:", cleanText.substring(0, 200));

        const parsed = JSON.parse(cleanText) as TranslationResult;

        // Validate required fields
        if (!parsed.gloss || !parsed.sourceText) {
            throw new Error("Invalid response structure");
        }

        return parsed;
    } catch (error) {
        console.error("Failed to parse Gemini response:", error);
        throw new Error("The AI failed to parse the full sentence. Please sign each word clearly and slowly.");
    }
}

/**
 * Generate visual reference images for the target sign language.
 * Uses Imagen 3 for high-quality instructional illustrations.
 */
export async function generateSignVisual(description: string, targetRegion: Region): Promise<string | null> {
    const ai = getAI();

    // Fallback to SVG generation since Imagen is not available/404
    // This allows us to have visuals without strict image model access
    const prompt = `Create a clean, minimalist SVG illustration for the sign language gesture: "${description}".
    - Context: This is for ${targetRegion} sign language.
    - Use black paths on a white background or transparent.
    - Focus on hand shape and movement arrows.
    - Return ONLY the raw <svg>...</svg> code. No markdown, no json.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [{ text: prompt }]
            }
        });

        let svg = '';
        try {
            const unsafeResponse = response as any;
            if (typeof unsafeResponse.text === 'function') {
                svg = unsafeResponse.text();
            } else if (typeof unsafeResponse.text === 'string') {
                svg = unsafeResponse.text;
            } else if (unsafeResponse.candidates?.[0]?.content?.parts?.[0]?.text) {
                svg = unsafeResponse.candidates[0].content.parts[0].text;
            }
        } catch (e) {
            console.error("Error extracting text from response:", e);
        }

        // Clean up markdown
        svg = svg.replace(/```xml/g, '').replace(/```svg/g, '').replace(/```/g, '').trim();

        if (svg.startsWith('<svg')) {
            // Encode SVG for data URI
            // We use base64 to avoid encoding issues with special chars
            return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
        }

        return null;
    } catch (error) {
        console.error("SVG generation failed:", error);
        // Final fallback to a placeholder service if AI fails completely
        return `https://placehold.co/400x400/indigo/white?text=${encodeURIComponent(description.split(' ').slice(0, 2).join('+'))}`;
    }
}

/**
 * Generate multiple visual references for a sequence of signs.
 * This creates individual illustrations for each sign word.
 */
export async function generateMultipleSignVisuals(
    signs: string[],
    targetRegion: Region
): Promise<Map<string, string | null>> {
    const results = new Map<string, string | null>();

    // Generate visuals for up to 3 signs to avoid rate limits
    const signsToProcess = signs.slice(0, 3);

    for (const sign of signsToProcess) {
        const description = `The sign for "${sign}" in ${targetRegion}`;
        const visual = await generateSignVisual(description, targetRegion);
        results.set(sign, visual);

        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 500));
    }

    return results;
}
