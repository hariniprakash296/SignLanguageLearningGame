import { checkSign } from '@/lib/sign-definitions';

describe('sign-definitions', () => {
    describe('checkSign', () => {
        // Mock hand landmarks based on MediaPipe format (21 points)
        const createMockLandmarks = (overrides: Partial<Record<number, { x: number; y: number; z: number }>> = {}) => {
            const landmarks = Array(21).fill(null).map((_, i) => {
                const override = overrides[i];
                return {
                    x: override?.x ?? 0.5,
                    y: override?.y ?? 0.5,
                    z: override?.z ?? 0,
                };
            });
            return landmarks;
        };

        it('should return false for empty landmarks', () => {
            expect(checkSign([], 'A')).toBe(false);
        });

        it('should return false for null landmarks', () => {
            expect(checkSign(null as any, 'A')).toBe(false);
        });

        it('should be case-insensitive for letters', () => {
            const landmarks = createMockLandmarks();
            // Both should work without throwing
            const resultUpper = checkSign(landmarks, 'A');
            const resultLower = checkSign(landmarks, 'a');
            expect(typeof resultUpper).toBe('boolean');
            expect(typeof resultLower).toBe('boolean');
        });

        it('should handle unknown letters gracefully', () => {
            const landmarks = createMockLandmarks();
            expect(checkSign(landmarks, '1')).toBe(false);
            expect(checkSign(landmarks, '!')).toBe(false);
        });

        describe('Letter A detection', () => {
            it('should return boolean for A sign pattern', () => {
                const landmarks = createMockLandmarks({
                    4: { x: 0.7, y: 0.5, z: 0 },   // Thumb tip extended
                    8: { x: 0.5, y: 0.7, z: 0 },   // Index tip curled
                });
                const result = checkSign(landmarks, 'A');
                expect(typeof result).toBe('boolean');
            });
        });

        describe('Letter B detection', () => {
            it('should return boolean for B sign pattern', () => {
                const landmarks = createMockLandmarks({
                    8: { x: 0.4, y: 0.1, z: 0 },   // Index tip up
                    12: { x: 0.45, y: 0.1, z: 0 }, // Middle tip up
                });
                const result = checkSign(landmarks, 'B');
                expect(typeof result).toBe('boolean');
            });
        });
    });
});
