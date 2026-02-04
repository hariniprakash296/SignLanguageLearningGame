/**
 * =============================================================================
 * FILE: initialized-signs.ts
 * =============================================================================
 * 
 * C4 MODEL CONTEXT:
 * - Container: Frontend (Next.js/React Application)
 * - Component: Initialized Signs Data (Level 2 Curriculum)
 * - Responsibility: Define initialized ASL signs grouped by families
 * 
 * WHAT IS INITIALIZATION?
 * In ASL, "initialized signs" are signs where the handshape uses the 
 * first letter of the English word. Many words in the same semantic 
 * family share the SAME movement but use DIFFERENT letter handshapes.
 * 
 * EXAMPLE - "Educators" family:
 * - TEACHER: Uses 'T' handshape + teaching motion
 * - TUTOR: Uses 'T' handshape + similar motion
 * - COACH: Uses 'C' handshape + similar motion
 * - INSTRUCTOR: Uses 'I' handshape + similar motion
 * 
 * This file organizes signs into:
 * 1. Sign Families (same root movement, different letters)
 * 2. Individual signs with descriptions
 * 3. Level 2 word progression
 * 
 * =============================================================================
 */

/**
 * * Individual initialized sign definition
 */
export interface InitializedSign {
    word: string;           // * The English word
    letter: string;         // * The initial letter handshape used (A-Z)
    description: string;    // * How to make the handshape
    movement: string;       // * The movement component of the sign
    family: string;         // * Which family this belongs to
    videoUrl?: string;      // * Optional video demonstration
}

/**
 * * Sign family - groups words that share the same root movement
 * 
 * Families help learners understand that:
 * - Same movement + different letter = related concept
 * - This is a common pattern in ASL
 */
export interface SignFamily {
    id: string;             // * Unique identifier
    name: string;           // * Display name (e.g., "People Who Educate")
    description: string;    // * Explanation of the family
    rootMovement: string;   // * The base movement shared by all members
    words: string[];        // * List of words in this family
    color: string;          // * UI color theme for this family
}

// =============================================================================
// SIGN FAMILIES - Grouped by Root Movement
// =============================================================================

export const SIGN_FAMILIES: SignFamily[] = [
    {
        id: 'educators',
        name: 'People Who Educate 🎓',
        description: 'These signs all share a movement related to sharing knowledge. Change the letter to change the type of educator!',
        rootMovement: 'Both hands move from forehead forward, as if passing knowledge to someone',
        words: ['TEACHER', 'TUTOR', 'INSTRUCTOR', 'COACH'],
        color: 'purple'
    },
    {
        id: 'local-place',
        name: 'Local & Place-Related 📍',
        description: 'These signs use a circular movement near the body to indicate something local or place-based.',
        rootMovement: 'Circular motion in front of body or near specific location',
        words: ['LOCAL', 'CULTURE', 'COMMUNITY', 'CUSTOM'],
        color: 'blue'
    },
    {
        id: 'days-of-week',
        name: 'Days of the Week 📅',
        description: 'All days use the same circular movement - just change the letter to change the day!',
        rootMovement: 'Small circular motion in front of body',
        words: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
        color: 'green'
    },
    {
        id: 'colors',
        name: 'Colors 🎨',
        description: 'Many colors in ASL are initialized signs with a shaking motion.',
        rootMovement: 'Shake handshape slightly side to side',
        words: ['BLUE', 'GREEN', 'PURPLE', 'YELLOW'],
        color: 'orange'
    },
    {
        id: 'groups-collections',
        name: 'Groups & Collections 👥',
        description: 'Words about groups of people or things use similar circular-apart movements.',
        rootMovement: 'Start together, move apart in arc',
        words: ['FAMILY', 'TEAM', 'GROUP', 'CLASS', 'ASSOCIATION'],
        color: 'pink'
    },
    {
        id: 'try-effort',
        name: 'Effort & Attempt 💪',
        description: 'Signs about trying or making effort use forward pushing motions.',
        rootMovement: 'Move hands forward with effort/determination',
        words: ['TRY', 'ATTEMPT', 'EFFORT'],
        color: 'red'
    },
    {
        id: 'language-communication',
        name: 'Language & Communication 💬',
        description: 'Signs about language and communication often use L or horizontal movements.',
        rootMovement: 'Horizontal movement away from mouth/body',
        words: ['LANGUAGE', 'LAW', 'LECTURE'],
        color: 'cyan'
    },
    {
        id: 'water-drinks',
        name: 'Water & Drinks 💧',
        description: 'Water and some drink signs tap near the chin or mouth area.',
        rootMovement: 'Tap handshape to chin',
        words: ['WATER', 'WINE'],
        color: 'sky'
    }
];

// =============================================================================
// INDIVIDUAL SIGN DEFINITIONS
// =============================================================================

export const INITIALIZED_SIGNS: InitializedSign[] = [
    // --- EDUCATORS FAMILY ---
    {
        word: 'TEACHER',
        letter: 'T',
        description: 'Make T handshapes with both hands near temples',
        movement: 'Move T hands forward from temples, as if sharing knowledge',
        family: 'educators'
    },
    {
        word: 'TUTOR',
        letter: 'T',
        description: 'Make T handshapes with both hands',
        movement: 'Similar to TEACHER - forward motion from head area',
        family: 'educators'
    },
    {
        word: 'INSTRUCTOR',
        letter: 'I',
        description: 'Make I handshapes (pinkies up)',
        movement: 'Forward teaching motion from head',
        family: 'educators'
    },
    {
        word: 'COACH',
        letter: 'C',
        description: 'Make C handshapes with both hands',
        movement: 'Forward motion with encouraging movement',
        family: 'educators'
    },

    // --- LOCAL / PLACE FAMILY ---
    {
        word: 'LOCAL',
        letter: 'L',
        description: 'Make L handshape',
        movement: 'Small circular motion near body',
        family: 'local-place'
    },
    {
        word: 'CULTURE',
        letter: 'C',
        description: 'Make C handshape',
        movement: 'Circular motion near shoulder, similar to LOCAL',
        family: 'local-place'
    },
    {
        word: 'COMMUNITY',
        letter: 'C',
        description: 'Make C handshapes with both hands',
        movement: 'Circular motion bringing hands together',
        family: 'local-place'
    },
    {
        word: 'CUSTOM',
        letter: 'C',
        description: 'Make C handshape on top of S fist',
        movement: 'Downward motion like establishing something',
        family: 'local-place'
    },

    // --- DAYS OF THE WEEK FAMILY ---
    {
        word: 'MONDAY',
        letter: 'M',
        description: 'Make M handshape (thumb between index, middle, ring fingers)',
        movement: 'Small circular motion in front of body',
        family: 'days-of-week'
    },
    {
        word: 'TUESDAY',
        letter: 'T',
        description: 'Make T handshape (thumb between index and middle)',
        movement: 'Small circular motion in front of body',
        family: 'days-of-week'
    },
    {
        word: 'WEDNESDAY',
        letter: 'W',
        description: 'Make W handshape (three fingers up)',
        movement: 'Small circular motion in front of body',
        family: 'days-of-week'
    },
    {
        word: 'THURSDAY',
        letter: 'H',
        description: 'Make H handshape (or TH compound in some regions)',
        movement: 'Small circular motion in front of body',
        family: 'days-of-week'
    },
    {
        word: 'FRIDAY',
        letter: 'F',
        description: 'Make F handshape (thumb and index touching)',
        movement: 'Small circular motion in front of body',
        family: 'days-of-week'
    },
    {
        word: 'SATURDAY',
        letter: 'S',
        description: 'Make S handshape (fist with thumb over fingers)',
        movement: 'Small circular motion in front of body',
        family: 'days-of-week'
    },
    {
        word: 'SUNDAY',
        letter: 'S',
        description: 'Make open palms facing out',
        movement: 'Both hands move in small circles, palms out',
        family: 'days-of-week'
    },

    // --- COLORS FAMILY ---
    {
        word: 'BLUE',
        letter: 'B',
        description: 'Make B handshape (flat hand, fingers together)',
        movement: 'Shake B hand slightly side to side with wrist twist',
        family: 'colors'
    },
    {
        word: 'GREEN',
        letter: 'G',
        description: 'Make G handshape (index and thumb pointing out)',
        movement: 'Shake G hand slightly side to side',
        family: 'colors'
    },
    {
        word: 'PURPLE',
        letter: 'P',
        description: 'Make P handshape (like K but pointing down)',
        movement: 'Shake P hand slightly side to side',
        family: 'colors'
    },
    {
        word: 'YELLOW',
        letter: 'Y',
        description: 'Make Y handshape (thumb and pinky out)',
        movement: 'Shake Y hand at wrist with twisting motion',
        family: 'colors'
    },

    // --- GROUPS / COLLECTIONS FAMILY ---
    {
        word: 'FAMILY',
        letter: 'F',
        description: 'Make F handshapes with both hands',
        movement: 'Start with F hands touching at thumbs, circle outward and meet at pinkies',
        family: 'groups-collections'
    },
    {
        word: 'TEAM',
        letter: 'T',
        description: 'Make T handshapes with both hands',
        movement: 'Start together in front, move apart in arc',
        family: 'groups-collections'
    },
    {
        word: 'GROUP',
        letter: 'G',
        description: 'Make G handshapes with both hands',
        movement: 'Start together, move apart and around in circle to meet again',
        family: 'groups-collections'
    },
    {
        word: 'CLASS',
        letter: 'C',
        description: 'Make C handshapes with both hands',
        movement: 'Start with C hands together, circle outward and back together',
        family: 'groups-collections'
    },
    {
        word: 'ASSOCIATION',
        letter: 'A',
        description: 'Make A handshapes with both hands',
        movement: 'Circular motion bringing hands together',
        family: 'groups-collections'
    },

    // --- TRY / EFFORT FAMILY ---
    {
        word: 'TRY',
        letter: 'T',
        description: 'Make T handshapes with both hands',
        movement: 'Move T hands forward with effort and determination',
        family: 'try-effort'
    },
    {
        word: 'ATTEMPT',
        letter: 'A',
        description: 'Make A handshapes with both hands',
        movement: 'Forward pushing motion similar to TRY',
        family: 'try-effort'
    },
    {
        word: 'EFFORT',
        letter: 'E',
        description: 'Make E handshapes with both hands',
        movement: 'Forward motion showing exertion',
        family: 'try-effort'
    },

    // --- LANGUAGE / COMMUNICATION FAMILY ---
    {
        word: 'LANGUAGE',
        letter: 'L',
        description: 'Make L handshapes with both hands',
        movement: 'Move L hands apart horizontally, thumbs pointing up',
        family: 'language-communication'
    },
    {
        word: 'LAW',
        letter: 'L',
        description: 'Make L handshape on palm of other hand',
        movement: 'Tap L on palm twice, like stamping a document',
        family: 'language-communication'
    },
    {
        word: 'LECTURE',
        letter: 'L',
        description: 'Make L handshape',
        movement: 'Arc L hand forward from near face, like projecting words',
        family: 'language-communication'
    },

    // --- WATER / DRINKS FAMILY ---
    {
        word: 'WATER',
        letter: 'W',
        description: 'Make W handshape (three fingers up)',
        movement: 'Tap W hand to chin twice',
        family: 'water-drinks'
    },
    {
        word: 'WINE',
        letter: 'W',
        description: 'Make W handshape',
        movement: 'Circle W hand on cheek',
        family: 'water-drinks'
    }
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * * Get all signs belonging to a family
 */
export function getSignsByFamily(familyId: string): InitializedSign[] {
    return INITIALIZED_SIGNS.filter(sign => sign.family === familyId);
}

/**
 * * Get family info by ID
 */
export function getFamilyById(familyId: string): SignFamily | undefined {
    return SIGN_FAMILIES.find(f => f.id === familyId);
}

/**
 * * Get signs grouped by their initial letter for teaching progression
 */
export function getSignsByLetter(letter: string): InitializedSign[] {
    return INITIALIZED_SIGNS.filter(sign => sign.letter === letter.toUpperCase());
}

/**
 * * Get a random subset of initialized signs for practice
 */
export function getRandomSigns(count: number): InitializedSign[] {
    const shuffled = [...INITIALIZED_SIGNS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

// =============================================================================
// LEVEL 2 PROGRESSION
// =============================================================================

/**
 * * Level 2 teaches families in order
 * Start with groups/collections, then days, then colors, then educators
 */
export const LEVEL_2_FAMILIES = [
    'groups-collections',
    'days-of-week',
    'colors',
    'educators',
    'local-place'
];

/**
 * * Get all words for Level 2 in order
 */
export function getLevel2Words(): string[] {
    const words: string[] = [];
    for (const familyId of LEVEL_2_FAMILIES) {
        const family = getFamilyById(familyId);
        if (family) {
            words.push(...family.words);
        }
    }
    return words;
}

// Legacy export for backwards compatibility
export const LEVEL_2_WORDS = getLevel2Words();
