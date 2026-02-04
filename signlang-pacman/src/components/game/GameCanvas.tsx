/**
 * =============================================================================
 * FILE: GameCanvas.tsx
 * =============================================================================
 * 
 * C4 MODEL CONTEXT:
 * - Container: Frontend (Next.js/React Application)
 * - Component: GameCanvas (React-to-Canvas Bridge)
 * - Responsibility: Wraps GameEngine class, handles React lifecycle and state sync
 * 
 * DATA FLOW:
 * 1. Component mounts → Creates GameEngine instance
 * 2. User presses arrow key → handleKeyDown → engine.setDirection()
 * 3. Pacman hits pellet → onCollect callback → setIsWaitingForSign(true)
 * 4. Sign overlay closes → engine.unfreeze() or engine.cancelPractice()
 * 
 * DEPENDENCIES:
 * - Uses: src/lib/game-engine.ts (GameEngine class)
 * - Uses: src/store/gameSlice.ts (game state)
 * - Uses: src/store/signSlice.ts (sign display state)
 * - Called by: src/app/page.tsx
 * 
 * KEY CONCEPTS:
 * - Ref-based engine: GameEngine is a vanilla class, stored in useRef
 * - React bridge: Effects sync React state ↔ GameEngine methods
 * - Event listeners: Keyboard input handled via window listeners
 * 
 * =============================================================================
 */

"use client";

import React, { useEffect, useRef } from 'react';
import { GameEngine, Direction } from '@/lib/game-engine';
import { useGameStore } from '@/store/gameSlice';
import { useSignStore } from '@/store/signSlice';

/**
 * * GameCanvas Component
 * 
 * React wrapper for the vanilla TypeScript GameEngine.
 * Handles:
 * - Canvas element creation and sizing
 * - Keyboard input routing to engine
 * - Pause/resume synchronization with React state
 * - Sign overlay integration
 * 
 * LIFECYCLE:
 * 1. Mount: Create engine, set up keyboard listeners
 * 2. Update: Sync isPaused/isWaitingForSign with engine
 * 3. Unmount: Clean up listeners, pause engine
 * 
 * @returns Canvas element with Pacman game
 */
export const GameCanvas: React.FC = () => {
    // * DOM and engine references
    const canvasRef = useRef<HTMLCanvasElement>(null);  // * HTML canvas element
    const engineRef = useRef<GameEngine | null>(null);  // * GameEngine instance

    // * Zustand state and actions
    const { incrementScore, setPaused, isPaused, setIsWaitingForSign, isWaitingForSign } = useGameStore();
    const { setCurrentSign } = useSignStore();

    /**
     * * Effect: Initialize GameEngine and event listeners
     * 
     * Creates the engine instance and sets up:
     * - Pellet collection callback (onCollect)
     * - Keyboard input handler
     * - Window resize handler
     */
    useEffect(() => {
        if (canvasRef.current) {
            // * Create GameEngine with onCollect callback
            // * This callback is called when Pacman approaches a pellet
            const engine = new GameEngine(canvasRef.current, async (word) => {
                // * Delay showing the overlay so user sees Pacman freeze first
                // * 600ms gives visual feedback that pellet was hit
                setTimeout(() => {
                    setIsWaitingForSign(true, word);
                }, 600);

                // * Optional: Fetch full word sign data from backend
                // * Falls back to letter-by-letter if backend unavailable
                try {
                    const response = await fetch(`http://localhost:5000/api/sign/${word.toLowerCase()}`);
                    if (response.ok) {
                        const data = await response.json();
                        setCurrentSign(data);
                    } else {
                        // * Fallback if no word sign exists in backend
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

            // * Start game loop if not paused
            if (!isPaused) {
                engine.start();
            }
        }

        /**
         * * Keyboard input handler
         * Maps arrow keys and WASD to direction commands
         */
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!engineRef.current) return;

            let dir: Direction = null;
            // * Map keys to directions
            if (e.key === 'ArrowUp' || e.key === 'w') dir = 'up';
            if (e.key === 'ArrowDown' || e.key === 's') dir = 'down';
            if (e.key === 'ArrowLeft' || e.key === 'a') dir = 'left';
            if (e.key === 'ArrowRight' || e.key === 'd') dir = 'right';

            if (dir) {
                engineRef.current.setDirection(dir);
                // * Auto-unpause on first key press
                if (isPaused) setPaused(false);
            }
        };

        /**
         * * Window resize handler
         * Recalculates grid size when window changes
         */
        const handleResize = () => {
            engineRef.current?.resize();
        };

        // * Add event listeners
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('resize', handleResize);

        // * Cleanup on unmount
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('resize', handleResize);
            engineRef.current?.pause();
        };
    }, [incrementScore, setCurrentSign, setPaused, isPaused]);

    /**
     * * Effect: Sync pause state with engine
     * 
     * When React state changes (isPaused or isWaitingForSign),
     * propagate to the GameEngine instance.
     */
    useEffect(() => {
        if (isPaused || isWaitingForSign) {
            engineRef.current?.pause();  // * Stop game loop
        } else {
            engineRef.current?.start();  // * Resume game loop
        }
    }, [isPaused, isWaitingForSign]);

    /**
     * * Effect: Handle sign overlay close
     * 
     * When sign overlay closes (isWaitingForSign → false),
     * determine whether user completed or cancelled:
     * - Completed: unfreeze() - resume game normally
     * - Cancelled: cancelPractice() - skip pellet
     */
    useEffect(() => {
        if (!isWaitingForSign && engineRef.current) {
            // * Check if user cancelled (via X button)
            const { lastActionWasCancel, setLastActionWasCancel } = useGameStore.getState();

            if (lastActionWasCancel) {
                // * User cancelled - skip this pellet
                engineRef.current.cancelPractice();
                setLastActionWasCancel(false);
            } else {
                // * User completed - resume normally
                engineRef.current.unfreeze();
            }
        }
    }, [isWaitingForSign]);

    // * Render canvas with pause overlay
    return (
        <div className="relative w-full h-[600px] border-4 border-blue-900 rounded-lg overflow-hidden bg-black">
            {/* Main game canvas */}
            <canvas
                ref={canvasRef}
                className="w-full h-full block"
            />

            {/* Pause overlay - shown when game is paused and waiting for first input */}
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
