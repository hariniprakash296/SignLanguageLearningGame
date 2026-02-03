"use client";

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useGameStore } from '@/store/gameSlice';
import { INITIALIZED_SIGNS, InitializedSign, LEVEL_2_WORDS } from '@/lib/initialized-signs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, ArrowRight, Check, Star, BookOpen } from 'lucide-react';

const HandTracking = dynamic(() => import('./HandTracking').then(mod => mod.HandTracking), { ssr: false });
const SignDisplay = dynamic(() => import('../shared/SignDisplay').then(mod => mod.SignDisplay), { ssr: false });

interface Level2State {
    currentWordIndex: number;
    phase: 'intro' | 'learn_letter' | 'learn_movement' | 'practice' | 'complete';
    letterMatched: boolean;
}

export const Level2Game: React.FC = () => {
    const { score, incrementScore, masteredLetters } = useGameStore();

    const [state, setState] = useState<Level2State>({
        currentWordIndex: 0,
        phase: 'intro',
        letterMatched: false,
    });

    const [completedWords, setCompletedWords] = useState<string[]>([]);

    // Get current word and sign
    const currentWord = LEVEL_2_WORDS[state.currentWordIndex];
    const currentSign = INITIALIZED_SIGNS.find(s => s.word === currentWord);

    // Handle letter match from hand tracking
    const handleLetterMatch = useCallback((letter: string) => {
        if (!currentSign || state.phase !== 'practice') return;

        if (letter === currentSign.letter) {
            setState(prev => ({ ...prev, letterMatched: true }));

            // After matching the letter handshape, complete the word
            setTimeout(() => {
                incrementScore(50);
                setCompletedWords(prev => [...prev, currentWord]);

                if (state.currentWordIndex + 1 >= LEVEL_2_WORDS.length) {
                    setState(prev => ({ ...prev, phase: 'complete' }));
                } else {
                    setState(prev => ({
                        ...prev,
                        currentWordIndex: prev.currentWordIndex + 1,
                        phase: 'intro',
                        letterMatched: false,
                    }));
                }
            }, 1500);
        }
    }, [currentSign, state.phase, state.currentWordIndex, currentWord, incrementScore]);

    // Advance to next phase
    const advancePhase = () => {
        setState(prev => {
            const phases: Level2State['phase'][] = ['intro', 'learn_letter', 'learn_movement', 'practice'];
            const currentIdx = phases.indexOf(prev.phase);
            if (currentIdx < phases.length - 1) {
                return { ...prev, phase: phases[currentIdx + 1] };
            }
            return prev;
        });
    };

    if (!currentSign) {
        return <div className="p-8 text-center">Loading...</div>;
    }

    return (
        <div className="min-h-[600px] p-6 space-y-6">
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
                    Word {state.currentWordIndex + 1} of {LEVEL_2_WORDS.length}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 rounded-full h-3">
                <div
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(completedWords.length / LEVEL_2_WORDS.length) * 100}%` }}
                />
            </div>

            {/* Main Content Based on Phase */}
            {state.phase === 'intro' && (
                <Card className="border-2 border-purple-200 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 text-center">
                        <CardTitle className="text-4xl font-black text-purple-800">
                            {currentSign.word}
                        </CardTitle>
                        <p className="text-purple-600 mt-2">Learn this initialized sign</p>
                    </CardHeader>
                    <CardContent className="p-8 text-center">
                        <div className="mb-6">
                            <p className="text-lg text-slate-700 mb-4">
                                This sign uses the <span className="font-black text-2xl text-blue-600">{currentSign.letter}</span> handshape
                            </p>
                            <p className="text-slate-600">
                                Initialized signs use the first letter of the English word as their handshape.
                            </p>
                        </div>
                        <Button onClick={advancePhase} size="lg" className="gap-2 bg-purple-600 hover:bg-purple-700">
                            Start Learning <ArrowRight className="h-5 w-5" />
                        </Button>
                    </CardContent>
                </Card>
            )}

            {state.phase === 'learn_letter' && (
                <div className="grid md:grid-cols-2 gap-6">
                    <Card className="border-2 border-blue-200">
                        <CardHeader className="bg-blue-50">
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5" />
                                Step 1: The Handshape
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="aspect-square bg-slate-100 rounded-xl flex items-center justify-center mb-4">
                                <SignDisplay sign={currentSign.letter} showAnimation={false} />
                            </div>
                            <p className="text-center text-slate-700 font-medium">
                                Make the letter <span className="font-black text-2xl text-blue-600">{currentSign.letter}</span>
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-2 border-slate-200">
                        <CardHeader className="bg-slate-50">
                            <CardTitle>Description</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <p className="text-lg text-slate-700 mb-6">{currentSign.description}</p>
                            <Button onClick={advancePhase} className="w-full gap-2">
                                Next: Learn Movement <ArrowRight className="h-5 w-5" />
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            {state.phase === 'learn_movement' && (
                <Card className="border-2 border-green-200">
                    <CardHeader className="bg-green-50">
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5" />
                            Step 2: The Movement
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="text-center mb-8">
                            <h3 className="text-3xl font-black text-green-800 mb-4">{currentSign.word}</h3>
                            <div className="bg-white border-2 border-green-100 rounded-xl p-6 mb-6">
                                <p className="text-xl text-slate-700">{currentSign.movement}</p>
                            </div>
                            <p className="text-slate-500 text-sm">
                                Practice the movement a few times before testing
                            </p>
                        </div>
                        <Button onClick={advancePhase} size="lg" className="w-full gap-2 bg-green-600 hover:bg-green-700">
                            Ready to Practice <ArrowRight className="h-5 w-5" />
                        </Button>
                    </CardContent>
                </Card>
            )}

            {state.phase === 'practice' && (
                <div className="grid md:grid-cols-2 gap-6">
                    <Card className="border-2 border-purple-200">
                        <CardHeader className="bg-purple-50">
                            <CardTitle className="text-center text-2xl">
                                Show: {currentSign.word}
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
                                targetWord={currentSign.letter}
                                onGestureMatch={handleLetterMatch}
                            />
                        </CardContent>
                    </Card>
                </div>
            )}

            {state.phase === 'complete' && (
                <Card className="border-4 border-yellow-400 shadow-xl">
                    <CardHeader className="bg-gradient-to-r from-yellow-400 to-orange-400 text-center">
                        <div className="text-6xl mb-4">🎉</div>
                        <CardTitle className="text-4xl font-black text-white">
                            Level 2 Complete!
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 text-center">
                        <p className="text-xl text-slate-700 mb-6">
                            You've mastered {completedWords.length} initialized signs!
                        </p>
                        <div className="flex flex-wrap justify-center gap-2 mb-8">
                            {completedWords.map(word => (
                                <span key={word} className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                                    {word}
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
            {completedWords.length > 0 && state.phase !== 'complete' && (
                <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-slate-500 mr-2">Completed:</span>
                    {completedWords.map(word => (
                        <span key={word} className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm font-medium">
                            {word} ✓
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Level2Game;
