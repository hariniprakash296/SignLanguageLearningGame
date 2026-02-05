
import React, { useRef, useState, useEffect, useCallback } from 'react';

interface CameraViewProps {
    onCaptureComplete: (frames: string[]) => void;
    isProcessing: boolean;
}

const CameraView: React.FC<CameraViewProps> = ({ onCaptureComplete, isProcessing }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);

    useEffect(() => {
        async function setupCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user', width: 640, height: 480 }
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Camera access denied:", err);
            }
        }
        setupCamera();
    }, []);

    const captureSequence = useCallback(async () => {
        setIsRecording(true);
        const frames: string[] = [];
        // Increased capture count for longer sentences
        const captureCount = 20;
        const interval = 250; // 250ms interval = 5 seconds total capture

        for (let i = 0; i < captureCount; i++) {
            if (videoRef.current && canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                    ctx.drawImage(videoRef.current, 0, 0, 640, 480);
                    frames.push(canvasRef.current.toDataURL('image/jpeg', 0.4)); // Slightly lower quality to handle more frames
                }
            }
            await new Promise(r => setTimeout(r, interval));
        }

        setIsRecording(false);
        onCaptureComplete(frames);
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
        <div className="relative rounded-3xl overflow-hidden bg-slate-900 aspect-video shadow-2xl border-8 border-white group transition-all">
            <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" width="640" height="480" />

            {/* Overlay UI */}
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8">
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

                <div className="flex justify-center items-center h-full">
                    {countdown !== null && (
                        <div className="text-[12rem] font-black text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] animate-pulse">
                            {countdown}
                        </div>
                    )}
                </div>

                <div className="flex justify-center pointer-events-auto">
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
        </div>
    );
};

export default CameraView;
