# Enemy level progression

Enemy level is the campaign's durability axis. Every spawned enemy has an integer level, every site
authors a baseline level, and a wave may apply an integer offset for a veteran, weakened cohort, or
tutorial target. Enemy count remains a cadence, economy, and breach-stakes axis; it is not used as a
proxy for durability because room hazards affect every occupant.

## Research basis

The implementation follows five useful practices from progression and tower-defense design:

- Preserve time-to-kill across a fixed player/enemy level gap with geometric stat growth. The
  metagame analysis in [Breaking down the metagame design in a mobile
  RPG](https://www.gamedeveloper.com/design/breaking-down-the-metagame-design-in-a-mobile-rpg)
  derives perceived combat length from enemy HP divided by player attack and shows why equal level
  gaps imply exponential curves.
- Predict player power, retain units, graph the result, and validate the math against actual
  content. [The craft of game systems: Practical
  examples](https://www.gamedeveloper.com/design/the-craft-of-game-systems-practical-examples)
  treats formulas as broad-strokes models whose meaning comes from their intersection with authored
  encounters.
- Shape waves as budgets and cohorts. The accepted paper [A NEAT Approach to Wave Generation in
  Tower Defense
  Games](https://www.open-access.bcu.ac.uk/13568/1/A_NEAT_Approach_to_Wave_Generation_in_Tower_Defense_Games___IMET.pdf)
  reviews point-budget wave management and notes that static, solved strategies lose engagement.
- Graph difficulty as steps, spikes, plateaus, and recovery rather than demanding a monotonic rise
  every round. [How Tough Is Your Game? Creating Difficulty
  Graphs](https://www.gamedeveloper.com/design/how-tough-is-your-game-creating-difficulty-graphs)
  recommends evaluating the mean curve while retaining deliberate local variation.
- Keep counter identity separate from raw durability. [The Secrets of Enemy AI in Uncharted
  2](https://www.gamedeveloper.com/design/the-secrets-of-enemy-ai-in-i-uncharted-2-i-)
  describes damage-receiver classes as a way to avoid random HP changes and cascading weapon
  rebalance. Supergiant's [Hades updates](https://www.supergiantgames.com/blog/hades-updates/)
  similarly mix speed, attacks, encounter variants, and optional modifiers at higher difficulty
  rather than relying on health alone.

These are design references, not copied tuning constants. The project's curve is solved against its
own room geometry, material flow, reaction cadence, routes, hazards, and intended campaign policy.

## Why enemy count does not represent durability

For enemy `e` in room `r`, let `I_er = [arrival, departure]` be its residence interval, `q_c(t)` be
room hazard output in channel `c`, and `m_ec` be the archetype's fixed susceptibility:

```text
continuousDamage_e = integral over I_er of sum_c(m_ec * q_c(t)) dt
pulseDamage_e      = sum of room pulses occurring inside I_er
neutralized_e      iff continuousDamage_e + pulseDamage_e >= health_e
```

If `n` identical enemies occupy a room over the same interval, each receives the same damage.
Their neutralization time is `health / DPS`, not `n * health / DPS`. Summing wave HP is useful for
matter and breach accounting, but it does not describe the capacity of an unlimited room-wide
weapon.

The authoring axes therefore have distinct jobs:

| Axis                | Primary effect                                       |
| ------------------- | ---------------------------------------------------- |
| Site level          | Required exposure or number of room-wide procs       |
| Archetype mix       | Which chemical and physical counters work            |
| Spawn timing        | Cohort overlap and whether a pulse catches the group |
| Speed and route     | Residence time in each prepared room                 |
| Room count and size | Number and duration of exposure opportunities        |
| Enemy count         | Breach stakes, residue, rewards, and density         |
| Wave level offset   | A visible tutorial target or local veteran spike     |

The exact transient balance pass integrates these intervals and pulses. A round succeeds only when
the actual campaign policy can deliver enough damage before enemies leave the prepared rooms.

## Authored curve

Level 20 is the reference point for existing archetype definitions. For resolved enemy level
`L = siteLevel + waveOffset`:

```text
health(L)       = referenceHealth * 1.10^(L - 20)
coreDamage(L)   = round(referenceCoreDamage * 1.035^(L - 20))
matterYield(L)  = round(referenceMatterYield * 1.10^((L - 20) / 2))
residue(L)      = round(referenceResidue * 1.025^(L - 20))
```

Health is the steep curve because it controls required exposure. Core damage and residue rise more
slowly so leaks gain consequence without compounding as sharply as durability. Matter uses the
square root of the health scale: a stronger enemy is more valuable, while its reward grows too
slowly to pay back the whole additional combat burden.

Speed, movement rules, and hazard susceptibility do not scale with level. Scaling speed would
multiply the health change by shortening exposure time. Scaling susceptibility would blur the
Splitback, Shear-jelly, Redlung, Flintjack, and Deckmouth counter matrix. Those values remain archetype and
encounter-design controls.

The initial campaign baselines are:

| Site             | Enemy level | Health versus level 20 |
| ---------------- | ----------: | ---------------------: |
| Flash Point      |          20 |                 1.000x |
| Make the Reagent |          21 |                 1.100x |
| Stored Chlorine  |          22 |                 1.210x |
| Morrow Pocket    |          23 |                 1.331x |
| Kettleblack      |          24 |                 1.464x |
| Cordon 41        |          25 |                 1.611x |
| Junction L-6     |          26 |                 1.772x |
| Pell Cut         |          27 |                 1.949x |
| Station 14       |          28 |                 2.144x |
| Vasker Store     |          29 |                 2.358x |
| Lane Six         |          30 |                 2.594x |
| Pell Cordon      |          31 |                 2.853x |

Flash Point's former anonymous health multipliers are represented as level offsets. The conversion
uses `round(log(oldScale) / log(1.10))`, making the authored veteran intent visible. Make the
Reagent's first training cohort resolves to level 3, preserving its deliberately low durability.

## Authoring and verification

Site baselines and resolved wave levels must be integers from 1 through 99. The compiler rejects an
invalid site level, fractional offset, or out-of-range resolved level. Runtime enemies persist their
resolved level so health, breach damage, matter, residue, tooltips, and save/load all agree.

`pnpm balance:combat` prints the site curve, wave-level range, full reaction/feed solve, route and
room residence, first-order coefficient solve, second-order transient sensitivity matrix, and exact
campaign replay. `pnpm campaign:health` is the final playability gate.

The campaign advances its baseline by one level per site while the current construction vocabulary
remains stable. This keeps health progression at 10% per checkpoint and preserves room-wide wave
density. A larger level jump requires a measured, matching geometric increase in player output.

For future sites, choose the baseline from the expected player-power curve first. Shape individual
rounds with composition, timing, route, and sparse offsets. Use count to set the consequence of a
failed room and the economy delivered by a successful room. Plot core integrity and proc coverage
across the site; preserve intentional recovery rounds between spikes.
