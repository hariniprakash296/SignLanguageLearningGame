"use client";

import React, { useState } from 'react';
import { ASL_SIGNS } from '@/lib/asl-signs';

// Map of available ASL images (generated images A-E)
const AVAILABLE_IMAGES: Record<string, boolean> = {
    A: true, B: true, C: true, D: true, E: true, F: true, G: true, H: true, I: true, J: true, K: true, L: true, M: true, N: true, O: true, P: true, Q: true, R: true, S: true, T: true, U: true, V: true, W: true, X: true, Y: true, Z: true
};

// ASL hand descriptions for letters without images
const ASL_DESCRIPTIONS: Record<string, string> = {
    A: "Fist with thumb on the side",
    B: "Flat hand, fingers up, thumb across palm",
    C: "Curved hand like holding a ball",
    D: "Index up, thumb touches middle finger",
    E: "Fingers curled, thumb under fingertips",
    F: "Thumb + index make circle, 3 fingers up",
    G: "Index + thumb point sideways",
    H: "Index + middle extended horizontally",
    I: "Pinky up, rest in fist",
    J: "Pinky up, trace a J shape",
    K: "Index + middle up in V, thumb between",
    L: "L-shape with thumb + index",
    M: "Thumb under 3 fingers over fist",
    N: "Thumb under 2 fingers over fist",
    O: "All fingers touch thumb, forming O",
    P: "Like K but pointing down",
    Q: "Like G but pointing down",
    R: "Index + middle crossed",
    S: "Fist with thumb over fingers",
    T: "Thumb between index + middle",
    U: "Index + middle up together",
    V: "Index + middle up in V shape",
    W: "Index, middle, ring up spread",
    X: "Index bent like a hook",
    Y: "Thumb + pinky out, rest folded",
    Z: "Index traces Z in air"
};

const ASL_SVG: Record<string, React.ReactNode> = {
    H: (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="black" strokeWidth="2">
            {/* Hand Body / Side View */}
            <path d="M75,75 Q65,80 55,75 L45,65 Q40,60 45,55 L55,50" />
            {/* Index Finger (Horizontal segments) */}
            <path d="M45,38 L15,38 Q10,38 10,42 Q10,46 15,46 L45,46" fill="white" />
            <line x1="25" y1="38" x2="25" y2="46" /> {/* Joint */}
            <line x1="35" y1="38" x2="35" y2="46" /> {/* Joint */}

            {/* Middle Finger (Horizontal segments below index) */}
            <path d="M45,48 L15,48 Q10,48 10,52 Q10,56 15,56 L45,56" fill="white" />
            <line x1="25" y1="48" x2="25" y2="56" /> {/* Joint */}
            <line x1="35" y1="48" x2="35" y2="56" /> {/* Joint */}

            {/* Thumb tucked under fingers */}
            <path d="M45,56 Q35,56 35,45 Q35,38 45,38" />

            {/* Palm crease/wrist */}
            <path d="M55,50 Q65,50 70,60 L75,75" />
            <path d="M45,65 Q50,75 70,85" />
        </svg>
    ),
    A: (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="black" strokeWidth="2.5">
            <rect x="30" y="35" width="40" height="45" rx="8" fill="white" />
            {/* Thumb on side */}
            <path d="M70,45 Q85,45 85,60 Q85,75 70,75" fill="white" />
            {/* Finger lines */}
            <line x1="30" y1="50" x2="70" y2="50" />
            <line x1="30" y1="65" x2="70" y2="65" />
        </svg>
    ),
    B: (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="black" strokeWidth="2.5">
            {/* Palm/Knuckles */}
            <rect x="30" y="20" width="40" height="60" rx="5" fill="white" />
            {/* Four fingers up */}
            <line x1="40" y1="20" x2="40" y2="60" />
            <line x1="50" y1="20" x2="50" y2="60" />
            <line x1="60" y1="20" x2="60" y2="60" />
            {/* Thumb across */}
            <path d="M30,55 Q50,55 50,75" fill="white" />
        </svg>
    ),
    C: (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="black" strokeWidth="2.5">
            <path d="M70,30 Q30,30 30,50 Q30,75 70,75" strokeLinecap="round" />
            <path d="M70,30 L60,35" />
            <path d="M70,75 L60,70" />
        </svg>
    ),
    D: (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="black" strokeWidth="2.5">
            {/* Index up */}
            <path d="M45,20 L45,55 Q45,35 60,35 Q75,35 75,55 L75,80 L30,80 L30,55 Q30,20 45,20 Z" fill="white" />
            {/* Thumb touching curled fingers */}
            <circle cx="55" cy="55" r="5" />
        </svg>
    )
};

interface SignDisplayProps {
    sign: string;
    size?: 'sm' | 'md' | 'lg';
    showDescription?: boolean;
    showAnimation?: boolean;
}

export const SignDisplay: React.FC<SignDisplayProps> = ({
    sign,
    size = 'md',
    showDescription = true,
    showAnimation = false
}) => {
    const [imageError, setImageError] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    const safeSign = String(sign || '');
    const isWord = safeSign.length > 1;

    // Determine the letter to show - with safety guards for transition periods
    let currentLetter = '';
    if (isWord && showAnimation) {
        const char = safeSign[currentIndex];
        currentLetter = char ? char.toUpperCase() : (safeSign[0] ? safeSign[0].toUpperCase() : '');
    } else {
        currentLetter = safeSign ? safeSign.toUpperCase() : '';
    }

    const hasImage = AVAILABLE_IMAGES[currentLetter] && !imageError;
    const hasSVG = !!ASL_SIGNS[currentLetter];

    // Cycle through word letters if showAnimation is true
    React.useEffect(() => {
        setCurrentIndex(0); // Reset index when sign changes

        if (isWord && showAnimation && safeSign.length > 0) {
            const interval = setInterval(() => {
                setCurrentIndex((prev) => (prev + 1) % safeSign.length);
            }, 1200);
            return () => clearInterval(interval);
        }
    }, [isWord, showAnimation, safeSign]);

    const sizeClasses = {
        sm: 'w-24 h-24',
        md: 'w-48 h-48',
        lg: 'w-full max-w-[400px] h-64'
    };

    return (
        <div className="flex flex-col items-center gap-4 w-full">
            <div className={`${sizeClasses[size]} rounded-2xl overflow-hidden bg-white border-2 border-slate-100 flex items-center justify-center shadow-xl p-4 relative`}>
                <div className="grid grid-cols-2 w-full h-full gap-4 items-center">
                    {/* Letter Panel */}
                    <div className="flex flex-col items-center justify-center bg-blue-50 rounded-xl h-full">
                        <span className="text-7xl font-black text-blue-600">
                            {currentLetter}
                        </span>
                        <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mt-1">Character</span>
                    </div>

                    {/* Sign Panel */}
                    <div className="flex items-center justify-center h-full p-2">
                        {hasImage ? (
                            <img
                                src={`/assets/asl/${currentLetter.toLowerCase()}.png`}
                                alt={`ASL sign for ${currentLetter}`}
                                className="w-full h-full object-contain"
                                onError={() => setImageError(true)}
                            />
                        ) : hasSVG ? (
                            <div className="w-full h-full flex items-center justify-center p-1">
                                <div className="w-full h-full transform scale-125 drop-shadow-md">
                                    {ASL_SIGNS[currentLetter]}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center font-bold text-slate-300 italic text-sm">
                                🤟 Hand Sign<br />Incoming
                            </div>
                        )}
                    </div>
                </div>

                {/* Progress dot for word sequencing */}
                {isWord && (
                    <div className="absolute top-2 right-2 flex gap-1">
                        {sign.split('').map((_, i) => (
                            <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === currentIndex ? 'bg-blue-600' : 'bg-slate-200'}`} />
                        ))}
                    </div>
                )}
            </div>

            {showDescription && (
                <div className="text-center bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-tight">
                        {isWord ? `Spelling: ${safeSign.toUpperCase()}` : (ASL_DESCRIPTIONS[currentLetter] || `Position: ${currentLetter}`)}
                    </p>
                </div>
            )}
        </div>
    );
};
