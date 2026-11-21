# Student Club Member Directory — Interactive Code Review

Interactive zyBooks-style visual guide, live Python simulator, challenge bank, and Gemini-powered Voice Code Tutor built for **CSCI 1380 · Final Project Prompt #8** (Jeremy Hernández, Sara Astorga, and Felix Martinez).

## Features

1. **Interactive Code Map** — Clean Python source (`student_club_directory.py`) with clickable section breakdowns and presentation scripts.
2. **File Parser Lab** — Step-by-step animated pipeline showing `readlines()`, `replace("\n", "")`, `split(" | Role: ")`, character index slicing (`[0:6]` / `[6:]`), `if` validation, and `append()`.
3. **Live Python Simulator** — Interactive terminal synced with animated parallel lists (`member_list`, `member_roles`) and live `directory.txt` updates.
4. **`choose_member()` & `-1` Tracer** — Animated loop tracer demonstrating 1-based display numbers vs. 0-based list indices and sentinel cancellation (`-1`).
5. **12 Challenges & Speaking Split** — Categorized CSCI 1380 study bank with hints, code snippets, streak tracking, and a 3-person presentation split.
6. **Voice Code Tutor (Gemini Flash)** — Voice & text Q&A drawer with live microphone input, spoken replies, Mock Professor mode, and secure Vercel serverless routing (`/api/tutor`).

## Local Development

```bash
npm install
cp .env.example .env
# Add your Gemini API key to .env
npm run dev
```

## Deploying to Vercel

1. Import this repository into Vercel (Framework Preset: **Vite**).
2. Add the environment variable `GEMINI_API_KEY` in **Project Settings → Environment Variables**.
3. Deploy — the serverless function at `api/tutor.js` handles Gemini requests securely server-side so your API key is never exposed to clients.
