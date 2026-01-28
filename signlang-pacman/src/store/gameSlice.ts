import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GameState {
    score: number;
    level: number;
    position: { x: number; y: number };
    collectedSigns: string[];
    isGameOver: boolean;
    isPaused: boolean;
    isWaitingForSign: boolean;
    targetWord: string | null;
    currentLetterIndex: number;
    verificationMode: 'teaching' | 'whole_word';

    setScore: (score: number) => void;
    incrementScore: (amount: number) => void;
    setLevel: (level: number) => void;
    setPosition: (position: { x: number; y: number }) => void;
    addCollectedSign: (sign: string) => void;
    setGameOver: (isGameOver: boolean) => void;
    setPaused: (isPaused: boolean) => void;
    setIsWaitingForSign: (isWaiting: boolean, word?: string | null) => void;
    setCurrentLetterIndex: (index: number) => void;
    setVerificationMode: (mode: 'teaching' | 'whole_word') => void;
    resetGame: () => void;
    lastActionWasCancel: boolean;
    setLastActionWasCancel: (cancelled: boolean) => void;
}

export const useGameStore = create<GameState>()(
    persist(
        (set) => ({
            score: 0,
            level: 1,
            position: { x: 1, y: 1 }, // Grid coordinates
            collectedSigns: [],
            isGameOver: false,
            isPaused: true,
            isWaitingForSign: false,
            targetWord: null,
            currentLetterIndex: 0,
            verificationMode: 'teaching',
            lastActionWasCancel: false,

            setScore: (score) => set({ score }),
            incrementScore: (amount) => set((state) => ({ score: state.score + amount })),
            setLevel: (level) => set({ level }),
            setPosition: (position) => set({ position }),
            addCollectedSign: (sign) => set((state) => ({
                collectedSigns: [...state.collectedSigns, sign]
            })),
            setGameOver: (isGameOver) => set({ isGameOver }),
            setPaused: (isPaused) => set({ isPaused }),
            setIsWaitingForSign: (isWaiting, word = null) => set({
                isWaitingForSign: isWaiting,
                targetWord: word,
                currentLetterIndex: 0,
                verificationMode: 'teaching' // Always start with teaching single letters
            }),
            setCurrentLetterIndex: (index) => set({ currentLetterIndex: index }),
            setVerificationMode: (mode) => set({ verificationMode: mode }),
            resetGame: () => set({
                score: 0,
                level: 1,
                position: { x: 1, y: 1 },
                collectedSigns: [],
                isGameOver: false,
                isPaused: true,
                isWaitingForSign: false,
                targetWord: null,
                currentLetterIndex: 0,
                verificationMode: 'teaching',
                lastActionWasCancel: false
            }),
            setLastActionWasCancel: (cancelled) => set({ lastActionWasCancel: cancelled }),
        }),
        {
            name: 'pacman-game-storage',
            partialize: (state) => ({ score: state.score, level: state.level, collectedSigns: state.collectedSigns }),
        }
    )
);
