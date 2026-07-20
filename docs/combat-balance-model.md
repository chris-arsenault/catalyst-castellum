# Combat balance model

`pnpm balance:combat` is the source-of-truth combat workbook. It reads the compiled game
definition and the deterministic runtime directly; copied constants and hand-maintained spreadsheet
cells are outside the model. `pnpm balance:combat -- --first-order` runs the inexpensive analytical
pass, and `pnpm balance:combat -- --json` emits the complete machine-readable workbook.

The solver separates design constraints from mechanical facts. Stoichiometry, room geometry,
routes, speed, locomotion penalties, drag, equipment grades, process limits, conduit hold-up,
feed composition, reaction cadence, hazard slopes, resistance, waves, and prime times are mechanical
facts imported from the game. Reference exposure, target route time, required coverage, archetype
role, and regularization strength are explicit design constraints in
`src/game/balance/damageModel.ts` and `src/game/balance/transientModel.ts`.

Enemy durability uses the authored geometric progression in
[`enemy-level-progression.md`](./enemy-level-progression.md). Site level and wave offsets replace
anonymous per-wave health multipliers. Because damage affects every occupant of a room, enemy count
controls density and breach stakes while level controls the required exposure per target.

## State and units

The transient state vector contains, for every room and transport segment:

- lower/upper gas amount by species;
- liquid amount by species;
- lower/upper gas temperature and wall temperature;
- conduit and junction inventory by species;
- static and impulse pressure state;
- reaction cooldown and process outlet inventories;
- enemy path cursor, segment progress, HP, and damage ledger.

Amounts use the simulation's conserved inventory units, time uses seconds, distance uses map cells,
temperature uses degrees Celsius, pressure uses kPa, and combat output uses HP. Rates are therefore
inventory/s, cells/s, or HP/s. A flash is an instantaneous HP packet rather than HP/s.

## Material linear system

Let `q` be the species inventory vector and `r` the vector of reaction extents. The generated
stoichiometric matrix `S` has species as rows and reactions as columns:

```text
q(t + dt) = q(t) + S r(t) + B u(t) - T(t)
```

`B u` is supplied material and `T` is conserved transport. Each reaction column is assembled from
the authored coefficients, negative for reactants and positive for products. For example, OX-1 has
`H2 = -2`, `O2 = -1`, and `steam = +2`. CL-1 has `NaCl = -2`, `water = -2`, `Cl2 = +1`, `H2 = +1`,
and `NaOH = +2`.

The ideal first-order rate of reaction `j` is the minimum of every declared constraint:

```text
r_j <= available_i / abs(S_ij)        for each reactant i
r_j <= authored process maximum
r_j <= outlet headroom / S_ij         for each product i
r_j <= transport rate / coefficient   for each supplied reactant
```

The report propagates CL-1 output through CL-2, P-1, CL-4, and CL-5. It also derives OX-1 charge
rate from the starter header's exact `2 H2 : 1 O2` mixture. For starter flow `f`, OX-1 extent arrives
at `f / 3`, so a full-charge interval is `maximumExtent / (f / 3)`, bounded below by cooldown.
Every one of the 30 authored reactions reports its maximum extent rate, minimum ideal proc interval,
reactant demand, product output, and powered-equipment grade caps. Every site reservoir reports its
mixture, local-port rate, ideal depletion time, and Matter price. These are first-order capacity
bounds; the transient replay supplies kinetic activation, catalysts, inhibitors, headroom, and
shared-feed contention.

Every conduit reports routed length `L`, inventory hold-up `L * volumePerCell`, length-adjusted
maximum flow, and ideal prime time `hold-up / flow`. The second-order pass uses actual pressure,
buoyancy, backpressure, priming, junction contention, and destination headroom instead of these ideal
bounds.

## Route and residence-time system

Pathfinding supplies a sequence of map cells. For segment `s`, enemy `e` has dry traversal time

```text
t_es = length_s /
       (enemySpeed_e * 32 * locomotionMultiplier_s * roomMovementMultiplier_s)
```

Locomotion multipliers are read from the engine for walking, climbing, falling, doors, and flight.
An archetype behavior multiplier is applied to the same segment equation. This makes the Ladder
Runner faster specifically on authored ladder cells while preserving the common route and all room
drag rules.
The room movement term is

```text
m_room = max(0.2, m_pressure * m_liquid)
```

Pressure drag begins at 1.3 atm and reaches a 55% slowdown across the authored 1.2-atm range.
Liquid drag begins at 15% fill and reaches a 65% slowdown at maximum usable fill. Flight omits
liquid drag. The report integrates segment time by room, so room width, platforms, ladders, door
cells, room count, and speed all contribute to exposure. It also evaluates dry, 1.7-atm, 60%-fill,
and combined reference routes.

## Damage matrix

For an environmental sample, raw channel DPS is the sum of hazard-rule excess:

```text
h_c = sum_i max(0, basis_i - threshold_i) * rate_ic
```

The direction is reversed for oxygen deficiency. Gas basis is partial pressure relative to standard
pressure; liquid basis is `species amount * species fraction`. Temperature and static pressure add
their independent channel terms.

Enemy resistance is represented as a susceptibility multiplier, so effective damage is

```text
d_e = sum_c exposureTime_e * h_c * susceptibility_ec
```

OX-1 is a packet:

```text
pressure = pressureDamageBase + extent * pressureDamagePerExtent
heat     = extent * heatDamagePerExtent
```

The model keeps thirteen independent columns:

1. OX-1 flash;
2. chlorine gas;
3. hydrogen chloride gas;
4. liquid corrosion (NaOH, NaOCl, and HCl(aq));
5. carbon monoxide;
6. reactive nitrogen (NH3, NO, NO2, and HNO3);
7. nickel carbonyl;
8. hydrogen fluoride;
9. fluorine;
10. uranium chemistry (UF6 and UO2F2);
11. oxygen deficiency / carbon dioxide;
12. steam and environmental heat;
13. catastrophic static overpressure.

Each hazardous species owns an exact combat source ID, and environmental heat and pressure own
their independent source IDs. Anchor absorption is allocated proportionally by source in the same
transaction as its incoming-damage scale. This separation prevents HF, uranium, a late pressure
field, or any other broad channel from being mistaken for the output of a different process chain.

## First-order solve

The analytical pass fixes one named representative exposure for each family. Common gases use
family-specific partial-pressure excesses, floor hazards use a two-strength mixed-liquid sample,
UO2F2 adds ten stationary inventory units, environmental heat uses 40 C of excess, and static
pressure uses 0.3 atmosphere of excess. Continuous damage is integrated across one
enemy-specific average room residence; OX-1 uses one packet. The values live in
`FAMILY_REFERENCE_EXPOSURES` rather than in spreadsheet cells.

For all ten offensive families, `A` is the Deckmouth damage matrix and `b` is the desired
family-specific fraction of Deckmouth HP. The bounded ridge solve is

```text
minimize ||W(Ax - b)||^2 + lambda ||x - 1||^2
subject to 0.05 <= x_j <= 20
```

This pass answers whether raw OX-1, chlorine, HCl, liquids, carbon monoxide, reactive nitrogen,
nickel carbonyl, HF, fluorine, and uranium slopes occupy their declared role before campaign timing.
It deliberately cannot decide whether a pulse or product front occurs while a target occupies the
room.

Enemy health is solved after reference damage. Each archetype declares the number of reference
encounters it should withstand. A ridge prior retains established identity while the damage samples
pull toward common weapon budgets. Splitbacks receive the largest encounter budget, flintjacks the
smallest, Shear-jellies omit floor-contact liquid samples, and Deckmouth/Redlung occupy the middle. Results
round to five HP.

Speed uses the same structure. Weighted path length divided by a declared route-time target yields
speed, rounded to 0.005. Current role targets are 26 s Deckmouth, 15 s Flintjack, 19 s Shear-jelly,
36 s Splitback, 31 s Redlung, 25 s Clatter, 28 s Anchor, and 20 s Glowbag.

## Enemy behavior budgets

Special behaviors remain explicit conserved budgets in both the report and runtime:

```text
molt threshold = (total health - shell health) * level health scale
field absorbed = min(field charge, sum of post-resistance allied requests)
ally damage_i  = request_i * (1 - field absorbed / summed requests)
field charge'  = min(capacity, field charge + recharge * dt)
emitted gas    = min(reservoir, emission rate * dt, room gas headroom)
reservoir'     = reservoir - emitted gas
```

The shell carapace is part of total solved HP, so molting changes tempo rather than adding hidden
durability. An Anchor protects other same-room enemies and its field consumption is recorded as
combat output; transient target health includes one initial leveled field capacity. Recharge and
actual ally overlap are then resolved by exact replay. Glowbag inventory enters the
occupied gas layer before reactions, so stratification, headroom, ignition thresholds, and route
time bound its realized output. Its six-unit reservoir supplies exactly one ignition-threshold OX-1
charge at `2 H2 : 1 O2` and discharges over ten ideal seconds.

Species hazards may author a maximum effective excess above their threshold. The runtime and static
workbook apply the same bound before multiplying by the hazard slope. Chlorine saturates at the
`0.008` partial-ratio excess used by its controlled exposure, so richer atmospheres preserve maximum
DPS rather than producing unbounded overkill.

## Second-order transient solve

The static answer is only the initial point. Exact source attribution lets the transient pass run
the exact engine once per authored reference build, while recording every damage family from the
same trajectory, with:

- every family active together through unchanged chemistry, transport, reactions, temperature,
  pressure, and movement;
- very high probe HP so lethal caps never discard exposure;
- zero probe core damage so every authored round completes;
- sufficient probe build matter so later availability can be measured independently of probe death.

It records one row per build and authored round. Each row therefore includes its real prime
duration, wave timing, equipment availability, reaction history, feed depletion, conduit inventory,
room state, proc cadence, path residence, slowdown, susceptibility, and Anchor absorption. One
probe produces the complete source vector and keeps every sensitivity column on one chemistry
trajectory.

Campaign targets are minimum coverage inequalities, not equalities. Flash Point retains a strict
100-Core contract. Every other site reserves a 45-Core safety floor, divides the available Core-loss
budget across its rounds, and converts each wave's potential Core damage into a required
neutralization fraction:

```text
roundLeakBudget = (startingCore - minimumCore) / roundCount
requiredFraction = max(0, 1 - roundLeakBudget / wavePotentialCoreDamage)
targetDamage = effectiveWaveHP * requiredFraction * 1.05
```

Rows with a zero target are setup waves whose full breach cost fits the round budget. Useful
overkill is valid; only undercoverage contributes loss:

```text
minimize 1/2 sum_i w_i max(0, 1 - A_i x)^2 + lambda/2 ||x - prior||^2
subject to family-specific lower_j <= x_j <= upper_j
```

Projected gradient descent solves this convex hinge-loss system with a ridge prior at the
first-order role. OX-1 remains at its first-order pulse role because its one-room tutorial failure
control is an exact upper guardrail. Asphyxiation, thermal damage, and catastrophic pressure are
measured columns with absolute design guardrails: 72.5 oxygen-deficiency and 30 carbon-dioxide DPS
slopes, 7.3 steam and 0.014 environmental heat slopes, and a 36 static-pressure slope. Each guardrail averages its
`absolute target / current coefficient` ratios, making an applied workbook converge to a relative
scale of one on its next run. Chemical columns absorb the required coverage, so the chemical exam
cannot be solved primarily by unrelated environmental damage. HF, fluorine, and uranium also
remain at their first-order roles in this pass because their isolated specialist portfolios already
clear; this prevents free site deposits or unprocessed specialist feed from becoming a universal
late-game correction.

Finally, the proposed coefficients, HP, and speed are compiled into an in-memory definition and
every reference build is replayed with normal HP, core damage, Matter income, command costs, and
lethal clipping. The report includes Matter spent, damage per Matter, dominant family, and dominant
share for each build. This live verification is authoritative for pass/fail; the matrices explain
the result and propose coefficients, while exact replay catches proc thresholds, resource feedback,
and discrete breaches.

Campaign health also replays authored failure controls. These partial builds represent an earlier
tutorial stage that must lose once reinforcement begins. They add upper progression constraints the
minimum-coverage solve cannot express: one Flash Point chamber loses to the corridor waves, and the
Membrane Cell alone loses when Make the Reagent begins its acid-line waves.

## Applied baseline

The July 2026 solve establishes these authored roles:

| Enemy       | HP  | Speed | Dry route | 1.7-atm route | 60%-fill route | Combined drag |
| ----------- | --- | ----- | --------- | ------------- | -------------- | ------------- |
| Deckmouth   | 85  | 0.105 | 26.41 s   | 39.62 s       | 43.27 s        | 69.21 s       |
| Flintjack   | 55  | 0.185 | 14.99 s   | 22.49 s       | 24.56 s        | 39.28 s       |
| Shear-jelly | 85  | 0.145 | 19.05 s   | 28.57 s       | 19.05 s        | 30.49 s       |
| Splitback   | 175 | 0.075 | 36.98 s   | 55.46 s       | 60.58 s        | 96.89 s       |
| Redlung     | 130 | 0.090 | 30.81 s   | 46.22 s       | 50.48 s        | 80.74 s       |
| Clatter     | 75  | 0.105 | 24.97 s   | 37.46 s       | 40.95 s        | 65.71 s       |
| Anchor      | 75  | 0.100 | 27.73 s   | 41.60 s       | 45.43 s        | 72.67 s       |
| Glowbag     | 75  | 0.140 | 19.73 s   | 29.59 s       | 19.73 s        | 31.57 s       |

With the enemy-level curve applied, the controlled-exposure solve returns approximately `1.000`
for the direct families: OX-1, chlorine, carbon monoxide, HF, fluorine, and uranium chemistry. Four
families carry explicit campaign-delivery premiums because their real process chains lose time to
reaction, transport, phase contact, and feed contention:

| Family            | Authored transient premium | Applied first-order normalizer | Combined role |
| ----------------- | -------------------------: | -----------------------------: | ------------: |
| HCl gas           |                     5.6316 |                         0.1784 |        1.0047 |
| Liquid corrosion  |                     3.0674 |                         0.3234 |        0.9919 |
| Reactive nitrogen |                     4.0824 |                         0.2432 |        0.9928 |
| Nickel carbonyl   |                     2.5560 |                         0.3809 |        0.9736 |

The normalizer is the inverse controlled-exposure result produced after the premium is authored;
the product is the family's combined role. This makes delivery compensation visible instead of
hiding it in enemy health. The same solve returns every enemy's authored HP and speed.

Act II uses five-build acceptance portfolios. Exact replay leaves the Core at 74–100% for
Kettleblack, 51–100% for Cordon 41, 69–100% for Junction L-6, and 51–100% for Pell Cut. Each site also
fails under an idle policy. The spread is deliberate: direct counters remain efficient while
established general defenses and the site's optional specialist chain remain viable.

Act III exact replay leaves the Core at 54–100% for Station 14, 54–100% for Vasker Store, 100% for
Lane Six, and 50–100% for Pell Cordon. Every site clears all five physical strategy archetypes while
its idle policy loses.

Pell Cut and Act III place HF in a physical G-2 specialist reservoir hosted by an isolated
service room. The common Core G-1 header carries the ordinary H2/O2/N2/CO feed. The fluorine and
uranium reference builds route G-2 from the Reservoir through a Gallery Fluorine Cell; established
defenses remain connected to G-1.
This removes the measured common-header convergence while preserving conserved transport, visible
reservoir economy, and a player-authored specialist route. On the corrected 1x specialist roles,
Pell Cut records about 3,636 fluorine damage and 61 incidental HF damage; Station 14 records about
3,625 fluorine damage plus 1,839 uranium-chemistry damage and zero HF damage.

The high-HP sensitivity trajectory intentionally removes lethal clipping and grants effectively
unlimited probe Matter so one run can measure all source columns. Exact normal-HP replay then catches
nonlinear misses from lethal thresholds, Matter income, and later construction timing. A local
response sweep found that Vasker's acid-line breaches were exclusively flyers: doubling floor
corrosion changed zero deaths. The Act III continuous reference therefore extends HCl from the
Gallery into an agitated Switchyard, and the exact delivery solve adds a `1.25` HCl correction. Pell
Cordon's hybrid crosses its discrete round-two threshold with a `1.10` reactive-nitrogen correction.
These are family-wide or physical-build corrections, never per-site health exceptions.

## Workflow

1. Change mechanics or content at its owning definition.
2. Run `pnpm balance:combat -- --first-order` while iterating on local coefficients.
3. Run `pnpm balance:combat` for the full per-build/per-round transient solve.
4. Review the sensitivity matrix and live verification together.
5. Update authored values from the stable solution, then run `pnpm check` and
   `pnpm campaign:health`.

When a target changes, change the named design constraint in the model. Avoid compensating for one
round with an unexplained health scale or damage constant; the next report must show which matrix row
required the change.
