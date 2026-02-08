/**
 * =============================================================================
 * Hybrid Gesture Recognizer
 * =============================================================================
 * 
 * Combines Fingerpose (static hand poses) with MovementAnalyzer (dynamic movement)
 * to provide accurate ASL sign recognition.
 * 
 * PIPELINE:
 * 1. MediaPipe extracts 21 hand landmarks
 * 2. Fingerpose identifies static hand shape (e.g., Y-hand, L-hand)
 * 3. MovementAnalyzer tracks motion over time (e.g., forward, circular)
 * 4. HybridRecognizer combines both for final sign prediction
 * 
 * =============================================================================
 */

import { MovementAnalyzer } from './movement-analyzer';
import { MovementPattern } from './movement-patterns';
import { detectStaticGesture, StaticGestureResult, HandLandmark } from './static-gestures'; // Custom recognition
import { WLASL_DICTIONARY, WLASLDefinition } from './wlasl-dictionary';

// =============================================================================
// TYPES
// =============================================================================

export interface RecognitionResult {
    // Static pose detection
    staticGesture: StaticGestureResult | null;

    // Movement detection
    movement: MovementPattern | null;

    // Combined recognition
    recognizedSign: string | null;
    confidence: number;

    // Debug info
    timestamp: number;
}

export interface SignSequence {
    signs: string[];
    gloss: string;
    englishTranslation: string;
}

// =============================================================================
// HYBRID GESTURE RECOGNIZER CLASS
// =============================================================================

export class HybridGestureRecognizer {
    private movementAnalyzer: MovementAnalyzer;
    private recognizedSequence: string[] = [];
    private lastRecognitionTime: number = 0;
    private minTimeBetweenSigns: number = 500; // ms between sign recognitions

    constructor() {
        this.movementAnalyzer = new MovementAnalyzer();
    }

    /**
     * Process a single frame of hand landmarks
     */
    processFrame(landmarks: HandLandmark[], timestamp: number): RecognitionResult {
        const result: RecognitionResult = {
            staticGesture: null,
            movement: null,
            recognizedSign: null,
            confidence: 0,
            timestamp,
        };

        if (!landmarks || landmarks.length < 21) {
            return result;
        }

        try {
            // 1. Get static gesture prediction (Custom)
            const staticResult = detectStaticGesture(landmarks);
            result.staticGesture = staticResult;

            // 2. Feed landmarks to movement analyzer
            this.movementAnalyzer.addFrame(landmarks);
            const movement = this.movementAnalyzer.canAnalyze()
                ? this.movementAnalyzer.analyzeMovement()
                : null;
            result.movement = movement;

            // 3. Combine static gesture + movement for final recognition using WLASL Dictionary
            if (result.staticGesture) {
                const combinedSign = this.matchWLASL(
                    result.staticGesture,
                    movement
                );

                if (combinedSign && this.shouldRecognizeSign(timestamp)) {
                    result.recognizedSign = combinedSign;
                    result.confidence = result.staticGesture.confidence;
                    this.addToSequence(combinedSign);
                    this.lastRecognitionTime = timestamp;
                }
            }

        } catch (error) {
            console.error('Gesture recognition error:', error);
        }

        return result;
    }

    /**
     * Match detected gesture against WLASL Dictionary
     */
    private matchWLASL(
        gesture: StaticGestureResult,
        movement: MovementPattern | null
    ): string | null {
        const detectedHandshape = gesture.name;
        const detectedMovement = movement ? movement.type : 'static';
        const detectedDirection = movement ? movement.direction : undefined;

        // Score-based matching to find best candidate
        let bestMatch: string | null = null;
        let bestScore = 0;

        for (const [word, def] of Object.entries(WLASL_DICTIONARY)) {
            let score = 0;

            // 1. Handshape Check (MUST match - required)
            if (def.handshape !== detectedHandshape) continue;
            score += 50; // Base score for handshape match

            // 2. Movement Check
            if (def.movement === 'STATIC') {
                if (detectedMovement === 'static') {
                    score += 30; // Good: Static required and detected
                } else {
                    score -= 20; // Penalty: Static required but movement detected
                }
            } else if (def.movement) {
                // Dictionary specifies a movement
                if (detectedMovement === def.movement.toLowerCase()) {
                    score += 40; // Exact movement match
                } else if (detectedMovement === 'static') {
                    score += 5; // Lenient: Accept static when user is holding shape
                } else {
                    continue; // Wrong movement type, skip this candidate
                }
            }

            // 3. Direction/Orientation bonus
            if (def.orientation && detectedDirection) {
                const dirMatch = this.directionsMatch(def.orientation, detectedDirection);
                if (dirMatch) score += 15;
            }

            // 4. Location bonus (approximate - we can't detect body location precisely)
            // For now, just give bonus to signs that don't require location
            if (!def.location) {
                score += 5;
            }

            // Update best match if this is better
            if (score > bestScore) {
                bestScore = score;
                bestMatch = word;
            }
        }

        // Only return if we have a reasonable match (score > 50 means handshape + something else)
        return bestScore >= 55 ? bestMatch : null;
    }

    /**
     * Check if detected direction matches expected orientation
     */
    private directionsMatch(expected: string, detected: string): boolean {
        const mappings: Record<string, string[]> = {
            'UP': ['vertical', 'up'],
            'DOWN': ['vertical', 'down'],
            'FORWARD': ['forward', 'horizontal'],
            'BACKWARD': ['backward', 'horizontal'],
            'LEFT': ['horizontal', 'left'],
            'RIGHT': ['horizontal', 'right']
        };
        return mappings[expected]?.includes(detected) ?? false;
    }

    /**
     * Prevent rapid-fire recognition of the same sign
     */
    private shouldRecognizeSign(timestamp: number): boolean {
        return timestamp - this.lastRecognitionTime > this.minTimeBetweenSigns;
    }

    /**
     * Add recognized sign to sequence
     */
    private addToSequence(sign: string): void {
        // Avoid duplicates if same sign recognized multiple times
        if (this.recognizedSequence.length === 0 ||
            this.recognizedSequence[this.recognizedSequence.length - 1] !== sign) {
            this.recognizedSequence.push(sign);
        }
    }

    /**
     * Get the current recognized sequence
     */
    getSequence(): SignSequence {
        const signs = [...this.recognizedSequence];
        const gloss = signs.join(' ');
        const englishTranslation = this.translateToEnglish(signs);

        return {
            signs,
            gloss,
            englishTranslation,
        };
    }

    /**
     * Clear the recognized sequence (call when starting new sentence)
     */
    clearSequence(): void {
        this.recognizedSequence = [];
        this.movementAnalyzer.reset();
    }

    /**
     * Basic ASL to English translation
     * Uses a Phrase Dictionary for common sequences
     */
    private translateToEnglish(signs: string[]): string {
        if (signs.length === 0) return '';

        // Simple concatenation for now, as Level 2 focus is on vocabulary
        // Could expand phrase dictionary later
        return signs.join(' ');
    }

    /**
     * Get all available gesture names from dictionary
     */
    getAvailableGestures(): string[] {
        return Object.keys(WLASL_DICTIONARY);
    }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let recognizerInstance: HybridGestureRecognizer | null = null;

export function getHybridRecognizer(): HybridGestureRecognizer {
    if (!recognizerInstance) {
        recognizerInstance = new HybridGestureRecognizer();
    }
    return recognizerInstance;
}

export default HybridGestureRecognizer;
