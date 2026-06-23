# ADR-006 — Skill self-update on launch

**Date:** 2026-06-23
**Status:** Accepted

## Context

The skill evolves — new detection conditions, fixed prompts, new features. Users who installed it once have no way to know an update exists, and manual `git pull` / re-copy is friction they won't remember. We want the installed skill to keep itself current. Options considered:

1. **Manual updates only** — user re-runs the install command when they hear about a release.
2. **Separate update command** — a `/interview-prep-agent self-update` the user runs deliberately.
3. **Auto-update on launch** — the orchestrator fast-forwards the skill from git on every interactive run, before routing.

## Decision

Option 3. The skill is installed as a **git clone** at `~/.claude/skills/interview-prep-agent`. On every interactive `/interview-prep-agent` invocation, Step 2 of the orchestrator fetches and `pull --ff-only`s the skill, then continues the normal flow. The check is throttled to once per 24h (`last_update_check` in state) and is entirely non-blocking: if the directory isn't a git checkout, there's no network, or a fast-forward isn't possible, it is skipped silently and the session proceeds.

Updated instructions take effect on the **next** run — the current run continues on the already-loaded prompt. The cron loop is intentionally excluded: it runs headless with no user to resolve problems, so it stays pinned until the next interactive run.

## Rationale

- **Zero-friction freshness** — users get fixes and features without remembering to update, matching the agent's "zero friction" theme (ADR-001).
- **Safe by construction** — `--ff-only` never merges or discards local edits; any divergence aborts the update rather than risking the user's customisations.
- **Non-blocking** — a learning session must never be held up by a git problem. Every failure mode degrades to "skip and continue".
- **Throttled** — once-a-day avoids a network round-trip on every invocation while still being effectively current.
- **Local-first** — plain git against the user's own checkout. No update server, no telemetry, consistent with the no-external-services constraint.

Manual-only was rejected as the status quo that leaves users stale. A separate command was rejected because it still relies on the user remembering to run it.

## Limitations / tradeoffs

- Requires the skill to be installed via `git clone`. A `cp -r` copy still runs, but auto-update silently no-ops (graceful degradation, documented in the README).
- An update applies one run late, since the orchestrator's instructions for the current run are already loaded.
- Local edits to the skill block auto-update until reconciled — intended, to protect user changes.
