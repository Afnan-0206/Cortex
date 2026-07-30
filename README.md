<div align="center">

<h1>⚡ Cortex</h1>
<p><strong>Real-time competitive brain-training for mental athletes.</strong></p>
<p>Replace doomscrolling with sharp, focused 1v1 math duels.</p>

[![Expo SDK](https://img.shields.io/badge/Expo-SDK%2057-000020?logo=expo&logoColor=white)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![License](https://img.shields.io/badge/License-MIT-F1F5F9)](LICENSE)

<br/>

![Cortex Banner](https://img.shields.io/badge/Status-Closed%20Beta-FBBF24?style=for-the-badge)

</div>

---

## What is Cortex?

Cortex is a **mobile mental-athletics platform** where users compete in live 1v1 math battles, solve daily puzzles, maintain streaks, and climb global leaderboards. It's built for people who want to sharpen their mind the same way athletes sharpen their body — with consistent, competitive practice.

**Design philosophy:** Linear/Apple-grade editorial minimalism. No neon, no glassmorphism, no gamer UI. Every pixel exists because it earns its place.

---

## Screenshots

> _Coming with closed beta release._

---

## Features

### 🥊 Live 1v1 Battle Engine
- Real-time rated duels with server-authoritative game clock
- 10 timed math questions per match (20s per question)
- Progressive timer urgency: calm → amber pulse (10s) → red pulse + haptics (5s)
- Supabase Realtime subscriptions for live score sync

### 🧠 Smart Matchmaking
- ELO-based rating system (K=32, standard chess formula)
- **Rating volatility buffer:** ±100 ELO for first 10 matches to prevent newbie frustration
- **Queue time decay:** Rating window expands +50 ELO every 15 seconds of waiting
- Deno Edge Function: `find-match` with automatic question seeding

### 📊 Tactical Insights
- Post-match operation-specific speed breakdown ("You were 0.3s faster on division")
- Direct deep-link CTA to targeted Practice Nets presets
- No generic feedback — every insight is calculated from actual match answers

### 🏆 Leaderboard & Leagues
- Global weekly and all-time rankings
- 5 ELO divisions: Bronze → Silver → Gold → Diamond → Ruby
- Transparent scoring formula: `Score = Wins × 10 + (Accuracy% × 5) + Streak Bonus`
- Sticky "Your Rank" pane — always visible, even when scrolling

### 🧩 Daily Cross-Math Puzzles
- 3×3 matrix puzzle grid with daily challenge reset
- +50 XP reward per completion
- Offline-capable

### 📡 Realtime Presence
- Live "Athletes Online" carousel powered by Supabase Realtime Presence
- Friends section (green dot) vs Global athletes (gray dot) — friends-first
- Haptic feedback on athlete selection

### 🔔 Retention Mechanics
- **Daily 8:00 PM streak reminders** via Expo Push Notifications
- User-controlled notification toggles (Streak Reminders + Match Invites)
- Physical streak rewards roadmap: T-Shirt (50d) → Hoodie (200d) → Bentley Track Day (365d)

### 🎯 Practice Nets
- 6 offline practice operation presets: Addition, Subtraction, Multiplication, Division, Square Root, Cube Root
- Configurable digit complexity (2-digit to 16-digit)
- Directly linked from Tactical Insights card

---

## Tech Stack

### Frontend
| Technology | Purpose |
|:---|:---|
| React Native (Expo SDK 57) | Cross-platform mobile |
| TypeScript | End-to-end type safety |
| Expo Router (file-based) | Navigation |
| Zustand | Global state management |
| React Native Reanimated | 60fps animations |
| Expo Haptics | Tactile feedback |
| Expo Notifications | Push notifications |

### Backend
| Technology | Purpose |
|:---|:---|
| Supabase Postgres | Primary database (11 tables) |
| Supabase Realtime | Live battle sync + Presence |
| Supabase Auth | Authentication + RLS |
| Deno Edge Functions | Matchmaking + game clock |
| Row Level Security | Per-user data isolation |

---

## Architecture

```
cortex/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          # Arena Home (Presence, Insights, CTA)
│   │   ├── battle.tsx         # Live 1v1 Duel Screen
│   │   ├── puzzles.tsx        # Daily Cross-Math Puzzles
│   │   ├── compete.tsx        # Leagues & Divisions
│   │   ├── nets.tsx           # Offline Practice Presets
│   │   ├── profile.tsx        # Athlete Profile & Streak Rewards
│   │   └── leaderboard.tsx    # Global Rankings
│   └── onboarding/            # 3-screen gamified onboarding
│
├── src/
│   ├── components/            # CortexCard, CortexButton, AthleteTile…
│   ├── store/
│   │   ├── authStore.ts       # Auth + profile Zustand store
│   │   └── battleStore.ts     # Server-authoritative battle state
│   ├── logic/
│   │   └── elo.ts             # ELO rating calculation (K=32)
│   └── theme/
│       ├── colors.ts          # Precision color system (dark + light)
│       └── typography.ts      # Geist/SF Pro scale (Display 40 → Micro 11)
│
├── lib/
│   ├── supabase.ts            # Supabase client
│   ├── notifications.ts       # Push notification scheduling
│   ├── analytics.ts           # Product telemetry tracker
│   ├── sentry.ts              # Crash reporting & error boundaries
│   └── hooks/
│       └── usePresence.ts     # Supabase Realtime Presence hook
│
└── supabase/
    ├── migrations/
    │   └── 0001_cortex_schema.sql   # 12 tables, RLS policies, Realtime
    ├── seed.sql                     # 200 questions, puzzles, achievements
    └── functions/
        ├── find-match/              # Matchmaking Edge Function (queue decay)
        └── advance-question/        # Server-authoritative timer & ELO update
```

---

## Database Schema

| Table | Purpose |
|:---|:---|
| `profiles` | User data, ELO rating, streak, guest_id, last_tactical_insight |
| `presence` | Live online status |
| `match_queue` | Matchmaking queue with timestamps for decay |
| `matches` | Match records with rating_delta_p1/p2, rematch_count |
| `battle_state` | Server-authoritative question index + timer |
| `questions` | 200+ math questions with difficulty levels |
| `match_questions` | Randomly assigned question sets per match |
| `answers` | Per-user, per-question answer records |
| `daily_puzzles` | Cross-math puzzle of the day |
| `achievements` | Achievement definitions |
| `user_achievements` | Per-user unlock tracking |
| `activity_feed` | Social feed events (streak milestones, promotions) |

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

### 3. Set Up Database

Run migrations in your Supabase SQL editor:

```bash
# Apply schema
cat supabase/migrations/0001_cortex_schema.sql | supabase db push

# Seed questions and achievements
cat supabase/seed.sql | supabase db push
```

### 4. Deploy Edge Functions

```bash
supabase functions deploy find-match
supabase functions deploy advance-question
```

### 5. Run Locally

```bash
npx expo start -c
```

Scan the QR code with Expo Go or run on a simulator.

---

## Design System

Cortex uses a precision color system with no glassmorphism, no neon, and no full-screen gradients.

| Token | Dark | Light |
|:---|:---|:---|
| `bg` | `#0A0C10` | `#F8FAFC` |
| `surface` | `#12151C` | `#FFFFFF` |
| `surfaceAlt` | `#181C26` | `#F1F5F9` |
| `accentPrimary` | `#3B82F6` | `#0F172A` |
| `textPrimary` | `#F1F5F9` | `#0F172A` |
| `success` | `#34D399` | `#059669` |
| `warning` | `#FBBF24` | `#D97706` |
| `error` | `#F87171` | `#DC2626` |

**Typography scale:** Display 40/44 → Title 28/32 → Heading 22/28 → Body 16/24 → Caption 13/18 → Micro 11/16. All numeric readouts use `tabular-nums`.

**Contrast:** `textPrimary` on `bg` = ~14.8:1 (AAA). CTA text on button = ~14.8:1 (AAA).

---

## Roadmap

| Status | Feature |
|:---|:---|
| ✅ | Live 1v1 Battle Engine (server-authoritative) |
| ✅ | ELO Matchmaking + Queue Decay |
| ✅ | Supabase Realtime Presence |
| ✅ | Tactical Insights Card |
| ✅ | Leaderboard + Scoring Legend Modal |
| ✅ | Daily Push Notification Reminders |
| ✅ | Sentry Crash Reporting |
| ✅ | 5-Tab Navigation (Arena / Puzzles / Compete / Nets / More) |
| 🟡 | Guest Play (3 battles before sign-up) |
| 🟡 | Activity Feed |
| 🟡 | Battle Replay Sharing |
| ⚪ | Teacher Dashboard (B2B) |
| ⚪ | Tournament Mode |
| ⚪ | Stripe Premium Tier |

---

## Contributing

This project is in **closed beta**. Public contributions will open post-v1.0. Watch the repo for updates.

---

## License

MIT © 2024 [Afnan](https://github.com/Afnan-0206)

---

<div align="center">
<p><strong>Built with focus. Designed for athletes.</strong></p>
<p><sub>Cortex · Where the Smart Hangout</sub></p>
</div>
