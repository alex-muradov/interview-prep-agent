# Product Requirements Document — interview-prep-agent

**Version:** 1.0
**Date:** 2026-06-22
**Status:** Active

---

## Problem

Job seekers preparing for technical and product interviews face three compounding problems:

1. **No personalised starting point** — generic prep resources don't know your background, your target roles, or your actual gaps. Self-assessment is unreliable.
2. **No closed loop** — people study, then stop. There's no system that notices a missed session, detects a knowledge gap forming, and adapts the plan.
3. **No memory** — every prep session starts from scratch. Notes get lost. Progress isn't tracked. The plan drifts.

Existing tools (Leetcode, Notion templates, YouTube playlists) are passive. They don't observe, replan, or remind. The learner must do all the coordination themselves — which is exactly what breaks down under interview pressure.

---

## Solution

An autonomous local agent that lives in Claude Code and runs on the user's machine. It:

1. Reads saved job positions to understand what the user is targeting
2. Runs an adaptive exam to establish real skill baseline (not self-reported)
3. Builds a personalised curriculum across tracks derived from the positions
4. Delivers lessons using proven learning science (retrieval practice, spaced repetition, zone of proximal development)
5. Runs a daily heartbeat that detects gaps, adapts the plan, and notifies the user

Everything runs locally. No accounts, no subscriptions, no cloud sync.

---

## Users

**Primary:** Individual job seekers preparing for technical or product interviews, with any background and any target role type.

**Designed around:** A technical product manager with engineering background targeting AI PM and AI Engineering roles at Tier 1 firms, with 6–10 weeks to prepare.

**Works for:** Anyone who can run Claude Code on macOS and has saved job positions in Markdown.

---

## Success Metrics

- User completes onboarding and receives a curriculum in one session
- Exam baseline meaningfully adjusts the curriculum vs a generic plan (at least 1 topic skipped or added per track)
- User receives a morning notification on every session day
- After 4+ sessions, confidence ratings trend upward (loop detects high streak)
- User is interview-ready within the planned timeline ±1 week

---

## Scope

### In scope (v1)
- Onboarding: CV, position source, time, deadline, adaptive exam
- Position analysis: note-signal scoring, profile match, track clustering
- Curriculum: 3 options, adjusted by exam baseline, week-by-week plan
- Sessions: adaptive topic selection, grilling-based teaching, confidence validation
- Spaced repetition: automatic review scheduling post-session
- Learning loop: daily cron, 6 detection conditions, silent replanning, adapted notification
- Apple Calendar integration via osascript
- Handwritten notes via Claude vision
- Position updates via `/interview-prep-agent update`

### Out of scope (v1)
- Multi-user support
- Cloud sync or mobile
- Automated job application tracking
- Integration with ATS or LinkedIn API
- Windows / Linux support (osascript is macOS-only)

---

## Constraints

- Must run entirely locally — no external services beyond Claude API
- macOS only (Calendar + notifications via osascript)
- Requires Claude Code CLI
- Node.js required for loop.js cron launcher
- No database — all state in plain files (`~/.claude/interview-prep-agent/`)
