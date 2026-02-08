# 🤟 SignLang Pacman

> **Pacman meets Sign Language.** A gamified educational platform that teaches American Sign Language (ASL) and other sign languages through arcade mechanics and AI-powered real-time verification.

![SignLang Pacman Banner](public/banner-placeholder.png)

## 🌟 Features

### 🎮 Gamified Learning
- **Pacman Gameplay**: Classic arcade mechanics where eating pellets triggers learning events.
- **Level Progression**: Start with fingerspelling (Level 1) and unlock Initialized Signs (Level 2).
- **Instant Feedback**: Computer vision verifies your hand signs in real-time.

### 🤖 AI-Powered SignBridge
- **Linguistic Reasoning Engine**: Powered by **Gemini 2.5 Flash**, this feature goes beyond simple classification. It "watches" a 5-second video of you signing to understand temporal movement.
- **Polyglot Translation**: Translates **initialized words** (Level 2) and **full sentences** (e.g., "HELLO TALL MAN") into English gloss and other sign languages.
- **Syntax Parsing**: Diagnostically identifies Subject, Verb, Object structures in your signing.
- **Hybrid Detection**: Combines MediaPipe (fast/offline) for game controls with Gemini (deep reasoning) for translation.
- **Quota Protection**: Smart 10s cooldowns and frame optimization to respect API limits.

---

## 🏗️ Architecture

### System Context (Level 1)
```mermaid
C4Context
    title System Context Diagram for SignLang Pacman

    Person(user, "Learner", "A user wanting to learn ASL through gamification.")
    System(signApp, "SignLang Pacman", "Next.js Web Application\nProvides game mechanics, sign lessons, and feedback.")
    
    System_Ext(gemini, "Google Gemini API", "Vision & Multimodal AI\nAnalyzes sign language gestures and provides translations.")
    System_Ext(youtube, "YouTube", "Content Source\nProvides videos for transcript services.")
    
    Rel(user, signApp, "Plays game, Signs gestures")
    Rel(signApp, gemini, "Sends video frames, Receives syntax analysis", "JSON/HTTPS")
    Rel(signApp, youtube, "Fetches video content")
```

### Container Architecture (Level 2)
```mermaid
C4Container
    title Container Diagram for SignLang Pacman

    Person(user, "Learner", "Interacts with the app via Browser.")

    Container_Boundary(c1, "SignLang Pacman App") {
        Container(web_app, "Single Page App", "React, Next.js, Tailwind", "Delivers UI, Game Loop, and Logic.")
        Container(api_server, "API Routes", "Next.js Server API", "Handles specific backend agents and proxies.")
        Container(store, "Client Store", "Zustand", "Manages Game State, Sign State, and User Progress.")
    }

    System_Ext(gemini, "Gemini Vision API", "Google Cloud", "Processes Sign Language Images.")
    System_Ext(mediapipe, "MediaPipe Tasks", "WASM Library", "In-browser Hand Landmarking for fast feedback.")

    Rel(user, web_app, "Uses", "HTTPS")
    Rel(web_app, store, "Reads/Writes State")
    Rel(web_app, gemini, "Direct SDK Calls (Vision)", "HTTPS/SDK")
    Rel(web_app, mediapipe, "Real-time Tracking", "WASM")
    Rel(web_app, api_server, "Calls Internal APIs", "JSON/HTTPS")
```

### Component Architecture (Level 3)
```mermaid
C4Component
    title Component Diagram for SignLang Pacman (Frontend)

    Container_Boundary(spa, "Single Page Application") {
        
        Component(game_page, "Page.tsx", "Next.js Page", "Main Entry Point & Layout Orchestrator.")
        
        Component(game_engine, "GameCanvas / GameEngine", "TS Class + Canvas", "Handles Pacman Physics, Collision, Rendering loop.")
        
        Component(sign_bridge, "SignBridge", "React Component", "Manages 'Listening' mode, captures video, coordinates Translation.")
        
        Component(hand_tracker, "CameraView / HandTracking", "MediaPipe Integration", "Captures webcam, overlays landmarks, detects geometric signs.")
        
        Component(service_gemini, "GeminiService", "TypeScript Module", "Encapsulates GoogleGenAI SDK, Prompt Engineering, and Response Parsing.")
        
        Component(store_game, "GameSlice", "Zustand Store", "Tracks Score, Level, Pellets.")
        
        Component(sys_ui, "UI Components", "Shared", "SignDisplay, Popups, Buttons.")

        System_Ext(google_genai_sdk, "Google GenAI SDK", "External Module", "Client-side library for interacting with Gemini API.")

        Rel(game_page, game_engine, "Renders")
        Rel(game_page, sign_bridge, "Renders")
        Rel(game_engine, store_game, "Updates Score/State")
        
        Rel(sign_bridge, hand_tracker, "Controls Camera")
        Rel(sign_bridge, service_gemini, "Calls translateSign / generateVisual")
        Rel(service_gemini, "google_genai_sdk", "Uses")
    }
```

### Code Architecture (Level 4)
```mermaid
classDiagram
    direction TB
    
    class SignBridge {
        +Region sourceRegion
        +Region targetRegion
        +handleCapture(frames)
        -translateSign()
        -generateVisual()
    }

    class GeminiService {
        +translateSign(frames, source, target): TranslationResult
        +generateSignVisual(description, target): string
        +generateMultipleSignVisuals(signs, target)
        -getAI(): GoogleGenAI
    }

    class TranslationResult {
        +string sourceText
        +string gloss
        +GrammarPart[] grammarStructure
        +string targetText
        +string visualDescription
    }

    class GameEngine {
        +update(deltaTime)
        +render(ctx)
        +checkCollisions()
        +reset()
    }

    SignBridge --> GeminiService : Uses
    GeminiService ..> TranslationResult : Returns
    TranslationResult *-- GrammarPart : Contains
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Webcam

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/signlang-pacman.git
   cd signlang-pacman
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create `.env.local` and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 19, Tailwind CSS
- **Game Engine**: Custom Canvas-based engine
- **State Management**: Zustand
- **AI/ML**: Google Gemini 2.5 Flash, MediaPipe Tasks
- **Testing**: Jest, React Testing Library

### Python Utility Scripts
Two helper scripts are included for asset preparation (no ML model training involved):

| Script | Purpose | Dependencies |
|--------|---------|--------------|
| `extract_asl.py` | Extracts individual ASL hand signs from a composite image | PIL, NumPy |
| `check_grid.py` | Debug helper for verifying grid alignment | PIL |

### 🖐️ Gesture Recognition Pipeline

The app features a **hybrid client-side gesture recognition system** that works alongside the cloud-based Gemini API:

| Component | Purpose |
|-----------|---------|
| `static-gestures.ts` | Detects handshapes (POINT, C_SHAPE, Y_SHAPE, etc.) from MediaPipe landmarks |
| `movement-analyzer.ts` | Analyzes temporal movement patterns (CIRCULAR, TAP, FORWARD, etc.) |
| `hybrid-recognizer.ts` | Score-based matching against the WLASL dictionary |
| `wlasl-dictionary.ts` | **100+ common ASL signs** with handshape, movement, and location definitions |

**Supported Sign Categories:**
- Pronouns (ME, YOU, THEY)
- Verbs (EAT, DRINK, SLEEP, WANT, CALL, WORK, HELP, etc.)
- Greetings (HELLO, BYE, THANK-YOU, PLEASE)
- Question Words (WHAT, WHERE, WHO, WHEN, WHY, HOW)
- Time Words (NOW, TODAY, TOMORROW, YESTERDAY)
- Family (MOTHER, FATHER, FRIEND, BABY)
- And more...

### 🖼️ Visual Reference Generation

Sign language visual demonstrations are generated using:
1. **Gemini 2.0 Flash** (native image generation) - Primary
2. **Imagen 3** - Fallback
3. **Placeholder** - Final fallback

Rate limiting is applied (5 requests/minute) to respect API quotas.

> **Note**: This project does **not** use TensorFlow, PyTorch, or custom ML model training. Sign recognition is powered by cloud-based Gemini Vision API and on-device MediaPipe (pre-trained).

---

## 📚 Documentation

For detailed technical documentation, please refer to [documentation.md](./documentation.md).
- [System Architecture](./documentation.md#-1-system-architecture-c4-model)
- [Data Flow Diagrams](./documentation.md#-2-system-design--data-flow)
- [Game Logic](./documentation.md#-3-game-engine-logic)

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
