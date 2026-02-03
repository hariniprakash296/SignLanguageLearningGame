import React from 'react';

export const ASL_SIGNS: Record<string, React.ReactNode> = {
    A: (
        <svg viewBox="0 0 100 100" fill="none" stroke="black" strokeWidth="2.2" strokeLinecap="round">
            {/* Wrist/Palm base */}
            <path d="M30,80 Q30,40 50,40 L60,40 Q70,40 70,80" fill="white" />
            {/* Curled fingers (fist) */}
            <path d="M35,45 Q50,42 65,45" />
            <path d="M35,55 Q50,52 65,55" />
            <path d="M35,65 Q50,62 65,65" />
            {/* Thumb on the side */}
            <path d="M70,45 Q85,45 85,65 Q85,80 70,75" fill="white" />
            <line x1="75" y1="55" x2="85" y2="55" />
        </svg>
    ),
    B: (
        <svg viewBox="0 0 100 100" fill="none" stroke="black" strokeWidth="2.2" strokeLinecap="round">
            <path d="M30,85 L30,25 Q30,20 35,20 L65,20 Q70,20 70,25 L70,85" fill="white" />
            <line x1="40" y1="20" x2="40" y2="60" />
            <line x1="50" y1="20" x2="50" y2="60" />
            <line x1="60" y1="20" x2="60" y2="60" />
            <line x1="30" y1="35" x2="70" y2="35" strokeOpacity="0.3" />
            <line x1="30" y1="50" x2="70" y2="50" strokeOpacity="0.3" />
            <path d="M30,60 Q50,60 55,75" />
        </svg>
    ),
    C: (
        <svg viewBox="0 0 100 100" fill="none" stroke="black" strokeWidth="2.2" strokeLinecap="round">
            <path d="M75,30 Q30,30 30,55 Q30,80 75,80" strokeWidth="3" />
            <path d="M75,30 Q70,28 65,35" />
            <path d="M75,80 Q70,82 65,75" />
            <line x1="40" y1="40" x2="50" y2="35" strokeOpacity="0.2" />
        </svg>
    ),
    D: (
        <svg viewBox="0 0 100 100" fill="none" stroke="black" strokeWidth="2.2" strokeLinecap="round">
            <path d="M35,80 L35,55 Q35,50 40,50 L65,50 Q70,50 70,55 L70,80 Z" fill="white" />
            <path d="M40,50 L40,15 Q40,10 45,10 Q50,10 50,15 L50,50" fill="white" />
            <line x1="40" y1="25" x2="50" y2="25" strokeOpacity="0.4" />
            <circle cx="58" cy="55" r="5" fill="white" />
            <path d="M70,60 Q65,60 62,55" />
        </svg>
    ),
    E: (
        <svg viewBox="0 0 100 100" fill="none" stroke="black" strokeWidth="2.2" strokeLinecap="round">
            {/* Palm/Fist base */}
            <path d="M30,80 L30,45 Q30,40 40,40 L65,40 Q70,40 70,45 L70,80 Z" fill="white" />
            {/* Curled fingers - tips pointing down toward palm */}
            <path d="M35,40 Q35,55 45,55" /> {/* Index curled */}
            <path d="M45,40 Q45,58 55,58" /> {/* Middle curled */}
            <path d="M55,40 Q55,55 62,55" /> {/* Ring curled */}
            {/* Thumb tucked UNDER fingers - positioned below fingertips */}
            <path d="M30,65 Q35,75 50,70 Q55,68 55,60" fill="white" />
            {/* Fingertips resting on thumb */}
            <circle cx="48" cy="58" r="3" fill="#f0f0f0" stroke="black" strokeWidth="1" />
            <line x1="45" y1="55" x2="50" y2="62" strokeOpacity="0.4" /> {/* Connection to thumb */}
        </svg>
    ),
    F: (
        <svg viewBox="0 0 100 100" fill="none" stroke="black" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="45" cy="45" r="10" fill="white" />
            <path d="M55,45 L80,25" />
            <path d="M55,50 L85,35" />
            <path d="M55,55 L90,45" />
        </svg>
    ),
    G: (
        <svg viewBox="0 0 100 100" fill="none" stroke="black" strokeWidth="2.2" strokeLinecap="round">
            <path d="M30,50 L70,50" />
            <path d="M30,40 L70,40 Q75,40 75,45 Q75,55 30,55" fill="white" />
        </svg>
    ),
    H: (
        <svg viewBox="0 0 100 100" fill="none" stroke="black" strokeWidth="2.2" strokeLinecap="round">
            <path d="M80,75 Q70,80 60,75 L50,65 Q40,60 45,55 L55,50" fill="white" />
            <path d="M50,38 L15,38 Q10,38 10,42 Q10,46 15,46 L50,46" fill="white" />
            <line x1="25" y1="38" x2="25" y2="46" />
            <line x1="38" y1="38" x2="38" y2="46" />
            <path d="M50,48 L15,48 Q10,48 10,52 Q10,56 15,56 L50,56" fill="white" />
            <line x1="25" y1="48" x2="25" y2="56" />
            <line x1="38" y1="48" x2="38" y2="56" />
            <path d="M50,56 Q40,56 40,43 Q40,38 50,38" fill="white" />
            <path d="M60,50 Q70,50 75,60 L80,75" strokeOpacity="0.5" />
        </svg>
    ),
    I: (
        <svg viewBox="0 0 100 100" fill="none" stroke="black" strokeWidth="2.2" strokeLinecap="round">
            <rect x="35" y="45" width="30" height="35" rx="5" fill="white" />
            <path d="M65,45 L65,20 Q65,15 70,15 Q75,15 75,20 L75,45" fill="white" />
        </svg>
    ),
    J: (
        <svg viewBox="0 0 100 100" fill="none" stroke="black" strokeWidth="2.2" strokeLinecap="round">
            <path d="M65,20 L65,60 Q65,80 45,80 Q25,80 25,60" />
            <rect x="35" y="45" width="30" height="20" rx="5" fill="white" />
        </svg>
    ),
    K: (
        <svg viewBox="0 0 100 100" fill="none" stroke="black" strokeWidth="2.2" strokeLinecap="round">
            <path d="M40,20 L40,80" />
            <path d="M60,20 L60,80" />
            <path d="M40,50 L60,50" />
            <path d="M40,70 L50,60 L65,80" />
        </svg>
    ),
    L: (
        <svg viewBox="0 0 100 100" fill="none" stroke="black" strokeWidth="2.2" strokeLinecap="round">
            <path d="M40,85 L40,15 Q40,10 45,10 L50,10 Q55,10 55,15 L55,65" fill="white" />
            <path d="M55,65 L85,65 Q90,65 90,70 Q90,75 85,75 L40,75" fill="white" />
            <line x1="40" y1="35" x2="55" y2="35" strokeOpacity="0.3" />
            <line x1="70" y1="65" x2="70" y2="75" strokeOpacity="0.3" />
        </svg>
    ),
    M: (
        <svg viewBox="0 0 100 100" fill="none" stroke="black" strokeWidth="2.2" strokeLinecap="round">
            <rect x="30" y="45" width="40" height="35" rx="5" fill="white" />
            <path d="M35,35 L35,45 M45,35 L45,45 M55,35 L55,45" />
        </svg>
    ),
    N: (
        <svg viewBox="0 0 100 100" fill="none" stroke="black" strokeWidth="2.2" strokeLinecap="round">
            <rect x="30" y="45" width="40" height="35" rx="5" fill="white" />
            <path d="M40,35 L40,45 M55,35 L55,45" />
        </svg>
    ),
    O: (
        <svg viewBox="0 0 100 100" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round">
            <path d="M50,20 Q30,20 30,50 Q30,80 50,80 Q70,80 70,50 Q70,20 50,20 Z" fill="white" />
            <path d="M50,25 Q40,25 40,50 Q40,75 50,75 Q60,75 60,50 Q60,25 50,25" strokeOpacity="0.3" />
        </svg>
    ),
    P: (
        <svg viewBox="0 0 100 100" fill="none" stroke="black" strokeWidth="2.2" strokeLinecap="round">
            <path d="M40,80 L40,20" />
            <circle cx="55" cy="40" r="15" fill="white" />
        </svg>
    ),
    Q: (
        <svg viewBox="0 0 100 100" fill="none" stroke="black" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="50" cy="45" r="20" fill="white" />
            <line x1="60" y1="60" x2="80" y2="80" />
        </svg>
    ),
    R: (
        <svg viewBox="0 0 100 100" fill="none" stroke="black" strokeWidth="2.2" strokeLinecap="round">
            <path d="M40,20 Q60,20 50,80" />
            <path d="M60,20 Q40,20 50,80" />
        </svg>
    ),
    S: (
        <svg viewBox="0 0 100 100" fill="none" stroke="black" strokeWidth="2.2" strokeLinecap="round">
            <rect x="30" y="35" width="40" height="45" rx="15" fill="white" />
            <path d="M30,55 Q50,45 70,55" />
        </svg>
    ),
    T: (
        <svg viewBox="0 0 100 100" fill="none" stroke="black" strokeWidth="2.2" strokeLinecap="round">
            <rect x="30" y="45" width="40" height="35" rx="5" fill="white" />
            <path d="M45,35 L45,55" />
        </svg>
    ),
    U: (
        <svg viewBox="0 0 100 100" fill="none" stroke="black" strokeWidth="2.2" strokeLinecap="round">
            <rect x="35" y="45" width="30" height="35" rx="5" fill="white" />
            <path d="M40,10 L40,45 M60,10 L60,45" />
        </svg>
    ),
    V: (
        <svg viewBox="0 0 100 100" fill="none" stroke="black" strokeWidth="2.2" strokeLinecap="round">
            <path d="M35,60 L35,80 L65,80 L65,60" />
            <path d="M35,60 L20,20" />
            <path d="M65,60 L80,20" />
            <rect x="35" y="60" width="30" height="20" fill="white" />
        </svg>
    ),
    W: (
        <svg viewBox="0 0 100 100" fill="none" stroke="black" strokeWidth="2.2" strokeLinecap="round">
            <path d="M30,80 L30,60 L20,20" />
            <path d="M50,80 L50,20" />
            <path d="M70,80 L70,60 L80,20" />
            <rect x="30" y="60" width="40" height="20" fill="white" />
        </svg>
    ),
    X: (
        <svg viewBox="0 0 100 100" fill="none" stroke="black" strokeWidth="2.2" strokeLinecap="round">
            <path d="M40,50 Q40,15 65,30" />
            <rect x="35" y="50" width="30" height="30" rx="5" fill="white" />
        </svg>
    ),
    Y: (
        <svg viewBox="0 0 100 100" fill="none" stroke="black" strokeWidth="2.2" strokeLinecap="round">
            <rect x="35" y="45" width="30" height="35" rx="5" fill="white" />
            <path d="M35,45 L15,30" />
            <path d="M65,45 L85,30" />
        </svg>
    ),
    Z: (
        <svg viewBox="0 0 100 100" fill="none" stroke="black" strokeWidth="2.2" strokeLinecap="round">
            <path d="M30,30 L70,30 L30,70 L70,70" />
        </svg>
    ),
};
