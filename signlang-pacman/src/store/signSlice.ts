/**
 * =============================================================================
 * FILE: signSlice.ts
 * =============================================================================
 * 
 * C4 MODEL CONTEXT:
 * - Container: Frontend (Next.js/React Application)
 * - Component: SignStore (Zustand State - Sign Display)
 * - Responsibility: Manages current sign display data and available signs list
 * 
 * DATA FLOW:
 * 1. Pellet collected in game → GameCanvas fetches sign data
 * 2. setCurrentSign() called with sign info
 * 3. SignPopup/SignDisplay components read currentSign
 * 4. When overlay closes → setCurrentSign(null)
 * 
 * DEPENDENCIES:
 * - Used by: GameCanvas.tsx (sets sign data)
 * - Used by: SignPopup.tsx (reads sign data for display)
 * - Uses: Zustand for state management
 * 
 * KEY CONCEPTS:
 * - Simpler than gameSlice (no persistence needed)
 * - currentSign: The sign currently being displayed to user
 * - availableSigns: List of all ASL letters (A-Z)
 * 
 * =============================================================================
 */

import { create } from 'zustand';

/**
 * * SignData interface
 * Represents the data for a single ASL sign
 * 
 * @property label - The letter or word (e.g., "A" or "HELLO")
 * @property image_url - URL to sign image (null if using SVG/text fallback)
 * @property description - Text description of how to make the sign
 * @property type - 'letter' for single letters, 'word' for full words
 */
interface SignData {
    label: string;              // * The letter/word being signed
    image_url: string | null;   // * URL to sign image (optional)
    description: string;        // * How to form this sign
    type: 'letter' | 'word';    // * Single letter or full word
}

/**
 * * SignState interface
 * Shape of the Zustand sign store
 */
interface SignState {
    // * State
    currentSign: SignData | null;  // * Currently displayed sign (null = hidden)
    availableSigns: string[];      // * List of all supported letters

    // * Actions
    setCurrentSign: (sign: SignData | null) => void;
    setAvailableSigns: (signs: string[]) => void;
}

/**
 * * useSignStore - Sign Display State Store
 * 
 * Simpler Zustand store for managing sign display state.
 * Not persisted (resets on page refresh).
 * 
 * USAGE:
 * ```tsx
 * const { currentSign, setCurrentSign } = useSignStore();
 * 
 * // Set new sign
 * setCurrentSign({ label: 'A', description: '...', image_url: null, type: 'letter' });
 * 
 * // Clear sign
 * setCurrentSign(null);
 * ```
 */
export const useSignStore = create<SignState>((set) => ({
    // * Initial state
    currentSign: null,  // * No sign displayed initially
    availableSigns: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),  // * All 26 letters

    // * Actions
    setCurrentSign: (sign) => set({ currentSign: sign }),
    setAvailableSigns: (signs) => set({ availableSigns: signs }),
}));
