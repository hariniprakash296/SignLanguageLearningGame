export enum Region {
    ASL = "American Sign Language (ASL)",
    BSL = "British Sign Language (BSL)",
    FSL = "French Sign Language (LSF)",
    JSL = "Japanese Sign Language (JSL)",
    AUSLAN = "Australian Sign Language (Auslan)",
    GSL = "German Sign Language (DGS)"
}

export interface GrammarStructure {
    label: string;
    word: string;
    type: 'subject' | 'verb' | 'object' | 'pronoun' | 'other';
}

export interface TranslationResult {
    sourceText: string;
    gloss: string;
    targetText: string;
    explanation: string;
    visualDescription: string;
    grammarStructure: GrammarStructure[];
    initializedSignsFound: string[];
}
