# Enemy scaling and combat-balance research

This note records the external design basis for
[`enemy-level-progression.md`](../enemy-level-progression.md) and
[`combat-balance-model.md`](../combat-balance-model.md). Project formulas and tuning values come
from Catalyst Castellum's campaign model; the sources supply general methods rather than constants.

## Combat feel is a ratio

[Breaking down the metagame design in a mobile
RPG](https://www.gamedeveloper.com/design/breaking-down-the-metagame-design-in-a-mobile-rpg)
models perceived combat length as enemy durability divided by player attack. A geometric basis for
enemy health and tower output preserves that relationship across a fixed campaign gap more reliably
than adding a fixed amount each level.

Project use:

```text
enemyHealth(L) = referenceHealth * growth^(L - referenceLevel)
```

The campaign uses ten-percent health growth per level, anchored at level 20. Exact encounters then
test that curve against available upgrades and route coverage.

## Formulas predict; encounters validate

[The craft of game systems: Practical
examples](https://www.gamedeveloper.com/design/the-craft-of-game-systems-practical-examples)
recommends forecasting player power, retaining meaningful units, graphing results, and validating
the broad formula where systems meet authored content.

Project use: the first-order model compares tower damage, cadence, target capacity, coverage time,
and cost. The deterministic replay then includes actual routes, target selection, line of sight,
simultaneous arrivals, behavior state, construction timing, and Matter.

## Tower-defense pressure has several axes

The paper [A NEAT Approach to Wave Generation in Tower Defense
Games](https://www.open-access.bcu.ac.uk/13568/1/A_NEAT_Approach_to_Wave_Generation_in_Tower_Defense_Games___IMET.pdf)
reviews wave systems that combine enemy power, health, spawn count, and resource changes. Its
difficulty-budget framing supports treating enemy types and spawn patterns as different demands
rather than interchangeable health totals.

Project use:

| Axis         | Primary pressure                                                |
| ------------ | --------------------------------------------------------------- |
| Enemy level  | Per-target durability and leak consequence                      |
| Count        | Tower service capacity, route occupancy, rewards, breach stakes |
| Composition  | Eligibility, resistance, behavior, and target priority          |
| Spawn timing | Simultaneous demand, area value, and switching loss             |
| Route        | Which placements provide coverage                               |
| Speed        | Time available inside that coverage                             |

## Difficulty curves need local shape

[How Tough Is Your Game? Creating Difficulty
Graphs](https://www.gamedeveloper.com/design/how-tough-is-your-game-creating-difficulty-graphs)
describes steps, spikes, plateaus, and recovery inside an upward mean curve.

Project use: site baselines rise across the campaign, while individual waves use count,
composition, route, and sparse level offsets to create pressure and recovery. A new tower, upgrade,
or graft opportunity can support a plateau before the next major test.

## Counter identity stays separate from level

[The Secrets of Enemy AI in Uncharted
2](https://www.gamedeveloper.com/design/the-secrets-of-enemy-ai-in-i-uncharted-2-i-)
describes stable damage-receiver classes as a way to avoid arbitrary health variation and cascading
weapon rebalance. Supergiant's [Hades update
history](https://www.supergiantgames.com/blog/hades-updates/) likewise combines armor, speed,
attacks, and encounter variants rather than expressing every difficulty increase as health.

Project use: a Splitback retains its armor transition and a Shear-jelly retains flight at every
level. Level changes the numeric envelope; authored behavior changes the defense question.

## Finite towers make count meaningful

For a tower with attack rate `a`, target cap `k`, and damage `d`, its ideal output against an
eligible cohort is bounded:

```text
damagePerSecond = a * k * d
```

Arc, range, line of sight, target switching, and route residence reduce the realized output. A
larger cohort can therefore exceed the tower's service capacity even when each enemy is individually
fragile. This supports wave-density pressure, bounded area weapons, and meaningful split routes.

## Balance authority

Closed-form estimates explain broad relationships and expose obvious deficits. Exact deterministic
campaign replays decide whether authored reference defenses pass. Human playtests decide whether
players can see the threat, understand tower output, and make a useful change after failure.
