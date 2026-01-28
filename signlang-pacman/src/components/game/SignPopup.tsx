"use client";

import React from 'react';
import { useSignStore } from '@/store/signSlice';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SignDisplay } from '@/components/shared/SignDisplay';

export const SignPopup: React.FC = () => {
    const { currentSign, setCurrentSign } = useSignStore();

    if (!currentSign) return null;

    return (
        <div className="fixed bottom-8 right-8 w-72 p-5 bg-white rounded-2xl shadow-2xl border-2 border-blue-400 z-50 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-blue-900">Sign: {currentSign.label}</h3>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-red-50 hover:text-red-500"
                    onClick={() => setCurrentSign(null)}
                >
                    <X className="h-5 w-5" />
                </Button>
            </div>

            <SignDisplay sign={currentSign.label} size="md" showDescription={true} showAnimation={currentSign.type === 'word'} />

            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-xs text-yellow-800 font-medium">
                    🎮 +10 points! Keep collecting to learn more signs.
                </p>
            </div>
        </div>
    );
};
