# Combat balance model

The combat model estimates whether a defense can stop each authored wave before enemies reach the
Core. It treats towers as finite services over a vertical route graph, then verifies the estimates
with the deterministic runtime.

## State and units

The workbook uses simulation seconds and base Matter units.

For each tower grade:

- attack cadence and attacks per second;
- damage or effect magnitude per attack;
- target cap and area footprint;
- range, firing arc, line-of-sight rule, and valid mounting faces;
- targeting policy and eligible enemy classes;
- construction and upgrade cost.

For each enemy cohort:

- count, spawn interval, route, speed, and resolved level;
- health, Core damage, Matter yield, armor, resistances, and movement class;
- behavior events that alter route, speed, vulnerability, or nearby enemies.

For each route segment:

- length, traversal type, elevation, and movement cost;
- which tower placements can cover it;
- obstruction and environmental state;
- split, merge, and alternate-route probability or authored rule.

## First-order tower output

For tower `t` against enemy `e`:

```text
rawDps_te = damagePerAttack_t * attacksPerSecond_t
netDps_te = rawDps_te * hitFraction_te * channelMultiplier_te * uptime_te
```

`hitFraction` accounts for projectiles, arcs, and target motion. `uptime` accounts for reload,
turning, disabled periods, resource supply, and time with an eligible target. Both begin at one for
simple opening towers and become measured coefficients when later mechanics require them.

Area attacks remain finite. If an attack can affect at most `k` targets, its service capacity is:

```text
targetService_t = k * attacksPerSecond_t
```

Wave density can therefore overwhelm a tower even when its nominal damage per enemy is sufficient.

## Route coverage

A tower covers the subset of route segments inside its range and firing arc with valid line of
sight. For enemy `e` moving through tower `t`'s coverage:

```text
coverageTime_te = sum(coveredSegmentLength / effectiveSpeed_e)
damageOpportunity_te = netDps_te * coverageTime_te
```

Split routes produce separate coverage values. A defense must cover every route the authored wave
can use; strong coverage of one branch cannot offset an open branch. Merge points reward towers
with broad arcs or bounded area effects, while ladders, drops, and upper lanes give wall and ceiling
mounts different value from floor mounts.

Target selection changes which enemy receives each attack. First, last, strongest, weakest, and
nearest policies use stable route progress and identity ordering. The workbook models contention by
assigning each attack opportunity to the same target the runtime would select.

## Control and support

Movement control converts into additional coverage time:

```text
effectiveSpeed = baseSpeed * product(speedMultipliers)
```

Control has explicit floors, duration, refresh, and stacking rules. Stuns and forced route changes
consume a finite effect budget rather than acting as unbounded damage multipliers.

Support effects modify named tower or enemy properties: cadence, range, channel, target cap,
visibility, armor, or resistance. Their workbook representation uses the same typed effect data as
the runtime. Later pipe and atmosphere mechanics enter through these modifiers rather than through
a separate combat accounting system.

## Economy

Matter links defense strength across a site and across the campaign. For wave `w`:

```text
matterAfter_w = matterBefore_w - construction_w - upgrades_w + enemyRewards_w + siteRewards_w
```

Reference defenses track both survival and spending. A defense that succeeds only by consuming
Matter required for the next site fails the campaign portfolio even if it clears the current wave.

Tower upgrades provide frequent incremental purchases. A room graft costs roughly six to ten
ordinary upgrades and is evaluated against the future surface area, route control, and equipment
positions it adds. Campaign portfolios normally choose two or three grafts across all twelve sites.
No artificial graft count cap substitutes for this economic pressure.

## Enemy behavior budgets

Archetype mechanics consume part of an encounter's pressure budget:

| Behavior                | Balance effect                                                  |
| ----------------------- | --------------------------------------------------------------- |
| Fast movement           | Shortens coverage time and pressures early acquisition          |
| Armor or resistance     | Reduces a named tower channel until broken or bypassed          |
| Flight                  | Changes eligible routes and tower arcs                          |
| Protection field        | Increases the value of target priority and spatial separation   |
| Route preference        | Shifts demand between branches                                  |
| Tower disruption        | Reduces local uptime for a finite interval                      |
| Spawned or split bodies | Increases target service demand after a trigger                 |
| Environmental byproduct | Changes a room or tower property through the shared environment |

Enemy level scales numeric durability and consequence. Archetype behaviors remain stable enough for
the player to read and counter.

## Transient solve

The exact balance pass advances the same fixed-step runtime as play. It records:

- each enemy's route position, targetability, received packets, and Core arrival;
- each tower's selected targets, attacks, downtime, and overkill;
- route occupancy and branch pressure;
- Matter earned and spent;
- Core integrity after every wave;
- any process inventory or atmospheric state used by combat.

First-order estimates identify likely failures and explain broad tuning. The transient solve decides
whether a reference defense passes because it includes cadence alignment, target switching, area
caps, simultaneous arrivals, and runtime behavior.

## Campaign acceptance

Each site carries reference defenses that differ in placement geometry, tower mix, upgrade order, or
route control. A healthy site satisfies these conditions:

- every route receives meaningful pressure;
- multiple reference defenses clear all five waves with campaign-legal resources;
- an idle or materially incomplete defense loses;
- one tower family cannot answer every enemy and geometry problem at efficient cost;
- required player output grows within the campaign's expected upgrade curve;
- later chemistry or environment options add viable defenses without invalidating direct towers.

Human playtests then check what the workbook cannot establish: whether threat direction, tower
coverage, attack results, upgrade value, and defeat causes are visible enough to support informed
changes.

## Workflow

1. Author the site map, routes, waves, starting Matter, and rewards.
2. Place representative defenses through legal construction commands.
3. Compare route coverage and first-order service capacity.
4. Run the exact deterministic replay and inspect leaks, idle time, overkill, and economy.
5. Adjust one authored axis at a time and retain the replay as a regression portfolio.
6. Validate the complete campaign curve with `pnpm campaign:health` and `pnpm balance:combat`.
