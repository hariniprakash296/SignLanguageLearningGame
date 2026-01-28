import { create } from 'zustand';

interface TranscriptItem {
    text: string;
    start: number;
    duration: number;
}

interface YouTubeState {
    videoUrl: string;
    transcript: TranscriptItem[];
    isLoading: boolean;
    error: string | null;
    currentTime: number;

    setVideoUrl: (url: string) => void;
    setTranscript: (transcript: TranscriptItem[]) => void;
    setLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;
    setCurrentTime: (time: number) => void;
}

export const useYouTubeStore = create<YouTubeState>((set) => ({
    videoUrl: '',
    transcript: [],
    isLoading: false,
    error: null,
    currentTime: 0,

    setVideoUrl: (url) => set({ videoUrl: url }),
    setTranscript: (transcript) => set({ transcript }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    setCurrentTime: (time) => set({ currentTime: time }),
}));
