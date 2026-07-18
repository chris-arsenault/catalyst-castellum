# Enemy variety research

Date: 2026-07-17

Status: research and recommended direction; no mechanics in this note are implemented yet.

## Scope and constraints

The enemy roster should become more interesting than different health, resistance, and base speed.
New enemies may alter room chemistry, protect cohorts, change phase, regenerate finite defenses, fly
above liquid, or traverse existing ladders differently.

This pass excludes:

- damage to player-placed equipment, conduits, or rooms;
- creation, destruction, or selection of alternate routes;
- teleportation, burrowing shortcuts, door sabotage, and forced rerouting;
- camouflage or detection checks that do not interact with the chemical simulation.

Every enemy continues toward the same core through the authored topology. Flight may change liquid
contact and gas layer, and locomotion traits may change time spent walking, climbing, falling, or
passing doors.

## External findings

### Build a roster from orthogonal behaviors

The [Level Design Book's enemy-design
survey](https://book.leveldesignbook.com/process/combat/enemy) summarizes useful roster properties:
types should feel different, retain a clear hierarchy, remain relevant, combine into emergent
situations, and stay predictable enough for players to learn. Its examples of orthogonal unit
differentiation emphasize behavior and combat rhythm rather than a ladder of larger health values.

Application: each new Catalyst Castellum enemy should introduce one visible rule and one new player
question. Its combinations with other enemies may be complex, but the unit itself should remain
legible.

### Support enemies need compatible cohorts

Ubisoft's GDC summary for [Mario + Rabbids Sparks of Hope's layered battle
system](https://news.ubisoft.com/en-gb/article/3NxX4lLLU7pkebcFDaoOen/gdc-2023-how-mario-rabbids-sparks-of-hope-improved-procedural-generation-with-layered-battles)
explains that support enemies spawn in already-populated volumes, while some lone archetypes may
spawn alone. Enemy lists and strategy keywords are used to encourage specific synergies.

Application: support enemies should consume a behavior budget, require a compatible cohort, and have
authoring caps. Randomly adding a protector to an incompatible or empty wave creates nominal variety
without a tactical effect.

### Protection creates a priority relationship when it is visible and bounded

The [official Deep Rock Galactic Wiki's Glyphid Warden
documentation](https://deeprockgalactic.wiki.gg/wiki/Glyphid_Warden) describes a non-attacking
support enemy that visibly links to a limited number of nearby allies and grants regeneration and
damage reduction. The links and shield indicators communicate why the group is harder to kill.

Application: a Catalyst protector needs visible links, a displayed capacity, an explicit room scope,
and a deterministic end condition. A hidden global resistance aura would only reproduce the current
resistance problem.

### Layered defenses need a clear transition

Supergiant changed Hades' health presentation so depleted armor is visually distinct from depleted
life, and its Benefits Package includes bounded modifiers such as extra armor, temporary nearby
protection, speed, cloning, and emitted hazards. The patch notes also record incompatible perks being
banned from some enemy types. See the official [Nighty Night Update patch
notes](https://www.supergiantgames.com/blog/hades-the-nighty-night-update-patch-notes/).

The community-documented [Plants vs. Zombies Newspaper
Zombie](https://plantsvszombies.wiki.gg/wiki/Newspaper_Zombie_%28PvZ2%29) provides a particularly
clear two-stage pattern: a visible object absorbs damage, then its destruction produces a faster,
more fragile and aggressive state.

Application: armor should be a separate visible resource and its removal should change behavior.
Adding an invisible second health bar is insufficient.

### Regeneration needs an economy rule

Community documentation for [Bloons' Regrow
property](https://bloons.fandom.com/wiki/Regrow_Bloon) shows how recovery can change the timing test:
layers return if damage is not completed quickly. It also records an important economy correction:
regenerated layers stopped awarding additional cash, preventing a recovery loop from becoming a
resource farm.

Application: regenerated armor, shields, or health never creates additional matter. Rewards remain
tied to the original enemy instance and resolved level.

### Reagent effects should use finite material and real reactions

The ATSDR [Toxicological Profile for
Chlorine](https://www.atsdr.cdc.gov/ToxProfiles/tp172-c5.pdf) describes chlorine neutralization with
finite reducing or alkaline solutions including thiosulfate, bisulfite, ferrous salts, and sodium
hydroxide. An [EPA scrubber
manual](https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=50000LEJ.TXT) describes water absorption followed
by sodium-hydroxide or sodium-carbonate neutralization of acid gases, with salts accumulating in the
scrubber liquor.

Application: an emitting enemy owns a finite reservoir, emits at a measurable rate, changes room
inventory, and produces ordinary reaction products. It does not apply an unexplained “chemical
suppression” status.

## Design principles for this game

1. **Change the question, not only the coefficient.** “Can this room sustain exposure?”, “when does
   the shell break?”, and “which reaction consumes the emitted material?” are new questions. “Use
   25% more damage” is not.
2. **Use visible, finite state.** Armor, field charge, reagent inventory, and regeneration delay are
   inspectable resources with clear depletion and transition events.
3. **Make room-wide damage part of the mechanic.** Shared capacity and common reagent inventories can
   make cohort size matter even though every occupant is hit.
4. **Preserve conservation.** Emitters carry their material at spawn and deplete it. Reactions retain
   stoichiometry. Recovery cannot manufacture matter rewards.
5. **Prefer authored combinations.** A support unit appears with something worth supporting. Behavior
   compatibility and per-wave caps are compiler-validated.
6. **Keep level and behavior separate.** Level scales the numerical envelope. Behavior defines the
   tactical rule. Higher level does not silently add new abilities.
7. **Telegraph before consequence.** The map, tooltip, and combat log show field links, reservoir
   contents, armor state, phase, and locomotion trait.

## Candidate mechanics

### 1. Anchor

Role: cohort support and direct answer to unlimited room-wide damage.

Behavior:

- The Anchor protects other enemies in its current room but does not protect itself.
- The field has a visible shared capacity and recharge rate.
- All prevented damage drains that one capacity. Ten protected targets consume it ten times as fast
  as one target receiving the same room exposure.
- OX-1 can overload the field with a pulse; continuous chemistry tests whether incoming damage
  exceeds recharge.
- The field drops at zero charge and resumes only after reaching a visible activation threshold. It
  ends permanently when the Anchor is neutralized. Multiple fields do not stack in the first
  implementation.

For requested post-susceptibility damage `r_e` across protected enemies:

```text
R        = sum_e(r_e)
absorbed = min(fieldCharge, R)
share_e  = absorbed * r_e / R
damage_e = r_e - share_e
```

This proportional transaction is deterministic and makes cohort size materially affect capacity.
Recharge is applied before the next damage transaction and capped by maximum charge.

Player question: concentrate a pulse to collapse the field, or maintain enough continuous damage to
outrun recharge?

Implementation cost: medium-high. Damage must be resolved as a room cohort rather than one enemy at
a time, and telemetry must attribute absorbed damage by source and channel.

### 2. Armored Molt

Role: visible two-stage pressure change.

Behavior:

- Stage one has a separate ablative shell, low walking speed, and ordinary ground/liquid contact.
- Breaking the shell exposes low remaining life and switches to a fast state.
- The fast state may also receive a strong climbing multiplier, making the room of transition matter.
- Total shell plus life is budgeted against a level-derived durability target; the shell is not free
  HP added after balancing.

The shell allocation is solved from an intended transition exposure rather than chosen as a
percentage:

```text
shellCapacity = referenceDamageRate * targetSecondsBeforeTransition
lifeCapacity  = targetTotalDurability - shellCapacity
```

The transient pass then verifies which room and time actually produce the transition under the
intended policy.

Player question: break the shell early for chemical access but release a runner, or arrange for the
transition inside a prepared downstream room?

Implementation cost: medium. It needs a discriminated runtime phase, separate bars, an event, and a
movement-profile switch.

### 3. Glowbag

Role: finite reagent emitter that transforms the room's chemistry.

Behavior:

- Carries a finite hydrogen inventory at spawn.
- Emits hydrogen into its occupied gas zone at an authored maximum rate before room reactions run.
- Warm chlorine rooms can convert the emission and chlorine into HCl.
- Oxygen-rich rooms can turn the same reservoir into OX-1 fuel.
- Emission stops when the reservoir is empty or the enemy is neutralized.

```text
emitted = min(reservoir, emissionRate * dt, roomGasHeadroom)
reservoir -= emitted
roomGas.hydrogen += emitted
```

This can weaken a chlorine-only plan while creating a deliberate ignition opportunity. It adds no
new species and exercises existing stoichiometry.

Player question: keep chlorine as the finishing hazard, heat the room to convert it into HCl, or add
oxygen and exploit the enemy's own hydrogen as an OX-1 charge?

Implementation cost: medium-high. Enemy emissions need a simulation stage between spawning and room
reactions, plus reservoir persistence and material telemetry.

### 4. Caustic Carrier

Role: liquid reagent emitter with double-edged interactions.

Behavior:

- Drips a finite sodium-hydroxide solution into the occupied room's lower liquid pool.
- Added NaOH can neutralize hydrochloric acid or react with chlorine toward hypochlorite.
- Remaining NaOH is itself corrosive, so capturing the reagent can strengthen a liquid defense after
  it has disrupted an acid plan.
- Flying enemies receive no direct floor-liquid benefit from the carrier.

Player question: prevent dilution of the acid chain, or deliberately convert the carrier's load into
a different corrosive weapon?

Implementation cost: medium-high. The existing NaOH and reactions can be reused, but emission,
headroom, and reaction-order effects require solver coverage.

### 5. Reconstituting Carapace

Role: continuity check across rooms.

Behavior:

- Owns a visible carapace pool separate from life.
- Carapace begins rebuilding only after a clear no-damage delay or upon entering a new room.
- Recovery stops immediately on damage and never exceeds the original capacity.
- Rebuilt carapace grants no additional matter, residue, or kill credit.

Player question: maintain a continuous chemical chain across rooms, or accept that gaps restore some
of the work?

Implementation cost: medium. The difficult part is communicating recovery and ensuring slow hazards
do not create ambiguous start/stop flicker.

### 6. Clatter

Role: route-residence specialist without changing the route.

Behavior:

- Uses the ordinary path and room sequence.
- Walks at a moderate or slow rate but climbs much faster than other ground enemies.
- Retains normal door, fall, liquid, and pressure rules.

The movement solve becomes archetype-specific by locomotion mode:

```text
segmentTime = segmentLength /
              (baseSpeed * worldScale * archetypeModeMultiplier * roomMultiplier)
```

Player question: which rooms still provide meaningful exposure when ladder segments cease to be a
large part of this enemy's dwell time?

Implementation cost: low. Replace the single global locomotion table with an authored per-archetype
profile and rerun route/residence solves.

### 7. Buoyant Shedder

Role: phase change that switches gas layer and liquid contact.

Behavior:

- Begins as a slow grounded enemy with an inflated or weighted shell.
- Shell depletion releases a buoyant second stage that continues along the same authored cell path,
  samples the upper gas layer, and passes above liquid.
- The route and cell itinerary remain unchanged; only locomotion and effective exposure layer
  change.

Player question: break the shell in a lower-gas/liquid room, knowing the remaining stage moves into
upper gas, or preserve the grounded stage until a later counter is ready?

Implementation cost: medium. It needs a flight-state elevation offset, upper-zone sampling, and
deterministic save/replay behavior, but it does not need repathing.

### 8. Steamlung

Role: finite environmental modifier using an existing species.

Behavior:

- Emits a finite steam reservoir into its current zone.
- Steam changes gas inventory, heat exposure, pressure, buoyancy, and later condensation into water.
- The enemy itself can have an archetype identity suited to steam, but the emission is ordinary room
  material and affects every occupant.

Player question: vent or cool the steam to preserve the planned gas mixture, or exploit its heat,
pressure, and condensate?

Implementation cost: medium-high. It reuses existing material and phase-change rules but needs careful
headroom handling and transient verification.

## Recommended first set

| Priority | Mechanic     | Reason                                                                                             |
| -------: | ------------ | -------------------------------------------------------------------------------------------------- |
|        1 | Clatter      | Establishes per-archetype locomotion with low systemic risk and makes geometry matter immediately. |
|        2 | Armored Molt | Establishes visible phase state, separate armor, and behavior transitions.                         |
|        3 | Anchor       | Makes cohort size load a finite common defense and adds meaningful enemy synergy.                  |
|        4 | Glowbag      | Establishes conserved enemy emissions through the existing reaction system.                        |

These four create independent axes: locomotion, phase, group support, and chemistry. Once those
foundations exist, Reconstituting Carapace, Caustic Carrier, Buoyant Shedder, and Steamlung can
reuse them rather than adding one-off code paths.

## Parameter derivation

Behavior parameters belong in the same first-order/second-order workflow as damage and health:

- locomotion multipliers are solved from a target route and per-mode residence profile;
- shell capacity is solved from the intended reference exposure before transition;
- field capacity is solved from the intended absorbed pulse, while recharge is solved from the
  continuous-DPS threshold that should keep the field suppressed;
- reagent reservoir and emission rate are solved from the target emitted amount or reaction extent
  during the enemy's expected room residence;
- regeneration delay and rate are solved from the intended uninterrupted-exposure requirement.

The first-order system establishes interpretable units and targets. The second-order engine replay
validates actual priming, chemistry, group overlap, transition timing, and breach outcomes. Round-
specific constants are not used to rescue failed encounters.

## Authoring model

Enemy definitions should own a discriminated behavior value rather than a growing collection of
optional fields. A future shape could distinguish `standard`, `locomotion_specialist`,
`armored_molt`, `shared_field`, and `reagent_emitter`. Runtime state should mirror only the active
behavior's state: armor, phase, field charge, or reservoir inventory.

Wave authoring should gain behavior constraints in addition to enemy level:

- maximum support units per cohort and room;
- required supported-enemy count for an Anchor;
- incompatible behavior pairs;
- behavior threat cost;
- explicit permission for phase or emission tutorial waves.

Level remains the source of health progression. Behavior threat is measured separately:

```text
effective threat = level durability
                 + expected field absorption
                 + expected regenerated durability
                 + emission-induced lost player damage
                 + movement-induced exposure loss
```

The second-order simulator should estimate these terms from real room residence and chemistry rather
than assigning permanent hand-tuned multipliers.

## Simulation and telemetry implications

The current step order runs networks, equipment, stratification, spawning, reactions, enemy damage,
and movement. Enemy behavior needs explicit stages:

1. Spawn and initialize finite behavior state.
2. Emit enemy-held material and recharge eligible fields.
3. Run ordinary room reactions and phase changes.
4. Build room cohorts and allocate shared protection.
5. Apply damage, then resolve armor/phase transitions.
6. Move with the active locomotion profile.

The workbook and combat log should record:

- field damage absorbed by source and channel;
- protected ally-seconds and peak protected cohort size;
- armor removed, rebuilt, and transition room/time;
- reagent emitted, remaining, reacted, and vented;
- residence by locomotion mode and active phase;
- core damage and matter outcome by behavior type.

Without this telemetry, behavior tuning will drift back toward guesswork.

## Ideas intentionally parked

- **Flat resistance aura:** does not make room-wide target count matter; shared capacity is better.
- **Permanent invulnerability:** obscures damage feedback and creates binary checks.
- **Random modifiers on every enemy:** weakens silhouettes and encounter readability. Use authored,
  compatible combinations first.
- **Enemy attacks on equipment or conduits:** outside the current constraint and would require repair
  economy, target selection, and failure-state design.
- **Route creation, teleportation, and forced rerouting:** outside the current constraint and would
  undermine the route/residence solver.
- **Camouflage and detection:** introduces a parallel targeting system that does not engage room
  chemistry.
- **Reward from regenerated layers or spawned copies:** creates farming loops; one original enemy
  instance owns one reward budget.
