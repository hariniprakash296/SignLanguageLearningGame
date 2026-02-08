import { Region, TranslationResult } from "../components/translate/types";

export async function translateSign(
    frames: string[],
    sourceRegion: Region,
    targetRegion: Region,
    detectedSigns: string[] = [] // New parameter
): Promise<TranslationResult> {
    // Sample fewer frames to reduce payload size and improve reliability
    // We do this on the client to save upload bandwidth
    // Send more raw frames for better sequence analysis
    // Slicing to 30 ensures we don't exceed payload limits but get ~4-5s of data
    const sampledFrames = frames.slice(0, 30);

    try {
        const response = await fetch('/api/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                frames: sampledFrames,
                sourceRegion,
                targetRegion,
                detectedSigns // Send to API
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const parsed = await response.json();
        return parsed as TranslationResult;

    } catch (error: any) {
        console.error("Translation failed:", error);
        throw new Error(error.message || "Failed to communicate with translation service");
    }
}

/**
 * Generate visual reference images for the target sign language.
 */
export async function generateSignVisual(description: string, targetRegion: Region): Promise<string | null> {
    try {
        const response = await fetch('/api/visual', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                description,
                targetRegion
            })
        });

        if (!response.ok) {
            console.warn("Visual generation skipped:", response.statusText);
            return null;
        }

        const data = await response.json();
        return data.image || null;

    } catch (error) {
        console.error("Visual generation failed:", error);
        // Fallback to a placeholder
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

    // Generate visuals for up to 3 signs to avoid slow UI
    const signsToProcess = signs.slice(0, 3);

    for (const sign of signsToProcess) {
        const description = `The sign for "${sign}" in ${targetRegion}`;
        const visual = await generateSignVisual(description, targetRegion);
        results.set(sign, visual);

        // Small delay if needed, though requests are sequential
        await new Promise(r => setTimeout(r, 200));
    }

    return results;
}
