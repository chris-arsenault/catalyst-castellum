# Enemy scaling and combat-balance research

Date: 2026-07-17

This note summarizes the external research behind the combat solver and enemy-level progression.
The implemented model is specified in
[`enemy-level-progression.md`](../enemy-level-progression.md), while the full mathematical workbook
is documented in [`combat-balance-model.md`](../combat-balance-model.md).

## Questions

The research investigated:

- how enemy health and player damage should grow over a campaign;
- whether defense should scale with level;
- how room size, route length, speed, slowdown, and wave timing change exposure;
- how a room-wide weapon changes the meaning of enemy count;
- how to compare OX-1 pulses, continuous gases, liquids, heat, asphyxiation, and pressure;
- how tower-defense waves should use counts, composition, spikes, and recovery periods.

## Findings

### Combat feel is a ratio

[Breaking down the metagame design in a mobile
RPG](https://www.gamedeveloper.com/design/breaking-down-the-metagame-design-in-a-mobile-rpg)
models perceived combat length as enemy durability divided by player attack. If the intended feel is
preserved for a fixed difference between player and enemy level, both curves need a geometric basis.
Adding a fixed amount of HP per level does not preserve that ratio as the numbers grow.

Project implication:

```text
enemy health(L) = reference health * growth^(L - reference level)
```

The selected health growth is 10% per level, anchored at level 20. This is a project tuning decision,
not a constant taken from another game.

### Formulas predict; encounters validate

[The craft of game systems: Practical
examples](https://www.gamedeveloper.com/design/the-craft-of-game-systems-practical-examples)
recommends forecasting player power, retaining meaningful units, and graphing results. It also
emphasizes that balance exists where systems intersect with actual content; a formula is only a
broad-strokes prediction.

Project implication: the first-order solve compares weapon families under controlled reference
exposures, then the second-order solve runs the exact transient engine. The latter includes room
inventory, transport hold-up, feed depletion, reactions, pressure, temperature, path residence,
slowdown, wave timing, and proc cadence.

### Tower-defense difficulty is more than enemy totals

The accepted paper [A NEAT Approach to Wave Generation in Tower Defense
Games](https://www.open-access.bcu.ac.uk/13568/1/A_NEAT_Approach_to_Wave_Generation_in_Tower_Defense_Games___IMET.pdf)
reviews dynamic wave systems that use enemy power, health, spawn count, and resource changes. Its
wave-manager precedent uses a difficulty budget rather than treating every enemy as interchangeable.
It also notes that a static solved strategy loses engagement.

Project implication: site level controls per-enemy durability; composition selects the required
counter; spawn timing determines cohorts and proc opportunities; route and speed determine exposure;
count controls breach stakes, residue, and economy.

### Good difficulty curves contain local shape

[How Tough Is Your Game? Creating Difficulty
Graphs](https://www.gamedeveloper.com/design/how-tough-is-your-game-creating-difficulty-graphs)
describes stair steps, spikes, plateaus, and recovery rather than an uninterrupted rise. The mean
curve should increase while individual encounters retain deliberate variation.

Project implication: site baselines rise monotonically, while round composition and sparse level
offsets create local peaks. Teaching and recovery rounds retain margin between harder checks.

### Counter identity should remain separate from raw durability

[The Secrets of Enemy AI in Uncharted
2](https://www.gamedeveloper.com/design/the-secrets-of-enemy-ai-in-i-uncharted-2-i-)
describes damage-receiver classes as a way to avoid arbitrary HP changes and cascading weapon
rebalance. Supergiant's [Hades update history](https://www.supergiantgames.com/blog/hades-updates/)
also demonstrates higher-difficulty variation through armor, speed, attacks, encounter variants, and
optional modifiers rather than health alone.

Project implication: level does not change an archetype's hazard susceptibility. A Splitback remains a
Splitback at every level. Defense is authored as stable chemical and physical identity, while health is
the progression axis.

## Room-wide damage changes the capacity equation

For enemy `e` in room `r`, let `I_er` be its residence interval, `q_c(t)` the room's damage rate in
channel `c`, and `m_ec` its susceptibility:

```text
continuous damage_e = integral over I_er of sum_c(q_c(t) * m_ec) dt
pulse damage_e      = sum of matching room pulses during I_er
```

If `n` identical enemies share the same interval, each receives the same room damage. Their
neutralization time is:

```text
TTK = enemy health / room DPS
```

It is not `n * enemy health / room DPS`. Summed wave HP and summed delivered damage both multiply by
`n`, so their ratio hides this unlimited-area property.

This produces a firm division of responsibility:

| Authoring axis          | What it controls                                          |
| ----------------------- | --------------------------------------------------------- |
| Enemy level             | Required exposure or room-wide proc count                 |
| Archetype               | Counter choice and movement identity                      |
| Spawn timing            | Whether a pulse catches one enemy or a cohort             |
| Route and room geometry | Number and duration of exposure windows                   |
| Slowdown                | Additional residence created by pressure and liquid       |
| Enemy count             | Breach loss, reward density, residue, and visual pressure |

## Implemented progression decision

Every site authors a baseline level and every wave entry may author an integer offset for a local
spike, recovery cohort, or teaching target. Resolved levels range from 1 through 99.

```text
health(L)       = referenceHealth * 1.10^(L - 20)
coreDamage(L)   = round(referenceCoreDamage * 1.035^(L - 20))
matterYield(L)  = round(referenceMatterYield * 1.10^((L - 20) / 2))
residue(L)      = round(referenceResidue * 1.025^(L - 20))
```

Health grows fastest because it governs exposure. Core damage and residue increase more slowly.
Matter uses the square root of the health scale so stronger enemies become more valuable without
automatically financing the increased burden they create.

Speed does not scale with level because it already changes effective durability by changing room
residence. Susceptibility does not scale because it defines the counter matrix. Both remain explicit
archetype or encounter controls.

The initial site baselines are:

| Site             | Level | Health relative to level 20 |
| ---------------- | ----: | --------------------------: |
| Flash Point      |    20 |                      1.000x |
| Make the Reagent |    21 |                      1.100x |
| Stored Chlorine  |    22 |                      1.210x |
| Morrow Pocket    |    23 |                      1.331x |
| Kettleblack      |    24 |                      1.464x |
| Cordon 41        |    25 |                      1.611x |
| Junction L-6     |    26 |                      1.772x |
| Pell Cut         |    27 |                      1.949x |
| Station 14       |    28 |                      2.144x |
| Vasker Store     |    29 |                      2.358x |
| Lane Six         |    30 |                      2.594x |
| Pell Cordon      |    31 |                      2.853x |

## Validation result

After the level curve was introduced, the second-order sensitivity solve measured the gap between a
controlled room exposure and a physical campaign process. Direct families converge at approximately
`1.000`. HCl, liquid corrosion, reactive nitrogen, and nickel carbonyl require campaign-delivery
premiums of `5.632`, `3.067`, `4.082`, and `2.556`; their applied first-order normalizers are `0.178`,
`0.323`, `0.243`, and `0.381`. Multiplying each pair returns combined relative roles of `1.005`,
`0.992`, `0.993`, and `0.974`. This exposes the cost of reaction time, transport, phase contact, and
feed contention rather than folding those losses into enemy health.

The sensitivity trajectory uses high-HP, zero-Core-damage probes and effectively unlimited probe
Matter so a single trajectory measures every damage column. Authoritative normal-HP replay then
applies lethal clipping, real Matter income, and command costs. Local response sweeps distinguish
coefficient misses from topology: doubling liquid corrosion changed no Vasker deaths because all
breaches were flyers. Extending the continuous HCl network into its agitated Switchyard and applying
the measured HCl correction clears that lane; a reactive-nitrogen correction crosses Pell Cordon's
discrete hybrid threshold.

Exact intended-policy replay finishes the four Act I sites at 100%, 100%, 79%, and 100% Core
integrity.
This replay, rather than the closed-form curve alone, is the final balance authority.

Act II validates the broader portfolio rather than one intended solution. Five distinct builds clear
each site while idle defense loses. Surviving Core integrity spans 74–100% at Kettleblack, 51–100% at
Cordon 41, 69–100% at Junction L-6, and 51–100% at Pell Cut. These bands preserve efficient counters,
general defenses, hybrids, and site-specialist chemistry inside one viable envelope.

Act III's mechanical acceptance also clears five physical portfolios per site while idle defense
loses. The balance audit found that the common HF-bearing gas header caused otherwise distinct gas
networks to converge on the same dominant damage channel. Pell Cut and Act III now host HF in a
dedicated Reservoir-side G-2 supply, and specialist portfolios route it to their Gallery Fluorine
Cell. Ordinary G-1 defenses retain their distinct OX-1, carbon, nitrogen, chlorine, HCl, liquid, and
hybrid damage signatures. Exact replay measures Pell Cut at roughly 3,636 fluorine damage with 61
incidental HF damage, while Station 14 produces roughly 3,625 fluorine and 1,839 uranium damage with
zero HF exposure. Core integrity spans 54–100% at Station 14, 54–100% at Vasker Store, 100% at Lane
Six, and 50–100% at Pell Cordon.

## Follow-on question

Level solves per-enemy exposure but intentionally does not make a larger co-located cohort require
more room DPS. Enemy-variety mechanics can address that remaining property through shared finite
buffers, finite reagent reservoirs, phase changes, and group-support effects. Those options are
researched in [`enemy-variety.md`](./enemy-variety.md).
