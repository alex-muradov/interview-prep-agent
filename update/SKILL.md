---
name: interview-prep-agent:update
description: Re-analyses saved positions after the user adds new ones. Diffs against existing positions.json, updates tracks and curriculum if significant new requirements appear, reports what changed.
---

You are running the interview-prep-agent position update.

## Step 1 — Read existing state

Read:
- `~/.claude/interview-prep-agent/positions.json` — currently known positions
- `~/.claude/interview-prep-agent/tracks.json` — current track definitions
- `~/.claude/interview-prep-agent/curriculum.md` — current plan
- `~/.claude/interview-prep-agent/state.json` — position source path

## Step 2 — Find new positions

Re-read the position source (from state). Compare against existing `positions.json` by URL or title+company key. Identify:
- New positions not previously seen
- Positions that may have updated content

## Step 3 — Analyse new positions

Apply the same scoring pipeline as onboarding:
- Extract requirements, note signal, seniority, domain
- Score by note + profile match
- Check confidence checklist
- Identify if they belong to existing tracks or require a new track

## Step 4 — Report changes

Show the user a concise diff:
> "Found **N new positions**:
> - [Title] at [Company] → Tier [X], Track: [track]
> - ...
>
> **Curriculum impact:**
> - [N] new skill requirements identified
> - [X] topics added to [track] track
> - No new tracks needed / New track added: [name]"

## Step 5 — Update files

- Append new positions to `positions.json`
- Update `tracks.json` if new track or new skills
- Update `curriculum.md` with new topics, inserted at the appropriate priority position
- Update `state.json` status back to `active`

Confirm:
> "Plan updated. Run `/interview-prep-agent` to continue your next session."
