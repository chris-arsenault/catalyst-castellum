# Tutorial campaign

This document defines the campaign's teaching curve and authored scenario contract.

## Learning contract

Early sites follow one causal relationship at a time:

- Doing nothing loses the wave.
- Performing the taught action creates immediate, visible combat output.
- A legal but weak placement may clear with Core damage.
- A strong first-wave defense often carries the following wave.
- Later waves ask the player to recall and combine earlier actions with less guidance.
- Every lesson runs inside the same vertical map, tower controls, combat simulation, and campaign
  fiction used by the rest of the game.

## Campaign teaching curve

1. **Claim 8-Delta** teaches free surface placement, firing arcs, range, assault start, direct damage,
   Matter income, and one tower upgrade on a readable route.
2. **Harker's Brace** teaches wall and ceiling relationships, vertical line of sight, route progress
   targeting, and coverage across two elevations.
3. **Twelve-Cask** teaches finite firing capacity, area damage, route control, and mixed enemy
   cadence.
4. **Morrow Pocket** is the first open defense. It combines tower classes, upgrades, target
   priorities, and multiple routes without click-by-click guidance.
5. **Kettleblack** introduces the first permanent room-graft decision and tests how new hull geometry
   changes final-approach coverage.
6. **Cordon 41** tests ladder specialists, flyers, armor, and shared protection across a vertical
   sensor stack.
7. **Junction L-6** tests long freight routes, separated lanes, support targeting, and sustained
   tower capacity.
8. **Pell Cut** defends four synchronized arrays and forms the Act II boss escalation.
9. **Station 14** foregrounds flyers, split-height coverage, and multiple ingress under Council
   command.
10. **Vasker Store** alternates fast, heavy, upper-layer, and supported columns through spatially
    overlapping rooms.
11. **Lane Six** compresses convoy cadence across a long multi-route approach.
12. **Pell Cordon** combines the campaign's route, placement, targeting, graft, and support
    vocabulary while the foundry breaks the Near Voice's learned cadence.

Every site contains five waves. Field guidance concentrates on the first three sites and becomes
observation and recall support afterward. The player can disable guidance while retaining every
site, dialogue, wave, and campaign result.

## State machine

The authoritative campaign lifecycle is:

```text
level_briefing
  -> build
  -> assault
  -> round_result
       -> build (next wave)
       -> level_complete (final wave)
            -> travel
                 -> level_briefing (next site)
```

Core loss enters `defeat`; retry reconstructs the current site's authored checkpoint. Completing
Pell Cordon enters `victory`.

Construction freezes movement. Assault advances the simulation at the selected speed and permits
construction while running or paused. The round result settles rewards and records the condition of
the persistent hull.

## Scenario boundary

`src/game/content/levels/` owns site modules: waves, starting Matter, tower availability, route and
map selection, hull state, and later process conditions. `src/game/content/campaign.ts` registers
those modules in campaign order. Localized briefings and objectives live in the locale catalog;
reference builds live separately under playtest content.

The scenario materializer creates the exact map, route graph, tower instances, campaign state, Core
integrity, and retained subsystem state. The browser and headless evaluator both act through typed
commands and advance time through the deterministic simulation.

## Evaluation

Campaign evaluation runs an idle baseline and several authored reference defenses. A reference
records tower placement, orientation, upgrades, targeting policies, construction timing, and later
graft or process actions. Evaluation reports Core integrity, Matter, leaks, tower contribution,
route coverage, target service, and termination stability.

Reference defenses prove balance envelopes. Human playtesting determines whether the available
placements and failure causes are understandable.
