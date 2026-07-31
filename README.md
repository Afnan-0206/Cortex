<div align="center">

<h1>⚡ Cortex</h1>
<p><strong>Real-time competitive mental athletics & brain-training platform.</strong></p>
<p>Replace doomscrolling with sharp, focused 1v1 math, logic, memory, and puzzle duels.</p>

[![Expo SDK](https://img.shields.io/badge/Expo-SDK%2057-000020?logo=expo&logoColor=white)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![License](https://img.shields.io/badge/License-MIT-F1F5F9)](LICENSE)

<br/>

![Cortex Banner](https://img.shields.io/badge/Status-Active%20Beta-FBBF24?style=for-the-badge)

</div>

---

## What is Cortex?

Cortex is a **mobile mental-athletics platform** where users compete in live 1v1 duels, solve logic and arithmetic puzzles, maintain daily streaks, and climb global leaderboards. Built for people who want to sharpen their minds with fast-paced, competitive, and scientific practice.

**Design philosophy:** Premium, high-contrast, linear-grade UI. Smooth 60fps animations, haptic feedback, dark mode aesthetic, and zero visual clutter.

---

## 🎮 Game Modes & Competitive Arena

Cortex features 4 core cognitive disciplines with dedicated, standalone 1v1 game modes:

### 🔢 MATH SECTION (Mental Arithmetic & Reaction)
* **Sprint Duels (`/battle`)**: 60-second unlimited speed arithmetic. Formatted with vertical stacked column calculations, operator lines, glowing input box, and custom numeric keypad.
* **Fast & First Duels (`/fast-first`)**: 5-round reaction race. Both players see the same calculation at the same time. The first to answer correctly wins the point; wrong answers trigger a 2-second penalty lockout!

### 🧩 PUZZLE SECTION (Logic & Constraint Satisfaction)
* **Sudoku Duels (`/sudoku-duel`)**: 4×4 Mini Sudoku logic race. Fill missing numbers in rows, columns, and 2×2 boxes faster than your opponent. Wrong placement = -2s penalty & 1s lockout.
* **Cross Math Duels (`/cross-math-duel`)**: 3×3 arithmetic grid constraint solving. Fill missing numbers so all row and column edge target equations balance. Wrong placement = -3s penalty & 1s lockout.
* **KenKen Duels (`/kenken-duel`)**: 4×4 Sudoku rules combined with arithmetic cages (`3+`, `12×`, `3−`, `2÷`). Fill numbers to satisfy cage targets without repeating digits in rows/columns.
* **Math Maze Duels (`/math-maze-duel`)**: Sequential path-finding arithmetic race. Navigate through operation doors (`+6`, `×2`, `−4`) to reach the Target Number before your rival.

### 🧠 MEMORY SECTION (Visual Memory & Mental Calculation)
* **Mind Snap Duels (`/mind-snap-duel`)**: 3-round visual memory battle (`Symbol Recall`, `Color & Shape Recall`, `Sequence Recall`). Memorize target symbols in 1.5s–2.5s observe phase, then recall from selection grid. Includes interactive *"How to play?"* modal.
* **Flash Anzan Duels (`/flash-anzan-duel`)**: 3-round high-speed mental addition. Numbers flash rapidly on screen (0.6s–0.8s each). Keep the running sum in your head and type the total sum. Includes interactive *"How to play?"* modal.

### 💡 LOGIC SECTION (Mixed-Cognition & Shortcuts)
* **Ability Duels (`/ability-duel`)**: 5-round flagship mixed-cognition battle switching through:
  1. *Math Shortcut* (e.g. `48 × 25 = 4800 ÷ 4 = 1200`)
  2. *Logic Pattern* (e.g. `1, 4, 2, 8, 3, 12, ?`)
  3. *Memory Position Recall* (2s spatial observe)
  4. *Estimation* (e.g. `198 × 49 ≈ 10,000`)
  5. *Surprise Round* (e.g. `15% off ₹240 = ₹36`)

---

## 🏆 Standardized Victory & Defeat Results Screen

All game modes feature a standardized results screen (`CortexVictoryDefeatView`):
- **Hero Banner**: Gold Trophy (`VICTORY`) or Silver Trophy (`DEFEAT`) with earned Coins and XP.
- **Data Comparison**: Blue User vs Red Opponent profile avatars, correct answers ratio progress bar.
- **Performance Metrics**:
  - `AVG TIME PER QUESTION` (s)
  - `ACCURACY %`
  - `MAX STREAK 🔥`
- **Action CTAs**: `Play Next Match` / `Try Again` and `Back to Arena`.

---

## Tech Stack

### Frontend
| Technology | Purpose |
|:---|:---|
| React Native (Expo SDK 57) | Cross-platform mobile app |
| TypeScript | End-to-end type safety |
| Expo Router (v4 file-based) | Standalone and tab navigation |
| Zustand | Global state management |
| React Native Reanimated | 60fps animations |
| Expo Haptics | Tactile feedback |
| Expo Location & Contacts | Local match setup & permissions |

### Backend
| Technology | Purpose |
|:---|:---|
| Supabase Postgres | Primary database (11 tables) |
| Supabase Realtime | Live battle sync & presence |
| Supabase Auth | Authentication & RLS |
| Deno Edge Functions | Matchmaking & game clock |

---

## Architecture

```
Cortex/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          # Arena Home (Presence, Duels Tray, Insights)
│   │   ├── battle.tsx         # 60s Unlimited Sprint Duels
│   │   ├── puzzles.tsx        # Daily Quests & Puzzle Hub
│   │   ├── compete.tsx        # Leagues & Divisions
│   │   ├── nets.tsx           # Offline Practice Presets
│   │   ├── profile.tsx        # Athlete Profile & Streak Rewards
│   │   └── leaderboard.tsx    # Global Rankings
│   ├── fast-first.tsx         # Fast & First 5-Round Reaction Race
│   ├── sudoku-duel.tsx        # Sudoku 4x4 Mini Logic Race
│   ├── cross-math-duel.tsx    # Cross Math 3x3 Grid Puzzle
│   ├── kenken-duel.tsx        # KenKen 4x4 Cage Arithmetic Duel
│   ├── math-maze-duel.tsx     # Math Maze Path-Finding Duel
│   ├── mind-snap-duel.tsx     # Mind Snap 3-Round Memory Battle
│   ├── flash-anzan-duel.tsx   # Flash Anzan High-Speed Addition
│   └── ability-duel.tsx       # Ability Duels 5-Round Mixed Cognition
│
├── src/
│   ├── components/
│   │   └── CortexVictoryDefeatView.tsx # Standardized Results View
│   ├── store/
│   │   ├── authStore.ts       # User authentication Zustand store
│   │   ├── userStore.ts       # User profile, streak, & daily progress
│   │   └── battleStore.ts     # 60s Battle state store
│   ├── logic/
│   │   ├── sudokuGenerator.ts     # Dynamic 4x4 Sudoku puzzle generator
│   │   ├── crossMathGenerator.ts  # Dynamic 3x3 Cross Math generator
│   │   ├── kenkenGenerator.ts     # Dynamic 4x4 KenKen cage generator
│   │   ├── mathMazeGenerator.ts   # Dynamic Math Maze path generator
│   │   ├── mindSnapGenerator.ts   # Dynamic 3-round memory generator
│   │   ├── flashAnzanGenerator.ts # Dynamic 3-round flash addition generator
│   │   └── abilityGenerator.ts    # Dynamic 5-round mixed cognition generator
│   └── theme/
│       └── colors.ts          # Color tokens and design system
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- Expo CLI (`npm install -g expo-cli`)
- Supabase project ([supabase.com](https://supabase.com))

### 1. Clone & Install

```bash
git clone https://github.com/Afnan-0206/Cortex.git
cd Cortex
npm install
```

### 2. Configure Environment

Create a `.env.local` file:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run Locally

```bash
npx expo start -c
```

Scan the QR code with Expo Go or run on iOS/Android simulator.

---

## License

MIT © 2026 [Afnan](https://github.com/Afnan-0206)

---

<div align="center">
<p><strong>Built with focus. Designed for athletes.</strong></p>
<p><sub>Cortex · Real-Time Competitive Brain Training</sub></p>
</div>
