/**
 * Custom Static Gesture Recognition
 * Replaces Fingerpose with explicit geometric checks for better control.
 */

export interface HandLandmark {
    x: number;
    y: number;
    z: number;
}

export interface StaticGestureResult {
    name: string;
    confidence: number; // 0-1
}

/**
 * Calculate Euclidean distance between two points
 */
function getDistance(p1: HandLandmark, p2: HandLandmark): number {
    return Math.sqrt(
        Math.pow(p1.x - p2.x, 2) +
        Math.pow(p1.y - p2.y, 2) +
        Math.pow(p1.z - p2.z, 2)
    );
}

/**
 * Check finger state: EXTENDED, CURLED, or HALF_CURLED
 */
function getFingerState(tip: HandLandmark, pip: HandLandmark, mcp: HandLandmark, wrist: HandLandmark): 'EXTENDED' | 'CURLED' | 'HALF_CURLED' {
    const distTipWrist = getDistance(tip, wrist);
    const distMcpWrist = getDistance(mcp, wrist);
    const distTipMcp = getDistance(tip, mcp);

    // Extended: Tip is far from wrist (further than MCP) and Tip is far from MCP
    if (distTipWrist > distMcpWrist * 1.5) { // Heuristic
        return 'EXTENDED';
    }

    // Curled: Tip is close to MCP/Palm
    if (distTipMcp < distMcpWrist * 0.6) {
        return 'CURLED';
    }

    return 'HALF_CURLED';
}

/**
 * Check primary orientation of a finger
 */
function getFingerOrientation(tip: HandLandmark, wrist: HandLandmark): 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'FORWARD' {
    const dx = tip.x - wrist.x;
    const dy = tip.y - wrist.y;
    // z is rough depth. Negative Z is closer to camera in some models, check MP docs. usually.
    // simpler: compare abs(dx) vs abs(dy).

    if (Math.abs(dx) > Math.abs(dy)) {
        return dx > 0 ? 'LEFT' : 'RIGHT'; // mirror? usually x increases to left of screen (patient left)
    } else {
        return dy > 0 ? 'DOWN' : 'UP'; // y increases downwards
    }
}

/**
 * Detect static gestures based on landmarks
 */
/**
 * Detect static gestures based on landmarks
 */
export function detectStaticGesture(landmarks: HandLandmark[]): StaticGestureResult | null {
    if (!landmarks || landmarks.length < 21) return null;

    const wrist = landmarks[0];
    const thumbTip = landmarks[4];
    const thumbIP = landmarks[3];
    const indexTip = landmarks[8];
    const indexMCP = landmarks[5]; const indexPIP = landmarks[6];
    const middleTip = landmarks[12];
    const middleMCP = landmarks[9]; const middlePIP = landmarks[10];
    const ringTip = landmarks[16];
    const ringMCP = landmarks[13]; const ringPIP = landmarks[14];
    const pinkyTip = landmarks[20];
    const pinkyMCP = landmarks[17]; const pinkyPIP = landmarks[18];

    // Get states
    const indexState = getFingerState(indexTip, indexPIP, indexMCP, wrist);
    const middleState = getFingerState(middleTip, middlePIP, middleMCP, wrist);
    const ringState = getFingerState(ringTip, ringPIP, ringMCP, wrist);
    const pinkyState = getFingerState(pinkyTip, pinkyPIP, pinkyMCP, wrist);

    // Thumb check
    const isThumbExt = getDistance(thumbTip, indexMCP) > 0.05;

    // Helper: Orientation check
    const orientation = getFingerOrientation(indexTip, wrist);


    // =========================================================================
    // WLASL Handshapes (Prioritized)
    // =========================================================================

    // 1. PINCH / O-SHAPE (Thumb touching fingers)
    // Check distance between thumb tip and index tip
    const thumbIndexDist = getDistance(thumbTip, indexTip);
    if (thumbIndexDist < 0.03) {
        // If other fingers are extended -> OK Sign / F-Shape?
        // If other fingers curled -> O-Shape / Pinch
        if (middleState === 'CURLED' && ringState === 'CURLED' && pinkyState === 'CURLED') {
            return { name: 'O_SHAPE', confidence: 0.9 }; // Or PINCH
        }
        // If index is pinched but others open -> OK
        // treat as generic PINCH for now for simple "NO" detection
        return { name: 'PINCH', confidence: 0.85 };
    }

    // 2. L-SHAPE (Index extended, Thumb extended, others curled)
    if (indexState === 'EXTENDED' && isThumbExt &&
        middleState === 'CURLED' && ringState === 'CURLED' && pinkyState === 'CURLED') {
        return { name: 'L_SHAPE', confidence: 0.9 };
    }

    // 3. Y-SHAPE (Thumb and Pinky extended, others curled)
    if (pinkyState === 'EXTENDED' && isThumbExt &&
        indexState === 'CURLED' && middleState === 'CURLED' && ringState === 'CURLED') {
        return { name: 'Y_SHAPE', confidence: 0.9 };
    }

    // 4. POINT / I-SHAPE (Index extended, others curled)
    if (indexState === 'EXTENDED' && middleState === 'CURLED' && ringState === 'CURLED' && pinkyState === 'CURLED') {
        if (orientation === 'DOWN') return { name: 'POINT', confidence: 0.9 }; // Pointing down
        return { name: 'POINT', confidence: 0.9 }; // General point (can be "I" or "YOU")
        // Note: I usually uses pinky, but POINT is common for "YOU/I" refs
    }

    // 5. OPEN PALM / FLAT HAND
    if (indexState === 'EXTENDED' && middleState === 'EXTENDED' && ringState === 'EXTENDED' && pinkyState === 'EXTENDED') {
        // Distinguish Flat (fingers together) vs Open (splayed) - hard with just landmarks, assume mostly Flat
        // Check thumb
        if (isThumbExt) {
            return { name: 'OPEN_PALM', confidence: 0.9 };
        }
        return { name: 'FLAT_HAND', confidence: 0.9 }; // Thumb tucked
    }

    // 6. S_SHAPE / FIST (All curled, thumb wrapped over fingers)
    // Used for DRIVE, CAR signs
    if (indexState === 'CURLED' && middleState === 'CURLED' && ringState === 'CURLED' && pinkyState === 'CURLED') {
        // S-Shape is fist with thumb over fingers (standard for DRIVE/CAR)
        return { name: 'S_SHAPE', confidence: 0.9 };
    }

    // 7. C-SHAPE (Curved fingers)
    if (indexState === 'HALF_CURLED' && middleState === 'HALF_CURLED' &&
        ringState === 'HALF_CURLED' && pinkyState === 'HALF_CURLED') {
        return { name: 'C_SHAPE', confidence: 0.85 };
    }

    // 8. W-SHAPE (Index, Middle, Ring extended)
    if (indexState === 'EXTENDED' && middleState === 'EXTENDED' && ringState === 'EXTENDED' && pinkyState === 'CURLED') {
        return { name: 'W_SHAPE', confidence: 0.9 };
    }

    // 9. V-SHAPE (Index, Middle extended)
    if (indexState === 'EXTENDED' && middleState === 'EXTENDED' && ringState === 'CURLED' && pinkyState === 'CURLED') {
        return { name: 'V_SHAPE', confidence: 0.9 };
    }

    return null;
}
