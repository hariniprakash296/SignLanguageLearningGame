/**
 * =============================================================================
 * Movement Analyzer
 * =============================================================================
 * 
 * C4 MODEL CONTEXT:
 * - Container: Frontend (Next.js/React Application)
 * - Component: Gesture Recognition Engine
 * - Responsibility: Analyze temporal hand movement to detect patterns
 * 
 * HOW IT WORKS:
 * 1. Store hand landmark positions over time (frame buffer)
 * 2. Calculate movement trajectories and velocities
 * 3. Match trajectories against known patterns (circular, arc, tap, etc.)
 * 4. Return detected movement with confidence score
 * 
 * TECHNICAL APPROACH:
 * - Maintain rolling buffer of last ~60 frames (2 seconds @ 30fps)
 * - Track palm center (average of all landmarks) over time
 * - Calculate trajectory shape using curve fitting
 * - Use pattern matching to identify movement types
 * 
 * =============================================================================
 */

import {
    MovementFrame,
    MovementPattern,
    MovementType,
    MovementDirection
} from './movement-patterns';

/**
 * * Raw landmark from MediaPipe
 */
export interface RawLandmark {
    x: number;  // 0-1 normalized
    y: number;  // 0-1 normalized  
    z: number;  // Depth, approximate
}

/**
 * * Configuration for the movement analyzer
 */
export interface MovementAnalyzerConfig {
    bufferSize: number;         // How many frames to keep
    minFramesForAnalysis: number; // Minimum frames before analyzing
    noiseThreshold: number;     // Ignore movements smaller than this
    circularThreshold: number;  // Min circularity to detect circular motion
    tapThreshold: number;       // Velocity spike threshold for taps
    shakeThreshold: number;     // Direction reversal threshold for shakes
}

const DEFAULT_CONFIG: MovementAnalyzerConfig = {
    bufferSize: 60,             // ~2 seconds at 30fps
    minFramesForAnalysis: 20,   // ~0.7 seconds minimum (was 15)
    noiseThreshold: 0.08,       // 8% of screen movement is noise (was 2%)
    circularThreshold: 0.6,     // 60% match for circular
    tapThreshold: 0.2,          // 20% velocity spike (was 15%)
    shakeThreshold: 4,          // 4+ direction reversals (was 3)
};

/**
 * * MovementAnalyzer class
 * 
 * Tracks hand landmarks over time and detects movement patterns
 */
export class MovementAnalyzer {
    private frameBuffer: MovementFrame[] = [];
    private config: MovementAnalyzerConfig;
    private lastAnalysisTime: number = 0;
    private analysisDebounceMs: number = 100; // Analyze at most every 100ms

    constructor(config: Partial<MovementAnalyzerConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * * Add a new frame of hand landmarks
     */
    addFrame(landmarks: RawLandmark[]): void {
        if (!landmarks || landmarks.length < 21) return;

        const frame: MovementFrame = {
            timestamp: Date.now(),
            landmarks: landmarks.map(l => ({ x: l.x, y: l.y, z: l.z })),
            palmCenter: this.calculatePalmCenter(landmarks),
            wristPosition: { x: landmarks[0].x, y: landmarks[0].y, z: landmarks[0].z },
        };

        this.frameBuffer.push(frame);

        // Keep buffer size limited
        while (this.frameBuffer.length > this.config.bufferSize) {
            this.frameBuffer.shift();
        }
    }

    /**
     * * Clear the frame buffer
     */
    reset(): void {
        this.frameBuffer = [];
        this.lastAnalysisTime = 0;
    }

    /**
     * * Get the current frame count
     */
    getFrameCount(): number {
        return this.frameBuffer.length;
    }

    /**
     * * Check if we have enough frames to analyze
     */
    canAnalyze(): boolean {
        return this.frameBuffer.length >= this.config.minFramesForAnalysis;
    }

    /**
     * * Analyze the current movement buffer
     * Returns the most likely movement pattern
     */
    analyzeMovement(): MovementPattern {
        // Debounce analysis
        const now = Date.now();
        if (now - this.lastAnalysisTime < this.analysisDebounceMs) {
            return this.getStaticPattern();
        }
        this.lastAnalysisTime = now;

        if (!this.canAnalyze()) {
            return this.getStaticPattern();
        }

        // Calculate total movement magnitude
        const magnitude = this.calculateMagnitude();

        // If movement is below noise threshold, return static
        if (magnitude < this.config.noiseThreshold) {
            return this.getStaticPattern();
        }

        // Check for different movement patterns
        const circular = this.detectCircular();
        const arc = this.detectArc();
        const tap = this.detectTap();
        const shake = this.detectShake();
        const forward = this.detectForward();

        // Find highest confidence pattern
        const patterns = [circular, arc, tap, shake, forward];
        const bestPattern = patterns.reduce((best, current) =>
            current.confidence > best.confidence ? current : best
        );

        // Return best match or static if no confident match
        // STRICTER: Require 0.65+ confidence to detect non-static movement (was 0.5)
        if (bestPattern.confidence > 0.65) {
            return bestPattern;
        }

        return {
            type: 'static',
            magnitude,
            confidence: 1 - magnitude,
            duration: this.getBufferDuration(),
        };
    }

    // =========================================================================
    // PATTERN DETECTION METHODS
    // =========================================================================

    /**
     * * Detect circular motion
     */
    detectCircular(): MovementPattern {
        if (this.frameBuffer.length < 20) {
            return this.getLowConfidencePattern('circular');
        }

        const trajectory = this.getTrajectory();
        const center = this.getTrajectoryCenter(trajectory);

        // Calculate how circular the motion is
        let circularity = 0;
        let totalAngle = 0;
        let direction: MovementDirection = 'clockwise';

        for (let i = 1; i < trajectory.length - 1; i++) {
            const prev = trajectory[i - 1];
            const curr = trajectory[i];
            const next = trajectory[i + 1];

            // Calculate angles relative to center
            const anglePrev = Math.atan2(prev.y - center.y, prev.x - center.x);
            const angleNext = Math.atan2(next.y - center.y, next.x - center.x);

            let delta = angleNext - anglePrev;
            // Normalize to -PI to PI
            while (delta > Math.PI) delta -= 2 * Math.PI;
            while (delta < -Math.PI) delta += 2 * Math.PI;

            totalAngle += delta;
        }

        // Determine direction based on total angle
        direction = totalAngle > 0 ? 'counterclockwise' : 'clockwise';

        // Calculate circularity based on how much rotation occurred
        const rotations = Math.abs(totalAngle) / (2 * Math.PI);
        circularity = Math.min(rotations * 2, 1); // Half rotation = 1.0 confidence

        // Check if points are roughly equidistant from center
        const distances = trajectory.map(p =>
            Math.sqrt(Math.pow(p.x - center.x, 2) + Math.pow(p.y - center.y, 2))
        );
        const avgDist = distances.reduce((a, b) => a + b, 0) / distances.length;
        const distVariance = distances.reduce((sum, d) => sum + Math.pow(d - avgDist, 2), 0) / distances.length;
        const regularityScore = 1 / (1 + distVariance * 100);

        const confidence = circularity * regularityScore;

        return {
            type: 'circular',
            direction,
            magnitude: avgDist,
            confidence: Math.min(confidence, 1),
            duration: this.getBufferDuration(),
        };
    }

    /**
     * * Detect arc motion (semicircle)
     */
    detectArc(): MovementPattern {
        if (this.frameBuffer.length < 15) {
            return this.getLowConfidencePattern('arc');
        }

        const trajectory = this.getTrajectory();
        const start = trajectory[0];
        const end = trajectory[trajectory.length - 1];

        // Arc: hands move apart then come back (or vice versa)
        // Check for horizontal spread
        const horizontalSpread = Math.abs(end.x - start.x);
        const verticalSpread = Math.abs(end.y - start.y);

        // Check for curvature in both planes
        const midpoint = trajectory[Math.floor(trajectory.length / 2)];

        const hasVerticalArc = (midpoint.y < start.y && midpoint.y < end.y) ||
            (midpoint.y > start.y && midpoint.y > end.y);

        const hasHorizontalArc = (midpoint.x < start.x && midpoint.x < end.x) ||
            (midpoint.x > start.x && midpoint.x > end.x);

        const hasArcShape = hasVerticalArc || hasHorizontalArc;

        // Calculate curvature
        let totalCurvature = 0;
        for (let i = 1; i < trajectory.length - 1; i++) {
            const prev = trajectory[i - 1];
            const curr = trajectory[i];
            const next = trajectory[i + 1];

            const v1 = { x: curr.x - prev.x, y: curr.y - prev.y };
            const v2 = { x: next.x - curr.x, y: next.y - curr.y };

            const cross = v1.x * v2.y - v1.y * v2.x;
            const dot = v1.x * v2.x + v1.y * v2.y;
            const angle = Math.atan2(cross, dot);

            totalCurvature += Math.abs(angle);
        }

        const avgCurvature = totalCurvature / (trajectory.length - 2);

        // Arc: Curvature should be significant but not a full circle
        // Relaxed: A decent arc can be subtle (15 degrees) up to 220 degrees
        const totalAngleDeg = (totalCurvature * 180) / Math.PI;

        // Bonus score for ideal arc range (45-135 degrees)
        const idealRangeBonus = (totalAngleDeg > 45 && totalAngleDeg < 135) ? 0.2 : 0;
        const curveScore = (totalAngleDeg > 15 && totalAngleDeg < 220) ? (0.8 + idealRangeBonus) : 0.4;

        const direction: MovementDirection = horizontalSpread > verticalSpread ? 'horizontal' : 'vertical';

        // Boost confidence base if we detected the shape, to overcome noise
        const confidence = (hasArcShape ? 0.85 : 0.4) * curveScore;
        const magnitude = Math.max(horizontalSpread, verticalSpread);

        return {
            type: 'arc',
            direction,
            magnitude,
            confidence: Math.min(confidence, 1),
            duration: this.getBufferDuration(),
        };
    }

    /**
     * * Detect tapping motion
     */
    detectTap(): MovementPattern {
        if (this.frameBuffer.length < 10) {
            return this.getLowConfidencePattern('tap');
        }

        const trajectory = this.getTrajectory();
        const velocities = this.calculateVelocities(trajectory);

        // Count velocity spikes (sudden stops = taps)
        let tapCount = 0;
        let wasMoving = false;

        for (const v of velocities) {
            const isMoving = v > this.config.tapThreshold;
            if (wasMoving && !isMoving) {
                tapCount++;
            }
            wasMoving = isMoving;
        }

        // Tapping should have 2+ taps
        const confidence = tapCount >= 2 ? Math.min(tapCount * 0.4, 1) : 0.2;
        const magnitude = this.calculateMagnitude();

        return {
            type: 'tap',
            direction: 'up',
            magnitude,
            confidence,
            duration: this.getBufferDuration(),
            repetitions: tapCount,
        };
    }

    /**
     * * Detect shaking motion (side to side)
     */
    detectShake(): MovementPattern {
        if (this.frameBuffer.length < 15) {
            return this.getLowConfidencePattern('shake');
        }

        const trajectory = this.getTrajectory();

        // Count direction reversals
        let reversals = 0;
        let lastDirection = 0; // -1 = left, 1 = right

        for (let i = 1; i < trajectory.length; i++) {
            const dx = trajectory[i].x - trajectory[i - 1].x;
            const direction = dx > 0.005 ? 1 : (dx < -0.005 ? -1 : 0);

            if (direction !== 0 && direction !== lastDirection && lastDirection !== 0) {
                reversals++;
            }
            if (direction !== 0) {
                lastDirection = direction;
            }
        }

        // Good shake has multiple reversals
        const confidence = reversals >= this.config.shakeThreshold ?
            Math.min(reversals * 0.25, 1) : 0.2;

        return {
            type: 'shake',
            direction: 'horizontal',
            magnitude: this.calculateMagnitude(),
            confidence,
            duration: this.getBufferDuration(),
            repetitions: Math.floor(reversals / 2),
        };
    }

    /**
     * * Detect forward pushing motion
     */
    detectForward(): MovementPattern {
        if (this.frameBuffer.length < 10) {
            return this.getLowConfidencePattern('forward');
        }

        const trajectory = this.getTrajectory();
        const start = trajectory[0];
        const end = trajectory[trajectory.length - 1];

        // Forward motion = Z changes significantly (hand moves toward camera)
        // Also check if Y stays relatively stable
        const zChange = start.z - end.z; // Positive = toward camera
        const yChange = Math.abs(end.y - start.y);
        const xChange = Math.abs(end.x - start.x);

        // Forward motion should have significant Z change, less X/Y change
        const forwardScore = zChange > 0.1 ? zChange * 2 : 0;
        const stabilityScore = 1 - (xChange + yChange);

        const confidence = forwardScore * stabilityScore;

        return {
            type: 'forward',
            direction: 'forward',
            magnitude: zChange,
            confidence: Math.min(Math.max(confidence, 0.1), 1),
            duration: this.getBufferDuration(),
        };
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    private calculatePalmCenter(landmarks: RawLandmark[]): { x: number; y: number; z: number } {
        // Palm center is average of landmarks 0, 5, 9, 13, 17 (wrist and finger bases)
        const palmLandmarks = [0, 5, 9, 13, 17];
        let x = 0, y = 0, z = 0;

        for (const idx of palmLandmarks) {
            if (landmarks[idx]) {
                x += landmarks[idx].x;
                y += landmarks[idx].y;
                z += landmarks[idx].z;
            }
        }

        const count = palmLandmarks.length;
        return { x: x / count, y: y / count, z: z / count };
    }

    private getTrajectory(): { x: number; y: number; z: number }[] {
        return this.frameBuffer.map(f => f.palmCenter);
    }

    private getTrajectoryCenter(trajectory: { x: number; y: number; z: number }[]): { x: number; y: number } {
        let x = 0, y = 0;
        for (const p of trajectory) {
            x += p.x;
            y += p.y;
        }
        return { x: x / trajectory.length, y: y / trajectory.length };
    }

    private calculateMagnitude(): number {
        if (this.frameBuffer.length < 2) return 0;

        const trajectory = this.getTrajectory();
        let totalDist = 0;

        for (let i = 1; i < trajectory.length; i++) {
            const dx = trajectory[i].x - trajectory[i - 1].x;
            const dy = trajectory[i].y - trajectory[i - 1].y;
            totalDist += Math.sqrt(dx * dx + dy * dy);
        }

        return totalDist;
    }

    private calculateVelocities(trajectory: { x: number; y: number; z: number }[]): number[] {
        const velocities: number[] = [];

        for (let i = 1; i < trajectory.length; i++) {
            const dx = trajectory[i].x - trajectory[i - 1].x;
            const dy = trajectory[i].y - trajectory[i - 1].y;
            velocities.push(Math.sqrt(dx * dx + dy * dy));
        }

        return velocities;
    }

    private getBufferDuration(): number {
        if (this.frameBuffer.length < 2) return 0;
        return this.frameBuffer[this.frameBuffer.length - 1].timestamp -
            this.frameBuffer[0].timestamp;
    }

    private getStaticPattern(): MovementPattern {
        return {
            type: 'static',
            magnitude: 0,
            confidence: 1,
            duration: this.getBufferDuration(),
        };
    }

    private getLowConfidencePattern(type: MovementType): MovementPattern {
        return {
            type,
            magnitude: 0,
            confidence: 0,
            duration: this.getBufferDuration(),
        };
    }
}

export default MovementAnalyzer;
