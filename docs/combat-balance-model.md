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

The model keeps seven independent columns:

1. OX-1 flash;
2. chlorine gas;
3. hydrogen chloride gas;
4. liquid corrosion (NaOH, NaOCl, and HCl(aq));
5. oxygen deficiency / carbon dioxide;
6. steam and environmental heat;
7. catastrophic static overpressure.

This separation prevents a large late pressure field from being mistaken for HCl or chlorine
performance.

## First-order solve

The analytical pass fixes one reference exposure: four percentage points of gas partial-pressure
excess, eight liquid-strength units of excess, 40 C of thermal excess, or 0.3 atmosphere of
catastrophic-pressure excess. Continuous damage is integrated across one enemy-specific average
room residence; OX-1 uses one packet.

For the four intended weapon families, `A` is the Deckmouth damage matrix and `b` is the desired
fraction of Deckmouth HP. The bounded ridge solve is

```text
minimize ||W(Ax - b)||^2 + lambda ||x - 1||^2
subject to 0.2 <= x_j <= 5
```

This pass answers whether raw OX-1, Cl2, HCl, and liquid slopes are on the same useful scale before
campaign timing. It deliberately cannot decide whether a pulse occurs while a target occupies the
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

## Second-order transient solve

The static answer is only the initial point. The transient pass runs the exact engine once per
damage family with:

- one family enabled and every other damage slope at zero;
- unchanged chemistry, transport, reactions, temperature, pressure, and movement;
- very high probe HP so lethal caps never discard exposure;
- zero probe core damage so every authored round completes;
- sufficient probe build matter so later availability can be measured independently of probe death.

It records one row per authored round. Each row therefore includes its real prime duration, wave
timing, equipment availability, reaction history, feed depletion, conduit inventory, room state,
proc cadence, path residence, slowdown, and susceptibility.

Campaign targets are minimum coverage inequalities, not equalities. Useful overkill is valid; only
undercoverage contributes loss:

```text
minimize 1/2 sum_i w_i max(0, 1 - A_i x)^2 + lambda/2 ||x - prior||^2
subject to family-specific lower_j <= x_j <= upper_j
```

Projected gradient descent solves this convex hinge-loss system. The OX-1 lower bound is derived
from `Deckmouth HP * 1.05 / ignition-extent pulse damage`, preserving an individually meaningful
pulse. Asphyxiation, thermal damage, and catastrophic pressure are measured columns with absolute
design guardrails: 72.5 oxygen-deficiency and 30 carbon-dioxide DPS slopes, 7.3 steam and 0.014
environmental heat slopes, and a 36 static-pressure slope. Each guardrail averages its
`absolute target / current coefficient` ratios, making an applied workbook converge to a relative
scale of one on its next run. Chemical columns absorb the required coverage, so the chemical exam
cannot be solved primarily by unrelated environmental damage.

Finally, the proposed coefficients, HP, and speed are compiled into an in-memory definition and the
ordinary intended policy is replayed with normal HP, core damage, matter income, command costs, and
lethal clipping. This live verification is authoritative for pass/fail; the matrices explain the
result and propose coefficients, while exact replay catches proc thresholds, resource feedback, and
discrete breaches.

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

After applying the enemy-level curve, the converged relative coefficient solve is OX-1 `1.000`, Cl₂
`1.000`, HCl `1.000`, liquid corrosion `1.000`, and each secondary family `1.000`. The matrix-derived
corrections are folded into the authored definition. Exact intended-policy replay finishes Flash
Point, Make the Reagent, Stored Chlorine, and Commissioning Exam at 100%, 100%, 58%, and 80% core
integrity respectively.

## Workflow

1. Change mechanics or content at its owning definition.
2. Run `pnpm balance:combat -- --first-order` while iterating on local coefficients.
3. Run `pnpm balance:combat` for the full per-family/per-round transient solve.
4. Review the sensitivity matrix and live verification together.
5. Update authored values from the stable solution, then run `pnpm check` and
   `pnpm campaign:health`.

When a target changes, change the named design constraint in the model. Avoid compensating for one
round with an unexplained health scale or damage constant; the next report must show which matrix row
required the change.
