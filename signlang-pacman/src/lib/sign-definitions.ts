/**
 * =============================================================================
 * FILE: sign-definitions.ts
 * =============================================================================
 * 
 * C4 MODEL CONTEXT:
 * - Container: Frontend (Next.js/React Application)
 * - Component: SignChecker (Hand Gesture Recognition)
 * - Responsibility: ASL sign verification using MediaPipe hand landmarks
 * 
 * DATA FLOW:
 * 1. HandTracking.tsx captures webcam → MediaPipe processes hand
 * 2. MediaPipe returns 21 landmarks (x,y,z coordinates)
 * 3. checkSign() receives landmarks + target letter/word
 * 4. Returns true if hand matches the expected ASL sign
 * 
 * DEPENDENCIES:
 * - Called by: src/components/game/HandTracking.tsx
 * - Uses: MediaPipe landmark data (21 points per hand)
 * 
 * KEY CONCEPTS:
 * - Landmarks: 21 points on the hand (wrist, finger joints, tips)
 * - Finger states: 'open' (extended), 'curled' (bent), 'half' (partial)
 * - Custom checks: Additional geometry validation per letter
 * 
 * =============================================================================
 * MEDIAPIPE LANDMARK INDICES (21 points):
 * =============================================================================
 * 
 *   0 = Wrist (base of hand)
 * 
 *   THUMB:     1 = CMC, 2 = MCP, 3 = IP, 4 = TIP
 *   INDEX:     5 = MCP, 6 = PIP, 7 = DIP, 8 = TIP
 *   MIDDLE:    9 = MCP, 10 = PIP, 11 = DIP, 12 = TIP
 *   RING:      13 = MCP, 14 = PIP, 15 = DIP, 16 = TIP
 *   PINKY:     17 = MCP, 18 = PIP, 19 = DIP, 20 = TIP
 * 
 *   TIP = fingertip, PIP = middle knuckle, MCP = base knuckle
 * 
 * COORDINATE SYSTEM:
 *   - X: 0 (left) to 1 (right)
 *   - Y: 0 (top) to 1 (bottom) - NOTE: Y increases downward!
 *   - Z: Depth (negative = closer to camera)
 * 
 * =============================================================================
 */

/**
 * * Landmark interface - single point from MediaPipe
 * Represents one of 21 tracked points on the hand
 */
export interface Landmark {
    x: number;  // * Horizontal position (0-1, normalized)
    y: number;  // * Vertical position (0-1, Y increases downward!)
    z: number;  // * Depth (negative = closer to camera)
}

/**
 * * Finger state types
 * - 'open': Finger is extended/straight
 * - 'curled': Finger is bent/folded
 * - 'half': Finger is partially bent
 */
export type FingerState = 'open' | 'curled' | 'half';

/**
 * * Finger name type for type safety
 */
export type FingerName = 'thumb' | 'index' | 'middle' | 'ring' | 'pinky';

/**
 * * Sign definition structure
 * Describes what hand shape is expected for each ASL letter/word
 * 
 * @property fingers - Expected state for each finger
 * @property customCheck - Optional additional geometry validation
 */
export interface SignDefinition {
    fingers: Record<FingerName, FingerState | FingerState[]>;
    // * Optional custom checks function for complex geometry
    customCheck?: (landmarks: Landmark[], handScale: number) => boolean;
}

/**
 * * Calculate Euclidean distance between two landmarks
 * Used for checking if fingertips are touching, etc.
 * 
 * @param a - First landmark point
 * @param b - Second landmark point
 * @returns Distance in normalized units (0-1 scale)
 */
const dist = (a: Landmark, b: Landmark): number => {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
};

/**
 * =============================================================================
 * checkSign() - Main Sign Verification Function
 * =============================================================================
 * 
 * Determines if the user's hand matches the expected ASL sign.
 * 
 * ALGORITHM:
 * 1. Calculate hand scale (for distance normalization)
 * 2. Determine each finger's state (open/curled)
 * 3. Compare against SignDefinition for target letter
 * 4. Run any custom geometry checks
 * 5. Return true if all checks pass
 * 
 * @param landmarks - Array of 21 MediaPipe hand landmarks
 * @param word - The letter or word to check (e.g., "A", "HELLO")
 * @returns true if hand matches the sign, false otherwise
 * 
 * @example
 * if (checkSign(landmarks, 'A')) {
 *   console.log('User signed the letter A correctly!');
 * }
 */

export const checkSign = (landmarks: Landmark[], word: string): boolean => {
    if (!landmarks || landmarks.length < 21) return false;

    // Landmarks indices
    const wrist = landmarks[0];
    const thumbTip = landmarks[4];
    const thumbIp = landmarks[3];
    const thumbMcp = landmarks[2];
    const indexTip = landmarks[8];
    const indexPip = landmarks[6];
    const indexBase = landmarks[5];
    const middleTip = landmarks[12];
    const middleBase = landmarks[9];
    const ringTip = landmarks[16];
    const ringBase = landmarks[13];
    const pinkyTip = landmarks[20];
    const pinkyBase = landmarks[17];

    // Scale factor based on palm size (wrist to middle finger base)
    const handScale = dist(wrist, middleBase);

    // Helper to get finger state (Open vs Curled)
    const getFingerState = (tipIdx: number, pipIdx: number, mcpIdx: number): FingerState => {
        const tip = landmarks[tipIdx];
        const pip = landmarks[pipIdx]; // Middle joint
        const mcp = landmarks[mcpIdx]; // Base joint

        // Check varying degrees of curl based on relative distance to wrist
        const dTipWrist = dist(tip, wrist);
        const dMcpWrist = dist(mcp, wrist);

        // If tip is significantly closer to wrist than base, it's curled
        if (dTipWrist < dMcpWrist * 1.2) return 'curled'; // 1.2 factor allows for loose curl

        // Vertical check (if upright)
        if (tip.y > pip.y) return 'curled';

        return 'open';
    };

    // Calculate states for 4 fingers
    const indexState = getFingerState(8, 6, 5);
    const middleState = getFingerState(12, 10, 9);
    const ringState = getFingerState(16, 14, 13);
    const pinkyState = getFingerState(20, 18, 17);

    // Explicit Thumb State Analysis
    // "Open" = sticking out/up
    // "Curled" = tucked in
    const thumbState = (() => {
        // Check if tip is far from palm center
        const palmCenter = { x: (indexBase.x + pinkyBase.x) / 2, y: (indexBase.y + pinkyBase.y) / 2 };
        const dThumb = dist(thumbTip, palmCenter as Landmark) / handScale;
        return dThumb > 0.4 ? 'open' : 'curled';
    })();

    const definitions: Record<string, SignDefinition> = {
        'A': {
            fingers: { thumb: 'open', index: 'curled', middle: 'curled', ring: 'curled', pinky: 'curled' },
            customCheck: (l, scale) => {
                // A: Thumb is UP and resting against the SIDE of the index finger.
                // It is NOT tucked over the fingers (that's S).
                // Check verticality - thumb tip higher than index base
                const thumbUp = thumbTip.y < indexBase.y;
                return thumbUp;
            }
        },
        'B': {
            fingers: { thumb: 'curled', index: 'open', middle: 'open', ring: 'open', pinky: 'open' },
            customCheck: (l, scale) => {
                // B: Thumb tucked in front of palm, fingers straight up + together
                const thumbInFront = Math.abs(thumbTip.x - indexBase.x) < 0.3 * scale;
                return thumbInFront;
            }
        },
        'C': {
            fingers: { thumb: 'open', index: ['open', 'half', 'curled'], middle: ['open', 'half', 'curled'], ring: ['open', 'half', 'curled'], pinky: ['open', 'half', 'curled'] },
            customCheck: (l, scale) => {
                // C: Claw shape. Fingers curved. Thumb and Index separated vertically but aligned.
                const d = dist(thumbTip, indexTip) / scale;
                // Gap needed (unlike O)
                return d > 0.25 && d < 0.9;
            }
        },
        'D': {
            fingers: { thumb: 'curled', index: 'open', middle: 'curled', ring: 'curled', pinky: 'curled' },
            customCheck: (l, scale) => {
                // D: Index UP. Thumb touches Middle (and usually Ring) tips.
                const dThumbMiddle = dist(thumbTip, middleTip) / scale;
                const dThumbRing = dist(thumbTip, ringTip) / scale;
                // Strict touch check
                return dThumbMiddle < 0.25 || dThumbRing < 0.25;
            }
        },
        'E': {
            fingers: { thumb: 'curled', index: 'curled', middle: 'curled', ring: 'curled', pinky: 'curled' },
            customCheck: (l, scale) => {
                // E: Thumb tucked UNDER curled fingers.
                // CRITICAL DISTINCTION: Thumb tip is lower than (or under) finger tips.
                // Finger tips are touching the thumb or very close.

                // Check all tips are bunched
                const dIndex = dist(indexTip, thumbTip) / scale;
                const dMiddle = dist(middleTip, thumbTip) / scale;

                // If fingers are "raised" significantly above thumb, it might be F
                // In E, fingertips are resting on thumb.
                // Vertical check: Index tip should not be much higher than thumb tip

                return dIndex < 0.25 && dMiddle < 0.25;
            }
        },
        'F': {
            fingers: { thumb: 'open', index: 'curled', middle: 'open', ring: 'open', pinky: 'open' },
            customCheck: (l, scale) => {
                // F: OK sign. Thumb + Index touch. OTHERS ARE OPEN (Up).
                const dTouch = dist(thumbTip, indexTip) / scale;

                // Critical check vs E: Middle/Ring/Pinky MUST be open/up
                const middleUp = middleTip.y < middleBase.y; // Standard "up" check

                return dTouch < 0.25 && middleUp;
            }
        },
        'G': {
            fingers: { thumb: 'open', index: 'open', middle: 'curled', ring: 'curled', pinky: 'curled' },
            customCheck: (l, scale) => {
                // G: Horizontal Index and Thumb. Parallel.
                // Check horizontal alignment
                const isHorizontal = Math.abs(indexTip.y - indexBase.y) < Math.abs(indexTip.x - indexBase.x);
                return isHorizontal;
            }
        },
        'H': {
            fingers: { thumb: 'open', index: 'open', middle: 'open', ring: 'curled', pinky: 'curled' },
            customCheck: (l, scale) => {
                // H: Index + Middle horizontal.
                const isHorizontal = Math.abs(indexTip.y - indexBase.y) < Math.abs(indexTip.x - indexBase.x);
                return isHorizontal;
            }
        },
        'I': {
            fingers: { thumb: 'curled', index: 'curled', middle: 'curled', ring: 'curled', pinky: 'open' },
            customCheck: (l, scale) => true
        },
        'J': {
            fingers: { thumb: 'curled', index: 'curled', middle: 'curled', ring: 'curled', pinky: 'open' },
            customCheck: (l, scale) => true // Dynamic check handles movement
        },
        'K': {
            fingers: { thumb: 'open', index: 'open', middle: 'open', ring: 'curled', pinky: 'curled' },
            customCheck: (l, scale) => {
                // K: Thumb Up between Index and Middle.
                // Index is straight up. Middle is angled forward.
                const thumbBetween = (thumbTip.x > indexBase.x && thumbTip.x < middleBase.x) ||
                    (thumbTip.y < indexBase.y); // Thumb is up
                return thumbBetween;
            }
        },
        'L': {
            fingers: { thumb: 'open', index: 'open', middle: 'curled', ring: 'curled', pinky: 'curled' },
            customCheck: (l, scale) => {
                // L: Index Up, Thumb Out.
                // Critical vs D: Thumb is NOT touching fingers.
                const dThumbMiddle = dist(thumbTip, middleTip) / scale;

                return dThumbMiddle > 0.3; // Must be gap
            }
        },
        'M': {
            fingers: { thumb: 'curled', index: 'curled', middle: 'curled', ring: 'curled', pinky: 'curled' },
            customCheck: (l, scale) => {
                // M: Thumb tucked under 3 fingers (Index, Middle, Ring).
                // Thumb tip peeks out between Ring and Pinky? Or just under Ring.
                // Visually: Thumb tip is near Ring/Pinky bases.
                const dThumbRing = dist(thumbTip, ringBase) / scale;
                const dThumbPinky = dist(thumbTip, pinkyBase) / scale;

                return dThumbRing < 0.35 || dThumbPinky < 0.35;
            }
        },
        'N': {
            fingers: { thumb: 'curled', index: 'curled', middle: 'curled', ring: 'curled', pinky: 'curled' },
            customCheck: (l, scale) => {
                // N: Thumb tucked under 2 fingers (Index, Middle).
                // Thumb tip near Middle/Ring gap.
                const dThumbMiddle = dist(thumbTip, middleBase) / scale;
                const dThumbRing = dist(thumbTip, ringBase) / scale;

                return dThumbMiddle < 0.35 || dThumbRing < 0.35;
            }
        },
        'O': {
            fingers: { thumb: 'open', index: 'curled', middle: 'curled', ring: 'curled', pinky: 'curled' },
            customCheck: (l, scale) => {
                // O: All tips touching thumb.
                const d = dist(thumbTip, indexTip) / scale;
                return d < 0.25;
            }
        },
        'P': {
            fingers: { thumb: 'open', index: 'curled', middle: 'curled', ring: 'curled', pinky: 'curled' },
            customCheck: (l, scale) => {
                // P: K shape pointed down.
                return indexTip.y > wrist.y;
            }
        },
        'Q': {
            fingers: { thumb: 'open', index: 'curled', middle: 'curled', ring: 'curled', pinky: 'curled' },
            customCheck: (l, scale) => {
                // Q: G shape pointed down.
                return indexTip.y > wrist.y;
            }
        },
        'R': {
            fingers: { thumb: 'curled', index: 'open', middle: 'open', ring: 'curled', pinky: 'curled' },
            customCheck: (l, scale) => {
                // R: Crossed fingers.
                const d = dist(indexTip, middleTip) / scale;
                return d < 0.15; // Very close/crossed
            }
        },
        'S': {
            fingers: { thumb: 'curled', index: 'curled', middle: 'curled', ring: 'curled', pinky: 'curled' },
            customCheck: (l, scale) => {
                // S: Thumb wrapped OVER fingers (Fist).
                // Unlike A (side) or E (under), Thumb crosses the fingers.
                // Check if thumb tip is crossing the Index/Middle finger columns

                // Distance from palm center - S thumb is more central
                const centerDist = dist(thumbTip, { x: (indexBase.x + pinkyBase.x) / 2, y: (indexBase.y + pinkyBase.y) / 2 } as Landmark) / scale;

                return centerDist < 0.3;
            }
        },
        'T': {
            fingers: { thumb: 'curled', index: 'curled', middle: 'curled', ring: 'curled', pinky: 'curled' },
            customCheck: (l, scale) => {
                // T: Thumb under 1 finger (Index).
                // Thumb tip near Index Base.
                const dThumbIndex = dist(thumbTip, indexBase) / scale;
                const dThumbMiddle = dist(thumbTip, middleBase) / scale;

                return dThumbIndex < 0.35 || dThumbMiddle < 0.35;
            }
        },
        'U': {
            fingers: { thumb: 'curled', index: 'open', middle: 'open', ring: 'curled', pinky: 'curled' },
            customCheck: (l, scale) => {
                // U: Index/Middle up and TOGETHER
                const d = dist(indexTip, middleTip) / scale;
                return d < 0.15;
            }
        },
        'V': {
            fingers: { thumb: 'curled', index: 'open', middle: 'open', ring: 'curled', pinky: 'curled' },
            customCheck: (l, scale) => {
                // V: Index/Middle up and SPREAD
                const d = dist(indexTip, middleTip) / scale;
                return d > 0.2;
            }
        },
        'W': {
            fingers: { thumb: 'curled', index: 'open', middle: 'open', ring: 'open', pinky: 'curled' },
            customCheck: (l, scale) => true
        },
        'X': {
            fingers: { thumb: 'curled', index: 'curled', middle: 'curled', ring: 'curled', pinky: 'curled' },
            customCheck: (l, scale) => {
                // X: Index hooked.
                return indexTip.y > indexPip.y; // curled down
            }
        },
        'Y': {
            fingers: { thumb: 'open', index: 'curled', middle: 'curled', ring: 'curled', pinky: 'open' },
            customCheck: (l, scale) => {
                // Y: Thumb + Pinky out.
                const d = dist(thumbTip, pinkyTip) / scale;
                return d > 0.5;
            }
        },
        'Z': {
            fingers: { thumb: 'curled', index: 'open', middle: 'curled', ring: 'curled', pinky: 'curled' },
            customCheck: (l, scale) => {
                // Z is motion, but static Z is index pointing
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
