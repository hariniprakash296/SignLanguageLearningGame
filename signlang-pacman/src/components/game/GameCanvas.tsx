"use client";

import React, { useEffect, useRef } from 'react';
import { GameEngine, Direction } from '@/lib/game-engine';
import { useGameStore } from '@/store/gameSlice';
import { useSignStore } from '@/store/signSlice';

export const GameCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<GameEngine | null>(null);
    const { incrementScore, setPaused, isPaused, setIsWaitingForSign, isWaitingForSign } = useGameStore();
    const { setCurrentSign } = useSignStore();

    useEffect(() => {
        if (canvasRef.current) {
            const engine = new GameEngine(canvasRef.current, async (word) => {
                // Delay showing the overlay so the user sees Pacman freeze at the pellet first
                setTimeout(() => {
                    setIsWaitingForSign(true, word);
                }, 600);
                // Fetch sign from backend (demonstration)
                try {
                    const response = await fetch(`http://localhost:5000/api/sign/${word.toLowerCase()}`);
                    if (response.ok) {
                        const data = await response.json();
                        setCurrentSign(data);
                    } else {
                        // Fallback if no word sign exists
                        setCurrentSign({
                            label: word,
                            description: `Sign for ${word}`,
                            image_url: null,
                            type: 'word'
                        });
                    }
                } catch (error) {
                    console.error("Failed to fetch sign:", error);
                }
            });
            engineRef.current = engine;

            if (!isPaused) {
                engine.start();
            }
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (!engineRef.current) return;

            let dir: Direction = null;
            if (e.key === 'ArrowUp' || e.key === 'w') dir = 'up';
            if (e.key === 'ArrowDown' || e.key === 's') dir = 'down';
            if (e.key === 'ArrowLeft' || e.key === 'a') dir = 'left';
            if (e.key === 'ArrowRight' || e.key === 'd') dir = 'right';

            if (dir) {
                engineRef.current.setDirection(dir);
                if (isPaused) setPaused(false);
            }
        };

        const handleResize = () => {
            engineRef.current?.resize();
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('resize', handleResize);
            engineRef.current?.pause();
        };
    }, [incrementScore, setCurrentSign, setPaused, isPaused]);

    useEffect(() => {
        if (isPaused || isWaitingForSign) {
            engineRef.current?.pause();
        } else {
            engineRef.current?.start();
        }
    }, [isPaused, isWaitingForSign]);

    useEffect(() => {
        if (!isWaitingForSign && engineRef.current) {
            const { lastActionWasCancel, setLastActionWasCancel } = useGameStore.getState();
            if (lastActionWasCancel) {
                engineRef.current.cancelPractice();
                setLastActionWasCancel(false);
            } else {
                engineRef.current.unfreeze();
            }
        }
    }, [isWaitingForSign]);

    return (
        <div className="relative w-full h-[600px] border-4 border-blue-900 rounded-lg overflow-hidden bg-black">
            <canvas
                ref={canvasRef}
                className="w-full h-full block"
            />
            {isPaused && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
                    <div className="text-center text-white">
                        <h2 className="text-4xl font-bold mb-4 text-yellow-400">PAUSED</h2>
                        <p className="text-xl">Press arrows or WASD to start</p>
                    </div>
                </div>
            )}
        </div>
    );
};
