# 🤟 SignLang Pacman - Complete Documentation

> **Principal Engineer's Handover Document**
> Prepared for: All Stakeholders (Technical & Non-Technical)
> Project: Visual Sign Language Learning Game
> Last Updated: 2026-02-04

---

# Table of Contents

1. [Executive Summary](#-executive-summary)
2. [User Manual & Guides](#-user-manual--guides)
3. [Technical Specifications](#-technical-specifications)
4. [Functional Requirements](#-functional-requirements)
5. [Design Requirements](#-design-requirements)
6. [Technical Standards](#-technical-standards)
7. [Testing Requirements](#-testing-requirements)
8. [Delivery Requirements](#-delivery-requirements)
9. [Support & Maintenance](#-support--maintenance)
10. [Installation Guide](#-installation-guide)
11. [API Documentation](#-api-documentation)
12. [Release Notes](#-release-notes)
13. [Developer Onboarding](#-developer-onboarding)
14. [System Architecture (C4 Model)](#-1-system-architecture-c4-model)
15. [System Design & Data Flow](#-2-system-design--data-flow)
16. [Game Engine Logic](#-3-game-engine-logic)
17. [State Management](#-4-state-management)
18. [Summary](#-summary)

---

# 📋 Executive Summary

## What is SignLang Pacman?

SignLang Pacman is an **educational web application** that teaches American Sign Language (ASL) through gamification. Users play a Pacman-style game where eating letter pellets triggers sign language learning challenges.

## Problem Statement

Learning sign language is challenging because:
- Traditional methods lack engagement
- Real-time feedback is expensive (requires human tutors)
- Practice materials are static and boring

## Solution

A gamified learning platform that:
- Makes learning fun through arcade mechanics
- Provides instant feedback via computer vision (hand tracking)
- Progressively teaches letters and words

## Key Stakeholders

| Role | Interest |
|------|----------|
| **Learners** | Fun, effective ASL learning |
| **Educators** | Tool for teaching deaf students |
| **Developers** | Maintainable, extendable codebase |
| **Accessibility Advocates** | Inclusive communication tools |

---

# 📖 User Manual & Guides

## Quick Start Guide

### For New Users

1. **Open the application** at `http://localhost:3000` (development) or your deployed URL
2. **Start the game** by pressing arrow keys or WASD
3. **Move Pacman** to eat letter pellets
4. **Learn signs** - When Pacman touches a pellet, you'll see the ASL sign
5. **Practice** - Match the sign using your webcam
6. **Progress** - Complete 3 words to unlock Level 2!

### Controls

| Action | Key |
|--------|-----|
| Move Up | ↑ or W |
| Move Down | ↓ or S |
| Move Left | ← or A |
| Move Right | → or D |
| Close Sign Overlay | Click X button |

### Game Modes

#### Level 1: Letters (Pacman Teaching Mode)
- Play the classic Pacman game
- Eat pellets to learn ASL letter signs
- Practice each letter with visual guidance and hints
- Complete 3 words to unlock Level 2

#### Level 2: Initialized Signs (Family-Based Learning)

**What is Initialization?**
In ASL, "initialized signs" use the first letter of the English word as part of the handshape. Many related words share the SAME movement but use DIFFERENT letter handshapes.

**Word Families Taught:**
| Family | Example Words | Shared Movement |
|--------|--------------|-----------------|
| **Educators** 🎓 | Teacher, Tutor, Coach, Instructor | Forward from head (sharing knowledge) |
| **Groups** 👥 | Family, Team, Group, Class | Circular arc apart |
| **Days** 📅 | Monday, Tuesday, Wednesday... | Small circular motion |
| **Colors** 🎨 | Blue, Green, Purple, Yellow | Shaking motion |
| **Local/Culture** 📍 | Local, Culture, Community | Circular near body |

**How Level 2 Works:**
1. Welcome screen explains initialization concept
2. Each family is introduced with its shared movement
3. Learn each word in the family with handshape + movement
4. Practice signing with webcam verification
5. Progress through all families to complete Level 2

### Tabs

| Tab | Purpose |
|-----|---------|
| **Game** | Main Pacman arcade experience |
| **Translator** | YouTube-to-Sign translation tool |

### Troubleshooting (User)

| Issue | Solution |
|-------|----------|
| Camera not working | Allow camera permissions in browser |
| Signs not detecting | Ensure good lighting, hand fully visible |
| Game frozen | Refresh the page |

---

# 🔧 Technical Specifications

## System Requirements

### Minimum Requirements

| Component | Requirement |
|-----------|-------------|
| **Browser** | Chrome 90+, Firefox 88+, Edge 90+, Safari 14+ |
| **OS** | Windows 10+, macOS 10.15+, Linux (Ubuntu 20.04+) |
| **RAM** | 4 GB minimum, 8 GB recommended |
| **CPU** | Dual-core 2.0 GHz+ |
| **GPU** | WebGL 2.0 support required |
| **Camera** | 720p webcam (for hand tracking) |
| **Internet** | 5 Mbps+ for initial load |

### Recommended Requirements

| Component | Requirement |
|-----------|-------------|
| **Browser** | Chrome 100+ (best performance) |
| **RAM** | 8 GB+ |
| **GPU** | Dedicated graphics card |
| **Camera** | 1080p webcam |

## Performance Metrics

| Metric | Target | Current |
|--------|--------|---------|
| **First Contentful Paint** | < 1.5s | ~1.2s |
| **Time to Interactive** | < 3s | ~2.5s |
| **Game Frame Rate** | 60 FPS | 60 FPS |
| **Hand Detection Latency** | < 100ms | ~80ms |
| **Bundle Size (gzipped)** | < 500KB | ~450KB |

## Dimensions & Layout

| Element | Size |
|---------|------|
| **Game Canvas** | 800x600px (responsive) |
| **Sign Display Panel** | 500x400px max |
| **Camera Preview** | 640x480px |
| **Maze Grid** | 27 columns × 15 rows |
| **Cell Size** | Dynamic (canvas width / 27) |

## Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Framework** | Next.js | 16.1.6 |
| **UI Library** | React | 19.2.4 |
| **Styling** | Tailwind CSS | 3.4.13 |
| **State Management** | Zustand | 5.0.0 |
| **Hand Tracking** | MediaPipe Tasks Vision | 0.10.32 |
| **Testing** | Jest + React Testing Library | 30.2.0 |
| **Backend** | Flask (Python) | 2.0+ |

---

# 📝 Functional Requirements

## Core Features

### FR-001: Pacman Game Engine
| Attribute | Value |
|-----------|-------|
| **Priority** | P0 (Critical) |
| **Status** | ✅ Implemented |
| **Description** | Grid-based Pacman movement with pellet collection |
| **Acceptance Criteria** | Pacman moves smoothly, cannot pass through walls |

### FR-002: ASL Sign Display
| Attribute | Value |
|-----------|-------|
| **Priority** | P0 (Critical) |
| **Status** | ✅ Implemented |
| **Description** | Display ASL signs when pellets are collected |
| **Acceptance Criteria** | Signs render as images or SVG fallback |

### FR-003: Hand Tracking Verification
| Attribute | Value |
|-----------|-------|
| **Priority** | P0 (Critical) |
| **Status** | ✅ Implemented |
| **Description** | Use webcam to detect user's hand signs |
| **Acceptance Criteria** | 80%+ accuracy for supported letters |

### FR-004: Level Progression
| Attribute | Value |
|-----------|-------|
| **Priority** | P1 (High) |
| **Status** | ✅ Implemented |
| **Description** | Unlock Level 2 after completing 3 words |
| **Acceptance Criteria** | Progress persists across sessions |

### FR-005: YouTube Translation
| Attribute | Value |
|-----------|-------|
| **Priority** | P2 (Medium) |
| **Status** | ✅ Implemented |
| **Description** | Extract YouTube transcripts and show ASL signs |
| **Acceptance Criteria** | Syncs with video playback |

## Supported ASL Letters

| Status | Letters |
|--------|---------|
| ✅ Full Support | A, B, C, D, E, F, G, I, K, L, M, N, O, P, R, S, T, U, V, W, Y |
| ⚠️ Basic Support | H, J, Q, X, Z |

---

# 🎨 Design Requirements

## Visual Design Principles

1. **Accessibility First** - High contrast, clear typography
2. **Playful Aesthetic** - Arcade-inspired with modern polish
3. **Minimal Distraction** - Focus on learning, not decoration
4. **Responsive** - Works on desktop and tablets

## Color Palette

| Usage | Color | Hex |
|-------|-------|-----|
| Primary | Blue | `#3B82F6` |
| Success | Green | `#22C55E` |
| Warning | Yellow | `#EAB308` |
| Error | Red | `#EF4444` |
| Background | Slate | `#F8FAFC` |
| Game Background | Black | `#000000` |

## Typography

| Element | Font | Size |
|---------|------|------|
| Headings | Inter | 24-48px |
| Body | Inter | 14-16px |
| Game UI | System | 12-24px |

## Layout Structure

```
┌─────────────────────────────────────────┐
│                 Header                   │
│   Score: 150    Level: 1    SignLang    │
├─────────────────────────────────────────┤
│  [Game Tab]  [Translator Tab]           │
├─────────────────────────────────────────┤
│                                         │
│            Main Content Area            │
│     (Game Canvas or Translator)         │
│                                         │
├─────────────────────────────────────────┤
│           Level Navigation Bar          │
│    ← Level 1    [L1] [L2]    Level 2 → │
└─────────────────────────────────────────┘
```

## Sign Overlay Design

```
┌─────────────────────────────────────────┐
│ [X]                                     │
├─────────────────────────────────────────┤
│  LEARN: HELLO                  +50 PTS  │
│  [H] [E] [L] [L] [O]      LETTER 1 OF 5 │
├──────────────────┬──────────────────────┤
│   DEMONSTRATION  │     YOUR CAMERA      │
│  ┌────────────┐  │  ┌────────────────┐  │
│  │   [Sign]   │  │  │  [Webcam Feed] │  │
│  │   Image    │  │  │  with overlay  │  │
│  └────────────┘  │  └────────────────┘  │
│                  │                      │
│  Tip: Practice   │  ✨ Perfect! Hold... │
│  the letter H    │                      │
└──────────────────┴──────────────────────┘
```

---

# 📏 Technical Standards

## Coding Standards

### TypeScript Guidelines

```typescript
// * Use explicit typing for all function parameters
function calculateScore(basePoints: number, multiplier: number): number {
    return basePoints * multiplier;
}

// * Use interfaces for object shapes
interface GameState {
    score: number;
    level: number;
    isPlaying: boolean;
}

// * Use constants for magic numbers
const UNLOCK_THRESHOLD = 3; // words needed for Level 2
```

### File Organization

```
src/
├── app/                 # Next.js pages and routing
│   └── page.tsx         # Main application entry
├── components/          # Reusable UI components
│   ├── game/            # Game-specific components
│   ├── shared/          # Shared/common components
│   └── youtube/         # YouTube feature components
├── lib/                 # Core libraries and utilities
│   ├── game-engine.ts   # Game loop and physics
│   └── sign-definitions.ts # Hand gesture detection
└── store/               # State management
    ├── gameSlice.ts     # Game state (Zustand)
    └── signSlice.ts     # Sign display state
```

### Design Patterns Used

| Pattern | Usage |
|---------|-------|
| **Component Pattern** | React functional components |
| **State Machine** | Game states (paused, playing, frozen) |
| **Observer Pattern** | Zustand subscriptions |
| **Factory Pattern** | Pellet creation |
| **Strategy Pattern** | Sign verification per letter |

### Key Development Practices

| Practice | Description |
|----------|-------------|
| **DRY** | Don't Repeat Yourself - reuse components |
| **KISS** | Keep It Simple - avoid over-engineering |
| **Single Responsibility** | Each function does one thing |
| **Immutability** | State updates create new objects |

## Web Standards Compliance

| Standard | Compliance |
|----------|------------|
| **WCAG 2.1 AA** | Partial (color contrast, keyboard nav) |
| **ES2020** | Full |
| **TypeScript Strict** | Enabled |
| **React 19** | Latest features supported |

---

# 🧪 Testing Requirements

## Test Strategy

| Level | Tool | Coverage Target |
|-------|------|-----------------|
| **Unit** | Jest | 80%+ |
| **Integration** | React Testing Library | 60%+ |
| **E2E** | Manual + Future Playwright | Critical paths |

## Current Test Coverage

| File | Tests | Status |
|------|-------|--------|
| `sign-definitions.ts` | 8 | ✅ Pass |
| `gameSlice.ts` | 14 | ✅ Pass |
| **Total** | 22 | ✅ All Pass |

## Test Commands

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:ci

# Watch mode for development
npm test -- --watch
```

## Acceptance Criteria

| Feature | Test Case | Expected Result |
|---------|-----------|-----------------|
| Pacman Movement | Move right into wall | Pacman stops |
| Sign Display | Collect A pellet | A sign image shows |
| Hand Tracking | Make A sign | Progress bar fills |
| Level Unlock | Complete 3 words | Level 2 button enables |

---

# 📦 Delivery Requirements

## Build Process

```bash
# Development build (with hot reload)
npm run dev

# Production build
npm run build

# Start production server
npm run start
```

## Deployment Pipeline

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  Code   │───▶│  Push   │───▶│  CI/CD  │───▶│ Deploy  │
│  Commit │    │  GitHub │    │ Actions │    │ Vercel  │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
                                  │
                              ┌───┴───┐
                              │ Tests │
                              │ Must  │
                              │ Pass  │
                              └───────┘
```

## Environments

| Environment | URL | Trigger |
|-------------|-----|---------|
| **Localhost** | http://localhost:3000 | `npm run dev` |
| **Staging** | Vercel Preview URL | Pull Request |
| **Production** | Vercel Production | Merge to main |

## Delivery Checklist

- [ ] All tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] Documentation updated
- [ ] PR reviewed and approved
- [ ] Deployed to staging for QA
- [ ] Deployed to production

---

# 🔧 Support & Maintenance

## Known Issues

| Issue | Workaround | Status |
|-------|------------|--------|
| LightningCSS error on Windows | Use Tailwind v3 | ✅ Resolved |
| Camera permission denied | Manual browser setting | Documented |
| J/Z signs hard to detect | Letters require motion | Known limitation |

## Troubleshooting Guide

### Build Errors

**Error: `Cannot find module '../lightningcss.win32-x64-msvc.node'`**
```powershell
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules
npm install
npm run build
```

**Error: `Port 3000 in use`**
```powershell
# Find and kill the process
taskkill /F /PID <process_id>
# Or use a different port
$env:PORT=3001; npm run dev
```

### Runtime Issues

**Camera not working:**
1. Check browser permissions (Settings > Privacy > Camera)
2. Ensure HTTPS or localhost
3. Try a different browser

**Signs not detecting:**
1. Improve lighting
2. Use plain background
3. Ensure full hand is visible
4. Move slower

## Maintenance Schedule

| Task | Frequency |
|------|-----------|
| Dependency updates | Monthly |
| Security patches | As needed |
| Performance review | Quarterly |
| Feature additions | Per roadmap |

## Contact & Support

| Role | Responsibility |
|------|----------------|
| **Lead Engineer** | Architecture decisions |
| **Frontend Dev** | UI/UX bugs, game logic |
| **ML Engineer** | Hand tracking accuracy |

---

# 💻 Installation Guide

## Prerequisites

| Requirement | Version | Check Command |
|-------------|---------|---------------|
| **Node.js** | 18.0+ | `node --version` |
| **npm** | 9.0+ | `npm --version` |
| **Git** | 2.0+ | `git --version` |
| **Python** (optional) | 3.9+ | `python --version` |

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/hariniprakash296/SignLanguageLearningGame.git
cd SignLanguageLearningGame
```

### 2. Install Frontend Dependencies

```bash
cd signlang-pacman
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

### 4. (Optional) Run Backend

```bash
cd backend
pip install -r requirements.txt
python run.py
```

## Configuration Options

### Environment Variables

Create `.env.local` (copy from `.env.example`):

```env
# Optional: Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5000

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID=your_id
```

### Build Configuration

`next.config.js` options:
- `output: 'standalone'` - For Docker deployment
- `images.unoptimized: true` - For static export

---

# 🔌 API Documentation

## Frontend APIs (Internal)

### Game Store API (`useGameStore`)

```typescript
// Get current state
const { score, level, isWaitingForSign } = useGameStore();

// Actions
incrementScore(amount: number): void
setLevel(level: number): void
setIsWaitingForSign(waiting: boolean, word?: string): void
completeWord(word: string): void
resetGame(): void
```

### Sign Store API (`useSignStore`)

```typescript
// Get current sign
const { currentSign, isLoading } = useSignStore();

// Actions
setCurrentSign(sign: SignData): void
clearSign(): void
```

## Backend API (Flask)

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sign/:word` | Get sign data for a word |
| POST | `/api/youtube/extract` | Extract YouTube transcript |
| GET | `/health` | Health check |

### `/api/youtube/extract`

**Request:**
```json
{
  "url": "https://youtube.com/watch?v=xxxxx"
}
```

**Response:**
```json
{
  "transcript": [
    { "text": "Hello", "start": 0.5, "duration": 1.2 },
    { "text": "World", "start": 1.8, "duration": 0.9 }
  ],
  "language": "en"
}
```

### Error Codes

| Code | Meaning | Resolution |
|------|---------|------------|
| 400 | Bad Request | Check request format |
| 404 | Not Found | Resource doesn't exist |
| 429 | Rate Limited | Wait and retry |
| 500 | Server Error | Check server logs |

### Data Formats

**SignData Object:**
```typescript
interface SignData {
  label: string;        // The word/letter
  description: string;  // How to make the sign
  image_url: string | null;
  type: 'letter' | 'word';
}
```

**Hand Landmark (MediaPipe):**
```typescript
interface Landmark {
  x: number;  // 0-1 normalized
  y: number;  // 0-1 normalized
  z: number;  // Depth
}
// Array of 21 landmarks per hand
```

---

# 📋 Release Notes

## Version History

### v1.4.0 (2026-02-04) - Current

#### ✨ New
- CI/CD pipeline with GitHub Actions
- Jest unit testing (22 tests)
- Husky pre-push hooks
- Comprehensive documentation

#### 🔧 Improved
- Level 2 unlocks at 3 words (was 4)
- Sign display layout (no more cutoff)
- Verifying message styling (centered pill)

#### 🐛 Fixed
- Close button re-triggering overlay
- Final Challenge mode removed (too hard)
- Pacman maze boundaries

### v1.3.0 (2026-01-28)

#### ✨ New
- Level 2 word spelling mode
- Hand tracking verification
- Mastered letters tracking

#### 🔧 Improved
- E/S sign differentiation
- Pacman maze expanded to 27x15

### v1.2.0 (2026-01-27)

#### ✨ New
- YouTube translator tab
- Flask backend for transcripts

### v1.1.0 (2026-01-26)

#### ✨ New
- Core Pacman game engine
- Sign popup on pellet collection

### v1.0.0 (2026-01-25)

#### ✨ New
- Initial project setup
- Architecture design

---

# 👩‍💻 Developer Onboarding

## Welcome!

This guide will help you understand the codebase and start contributing quickly.

## Codebase Tour

### Entry Point

Start at `src/app/page.tsx` - this is the main page that renders everything.

### Core Components

1. **GameCanvas** - Renders the Pacman game
2. **HandTracking** - Webcam and gesture detection
3. **SignDisplay** - Shows ASL sign images
4. **SignPopup** - Floating notification for learned signs

### State Flow

```
User Action → Store Update → Component Re-render
     ↓              ↓              ↓
  keydown    incrementScore()   {score}
```

## Key Practices

### DRY (Don't Repeat Yourself)

```typescript
// ❌ Bad - Repeated logic
if (letter === 'A') checkASign(landmarks);
if (letter === 'B') checkBSign(landmarks);

// ✅ Good - Single function
function checkSign(landmarks, letter) {
  return SIGN_CHECKS[letter](landmarks);
}
```

### Single Responsibility

```typescript
// ❌ Bad - Does too much
function updateGameAndRenderAndCheckCollisions() { ... }

// ✅ Good - Focused functions
function update(deltaTime) { ... }
function render() { ... }
function checkCollisions() { ... }
```

### Immutable State Updates

```typescript
// ❌ Bad - Mutates state
state.score += 10;

// ✅ Good - Creates new object
set({ score: state.score + 10 });
```

## Git Workflow

1. Create branch: `git checkout -b feature/my-feature`
2. Make changes
3. Run tests: `npm test`
4. Commit: `git commit -m "feat: description"`
5. Push: `git push origin feature/my-feature`
6. Create Pull Request

### Commit Message Format

```
<type>: <description>

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- refactor: Code change (no behavior change)
- test: Adding tests
```

## Quick Commands

```bash
npm run dev      # Start development
npm test         # Run tests
npm run build    # Production build
npm run lint     # Check code style
```

---

# 🏗️ 1. System Architecture (C4 Model)

## Level 1: System Context

The **SignLang Pacman** system acts as an educational intermediary between learners and ASL resources.

```
┌─────────────────────────────────────────────────────────────┐
│                     SYSTEM CONTEXT                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│    ┌──────────┐                                             │
│    │  Learner │                                             │
│    │  (User)  │                                             │
│    └────┬─────┘                                             │
│         │                                                   │
│         │     ┌──────────────────────┐                      │
│         └────►│  SignLang Pacman     │                      │
│               │  (Web Application)   │                      │
│               └──────────┬───────────┘                      │
│                          │                                  │
│                          ▼                                  │
│               ┌──────────────────────┐                      │
│               │   ASL Sign Assets    │                      │
│               │   (Images/SVGs)      │                      │
│               └──────────────────────┘                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Level 2: Container Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    CONTAINER DIAGRAM                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              FRONTEND (Next.js/React)               │   │
│  │                                                     │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌───────────┐  │   │
│  │  │ Game Engine │  │ Hand Tracker │  │ Zustand   │  │   │
│  │  │ (Canvas)    │  │ (MediaPipe)  │  │ Store     │  │   │
│  │  └─────────────┘  └──────────────┘  └───────────┘  │   │
│  │                                                     │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │              React Components               │   │   │
│  │  │  GameCanvas | SignDisplay | HandTracking   │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                │
│                           ▼                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              BACKEND (Next.js API)                  │   │
│  │                                                     │   │
│  │             ┌─────────────────────────┐             │   │
│  │             │ Interpreter Agent API   │             │   │
│  │             │ /api/agents/interpreter │             │   │
│  │             └─────────────────────────┘             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Level 3: Component Diagram (Frontend)

| Component | Container | Responsibility |
|-----------|-----------|----------------|
| `GameEngine` | Frontend | Canvas game loop, physics, rendering |
| `GameCanvas` | Frontend | React wrapper for GameEngine |
| `HandTracking` | Frontend | WebcamMediaPipe integration |
| `SignDisplay` | Frontend | ASL sign image/SVG rendering |
| `SignPopup` | Frontend | Floating notification component |
| `VideoTranslator` | Frontend | YouTube sync component |
| `gameSlice` | Frontend | Zustand game state store |
| `signSlice` | Frontend | Zustand sign display store |

## Level 4: Code Diagram

| File | Container | Component | Lines |
|------|-----------|-----------|-------|
| `src/lib/game-engine.ts` | Frontend | GameEngine | ~370 |
| `src/lib/sign-definitions.ts` | Frontend | SignChecker | ~400 |
| `src/store/gameSlice.ts` | Frontend | GameStore | ~135 |
| `src/store/signSlice.ts` | Frontend | SignStore | ~40 |
| `src/components/game/GameCanvas.tsx` | Frontend | GameCanvas | ~115 |
| `src/components/game/HandTracking.tsx` | Frontend | HandTracking | ~230 |
| `src/components/shared/SignDisplay.tsx` | Frontend | SignDisplay | ~200 |
| `src/app/page.tsx` | Frontend | MainPage | ~360 |

---

# 🛠️ 2. System Design & Data Flow

## Game Mode Data Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  User    │    │  Game    │    │  Zustand │    │   UI     │
│  Input   │───▶│  Engine  │───▶│  Store   │───▶│ Updates  │
│ (Arrow)  │    │(update)  │    │(setState)│    │(re-render)│
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                     │
                     ▼
              ┌──────────────┐
              │ Pellet       │
              │ Collision?   │
              └──────┬───────┘
                     │ Yes
                     ▼
              ┌──────────────┐    ┌──────────┐
              │ Freeze Game  │───▶│ Show Sign│
              │ Show Overlay │    │ Overlay  │
              └──────────────┘    └──────────┘
                                       │
                                       ▼
                                ┌──────────────┐
                                │ Hand         │
                                │ Tracking     │
                                └──────┬───────┘
                                       │ Match?
                                       ▼
                                ┌──────────────┐
                                │ Add Score    │
                                │ Next Letter  │
                                └──────────────┘
```

## Gemini Vision Integration Data Flow

```mermaid
sequenceDiagram
    participant Camera
    participant Frontend
    participant API as API Route
    participant Gemini as Gemini Vision API

    Camera->>Frontend: Video Frame (Base64)
    Frontend->>API: POST /api/interpreter
    Note right of Frontend: Checks Rate Limit (2s)
    
    rect rgb(20, 20, 20)
        Note right of API: Vision Processing
        API->>Gemini: Image + Context Prompt
        Gemini->>API: JSON {recognizedSign, translation}
    end

    API->>Frontend: Result + Metadata
    Frontend->>Frontend: Update UI & History
```

## Sign Recognition Pipeline Flow

```mermaid
graph TD
    A[Camera Input] --> B{Mode?}
    B -->|Vision API| C[Capture Frame]
    B -->|Offline| D[MediaPipe Landmarks]
    
    C --> E[Base64 Encode]
    E --> F[Send to Gemini]
    F --> G[Recognize & Translate]
    
    D --> H[Geometric Analysis]
    H --> I[Match Sign Definitions]
    
    G --> J[Display Result]
    I --> J
```

---

# 🎮 3. Game Engine Logic

## Overview

The game engine is a **vanilla TypeScript class** that manages:
- Game loop (60 FPS via `requestAnimationFrame`)
- Pacman movement and physics
- Collision detection
- Rendering to HTML5 Canvas

## Key Concepts

### Game Loop

```typescript
gameLoop(currentTime) {
    deltaTime = currentTime - lastTime;  // Time since last frame
    update(deltaTime);                    // Move objects
    render();                             // Draw to canvas
    requestAnimationFrame(gameLoop);      // Schedule next frame
}
```

### Grid-Based Movement

- Maze is a 2D array: `0` = path, `1` = wall
- Pacman position is in **grid coordinates** (float)
- Convert to **pixels** for rendering: `x * cellSize`

### Delta Time

Ensures consistent speed regardless of frame rate:
```typescript
// Move 3 grid cells per second
const speed = 3.0;
const movement = speed * deltaTime;  // deltaTime in seconds
```

### Collision Detection

```typescript
canMove(x, y) {
    // Check all 4 corners of Pacman
    // If any corner hits a wall (maze[y][x] === 1), return false
}
```

---

# 🔧 4. State Management

## Zustand Overview

We use **Zustand** for state management because:
- Simpler than Redux (no boilerplate)
- React hooks integration
- Built-in persistence

## Game Store Structure

```typescript
interface GameState {
    // Core game state
    score: number;
    level: number;
    isPaused: boolean;
    
    // Sign learning state
    isWaitingForSign: boolean;
    targetWord: string | null;
    currentLetterIndex: number;
    
    // Progression
    wordsCompleted: number;
    masteredLetters: string[];
    level2Unlocked: boolean;
}
```

## Persistence

Game progress is saved to `localStorage`:
- Level
- Words completed
- Mastered letters
- Level 2 unlock status

**Not persisted** (resets on refresh):
- Score
- Current game session

---

# 🧠 5. AI & Recognition Logic

## Real-time vs. Vision API
The system uses a hybrid recognition approach to balance speed, cost, and accuracy.

| Approach | Technology | Pros | Cons |
|----------|------------|------|------|
| **Offline (Local)** | MediaPipe Landmarks | Zero latency, Private, Free | Limited to geometric analysis |
| **Online (Vision)**| Gemini 2.0 Flash | Extremely accurate, Contextual | High latency (~2s), API Costs |

## Initialized Signs (Level 2)
Level 2 introduces "Initialized Signs" - signs that combine a static handshape (representing a letter) with a specific movement pattern.

### Movement Patterns
The system uses a `MovementAnalyzer` that tracks the palm center over a 2-second buffer (60 frames).

| Pattern | Logic | Example Sign |
|---------|-------|--------------|
| **Arc** | Horizontal or Vertical semicircle (detects palm curvature) | **FAMILY**, **TEAM** |
| **Circular**| 360° rotation (detects angle change relative to center) | **GROUP**, **CLASS** |
| **Shake** | Rapid horizontal direction reversals (frequency count) | **BLUE**, **GREEN** |
| **Tap** | Sudden velocity spikes and stops | **WATER** |
| **Forward** | Significant Z-axis change (depth) with X/Y stability | **TRY**, **TEACHER** |

### Fix: Arc Detection (Feb 2026)
Initially, the system only detected vertical arcs. We updated `detectArc` in `movement-analyzer.ts` to support horizontal arcs by checking both `hasVerticalArc` and `hasHorizontalArc` using midpoint deviation from the start-end line.

## API Rate Limiting
To manage Gemini API costs and stay within the free tier quota (15 RPM), we implemented two-tier rate limiting:

1. **Frontend Throttle**: The `SignTranslator` component only triggers a Vision API call every **5 seconds** (max 12 RPM).
2. **Backend Guard**: The `/api/agents/interpreter` endpoint enforces a strict session-based cooldown.

---

# 📊 Summary

## What This Document Covers

| Section | Audience | Purpose |
|---------|----------|---------|
| User Manual | End Users | How to play the game |
| Technical Specs | Ops/DevOps | System requirements |
| Functional Requirements | Product | Feature specifications |
| Design Requirements | Designers | UI/UX specifications |
| Technical Standards | Developers | Coding guidelines |
| Testing Requirements | QA | Test coverage |
| Delivery Requirements | DevOps | Deployment process |
| Support & Maintenance | Support | Troubleshooting |
| Installation Guide | Developers | Setup instructions |
| API Documentation | Backend Devs | Endpoint specs |
| Release Notes | All | Version history |
| Developer Onboarding | New Devs | Getting started |
| System Architecture | Architects | C4 diagrams |
| Data Flow | Developers | How data moves |

## Key Takeaways

1. **SignLang Pacman** is an educational game teaching ASL
2. Built with **Next.js + React + Zustand + MediaPipe**
3. **22 unit tests** with CI/CD via GitHub Actions
4. **Level 2 unlocks** after completing 3 words
5. **No Final Challenge** - teaching mode only with hints
6. Deployed to **Vercel** with automatic staging previews

---

**Signed,**
*Antigravity, Principal Lead Fullstack Engineer*
*Last Updated: 2026-02-04*
