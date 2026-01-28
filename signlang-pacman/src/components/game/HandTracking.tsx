"use client";

import React, { useEffect, useRef, useState } from 'react';
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { checkSign } from "@/lib/sign-definitions";

interface HandTrackingProps {
    onGestureMatch: (word: string) => void;
    targetWord: string | null;
}

export const HandTracking: React.FC<HandTrackingProps> = ({ onGestureMatch, targetWord }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [landmarker, setLandmarker] = useState<HandLandmarker | null>(null);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState<'WAITING' | 'ANALYZING' | 'MATCH' | 'RETRY'>('WAITING');
    const isProcessingRef = useRef(false);

    // Initialize landmarker and webcam together to ensure synchronization
    useEffect(() => {
        let handLandmarker: HandLandmarker;
        let stream: MediaStream;
        let isCancelled = false;

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
        };
    }, []);

    const lastVideoTimeRef = useRef(-1);

    // Detection loop
    useEffect(() => {
        if (!landmarker || !videoRef.current || !canvasRef.current || !targetWord) return;

        // Reset state when targetWord changes
        setStatus('WAITING');
        setProgress(0);
        isProcessingRef.current = false;
        lastVideoTimeRef.current = -1;

        let animationFrameId: number;
        const ctx = canvasRef.current.getContext('2d')!;

        const predict = () => {
            if (!landmarker || isProcessingRef.current) return;

            const video = videoRef.current;
            if (video && video.readyState >= 2) {
                try {
                    const timestamp = video.currentTime * 1000;

                    // Only run detection if the video has actually progressed to a new frame
                    // MediaPipe requires strictly increasing timestamps in VIDEO mode.
                    if (timestamp > lastVideoTimeRef.current) {
                        lastVideoTimeRef.current = timestamp;
                        const results = landmarker.detectForVideo(video, timestamp);

                        ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);

                        if (results.landmarks && results.landmarks.length > 0) {
                            const landmarks = results.landmarks[0];
                            setStatus('ANALYZING');

                            for (const point of landmarks) {
                                ctx.fillStyle = "#22c55e";
                                ctx.beginPath();
                                ctx.arc(point.x * canvasRef.current!.width, point.y * canvasRef.current!.height, 2, 0, Math.PI * 2);
                                ctx.fill();
                            }

                            if (checkGestureHeuristic(landmarks, targetWord)) {
                                setStatus('MATCH');
                                setProgress(prev => {
                                    const next = prev + 12;
                                    if (next >= 100) {
                                        isProcessingRef.current = true;
                                        setTimeout(() => onGestureMatch(targetWord), 10);
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

    // Imported checkSign from lib
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
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-green-400 font-black text-6xl italic tracking-tighter drop-shadow-[0_0_15px_rgba(74,222,128,0.5)] animate-bounce">
                        Verifying
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
