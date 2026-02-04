/**
 * =============================================================================
 * FILE: HandTracking.tsx
 * =============================================================================
 * 
 * C4 MODEL CONTEXT:
 * - Container: Frontend (Next.js/React Application)
 * - Component: HandTracking (Computer Vision / Gesture Detection)
 * - Responsibility: Webcam capture, MediaPipe hand landmark detection, sign verification
 * 
 * DATA FLOW:
 * 1. Component mounts → Initialize MediaPipe HandLandmarker + webcam
 * 2. Video frames captured at ~30fps
 * 3. Each frame sent to MediaPipe → Returns 21 hand landmarks
 * 4. Landmarks passed to checkSign() → Returns true/false for match
 * 5. On match → Progress bar fills → onGestureMatch callback fired
 * 
 * DEPENDENCIES:
 * - Uses: @mediapipe/tasks-vision for hand tracking
 * - Uses: src/lib/sign-definitions.ts for checkSign()
 * - Called by: src/app/page.tsx (embedded in sign overlay)
 * - Calls: onGestureMatch prop to notify parent of successful sign
 * 
 * KEY CONCEPTS:
 * - requestAnimationFrame loop: Runs detection continuously at ~60fps
 * - Progress bar: Must hold sign steady for ~1 second (fills to 100%)
 * - Status states: WAITING (no hand), ANALYZING (hand found), MATCH (correct sign)
 * 
 * =============================================================================
 */

"use client";

import React, { useEffect, useRef, useState } from 'react';
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { checkSign } from "@/lib/sign-definitions";
import { GestureRecognitionEngine, getSignatureForWord } from "@/lib/gesture-recognition";

/**
 * * Props for HandTracking component
 * @property onGestureMatch - Callback when user successfully makes the sign
 * @property targetWord - The letter/word user needs to sign (e.g., "A", "H")
 */
interface HandTrackingProps {
    onGestureMatch: (word: string) => void;  // * Called when sign is verified
    targetWord: string | null;               // * Current target to match
}

/**
 * * HandTracking Component
 * 
 * Displays webcam feed with hand landmark overlay.
 * Detects ASL signs using MediaPipe and notifies parent on match.
 * 
 * STATE MACHINE:
 * - WAITING: No hand detected, searching...
 * - ANALYZING: Hand detected, checking if it matches target
 * - MATCH: Sign matches! Hold to verify...
 * 
 * PROGRESS LOGIC:
 * - Correct sign: Progress += 12% per frame (fills in ~8 frames = ~0.5s)
 * - Wrong sign: Progress -= 1.5% per frame (decays slowly)
 * - No hand: Progress -= 0.5% per frame (decays very slowly)
 * - At 100%: Trigger onGestureMatch and stop
 * 
 * @example
 * <HandTracking
 *   targetWord="A"
 *   onGestureMatch={(word) => console.log(`Signed: ${word}`)}
 * />
 */
export const HandTracking: React.FC<HandTrackingProps> = ({ onGestureMatch, targetWord }) => {
    // * DOM References
    const videoRef = useRef<HTMLVideoElement>(null);   // * Webcam video element
    const canvasRef = useRef<HTMLCanvasElement>(null); // * Overlay for drawing landmarks

    // * State
    const [landmarker, setLandmarker] = useState<HandLandmarker | null>(null);
    const [progress, setProgress] = useState(0);       // * 0-100 progress bar value
    const [status, setStatus] = useState<'WAITING' | 'ANALYZING' | 'MATCH' | 'RETRY'>('WAITING');
    const [movementFeedback, setMovementFeedback] = useState<string | null>(null);

    // * Refs for async state
    const isProcessingRef = useRef(false);             // * Prevents double-triggers
    const gestureEngineRef = useRef<GestureRecognitionEngine | null>(null);

    /**
     * * Effect: Initialize MediaPipe and Webcam
     */
    useEffect(() => {
        let handLandmarker: HandLandmarker;
        let stream: MediaStream;
        let isCancelled = false;

        // Initialize Gesture Engine
        gestureEngineRef.current = new GestureRecognitionEngine();

        const init = async () => {
            try {
                // 1. Load Landmarker
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
                );
                handLandmarker = await HandLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                        delegate: "GPU"
                    },
                    runningMode: "VIDEO",
                    numHands: 1
                });
                if (isCancelled) return;
                setLandmarker(handLandmarker);

                // 2. Start Camera
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" }
                });
                if (isCancelled || !videoRef.current) return;

                videoRef.current.srcObject = stream;

                // Handle the play promise to avoid AbortError
                const playPromise = videoRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.warn("Autoplay was prevented or interrupted:", error);
                    });
                }
            } catch (error) {
                console.error("Initialization failed:", error);
            }
        };

        init();

        return () => {
            isCancelled = true;
            if (stream) stream.getTracks().forEach(track => track.stop());
            if (handLandmarker) handLandmarker.close();
            gestureEngineRef.current?.reset();
        };
    }, []);

    const lastVideoTimeRef = useRef(-1);

    // Detection loop
    useEffect(() => {
        if (!landmarker || !videoRef.current || !canvasRef.current || !targetWord) return;

        // Reset state when targetWord changes
        setStatus('WAITING');
        setProgress(0);
        setMovementFeedback(null);
        isProcessingRef.current = false;
        lastVideoTimeRef.current = -1;
        gestureEngineRef.current?.reset();

        let animationFrameId: number;
        const ctx = canvasRef.current.getContext('2d')!;

        const predict = () => {
            if (!landmarker || isProcessingRef.current) return;

            const video = videoRef.current;
            if (video && video.readyState >= 2) {
                try {
                    const timestamp = video.currentTime * 1000;

                    if (timestamp > lastVideoTimeRef.current) {
                        lastVideoTimeRef.current = timestamp;
                        const results = landmarker.detectForVideo(video, timestamp);

                        ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);

                        if (results.landmarks && results.landmarks.length > 0) {
                            const landmarks = results.landmarks[0];
                            setStatus('ANALYZING');

                            // Draw landmarks
                            for (const point of landmarks) {
                                ctx.fillStyle = "#22c55e";
                                ctx.beginPath();
                                ctx.arc(point.x * canvasRef.current!.width, point.y * canvasRef.current!.height, 2, 0, Math.PI * 2);
                                ctx.fill();
                            }

                            let isMatch = false;

                            // LOGIC BRANCH: Initialized Sign (Level 2) vs Static Letter (Level 1)
                            if (targetWord && targetWord.length > 1) {
                                // --- Level 2: Initialized Sign ---
                                const signature = getSignatureForWord(targetWord);

                                if (signature) {
                                    // 1. Check if identifying letter matches
                                    const letterMatches = checkSign(landmarks, signature.letter);

                                    // 2. Feed to engine for movement detection
                                    gestureEngineRef.current?.addFrame(
                                        landmarks as any,
                                        letterMatches ? signature.letter : null,
                                        letterMatches ? 0.9 : 0
                                    );

                                    const result = gestureEngineRef.current?.recognize();

                                    // 3. Check initialized sign match
                                    if (result?.initializedSign?.word === targetWord) {
                                        isMatch = true;
                                        setMovementFeedback("Perfect movement!");
                                    } else if (letterMatches) {
                                        // Letter good, checking movement
                                        const moveType = signature.expectedMovement.type;
                                        setMovementFeedback(`Handshape good! Now add ${moveType} movement.`);
                                    } else {
                                        setMovementFeedback(`Show letter ${signature.letter} first`);
                                    }
                                }
                            } else {
                                // --- Level 1: Static Letter ---
                                isMatch = checkSign(landmarks, targetWord!);
                                setMovementFeedback(null);
                            }

                            if (isMatch) {
                                setStatus('MATCH');
                                setProgress(prev => {
                                    const next = prev + 12;
                                    if (next >= 100) {
                                        isProcessingRef.current = true;
                                        setTimeout(() => onGestureMatch(targetWord!), 10);
                                        return 100;
                                    }
                                    return next;
                                });
                            } else {
                                setProgress(prev => Math.max(0, prev - 1.5));
                            }
                        } else {
                            setStatus('WAITING');
                            setProgress(prev => Math.max(0, prev - 0.5));
                            setMovementFeedback(null);
                        }
                    }
                } catch (err) {
                    console.error("Landmarker detection error:", err);
                }
            }
            animationFrameId = requestAnimationFrame(predict);
        };

        predict();
        return () => {
            cancelAnimationFrame(animationFrameId);
            isProcessingRef.current = true;
        };
    }, [landmarker, targetWord, onGestureMatch]);

    // Backward compatibility helper
    const checkGestureHeuristic = (landmarks: any[], word: string): boolean => {
        return checkSign(landmarks, word);
    };

    return (
        <div className="flex flex-col gap-2 w-full">
            <div className="relative w-full aspect-video bg-slate-900 rounded-lg overflow-hidden shadow-inner border border-slate-800">
                <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                    playsInline
                    muted
                />
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                    width={640}
                    height={480}
                />

                {progress > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-2 bg-black/40">
                        <div
                            className={`h-full transition-all duration-100 ease-out shadow-lg ${status === 'MATCH' ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-blue-400'
                                }`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}

                <div className="absolute top-4 left-4 flex gap-2">
                    <div className="bg-black/60 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-black border border-white/10 shadow-lg flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full animate-pulse ${status === 'WAITING' ? 'bg-red-500' :
                            status === 'ANALYZING' ? 'bg-yellow-500' : 'bg-green-500'
                            }`} />
                        {status === 'WAITING' ? 'SEARCHING...' :
                            status === 'ANALYZING' ? 'HAND DETECTED' : 'MATCHING!'}
                    </div>

                    {targetWord && (
                        <div className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-black border border-blue-400 shadow-lg">
                            TARGET: {targetWord}
                        </div>
                    )}
                </div>

                {status === 'MATCH' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="bg-green-500 text-white px-6 py-3 rounded-full font-bold text-lg shadow-xl flex items-center gap-2 animate-pulse">
                            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Verifying...
                        </div>
                    </div>
                )}
            </div>

            {/* Status Message Area - Below Video */}
            <div className="h-12 flex items-center justify-center">
                {(status === 'WAITING' || (status === 'ANALYZING' && progress === 0)) ? (
                    <div className="text-slate-500 text-sm font-bold bg-slate-100 px-6 py-2 rounded-full border border-slate-200 shadow-sm text-center w-full animate-in fade-in duration-300">
                        {status === 'WAITING' ? (
                            <span className="flex items-center justify-center gap-2">
                                📷 Please move your hand into frame
                            </span>
                        ) : movementFeedback ? (
                            <span className="text-purple-600">
                                ℹ️ {movementFeedback}
                            </span>
                        ) : (
                            <span className="text-amber-600">
                                ✋ Adjust hand to match guide
                            </span>
                        )}
                    </div>
                ) : (
                    <div className="text-green-600 text-sm font-bold bg-green-50 px-6 py-2 rounded-full border border-green-200 shadow-sm text-center w-full animate-in fade-in duration-300">
                        ✨ Perfect! Hold steady...
                    </div>
                )}
            </div>
        </div>
    );
};
