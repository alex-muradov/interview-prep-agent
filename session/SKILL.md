---
name: interview-prep-agent:session
description: Runs a single interview prep lesson session. Reads progress and exam baseline, picks the next topic adaptively, teaches it, then updates progress and triggers loop replanning.
---

You are running an interview prep lesson session.

## Step 1 — Read context

Read in order:
- `~/.claude/interview-prep-agent/state.json`
- `~/.claude/interview-prep-agent/progress.md`
- `~/.claude/interview-prep-agent/exam-baseline.json`
- `~/.claude/interview-prep-agent/curriculum.md`
- `~/.claude/interview-prep-agent/schedule.json`

## Step 2 — Pick next topic adaptively

Do NOT blindly follow curriculum order. Apply this decision logic:

1. **Check for overdue spaced repetition reviews** in `schedule.json` — if any `type: "review"` entry is due today or overdue, run that first
2. **Check for "low" confidence topics** in `progress.md` that have been covered but not reviewed recently → prioritise
3. **Otherwise** → take the next uncovered topic from `curriculum.md`

Announce:
> "Today's session: **[Topic]**
> Why this now: [1 sentence — spaced repetition / low confidence / next in plan]
> Estimated time: [X] min. Ready?"

**If the user declines or wants to reschedule** (e.g. "not today", "start Thursday instead"):
1. Update the relevant entry in `schedule.json` and `state.next_session` to the new date/time. If the user is skipping past sessions, mark those entries `status: "skipped"`.
2. **Reconcile Calendar in this same run by UID** (CONTEXT.md → Calendar Projection → Reconcile, snippets in `loop/SKILL.md` → Calendar Sync): for the moved session, look up its event by `calendar_uid` and update its start/end in place (a move — do **not** create a second event). For any session you marked skipped/removed, delete its event by `calendar_uid` and clear the field. Then run the orphan sweep to clear any stray `Interview Prep` events. Calendar must reflect the change immediately — do not wait for the loop.
3. Confirm: `"✓ Moved to [new datetime] — Calendar updated. See you then."` and end the run. Do not push the lesson.

## Step 3 — Teach

Deliver the lesson using the grilling approach — never lecture without checking understanding:
- Introduce one concept, then immediately ask the user to apply or explain it back
- Build complexity only after the previous concept is confirmed understood
- If user struggles → slow down, rephrase, use an analogy before moving on
- If user breezes through → compress, skip scaffolding, go deeper faster
- Save lesson to `~/.claude/interview-prep-agent/tracks/[track]/lessons/[NNN]-[topic].md`

For **review sessions** (`type: "review"`): run a retrieval-only session — ask the user to recall from memory, no re-teaching unless they can't. 20 min max.

## Step 4 — End of session confidence check

Ask:
> "Session done. Confidence on [topic]: **low / medium / high**?"

Then use the grilling approach to validate the self-rating:
- If "high" → ask one hard follow-up question. If they answer well, accept "high". If not, record "medium".
- If "medium" → ask one application question. If vague, record "low".
- If "low" → accept, note specific gap they identified.

Record validated rating in `progress.md`.

## Step 5 — Handwritten notes

Ask:
> "Did you make any handwritten notes?"

If yes:
> "AirDrop the photo to your Mac and give me the file path."

Read the image via vision. Extract content verbatim. Save to:
`~/.claude/interview-prep-agent/notes/[YYYY-MM-DD]-[topic].md`

```markdown
---
date: YYYY-MM-DD
topic: [topic]
session: [lesson id]
---

[Extracted handwritten content verbatim]

## Agent summary
[What was noted, in context of the lesson]
```

## Step 6 — Trigger loop replanning

After recording confidence, immediately calculate the spaced repetition schedule for this topic. Each rating produces **two** review intervals, measured from the lesson date (per CONTEXT.md):

| Confidence | First review | Second review |
|---|---|---|
| high | +7 days | +21 days |
| medium | +3 days | +10 days |
| low | next session | +5 days |

Insert **both** review entries into `schedule.json` (`stage: 1` and `stage: 2`):
```json
{
  "date": "[ISO date]",
  "type": "review",
  "stage": 1,
  "topic": "[topic]",
  "track": "[track]",
  "reason": "spaced repetition (1st pass) — [high/medium/low] confidence"
}
```
```json
{
  "date": "[ISO date]",
  "type": "review",
  "stage": 2,
  "topic": "[topic]",
  "track": "[track]",
  "reason": "spaced repetition (2nd pass) — [high/medium/low] confidence"
}
```

Then write loop replan signal to `~/.claude/interview-prep-agent/loop-signal.json`:
```json
{
  "trigger": "session_complete",
  "topic": "[topic]",
  "confidence": "[low|medium|high]",
  "timestamp": "[ISO datetime]"
}
```

## Step 7 — Schedule next session

Read `schedule.json` for next planned session. If none:
> "When's your next session? I'll add it to Calendar."

Write the next session into `schedule.json`, then **reconcile Calendar in this same run by UID** (CONTEXT.md → Calendar Projection → Reconcile; snippets in `loop/SKILL.md` → Calendar Sync):
- If the next session already has a `calendar_uid`, update that event in place.
- Otherwise create the event using the canonical format, capture the returned `uid of newEvent`, and **store it as `calendar_uid` on that session in `schedule.json`**.
- Run the orphan sweep to clear any stray `Interview Prep` events.

Never delete-and-recreate the whole set, and never rely on the loop alone to apply a schedule change.

## Step 8 — Update state

Update `progress.md`:
- Topic, confidence, date, notes reference, next recommended topic

Update `state.json`:
```json
{
  "last_lesson": "[lesson-id]",
  "next_session": "[ISO datetime]"
}
```
