/**
 * =============================================================================
 * Movement Patterns Definition
 * =============================================================================
 * 
 * Defines the movement signatures for initialized signs.
 * Each pattern describes how hands move over time to differentiate
 * between static letter poses and full initialized signs.
 * 
 * EXAMPLE:
 * - "F" letter = static thumb-index pinch
 * - "FAMILY" = F handshape + circular outward arc motion
 * 
 * =============================================================================
 */

/**
 * * Movement types we can detect
 */
export type MovementType =
    | 'static'      // No significant movement
    | 'circular'    // Circular motion (e.g., days of week)
    | 'arc'         // Arc/semicircle motion (e.g., FAMILY, TEAM)
    | 'tap'         // Repeated tapping motion (e.g., WATER)
    | 'shake'       // Side-to-side shake (e.g., colors)
    | 'forward'     // Forward pushing motion (e.g., TRY)
    | 'wave'        // Waving motion
    | 'twist';      // Wrist rotation/twist

/**
 * * Direction of movement
 */
export type MovementDirection =
    | 'clockwise'
    | 'counterclockwise'
    | 'up'
    | 'down'
    | 'left'
    | 'right'
    | 'forward'
    | 'backward'
    | 'horizontal'
    | 'vertical';

/**
 * * Detected movement pattern result
 */
export interface MovementPattern {
    type: MovementType;
    direction?: MovementDirection;
    magnitude: number;          // 0-1, how pronounced the movement is
    confidence: number;         // 0-1, how confident we are in detection
    duration: number;           // Milliseconds the movement took
    repetitions?: number;       // For tapping/shaking patterns
}

/**
 * * A single frame of hand landmark data with timestamp
 */
export interface MovementFrame {
    timestamp: number;
    landmarks: {
        x: number;
        y: number;
        z: number;
    }[];
    // Computed values for efficiency
    palmCenter: { x: number; y: number; z: number };
    wristPosition: { x: number; y: number; z: number };
}

/**
 * * Movement signature for an initialized sign
 * Defines what movement pattern to expect for a specific sign
 */
export interface MovementSignature {
    signWord: string;
    letter: string;
    expectedMovement: {
        type: MovementType;
        direction?: MovementDirection;
        minDuration: number;        // Minimum ms to consider valid
        minMagnitude: number;       // Minimum movement threshold (0-1)
        repetitions?: number;       // Expected tap/shake count
    };
    family: string;
}

// =============================================================================
// MOVEMENT SIGNATURES DATABASE
// =============================================================================

/**
 * * All initialized signs with their movement signatures
 * This is used by the classifier to match detected patterns
 */
export const MOVEMENT_SIGNATURES: MovementSignature[] = [
    // --- GROUPS / COLLECTIONS FAMILY ---
    // These all use arc/circular-apart movements
    {
        signWord: 'FAMILY',
        letter: 'F',
        expectedMovement: {
            type: 'arc',
            direction: 'horizontal',
            minDuration: 500,
            minMagnitude: 0.15,
        },
        family: 'groups-collections'
    },
    {
        signWord: 'TEAM',
        letter: 'T',
        expectedMovement: {
            type: 'arc',
            direction: 'horizontal',
            minDuration: 400,
            minMagnitude: 0.12,
        },
        family: 'groups-collections'
    },
    {
        signWord: 'GROUP',
        letter: 'G',
        expectedMovement: {
            type: 'circular',
            direction: 'clockwise',
            minDuration: 600,
            minMagnitude: 0.15,
        },
        family: 'groups-collections'
    },
    {
        signWord: 'CLASS',
        letter: 'C',
        expectedMovement: {
            type: 'circular',
            direction: 'clockwise',
            minDuration: 600,
            minMagnitude: 0.15,
        },
        family: 'groups-collections'
    },
    {
        signWord: 'ASSOCIATION',
        letter: 'A',
        expectedMovement: {
            type: 'circular',
            direction: 'clockwise',
            minDuration: 600,
            minMagnitude: 0.12,
        },
        family: 'groups-collections'
    },

    // --- EDUCATORS FAMILY ---
    // Forward motion from head
    {
        signWord: 'TEACHER',
        letter: 'T',
        expectedMovement: {
            type: 'forward',
            direction: 'forward',
            minDuration: 400,
            minMagnitude: 0.1,
        },
        family: 'educators'
    },
    {
        signWord: 'TUTOR',
        letter: 'T',
        expectedMovement: {
            type: 'forward',
            direction: 'forward',
            minDuration: 400,
            minMagnitude: 0.1,
        },
        family: 'educators'
    },
    {
        signWord: 'INSTRUCTOR',
        letter: 'I',
        expectedMovement: {
            type: 'forward',
            direction: 'forward',
            minDuration: 400,
            minMagnitude: 0.1,
        },
        family: 'educators'
    },
    {
        signWord: 'COACH',
        letter: 'C',
        expectedMovement: {
            type: 'forward',
            direction: 'forward',
            minDuration: 400,
            minMagnitude: 0.1,
        },
        family: 'educators'
    },

    // --- DAYS OF THE WEEK ---
    // All use small circular motion
    {
        signWord: 'MONDAY',
        letter: 'M',
        expectedMovement: {
            type: 'circular',
            direction: 'clockwise',
            minDuration: 400,
            minMagnitude: 0.08,
        },
        family: 'days-of-week'
    },
    {
        signWord: 'TUESDAY',
        letter: 'T',
        expectedMovement: {
            type: 'circular',
            direction: 'clockwise',
            minDuration: 400,
            minMagnitude: 0.08,
        },
        family: 'days-of-week'
    },
    {
        signWord: 'WEDNESDAY',
        letter: 'W',
        expectedMovement: {
            type: 'circular',
            direction: 'clockwise',
            minDuration: 400,
            minMagnitude: 0.08,
        },
        family: 'days-of-week'
    },
    {
        signWord: 'THURSDAY',
        letter: 'H',
        expectedMovement: {
            type: 'circular',
            direction: 'clockwise',
            minDuration: 400,
            minMagnitude: 0.08,
        },
        family: 'days-of-week'
    },
    {
        signWord: 'FRIDAY',
        letter: 'F',
        expectedMovement: {
            type: 'circular',
            direction: 'clockwise',
            minDuration: 400,
            minMagnitude: 0.08,
        },
        family: 'days-of-week'
    },
    {
        signWord: 'SATURDAY',
        letter: 'S',
        expectedMovement: {
            type: 'circular',
            direction: 'clockwise',
            minDuration: 400,
            minMagnitude: 0.08,
        },
        family: 'days-of-week'
    },
    {
        signWord: 'SUNDAY',
        letter: 'S',
        expectedMovement: {
            type: 'circular',
            direction: 'clockwise',
            minDuration: 400,
            minMagnitude: 0.08,
        },
        family: 'days-of-week'
    },

    // --- COLORS ---
    // Shaking motion
    {
        signWord: 'BLUE',
        letter: 'B',
        expectedMovement: {
            type: 'shake',
            direction: 'horizontal',
            minDuration: 300,
            minMagnitude: 0.05,
            repetitions: 2,
        },
        family: 'colors'
    },
    {
        signWord: 'GREEN',
        letter: 'G',
        expectedMovement: {
            type: 'shake',
            direction: 'horizontal',
            minDuration: 300,
            minMagnitude: 0.05,
            repetitions: 2,
        },
        family: 'colors'
    },
    {
        signWord: 'PURPLE',
        letter: 'P',
        expectedMovement: {
            type: 'shake',
            direction: 'horizontal',
            minDuration: 300,
            minMagnitude: 0.05,
            repetitions: 2,
        },
        family: 'colors'
    },
    {
        signWord: 'YELLOW',
        letter: 'Y',
        expectedMovement: {
            type: 'twist',
            direction: 'horizontal',
            minDuration: 300,
            minMagnitude: 0.06,
        },
        family: 'colors'
    },

    // --- LOCAL / PLACE ---
    {
        signWord: 'LOCAL',
        letter: 'L',
        expectedMovement: {
            type: 'circular',
            direction: 'clockwise',
            minDuration: 400,
            minMagnitude: 0.1,
        },
        family: 'local-place'
    },
    {
        signWord: 'CULTURE',
        letter: 'C',
        expectedMovement: {
            type: 'circular',
            direction: 'clockwise',
            minDuration: 400,
            minMagnitude: 0.1,
        },
        family: 'local-place'
    },
    {
        signWord: 'COMMUNITY',
        letter: 'C',
        expectedMovement: {
            type: 'circular',
            direction: 'clockwise',
            minDuration: 500,
            minMagnitude: 0.12,
        },
        family: 'local-place'
    },

    // --- WATER / DRINKS ---
    {
        signWord: 'WATER',
        letter: 'W',
        expectedMovement: {
            type: 'tap',
            direction: 'up',
            minDuration: 400,
            minMagnitude: 0.05,
            repetitions: 2,
        },
        family: 'water-drinks'
    },
    {
        signWord: 'WINE',
        letter: 'W',
        expectedMovement: {
            type: 'circular',
            direction: 'clockwise',
            minDuration: 400,
            minMagnitude: 0.08,
        },
        family: 'water-drinks'
    },

    // --- TRY / EFFORT ---
    {
        signWord: 'TRY',
        letter: 'T',
        expectedMovement: {
            type: 'forward',
            direction: 'forward',
            minDuration: 300,
            minMagnitude: 0.12,
        },
        family: 'try-effort'
    },
    {
        signWord: 'EFFORT',
        letter: 'E',
        expectedMovement: {
            type: 'forward',
            direction: 'forward',
            minDuration: 400,
            minMagnitude: 0.15,
        },
        family: 'try-effort'
    },

    // --- LANGUAGE / COMMUNICATION ---
    {
        signWord: 'LANGUAGE',
        letter: 'L',
        expectedMovement: {
            type: 'arc',
            direction: 'horizontal',
            minDuration: 400,
            minMagnitude: 0.15,
        },
        family: 'language-communication'
    },
    {
        signWord: 'LANGUAGE',
        letter: 'L',
        expectedMovement: {
            type: 'arc',
            direction: 'horizontal',
            minDuration: 400,
            minMagnitude: 0.15,
        },
        family: 'language-communication'
    },

    // --- GREETINGS / CONVERSATIONAL ---
    {
        signWord: 'HELLO',
        letter: 'B',
        expectedMovement: {
            type: 'wave',
            direction: 'left', // Or right/horizontal
            minDuration: 300,
            minMagnitude: 0.1,
            repetitions: 1
        },
        family: 'greetings'
    },
    {
        signWord: 'YES',
        letter: 'S', // Fist nodding
        expectedMovement: {
            type: 'forward', // Nodding motion approximated as forward/down or shake
            direction: 'down',
            minDuration: 300,
            minMagnitude: 0.08,
            repetitions: 1
        },
        family: 'conversational'
    },
];

/**
 * * Get all signatures for a specific letter
 */
export function getSignaturesForLetter(letter: string): MovementSignature[] {
    return MOVEMENT_SIGNATURES.filter(s => s.letter === letter.toUpperCase());
}

/**
 * * Get signature for a specific word
 */
export function getSignatureForWord(word: string): MovementSignature | undefined {
    return MOVEMENT_SIGNATURES.find(s => s.signWord === word.toUpperCase());
}

/**
 * * Get all signatures in a family
 */
export function getSignaturesForFamily(familyId: string): MovementSignature[] {
    return MOVEMENT_SIGNATURES.filter(s => s.family === familyId);
}
