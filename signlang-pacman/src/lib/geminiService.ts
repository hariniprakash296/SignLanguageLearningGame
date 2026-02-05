
import { GoogleGenAI } from "@google/genai";
import { Region, TranslationResult } from "./types";
import { SYSTEM_PROMPT } from "./constants";

// Using NEXT_PUBLIC_GEMINI_API_KEY as per Next.js convention
const getAI = () => new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '' });

export async function translateSign(
    frames: string[],
    sourceRegion: Region,
    targetRegion: Region
): Promise<TranslationResult> {
    const ai = getAI();

    const imageParts = frames.map(base64 => ({
        inlineData: {
            mimeType: 'image/jpeg',
            data: base64.split(',')[1]
        }
    }));

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                ...imageParts,
                { text: `Analyze the ENTIRE sequence frame-by-frame. Identify EVERY word signed in ${sourceRegion}. Provide a word-by-word gloss. Do not miss 'MAN', 'HAVE', 'CAR', or 'CELLPHONE' if present.` }
            ]
        },
        config: {
            systemInstruction: SYSTEM_PROMPT(sourceRegion, targetRegion),
            responseMimeType: 'application/json',
            // thinkingConfig removed as it is not supported on standard Flash models
        }
    });

    try {
        const text = response.text || '{}';
        return JSON.parse(text) as TranslationResult;
    } catch (error) {
        console.error("Failed to parse Gemini response:", error);
        throw new Error("The AI failed to parse the full sentence. Please sign each word clearly and slowly.");
    }
}

export async function generateSignVisual(description: string): Promise<string | null> {
    const ai = getAI();
    // Prompting for an SVG specifically to leverage the text-generation capabilities of Flash
    const prompt = `
    Create a clean, minimalist, high-contrast SVG infographic (grid layout) illustrating these sign language concepts: "${description}".
    
    REQUIREMENTS:
    - distinct panels for each key term.
    - simple black line art on white background.
    - icons or stick figures showing the movement (arrows).
    - label each panel with text.
    - OUTPUT: Return ONLY the raw <svg>...</svg> code. No markdown formatting, no backticks.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }] },
        });

        // SDK Response handling
        const candidate = response.candidates?.[0];
        const text = candidate?.content?.parts?.[0]?.text || '';

        // Extract SVG if wrapped in markdown
        const svgMatch = text.match(/<svg[\s\S]*?<\/svg>/);
        const svgContent = svgMatch ? svgMatch[0] : text;

        // Basic validation to ensure we have an SVG
        if (svgContent.includes('<svg')) {
            // Convert to Base64 for data URL
            const base64 = Buffer.from(svgContent).toString('base64');
            return `data:image/svg+xml;base64,${base64}`;
        }

        return null;
    } catch (error) {
        console.error("SVG generation failed:", error);
        return null;
    }
}
