# ADR-002 — Apple Calendar integration via osascript

**Date:** 2026-06-22
**Status:** Accepted

## Context

The agent needs to create Calendar events and send macOS notifications. Options considered:

1. Google Calendar API / Apple Calendar API (OAuth)
2. osascript (AppleScript via terminal)
3. `.ics` file generation (user imports manually)

## Decision

osascript for both Calendar events and notifications.

## Rationale

- **Zero setup** — no OAuth flow, no API keys, no developer account. Works immediately on any Mac.
- **Local-first** — consistent with the agent's design principle of running entirely on the user's machine with no external services.
- **Native integration** — creates real Calendar events in the user's default calendar, with native alerts. Indistinguishable from manually created events.
- **Notification control** — `display notification` via osascript fires macOS system notifications, which the user can manage in System Settings like any other app.

OAuth was rejected because it requires account setup, token refresh, and internet connectivity — all of which create failure modes for what should be a simple local action. `.ics` import was rejected because it requires manual user action on every session schedule.

## Limitation

macOS only. Windows and Linux are out of scope for v1.
