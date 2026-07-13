# Tutorial campaign and headless evaluation

This document records the campaign contract introduced after the original pre-tuned chlor-alkali
factory proved too complex to teach from. It is an implementation boundary, not transient planning
context.

## Learning contract

Early levels follow the tower-defense teaching curve:

- Doing nothing must lose the checkpoint.
- Performing the newly taught action must clear its first round.
- Incomplete, mistimed, or misplaced actions may clear with core damage.
- A strong first-round configuration should often carry the following round without another build.
- New mechanics begin inert. Unlocking a component must not silently activate a complete background
  factory.

The current authored sequence is:

1. **Flash Point** — install gas agitation in R-02 and switch on the one Core–R-02 gas fan. Core's
   visible starter header contains the complete finite H₂/O₂ mixture; the initially dry routed duct
   must sweep its physical hold-up before accumulation produces repeating OX-1 attacks.
2. **Make the Reagent** — install the membrane cell, feed water and brine, and learn that useful Cl₂
   cannot be separated from H₂ and NaOH outlet pressure.
3. **Acid Line** — place heat and agitation, connect two room pairs, and convert balanced H₂/Cl₂ into
   an HCl corridor.
4. **Stored Chlorine** — store Cl₂ as NaOCl in R-03, preserve that inventory across the round gate,
   then move it into acid at R-06 for a delayed second-order release.
5. **Commissioning Exam** — retain the former MVP's fully installed plant as a medium-complexity
   whole-system scenario.

Ordinary rooms remain blank shells with generic sockets. A tutorial level may preinstall ordinary
player-owned equipment as scaffolding, but it may not create hidden room types.

## State machine

The authoritative lifecycle is:

```text
level_briefing
  -> build
  -> prime (bounded; automatic lock)
  -> assault
  -> round_result
       -> build (next round, exact facility state preserved)
       -> level_complete (final round)
            -> level_briefing (next clean checkpoint loadout)
```

The initial Flash Point briefing has one additional authoritative edge:

```text
flash_point level_briefing
  -> skip_tutorial
  -> make_the_reagent build
```

That transition records Flash Point in `completedLevelIds` and makes Make the Reagent the retry
checkpoint. It does not simulate or silently award either Flash Point round.

Core loss enters `defeat`; retry reconstructs the current checkpoint's authored starting state.
Completing the final Commissioning Exam enters `victory`.

`GameState.campaign` stores level, round, completed levels, and retry checkpoint.
`GameState.availability` stores active equipment, gas/liquid conduit, and feedstock unlocks. Commands
and network simulation enforce availability; React filtering is only presentation. Save format V8
persists campaign state, physical routes, junctions, whole-mixture conduit inventories, damage
ledgers, and structured incidents. V7 saves migrate conservatively by merging every legacy sub-line
into its room-pair phase conduit; ambiguous migrated actuators remain off for player review. A V7
Flash Point save specifically relocates its cathode H₂ stock/feed into the new Core starter path, so
migration cannot restore the obsolete Inner Bay dependency.

## Scenario boundary

`src/game/content/campaign.ts` is authored data: briefings, objectives, prime limits, waves, starting
matter, facility loadouts, availability snapshots, and reference actions.

`src/game/engine/scenarioState.ts` is the materializer. It creates geometry-scaled rooms, finite
sources and buffers, local junctions, empty or explicitly precharged whole-mixture conduits,
equipment instances, and campaign state. Conduit precharge is ordinary conserved inventory, not
instant transport or an infinite source. Neither file imports React, Pixi, Zustand, or browser APIs.

The UI and evaluator both act only through `executeCommand` and advance time only through `stepGame`.
This keeps browser presentation, automated policies, and future alternative clients on one ruleset.

## Standalone playtester

Run it explicitly:

```bash
pnpm playtest -- --runs 200 --seed 13371
pnpm playtest -- --level stored_chlorine --runs 500 --seed 42
pnpm playtest -- --level flash_point --runs 50 --json
```

For each level it runs a do-nothing baseline, the authored intended policy, and seeded randomized
subsets, orderings, placements, and prime durations. The report groups results by planned action
count and includes pass rate, average remaining core, accepted/rejected actions, cleared rounds, and
termination stability.

The command is intentionally absent from `make ci`, `pnpm check`, and Vitest discovery. Unit tests
cover campaign invariants and deterministic phase transitions; the potentially multi-minute policy
search is a separate balancing function invoked by a designer or an explicit automation job.
