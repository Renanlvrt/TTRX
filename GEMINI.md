# CLAUDE.md

Guidance for AI coding agents in this repository.

## Mission Constraint (Non-Negotiable)

This is a **6-hour venture lab hackathon**. Prioritize:
- **speed to clickable demo**
- **mock data over backend complexity**
- **polished UI for business pitches**

Do not optimize for perfect architecture if it slows delivery.

## Required Workflow

Before writing or modifying application code:
1. **Stop** and analyze the request.
2. **Plan** with a strict **3-5 step numbered checklist** including exact files to create/modify.
3. **Warn** if scope exceeds a 6-hour MVP and propose a narrower demo slice.
4. **Wait** for explicit user approval by asking: **"Does this plan look good?"**
5. Start implementation only after approval.

## Skills (Mandatory)

You must use the local skills in `.claude/skills/`:
- **planner** (`.claude/skills/planner.md`) for pre-implementation planning and approval gating.
- **grill-me** (`.claude/skills/grill-me.md`) for ruthless requirements interrogation and scope lock.

If requirements are vague, run **grill-me first**, then **planner**, then implementation.

## Product/Delivery Defaults

- Build for a mixed technical + business/marketing audience.
- Prefer mock JSON arrays and local state.
- Avoid real auth, complex DB modeling, and infrastructure unless explicitly requested.
- Ship thin vertical slices with obvious business value.

## UI/UX Defaults

- Modern, accessible, high-clarity interface.
- Generous spacing (`p-6`, `gap-4`) and clean visual hierarchy.
- Use a tight 3-color palette.
- Purple is banned from the design palette.
- Avoid hard black text; prefer `text-slate-900`.

## Context Hygiene (Claude Code Best Practices)

- Keep instructions concise and durable.
- Explore first, then plan, then code.
- Provide verifiable completion signals (tests/build/screenshots) when available.
- Keep global rules here; put task-specific behavior in skills.

## Source Grounding

This file is informed by:
- Anthropic Claude Code best-practices docs (context economy, explore-plan-code flow).
- `affaan-m/everything-claude-code` planner pattern (explicit planning before implementation).
- Community grill-me skills (decision-tree interrogation before coding).
