import { create } from 'zustand';

interface SignData {
    label: string;
    image_url: string | null;
    description: string;
    type: 'letter' | 'word';
}

interface SignState {
    currentSign: SignData | null;
    availableSigns: string[];

    setCurrentSign: (sign: SignData | null) => void;
    setAvailableSigns: (signs: string[]) => void;
}

export const useSignStore = create<SignState>((set) => ({
    currentSign: null,
    availableSigns: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),

    setCurrentSign: (sign) => set({ currentSign: sign }),
    setAvailableSigns: (signs) => set({ availableSigns: signs }),
}));
