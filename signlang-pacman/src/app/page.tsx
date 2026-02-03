"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { useGameStore } from "@/store/gameSlice";
import { GameCanvas } from "@/components/game/GameCanvas";
import { SignPopup } from "@/components/game/SignPopup";
import { VideoTranslator } from "@/components/youtube/VideoTranslator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, BookOpen, Youtube, GraduationCap, X, Globe, Star } from "lucide-react";

const HandTracking = dynamic(() => import("@/components/game/HandTracking").then(mod => mod.HandTracking), { ssr: false });
const SignDisplay = dynamic(() => import("@/components/shared/SignDisplay").then(mod => mod.SignDisplay), { ssr: false });
const SignTranslator = dynamic(() => import("@/components/translate/SignTranslator").then(mod => mod.SignTranslator), { ssr: false });
const Level2Game = dynamic(() => import("@/components/game/Level2Game").then(mod => mod.Level2Game), { ssr: false });

export default function Home() {
  const {
    score,
    level,
    isWaitingForSign,
    targetWord,
    setIsWaitingForSign,
    incrementScore,
    currentLetterIndex,
    setCurrentLetterIndex,
    verificationMode,
    setVerificationMode,
    showAssistance,
    completeWord,
    level2Unlocked,
    wordsCompleted,
    masteredLetters,
    setLevel
  } = useGameStore();

  const [showSuccessLetter, setShowSuccessLetter] = React.useState(false);

  // Get the current letter based on phase
  // Get the current letter based on phase
  const activeLetter = (targetWord && targetWord[currentLetterIndex]) || "";

  const handleLetterMatch = React.useCallback((letter: string) => {
    if (!targetWord || showSuccessLetter) return;

    if (verificationMode === 'teaching') {
      // PHASE 1: TEACHING (Pause and Show Success)
      setShowSuccessLetter(true);

      setTimeout(() => {
        setShowSuccessLetter(false);
        if (currentLetterIndex + 1 >= targetWord.length) {
          // Teaching complete -> Move to Verification Phase
          setVerificationMode('whole_word');
          setCurrentLetterIndex(0);
        } else {
          // Next letter to teach
          setCurrentLetterIndex(currentLetterIndex + 1);
          incrementScore(10);
        }
      }, 1500);

    } else {
      // PHASE 2: WHOLE WORD VERIFICATION (Instant Flow)
      // Check if the matched gesture corresponds to the *current sequence letter*
      if (letter === targetWord[currentLetterIndex]) {
        const nextIndex = currentLetterIndex + 1;

        if (nextIndex >= targetWord.length) {
          // FULL SEQUENCE COMPLETE!
          setShowSuccessLetter(true); // Final success
          setTimeout(() => {
            setShowSuccessLetter(false);
            incrementScore(100); // Big bonus
            completeWord(targetWord); // Track completed word for Level 2 unlock
            setIsWaitingForSign(false);
            setVerificationMode('teaching'); // Reset for next time
          }, 2000);
        } else {
          // Advance sequence immediately (no delay)
          setCurrentLetterIndex(nextIndex);
        }
      }
    }
  }, [targetWord, showSuccessLetter, verificationMode, currentLetterIndex, incrementScore, setVerificationMode, setCurrentLetterIndex, setIsWaitingForSign, completeWord]);

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      {/* ... Header and Main Tabs same as before ... */}
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-xl">
              <GraduationCap className="text-white h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">SIGNS & PACMAN</h1>
              <p className="text-slate-500 font-medium italic">Learn ASL through play</p>
            </div>
          </div>

          <div className="flex gap-4 items-center">

            <div className="bg-yellow-50 px-6 py-3 rounded-xl border-2 border-yellow-200 flex items-center gap-3 shadow-sm">
              <Trophy className="text-yellow-600 h-6 w-6" />
              <div>
                <p className="text-xs font-bold text-yellow-800 uppercase tracking-widest">Score</p>
                <p className="text-2xl font-black text-yellow-900 leading-none">{score}</p>
              </div>
            </div>
            <div className="bg-blue-50 px-6 py-3 rounded-xl border-2 border-blue-200 flex items-center gap-3 shadow-sm">
              <BookOpen className="text-blue-600 h-6 w-6" />
              <div>
                <p className="text-xs font-bold text-blue-800 uppercase tracking-widest">Level</p>
                <p className="text-2xl font-black text-blue-900 leading-none">{level}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Interface */}
        <Tabs defaultValue="game" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-14 p-1 bg-slate-200/50 rounded-xl">
            <TabsTrigger
              value="game"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-lg font-bold"
            >
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Pacman Arcade
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="youtube"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-lg font-bold"
            >
              <div className="flex items-center gap-2">
                <Youtube className="h-5 w-5" />
                YouTube Translator
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="sign-translator"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-lg font-bold"
            >
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Sign Translator
              </div>
            </TabsTrigger>
          </TabsList>

          {/* Level Navigation Bar */}
          <div className="flex items-center justify-between mt-4 px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-slate-200">
            <Button
              variant="ghost"
              onClick={() => setLevel(1)}
              disabled={level === 1}
              className={`gap-2 ${level === 1 ? 'text-slate-300' : 'text-blue-600 hover:bg-blue-100'}`}
            >
              ← Level 1
            </Button>

            <div className="flex items-center gap-4">
              <div className={`px-4 py-2 rounded-lg font-bold ${level === 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                Level 1: Letters
              </div>
              <div className={`px-4 py-2 rounded-lg font-bold ${level === 2 ? 'bg-purple-600 text-white' : level2Unlocked ? 'bg-slate-100 text-slate-600' : 'bg-slate-100 text-slate-300'}`}>
                {level2Unlocked ? 'Level 2: Words' : '🔒 Level 2'}
              </div>
            </div>

            <Button
              variant="ghost"
              onClick={() => setLevel(2)}
              disabled={level === 2 || !level2Unlocked}
              className={`gap-2 ${level === 2 || !level2Unlocked ? 'text-slate-300' : 'text-purple-600 hover:bg-purple-100'}`}
            >
              Level 2 →
            </Button>
          </div>

          <TabsContent value="game" className="mt-6">
            <Card className="border-none shadow-xl bg-white overflow-hidden">
              <CardHeader className="border-b bg-slate-50/50">
                <CardTitle className="text-2xl">Arcade Learning Mode</CardTitle>
                <div className="text-sm text-muted-foreground">
                  Eat the letter pellets to see their American Sign Language representation.
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <GameCanvas />
              </CardContent>
            </Card>

            {/* Level 2 Section */}
            {level2Unlocked && (
              <Card className="mt-6 border-2 border-purple-200 shadow-xl bg-gradient-to-br from-purple-50 to-blue-50 overflow-hidden">
                <CardHeader className="border-b border-purple-100">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Star className="h-6 w-6 text-purple-600" />
                    Level 2: Initialized Signs
                  </CardTitle>
                  <CardDescription>
                    Learn signs where the handshape uses the first letter of the word.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Level2Game />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="youtube" className="mt-6">
            <Card className="border-none shadow-xl bg-white overflow-hidden min-h-[700px]">
              <CardHeader className="border-b bg-slate-50/50">
                <CardTitle className="text-2xl">Sign Interpretation Hub</CardTitle>
                <CardDescription>
                  Enter any YouTube URL to see a transcript and learn signs in context.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <VideoTranslator />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sign-translator" className="mt-6">
            <Card className="border-none shadow-xl bg-white overflow-hidden min-h-[700px]">
              <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-blue-50">
                <CardTitle className="text-2xl">Cross-Country Sign Translator</CardTitle>
                <CardDescription>
                  Translate signs between different countries' sign languages. Great for traveling deaf individuals.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <SignTranslator />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <SignPopup />

      {isWaitingForSign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-[2px]">
          <div className="relative w-full max-w-4xl">
            {/* Cancel Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-12 left-0 text-white hover:bg-white/20 hover:text-white transition-colors"
              onClick={() => {
                const { setLastActionWasCancel, setIsWaitingForSign } = useGameStore.getState();
                setLastActionWasCancel(true);
                setIsWaitingForSign(false);
              }}
            >
              <X className="h-8 w-8" />
              <span className="sr-only">Cancel and return to game</span>
            </Button>

            <Card className="w-full bg-white shadow-2xl overflow-hidden border-0">
              <CardHeader className="bg-slate-50 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-3xl font-black text-slate-900 tracking-tighter">
                      {verificationMode === 'teaching' ? 'LEARN: ' : 'VERIFY: '}
                      <span className="text-blue-600">{targetWord}</span>
                    </CardTitle>
                    <div className="text-lg text-muted-foreground">
                      {verificationMode === 'teaching' ? (
                        // Teaching Progress
                        targetWord?.split('').map((l, i) => (
                          <span key={i} className={`inline-block mx-0.5 px-2 rounded ${i === currentLetterIndex ? 'bg-blue-600 text-white font-bold animate-pulse' : i < currentLetterIndex ? 'text-green-600 font-bold' : 'text-slate-400'}`}>
                            {l}
                          </span>
                        ))
                      ) : (
                        // Verification Progress (Whole Word)
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 text-sm font-bold uppercase tracking-widest mr-2">Sequence:</span>
                          {targetWord?.split('').map((l, i) => (
                            <span key={i} className={`inline-block mx-0.5 px-3 py-1 rounded-lg border-2 ${i < currentLetterIndex ? 'bg-green-100 border-green-400 text-green-700 font-bold' : i === currentLetterIndex ? 'bg-blue-100 border-blue-500 text-blue-800 font-black scale-110 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-300'}`}>
                              {l}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className={`p-3 rounded-2xl mb-1 ${verificationMode === 'whole_word' ? 'bg-purple-100' : 'bg-yellow-100'}`}>
                      <span className={`${verificationMode === 'whole_word' ? 'text-purple-700' : 'text-yellow-700'} font-black text-xl`}>
                        {verificationMode === 'whole_word' ? 'FINAL CHALLENGE' : '+50 PTS'}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase">
                      {verificationMode === 'teaching'
                        ? `Letter ${currentLetterIndex + 1} of ${targetWord?.length}`
                        : 'Sign the full word now!'}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Visual Guide */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">
                      {verificationMode === 'teaching' ? 'Demonstration' : 'Reference'}
                    </h3>
                    <div className="aspect-video bg-slate-100 rounded-xl flex items-center justify-center relative overflow-hidden group">
                      {showAssistance ? (
                        <SignDisplay
                          sign={activeLetter}
                          showAnimation={false}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-8">
                          <div className="text-6xl mb-4">🧠</div>
                          <h4 className="text-xl font-black text-purple-700 mb-2">FINAL TEST!</h4>
                          <p className="text-purple-600 font-medium">Sign from memory - no hints!</p>
                          <p className="text-slate-400 text-sm mt-2">Current letter: <span className="font-black text-lg text-purple-800">{activeLetter}</span></p>
                        </div>
                      )}
                      {showSuccessLetter && (
                        <div className="absolute inset-0 bg-green-500/80 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
                          <div className="bg-white rounded-full p-4 mb-2 shadow-lg">
                            <Trophy className="text-green-600 h-12 w-12" />
                          </div>
                          <h4 className="text-white text-3xl font-black italic tracking-tighter">
                            {verificationMode === 'teaching' ? 'NICE!' : 'EXCELLENT!'}
                          </h4>
                          <p className="text-white font-bold">
                            {verificationMode === 'teaching' ? 'Next letter coming up...' : 'You mastered the word!'}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className={`p-4 rounded-xl border ${verificationMode === 'whole_word' ? 'bg-purple-50 border-purple-100' : 'bg-blue-50 border-blue-100'}`}>
                      <p className={`${verificationMode === 'whole_word' ? 'text-purple-800' : 'text-blue-800'} text-sm font-medium leading-relaxed`}>
                        {verificationMode === 'teaching' ? (
                          <>Tip: Practice the letter <span className="font-bold">{activeLetter}</span>. Then we'll verify the whole word.</>
                        ) : (
                          <>Challenge: Sign <span className="font-black">{targetWord}</span> in one go! Currently waiting for: <span className="font-black text-lg">{activeLetter}</span></>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Hand Tracking */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Your Camera</h3>
                    <HandTracking
                      targetWord={activeLetter}
                      onGestureMatch={handleLetterMatch}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </main>
  );
}
