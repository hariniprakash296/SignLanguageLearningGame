/**
 * =============================================================================
 * FILE: gameSlice.ts
 * =============================================================================
 * 
 * C4 MODEL CONTEXT:
 * - Container: Frontend (Next.js/React Application)
 * - Component: GameStore (Zustand State Management)
 * - Responsibility: Centralized game state, score, level progression, persistence
 * 
 * DATA FLOW:
 * 1. Components call actions (e.g., incrementScore(10))
 * 2. Zustand updates state immutably
 * 3. Subscribed components re-render automatically
 * 4. Selected state persists to localStorage via persist middleware
 * 
 * DEPENDENCIES:
 * - Used by: All components that need game state
 * - Uses: Zustand for state management, localStorage for persistence
 * 
 * KEY CONCEPTS:
 * - Zustand store: Simpler than Redux, no boilerplate
 * - Persistence: Game progress survives page refresh
 * - Immutable updates: Each action creates new state object
 * 
 * =============================================================================
 */

import { create } from 'zustand';       // * Core Zustand state management
import { persist } from 'zustand/middleware';  // * Persistence to localStorage

/**
 * * GameState Interface
 * 
 * Defines all game state properties and actions.
 * This is the "shape" of our global game state.
 * 
 * STATE PROPERTIES:
 * - Core game (score, level, position)
 * - Sign learning (targetWord, currentLetterIndex)
 * - Progression (wordsCompleted, masteredLetters, level2Unlocked)
 * 
 * ACTIONS:
 * - Setters for each property
 * - Special actions like completeWord() with business logic
 */
interface GameState {
    // =========================================================================
    // CORE GAME STATE
    // =========================================================================

    score: number;                          // * Current score (resets on level change)
    level: number;                          // * Current level (1 = Letters, 2 = Words)
    position: { x: number; y: number };     // * Pacman grid position (legacy, may not be used)
    collectedSigns: string[];               // * List of signs learned this session
    isGameOver: boolean;                    // * true = game ended
    isPaused: boolean;                      // * true = game loop stopped

    // =========================================================================
    // SIGN LEARNING STATE
    // =========================================================================

    isWaitingForSign: boolean;              // * true = sign overlay is shown
    targetWord: string | null;              // * Current word being practiced (e.g., "HELLO")
    currentLetterIndex: number;             // * Which letter in targetWord (0-indexed)
    verificationMode: 'teaching' | 'whole_word';  // * teaching = show hints, whole_word = no hints
    showAssistance: boolean;                // * true = show visual hints for signs

    // =========================================================================
    // LEVEL PROGRESSION STATE
    // =========================================================================

    wordsCompleted: number;                 // * Total words completed in Level 1
    masteredLetters: string[];              // * Unique letters practiced (e.g., ['H','E','L','O'])
    level2Unlocked: boolean;                // * true = user can access Level 2

    // =========================================================================
    // UI STATE
    // =========================================================================

    lastActionWasCancel: boolean;           // * true = user closed overlay (skip pellet)

    // =========================================================================
    // ACTIONS (State Modifiers)
    // =========================================================================

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
    setLastActionWasCancel: (cancelled: boolean) => void;
    completeWord: (word: string) => void;
    setShowAssistance: (show: boolean) => void;
    unlockLevel2: () => void;
}

/**
 * * useGameStore - Main Zustand Store
 * 
 * Creates the global game state store with:
 * - Initial state values
 * - Action implementations
 * - Persistence configuration
 * 
 * USAGE:
 * ```tsx
 * // In a React component
 * const { score, incrementScore } = useGameStore();
 * 
 * // Get state outside React
 * const { score } = useGameStore.getState();
 * ```
 */
export const useGameStore = create<GameState>()(
    // * persist() middleware wraps the store for localStorage persistence
    persist(
        // * Store creator function receives set() and get() helpers
        (set, get) => ({
            // =================================================================
            // INITIAL STATE VALUES
            // =================================================================

            score: 0,                       // * Start with 0 points
            level: 1,                       // * Start at Level 1 (Letters)
            position: { x: 1, y: 1 },       // * Initial grid position
            collectedSigns: [],             // * No signs collected yet
            isGameOver: false,              // * Game is active
            isPaused: true,                 // * Start paused until user presses arrow
            isWaitingForSign: false,        // * No sign overlay shown
            targetWord: null,               // * No word being practiced
            currentLetterIndex: 0,          // * Start at first letter
            verificationMode: 'teaching',   // * Show hints by default
            lastActionWasCancel: false,     // * No cancel action pending
            wordsCompleted: 0,              // * No words completed yet
            masteredLetters: [],            // * No letters mastered yet
            level2Unlocked: false,          // * Level 2 locked initially
            showAssistance: true,           // * Show visual hints

            // =================================================================
            // SIMPLE SETTER ACTIONS
            // =================================================================

            /**
             * * Set score to a specific value
             * @param score - New score value
             */
            setScore: (score) => set({ score }),

            /**
             * * Increment score by an amount
             * Uses functional update to ensure correct value
             * @param amount - Points to add
             */
            incrementScore: (amount) => set((state) => ({
                score: state.score + amount
            })),

            /**
             * * Change current level
             * ! Resets score to 0 when level changes
             * @param level - New level number
             */
            setLevel: (level) => set({ level, score: 0 }),

            /**
             * * Update Pacman position (legacy)
             */
            setPosition: (position) => set({ position }),

            /**
             * * Add a sign to collected list
             * Uses spread to maintain immutability
             */
            addCollectedSign: (sign) => set((state) => ({
                collectedSigns: [...state.collectedSigns, sign]
            })),

            /**
             * * Set game over state
             */
            setGameOver: (isGameOver) => set({ isGameOver }),

            /**
             * * Pause or unpause game
             */
            setPaused: (isPaused) => set({ isPaused }),

            /**
             * * Open/close sign practice overlay
             * 
             * When opening (isWaiting = true):
             * - Sets the target word
             * - Resets to first letter
             * - Enables teaching mode with hints
             * 
             * @param isWaiting - true to show overlay, false to hide
             * @param word - The word to practice (optional)
             */
            setIsWaitingForSign: (isWaiting, word = null) => set({
                isWaitingForSign: isWaiting,
                targetWord: word,
                currentLetterIndex: 0,                  // * Always start from first letter
                verificationMode: 'teaching',           // * Always start with teaching mode
                showAssistance: true                    // * Always show hints initially
            }),

            /**
             * * Set which letter in the word is being practiced
             * @param index - 0-indexed position in targetWord
             */
            setCurrentLetterIndex: (index) => set({ currentLetterIndex: index }),

            /**
             * * Switch between teaching and verification modes
             * 
             * - 'teaching': Show visual hints for each letter
             * - 'whole_word': No hints (final challenge mode - not currently used)
             */
            setVerificationMode: (mode) => set({
                verificationMode: mode,
                showAssistance: mode === 'teaching'     // * Hide hints in verification mode
            }),

            /**
             * * Reset all game state to initial values
             * 
             * Called when:
             * - User starts new game
             * - Testing/debugging
             * 
             * ! Does NOT reset persisted progression (handled by localStorage clear)
             */
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

            /**
             * * Mark that user cancelled sign practice
             * 
             * Used by GameCanvas to know whether to skip the pellet
             * after the overlay closes.
             */
            setLastActionWasCancel: (cancelled) => set({
                lastActionWasCancel: cancelled
            }),

            // =================================================================
            // COMPLEX ACTIONS (with business logic)
            // =================================================================

            /**
             * * Complete a word and track progress
             * 
             * Called when user successfully signs all letters in a word.
             * 
             * BUSINESS LOGIC:
             * 1. Add all unique letters from word to masteredLetters
             * 2. Increment wordsCompleted counter
             * 3. Check if Level 2 should unlock:
             *    - Need 3+ words completed (that's it!)
             * 
             * @param word - The completed word (e.g., "HELLO")
             */
            completeWord: (word: string) => {
                const state = get();  // * Get current state

                // * Extract unique letters from the word
                const newLetters = word.toUpperCase().split('');

                // * Merge with existing mastered letters (remove duplicates with Set)
                const uniqueNewLetters = [...new Set([...state.masteredLetters, ...newLetters])];

                // * Increment word count
                const newWordsCompleted = state.wordsCompleted + 1;

                // * Check Level 2 unlock criteria:
                // * - Must complete at least 3 words
                // ! Previously also required 20 letters, but that was too restrictive
                const shouldUnlock = newWordsCompleted >= 3;

                // * Update state
                set({
                    wordsCompleted: newWordsCompleted,
                    masteredLetters: uniqueNewLetters,
                    level2Unlocked: shouldUnlock
                });
            },

            /**
             * * Toggle visual assistance (hints)
             */
            setShowAssistance: (show) => set({ showAssistance: show }),

            /**
             * * Manually unlock Level 2
             * 
             * Can be used for:
             * - Testing
             * - Admin override
             * - Cheat codes
             * 
             * Also switches to Level 2 and resets score.
             */
            unlockLevel2: () => set({
                level2Unlocked: true,
                level: 2,
                score: 0
            }),
        }),

        // =====================================================================
        // PERSISTENCE CONFIGURATION
        // =====================================================================
        {
            name: 'pacman-game-storage',  // * localStorage key name

            /**
             * * partialize - Select which state to persist
             * 
             * We persist:
             * - level: Which level user is on
             * - collectedSigns: What they've learned
             * - wordsCompleted: Progress count
             * - masteredLetters: Unique letters learned
             * - level2Unlocked: Whether Level 2 is available
             * 
             * We DON'T persist:
             * - score: Resets each session
             * - isPaused: Always start paused
             * - isWaitingForSign: Transient UI state
             */
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
