# Domain Model — interview-prep-agent

This document defines the canonical vocabulary for the agent. All skill files, code, and documentation use these terms precisely.

---

## Core Entities

### Position
A saved job posting in Markdown format. Contains: title, company, seniority, domain, requirements list, salary (if present), and a **user note** (the `note:` frontmatter field) which is the primary relevance signal.

User notes are informal but intentional:
- `tooooop`, `TOP OF THE TOP` → tier 1 (highest desire)
- `TOP`, `top`, `+++` → tier 2
- `VERY interesting`, `interesting` → tier 3
- `+` → tier 4 (standard interest)
- no note or `---` → tier 5 (saved incidentally)

### Track
A cluster of positions grouped by role archetype, named using industry-standard definitions. Named and owned by the agent — never by the user. Examples: "AI Engineering", "Technical Product Management", "AI Product Management". A position belongs to exactly one primary track but may contribute requirements to other tracks (cross-track skills).

### Profile
The user's background extracted from CV/LinkedIn. Contains: current role, years of experience, domain expertise, technical skills, soft/product skills, seniority signal. Stored in `profile.md`. Ground truth for profile match scoring.

### Exam Baseline
The result of the intro exam — a per-cluster confidence level (`low|medium|high`) with specific strengths and gaps identified. Established through adaptive grilling, not self-report. Stored in `exam-baseline.json`. Used to adjust curriculum starting point and pacing.

### Curriculum
The master learning plan — week-by-week topics across all tracks, adjusted from a base structure by the exam baseline. Stored in `curriculum.md`. Modified by the loop when conditions are detected.

### Session
A single learning unit. Has a topic, a track, a type (`lesson` or `review`), a scheduled datetime, and a completed datetime. A lesson teaches new material. A review retrieves previously covered material.

### Confidence Rating
A validated self-assessment of understanding after a session: `low`, `medium`, or `high`. Validated — not just self-reported — via a follow-up probe question by the agent. Drives spaced repetition scheduling.

### Spaced Repetition Schedule
Review sessions automatically inserted into `schedule.json` after each lesson, based on confidence rating:
- `high` → review in 7 days, then 21 days
- `medium` → review in 3 days, then 10 days
- `low` → review next session, then 5 days

### Calendar Projection
Apple Calendar is a read-through **projection** of `schedule.json`, never a separate source of truth. Every *future* session in `schedule.json` maps to exactly one Calendar event on the user's chosen calendar. The loop reconciles the projection on every tick that changes the schedule (see ADR-005). Completed/past sessions are left untouched as history.

**Canonical event format** — used identically by onboard, session, and loop:
- **Calendar:** `state.calendar_name` — the user's default calendar, resolved once during onboarding, never hardcoded (ADR-002)
- **Title:** `Interview Prep — [Topic]` for lessons; `Interview Prep — Review: [Topic]` for reviews. The `Interview Prep` prefix is the matching key for sync.
- **Description:** `Run /interview-prep-agent in Claude Code to start your session.`
- **Alarm:** one sound alarm, 30 minutes before start (`trigger interval: -30`)

### Loop Tick
A daily autonomous run of the learning loop, triggered by cron at 9am. Observes state, detects conditions, replans silently, reconciles the Calendar Projection, sends one notification. The loop is the agent's autonomy — without it, the agent is a passive planner.

### Loop Signal
A file (`loop-signal.json`) written by the session skill after each session completes. Contains the session outcome (topic + confidence). Read by the next loop tick to trigger replanning. Cleared after processing.

### Skill Self-update
The skill is installed as a **git checkout** at `~/.claude/skills/interview-prep-agent`. On every interactive `/interview-prep-agent` run, the orchestrator fast-forwards it to the git remote before routing (see ADR-006). The check is throttled to once per 24h via `last_update_check` in state, skipped silently if the directory is not a git checkout, offline, or has local changes. Updated instructions take effect on the *next* run. The cron loop does not self-update — it stays pinned until the next interactive run.

---

## State Machine

```
new → onboarding (steps: cv → positions → time → deadline → exam → analysing → curriculum → scheduling) → active
active → updating (on /interview-prep-agent update) → active
active → active (on each session or loop tick)
```

---

## File Structure

```
~/.claude/interview-prep-agent/
├── state.json           — routing state, onboarding step, last update check
├── profile.md           — extracted user background
├── exam-baseline.json   — per-cluster baseline from intro exam
├── positions.json       — all positions, scored and tiered
├── tracks.json          — track definitions and skill clusters
├── curriculum.md        — master plan (modified by loop)
├── schedule.json        — all sessions: planned, completed, reviews
├── progress.md          — session history, confidence ratings, next topic
├── loop-signal.json     — last session outcome (read + cleared by loop)
├── loop.log             — loop tick history
├── notes/               — handwritten notes extracted via Claude vision
└── tracks/
    └── {track-name}/
        ├── MISSION.md
        ├── lessons/          — HTML lesson files (Matt's /teach format)
        ├── learning-records/ — non-obvious lessons and key insights
        ├── reference/        — compressed cheat sheets
        └── assets/           — shared CSS, quiz widgets, components
```

---

## Scoring Formula

**Position relevance score** = (note signal × 0.6) + (profile match × 0.4)

Note signal tiers map to: tier 1 = 1.0, tier 2 = 0.8, tier 3 = 0.6, tier 4 = 0.4, tier 5 = 0.2

Profile match = average of: domain match (0–1) + seniority match (0–1) + skill overlap % (0–1)

---

## Loop Detection Conditions (priority order)

1. **Missed session** — planned session date passed, no completion record
2. **Low confidence streak** — 3+ consecutive sessions rated `low`
3. **Spaced repetition due** — review entry in schedule with date ≤ today
4. **High confidence streak** — 3+ consecutive sessions rated `high`
5. **New positions detected** — new files in position source since last analysis
6. **Deadline approaching** — deadline within 14 days → sprint mode

---

## Compatibility

Lesson and reference files follow [Matt Pocock's /teach skill conventions](https://github.com/mattpocock/skills). The agent does not depend on Matt's skills being installed, but is compatible if they are — a user can run `/teach` for a deep dive on any topic and the output lands in the same workspace structure.
