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
2. **Make the Reagent** — install the membrane cell, feed water and brine, manage all three
   co-products, then place heat and agitation to convert balanced H₂/Cl₂ into an HCl corridor on
   the same generated site.
3. **Stored Chlorine** — store Cl₂ as NaOCl in R-03, preserve that inventory across the round gate,
   then move it into acid at R-06 for a delayed second-order release.
4. **Morrow Pocket** — build a complete defense in an open plant using the Act I vocabulary. Five
   independently constructed portfolios establish burst, continuous, control, storage, and hybrid
   solutions against the same mixed waves.
5. **Kettleblack** — complete the final guided process lesson during Prime by feeding a stationary
   carbon/catalyst bed and reading a reversible reaction. Its assault remains an open defense.
6. **Cordon 41** — use a vertical sensor stack and optional nitrogen chemistry against climbers,
   flyers, armor, and shared protection.
7. **Junction L-6** — manage a long freight route, industrial feed cadence, reagent emitters, and
   optional nickel transport chemistry.
8. **Pell Cut** — add one concise Fluorine Cell description, then defend four synchronized arrays
   with established or fluorine-assisted strategies.
9. **Station 14** — add one concise uranium description, then recover room-bound uranyl fluoride
   through established fluorine, heat, gas, and liquid controls while defending a split-height post.
10. **Vasker Store** — adapt established defenses as fast, heavy, upper-layer, and supported
    compositions take turns controlling the same irregular store route.
11. **Lane Six** — scale overlapping coverage and feed replenishment across a long approach under
    compressed convoy cadence.
12. **Pell Cordon** — synthesize the complete campaign vocabulary against the Near Voice's changing
    formations while the closure device maintains its load.

Every campaign site contains at least five waves.

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
            -> travel
                 -> level_briefing (next clean checkpoint loadout)
```

The initial Flash Point briefing has one additional authoritative edge:

```text
flash_point level_briefing
  -> skip_tutorial
  -> make_the_reagent build
```

That transition records Flash Point in `completedLevelIds` and makes Make the Reagent the retry
checkpoint. It does not simulate or silently award any Flash Point round.

Core loss enters `defeat`; retry reconstructs the current checkpoint's authored starting state.
Completing the final Pell Cordon checkpoint enters `victory`.

`GameState.campaign` stores level, round, completed levels, and retry checkpoint.
`GameState.availability` stores active equipment, gas/liquid conduit, and feedstock unlocks. Commands
and network simulation enforce availability; React filtering is only presentation. Save format V22
persists campaign state, physical routes, junctions, whole-mixture conduit inventories, installed
equipment operations, exact chemical-source damage ledgers, Anchor absorption attribution, and
structured incidents. The pre-release decoder accepts the current format only.

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

For each level it runs a do-nothing baseline, every authored reference build, and seeded mutations
of the primary reference. Reference builds own commands and prime timing per round, so they can
extend, refill, upgrade, or change operation between waves. The report evaluates the site's required
passing-build, archetype, and actual build-signature diversity, then groups mutation results by
planned action count with pass rate, average remaining Core, accepted/rejected actions, cleared
rounds, and termination stability.

Mutation testing measures robustness around a known build; it is not solution discovery. Open
campaign sites require several independently authored reference builds, while a future grammar-based
search should explore valid equipment, topology, and feed combinations beyond those portfolios. See
[`campaign-defense-design.md`](./campaign-defense-design.md) for the campaign-wide diversity
contract.

The command is intentionally absent from `make ci`, `pnpm check`, and Vitest discovery. Unit tests
cover campaign invariants and deterministic phase transitions; the potentially multi-minute policy
search is a separate balancing function invoked by a designer or an explicit automation job.
