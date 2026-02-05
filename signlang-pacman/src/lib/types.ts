
export enum Region {
    ASL = 'American Sign Language (ASL)',
    BSL = 'British Sign Language (BSL)',
    AUSLAN = 'Australian Sign Language (Auslan)',
    FSL = 'French Sign Language (LSF)',
    JSL = 'Japanese Sign Language (JSL)'
}

export interface GrammarPart {
    label: string;
    word: string;
    type: 'subject' | 'verb' | 'object' | 'pronoun' | 'other';
}

export interface TranslationResult {
    sourceText: string;
    gloss: string; // The literal signs recognized (e.g., MAN HE HAVE CAR HE)
    grammarStructure: GrammarPart[]; // Breakdown into Subj, Verb, Object, etc.
    targetText: string;
    explanation: string;
    visualDescription: string;
    initializedSignsFound: string[];
}

export interface CaptureState {
    isCapturing: boolean;
    capturedFrames: string[];
    status: 'idle' | 'recording' | 'processing' | 'error';
}
