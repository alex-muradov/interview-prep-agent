# interview-prep-agent

Autonomous local interview prep agent for Claude Code. Analyses saved job positions, builds a personalised curriculum across multiple tracks, schedules lessons, and tracks handwritten notes.

Works for anyone — any background, any positions, any target roles.

## How it works

1. Save job positions as Markdown (via [web-memory](https://github.com/alex-muradov/web-memory) or any other method)
2. Run `/interview-prep-agent` in Claude Code
3. Complete a 5-minute onboarding — CV, position source, time, deadline
4. Agent analyses your positions, clusters them into tracks, proposes 3 curriculum options
5. Pick a curriculum → first lesson starts immediately or gets scheduled to Apple Calendar
6. Run `/interview-prep-agent` for each session — agent tracks progress and adapts

## Features

- **Position analysis** — scores saved job positions using your notes as signal, matches against your background
- **Track clustering** — groups positions into industry-standard tracks (e.g. AI Engineering, AI Product Management, TPM)
- **3 curriculum options** — different pace/depth tradeoffs, you choose
- **Lesson delivery** — follows [Matt Pocock's /teach conventions](https://github.com/mattpocock/skills) — retrieval practice, zone of proximal development, beautiful HTML lessons
- **Apple Calendar integration** — schedules sessions via osascript, no OAuth needed; the daily loop keeps Calendar in sync as the plan adapts (events are a projection of your schedule)
- **Morning cron reminders** — macOS notifications on session days
- **Handwritten notes** — AirDrop a photo after each session, agent reads it via Claude vision and saves to your prep folder
- **Manual updates** — run `/interview-prep-agent update` when you add new positions
- **Self-updating** — each run fast-forwards the skill to the latest version from git (silent, throttled, non-blocking)

## Installation

### 1. Install the skill into Claude Code

Clone it into your skills directory so it can keep itself up to date:

```bash
git clone https://github.com/alex-muradov/interview-prep-agent.git ~/.claude/skills/interview-prep-agent
```

On every `/interview-prep-agent` run the skill quietly fast-forwards itself to the latest version (throttled to once a day, skipped if you have local changes or no network). A plain `cp -r .` copy also works but disables auto-update.

### 2. Run onboarding

Open Claude Code and type:

```
/interview-prep-agent
```

### 3. (Optional) Save positions with web-memory

If you don't have saved positions yet, use [web-memory](https://github.com/alex-muradov/web-memory) — a Chrome extension that saves any web page as Markdown to `~/.claude/saved-web-pages/`.

## State

All agent state lives in `~/.claude/interview-prep-agent/`:

```
~/.claude/interview-prep-agent/
├── state.json          — routing state (new/onboarding/active/updating)
├── profile.md          — extracted user background
├── exam-baseline.json  — per-cluster baseline from intro exam
├── positions.json      — scored and tiered positions
├── tracks.json         — track definitions
├── curriculum.md       — master learning plan (week by week)
├── progress.md         — session history, confidence ratings, next topic
├── schedule.json       — upcoming sessions
├── loop-signal.json    — last session outcome (read + cleared by loop)
├── loop.log            — loop tick history
├── notes/              — handwritten notes extracted via Claude vision
└── tracks/
    └── {track-name}/
        ├── MISSION.md
        ├── lessons/
        ├── learning-records/
        ├── reference/
        └── assets/
```

## Commands

| Command | What it does |
|---|---|
| `/interview-prep-agent` | Start or continue — auto-routes based on state |
| `/interview-prep-agent update` | Re-analyse positions after adding new ones |

## Requirements

- Claude Code
- macOS (for Calendar + notification integration)
- Node.js (for web-memory native host, optional)

## Related

- [web-memory](https://github.com/alex-muradov/web-memory) — Chrome extension to save pages as Markdown
- [Matt Pocock's skills](https://github.com/mattpocock/skills) — /teach skill this agent is compatible with
