# CSCI 1380 · Intro to Python — Final Exam Review & Study Studio

An interactive web study guide built for **CSCI 1380 (Intro to Python)** covering **Weeks 1–12** through visual step-by-step code execution tracers, synced audio walkthroughs, weekly hands-on labs, an 18-question mock exam, and an optional AI Voice Tutor.

All code traces and practice outputs are strictly beginner-level Python 3 (verified against Python 3) and run as bounded client-side simulations — **no Python installation, login, or API key is required** to use the study guide, Code Flow Lab, audio walkthroughs, or mock exam.

---

## Features

### 1. Interactive Code Flow Lab (9 Topics · 19 Step-by-Step Scenarios)
Watch real Python code execute line by line with distinct visual cues — a gliding **blue execution & index pointer** paired with **emerald memory updates** (`old → new` transitions):
- **Lists & Indexing (Week 6):** Positive (`[0]..[3]`) and negative (`[-4]..[-1]`) index ribbon, inclusive/exclusive slicing (`items[1:3]`), in-place mutation, `append()`, and animated left-shifting after `del`.
- **`for` Loops (Weeks 6–7):** `for i in range(len(scores))` with a live `range(...)` sequence track, gliding list pointer, and running accumulator; plus `for item in list` with conditional filtering.
- **`while` Loops (Weeks 4 & 6):** Condition gate (`True` / `False`) counter accumulator and sentinel-controlled exit loop (`0`).
- **Nested Loops & `break` / `continue` (Week 7):** Live 2D `(row, col)` matrix traversal and a loop track contrasting `continue` (skip current turn) vs. `break` (exit loop).
- **Conditionals Waterfall (Week 5):** Interactive `if` / `elif` / `else` scenarios (`score = 92`, `81`, `65`) showing evaluated checks vs. skipped branches.
- **Functions & Scope (Weeks 9–10):** Animated **Global Frame** vs. temporary **Local Frame** lifecycle, `return` handoff, and local variable shadowing.
- **Files (`r` / `w` / `a`) (Week 3):** Simulated disk state for `notes.txt` contrasting `"w"` (overwrite) vs. `"a"` (append) and `"r"` (read).
- **Dictionaries, Tuples & Sets (Week 11):** Live `key → value` updates, immutable tuple indexing, and unordered `set` deduplication / membership checks.
- **Variables & Math (Week 2):** True division `/`, floor division `//`, modulo `%`, and `str` concatenation vs. `int()` casting.

Each scenario supports **Play / Pause**, **Prev / Next**, `1x / 1.5x` speed, clickable step scrubber, and `← / →` keyboard navigation.

### 2. Synced HD Audio Walkthroughs (Zero Runtime API Quota)
- Every one of the **19 Code Flow Lab scenarios** includes a pre-generated neural voice walkthrough stored statically in `public/audio/flows/*.mp3`.
- Includes a progress scrubber, **Sync steps: On/Off** (automatically advances the code & visual diagrams in time with the audio), and a collapsible **Script** transcript for reading along quietly.

### 3. Weekly Practice Guide (Weeks 1–12)
- **12 Interactive Weekly Micro-Labs:** Pipeline ordering (`.py` workflow), `input()` vs. `int()` memory boxes, file mode comparator, interactive boundary sliders & flowcharts, `elif` waterfall & boolean logic switchboard, list index ribbon, `break`/`continue` & 2D grid, Week 8 midterm readiness review, function shelf, Global vs. Local scope frames, data structure workbench, and Load → Edit → Save architecture.
- **24 Original Practice Questions:** One-at-a-time practice with instant feedback, clear explanations, and contextual jump buttons straight to the matching Code Flow tracer.
- **Local Progress Tracking:** Mastered questions, practiced weeks, and best mock score save automatically in `localStorage` with a one-click **Reset progress** button.

### 4. Strict Mixed Mock Exam (18 Questions)
- Mixes questions across Weeks 1–12 with **no hints, solutions, or tutor access** during the attempt.
- Displays a full question-by-question answer review after submission and a focused **Practice Missed Questions** retry mode.

### 5. Optional Voice Tutor (Gemini)
- Scoped strictly to CSCI 1380 fundamentals (Weeks 1–12) with text Q&A, push-to-record voice notes (`/api/transcribe`), and hands-free Live Voice mode via ephemeral tokens (`/api/live-token`).
- Protected by per-IP and global serverless rate limits (`api/_rateLimit.js`), a 5/day Live session limit on the public review page, and automatic 90-second idle WebSocket disconnect.

### 6. Crafted UI/UX & Accessibility
- **Light & Dark Soft-Neumorphic Design** with animated theme toggle and clean typography (`Inter` + `JetBrains Mono`).
- **GPU-Accelerated Motion** (`framer-motion` spring pills, smooth mode transitions, and tactile micro-interactions) that fully respects `prefers-reduced-motion`.
- **Responsive & Accessible:** Clean mobile layout down to `375px` with zero horizontal overflow and visible `:focus-visible` keyboard outlines.

---

## Tech Stack

- **Frontend:** React 19, Vite 6, Tailwind CSS v4, Framer Motion, Lucide React
- **Serverless API (Vercel):** Node.js functions in `api/` (`live-token.js`, `transcribe.js`, `tts.js`, `tutor.js`, `verify-pin.js`, `_rateLimit.js`)
- **Static Media:** Pre-generated neural `.mp3` walkthroughs in `public/audio/flows/`

---

## Local Development

```bash
npm install
cp .env.example .env
# Optional: add GEMINI_API_KEY in .env if you want to test the Voice Tutor locally
npm run dev
```

Build for production:

```bash
npm run build
```

---

## Deploying to Vercel

1. Import this repository into Vercel (Framework Preset: **Vite**).
2. Configure **Project Settings → Environment Variables**:
   - `GEMINI_API_KEY` — Server-side Gemini API key (required only for the optional Voice Tutor).
   - `TEAM_PIN` — Optional custom PIN for the private lazy-loaded `/team` route.
   - **Important:** Do **not** set `VITE_GEMINI_API_KEY` in Vercel production so your API key is never bundled into client JavaScript.
3. Deploy — `vercel.json` configures SPA routing (excluding `/api/*`, `/assets/*`, and `/audio/*`) and standard HTTP security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy`).
