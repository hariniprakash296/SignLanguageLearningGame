"use client";

/**
 * =============================================================================
 * Sign Translator Component
 * =============================================================================
 * 
 * Real-time sign language translation using:
 * - Gesture Recognition Engine (movement + handshape detection)
 * - AI Interpreter Agent (Gemini-powered translation)
 * - Cross-language sign translation
 * 
 * FEATURES:
 * - Auto-starts camera on mount
 * - Real-time mode for continuous detection
 * - Initialized sign recognition (not just letters)
 * - AI-powered translation between sign languages
 * 
 * =============================================================================
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Camera, Globe, ArrowRight, Loader2, Video, Languages,
    Zap, Circle, RefreshCw, AlertCircle, Sparkles
} from 'lucide-react';
import { GestureRecognitionEngine, type GestureRecognitionResult } from '@/lib/gesture-recognition';
import { FilesetResolver, HandLandmarker, type NormalizedLandmark } from '@mediapipe/tasks-vision';
import { checkSign } from '@/lib/sign-definitions';

// Letters to check for detection
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// Detect which letter the hand is signing
function detectLetter(landmarks: NormalizedLandmark[]): { letter: string | null; confidence: number } {
    for (const letter of LETTERS) {
        if (checkSign(landmarks as { x: number; y: number; z: number }[], letter)) {
            return { letter, confidence: 0.85 };
        }
    }
    return { letter: null, confidence: 0 };
}

// Supported sign languages
const SIGN_LANGUAGES = [
    { code: 'ase', name: 'American Sign Language (ASL)', region: '🇺🇸' },
    { code: 'bfi', name: 'British Sign Language (BSL)', region: '🇬🇧' },
    { code: 'asf', name: 'Auslan (Australian)', region: '🇦🇺' },
    { code: 'gsg', name: 'Deutsche Gebärdensprache (DGS)', region: '🇩🇪' },
    { code: 'fsl', name: 'Langue des Signes Française (LSF)', region: '🇫🇷' },
    { code: 'bsl', name: 'LIBRAS (Brazilian)', region: '🇧🇷' },
    { code: 'isl', name: 'Indian Sign Language', region: '🇮🇳' },
    { code: 'jsl', name: 'Japanese Sign Language', region: '🇯🇵' },
    { code: 'sgsl', name: 'Singapore Sign Language (SGSL)', region: '🇸🇬' },
];

interface TranslationState {
    isTranslating: boolean;
    result: {
        recognizedWord: string;
        meaning: string;
        confidence: number;
        isInitialized: boolean;
        family?: string;
        translation: {
            targetWord: string;
            handshape: string;
            movement: string;
            culturalNotes?: string;
        };
    } | null;
    error: string | null;
}

export const SignTranslator: React.FC = () => {
    const [sourceLanguage, setSourceLanguage] = useState('ase');
    const [targetLanguage, setTargetLanguage] = useState('bfi');
    const [isRealTimeMode, setIsRealTimeMode] = useState(true);
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [currentDetection, setCurrentDetection] = useState<GestureRecognitionResult | null>(null);
    const [signHistory, setSignHistory] = useState<string[]>([]);
    const [translation, setTranslation] = useState<TranslationState>({
        isTranslating: false,
        result: null,
        error: null,
    });

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);  // For frame capture
    const streamRef = useRef<MediaStream | null>(null);
    const handLandmarkerRef = useRef<HandLandmarker | null>(null);
    const gestureEngineRef = useRef<GestureRecognitionEngine | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const lastTranslationTimeRef = useRef<number>(0);
    const [isRateLimited, setIsRateLimited] = useState(false);

    // Initialize gesture engine
    useEffect(() => {
        gestureEngineRef.current = new GestureRecognitionEngine();
        // Create capture canvas for frame extraction
        captureCanvasRef.current = document.createElement('canvas');
        return () => {
            gestureEngineRef.current?.reset();
        };
    }, []);

    // Capture video frame as base64
    const captureFrame = useCallback((): string | null => {
        const video = videoRef.current;
        const canvas = captureCanvasRef.current;
        if (!video || !canvas) return null;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0);

        // Convert to base64 JPEG (smaller than PNG)
        return canvas.toDataURL('image/jpeg', 0.7);
    }, []);

    // Initialize MediaPipe Hand Landmarker
    const initializeHandLandmarker = useCallback(async () => {
        try {
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            );
            const handLandmarker = await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                    delegate: "GPU"
                },
                numHands: 2,
                runningMode: "VIDEO"
            });
            handLandmarkerRef.current = handLandmarker;
            return true;
        } catch (error) {
            console.error('Failed to initialize hand landmarker:', error);
            setCameraError('Failed to load hand tracking. Please refresh the page.');
            return false;
        }
    }, []);

    // Start camera
    const startCamera = useCallback(async () => {
        try {
            setCameraError(null);

            // Initialize hand landmarker first
            if (!handLandmarkerRef.current) {
                const success = await initializeHandLandmarker();
                if (!success) return;
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
                audio: false
            });
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }

            setCameraActive(true);

            // Start detection loop
            startDetectionLoop();
        } catch (err) {
            setCameraError('Unable to access camera. Please grant permission.');
            console.error('Camera error:', err);
        }
    }, [initializeHandLandmarker]);

    // Stop camera
    const stopCamera = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setCameraActive(false);
    }, []);

    // Detection loop
    const startDetectionLoop = useCallback(() => {
        const detect = async () => {
            if (!videoRef.current || !handLandmarkerRef.current || !gestureEngineRef.current) {
                animationFrameRef.current = requestAnimationFrame(detect);
                return;
            }

            if (videoRef.current.readyState < 2) {
                animationFrameRef.current = requestAnimationFrame(detect);
                return;
            }

            try {
                const startTime = performance.now();
                const results = handLandmarkerRef.current.detectForVideo(
                    videoRef.current,
                    startTime
                );

                if (results.landmarks && results.landmarks.length > 0) {
                    const landmarks = results.landmarks[0] as NormalizedLandmark[];

                    // Detect letter using existing sign-definitions
                    const { letter, confidence } = detectLetter(landmarks);

                    // Add frame to gesture engine
                    gestureEngineRef.current.addFrame(
                        landmarks.map(l => ({ x: l.x, y: l.y, z: l.z })),
                        letter || null,
                        confidence
                    );

                    // Get recognition result
                    const result = gestureEngineRef.current.recognize();
                    setCurrentDetection(result);

                    // Draw landmarks on canvas
                    drawLandmarks(landmarks);

                    // Trigger translation if in real-time mode and we have a STRONG detection
                    // STRICTER: Require 0.8+ confidence (was 0.6)
                    if (isRealTimeMode && result.initializedSign && result.initializedSign.confidence > 0.8) {
                        const now = Date.now();
                        if (now - lastTranslationTimeRef.current > 5000) { // Rate limit translations (match backend)
                            lastTranslationTimeRef.current = now;
                            translateDetection(result);
                        }
                    }
                } else {
                    // Clear canvas when no hand detected
                    const canvas = canvasRef.current;
                    const ctx = canvas?.getContext('2d');
                    if (ctx && canvas) {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                    }
                }
            } catch (error) {
                console.error('Detection error:', error);
            }

            animationFrameRef.current = requestAnimationFrame(detect);
        };

        animationFrameRef.current = requestAnimationFrame(detect);
    }, [isRealTimeMode]);

    // Draw hand landmarks on canvas
    const drawLandmarks = useCallback((landmarks: NormalizedLandmark[]) => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw connections
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4],     // Thumb
            [0, 5], [5, 6], [6, 7], [7, 8],     // Index
            [5, 9], [9, 10], [10, 11], [11, 12], // Middle
            [9, 13], [13, 14], [14, 15], [15, 16], // Ring
            [13, 17], [17, 18], [18, 19], [19, 20], // Pinky
            [0, 17]                               // Palm base
        ];

        ctx.strokeStyle = 'rgba(59, 130, 246, 0.7)';
        ctx.lineWidth = 3;
        for (const [start, end] of connections) {
            const startPoint = landmarks[start];
            const endPoint = landmarks[end];
            ctx.beginPath();
            ctx.moveTo((1 - startPoint.x) * canvas.width, startPoint.y * canvas.height);
            ctx.lineTo((1 - endPoint.x) * canvas.width, endPoint.y * canvas.height);
            ctx.stroke();
        }

        // Draw landmarks
        for (const landmark of landmarks) {
            ctx.beginPath();
            ctx.arc((1 - landmark.x) * canvas.width, landmark.y * canvas.height, 5, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(147, 51, 234, 0.9)';
            ctx.fill();
        }
    }, []);

    // Translate detection using AI Vision interpreter
    const translateDetection = useCallback(async (detection: GestureRecognitionResult) => {
        setTranslation(prev => ({ ...prev, isTranslating: true, error: null }));
        setIsRateLimited(false);

        try {
            // Capture current video frame
            const imageBase64 = captureFrame();

            const response = await fetch('/api/agents/interpreter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    // NEW: Send image frame for Vision recognition
                    imageBase64: imageBase64,
                    // Fallback: Also send landmark-based detection
                    detectedSign: detection.letter ? {
                        letter: detection.letter,
                        letterConfidence: detection.letterConfidence,
                        movement: detection.movement,
                    } : undefined,
                    previousSigns: signHistory,
                    sourceLanguage: SIGN_LANGUAGES.find(l => l.code === sourceLanguage)?.name || 'ASL',
                    targetLanguage: SIGN_LANGUAGES.find(l => l.code === targetLanguage)?.name || 'BSL',
                }),
            });

            const result = await response.json();

            // Check for rate limiting
            if (result.metadata?.rateLimited || result.retryAfterMs) {
                setIsRateLimited(true);
                setTranslation({
                    isTranslating: false,
                    result: null,
                    error: `Rate limited. Please wait ${Math.ceil((result.retryAfterMs || 2000) / 1000)}s`,
                });
                return;
            }

            if (!response.ok) {
                throw new Error(result.error || 'Translation API error');
            }

            // Parse new Vision API response format
            setTranslation({
                isTranslating: false,
                result: {
                    recognizedWord: result.interpretation?.recognizedSign || detection.letter || 'NO_SIGN',
                    meaning: result.interpretation?.meaning || '',
                    confidence: result.interpretation?.confidence || 0.5,
                    isInitialized: result.interpretation?.isWord || false,
                    family: undefined,
                    translation: {
                        targetWord: result.translation?.targetSign || 'Unknown',
                        handshape: result.translation?.handshape || 'Unknown',
                        movement: result.translation?.movement || 'Hold steady',
                        culturalNotes: result.translation?.culturalNotes,
                    },
                },
                error: null,
            });

            // Add valid sign to history (max 5)
            const recognizedSign = result.interpretation?.recognizedSign;
            if (recognizedSign && recognizedSign !== 'NO_SIGN') {
                setSignHistory(prev => {
                    const newHistory = [...prev, recognizedSign];
                    return newHistory.slice(-5);
                });
            }
        } catch (error) {
            console.error('Translation error:', error);
            setTranslation({
                isTranslating: false,
                result: detection.initializedSign ? {
                    recognizedWord: detection.initializedSign.word,
                    meaning: `Initialized sign using ${detection.letter}`,
                    confidence: detection.initializedSign.confidence,
                    isInitialized: true,
                    family: detection.initializedSign.family.name,
                    translation: {
                        targetWord: detection.initializedSign.word,
                        handshape: `${detection.letter} handshape`,
                        movement: `${detection.movement.type} motion`,
                    },
                } : null,
                error: 'Translation unavailable - showing offline results',
            });
        }
    }, [sourceLanguage, targetLanguage]);

    // Manual translate button
    const handleManualTranslate = useCallback(() => {
        if (currentDetection) {
            translateDetection(currentDetection);
        }
    }, [currentDetection, translateDetection]);

    // Auto-start camera on mount
    useEffect(() => {
        // Small delay to ensure component is mounted
        const timer = setTimeout(() => {
            startCamera();
        }, 500);

        return () => {
            clearTimeout(timer);
            stopCamera();
        };
    }, []);

    const sourceLang = SIGN_LANGUAGES.find(l => l.code === sourceLanguage);
    const targetLang = SIGN_LANGUAGES.find(l => l.code === targetLanguage);

    return (
        <div className="p-6 space-y-6">
            {/* Mode Toggle & Language Selection */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Real-time Mode Toggle */}
                <div className="flex items-center gap-3">
                    <Button
                        variant={isRealTimeMode ? "default" : "outline"}
                        onClick={() => setIsRealTimeMode(true)}
                        className="gap-2"
                    >
                        <Zap className="h-4 w-4" />
                        Real-time
                    </Button>
                    <Button
                        variant={!isRealTimeMode ? "default" : "outline"}
                        onClick={() => setIsRealTimeMode(false)}
                        className="gap-2"
                    >
                        <Circle className="h-4 w-4" />
                        Manual
                    </Button>
                </div>

                {/* Language Selection */}
                <div className="flex items-center gap-3">
                    <select
                        value={sourceLanguage}
                        onChange={(e) => setSourceLanguage(e.target.value)}
                        className="p-2 rounded-lg border-2 border-slate-200 bg-white font-medium text-sm"
                    >
                        {SIGN_LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code}>
                                {lang.region} {lang.name.split(' ')[0]}
                            </option>
                        ))}
                    </select>

                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                        <ArrowRight className="h-4 w-4" />
                    </div>

                    <select
                        value={targetLanguage}
                        onChange={(e) => setTargetLanguage(e.target.value)}
                        className="p-2 rounded-lg border-2 border-slate-200 bg-white font-medium text-sm"
                    >
                        {SIGN_LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code}>
                                {lang.region} {lang.name.split(' ')[0]}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Camera Panel */}
                <Card className="overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b py-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Video className="h-5 w-5 text-blue-600" />
                            Camera - {sourceLang?.name}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden relative mb-4">
                            {cameraError ? (
                                <div className="absolute inset-0 flex items-center justify-center text-white text-center p-4">
                                    <div>
                                        <AlertCircle className="h-12 w-12 mx-auto mb-2 text-red-400" />
                                        <p className="text-sm">{cameraError}</p>
                                        <Button
                                            onClick={startCamera}
                                            variant="outline"
                                            className="mt-3"
                                        >
                                            Retry
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="w-full h-full object-cover scale-x-[-1]"
                                    />
                                    <canvas
                                        ref={canvasRef}
                                        className="absolute inset-0 w-full h-full scale-x-[-1]"
                                    />
                                </>
                            )}

                            {/* Detection Overlay */}
                            {currentDetection && currentDetection.letter && (
                                <div className="absolute bottom-4 left-4 right-4 bg-black/70 rounded-lg p-3 text-white">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-3xl font-black">
                                                {currentDetection.initializedSign?.word || currentDetection.letter}
                                            </span>
                                            {currentDetection.initializedSign && (
                                                <span className="ml-2 text-sm text-green-400">
                                                    ✓ Initialized Sign
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-right text-xs">
                                            <div>Movement: <span className="text-blue-400">
                                                {currentDetection.movement.type}
                                            </span></div>
                                            <div>Confidence: <span className="text-green-400">
                                                {(currentDetection.letterConfidence * 100).toFixed(0)}%
                                            </span></div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Real-time indicator */}
                            {isRealTimeMode && cameraActive && (
                                <div className="absolute top-4 right-4 flex items-center gap-2 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                    LIVE
                                </div>
                            )}
                        </div>

                        {/* Control Buttons */}
                        <div className="flex gap-2 justify-center">
                            {!cameraActive ? (
                                <Button onClick={startCamera} className="gap-2">
                                    <Camera className="h-4 w-4" />
                                    Start Camera
                                </Button>
                            ) : (
                                <>
                                    <Button onClick={stopCamera} variant="outline" className="gap-2">
                                        <RefreshCw className="h-4 w-4" />
                                        Restart
                                    </Button>

                                    {!isRealTimeMode && (
                                        <Button
                                            onClick={handleManualTranslate}
                                            disabled={!currentDetection?.letter || translation.isTranslating}
                                            className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600"
                                        >
                                            {translation.isTranslating ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Languages className="h-4 w-4" />
                                            )}
                                            Translate Now
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Translation Result Panel */}
                <Card className="overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b py-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Sparkles className="h-5 w-5 text-purple-600" />
                            Translation - {targetLang?.name}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="aspect-video bg-slate-50 rounded-xl flex items-center justify-center p-4">
                            {translation.isTranslating ? (
                                <div className="text-center">
                                    <Loader2 className="h-12 w-12 mx-auto text-purple-600 animate-spin mb-4" />
                                    <p className="text-slate-600 font-medium">Translating with AI...</p>
                                    <p className="text-slate-400 text-sm mt-1">Powered by Gemini</p>
                                </div>
                            ) : translation.result ? (
                                <div className="text-center w-full">
                                    <div className="text-5xl mb-4">{targetLang?.region}</div>
                                    <div className="text-3xl font-black text-purple-800 mb-2">
                                        {translation.result.translation.targetWord}
                                    </div>

                                    {translation.result.isInitialized && (
                                        <div className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-3">
                                            ✨ Initialized Sign
                                            {translation.result.family && ` • ${translation.result.family}`}
                                        </div>
                                    )}

                                    <div className="bg-white rounded-lg p-4 mt-4 text-left border">
                                        <div className="grid gap-2 text-sm">
                                            <div>
                                                <span className="text-slate-500">Recognized:</span>
                                                <span className="ml-2 font-medium">{translation.result.recognizedWord}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500">Handshape:</span>
                                                <span className="ml-2 font-medium">{translation.result.translation.handshape}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500">Movement:</span>
                                                <span className="ml-2 font-medium">{translation.result.translation.movement}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500">Confidence:</span>
                                                <span className="ml-2 font-medium text-green-600">
                                                    {(translation.result.confidence * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {translation.error && (
                                        <div className="mt-3 p-2 bg-amber-50 rounded-lg border border-amber-200">
                                            <p className="text-amber-700 text-xs">{translation.error}</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center text-slate-400">
                                    <Languages className="h-16 w-16 mx-auto mb-4 opacity-30" />
                                    <p className="font-medium">
                                        {isRealTimeMode
                                            ? 'Sign to see real-time translation'
                                            : 'Make a sign and click Translate'}
                                    </p>
                                    <p className="text-sm mt-1">
                                        Movement + handshape = initialized sign
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Context History Banner */}
            {signHistory.length > 0 && (
                <div className="p-4 bg-slate-100 rounded-xl border border-slate-200">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">Conversation Context</p>
                    <div className="flex flex-wrap gap-2">
                        {signHistory.map((word, i) => (
                            <div key={i} className="px-3 py-1 bg-white rounded-full text-sm font-medium shadow-sm border text-slate-700">
                                {word}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {/* Info Banner */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl">
                <p className="text-blue-800 text-sm font-medium text-center">
                    🎯 <strong>Initialized Signs:</strong> This translator recognizes movement patterns + handshapes
                    to detect words like FAMILY (F + arc) or MONDAY (M + circle), not just fingerspelled letters.
                </p>
            </div>
        </div>
    );
};

export default SignTranslator;
