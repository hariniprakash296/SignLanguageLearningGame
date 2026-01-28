
export interface Landmark {
    x: number;
    y: number;
    z: number;
}

export type FingerState = 'open' | 'curled' | 'half';
export type FingerName = 'thumb' | 'index' | 'middle' | 'ring' | 'pinky';

export interface SignDefinition {
    fingers: Record<FingerName, FingerState | FingerState[]>;
    // Optional custom checks function
    customCheck?: (landmarks: Landmark[], handScale: number) => boolean;
}

// Helper to calculate distance between two landmarks
const dist = (a: Landmark, b: Landmark): number => {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
};

export const checkSign = (landmarks: Landmark[], word: string): boolean => {
    if (!landmarks || landmarks.length < 21) return false;

    // Landmarks indices
    // 0: wrist
    // 1-4: thumb (tip: 4)
    // 5-8: index (tip: 8, base: 5)
    // 9-12: middle (tip: 12, base: 9)
    // 13-16: ring (tip: 16, base: 13)
    // 17-20: pinky (tip: 20, base: 17)

    const wrist = landmarks[0];
    const indexBase = landmarks[5];
    const middleBase = landmarks[9];
    // Scale factor based on palm size (wrist to middle finger base)
    const handScale = dist(wrist, middleBase);

    // Helper to get finger state
    const getFingerState = (tipIdx: number, dipIdx: number, pipIdx: number, mcpIdx: number): FingerState => {
        const tip = landmarks[tipIdx];
        const pip = landmarks[pipIdx]; // Middle joint
        const mcp = landmarks[mcpIdx]; // Base joint

        // Check varying degrees of curl based on Y position (assuming hand is upright-ish)
        // Note: Coordinates are normalized 0-1. Y increases downwards.

        // Simple check: is tip below the base joint? (Folded down)
        if (tip.y > mcp.y) return 'curled';

        // Check if tip is below the middle joint?
        if (tip.y > pip.y) return 'curled';

        return 'open';
    };

    // Thumb state is trickier due to rotation. 
    // We often check if tip is "far" from index base or "close"
    const getThumbState = (): FingerState => {
        const tip = landmarks[4];
        const ip = landmarks[3];
        const mcp = landmarks[2];
        // If tip is 'inside' the palm width (x-axis) relative to base, it's curled?
        // Simpler: Check distance to pinky base?

        // For general "open" vs "closed":
        // Open: Thumb stretched out.
        // Closed: Thumb tucked in.

        // Let's rely more on specific geometry in custom checks for thumb
        return 'open'; // Default, override in custom checks usually
    };

    // Calculate states for 4 fingers (Index to Pinky)
    // We use Y-axis comparison for simple curl detection (works for upright hand)
    const indexState = landmarks[8].y > landmarks[6].y ? 'curled' : 'open'; // Compare tip to PIP (knuckle)
    const middleState = landmarks[12].y > landmarks[10].y ? 'curled' : 'open';
    const ringState = landmarks[16].y > landmarks[14].y ? 'curled' : 'open';
    const pinkyState = landmarks[20].y > landmarks[18].y ? 'curled' : 'open';

    const definitions: Record<string, SignDefinition> = {
        'A': {
            fingers: { thumb: 'open', index: 'curled', middle: 'curled', ring: 'curled', pinky: 'curled' },
            customCheck: (l, scale) => {
                // Thumb should be sticking up/out, against the side of the index finger
                const thumbTip = l[4];
                const indexBase = l[5];
                // Thumb tip should be above index base? Or at least not tucked under
                return thumbTip.y < indexBase.y;
            }
        },
        'B': {
            fingers: { thumb: 'curled', index: 'open', middle: 'open', ring: 'open', pinky: 'open' },
            customCheck: (l, scale) => {
                // Thumb tucked across palm
                const thumbTip = l[4];
                const pinkyBase = l[17];
                const indexBase = l[5];
                // Thumb tip should be crossing towards pinky side
                return Math.abs(thumbTip.x - indexBase.x) < 0.3 * scale || thumbTip.x > indexBase.x;
            }
        },
        'C': {
            fingers: { thumb: 'open', index: 'open', middle: 'open', ring: 'open', pinky: 'open' },
            customCheck: (l, scale) => {
                // C shape: curved fingers. 
                // Index and Thumb tips shouldn't touch, but be vertically aligned-ish
                const thumbTip = l[4];
                const indexTip = l[8];
                const d = dist(thumbTip, indexTip) / scale;
                return d > 0.35 && d < 0.9;
            }
        },
        'D': {
            fingers: { thumb: 'curled', index: 'open', middle: 'curled', ring: 'curled', pinky: 'curled' },
            customCheck: (l, scale) => {
                // Thumb touches middle/ring tips? 
                // Actually usually touches Middle tip + Ring tip.
                // Index is the only one definitely UP.
                return true;
            }
        },
        'E': {
            fingers: { thumb: 'curled', index: 'curled', middle: 'curled', ring: 'curled', pinky: 'curled' },
            customCheck: (l, scale) => {
                const thumbTip = l[4];
                const indexTip = l[8];
                const middleTip = l[12];
                const ringTip = l[16];

                // E: Tips of fingers rest ON TOP of the thumb (or thumb curls under them).
                // Key differentiator from S:
                // 1. Thumb is "lower" or tucked under.
                // 2. Tips are touching the thumb or very close.

                const dThumbIndex = dist(thumbTip, indexTip) / scale;
                const dThumbMiddle = dist(thumbTip, middleTip) / scale;
                const dThumbRing = dist(thumbTip, ringTip) / scale;

                // E requires tight cluster
                return (dThumbIndex < 0.22 || dThumbMiddle < 0.22 || dThumbRing < 0.22);
            }
        },
        'F': {
            fingers: { thumb: 'open', index: 'curled', middle: 'open', ring: 'open', pinky: 'open' },
            customCheck: (l, scale) => {
                // Thumb and index touching (circle)
                const thumbTip = l[4];
                const indexTip = l[8];
                const d = dist(thumbTip, indexTip) / scale;
                // Index is technically "open" but curved to touch thumb, logic above might mark it curled if low enough.
                // Let's relax finger requirements and rely on custom check
                // Middle, Ring, Pinky MUST be up (open)
                const middleUp = l[12].y < l[9].y;
                const ringUp = l[16].y < l[13].y;

                return d < 0.25 && middleUp && ringUp;
            }
        },
        'G': {
            fingers: { thumb: 'open', index: 'open', middle: 'curled', ring: 'curled', pinky: 'curled' },
            customCheck: (l, scale) => {
                // Index and thumb pointing sideways (horizontal)
                // Check if index is horizontal: x difference big, y difference small
                const indexTip = l[8];
                const indexBase = l[5];
                const xDiff = Math.abs(indexTip.x - indexBase.x);
                const yDiff = Math.abs(indexTip.y - indexBase.y);

                return xDiff > yDiff; // horizontal-ish
            }
        },
        'H': {
            fingers: { thumb: 'open', index: 'open', middle: 'open', ring: 'curled', pinky: 'curled' },
            customCheck: (l, scale) => {
                // Index and Middle horizontal
                const indexTip = l[8];
                const indexBase = l[5];
                const xDiff = Math.abs(indexTip.x - indexBase.x);
                const yDiff = Math.abs(indexTip.y - indexBase.y);
                return xDiff > yDiff;
            }
        },
        'I': {
            fingers: { thumb: 'curled', index: 'curled', middle: 'curled', ring: 'curled', pinky: 'open' },
            customCheck: (l, scale) => {
                // Thumb usually tucked over fingers
                return true;
            }
        },
        // J is dynamic (motion), we'll approximate as I with movement or just I for now?
        // User asked for rigid checks, usually J is just 'I' static shape in simple recognizers or skipped.
        // Let's support static 'I' shape for J as fallback or specific 'J' shape (pinky pointing down/scooped?)
        'J': {
            fingers: { thumb: 'curled', index: 'curled', middle: 'curled', ring: 'curled', pinky: 'open' },
            customCheck: (l, scale) => true
        },
        'K': {
            fingers: { thumb: 'open', index: 'open', middle: 'open', ring: 'curled', pinky: 'curled' },
            customCheck: (l, scale) => {
                // K: Thumb comes up BETWEEN index and middle
                // Index straight up
                // Middle finger angled forward/out? 
                const thumbTip = l[4];
                const indexBase = l[5];
                const middleBase = l[9];

                // Thumb tip should be roughly between index and middle bases Y-wise or X-wise
                return true;
            }
        },
        'L': {
            fingers: { thumb: 'open', index: 'open', middle: 'curled', ring: 'curled', pinky: 'curled' },
            customCheck: (l, scale) => {
                // Index up, thumb out. 
                const indexTip = l[8];
                const indexBase = l[5];
                const thumbTip = l[4];
                // Index should be vertical
                const indexIsUp = indexTip.y < indexBase.y;
                // Thumb should be horizontal-ish (wide x dist from index base)
                const thumbIsOut = Math.abs(thumbTip.x - indexBase.x) > 0.2 * scale;
                return indexIsUp && thumbIsOut;
            }
        },
        'M': {
            fingers: { thumb: 'curled', index: 'curled', middle: 'curled', ring: 'curled', pinky: 'curled' },
            customCheck: (l, scale) => {
                // M: Thumb under 3 fingers. Tip should be near Ring or Pinky base.
                const thumbTip = l[4];
                const ringBase = l[13];
                const pinkyBase = l[17];
                const distR = dist(thumbTip, ringBase) / scale;
                const distP = dist(thumbTip, pinkyBase) / scale;
                return distR < 0.4 || distP < 0.4;
            }
        },
        'N': {
            fingers: { thumb: 'curled', index: 'curled', middle: 'curled', ring: 'curled', pinky: 'curled' },
            customCheck: (l, scale) => {
                // N: Thumb under 2 fingers. Tip should be near Middle finger base or Ring base.
                const thumbTip = l[4];
                const middleBase = l[9];
                const ringBase = l[13];
                const distM = dist(thumbTip, middleBase) / scale;
                const distR = dist(thumbTip, ringBase) / scale;
                return distM < 0.4 || distR < 0.4;
            }
        },
        'O': {
            fingers: { thumb: 'open', index: 'curled', middle: 'curled', ring: 'curled', pinky: 'curled' },
            customCheck: (l, scale) => {
                // All tips touching thumb tip
                const thumbTip = l[4];
                const indexTip = l[8];
                const d = dist(thumbTip, indexTip) / scale;
                return d < 0.25;
            }
        },
        'P': {
            fingers: { thumb: 'open', index: 'curled', middle: 'curled', ring: 'curled', pinky: 'curled' },
            customCheck: (l, scale) => {
                // P is 'K' pointing down.
                // wrist is higher than fingers?
                const wrist = l[0];
                const indexTip = l[8];

                // Hand pointing down
                return indexTip.y > wrist.y;
            }
        },
        'Q': {
            fingers: { thumb: 'open', index: 'curled', middle: 'curled', ring: 'curled', pinky: 'curled' },
            customCheck: (l, scale) => {
                // Q is 'G' pointing down.
                // Thumb and index pinch (or dont touch) but point down.
                const wrist = l[0];
                const indexTip = l[8];
                return indexTip.y > wrist.y;
            }
        },
        'R': {
            fingers: { thumb: 'curled', index: 'open', middle: 'open', ring: 'curled', pinky: 'curled' },
            customCheck: (l, scale) => {
                // Index and Middle crossed.
                const indexTip = l[8];
                const middleTip = l[12];
                // Check X crossover
                // Normal hand: Index is Left of Middle (for right hand) or Right (left hand).
                // Crossed: Order swaps?
                // Simple dist check:
                const d = dist(indexTip, middleTip) / scale;
                return d < 0.15; // Very close
            }
        },
        'S': {
            fingers: { thumb: 'curled', index: 'curled', middle: 'curled', ring: 'curled', pinky: 'curled' },
            customCheck: (l, scale) => {
                const thumbTip = l[4];
                const indexTip = l[8];
                const middleTip = l[12];
                const ringTip = l[16];

                // S: Thumb wrapped OVER fingers (like a fist).
                // Key differentiator from E:
                // 1. Thumb tip is NOT touching finger tips (it's across the phalanges).
                // 2. Thumb tip is roughly crossing the middle finger's X coordinate.

                const dThumbIndex = dist(thumbTip, indexTip) / scale;
                const dThumbMiddle = dist(thumbTip, middleTip) / scale;

                // Distinguish from E: Tips are NOT touching thumb
                const notTouchingTips = dThumbIndex > 0.23 && dThumbMiddle > 0.23;

                // Check if thumb is crossing
                // This is hard, but we can check if thumb tip is overlapping the X-columns of index/middle
                const thumbCrossing = Math.abs(thumbTip.x - middleTip.x) < 0.2 || Math.abs(thumbTip.x - indexTip.x) < 0.2; // This is vague

                return notTouchingTips && thumbCrossing;
            }
        },
        'T': {
            fingers: { thumb: 'curled', index: 'curled', middle: 'curled', ring: 'curled', pinky: 'curled' },
            customCheck: (l, scale) => {
                // T: Thumb under 1 finger. Tip should be near Index base or Middle base.
                const thumbTip = l[4];
                const indexBase = l[5];
                const middleBase = l[9];
                const distI = dist(thumbTip, indexBase) / scale;
                const distM = dist(thumbTip, middleBase) / scale;
                return distI < 0.4 || distM < 0.4;
            }
        },
        'U': {
            fingers: { thumb: 'curled', index: 'open', middle: 'open', ring: 'curled', pinky: 'curled' },
            customCheck: (l, scale) => {
                // Index and Middle straight up and TOGETHER
                const indexTip = l[8];
                const middleTip = l[12];
                const d = dist(indexTip, middleTip) / scale;
                return d < 0.15;
            }
        },
        'V': {
            fingers: { thumb: 'curled', index: 'open', middle: 'open', ring: 'curled', pinky: 'curled' },
            customCheck: (l, scale) => {
                // Index and Middle straight up and SPREAD
                const indexTip = l[8];
                const middleTip = l[12];
                const d = dist(indexTip, middleTip) / scale;
                return d > 0.2; // Significant gap
            }
        },
        'W': {
            fingers: { thumb: 'curled', index: 'open', middle: 'open', ring: 'open', pinky: 'curled' },
            customCheck: (l, scale) => true
        },
        'X': {
            fingers: { thumb: 'curled', index: 'curled', middle: 'curled', ring: 'curled', pinky: 'curled' },
            customCheck: (l, scale) => {
                // Index is hooked (half curled).
                // Difficult to distinguish from A/S/E without depth
                // But index knuckle (PIP) should be up, tip down?
                const indexPip = l[6];
                const indexTip = l[8];
                return indexPip.y < indexTip.y; // Hooked down? Depends on rotation.
            }
        },
        'Y': {
            fingers: { thumb: 'open', index: 'curled', middle: 'curled', ring: 'curled', pinky: 'open' },
            customCheck: (l, scale) => {
                const thumbTip = l[4];
                const pinkyTip = l[20];
                const d = dist(thumbTip, pinkyTip) / scale;
                return d > 0.5; // Wide spread
            }
        },
        'Z': {
            fingers: { thumb: 'curled', index: 'open', middle: 'curled', ring: 'curled', pinky: 'curled' },
            customCheck: (l, scale) => {
                // Index pointing (usually at camera or side)
                return true;
            }
        },

        // SPECIAL WORDS
        'HELLO': {
            fingers: { thumb: 'open', index: 'open', middle: 'open', ring: 'open', pinky: 'open' },
            customCheck: (l, scale) => {
                // Flat hand near forehead? Position check hard without face landmarks.
                // Just check Open Hand B-shape for now.
                return true;
            }
        },
        'YES': {
            fingers: { thumb: 'curled', index: 'curled', middle: 'curled', ring: 'curled', pinky: 'curled' },
            // Fist nodding (S shape). Allow S shape.
            customCheck: (l, scale) => true
        },
        'NO': {
            // 3 fingers (Thumb, Index, Middle) touching tips
            fingers: { thumb: 'open', index: 'open', middle: 'open', ring: 'curled', pinky: 'curled' },
            customCheck: (l, scale) => {
                const thumbTip = l[4];
                const indexTip = l[8];
                const middleTip = l[12];
                const d1 = dist(thumbTip, indexTip) / scale;
                const d2 = dist(thumbTip, middleTip) / scale;
                return d1 < 0.25 && d2 < 0.25;
            }
        },
        'THANK': {
            fingers: { thumb: 'open', index: 'open', middle: 'open', ring: 'open', pinky: 'open' },
            customCheck: (l, scale) => true // B shape moving from chin
        },
        'PLEASE': {
            fingers: { thumb: 'open', index: 'open', middle: 'open', ring: 'open', pinky: 'open' },
            customCheck: (l, scale) => true // Open flat hand rubbing chest
        },
        'SORRY': {
            // A/S hand rubbing chest.
            fingers: { thumb: 'curled', index: 'curled', middle: 'curled', ring: 'curled', pinky: 'curled' },
            customCheck: (l, scale) => true
        },
        'GOOD': {
            fingers: { thumb: 'open', index: 'open', middle: 'open', ring: 'open', pinky: 'open' },
            customCheck: (l, scale) => true
        },
        'HELP': {
            // Thumbs up on flat palm.
            // Just check Thumbs Up (A variant logic) or generic fist on palm.
            // Let's use A-shape/S-shape for now.
            fingers: { thumb: 'open', index: 'curled', middle: 'curled', ring: 'curled', pinky: 'curled' },
            customCheck: (l, scale) => true
        },
        'LOVE': {
            // Crossed arms? Or ILY sign?
            // Usually ILY sign (I+L+Y) -> Thumb, Index, Pinky Up.
            fingers: { thumb: 'open', index: 'open', middle: 'curled', ring: 'curled', pinky: 'open' },
            customCheck: (l, scale) => true
        },
        'EAT': {
            // O-shape to mouth
            fingers: { thumb: 'open', index: 'curled', middle: 'curled', ring: 'curled', pinky: 'curled' },
            customCheck: (l, scale) => {
                // O shape
                const thumbTip = l[4];
                const indexTip = l[8];
                const d = dist(thumbTip, indexTip) / scale;
                return d < 0.25;
            }
        }
    };

    const target = definitions[word.toUpperCase()];
    if (!target) return false;

    // 1. Check strict finger states
    if (target.fingers.index !== indexState && target.fingers.index !== 'half') {
        // Because simple curl detection is imperfect, sometimes we might want to be lenient unless STRICT mode is requested.
        // But user asked for NO FALLBACKS and defined checks.
        // Let's strictly enforce unless array is provided
        if (Array.isArray(target.fingers.index)) {
            if (!target.fingers.index.includes(indexState)) return false;
        } else {
            return false;
        }
    }
    if (target.fingers.middle !== middleState && !Array.isArray(target.fingers.middle)) return false;
    if (target.fingers.ring !== ringState && !Array.isArray(target.fingers.ring)) return false;
    if (target.fingers.pinky !== pinkyState && !Array.isArray(target.fingers.pinky)) return false;

    // 2. Custom geometric checks
    if (target.customCheck) {
        if (!target.customCheck(landmarks, handScale)) return false;
    }

    return true;
};
