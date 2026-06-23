# ADR-005 — Apple Calendar as a projection of schedule.json

**Date:** 2026-06-23
**Status:** Superseded by [ADR-007](./ADR-007-calendar-events-tracked-by-uid.md)

> **Superseded.** The "projection of `schedule.json`" principle still holds, but the full-rebuild reconciliation described below produced orphaned duplicate events in practice. ADR-007 replaces the mechanism with UID-tracked events (move/update in place + orphan sweep). Read this ADR for context only.

## Context

The loop adapts the plan continuously — missed sessions get rescheduled, confidence streaks compress or expand the curriculum, deadlines trigger sprint mode. Each of these changes `schedule.json`. The Calendar events created at onboarding (and after each session) then go stale. We need Calendar to stay in step with the plan. Options considered:

1. **Bidirectional sync** — treat Calendar and `schedule.json` as peers, merge changes both ways.
2. **Per-event diff** — persist Calendar event IDs alongside each session, then add/update/delete individual events to match.
3. **Projection / full rebuild** — `schedule.json` is the sole source of truth; on each schedule change, delete all future agent events and recreate them from `schedule.json`.

## Decision

Option 3. Apple Calendar is a one-way **projection** of `schedule.json`. The loop owns reconciliation: whenever its Replan step changes the schedule, it deletes every *future* event whose title starts with `Interview Prep` from the user's calendar (`state.calendar_name`) and recreates one event per future session, using the canonical event format defined in `CONTEXT.md`. onboard and session still create their immediate event optimistically; the next loop tick reconciles the full set.

## Rationale

- **One source of truth** — `schedule.json` wins, always. No merge logic, no conflict resolution, no bidirectional edge cases.
- **Idempotent and self-healing** — a full rebuild produces the same Calendar state regardless of prior drift. It also dedupes the optimistic events onboard/session create, so we never accumulate duplicates.
- **No ID bookkeeping** — we don't persist Calendar event IDs (which AppleScript makes awkward and which break if the user deletes an event). Matching on the `Interview Prep` title prefix is enough.
- **Local-first** — pure osascript, consistent with ADR-002. No external store, no cloud sync.
- **Scoped and safe** — only future events with the `Interview Prep` prefix on the agent's calendar are touched. Past sessions (history) and the user's own events are never modified.

Bidirectional sync was rejected as far too much machinery for a local single-user tool. Per-event diffing was rejected because persisting and reconciling event IDs across manual user edits is brittle for marginal benefit.

## Limitations / tradeoffs

- **Manual edits to future agent events are overwritten** on the next sync — if the user drags a session to a new time in Calendar, the rebuild reverts it. By design, `schedule.json` is authoritative; users reschedule via the agent, not the Calendar UI.
- **Alarm/snooze state is reset** on recreated events.
- Requires Calendar.app to be scriptable when the loop runs (user logged in at cron time).
