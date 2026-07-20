# Enemy variety research

Date: 2026-07-17

This research defines the behavior principles behind the shipped eight-enemy roster. The roster
uses movement, phase, finite protection, and conserved reagent state in addition to health, speed,
and channel susceptibility. Every enemy follows the authored route toward the Core; behavior changes
how it occupies and affects the existing rooms.

## Research findings

### Orthogonal behaviors create readable combinations

The [Level Design Book enemy-design survey](https://book.leveldesignbook.com/process/combat/enemy)
emphasizes distinct behavior, a legible hierarchy, continued relevance, and combinations that create
emergent situations. A type works best when it poses one visible question on its own and more complex
questions through authored cohorts.

Castellum applies this by separating progression level from behavior. Level changes the numerical
envelope; an archetype's movement, support, phase, or reagent rule remains stable and recognizable.

### Support enemies need compatible cohorts

Ubisoft's discussion of [layered battles in Mario + Rabbids Sparks of
Hope](https://news.ubisoft.com/en-gb/article/3NxX4lLLU7pkebcFDaoOen/gdc-2023-how-mario-rabbids-sparks-of-hope-improved-procedural-generation-with-layered-battles)
describes support units appearing in already populated volumes and uses compatibility keywords to
produce useful combinations.

Castellum support waves pair an Anchor with allies that can consume its protection budget. The
compiler caps shared-field units per wave and requires enough supported enemies for the field to
matter.

### Protection reads through visible, finite state

The [Deep Rock Galactic Glyphid Warden](https://deeprockgalactic.wiki.gg/wiki/Glyphid_Warden)
visibly links to nearby allies and grants bounded protection. This creates a target relationship the
player can read.

The Anchor follows the same principle at room scale: its field displays charge and links, protects
other same-room enemies, spends capacity in proportion to prevented damage, and recharges at an
authored rate. Ten targets drain ten times the protection requested by one target under the same
room-wide hazard.

### Layered defenses need a clear transition

Supergiant's [Hades Nighty Night update](https://www.supergiantgames.com/blog/hades-the-nighty-night-update-patch-notes/)
made armor loss visually distinct and used bounded modifiers with explicit incompatibilities.
[Plants vs. Zombies' Newspaper Zombie](https://plantsvszombies.wiki.gg/wiki/Newspaper_Zombie_%28PvZ2%29)
is a clear two-stage example: a visible layer absorbs damage, then its loss produces a faster,
fragile state.

The Splitback carries a visible mineral shell inside its total solved durability. Crossing the
shell threshold changes its silhouette, movement speed, and climbing profile; the transition does
not add a hidden second health budget.

### Regeneration and emissions need economy rules

The community-documented [Bloons Regrow
property](https://bloons.fandom.com/wiki/Regrow_Bloon) shows why restored durability must not create
repeatable rewards. Enemy rewards remain tied to the original instance and resolved level,
regardless of behavior-state transitions.

The [ATSDR chlorine toxicology profile](https://www.atsdr.cdc.gov/ToxProfiles/tp172-c5.pdf) and an
[EPA scrubber manual](https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=50000LEJ.TXT) describe chemical
suppression through finite reagents and ordinary reaction products. Castellum emitters therefore
carry a conserved reservoir, add actual species to the occupied room, stop when depleted, and allow
the normal chemistry solver to determine the consequence.

## Design principles

1. Change the player's question, not only a coefficient.
2. Show finite behavior state through armor, field charge, reservoir inventory, phase, and links.
3. Use room-wide damage as an input to shared capacity and cohort behavior.
4. Conserve emitted material and keep one reward budget per enemy instance.
5. Author support combinations and validate their compatibility.
6. Keep level progression separate from tactical behavior.
7. Telegraph state before its consequence through sprites, tooltips, forecasts, and incidents.
8. Preserve the route contract: behavior changes residence or exposure layer while the enemy keeps
   moving through existing topology.

## Shipped roster

| Enemy       | Behavior axis                  | Player question                                                      |
| ----------- | ------------------------------ | -------------------------------------------------------------------- |
| Deckmouth   | Baseline room occupant         | Does this defense provide enough ordinary exposure?                  |
| Flintjack   | Fast low-health runner         | Can the process respond before a short residence ends?               |
| Shear-jelly | Upper-layer flight             | Does the defense reach above pooled liquid and lower gas?            |
| Splitback   | Armored molt                   | Which room breaks the shell, and can the next room catch the runner? |
| Redlung     | Slow durable hazard specialist | Can sustained chemistry overcome its stable counter profile?         |
| Clatter     | Ladder-running locomotion      | Which rooms retain useful dwell time when climbs accelerate?         |
| Anchor      | Shared finite protection       | Can a pulse collapse the field or continuous damage outrun recharge? |
| Glowbag     | Finite hydrogen emission       | Does its hydrogen disrupt the atmosphere or feed HCl/OX-1 chemistry? |

## Implemented mechanics

### Ladder-running locomotion

The Clatter uses the ordinary path and room sequence with an authored multiplier per locomotion
mode. It walks at a measured pace and climbs rapidly, so ladder-heavy rooms contribute less
residence without creating an alternate route.

```text
segment time = segment length /
               (base speed * world scale * mode multiplier * room multiplier)
```

### Armored molt

The Splitback starts in an armored phase. Its shell threshold scales with enemy level as part of
total health. Damage crossing that threshold switches to the exposed phase, applies a speed and
locomotion profile, and records one transition incident.

### Shared protection field

The Anchor protects other live enemies in its current room. For post-susceptibility damage requests
`r_e`:

```text
R        = sum_e(r_e)
absorbed = min(field charge, R)
share_e  = absorbed * r_e / R
damage_e = r_e - share_e
```

Absorption is allocated by source in the same damage transaction, so combat telemetry reports which
process spent the field. Recharge is capped by maximum charge and the activation threshold controls
when the field becomes available again.

### Conserved gas emission

The Glowbag carries six units of hydrogen and emits at a bounded rate into its occupied gas layer
before ordinary room reactions run:

```text
emitted = min(reservoir, emission rate * dt, room gas headroom)
reservoir -= emitted
room gas hydrogen += emitted
```

The charge can supply one OX-1 ignition threshold at the authored `2 H₂ : 1 O₂` ratio. Chlorine,
oxygen, heat, stratification, pressure, and room headroom determine the actual result.

## Authoring and telemetry

Enemy definitions own a discriminated behavior value. Runtime state mirrors only the active
behavior's finite data. Wave definitions combine type, site level, offset, timing, and route; the
compiler validates behavior-specific cohort constraints.

The forecast exposes flying, climbing, armored, field-support, and reagent-emission traits before
the assault. Runtime telemetry records armor transitions, field absorption by source, reservoir
emission, locomotion residence, Matter yield, and Core damage. `pnpm balance:combat` includes these
budgets in first-order role solving and exact transient replay.
