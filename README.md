# 🤟 Learn ASL through PacMan

Welcome to **Learn ASL through PacMan**, an interactive and gamified platform designed to make learning American Sign Language (ASL) fun, engaging, and effective. By combining the classic PacMan arcade experience with modern computer vision, users can practice ASL hand shapes in real-time.

## 🏗️ Project Architecture

The project is designed as a full-stack mono-repository consisting of two primary components:

1.  **Frontend (Next.js/React):**
    *   Built with **Next.js 15** and **React 19**.
    *   Uses **Tailwind CSS** for premium, responsive styling.
    *   **MediaPipe Hands** integration for real-time hand landmark detection and gesture recognition.
    *   **Custom Game Engine:** A vanilla TypeScript engine managing the PacMan logic via HTML5 Canvas.

2.  **Backend (Flask/Python):**
    *   A lightweight **Flask** server that acts as a proxy for advanced features.
    *   Handles **YouTube Transcript Extraction** to sync sign language learning with real-world video content.

## 🔄 Data Flow

The application follows a structured data flow to ensure low-latency interactions:

1.  **Game Loop Interaction:**
    *   `GameEngine` (Canvas) performs collision detection.
    *   Upon hitting a word pellet, the engine "freezes" and triggers a callback.
    *   The callback updates the **Zustand Store**, signaling the UI to show the sign verification modal.
2.  **Recognition Feedback:**
    *   `HandTracking` captures webcam frames.
    *   MediaPipe processes landmarks and passes them to our **Sign Definitions** module.
    *   Matches are piped back to the store, updating progress in real-time.
3.  **YouTube Mode:**
    *   URL is submitted -> Flask Backend fetches transcript -> Frontend parses timestamps -> `SignDisplay` cycles signs in sync with the video.

## 🧠 State Management (Zustand)

We use **Zustand** for centralized, reactive state management. This handles:
*   **Game State:** Score, levels, and maze progress.
*   **Verification State:** Target words, current letter index, and "teaching" vs. "whole-word" modes.
*   **Persistence:** Local storage synchronization ensures that progress is saved across browser refreshes.

## 🛠️ Technical Details & Optimization

*   **Sign Recognition Engine:** A custom-built geometric verification system located in `src/lib/sign-definitions.ts`. It uses precisely tuned thresholds for thumb-to-finger distances and finger curl angles to distinguish between complex signs (e.g., 'E' vs 'S' or 'M' vs 'N').
*   **MediaPipe Sync:** Implemented a **Frame Guard** to prevent WASM timestamp mismatch errors by ensuring strictly increasing timestamps are sent to the hand landmarker.
*   **Performance:** All heavy detection logic is memoized and throttled to maintain 60FPS in the game engine while running AI detection in parallel.
*   **UI/UX:** Uses a custom "X" exit logic with a cooldown period, allowing users to move PacMan away from word pellets without being forced into a loop if they choose to skip a word.

---

## 🚀 Getting Started

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python run.py
```

### 2. Frontend Setup
```bash
cd signlang-pacman
npm install
npm run dev
```

Visit `http://localhost:3000` to start playing!

---
*Created with ❤️ by the Learn ASL through PacMan Team.*
