# Documentation Log

## Fixes Implemented (2026-01-28)

### 1. Sign Recognition Accuracy & Strictness
**Issue:** Accuracy was reported as "really bad", incorrectly accepting wrong signs (e.g., matching 'S' when hand was in 'E' shape) and skipping letters in words.
**Fixes:**
- **Centralized Logic:** Refactored sign logic from `HandTracking.tsx` to a new module `src/lib/sign-definitions.ts`.
- **Strict Constraints:**
    - **E vs S**: Implemented strict geometric rules. 
        - 'E' requires finger tips to be closing in on the thumb (distance < 0.22).
        - 'S' requires thumb to be crossing the fingers but NOT touching the tips (distance > 0.23).
    - **No Fallbacks**: Removed the "default" case that accepted any hand shape. Now returns `false` if no specific letter rules are met.
- **Missing Letters**: Added explicit definitions for **P, R, G, V** (used in PLEASE, SORRY, GOOD, LOVE) which were previously missing constraints.

### 2. Game Logic & "Skipping" Bug
**Issue:** The game would sometimes skip letters (e.g., checking T, H, then skipping A, N, K, S in "THANKS") or advance to verification mode prematurely.
**Root Cause:**
- `HandTracking` component maintained `progress` state across letter changes. 
- If the user had a partial match for the previous letter, and the new letter had a similar shape (or if the system produced a false positive), the `progress` would start high and instantly complete the new letter before the user could react.
- UI Crash: `SignDisplay` crashed when receiving an undefined or empty sign sequence during transitions.
**Fixes:**
- **State Reset:** Modified `HandTracking.tsx` to explicitly reset `progress` to `0` and status to `WAITING` whenever the `targetWord` prop changes.
- **Safety Checks:** Added null checks in `page.tsx` and `SignDisplay.tsx` to handle transitions where `currentLetterIndex` might temporarily exceed bounds or return undefined.

### 3. Stability
**Issue:** "Blank Localhost" and crashes on startup.
**Root Cause:** Multiple instances of `node.exe` created potential race conditions on the `.next` cache and port conflicts.
**Fixes:**
- Implemented a "Clean Slate" protocol: Terminated all node processes, deleted `.next` and `node_modules`, and reinstalled dependencies.

### 4. WASM Abort Error & Timestamp Sync
**Issue:** "Runtime RuntimeError: Aborted()" in `HandTracking.tsx`.
**Root Cause:** 
- MediaPipe's `detectForVideo` requires strictly increasing timestamps. `performance.now()` can occasionally cause issues if the event loop delays a frame.
- Racing conditions where the detection loop calls the landmarker after it has been closed during a cleanup (unmount).
**Fixes:**
### 5. Hydration & Performance "Infinite Issues"
**Issue:** Console spamming "1980+ issues" and "div cannot be descendant of p" hydration errors.
**Root Cause:** 
- **DOM Mismatch**: `<CardDescription>` was wrapping `<div>` and `<span>` elements. In shadcn/ui, `CardDescription` is hardcoded as a `<p>` tag.
- **Render Loop**: The `handleLetterMatch` function wasn't memoized. Every time a sign was matched (even partially), it caused a re-render of `Home`, which created a *new* function reference, which triggered the `useEffect` in `HandTracking` to restart the detection loop. This happened many times per second.
**Fixes:**
- **Semantic HTML**: Replaced problematic `CardDescription` usages with styled `<div>` blocks to support nested layouts.
- **Memoization**: Wrapped `handleLetterMatch` in `useCallback` to stabilize the detection loop.
### 6. MediaPipe Timestamp Mismatch
**Issue:** "Packet timestamp mismatch" error when reaching certain letters (like 'N' in "THANKS").
**Root Cause:** 
- MediaPipe's `detectForVideo` requires strictly increasing timestamps. If the browser's `requestAnimationFrame` fires faster than the webcam/video updates its `currentTime`, duplicate timestamps are sent, causing a WASM crash.
**Fixes:**
- **Frame Guard**: Added `lastVideoTimeRef` to track the last processed timestamp.
### 7. SignDisplay Transition Crash
**Issue:** "Cannot read properties of undefined (reading 'toUpperCase')" in `SignDisplay.tsx`, reported for words like "LOVE".
**Root Cause:** 
- During rapid word transitions (e.g., from a long word to a shorter one, or during component re-renders), React's `currentIndex` state might lag behind the actual `sign` prop. If the index points beyond the new word's length during a render, it accesses `undefined`.
**Fixes:**
- **Double-Layer Protection**: 
    1. Implemented `safeSign` using `String()` coercion to prevent null/undefined property access.
    2. Added a logical guard `char ? char.toUpperCase() : ...` that falls back to the first character of the word if the current index is temporarily out of bounds. This eliminates the race condition crash entirely.

## ⏳ Pending Tasks (Queue for Quota Reset)

### 1. ASL Image Replacement (A-Z)
**Status:** Blocked by Image Generation Quota.
**Task:** Once the quota resets, generate a consistent set of minimalist line-art images for all 26 ASL letters to replace the currently extracted chart icons.
**Prompt to Use:**
> A clear minimalist black and white line art illustration of the American Sign Language (ASL) hand sign for the letter '<LETTER>'. The hand has thumb and index fingers forming a circle while the other three fingers are extended upwards and spread. Clean white background, thick black outlines, educational diagram style. No facial features, just the hand.

*Note: The system is already configured in `SignDisplay.tsx` to prioritize these images once they are placed in `public/assets/asl/<letter>.png`.*
