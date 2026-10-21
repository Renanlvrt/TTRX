# CLAUDE.md

Guidance for AI coding agents in this repository.

## Read First (Always)

**Read `SPEC.md` before any work.** It is the locked MVP spec and the log of every product decision (grill-me answers). Where `PRD.md` and `SPEC.md` differ, `SPEC.md` wins. Log any agreed change in `SPEC.md` §9.

Key locked facts:
- Product: **RentReady**, Durham student renting companion. Bills comparison is the main demo; before/after photo report is the second hero.
- **No AI and no backend in the MVP.** Chatbot is a stretch goal only.
- Stack: React + Vite + TypeScript + Tailwind v4 + Vitest. Run `npm run dev`, `npm run build`, `npm test`.
- UI is designed by a teammate in React + Google Stitch. Keep logic in `src/lib` (pure TS, no UI imports) and state in `src/lib/store.ts`; pages in `src/pages` stay thin so their screens can replace ours.
- Palette: white background, green actions, pale-yellow highlights. Big, clean, compact UI, concise copy.
- Data: Durham prices are researched (`research/*.json`) and hardcoded in `src/data` with source + date. Never invent prices; unverified = "unavailable".
- Git: work on `feat/<module>` branches, push to `origin` (github.com/Renanlvrt/TTRX), merge to `main` only when build + tests pass.

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
- Purple is banned from the design palette, Palatinate included (SPEC.md §9 #31). Palette: deep teal actions, cyan second action, pale-gold highlights, cool off-white surface. No emojis. Glass, gradient and glow are allowed only on Home and the header, as matched to the user's mock (SPEC.md §9 #32).
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