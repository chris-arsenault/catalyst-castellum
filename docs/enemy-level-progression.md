# Enemy level progression

Enemy level is the campaign's numeric durability axis. Every spawned enemy has an integer level,
every site authors a baseline, and a wave may apply a visible integer offset for a veteran,
weakened cohort, or tutorial target. Enemy count, route, composition, and timing remain independent
encounter controls.

## Progression principles

- Geometric health growth preserves a stable time-to-kill relationship when tower output grows by
  upgrades over the same campaign interval.
- Enemy count raises target-service demand, Matter income, breach stakes, and route occupancy.
- Speed shortens tower coverage and therefore compounds durability; it stays an archetype or wave
  property rather than an automatic level bonus.
- Armor, resistance, flight, fields, route preferences, and disruption preserve enemy identity.
- Site difficulty may spike or recover locally while the campaign's expected player-power curve
  continues upward.

The formula predicts the broad curve. Authored route geometry, available surfaces, tower economy,
and exact runtime replays determine whether a site is playable.

## Authored curve

Level 20 is the reference point for archetype definitions. For resolved enemy level
`L = siteLevel + waveOffset`:

```text
health(L)       = referenceHealth * 1.10^(L - 20)
coreDamage(L)   = round(referenceCoreDamage * 1.035^(L - 20))
matterYield(L)  = round(referenceMatterYield * 1.10^((L - 20) / 2))
residue(L)      = round(referenceResidue * 1.025^(L - 20))
```

Health carries the steepest curve because it controls required tower exposure. Core damage and
residue rise more slowly so leaks gain consequence without compounding as sharply as durability.
Matter uses the square root of the health scale: stronger enemies pay more while retaining pressure
on the upgrade economy.

Speed, movement rules, target eligibility, and channel susceptibility do not scale with level.
Those values remain archetype and encounter controls.

The initial campaign baselines are:

| Site           | Enemy level | Health versus level 20 |
| -------------- | ----------: | ---------------------: |
| Claim 8-Delta  |          20 |                 1.000x |
| Harker's Brace |          21 |                 1.100x |
| Twelve-Cask    |          22 |                 1.210x |
| Morrow Pocket  |          23 |                 1.331x |
| Kettleblack    |          24 |                 1.464x |
| Cordon 41      |          25 |                 1.611x |
| Junction L-6   |          26 |                 1.772x |
| Pell Cut       |          27 |                 1.949x |
| Station 14     |          28 |                 2.144x |
| Vasker Store   |          29 |                 2.358x |
| Lane Six       |          30 |                 2.594x |
| Pell Cordon    |          31 |                 2.853x |

The one-level step is a starting campaign curve, not a promise that every site feels exactly ten
percent harder. Tower unlocks, upgrades, new surfaces, grafts, route structure, and wave composition
change the player's available output and the encounter's demand.

## Encounter axes

| Axis              | Primary effect                                                   |
| ----------------- | ---------------------------------------------------------------- |
| Site level        | Health, Core damage, reward, and residue baseline                |
| Enemy count       | Target-service pressure, route occupancy, rewards, breach stakes |
| Archetype mix     | Tower eligibility, channel, priority, and behavior counters      |
| Spawn timing      | Simultaneous demand, area value, and target switching            |
| Speed             | Time inside each tower's coverage                                |
| Route choice      | Which surfaces and branches must provide coverage                |
| Wave level offset | A visible local veteran, weakened cohort, or training target     |

Wave budgets combine these axes. Increasing count and level together requires explicit evidence
that available tower output and Matter can support both the added health and added service demand.

## Authoring and verification

Site baselines and resolved wave levels are integers from 1 through 99. The compiler rejects an
invalid site level, fractional offset, or out-of-range resolved level. Runtime enemies persist their
resolved level so health, Core damage, Matter, residue, tooltips, and save/load agree.

For a new site:

1. Choose the baseline from the expected tower and upgrade curve.
2. Shape waves through composition, timing, route, count, and sparse level offsets.
3. Check every route against legal tower placements and campaign-available resources.
4. Plot Core integrity, tower uptime, target contention, and Matter across all five waves.
5. Preserve intentional recovery waves between major spikes.

`pnpm balance:combat` reports the level curve, route coverage, tower service capacity, economy, and
exact campaign replay. `pnpm campaign:health` remains the final authored playability gate.
