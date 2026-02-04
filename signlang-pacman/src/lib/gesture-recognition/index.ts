/**
 * =============================================================================
 * Gesture Recognition Engine - Index
 * =============================================================================
 * 
 * Central export for the gesture recognition module.
 * Provides all the tools needed for detecting initialized signs.
 * 
 * USAGE:
 * ```typescript
 * import { 
 *   MovementAnalyzer, 
 *   getClassifier,
 *   GestureRecognitionEngine 
 * } from '@/lib/gesture-recognition';
 * 
 * // Create engine
 * const engine = new GestureRecognitionEngine();
 * 
 * // Feed frames from MediaPipe
 * engine.addFrame(landmarks, detectedLetter, letterConfidence);
 * 
 * // Get current recognition result
 * const result = engine.recognize();
 * if (result) {
 *   console.log(`Detected: ${result.word} (${result.confidence})`);
 * }
 * ```
 * 
 * =============================================================================
 */

export { MovementAnalyzer, type RawLandmark, type MovementAnalyzerConfig } from './movement-analyzer';
export {
    InitializedSignClassifier,
    getClassifier,
    type InitializedSignMatch,
    type ClassifierConfig
} from './initialized-sign-classifier';
export {
    type MovementPattern,
    type MovementFrame,
    type MovementSignature,
    type MovementType,
    type MovementDirection,
    MOVEMENT_SIGNATURES,
    getSignaturesForLetter,
    getSignatureForWord,
    getSignaturesForFamily,
} from './movement-patterns';

// =============================================================================
// GESTURE RECOGNITION ENGINE
// =============================================================================

import { MovementAnalyzer, type RawLandmark } from './movement-analyzer';
import { InitializedSignClassifier, type InitializedSignMatch } from './initialized-sign-classifier';
import type { MovementPattern } from './movement-patterns';

/**
 * * Result from the gesture recognition engine
 */
export interface GestureRecognitionResult {
    // Letter detection
    letter: string | null;
    letterConfidence: number;

    // Movement detection
    movement: MovementPattern;

    // Initialized sign detection (if both letter + movement match)
    initializedSign: InitializedSignMatch | null;

    // Timing info
    frameCount: number;
    analysisTimestamp: number;
}

/**
 * * Configuration for the engine
 */
export interface GestureEngineConfig {
    minLetterConfidence: number;
    analysisInterval: number;   // ms between analyses
}

const DEFAULT_ENGINE_CONFIG: GestureEngineConfig = {
    minLetterConfidence: 0.85, // STRICTER: Was 0.7, now 0.85 to reject uncertain letters
    analysisInterval: 100,
};

/**
 * * Main Gesture Recognition Engine
 * 
 * Combines movement analysis and sign classification into a single interface.
 * Feed it frames and get back initialized sign detection.
 */
export class GestureRecognitionEngine {
    private movementAnalyzer: MovementAnalyzer;
    private classifier: InitializedSignClassifier;
    private config: GestureEngineConfig;

    private currentLetter: string | null = null;
    private currentLetterConfidence: number = 0;
    private lastAnalysisTime: number = 0;
    private lastResult: GestureRecognitionResult | null = null;

    constructor(config: Partial<GestureEngineConfig> = {}) {
        this.config = { ...DEFAULT_ENGINE_CONFIG, ...config };
        this.movementAnalyzer = new MovementAnalyzer();
        this.classifier = new InitializedSignClassifier();
    }

    /**
     * * Add a frame of hand landmarks with letter detection
     */
    addFrame(
        landmarks: RawLandmark[],
        detectedLetter: string | null,
        letterConfidence: number
    ): void {
        // Add to movement analyzer
        this.movementAnalyzer.addFrame(landmarks);

        // Update current letter with confidence-weighted smoothing
        if (detectedLetter && letterConfidence >= this.config.minLetterConfidence) {
            if (this.currentLetter === detectedLetter) {
                // Same letter, increase confidence
                this.currentLetterConfidence = Math.min(
                    1,
                    this.currentLetterConfidence * 0.7 + letterConfidence * 0.3
                );
            } else {
                // New letter, start fresh
                this.currentLetter = detectedLetter;
                this.currentLetterConfidence = letterConfidence;
            }
        }
    }

    /**
     * * Get the current recognition result
     */
    recognize(): GestureRecognitionResult {
        const now = Date.now();

        // Debounce analysis
        if (now - this.lastAnalysisTime < this.config.analysisInterval && this.lastResult) {
            return this.lastResult;
        }
        this.lastAnalysisTime = now;

        // Analyze movement
        const movement = this.movementAnalyzer.analyzeMovement();

        // Try to classify as initialized sign
        let initializedSign: InitializedSignMatch | null = null;

        if (this.currentLetter && this.currentLetterConfidence >= this.config.minLetterConfidence) {
            initializedSign = this.classifier.classify(
                this.currentLetter,
                this.currentLetterConfidence,
                movement
            );
        }

        const result: GestureRecognitionResult = {
            letter: this.currentLetter,
            letterConfidence: this.currentLetterConfidence,
            movement,
            initializedSign,
            frameCount: this.movementAnalyzer.getFrameCount(),
            analysisTimestamp: now,
        };

        this.lastResult = result;
        return result;
    }

    /**
     * * Reset the engine state
     */
    reset(): void {
        this.movementAnalyzer.reset();
        this.currentLetter = null;
        this.currentLetterConfidence = 0;
        this.lastAnalysisTime = 0;
        this.lastResult = null;
    }

    /**
     * * Get possible signs for the current letter
     */
    getPossibleSigns(): Array<{ word: string; family: string; movementDescription: string }> {
        if (!this.currentLetter) return [];
        return this.classifier.getPossibleSigns(this.currentLetter);
    }

    /**
     * * Check if engine has enough data to recognize
     */
    isReady(): boolean {
        return this.movementAnalyzer.canAnalyze() && this.currentLetter !== null;
    }

    /**
     * * Get current state for debugging
     */
    getDebugState(): {
        letter: string | null;
        letterConfidence: number;
        frameCount: number;
        lastMovement: MovementPattern | null;
    } {
        return {
            letter: this.currentLetter,
            letterConfidence: this.currentLetterConfidence,
            frameCount: this.movementAnalyzer.getFrameCount(),
            lastMovement: this.lastResult?.movement || null,
        };
    }
}

export default GestureRecognitionEngine;
