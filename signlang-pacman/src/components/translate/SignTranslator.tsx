"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Square, Globe, ArrowRight, Loader2, Video, Languages } from 'lucide-react';

// Supported sign languages based on sign/translate project
const SIGN_LANGUAGES = [
    { code: 'ase', name: 'American Sign Language (ASL)', region: '🇺🇸' },
    { code: 'bfi', name: 'British Sign Language (BSL)', region: '🇬🇧' },
    { code: 'asf', name: 'Auslan (Australian)', region: '🇦🇺' },
    { code: 'gsg', name: 'Deutsche Gebärdensprache (DGS)', region: '🇩🇪' },
    { code: 'fsl', name: 'Langue des Signes Française (LSF)', region: '🇫🇷' },
    { code: 'bsl', name: 'LIBRAS (Brazilian)', region: '🇧🇷' },
    { code: 'isl', name: 'Indian Sign Language', region: '🇮🇳' },
    { code: 'jsl', name: 'Japanese Sign Language', region: '🇯🇵' },
];

interface RecordingState {
    isRecording: boolean;
    recordedBlob: Blob | null;
    recordedUrl: string | null;
}

export const SignTranslator: React.FC = () => {
    const [sourceLanguage, setSourceLanguage] = useState('ase');
    const [targetLanguage, setTargetLanguage] = useState('bfi');
    const [recordingState, setRecordingState] = useState<RecordingState>({
        isRecording: false,
        recordedBlob: null,
        recordedUrl: null,
    });
    const [isTranslating, setIsTranslating] = useState(false);
    const [translationResult, setTranslationResult] = useState<string | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    // Initialize camera
    const startCamera = useCallback(async () => {
        try {
            setCameraError(null);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
                audio: false
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            setCameraError('Unable to access camera. Please grant permission and try again.');
            console.error('Camera error:', err);
        }
    }, []);

    // Stop camera
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    // Start recording
    const startRecording = useCallback(() => {
        if (!streamRef.current) return;

        chunksRef.current = [];
        const mediaRecorder = new MediaRecorder(streamRef.current, {
            mimeType: 'video/webm;codecs=vp9'
        });

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                chunksRef.current.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            setRecordingState({
                isRecording: false,
                recordedBlob: blob,
                recordedUrl: url,
            });
        };

        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start(100);
        setRecordingState(prev => ({ ...prev, isRecording: true }));
    }, []);

    // Stop recording
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && recordingState.isRecording) {
            mediaRecorderRef.current.stop();
        }
    }, [recordingState.isRecording]);

    // Translate the recorded sign
    const translateSign = useCallback(async () => {
        if (!recordingState.recordedBlob) return;

        setIsTranslating(true);
        setTranslationResult(null);

        try {
            // Since sign/translate uses complex ML models, we'll provide
            // a placeholder showing the translation flow
            // In production, this would:
            // 1. Convert video to pose sequence using MediaPipe
            // 2. Pass to SignWriting translation model
            // 3. Lookup target sign language gesture

            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing

            const sourceLang = SIGN_LANGUAGES.find(l => l.code === sourceLanguage);
            const targetLang = SIGN_LANGUAGES.find(l => l.code === targetLanguage);

            setTranslationResult(
                `Translation from ${sourceLang?.name} to ${targetLang?.name} is ready. ` +
                `The sign/translate project uses pose estimation and SignWriting for accurate translation.`
            );
        } catch (error) {
            console.error('Translation error:', error);
            setTranslationResult('Translation failed. Please try again.');
        } finally {
            setIsTranslating(false);
        }
    }, [recordingState.recordedBlob, sourceLanguage, targetLanguage]);

    // Clear recording
    const clearRecording = useCallback(() => {
        if (recordingState.recordedUrl) {
            URL.revokeObjectURL(recordingState.recordedUrl);
        }
        setRecordingState({
            isRecording: false,
            recordedBlob: null,
            recordedUrl: null,
        });
        setTranslationResult(null);
    }, [recordingState.recordedUrl]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopCamera();
            if (recordingState.recordedUrl) {
                URL.revokeObjectURL(recordingState.recordedUrl);
            }
        };
    }, [stopCamera, recordingState.recordedUrl]);

    const sourceLang = SIGN_LANGUAGES.find(l => l.code === sourceLanguage);
    const targetLang = SIGN_LANGUAGES.find(l => l.code === targetLanguage);

    return (
        <div className="p-6 space-y-6">
            {/* Language Selection */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                <div className="flex-1 max-w-xs">
                    <label className="block text-sm font-bold text-slate-600 mb-2">
                        <Globe className="inline h-4 w-4 mr-1" />
                        Source Language
                    </label>
                    <select
                        value={sourceLanguage}
                        onChange={(e) => setSourceLanguage(e.target.value)}
                        className="w-full p-3 rounded-xl border-2 border-slate-200 bg-white font-medium text-slate-800 focus:border-blue-500 focus:outline-none transition-colors"
                    >
                        {SIGN_LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code}>
                                {lang.region} {lang.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                    <ArrowRight className="h-5 w-5" />
                </div>

                <div className="flex-1 max-w-xs">
                    <label className="block text-sm font-bold text-slate-600 mb-2">
                        <Languages className="inline h-4 w-4 mr-1" />
                        Target Language
                    </label>
                    <select
                        value={targetLanguage}
                        onChange={(e) => setTargetLanguage(e.target.value)}
                        className="w-full p-3 rounded-xl border-2 border-slate-200 bg-white font-medium text-slate-800 focus:border-blue-500 focus:outline-none transition-colors"
                    >
                        {SIGN_LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code}>
                                {lang.region} {lang.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Recording Area */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Camera/Recording Panel */}
                <Card className="overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b">
                        <CardTitle className="flex items-center gap-2">
                            <Video className="h-5 w-5 text-blue-600" />
                            Record Your Sign
                        </CardTitle>
                        <CardDescription>
                            Sign in {sourceLang?.name} ({sourceLang?.region})
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden relative mb-4">
                            {cameraError ? (
                                <div className="absolute inset-0 flex items-center justify-center text-white text-center p-4">
                                    <div>
                                        <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">{cameraError}</p>
                                    </div>
                                </div>
                            ) : recordingState.recordedUrl ? (
                                <video
                                    src={recordingState.recordedUrl}
                                    controls
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover scale-x-[-1]"
                                />
                            )}

                            {recordingState.isRecording && (
                                <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                                    <div className="w-2 h-2 bg-white rounded-full" />
                                    Recording
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2 justify-center">
                            {!streamRef.current && !recordingState.recordedUrl && (
                                <Button onClick={startCamera} className="gap-2">
                                    <Camera className="h-4 w-4" />
                                    Start Camera
                                </Button>
                            )}

                            {streamRef.current && !recordingState.isRecording && !recordingState.recordedUrl && (
                                <Button onClick={startRecording} className="gap-2 bg-red-600 hover:bg-red-700">
                                    <div className="w-3 h-3 bg-white rounded-full" />
                                    Start Recording
                                </Button>
                            )}

                            {recordingState.isRecording && (
                                <Button onClick={stopRecording} variant="destructive" className="gap-2">
                                    <Square className="h-4 w-4" />
                                    Stop Recording
                                </Button>
                            )}

                            {recordingState.recordedUrl && (
                                <>
                                    <Button onClick={clearRecording} variant="outline" className="gap-2">
                                        Re-record
                                    </Button>
                                    <Button
                                        onClick={translateSign}
                                        disabled={isTranslating}
                                        className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                                    >
                                        {isTranslating ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Translating...
                                            </>
                                        ) : (
                                            <>
                                                <Languages className="h-4 w-4" />
                                                Translate
                                            </>
                                        )}
                                    </Button>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Translation Result Panel */}
                <Card className="overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
                        <CardTitle className="flex items-center gap-2">
                            <Languages className="h-5 w-5 text-purple-600" />
                            Translation Result
                        </CardTitle>
                        <CardDescription>
                            Sign in {targetLang?.name} ({targetLang?.region})
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="aspect-video bg-slate-100 rounded-xl flex items-center justify-center">
                            {isTranslating ? (
                                <div className="text-center">
                                    <Loader2 className="h-12 w-12 mx-auto text-purple-600 animate-spin mb-4" />
                                    <p className="text-slate-600 font-medium">Analyzing sign language...</p>
                                    <p className="text-slate-400 text-sm mt-1">Using pose estimation & SignWriting</p>
                                </div>
                            ) : translationResult ? (
                                <div className="text-center p-6">
                                    <div className="text-5xl mb-4">{targetLang?.region}</div>
                                    <p className="text-slate-700 font-medium leading-relaxed">{translationResult}</p>
                                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                        <p className="text-blue-800 text-sm">
                                            <strong>Note:</strong> Full translation requires the sign/translate ML models.
                                            This demo shows the translation flow architecture.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-slate-400">
                                    <Languages className="h-16 w-16 mx-auto mb-4 opacity-30" />
                                    <p className="font-medium">Record a sign to see translation</p>
                                    <p className="text-sm mt-1">Powered by open-source sign/translate</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Info Banner */}
            <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl">
                <p className="text-amber-800 text-sm font-medium text-center">
                    🌍 <strong>Cross-Country Translation:</strong> This feature helps deaf travelers communicate
                    by translating between different sign languages using the open-source
                    <a href="https://github.com/sign/translate" target="_blank" rel="noopener noreferrer" className="underline ml-1 hover:text-amber-600">
                        sign/translate
                    </a> project.
                </p>
            </div>
        </div>
    );
};

export default SignTranslator;
