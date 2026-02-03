import { useGameStore } from '@/store/gameSlice';

describe('gameSlice', () => {
    beforeEach(() => {
        // Reset store state before each test
        useGameStore.getState().resetGame();
    });

    describe('score actions', () => {
        it('should initialize with score of 0', () => {
            expect(useGameStore.getState().score).toBe(0);
        });

        it('should increment score correctly', () => {
            const { incrementScore } = useGameStore.getState();
            incrementScore(10);
            expect(useGameStore.getState().score).toBe(10);
            incrementScore(5);
            expect(useGameStore.getState().score).toBe(15);
        });

        it('should set score directly', () => {
            const { setScore } = useGameStore.getState();
            setScore(100);
            expect(useGameStore.getState().score).toBe(100);
        });
    });

    describe('level actions', () => {
        it('should initialize at level 1', () => {
            expect(useGameStore.getState().level).toBe(1);
        });

        it('should set level correctly', () => {
            const { setLevel } = useGameStore.getState();
            setLevel(2);
            expect(useGameStore.getState().level).toBe(2);
        });

        it('should reset score when changing level', () => {
            const { incrementScore, setLevel } = useGameStore.getState();
            incrementScore(50);
            setLevel(2);
            expect(useGameStore.getState().score).toBe(0);
        });
    });

    describe('waiting for sign', () => {
        it('should set waiting state with word', () => {
            const { setIsWaitingForSign } = useGameStore.getState();
            setIsWaitingForSign(true, 'HELLO');
            const state = useGameStore.getState();
            expect(state.isWaitingForSign).toBe(true);
            expect(state.targetWord).toBe('HELLO');
            expect(state.currentLetterIndex).toBe(0);
        });

        it('should reset waiting state', () => {
            const { setIsWaitingForSign } = useGameStore.getState();
            setIsWaitingForSign(true, 'TEST');
            setIsWaitingForSign(false);
            expect(useGameStore.getState().isWaitingForSign).toBe(false);
        });
    });

    describe('verification mode', () => {
        it('should start in teaching mode', () => {
            expect(useGameStore.getState().verificationMode).toBe('teaching');
        });

        it('should switch to whole_word mode', () => {
            const { setVerificationMode } = useGameStore.getState();
            setVerificationMode('whole_word');
            expect(useGameStore.getState().verificationMode).toBe('whole_word');
        });

        it('should hide assistance in whole_word mode', () => {
            const { setVerificationMode } = useGameStore.getState();
            setVerificationMode('whole_word');
            expect(useGameStore.getState().showAssistance).toBe(false);
        });
    });

    describe('progress tracking', () => {
        it('should track completed words', () => {
            const { completeWord } = useGameStore.getState();
            completeWord('CAT');
            expect(useGameStore.getState().wordsCompleted).toBe(1);
        });

        it('should add letters to mastered when completing word', () => {
            const { completeWord } = useGameStore.getState();
            completeWord('CAT');
            const state = useGameStore.getState();
            expect(state.masteredLetters).toContain('C');
            expect(state.masteredLetters).toContain('A');
            expect(state.masteredLetters).toContain('T');
        });
    });

    describe('level 2 unlock', () => {
        it('should start with level 2 locked', () => {
            expect(useGameStore.getState().level2Unlocked).toBe(false);
        });

        it('should unlock via unlockLevel2 action', () => {
            const { unlockLevel2 } = useGameStore.getState();
            unlockLevel2();
            expect(useGameStore.getState().level2Unlocked).toBe(true);
        });
    });

    describe('resetGame', () => {
        it('should reset all state to defaults', () => {
            const { incrementScore, setLevel, completeWord, resetGame } = useGameStore.getState();
            incrementScore(100);
            setLevel(2);
            completeWord('TEST');

            resetGame();

            const state = useGameStore.getState();
            expect(state.score).toBe(0);
            expect(state.level).toBe(1);
            expect(state.wordsCompleted).toBe(0);
        });
    });
});
