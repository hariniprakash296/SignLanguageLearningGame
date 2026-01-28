"use client";

import React, { useState, useRef } from 'react';
import { useYouTubeStore } from '@/store/youtubeSlice';
import { SignDisplay } from '@/components/shared/SignDisplay';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Youtube, Loader2, Play, Pause } from 'lucide-react';

export const VideoTranslator: React.FC = () => {
    const [url, setUrl] = useState('');
    const [currentWord, setCurrentWord] = useState('');
    const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const { setVideoUrl, setTranscript, setLoading, isLoading, error, setError, transcript } = useYouTubeStore();

    const handleSearch = async () => {
        if (!url) return;

        setLoading(true);
        setError(null);
        setVideoUrl(url);

        try {
            const response = await fetch('http://localhost:5000/api/youtube/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to extract transcript");
            }

            const data = await response.json();
            setTranscript(data.transcript);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'An error occurred';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const extractVideoId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const videoId = extractVideoId(url);

    const startSignAnimation = (word: string) => {
        const cleanWord = word.replace(/[^a-zA-Z]/g, '').toUpperCase();
        if (!cleanWord) return;

        setCurrentWord(cleanWord);
        setCurrentLetterIndex(0);
        setIsPlaying(true);

        if (intervalRef.current) clearInterval(intervalRef.current);

        let index = 0;
        intervalRef.current = setInterval(() => {
            setCurrentLetterIndex(index);
            index++;
            if (index >= cleanWord.length) {
                if (intervalRef.current) clearInterval(intervalRef.current);
                setIsPlaying(false);
            }
        }, 800);
    };

    const stopAnimation = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsPlaying(false);
    };

    return (
        <div className="flex flex-col h-full space-y-4 p-4">
            <div className="flex space-x-2">
                <div className="relative flex-1">
                    <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        placeholder="Paste YouTube URL (e.g., https://www.youtube.com/watch?v=...)"
                        className="pl-10"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                </div>
                <Button onClick={handleSearch} disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Search className="h-4 w-4 mr-2" />}
                    {isLoading ? 'Loading...' : 'Search'}
                </Button>
            </div>

            {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm">
                    ⚠️ {error}
                </div>
            )}

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
                {/* Side A: Youtube Video */}
                <div className="flex flex-col space-y-4">
                    <div className="aspect-video w-full bg-black rounded-lg overflow-hidden shadow-lg">
                        {videoId ? (
                            <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1`}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                <Youtube className="h-12 w-12 mb-2" />
                                <p>Enter a URL to load video</p>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 bg-gray-50 rounded-lg border p-4 overflow-hidden flex flex-col min-h-[200px]">
                        <h3 className="font-bold text-gray-700 mb-2 border-b pb-2">📝 Transcript</h3>
                        <div className="flex-1 overflow-y-auto space-y-2 text-sm pr-2">
                            {transcript.length > 0 ? transcript.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="p-2 hover:bg-white rounded cursor-pointer transition-colors border border-transparent hover:border-blue-200 hover:shadow-sm group"
                                    onClick={() => startSignAnimation(item.text)}
                                >
                                    <span className="text-blue-500 mr-2 font-mono text-xs">[{Math.floor(item.start)}s]</span>
                                    <span className="group-hover:text-blue-700">{item.text}</span>
                                    <span className="text-xs text-gray-400 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        Click to see signs →
                                    </span>
                                </div>
                            )) : (
                                <p className="text-gray-400 italic">No transcript loaded. Enter a YouTube URL above.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Side B: Sign Translation Panel */}
                <div className="bg-gradient-to-br from-white to-blue-50 rounded-lg border p-6 shadow-lg flex flex-col">
                    <div className="text-center space-y-4 flex-1 flex flex-col">
                        <h2 className="text-2xl font-bold text-blue-900 border-b pb-4">🤟 Sign Language Interpretation</h2>

                        <div className="flex-1 flex items-center justify-center">
                            {currentWord ? (
                                <div className="space-y-4">
                                    <SignDisplay
                                        sign={currentWord[currentLetterIndex] || currentWord[0]}
                                        size="lg"
                                        showDescription={true}
                                    />

                                    {/* Letter progress */}
                                    <div className="flex justify-center gap-2 flex-wrap">
                                        {currentWord.split('').map((letter, idx) => (
                                            <span
                                                key={idx}
                                                className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm transition-all ${idx === currentLetterIndex
                                                    ? 'bg-blue-600 text-white scale-110 shadow-lg'
                                                    : idx < currentLetterIndex
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-100 text-gray-400'
                                                    }`}
                                            >
                                                {letter}
                                            </span>
                                        ))}
                                    </div>

                                    <Button
                                        variant="outline"
                                        onClick={isPlaying ? stopAnimation : () => startSignAnimation(currentWord)}
                                        className="mt-2"
                                    >
                                        {isPlaying ? <><Pause className="h-4 w-4 mr-2" /> Pause</> : <><Play className="h-4 w-4 mr-2" /> Replay</>}
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-center text-gray-400 space-y-2">
                                    <div className="w-32 h-32 mx-auto rounded-full bg-gray-100 flex items-center justify-center border-4 border-dashed border-gray-200">
                                        <span className="text-4xl">🤟</span>
                                    </div>
                                    <p className="text-lg">Click a transcript line to see signs</p>
                                    <p className="text-xs">Each letter will be shown one by one</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-blue-50 p-4 rounded-xl text-left border border-blue-100">
                            <h4 className="font-bold text-blue-800 text-sm mb-1 uppercase tracking-wider">💡 Tip:</h4>
                            <p className="text-sm text-blue-700">
                                Click any line in the transcript to see each letter spelled out in ASL. Watch the sign for each letter!
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
