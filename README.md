<div align="center">

<h1>⚡ Cortex</h1>
<p><strong>Real-time competitive mental athletics & brain-training platform.</strong></p>
<p>Replace doomscrolling with sharp, focused 1v1 math, logic, memory, and puzzle duels.</p>

[![Expo SDK](https://img.shields.io/badge/Expo-SDK%2057-000020?logo=expo&logoColor=white)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![License](https://img.shields.io/badge/License-MIT-F1F5F9)](LICENSE)

<br/>

![Cortex Banner](https://img.shields.io/badge/Status-Production%20Hardened-22C55E?style=for-the-badge)

</div>

---

## 🚀 Overview

Cortex is a **mobile mental-athletics platform** where users compete in live 1v1 duels, solve logic and arithmetic puzzles, maintain daily streaks, and climb global leaderboards. Built for people who want to sharpen their minds with fast-paced, competitive, and scientific practice.

**Design philosophy:** Premium, high-contrast, linear-grade UI. Smooth 60fps animations, haptic feedback, dark mode aesthetic, and zero visual clutter.

---

## 🎮 Game Modes & Competitive Arena

Cortex features 4 core cognitive disciplines with dedicated, standalone 1v1 game modes:

### 🔢 MATH SECTION (Mental Arithmetic & Reaction)
* **Sprint Duels (`/battle`)**: 60-second unlimited speed arithmetic. Formatted with vertical stacked column calculations, operator lines, glowing input box, and custom numeric keypad.
* **Fast & First Duels (`/fast-first`)**: 5-round reaction race. Both players see the same calculation at the same time. The first to answer correctly wins the point; wrong answers trigger a 2-second penalty lockout!

### 🧩 PUZZLE SECTION (Logic & Constraint Satisfaction)
* **Sudoku Duels (`/sudoku-duel`)**: 4×4 Mini Sudoku logic race. Fill missing numbers in rows, columns, and 2×2 boxes faster than your opponent.
* **Cross Math Duels (`/cross-math-duel`)**: 3×3 arithmetic grid constraint solving. Fill missing numbers so all row and column edge target equations balance.
* **KenKen Duels (`/kenken-duel`)**: 4×4 Sudoku rules combined with arithmetic cages (`3+`, `12×`, `3−`, `2÷`).
* **Math Maze Duels (`/math-maze-duel`)**: Sequential path-finding arithmetic race. Navigate through operation doors (`+6`, `×2`, `−4`) to reach the Target Number.

### 🧠 MEMORY SECTION (Visual Memory & Mental Calculation)
* **Mind Snap Duels (`/mind-snap-duel`)**: 3-round visual memory battle (`Symbol Recall`, `Color & Shape Recall`, `Sequence Recall`).
* **Flash Anzan Duels (`/flash-anzan-duel`)**: 3-round high-speed mental addition. Numbers flash rapidly on screen (0.6s–0.8s each).

### 💡 LOGIC SECTION (Mixed-Cognition & Shortcuts)
* **Ability Duels (`/ability-duel`)**: 5-round flagship mixed-cognition battle combining shortcuts, logic patterns, and spatial memory.

---

## 🏗️ Architecture Diagram

```
Cortex Application Architecture
├── app/                              # Expo Router v57 File-Based Routes
│   ├── (auth)/                       # Auth Flow (login, email authentication)
│   ├── (tabs)/                       # Tab Bar (Arena, Compete, Quests, Feed, Daily, Profile)
│   └── [duel-screens]/               # Fullscreen Standalone Arena Duels
├── lib/                              # Core Infrastructure Services
│   ├── secureStorage.ts              # Encrypted KeyStore Adapter (iOS Keychain / Android Keystore)
│   ├── supabase.ts                   # Supabase Singleton Client with PKCE Auth
│   ├── circuitBreaker.ts             # Matchmaking Degradation Circuit Breaker
│   ├── analytics.ts                  # Event Telemetry Tracker
│   └── sentry.ts                     # Crash Reporting Telemetry
├── src/
│   ├── components/                   # Shared Design System Components & ErrorBoundary
│   ├── logic/                        # Procedural Puzzle Generators & ELO Algorithms
│   ├── store/                        # Consolidated Zustand State (userStore, battleStore, friendStore)
│   ├── theme/                        # HSL Tokens (colors, spacing, typography)
│   ├── types/                        # Core TypeScript Interfaces
│   └── __tests__/                    # Unit Test Suites (scoring, ELO, generators)
└── supabase/
    └── migrations/                   # PostgreSQL DB Migrations (0001 to 0008)
```

---

## 🔑 Environment Variables

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

## 🛠️ Local Development & Testing

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Type Safety Check
```bash
npx tsc --noEmit
```

### 3. Start Expo Local Server
```bash
npx expo start
```

---

## 🔒 Security & Backend Infrastructure

* **Encrypted Authentication Storage:** GoTrue tokens are stored natively in **iOS Keychain** / **Android Keystore** via `expo-secure-store`.
* **Server-Authoritative Scoring:** Match outcomes and ELO calculations are validated server-side using PostgreSQL Security Definer RPC `submit_match_result` (`supabase/migrations/0008_idempotent_battle_rpc.sql`).
* **App Store Compliance:** Zero overscoped permissions. Account deletion flow implemented per Apple App Store Guideline 5.1.1(v).

---

## 📦 Building for Production

### Android Release APK / AAB
```bash
eas build --platform android --profile production
```

### iOS App Store Build
```bash
eas build --platform ios --profile production
```
