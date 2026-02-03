// Initialized Signs for Level 2
// These are ASL signs where the handshape uses the first letter of the English word

export interface InitializedSign {
    word: string;
    letter: string; // The initial letter handshape used
    description: string;
    movement: string;
    videoUrl?: string;
}

export const INITIALIZED_SIGNS: InitializedSign[] = [
    // Common initialized signs for beginners
    {
        word: 'FAMILY',
        letter: 'F',
        description: 'Make F handshape with both hands',
        movement: 'Start with F hands touching at thumbs in front of body, then circle outward and meet again at pinkies',
    },
    {
        word: 'WATER',
        letter: 'W',
        description: 'Make W handshape',
        movement: 'Tap W hand to chin twice',
    },
    {
        word: 'CLASS',
        letter: 'C',
        description: 'Make C handshapes with both hands',
        movement: 'Start with C hands together, then circle outward and back together',
    },
    {
        word: 'TEAM',
        letter: 'T',
        description: 'Make T handshapes with both hands',
        movement: 'Start with T hands together in front, move apart in arc',
    },
    {
        word: 'GROUP',
        letter: 'G',
        description: 'Make G handshapes with both hands',
        movement: 'Similar to TEAM - move G hands apart in circular motion',
    },
    {
        word: 'TRY',
        letter: 'T',
        description: 'Make T handshapes with both hands',
        movement: 'Move T hands forward with effort',
    },
    {
        word: 'GOVERNMENT',
        letter: 'G',
        description: 'Make G handshape',
        movement: 'Touch G hand to temple and twist wrist',
    },
    {
        word: 'LANGUAGE',
        letter: 'L',
        description: 'Make L handshapes with both hands',
        movement: 'Move L hands apart horizontally',
    },
    // Days of the week (all initialized!)
    {
        word: 'MONDAY',
        letter: 'M',
        description: 'Make M handshape',
        movement: 'Small circular motion in front of body',
    },
    {
        word: 'TUESDAY',
        letter: 'T',
        description: 'Make T handshape',
        movement: 'Small circular motion in front of body',
    },
    {
        word: 'WEDNESDAY',
        letter: 'W',
        description: 'Make W handshape',
        movement: 'Small circular motion in front of body',
    },
    {
        word: 'THURSDAY',
        letter: 'H', // Uses H in some dialects, or TH compound
        description: 'Make H handshape (or T-H movement)',
        movement: 'Small circular motion in front of body',
    },
    {
        word: 'FRIDAY',
        letter: 'F',
        description: 'Make F handshape',
        movement: 'Small circular motion in front of body',
    },
    {
        word: 'SATURDAY',
        letter: 'S',
        description: 'Make S handshape',
        movement: 'Small circular motion in front of body',
    },
    // Colors (some are initialized)
    {
        word: 'BLUE',
        letter: 'B',
        description: 'Make B handshape',
        movement: 'Shake B hand slightly side to side',
    },
    {
        word: 'GREEN',
        letter: 'G',
        description: 'Make G handshape',
        movement: 'Shake G hand slightly side to side',
    },
    {
        word: 'PURPLE',
        letter: 'P',
        description: 'Make P handshape',
        movement: 'Shake P hand slightly side to side',
    },
    {
        word: 'YELLOW',
        letter: 'Y',
        description: 'Make Y handshape',
        movement: 'Shake Y hand at wrist, twisting motion',
    },
];

// Get signs grouped by their initial letter for teaching progression
export function getSignsByLetter(letter: string): InitializedSign[] {
    return INITIALIZED_SIGNS.filter(sign => sign.letter === letter.toUpperCase());
}

// Get a random subset of initialized signs for practice
export function getRandomSigns(count: number): InitializedSign[] {
    const shuffled = [...INITIALIZED_SIGNS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

// Level 2 word list (subset for game progression)
export const LEVEL_2_WORDS = [
    'FAMILY', 'WATER', 'CLASS', 'TEAM', 'TRY',
    'MONDAY', 'TUESDAY', 'WEDNESDAY', 'FRIDAY',
    'BLUE', 'GREEN', 'PURPLE', 'YELLOW'
];
