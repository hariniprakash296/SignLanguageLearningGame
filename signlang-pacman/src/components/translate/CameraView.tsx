import React, { useRef, useState, useEffect, useCallback } from 'react';
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { getHybridRecognizer } from '@/lib/gesture-recognition/hybrid-recognizer';

interface CameraViewProps {
    onCaptureComplete: (frames: string[], detectedSigns: string[]) => void;
    isProcessing: boolean;
}

const CameraView: React.FC<CameraViewProps> = ({ onCaptureComplete, isProcessing }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [landmarker, setLandmarker] = useState<HandLandmarker | null>(null);
    const [recognizedSigns, setRecognizedSigns] = useState<string[]>([]);

    // Refs for gesture recognition
    const hybridRecognizerRef = useRef(getHybridRecognizer());
    const isProcessingRef = useRef(false);
    const lastVideoTimeRef = useRef(-1);
    const detectedSignsRef = useRef<string[]>([]);

    // Initialize MediaPipe
    useEffect(() => {
        let handLandmarker: HandLandmarker;
        let stream: MediaStream | null = null;
        let isCancelled = false;

        const init = async () => {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
                );

                const createdLandmarker = await HandLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                        delegate: "GPU"
                    },
                    runningMode: "VIDEO",
                    numHands: 1
                });

                if (isCancelled) {
                    createdLandmarker.close();
                    return;
                }

                setLandmarker(createdLandmarker);

                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user', width: 320, height: 240 }
                });

                stream = mediaStream;
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (err) {
                console.error("Camera/MediaPipe init failed:", err);
            }
        };

        init();

        return () => {
            isCancelled = true;
            if (stream) stream.getTracks().forEach(track => track.stop());
            // handLandmarker?.close(); // Start fresh next time
        };
    }, []);

    // Continuous Detection Loop
    useEffect(() => {
        if (!landmarker || !videoRef.current || !canvasRef.current) return;

        let animationFrameId: number;
        const ctx = canvasRef.current.getContext('2d')!;

        const predict = () => {
            if (videoRef.current && videoRef.current.readyState >= 2) {
                const now = Date.now();
                if (now - lastVideoTimeRef.current >= 30) { // Limit to ~30fps
                    lastVideoTimeRef.current = now;
                    const results = landmarker.detectForVideo(videoRef.current, now);

                    // Clear canvas for drawing
                    ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);

                    if (results.landmarks && results.landmarks.length > 0) {
                        const landmarks = results.landmarks[0];

                        // Draw landmarks
                        for (const point of landmarks) {
                            ctx.fillStyle = "#22c55e"; // Green dots
                            ctx.beginPath();
                            ctx.arc(point.x * canvasRef.current!.width, point.y * canvasRef.current!.height, 2, 0, Math.PI * 2);
                            ctx.fill();
                        }

                        // Recognize gestures if recording
                        if (isRecording) {
                            const result = hybridRecognizerRef.current.processFrame(
                                landmarks as any, // Cast to match interface
                                now
                            );

                            if (result.recognizedSign) {
                                const currentSigns = detectedSignsRef.current;
                                // Add if unique or separated by time (logic handled in recognizer, but we double check uniqueness for API payload)
                                if (currentSigns[currentSigns.length - 1] !== result.recognizedSign) {
                                    detectedSignsRef.current.push(result.recognizedSign);
                                    setRecognizedSigns([...detectedSignsRef.current]);
                                }
                            }
                        }
                    }
                }
            }
            animationFrameId = requestAnimationFrame(predict);
        };

        predict();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [landmarker, isRecording]);

    const captureSequence = useCallback(async () => {
        setIsRecording(true);
        detectedSignsRef.current = []; // Reset signs for new recording
        setRecognizedSigns([]);
        hybridRecognizerRef.current.clearSequence();

        const frames: string[] = [];
        const captureCount = 34; // ~5.1s
        const interval = 150;

        for (let i = 0; i < captureCount; i++) {
            if (videoRef.current) {
                // Create a temporary canvas for frame capture to separate from overlay canvas
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = 320;
                tempCanvas.height = 240;
                const ctx = tempCanvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(videoRef.current, 0, 0, 320, 240);
                    frames.push(tempCanvas.toDataURL('image/jpeg', 0.5)); // Slightly higher quality for API
                }
            }
            await new Promise(r => setTimeout(r, interval));
        }

        setIsRecording(false);
        // Send both frames AND detected signs
        onCaptureComplete(frames, detectedSignsRef.current);
    }, [onCaptureComplete]);

    const handleStart = () => {
        let count = 3;
        setCountdown(count);
        const timer = setInterval(() => {
            count--;
            if (count === 0) {
                clearInterval(timer);
                setCountdown(null);
                captureSequence();
            } else {
                setCountdown(count);
            }
        }, 1000);
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Camera Container */}
            <div className="relative rounded-3xl overflow-hidden bg-slate-900 aspect-video shadow-2xl border-8 border-white group transition-all">
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                />
                {/* Canvas overlay for landmarks */}
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-60"
                    width="320"
                    height="240"
                />

                {/* Overlay UI - Status indicators only */}
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
                    <div className="flex justify-between items-start">
                        <div className="bg-slate-900/80 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/20 text-[10px] font-black tracking-widest text-white flex items-center gap-3">
                            <div className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`} />
                            {isRecording ? 'RECORDING SEQUENCE (5s)' : 'READY FOR INPUT'}
                        </div>
                        {isProcessing && (
                            <div className="bg-indigo-600 px-5 py-2 rounded-2xl text-white text-xs font-black shadow-2xl animate-bounce tracking-tight">
                                NEURAL ANALYSIS IN PROGRESS...
                            </div>
                        )}
                    </div>

                    {/* Countdown in center */}
                    <div className="flex justify-center items-center flex-1">
                        {countdown !== null && (
                            <div className="text-[12rem] font-black text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] animate-pulse">
                                {countdown}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Button BELOW the camera - not covering face */}
            <div className="flex justify-center">
                <button
                    onClick={handleStart}
                    disabled={isRecording || isProcessing || countdown !== null}
                    className={`
                        px-10 py-5 rounded-[2rem] font-black text-xl shadow-2xl transition-all active:scale-95 border-b-4
                        ${(isRecording || isProcessing || countdown !== null)
                            ? 'bg-slate-800 text-slate-500 border-slate-900 cursor-not-allowed translate-y-1'
                            : 'bg-white text-slate-900 border-slate-200 hover:bg-indigo-50 hover:border-indigo-100 hover:-translate-y-1 hover:shadow-indigo-500/20'}
                    `}
                >
                    {isRecording ? 'SIGN NOW...' : isProcessing ? 'THINKING...' : 'Record Sentence'}
                </button>
            </div>
        </div>
    );
};

export default CameraView;
