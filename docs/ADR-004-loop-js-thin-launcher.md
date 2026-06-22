# ADR-004 — loop.js as a thin cron launcher, reasoning delegated to Claude

**Date:** 2026-06-22
**Status:** Accepted

## Context

The learning loop runs daily via cron. It needs to: read state files, detect conditions, replan the schedule, and send a notification. Options considered:

1. Full logic in loop.js (Node.js) — parse JSON, apply rules, write files, call osascript
2. Thin loop.js launcher — reads state to check if active, then delegates all reasoning to Claude via the loop skill
3. Pure Claude Code skill invoked directly by cron

## Decision

Thin loop.js launcher. loop.js does the minimum: checks if the agent is active, then spawns `claude` CLI with the loop skill. All observation, detection, replanning, and notification logic lives in the loop skill (Markdown prompt).

## Rationale

- **Logic stays in the skill** — the loop skill is the source of truth for what the loop does. Duplicating logic in JavaScript creates a maintenance split: two places to update when detection conditions change.
- **Claude handles reasoning** — detecting "3 consecutive low confidence sessions" requires reading and interpreting `progress.md`. This is natural language reasoning, not string parsing. Claude does it better and with less brittle code.
- **Cron can't invoke skills directly** — cron runs shell commands, not Claude Code slash commands. A thin Node launcher bridges the gap.
- **Fallback notification** — if the Claude invocation fails, loop.js sends a generic notification so the user knows the agent is alive.

Pure cron → skill was rejected because cron cannot invoke Claude Code skills directly. Full logic in Node was rejected because it would require reimplementing complex reasoning in imperative code that breaks when file formats change.
