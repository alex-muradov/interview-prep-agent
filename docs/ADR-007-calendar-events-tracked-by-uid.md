# ADR-007 — Track Calendar events by stored UID

**Date:** 2026-06-23
**Status:** Accepted (supersedes ADR-005)

## Context

ADR-005 made Calendar a projection of `schedule.json` and reconciled it by **full rebuild**: delete every future event whose title starts with `Interview Prep`, then recreate one per session. In practice this failed:

- **Orphaned duplicates.** Events created by an older version (e.g. titles like `Interview Prep W1 — …`) survived when a reconcile didn't run, and new runs piled more events on top — we saw the same session smeared across five days.
- **All-or-nothing execution.** The rebuild only works if the agent reliably runs *both* the delete and the full recreate every single time. A skipped delete (stale code, an interrupted run, a missed osascript call) immediately produces duplicates.
- **Lost event identity.** Moving a session destroyed and recreated the event, resetting its alarms and losing any per-event state. Title-prefix matching is the only anchor, so any title drift breaks cleanup.

## Decision

Track each session's Calendar event by its **UID**. When the agent creates an event it captures `uid of newEvent` and stores it on that session in `schedule.json` as `calendar_uid`. All later operations target that specific event:

- **Move / update** — look up the event by `calendar_uid` and set its start/end/summary in place. The event keeps its identity and alarm.
- **Delete** — when a session is skipped or removed, delete the event by `calendar_uid` and clear the field.
- **Recreate** — if a lookup by `calendar_uid` finds nothing (the user deleted it), create a fresh event and store the new UID.

Reconcile (loop or any schedule change) becomes per-session and idempotent: for every future session, ensure exactly one event matching its `calendar_uid` with correct fields. As a safety net, an **orphan sweep** removes any future `Interview Prep` event on the calendar whose UID is not referenced by `schedule.json` — this cleans up events left by older versions.

`schedule.json` remains the single source of truth; Calendar is still a projection. Only the reconciliation *mechanism* changes — from blind full rebuild to UID-targeted updates plus an orphan sweep.

## Rationale

- **No duplicates** — moving an event updates it in place; we never create a second event for the same session.
- **Resilient to partial runs** — a missed step leaves at most one stale event, caught by the next orphan sweep, instead of multiplying events.
- **Preserves event identity** — alarms and the user's view of "the same event moving" survive a reschedule.
- **Self-healing migration** — the orphan sweep clears events from prior versions (including the old `W1` titles) without manual cleanup.

## Limitations / tradeoffs

- **More bookkeeping** — `schedule.json` now carries a `calendar_uid` per scheduled session, and the agent must round-trip the UID out of osascript and back into JSON.
- **UID lookups scan the calendar** — `every event whose uid is "…"` is O(events); fine for a personal calendar.
- Still requires Calendar.app to be scriptable when the loop runs (ADR-002).
