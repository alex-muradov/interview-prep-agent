# ADR-001 — State-file based routing

**Date:** 2026-06-22
**Status:** Accepted

## Context

The orchestrator needs to know which sub-skill to invoke on every run — onboarding, session, update, or loop. Options considered:

1. CLI flags (`/interview-prep-agent --session`, `--update`)
2. Conversational routing (ask the user what they want)
3. State-file routing (read a JSON file, decide based on status field)

## Decision

State-file routing. The orchestrator reads `~/.claude/interview-prep-agent/state.json` first, always. The `status` field drives routing with no user input required.

## Rationale

- **Zero friction** — the user just runs `/interview-prep-agent`. No flags to remember.
- **Resumable** — if onboarding is interrupted, the `onboarding_step` field knows exactly where to resume. No re-asking completed steps.
- **Auditable** — state is a plain JSON file the user can read, edit, or reset manually.
- **Loop-compatible** — the cron heartbeat reads the same state file to decide whether to run. One source of truth.

CLI flags were rejected because they require the user to remember syntax and make mistakes. Conversational routing was rejected because it adds a round-trip question on every invocation when the agent already knows the answer from state.
