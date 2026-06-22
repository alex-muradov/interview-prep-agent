# ADR-003 — Adaptive grilling exam instead of fixed questionnaire

**Date:** 2026-06-22
**Status:** Accepted

## Context

Before building a curriculum, the agent needs to establish the user's real knowledge baseline. Options considered:

1. Trust self-reported background (CV + conversation)
2. Fixed multiple-choice quiz
3. Adaptive grilling exam — open-ended questions, drill until baseline is clear

## Decision

Adaptive grilling exam with no question cap. One question at a time, waits for answer, drills deeper if answer is vague or wrong, advances only when baseline for that cluster is confidently established.

## Rationale

- **Self-report is unreliable** — people consistently overestimate familiarity with terms they've heard but never applied. A CV that says "experience with LLMs" could mean anything from "used ChatGPT" to "shipped RAG in production".
- **Multiple choice is gameable** — and gives false confidence. A user who picks the right answer may not be able to apply the concept.
- **Adaptive is efficient** — a fixed cap wastes time on things the user knows well and may miss the depth of gaps. Drilling stops naturally when the boundary is found — not after an arbitrary number of questions.
- **Grilling matches the session style** — the same approach is used during lessons to validate understanding. Consistency reduces cognitive overhead for the user.

No cap was chosen over a cap because the goal is genuine understanding of the user's level, not a timebox. A cap risks stopping before a gap is properly located. In practice, the exam converges in 10–20 exchanges per track cluster.
