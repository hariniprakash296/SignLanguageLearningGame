/**
 * =============================================================================
 * Initialized Sign Classifier
 * =============================================================================
 * 
 * C4 MODEL CONTEXT:
 * - Container: Frontend (Next.js/React Application)
 * - Component: Gesture Recognition Engine
 * - Responsibility: Classify detected handshape + movement as initialized signs
 * 
 * HOW IT WORKS:
 * 1. Receives detected letter (from static pose analysis)
 * 2. Receives detected movement (from MovementAnalyzer)
 * 3. Matches against movement signatures database
 * 4. Returns best matching initialized sign with confidence
 * 
 * EXAMPLE:
 * - Input: letter="F", movement={type:"arc", direction:"horizontal"}
 * - Output: {word:"FAMILY", confidence:0.85, family:"groups-collections"}
 * 
 * =============================================================================
 */

import {
    MovementPattern,
    MovementSignature,
    MOVEMENT_SIGNATURES,
    getSignaturesForLetter,
} from './movement-patterns';

/**
 * * Result of classifying an initialized sign
 */
export interface InitializedSignMatch {
    word: string;               // e.g., "FAMILY"
    letter: string;             // e.g., "F"  
    movement: MovementPattern;  // The detected movement
    confidence: number;         // 0-1 overall confidence
    matchBreakdown: {
        letterConfidence: number;   // Confidence in letter detection
        movementConfidence: number; // Confidence in movement detection
        patternMatch: number;       // How well movement matches expected pattern
    };
    family: {
        id: string;
        name: string;
        relatedWords: string[];
    };
    alternativeMatches: Array<{
        word: string;
        confidence: number;
    }>;
}

/**
 * * Family information lookup
 */
const FAMILY_INFO: Record<string, { name: string; words: string[] }> = {
    'groups-collections': {
        name: 'Groups & Collections 👥',
        words: ['FAMILY', 'TEAM', 'GROUP', 'CLASS', 'ASSOCIATION']
    },
    'educators': {
        name: 'People Who Educate 🎓',
        words: ['TEACHER', 'TUTOR', 'INSTRUCTOR', 'COACH']
    },
    'days-of-week': {
        name: 'Days of the Week 📅',
        words: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
    },
    'colors': {
        name: 'Colors 🎨',
        words: ['BLUE', 'GREEN', 'PURPLE', 'YELLOW']
    },
    'local-place': {
        name: 'Local & Place 📍',
        words: ['LOCAL', 'CULTURE', 'COMMUNITY', 'CUSTOM']
    },
    'water-drinks': {
        name: 'Water & Drinks 💧',
        words: ['WATER', 'WINE']
    },
    'try-effort': {
        name: 'Effort & Attempt 💪',
        words: ['TRY', 'EFFORT', 'ATTEMPT']
    },
    'language-communication': {
        name: 'Language & Communication 💬',
        words: ['LANGUAGE', 'LAW', 'LECTURE']
    },
    'greetings': {
        name: 'Greetings 👋',
        words: ['HELLO']
    },
    'conversational': {
        name: 'Conversational 🗣️',
        words: ['YES']
    },
};

/**
 * * Configuration for the classifier
 */
export interface ClassifierConfig {
    minConfidenceThreshold: number;     // Minimum confidence to return a match
    movementWeight: number;              // How much movement affects confidence (0-1)
    letterWeight: number;                // How much letter affects confidence (0-1)
    requireMovement: boolean;            // If true, static poses won't match
}

const DEFAULT_CONFIG: ClassifierConfig = {
    minConfidenceThreshold: 0.7,  // STRICTER: Was 0.4, now 0.7 to reject weak matches
    movementWeight: 0.6,    // Movement is weighted higher since it's the key differentiator
    letterWeight: 0.4,
    requireMovement: true,
};

/**
 * * InitializedSignClassifier class
 */
export class InitializedSignClassifier {
    private config: ClassifierConfig;
    private signatures: MovementSignature[];

    constructor(config: Partial<ClassifierConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.signatures = MOVEMENT_SIGNATURES;
    }

    /**
     * * Classify a detected gesture as an initialized sign
     * 
     * @param detectedLetter - The letter detected from static pose (e.g., "F")
     * @param letterConfidence - Confidence in the letter detection (0-1)
     * @param detectedMovement - Movement pattern from MovementAnalyzer
     * @returns Best matching initialized sign, or null if no match
     */
    classify(
        detectedLetter: string,
        letterConfidence: number,
        detectedMovement: MovementPattern
    ): InitializedSignMatch | null {
        const letter = detectedLetter.toUpperCase();

        // Get all signatures that use this letter
        const candidates = getSignaturesForLetter(letter);

        if (candidates.length === 0) {
            return null;
        }

        // If movement is static and we require movement, no match
        if (this.config.requireMovement && detectedMovement.type === 'static') {
            return null;
        }

        // Score each candidate
        const scoredCandidates = candidates.map(signature => ({
            signature,
            score: this.scoreSignature(signature, detectedMovement),
        }));

        // Sort by score descending
        scoredCandidates.sort((a, b) => b.score - a.score);

        // Get best match
        const best = scoredCandidates[0];

        // Calculate overall confidence
        const movementConfidence = detectedMovement.confidence;
        const patternMatch = best.score;
        const overallConfidence = this.calculateOverallConfidence(
            letterConfidence,
            movementConfidence,
            patternMatch
        );

        // Check if meets threshold
        if (overallConfidence < this.config.minConfidenceThreshold) {
            return null;
        }

        // Get family info
        const familyInfo = FAMILY_INFO[best.signature.family] || {
            name: best.signature.family,
            words: [best.signature.signWord]
        };

        // Build alternative matches (other candidates with decent scores)
        const alternatives = scoredCandidates
            .slice(1, 4)
            .filter(c => c.score > 0.3)
            .map(c => ({
                word: c.signature.signWord,
                confidence: this.calculateOverallConfidence(letterConfidence, movementConfidence, c.score)
            }));

        return {
            word: best.signature.signWord,
            letter: best.signature.letter,
            movement: detectedMovement,
            confidence: overallConfidence,
            matchBreakdown: {
                letterConfidence,
                movementConfidence,
                patternMatch,
            },
            family: {
                id: best.signature.family,
                name: familyInfo.name,
                relatedWords: familyInfo.words,
            },
            alternativeMatches: alternatives,
        };
    }

    /**
     * * Score how well a detected movement matches a signature
     */
    private scoreSignature(signature: MovementSignature, detected: MovementPattern): number {
        const expected = signature.expectedMovement;
        let score = 0;

        // Type match is most important
        if (detected.type === expected.type) {
            score += 0.5;
        } else if (this.areTypesRelated(detected.type, expected.type)) {
            score += 0.25;
        }

        // Direction match
        if (detected.direction && expected.direction) {
            if (detected.direction === expected.direction) {
                score += 0.25;
            }
        } else {
            score += 0.1; // No direction to compare
        }

        // Magnitude check
        if (detected.magnitude >= expected.minMagnitude) {
            score += 0.15;
        } else {
            score += 0.15 * (detected.magnitude / expected.minMagnitude);
        }

        // Duration check
        const duration = detected.duration;
        if (duration >= expected.minDuration) {
            score += 0.1;
        } else {
            score += 0.1 * (duration / expected.minDuration);
        }

        return Math.min(score, 1);
    }

    /**
     * * Check if two movement types are related
     */
    private areTypesRelated(type1: string, type2: string): boolean {
        const related: Record<string, string[]> = {
            'circular': ['arc'],
            'arc': ['circular'],
            'shake': ['twist'],
            'twist': ['shake'],
            'tap': [],
            'forward': [],
            'static': [],
            'wave': [],
        };

        return (related[type1] || []).includes(type2);
    }

    /**
     * * Calculate overall confidence score
     */
    private calculateOverallConfidence(
        letterConfidence: number,
        movementConfidence: number,
        patternMatch: number
    ): number {
        // Weighted combination
        const letterScore = letterConfidence * this.config.letterWeight;
        const movementScore = (movementConfidence * patternMatch) * this.config.movementWeight;

        return letterScore + movementScore;
    }

    /**
     * * Get all possible signs for a letter (for teaching purposes)
     */
    getPossibleSigns(letter: string): Array<{ word: string; family: string; movementDescription: string }> {
        const signatures = getSignaturesForLetter(letter);

        return signatures.map(sig => {
            const familyInfo = FAMILY_INFO[sig.family];
            return {
                word: sig.signWord,
                family: familyInfo?.name || sig.family,
                movementDescription: this.getMovementDescription(sig),
            };
        });
    }

    /**
     * * Generate human-readable movement description
     */
    private getMovementDescription(signature: MovementSignature): string {
        const m = signature.expectedMovement;
        const descriptions: Record<string, string> = {
            'circular': `Make a ${m.direction || ''} circular motion`,
            'arc': `Move in an ${m.direction || ''} arc`,
            'tap': `Tap ${m.repetitions || 2} times`,
            'shake': `Shake side to side`,
            'forward': `Push forward`,
            'twist': `Twist your wrist`,
            'static': `Hold the position`,
        };

        return descriptions[m.type] || 'Perform the movement';
    }
}

/**
 * * Singleton instance for global use
 */
let classifierInstance: InitializedSignClassifier | null = null;

export function getClassifier(): InitializedSignClassifier {
    if (!classifierInstance) {
        classifierInstance = new InitializedSignClassifier();
    }
    return classifierInstance;
}

export default InitializedSignClassifier;
