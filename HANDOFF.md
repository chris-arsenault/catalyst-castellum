# Handoff — 2026-07-27

Working tree is clean; everything below is committed and pushed on `main`.

## Where things stand

- The chemistry legibility rework shipped in `cb7dc0c` (all gates green at commit: `make ci`
  including campaign-health, plus 29/29 Playwright e2e). Engineered reactions run in duty
  vessels, sites scope chemistry through palettes, offensive families damage at depth one, and
  iron is the support family — see [ADR-0007](docs/adr/0007-engineered-reactions-run-in-vessels.md),
  [ADR-0008](docs/adr/0008-site-chemistry-palettes.md),
  [ADR-0009](docs/adr/0009-damage-at-depth-one.md).
- Playtest-driven feedback passes followed in the same commit: construction and adjustment stay
  open through prime and assault, build-phase dismantles refund 100%, room tooltips show live
  per-round damage/kills, duty lines carry derived "up to N dmg/s" ratings, Harker's Brace starts
  with two working pipes and teaches building the acid train, and Twelve-Cask gained a guided
  stored-release lesson.
- `CHEMISTRY-LEGIBILITY-PLAN.md` is the executed plan for that arc — historical record; safe to
  delete.

## Standing design principle

Feedback over explanation (also in agent memory): fix opacity with immediate visual/gameplay
feedback and cheap experimentation, never with more tutorial or encyclopedia text. Prefer
removing an unexplained thing over explaining it.

## Open threads

- **Placement "range circle" (next feature):** while placing a machine, highlight the rooms its
  chemistry will reach through current plumbing, with projected impact tones. The pipe-hover
  projection (`src/game/defensivePosture.ts`, `usePipeRoomEffectHover`) is the intended
  foundation.
- **Balance workbook sweep:** `pnpm balance:combat` has not been run to completion since the
  vessel/palette rework (a stale pre-rework run was cancelled). Worth one full pass to inspect
  the new bands; hazard-packet pricing (G-3/L-3) is provisional and expects tuning from it.
- **Playtest sites 1–3** after the tutorial-pipe cleanup; the last user pass predates it.
- Possible follow-up if opacity persists: a goal-directed planner (pick a hazard, UI shows the
  vessel + medium + feeds that reach it and what's missing).

## Verify

`make quick-ci` per change; `make ci` and `pnpm test:e2e` before deploy. Simulation-affecting
content changes need `pnpm run determinism:snapshot` regenerated.
