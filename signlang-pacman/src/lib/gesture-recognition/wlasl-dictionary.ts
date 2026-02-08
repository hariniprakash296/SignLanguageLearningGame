/**
 * WLASL Dictionary - 100 Common ASL Signs
 * 
 * Based on standard ASL handshapes and movements.
 * Reference: WLASL dataset, ASL dictionaries, and educational sources.
 */

export interface WLASLDefinition {
    category: string;
    handshape: string;        // Primary handshape
    movement?: string;        // Movement type
    orientation?: string;     // Hand orientation
    location?: string;        // Body location
    notes?: string;           // Recognition notes
}

export const WLASL_DICTIONARY: Record<string, WLASLDefinition> = {
    // ==========================================================================
    // PRONOUNS - Simplified to avoid ambiguity
    // Note: In ASL, HE/SHE/IT are the same sign (point to side)
    // We combine ambiguous pronouns and rely on context
    // ==========================================================================
    "ME": {
        category: "Pronoun",
        handshape: "POINT",
        movement: "STATIC",
        location: "BODY",
        notes: "Point at self - requires hand near chest (static hold)"
    },
    "YOU": {
        category: "Pronoun",
        handshape: "POINT",
        movement: "FORWARD",
        notes: "Point forward at other person"
    },
    "THEY": {
        category: "Pronoun",
        handshape: "POINT",
        movement: "ARC",
        notes: "Sweep index finger in arc motion"
    },

    // ==========================================================================
    // BASIC VERBS
    // ==========================================================================
    "COME": {
        category: "Verb",
        handshape: "POINT",
        movement: "BACKWARD",
        notes: "Index fingers move toward signer"
    },
    "GO": {
        category: "Verb",
        handshape: "V_SHAPE",  // Two fingers pointing/moving forward
        movement: "FORWARD",
        notes: "Two index fingers move away from signer"
    },
    "EAT": {
        category: "Verb",
        handshape: "O_SHAPE",
        movement: "TAP",
        location: "FACE",
        notes: "Flattened O hand taps mouth"
    },
    "DRINK": {
        category: "Verb",
        handshape: "C_SHAPE",
        movement: "ARC",
        location: "FACE",
        notes: "C-hand tips up to mouth like holding cup"
    },
    "SLEEP": {
        category: "Verb",
        handshape: "OPEN_PALM",
        movement: "DOWN",
        location: "FACE",
        notes: "Open hand draws down over face"
    },
    "WANT": {
        category: "Verb",
        handshape: "OPEN_PALM",  // Open hands with bent fingers pulling in (claw)
        movement: "BACKWARD",
        notes: "Open hands pull toward body with clawing motion"
    },
    "LIKE": {
        category: "Verb",
        handshape: "OPEN_PALM",
        movement: "FORWARD",
        location: "BODY",
        notes: "Thumb and middle finger pull from chest"
    },
    "LOVE": {
        category: "Verb",
        handshape: "S_SHAPE",
        movement: "STATIC",
        location: "BODY",
        notes: "Crossed fists on chest"
    },
    "HELP": {
        category: "Verb",
        handshape: "S_SHAPE",
        movement: "UP",
        notes: "Thumb up on palm, moves upward"
    },
    "WALK": {
        category: "Verb",
        handshape: "FLAT_HAND",
        movement: "SHAKE",
        orientation: "DOWN",
        notes: "Flat hands alternate forward motion"
    },
    "RUN": {
        category: "Verb",
        handshape: "L_SHAPE",
        movement: "FORWARD",
        notes: "L-hands hook together, move forward fast"
    },
    "STOP": {
        category: "Verb",
        handshape: "FLAT_HAND",
        movement: "DOWN",
        notes: "Flat hand chops down on other palm"
    },
    "LOOK": {
        category: "Verb",
        handshape: "V_SHAPE",
        movement: "FORWARD",
        location: "FACE",
        notes: "V-hand from eyes outward"
    },
    "SEE": {
        category: "Verb",
        handshape: "V_SHAPE",
        movement: "FORWARD",
        location: "FACE",
        notes: "Same as LOOK"
    },
    "HEAR": {
        category: "Verb",
        handshape: "POINT",
        movement: "TAP",
        location: "FACE",
        notes: "Index finger points to ear"
    },
    "KNOW": {
        category: "Verb",
        handshape: "FLAT_HAND",
        movement: "TAP",
        location: "FACE",
        notes: "Fingertips tap forehead"
    },
    "THINK": {
        category: "Verb",
        handshape: "POINT",
        movement: "CIRCULAR",
        location: "FACE",
        notes: "Index finger circles near forehead"
    },
    "WORK": {
        category: "Verb",
        handshape: "S_SHAPE",
        movement: "TAP",
        notes: "Fist taps on other fist"
    },
    "PLAY": {
        category: "Verb",
        handshape: "Y_SHAPE",
        movement: "SHAKE",
        notes: "Y-hands shake side to side"
    },
    "LEARN": {
        category: "Verb",
        handshape: "FLAT_HAND",
        movement: "UP",
        location: "FACE",
        notes: "Flat hand from palm to forehead"
    },
    "TEACH": {
        category: "Verb",
        handshape: "O_SHAPE",
        movement: "FORWARD",
        location: "FACE",
        notes: "O-hands at temples, move forward"
    },

    // ==========================================================================
    // TRANSPORTATION
    // ==========================================================================
    "DRIVE": {
        category: "Transportation",
        handshape: "S_SHAPE",
        movement: "CIRCULAR",
        notes: "S-hands rotate like steering wheel"
    },
    "CAR": {
        category: "Transportation",
        handshape: "S_SHAPE",
        movement: "SHAKE",
        notes: "Same as DRIVE but smaller motion"
    },

    // ==========================================================================
    // COMMUNICATION
    // ==========================================================================
    "CALL": {
        category: "Communication",
        handshape: "C_SHAPE",  // Cupped hand to ear (phone gesture)
        movement: "STATIC",   // Hold near face
        location: "FACE",
        notes: "Cupped hand held to ear like phone. Y-SHAPE variant also common."
    },
    "SAY": {
        category: "Communication",
        handshape: "POINT",
        movement: "CIRCULAR",
        location: "FACE",
        notes: "Index finger circles near mouth"
    },
    "TALK": {
        category: "Communication",
        handshape: "POINT",
        movement: "TAP",
        location: "FACE",
        notes: "Index finger taps chin repeatedly"
    },
    "ASK": {
        category: "Communication",
        handshape: "POINT",
        movement: "FORWARD",
        notes: "Index finger moves from chin outward, curving"
    },
    "ANSWER": {
        category: "Communication",
        handshape: "POINT",
        movement: "FORWARD",
        location: "FACE",
        notes: "Index at lips flicks forward"
    },

    // ==========================================================================
    // PEOPLE / FAMILY
    // ==========================================================================
    "MOTHER": {
        category: "Family",
        handshape: "OPEN_PALM",
        movement: "TAP",
        location: "FACE",
        notes: "Thumb taps chin"
    },
    "FATHER": {
        category: "Family",
        handshape: "OPEN_PALM",
        movement: "TAP",
        location: "FACE",
        notes: "Thumb taps forehead"
    },
    "BOY": {
        category: "Family",
        handshape: "C_SHAPE",
        movement: "TAP",
        location: "FACE",
        notes: "Open C at forehead closes"
    },
    "GIRL": {
        category: "Family",
        handshape: "S_SHAPE",
        movement: "DOWN",
        location: "FACE",
        notes: "Thumb traces jaw"
    },
    "MAN": {
        category: "Family",
        handshape: "OPEN_PALM",
        movement: "DOWN",
        location: "FACE",
        notes: "Open hand at forehead moves to chest"
    },
    "WOMAN": {
        category: "Family",
        handshape: "OPEN_PALM",
        movement: "DOWN",
        location: "FACE",
        notes: "Thumb at chin moves to chest"
    },
    "FRIEND": {
        category: "Family",
        handshape: "POINT",
        movement: "TAP",
        notes: "Index fingers hook and reverse"
    },
    "BABY": {
        category: "Family",
        handshape: "FLAT_HAND",
        movement: "SHAKE",
        location: "BODY",
        notes: "Arms cradle and rock"
    },

    // ==========================================================================
    // GREETINGS / POLITENESS
    // ==========================================================================
    "HELLO": {
        category: "Greeting",
        handshape: "OPEN_PALM",
        movement: "SHAKE",
        orientation: "UP",
        notes: "Open palm waves side to side"
    },
    "BYE": {
        category: "Greeting",
        handshape: "OPEN_PALM",
        movement: "SHAKE",
        notes: "Open palm waves"
    },
    "PLEASE": {
        category: "Polite",
        handshape: "FLAT_HAND",
        movement: "CIRCULAR",
        location: "BODY",
        notes: "Flat hand circles on chest"
    },
    "THANK-YOU": {
        category: "Polite",
        handshape: "FLAT_HAND",
        movement: "FORWARD",
        location: "FACE",
        notes: "Flat hand from chin moves forward"
    },
    "SORRY": {
        category: "Polite",
        handshape: "S_SHAPE",
        movement: "CIRCULAR",
        location: "BODY",
        notes: "Fist circles on chest"
    },
    "YES": {
        category: "Response",
        handshape: "S_SHAPE",
        movement: "TAP",
        notes: "Fist nods up and down"
    },
    "NO": {
        category: "Response",
        handshape: "V_SHAPE",
        movement: "TAP",
        notes: "Index and middle finger snap to thumb"
    },

    // ==========================================================================
    // QUESTION WORDS
    // ==========================================================================
    "WHAT": {
        category: "Question",
        handshape: "OPEN_PALM",
        movement: "SHAKE",
        notes: "Palms up, shake side to side"
    },
    "WHERE": {
        category: "Question",
        handshape: "POINT",
        movement: "SHAKE",
        notes: "Index finger wags side to side"
    },
    "WHO": {
        category: "Question",
        handshape: "L_SHAPE",
        movement: "CIRCULAR",
        location: "FACE",
        notes: "Thumb on chin, index curls"
    },
    "WHEN": {
        category: "Question",
        handshape: "POINT",
        movement: "CIRCULAR",
        notes: "Index finger circles other index"
    },
    "WHY": {
        category: "Question",
        handshape: "OPEN_PALM",
        movement: "DOWN",
        location: "FACE",
        notes: "Fingers touch forehead, pull away to Y"
    },
    "HOW": {
        category: "Question",
        handshape: "C_SHAPE",
        movement: "CIRCULAR",
        notes: "Knuckles together, rotate outward"
    },

    // ==========================================================================
    // COMMON NOUNS
    // ==========================================================================
    "HOUSE": {
        category: "Place",
        handshape: "FLAT_HAND",
        movement: "TAP",
        notes: "Hands form roof shape, move down walls"
    },
    "SCHOOL": {
        category: "Place",
        handshape: "FLAT_HAND",
        movement: "TAP",
        notes: "Flat hands clap twice"
    },
    "FOOD": {
        category: "Noun",
        handshape: "O_SHAPE",
        movement: "TAP",
        location: "FACE",
        notes: "Same as EAT but double tap"
    },
    "WATER": {
        category: "Noun",
        handshape: "W_SHAPE",
        movement: "TAP",
        location: "FACE",
        notes: "W-hand taps chin"
    },
    "BOOK": {
        category: "Noun",
        handshape: "FLAT_HAND",
        movement: "TAP",
        notes: "Palms together open like book"
    },

    // ==========================================================================
    // DESCRIPTORS / ADJECTIVES
    // ==========================================================================
    "GOOD": {
        category: "Adjective",
        handshape: "FLAT_HAND",
        movement: "DOWN",
        location: "FACE",
        notes: "Flat hand from chin drops to other palm"
    },
    "BAD": {
        category: "Adjective",
        handshape: "FLAT_HAND",
        movement: "DOWN",
        location: "FACE",
        notes: "Flat hand from chin flips palm down"
    },
    "BIG": {
        category: "Adjective",
        handshape: "L_SHAPE",
        movement: "ARC",
        notes: "L-hands move apart"
    },
    "SMALL": {
        category: "Adjective",
        handshape: "FLAT_HAND",
        movement: "TAP",
        notes: "Flat hands move together"
    },
    "HAPPY": {
        category: "Adjective",
        handshape: "OPEN_PALM",
        movement: "CIRCULAR",
        location: "BODY",
        notes: "Flat hand brushes up on chest repeatedly"
    },
    "SAD": {
        category: "Adjective",
        handshape: "OPEN_PALM",
        movement: "DOWN",
        location: "FACE",
        notes: "Open hands drag down face"
    },
    "HOT": {
        category: "Adjective",
        handshape: "C_SHAPE",
        movement: "DOWN",
        location: "FACE",
        notes: "Claw at mouth turns away"
    },
    "COLD": {
        category: "Adjective",
        handshape: "S_SHAPE",
        movement: "SHAKE",
        notes: "Fists shake as if shivering"
    },
    "FAST": {
        category: "Adjective",
        handshape: "L_SHAPE",
        movement: "FORWARD",
        notes: "Thumbs flick forward quickly"
    },
    "SLOW": {
        category: "Adjective",
        handshape: "FLAT_HAND",
        movement: "UP",
        notes: "Hand slowly slides up other arm"
    },

    // ==========================================================================
    // TIME WORDS
    // ==========================================================================
    "NOW": {
        category: "Time",
        handshape: "Y_SHAPE",
        movement: "DOWN",
        notes: "Y-hands drop together"
    },
    "LATER": {
        category: "Time",
        handshape: "L_SHAPE",
        movement: "FORWARD",
        notes: "L-hand moves forward"
    },
    "BEFORE": {
        category: "Time",
        handshape: "FLAT_HAND",
        movement: "BACKWARD",
        notes: "Flat hand moves back from other palm"
    },
    "AFTER": {
        category: "Time",
        handshape: "FLAT_HAND",
        movement: "FORWARD",
        notes: "Flat hand moves forward from other palm"
    },
    "TODAY": {
        category: "Time",
        handshape: "Y_SHAPE",
        movement: "DOWN",
        notes: "Like NOW, emphatic"
    },
    "YESTERDAY": {
        category: "Time",
        handshape: "S_SHAPE",
        movement: "BACKWARD",
        location: "FACE",
        notes: "Thumb at chin moves back to cheek"
    },
    "TOMORROW": {
        category: "Time",
        handshape: "S_SHAPE",
        movement: "FORWARD",
        location: "FACE",
        notes: "Thumb at chin moves forward"
    },

    // ==========================================================================
    // NUMBERS (basic)
    // ==========================================================================
    "ONE": {
        category: "Number",
        handshape: "POINT",
        movement: "STATIC",
        notes: "Index finger up"
    },
    "TWO": {
        category: "Number",
        handshape: "V_SHAPE",
        movement: "STATIC",
        notes: "Index and middle fingers up"
    },
    "THREE": {
        category: "Number",
        handshape: "W_SHAPE",
        movement: "STATIC",
        notes: "Index, middle, ring fingers up with thumb extended"
    },

    // ==========================================================================
    // MISCELLANEOUS COMMON
    // ==========================================================================
    "MORE": {
        category: "Common",
        handshape: "O_SHAPE",
        movement: "TAP",
        notes: "Fingertips of both hands tap together"
    },
    "FINISH": {
        category: "Common",
        handshape: "OPEN_PALM",
        movement: "SHAKE",
        notes: "Open hands flip outward"
    },
    "AGAIN": {
        category: "Common",
        handshape: "FLAT_HAND",
        movement: "ARC",
        notes: "Bent hand arcs into other palm"
    },
    "DIFFERENT": {
        category: "Common",
        handshape: "POINT",
        movement: "ARC",
        notes: "Index fingers cross and separate"
    },
    "SAME": {
        category: "Common",
        handshape: "POINT",
        movement: "TAP",
        notes: "Index fingers tap together side by side"
    },
    "ALL": {
        category: "Common",
        handshape: "OPEN_PALM",
        movement: "CIRCULAR",
        notes: "Hand circles around other hand and closes"
    },
    "SOME": {
        category: "Common",
        handshape: "FLAT_HAND",
        movement: "UP",
        notes: "Flat hand slides across other palm"
    }
};
