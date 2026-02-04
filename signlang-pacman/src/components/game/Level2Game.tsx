/**
 * =============================================================================
 * FILE: Level2Game.tsx
 * =============================================================================
 * 
 * C4 MODEL CONTEXT:
 * - Container: Frontend (Next.js/React Application)
 * - Component: Level2Game (Initialized Signs Learning)
 * - Responsibility: Teach initialized signs organized by families
 * 
 * TEACHING APPROACH:
 * 1. Explain what "initialization" means in ASL
 * 2. Show word families grouped by root movement
 * 3. Demonstrate how changing the letter changes the word
 * 4. Practice signing each word in the family
 * 
 * PHASES:
 * - welcome: Explain initialization concept
 * - family_intro: Introduce a family (e.g., "Educators")
 * - learn_word: Show specific word in family
 * - practice: User practices the sign
 * - family_complete: Celebrate family completion
 * - all_complete: Final celebration
 * 
 * =============================================================================
 */

"use client";

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useGameStore } from '@/store/gameSlice';
import {
    INITIALIZED_SIGNS,
    SIGN_FAMILIES,
    getSignsByFamily,
    getFamilyById,
    InitializedSign,
    SignFamily
} from '@/lib/initialized-signs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, ArrowRight, Check, Star, BookOpen, Users, Lightbulb, Sparkles } from 'lucide-react';
import { MovementVisualizer } from './MovementVisualizer';
import { getSignatureForWord } from '@/lib/gesture-recognition';

const HandTracking = dynamic(() => import('./HandTracking').then(mod => mod.HandTracking), { ssr: false });
const SignDisplay = dynamic(() => import('../shared/SignDisplay').then(mod => mod.SignDisplay), { ssr: false });

// Define teaching phases
type Phase = 'welcome' | 'family_intro' | 'family_words' | 'learn_word' | 'practice' | 'family_complete' | 'all_complete';

interface Level2State {
    phase: Phase;
    currentFamilyIndex: number;
    currentWordIndex: number;
    letterMatched: boolean;
}

// Families to teach in Level 2
const TEACHING_FAMILIES = ['groups-collections', 'educators', 'colors', 'days-of-week'];

export const Level2Game: React.FC = () => {
    const { score, incrementScore } = useGameStore();

    const [state, setState] = useState<Level2State>({
        phase: 'welcome',
        currentFamilyIndex: 0,
        currentWordIndex: 0,
        letterMatched: false,
    });

    const [completedFamilies, setCompletedFamilies] = useState<string[]>([]);
    const [completedWords, setCompletedWords] = useState<string[]>([]);

    // Get current family and its words
    const currentFamilyId = TEACHING_FAMILIES[state.currentFamilyIndex];
    const currentFamily = getFamilyById(currentFamilyId);
    const familyWords = currentFamily ? getSignsByFamily(currentFamilyId) : [];
    const currentSign = familyWords[state.currentWordIndex];

    // Handle letter match from hand tracking
    // Handle sign match (letter + movement)
    const handleSignMatch = useCallback((match: string) => {
        if (!currentSign || state.phase !== 'practice') return;

        // Check if matched word equals target word
        if (match === currentSign.word) {
            setState(prev => ({ ...prev, letterMatched: true }));
            incrementScore(50);

            setTimeout(() => {
                setCompletedWords(prev => {
                    if (prev.includes(currentSign.word)) return prev;
                    return [...prev, currentSign.word];
                });

                // Check if more words in this family
                if (state.currentWordIndex + 1 < familyWords.length) {
                    setState(prev => ({
                        ...prev,
                        currentWordIndex: prev.currentWordIndex + 1,
                        phase: 'learn_word',
                        letterMatched: false,
                    }));
                } else {
                    // Family complete!
                    setCompletedFamilies(prev => [...prev, currentFamilyId]);

                    if (state.currentFamilyIndex + 1 < TEACHING_FAMILIES.length) {
                        setState(prev => ({
                            ...prev,
                            phase: 'family_complete',
                            letterMatched: false,
                        }));
                    } else {
                        setState(prev => ({ ...prev, phase: 'all_complete' }));
                    }
                }
            }, 1500);
        }
    }, [currentSign, state.phase, state.currentWordIndex, familyWords.length, currentFamilyId, state.currentFamilyIndex, incrementScore]);

    // Move to next family
    const nextFamily = () => {
        setState(prev => ({
            ...prev,
            currentFamilyIndex: prev.currentFamilyIndex + 1,
            currentWordIndex: 0,
            phase: 'family_intro',
            letterMatched: false,
        }));
    };

    // Advance phase
    const advancePhase = (to?: Phase) => {
        setState(prev => ({ ...prev, phase: to || 'family_intro' }));
    };

    // Color mapping for families
    const familyColors: Record<string, string> = {
        'groups-collections': 'pink',
        'educators': 'purple',
        'colors': 'orange',
        'days-of-week': 'green',
        'local-place': 'blue',
    };

    const getColorClasses = (color: string) => ({
        bg: `bg-${color}-100`,
        border: `border-${color}-200`,
        text: `text-${color}-800`,
        button: `bg-${color}-600 hover:bg-${color}-700`,
    });

    return (
        <div className="min-h-[700px] p-6 space-y-6">
            {/* Progress Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-purple-100 px-4 py-2 rounded-xl">
                        <Star className="h-5 w-5 text-purple-600" />
                        <span className="font-bold text-purple-800">Level 2: Initialized Signs</span>
                    </div>
                    <div className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-xl">
                        <Trophy className="h-5 w-5 text-yellow-600" />
                        <span className="font-bold text-yellow-800">{score} points</span>
                    </div>
                </div>
                <div className="text-sm text-slate-500">
                    Family {state.currentFamilyIndex + 1} of {TEACHING_FAMILIES.length}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 rounded-full h-3">
                <div
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(completedFamilies.length / TEACHING_FAMILIES.length) * 100}%` }}
                />
            </div>

            {/* PHASE: Welcome - Explain Initialization */}
            {state.phase === 'welcome' && (
                <Card className="border-2 border-purple-200 shadow-xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-center py-8">
                        <div className="text-5xl mb-4">🤟</div>
                        <CardTitle className="text-3xl font-black">
                            Welcome to Initialized Signs!
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        {/* What is Initialization */}
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-blue-100 rounded-full">
                                    <Lightbulb className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-blue-800 mb-2">What is Initialization?</h3>
                                    <p className="text-blue-700 mb-4">
                                        In ASL, many signs use the <strong>first letter of the English word</strong> as part of the sign.
                                        This is called <strong>"initialization"</strong>.
                                    </p>
                                    <p className="text-blue-700">
                                        The amazing thing? Words that are related often share the <strong>same movement</strong> -
                                        you just change the <strong>letter</strong> to change the word!
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Example */}
                        <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6 mb-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-purple-100 rounded-full">
                                    <Users className="h-6 w-6 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-purple-800 mb-2">Example: People Who Educate</h3>
                                    <p className="text-purple-700 mb-4">
                                        These words all use a similar "sharing knowledge" movement:
                                    </p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {['TEACHER', 'TUTOR', 'COACH', 'INSTRUCTOR'].map((word, i) => (
                                            <div key={word} className="bg-white rounded-lg p-3 text-center shadow-sm">
                                                <div className="text-2xl font-black text-purple-600">{word[0]}</div>
                                                <div className="text-sm font-medium text-slate-700">{word}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-purple-600 text-sm mt-3 italic">
                                        Same movement, different letter = different educator type!
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* More Examples */}
                        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-8">
                            <h3 className="text-xl font-bold text-green-800 mb-4">More Examples:</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                    <p className="font-bold text-green-700 mb-2">📅 Days of the Week</p>
                                    <p className="text-sm text-slate-600">
                                        Same circular motion: <span className="font-mono bg-green-100 px-1">M</span>onday,
                                        <span className="font-mono bg-green-100 px-1">T</span>uesday,
                                        <span className="font-mono bg-green-100 px-1">W</span>ednesday...
                                    </p>
                                </div>
                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                    <p className="font-bold text-orange-700 mb-2">🎨 Colors</p>
                                    <p className="text-sm text-slate-600">
                                        Same shaking motion: <span className="font-mono bg-orange-100 px-1">B</span>lue,
                                        <span className="font-mono bg-orange-100 px-1">G</span>reen,
                                        <span className="font-mono bg-orange-100 px-1">P</span>urple...
                                    </p>
                                </div>
                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                    <p className="font-bold text-pink-700 mb-2">👥 Groups</p>
                                    <p className="text-sm text-slate-600">
                                        Same circular arc: <span className="font-mono bg-pink-100 px-1">F</span>amily,
                                        <span className="font-mono bg-pink-100 px-1">T</span>eam,
                                        <span className="font-mono bg-pink-100 px-1">G</span>roup,
                                        <span className="font-mono bg-pink-100 px-1">C</span>lass
                                    </p>
                                </div>
                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                    <p className="font-bold text-blue-700 mb-2">📍 Local & Culture</p>
                                    <p className="text-sm text-slate-600">
                                        Same circular near body: <span className="font-mono bg-blue-100 px-1">L</span>ocal,
                                        <span className="font-mono bg-blue-100 px-1">C</span>ulture,
                                        <span className="font-mono bg-blue-100 px-1">C</span>ommunity
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={() => advancePhase('family_intro')}
                            size="lg"
                            className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-lg py-6"
                        >
                            <Sparkles className="h-5 w-5" />
                            Let's Start Learning!
                            <ArrowRight className="h-5 w-5" />
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* PHASE: Family Introduction */}
            {state.phase === 'family_intro' && currentFamily && (
                <Card className="border-2 border-purple-200 shadow-xl">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 text-center py-8">
                        <div className="text-5xl mb-4">{currentFamily.name.split(' ').pop()}</div>
                        <CardTitle className="text-3xl font-black text-purple-800">
                            {currentFamily.name}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="bg-slate-50 rounded-xl p-6 mb-6">
                            <p className="text-lg text-slate-700 mb-4">
                                {currentFamily.description}
                            </p>
                            <div className="bg-white border rounded-lg p-4">
                                <p className="text-sm text-slate-500 mb-2">Base Movement:</p>
                                <p className="font-medium text-slate-700">{currentFamily.rootMovement}</p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h4 className="font-bold text-slate-700 mb-3">Words in this family:</h4>
                            <div className="flex flex-wrap gap-2">
                                {familyWords.map(sign => (
                                    <span
                                        key={sign.word}
                                        className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full font-medium flex items-center gap-2"
                                    >
                                        <span className="w-6 h-6 bg-purple-600 text-white rounded-full text-xs flex items-center justify-center font-black">
                                            {sign.letter}
                                        </span>
                                        {sign.word}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <Button
                            onClick={() => advancePhase('learn_word')}
                            size="lg"
                            className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
                        >
                            Start with {familyWords[0]?.word}
                            <ArrowRight className="h-5 w-5" />
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* PHASE: Learn Word */}
            {state.phase === 'learn_word' && currentSign && (
                <div className="grid md:grid-cols-2 gap-6">
                    <Card className="border-2 border-blue-200">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                            <CardTitle className="text-3xl font-black text-center text-blue-800">
                                {currentSign.word}
                            </CardTitle>
                            <p className="text-center text-blue-600">
                                Uses the <span className="font-black text-2xl">{currentSign.letter}</span> handshape
                            </p>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="aspect-square bg-slate-100 rounded-xl flex items-center justify-center mb-4">
                                <SignDisplay sign={currentSign.letter} showAnimation={false} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-2 border-green-200">
                        <CardHeader className="bg-green-50">
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5" />
                                How to Sign "{currentSign.word}"
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <p className="text-sm text-blue-600 font-medium mb-1">Step 1: Handshape</p>
                                    <p className="text-lg text-slate-700">{currentSign.description}</p>
                                </div>
                                <div className="bg-green-50 rounded-lg p-4">
                                    <p className="text-sm text-green-600 font-medium mb-1">Step 2: Movement</p>
                                    <div className="flex items-center gap-4">
                                        <MovementVisualizer
                                            type={getSignatureForWord(currentSign.word)?.expectedMovement.type || 'static'}
                                            className="h-24 w-24 shrink-0 bg-white shadow-sm"
                                        />
                                        <p className="text-lg text-slate-700">{currentSign.movement}</p>
                                    </div>
                                </div>

                            </div>

                            <Button
                                onClick={() => advancePhase('practice')}
                                size="lg"
                                className="w-full mt-6 gap-2 bg-green-600 hover:bg-green-700"
                            >
                                Practice Now! <ArrowRight className="h-5 w-5" />
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* PHASE: Practice */}
            {state.phase === 'practice' && currentSign && (
                <div className="grid md:grid-cols-2 gap-6">
                    <Card className="border-2 border-purple-200">
                        <CardHeader className="bg-purple-50">
                            <CardTitle className="text-center text-2xl">
                                Show: <span className="text-purple-600">{currentSign.word}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="text-center mb-4">
                                <p className="text-slate-600">
                                    Make the <span className="font-bold text-purple-700">{currentSign.letter}</span> handshape
                                </p>
                            </div>
                            {state.letterMatched ? (
                                <div className="aspect-video bg-green-100 rounded-xl flex items-center justify-center">
                                    <div className="text-center">
                                        <Check className="h-16 w-16 text-green-600 mx-auto mb-4" />
                                        <p className="text-xl font-bold text-green-700">Perfect!</p>
                                        <p className="text-green-600">+50 points</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="aspect-video bg-slate-100 rounded-xl flex items-center justify-center">
                                    <SignDisplay sign={currentSign.letter} showAnimation={false} />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-2 border-slate-200">
                        <CardHeader className="bg-slate-50">
                            <CardTitle>Your Camera</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            <HandTracking
                                targetWord={currentSign.word}
                                onGestureMatch={handleSignMatch}
                            />
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* PHASE: Family Complete */}
            {state.phase === 'family_complete' && currentFamily && (
                <Card className="border-4 border-green-400 shadow-xl">
                    <CardHeader className="bg-gradient-to-r from-green-400 to-emerald-500 text-center py-8">
                        <div className="text-6xl mb-4">🎉</div>
                        <CardTitle className="text-3xl font-black text-white">
                            Family Complete!
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 text-center">
                        <p className="text-xl text-slate-700 mb-4">
                            You mastered the <strong>{currentFamily.name}</strong> family!
                        </p>
                        <div className="flex flex-wrap justify-center gap-2 mb-6">
                            {familyWords.map(sign => (
                                <span key={sign.word} className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                                    {sign.word} ✓
                                </span>
                            ))}
                        </div>
                        <Button
                            onClick={nextFamily}
                            size="lg"
                            className="gap-2 bg-purple-600 hover:bg-purple-700"
                        >
                            Next Family <ArrowRight className="h-5 w-5" />
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* PHASE: All Complete */}
            {state.phase === 'all_complete' && (
                <Card className="border-4 border-yellow-400 shadow-xl">
                    <CardHeader className="bg-gradient-to-r from-yellow-400 to-orange-400 text-center py-8">
                        <div className="text-6xl mb-4">🏆</div>
                        <CardTitle className="text-4xl font-black text-white">
                            Level 2 Complete!
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 text-center">
                        <p className="text-xl text-slate-700 mb-6">
                            Amazing! You've mastered initialized signs across {completedFamilies.length} families!
                        </p>
                        <div className="flex flex-wrap justify-center gap-2 mb-8">
                            {completedWords.map(word => (
                                <span key={word} className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                                    {word} ✓
                                </span>
                            ))}
                        </div>
                        <div className="bg-purple-50 rounded-xl p-6">
                            <p className="text-purple-800 font-bold text-2xl">
                                Final Score: {score} points
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Completed Words Tracker */}
            {completedWords.length > 0 && !['welcome', 'all_complete'].includes(state.phase) && (
                <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-slate-500 mr-2">Mastered:</span>
                    {completedWords.map((word, i) => (
                        <span key={`${word}-${i}`} className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm font-medium">
                            {word} ✓
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Level2Game;
