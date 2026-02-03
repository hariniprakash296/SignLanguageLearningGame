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
    // Level 1 progression tracking
    wordsCompleted: number;
    masteredLetters: string[];
    level2Unlocked: boolean;
    // Training vs Final Test Mode
    showAssistance: boolean;

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
    // New actions
    completeWord: (word: string) => void;
    setShowAssistance: (show: boolean) => void;
    unlockLevel2: () => void;
}

export const useGameStore = create<GameState>()(
    persist(
        (set, get) => ({
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
            // Level 1 progression
            wordsCompleted: 0,
            masteredLetters: [],
            level2Unlocked: false,
            showAssistance: true,

            setScore: (score) => set({ score }),
            incrementScore: (amount) => set((state) => ({ score: state.score + amount })),
            setLevel: (level) => set({ level, score: 0 }), // Reset score on level change
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
                verificationMode: 'teaching', // Always start with teaching single letters
                showAssistance: true // Start with assistance in teaching mode
            }),
            setCurrentLetterIndex: (index) => set({ currentLetterIndex: index }),
            setVerificationMode: (mode) => set({
                verificationMode: mode,
                showAssistance: mode === 'teaching' // Hide assistance in final test mode
            }),
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
                lastActionWasCancel: false,
                wordsCompleted: 0,
                masteredLetters: [],
                level2Unlocked: false,
                showAssistance: true
            }),
            setLastActionWasCancel: (cancelled) => set({ lastActionWasCancel: cancelled }),

            // Complete a word and track progress
            completeWord: (word: string) => {
                const state = get();
                const newLetters = word.toUpperCase().split('');
                const uniqueNewLetters = [...new Set([...state.masteredLetters, ...newLetters])];
                const newWordsCompleted = state.wordsCompleted + 1;

                // Check Level 2 unlock: 4 words AND 20+ unique letters mastered
                const shouldUnlock = newWordsCompleted >= 4 && uniqueNewLetters.length >= 20;

                set({
                    wordsCompleted: newWordsCompleted,
                    masteredLetters: uniqueNewLetters,
                    level2Unlocked: shouldUnlock
                });
            },

            setShowAssistance: (show) => set({ showAssistance: show }),

            unlockLevel2: () => set({ level2Unlocked: true, level: 2, score: 0 }),
        }),
        {
            name: 'pacman-game-storage',
            // Only persist level progression, NOT score
            partialize: (state) => ({
                level: state.level,
                collectedSigns: state.collectedSigns,
                wordsCompleted: state.wordsCompleted,
                masteredLetters: state.masteredLetters,
                level2Unlocked: state.level2Unlocked
            }),
        }
    )
);
