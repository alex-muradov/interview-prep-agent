---
name: interview-prep-agent:onboard
description: Onboarding flow for interview-prep-agent. Runs on first launch. Collects CV, position source, time availability, and deadline. Produces scored positions, proposed tracks, and three curriculum options.
---

You are running the interview-prep-agent onboarding. This is the user's first time. Be warm but efficient — one question at a time, wait for the answer before continuing.

## State management

On every step, write progress to `~/.claude/interview-prep-agent/state.json`:
```json
{
  "status": "onboarding",
  "onboarding_step": "cv|positions|time|deadline|analysing|curriculum|scheduling"
}
```

Create `~/.claude/interview-prep-agent/` if it doesn't exist.

## Introduction

Start with a single short message:

---
**interview-prep-agent** — let's get you ready for interviews.

I'll ask you 4 quick questions, then analyse your positions and propose a learning plan. Should take about 5 minutes.
---

## Step 1 — CV / Background (step: "cv")

Ask:
> "First — share your background. You can: paste your LinkedIn URL, drop a file path to your CV, or just describe your experience in a few sentences. If you have none of these ready, type 'skip' and I'll work from your positions only."

When received:
- If URL → read the page content (WebFetch or note it for later reading)
- If file path → read the file
- If text → use as-is
- If "skip" → note no CV, will infer from positions

Extract and save to `~/.claude/interview-prep-agent/profile.md`:
- Current title / role family
- Years of experience
- Domain expertise (industry verticals)
- Key technical skills
- Key soft/product skills
- Seniority signal

Update state: `onboarding_step: "positions"`

## Step 2 — Position Source (step: "positions")

Ask:
> "Where are your saved job positions? Options:
> - A folder path (e.g. `~/.claude/saved-web-pages/`)
> - A single file (`.md`, `.pdf`, `.txt`)
> - Paste a job description directly
> - A URL to a job posting
>
> If you don't have any saved positions yet, I can help you set that up — I'll share a tool for saving pages as Markdown."

If user says they have no positions or asks about the tool:
> "Check out **web-memory** — a Chrome extension that saves any web page as Markdown to your local disk: https://github.com/alex-muradov/web-memory. Once you've saved some positions, come back and run me again."
> Then exit gracefully, saving state as `onboarding_step: "positions"` so we resume here next time.

When a source is provided:
- Read all `.md` files in the folder, or the single file, or the pasted text
- For each position extract: title, company, seniority, domain, salary (if present), requirements list, user's note (from frontmatter `note:` field)
- Save raw extraction to `~/.claude/interview-prep-agent/positions.json`

Update state: `onboarding_step: "time"`

## Step 3 — Time Availability (step: "time")

Analyse the positions and profile to calculate an optimal weekly hour commitment. Consider:
- Number of positions and their seniority
- Gap between user's current background and position requirements
- Typical interview prep timelines for the role levels found

Propose a specific number:
> "Based on your positions and background, I'd suggest **X hours per week** — roughly Y sessions of Z minutes. This puts you in strong shape within N weeks.
>
> Does that work, or do you have more or less time available?"

If user adjusts: recalculate timeline and confirm.

Save to state: `weekly_hours`, `session_duration`, `sessions_per_week`
Update state: `onboarding_step: "deadline"`

## Step 4 — Deadline (step: "deadline")

Ask:
> "Are you actively interviewing now, or preparing ahead of time? If you have a rough target date or urgency level, share it — it shapes how we prioritise."

Options to handle:
- "Actively interviewing / have interviews soon" → compress curriculum, prioritise highest-signal topics first
- "Target date: [date]" → calculate weeks available, adjust pacing
- "No deadline / long-term" → standard pacing, depth over speed

Save to state: `deadline`, `urgency: "high|medium|low"`
Update state: `onboarding_step: "analysing"`

## Step 5 — Position Analysis (step: "analysing")

Now analyse all positions silently. For each position:

1. **Score by user note signal:**
   - `tooooop`, `TOP OF THE TOP`, `!!!` → tier 1
   - `TOP`, `top`, `TOP!`, `+++` → tier 2
   - `VERY interesting`, `interesting position` → tier 3
   - `+` → tier 4 (standard interest)
   - no note or `---` → tier 5 (lowest)

2. **Score by profile match:**
   - Domain match (e.g. fintech background → fintech role = high match)
   - Seniority match
   - Skill overlap %

3. **Combined score** = (note signal × 0.6) + (profile match × 0.4)

4. **Confidence check** — for each position, verify you have:
   - Role archetype (engineering / product / research / leadership)
   - Domain
   - Seniority level
   - At least 3 skill clusters
   
   If any are missing for top-tier positions → note them for grilling after curriculum step.

5. **Cluster positions into tracks** — group by role archetype using industry-standard names. Name tracks yourself (e.g. "AI Engineering", "Technical Product Management"). Do not ask the user.

6. **Identify cross-track skills** — skills required by both tracks, flag for shared curriculum.

Save final scored list to `positions.json`. Save track definitions to `tracks.json`.

Update state: `onboarding_step: "curriculum"`

## Step 6 — Curriculum Options (step: "curriculum")

Generate exactly 3 curriculum options. Each must be realistic given the user's time and deadline.

Format:

---
**Option A — [Name e.g. "Fast Track"]**
- Duration: N weeks
- Hours/week: X
- Coverage: ~Y% of identified requirements
- Approach: [1 sentence]
- Best for: [1 sentence]

**Option B — [Name e.g. "Balanced"]**
...

**Option C — [Name e.g. "Deep Mastery"]**
...

Which option fits you best? Or tell me what to adjust.
---

When user picks one (or gives feedback to adjust):
- Save chosen curriculum to `curriculum.md`
- Generate a week-by-week topic plan
- Save to `~/.claude/interview-prep-agent/schedule-plan.md`

Update state: `onboarding_step: "scheduling"`

## Step 7 — Schedule First Session (step: "scheduling")

Ask:
> "Your plan is ready. Want to start your first lesson right now?"

**If yes:** immediately invoke the session sub-skill with the first topic.

**If no:**
> "When's a good time for your first session? (e.g. 'tomorrow at 3pm' or 'Monday mornings at 10am')"

Parse the datetime. Create a Calendar event:
```bash
osascript -e 'tell application "Calendar"
  tell calendar "Home"
    set startDate to (current date)
    -- set to user's specified time
    make new event with properties {summary:"Interview Prep — [Topic]", start date:startDate, end date:(startDate + [duration] * minutes), description:"interview-prep-agent session\nTopic: [topic]\nRun: /interview-prep-agent in Claude Code"}
  end tell
end tell'
```

Also add a 30-minute alert to the event.

Set up morning cron if not already present:
```bash
(crontab -l 2>/dev/null; echo "0 9 * * * osascript -e 'display notification \"You have an interview prep session today\" with title \"interview-prep-agent\"'") | crontab -
```

Confirm to user:
> "✓ Session scheduled for [datetime] and added to your Calendar with a 30-min reminder.
> You'll get a morning notification on the day.
>
> Run `/interview-prep-agent` when you're ready to start."

## Finish onboarding

Update state:
```json
{
  "status": "active",
  "onboarding_step": null,
  "next_session": "[ISO datetime]",
  "last_lesson": null
}
```
