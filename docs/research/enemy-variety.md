# Enemy variety research

This research defines the behavior principles behind the eight-enemy roster. The roster varies
movement, route use, armor, protection, and conserved emissions in addition to health, speed, and
channel susceptibility.

## Orthogonal behaviors create readable combinations

The [Level Design Book enemy-design
survey](https://book.leveldesignbook.com/process/combat/enemy) emphasizes distinct behavior, a
legible hierarchy, continued relevance, and combinations that create new situations. One enemy type
should pose one visible question on its own; authored cohorts can combine those questions.

Catalyst Castellum keeps progression level separate from behavior. Level changes the numerical
envelope. An archetype's movement, support, armor, or emission rule remains stable and recognizable.

## Support enemies need compatible cohorts

Ubisoft's discussion of [layered battles in Mario + Rabbids Sparks of
Hope](https://news.ubisoft.com/en-gb/article/3NxX4lLLU7pkebcFDaoOen/gdc-2023-how-mario-rabbids-sparks-of-hope-improved-procedural-generation-with-layered-battles)
describes support units appearing in already populated volumes and uses compatibility keywords to
produce useful combinations.

The campaign pairs an Anchor with allies that can consume its protection budget. Wave validation
caps support density and ensures the protected cohort is large enough for target priority to matter.

## Protection reads through visible, finite state

The [Deep Rock Galactic Glyphid
Warden](https://deeprockgalactic.wiki.gg/wiki/Glyphid_Warden) visibly links to nearby allies and
grants bounded protection. This creates a target relationship the player can read.

The Anchor follows the same principle: its field displays charge and links, protects nearby allies,
spends capacity in proportion to prevented damage, and recharges at an authored rate. Direct tower
fire makes source attribution and priority visible.

## Layered defenses need a clear transition

Supergiant's [Hades Nighty Night
update](https://www.supergiantgames.com/blog/hades-the-nighty-night-update-patch-notes/) made armor
loss visually distinct and used bounded modifiers with explicit incompatibilities.
[Plants vs. Zombies' Newspaper
Zombie](https://plantsvszombies.wiki.gg/wiki/Newspaper_Zombie_%28PvZ2%29) provides a clear two-stage
example: a visible layer absorbs damage, then its loss produces a faster, fragile state.

The Splitback carries a visible mineral shell inside its total durability. Crossing the shell
threshold changes silhouette, movement speed, route use, and tower susceptibility without adding a
hidden second reward or health budget.

## Emissions need economy rules

The community-documented [Bloons Regrow
property](https://bloons.fandom.com/wiki/Regrow_Bloon) shows why restored or repeated enemy state must
not create repeatable rewards. Enemy rewards remain tied to the original instance and resolved
level.

The [ATSDR chlorine toxicology
profile](https://www.atsdr.cdc.gov/ToxProfiles/tp172-c5.pdf) and an
[EPA scrubber manual](https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=50000LEJ.TXT) describe chemical
suppression through finite reagents and ordinary reaction products. Emitters therefore carry a
conserved reservoir, add actual species to the occupied room, stop when depleted, and allow the
shared environment solver to determine later tower or process interactions.

## Roster

| Enemy       | Behavior axis            | Player question                                                       |
| ----------- | ------------------------ | --------------------------------------------------------------------- |
| Deckmouth   | Baseline route pressure  | Does this lane have enough ordinary tower coverage?                   |
| Flintjack   | Fast low-health runner   | Can acquisition and cadence catch a short coverage window?            |
| Shear-jelly | Upper-route flight       | Which wall or ceiling towers cover the airborne lane?                 |
| Splitback   | Armored molt             | Which tower breaks the shell, and what catches the faster body?       |
| Redlung     | Slow durable specialist  | Can sustained fire overcome its stable resistance profile?            |
| Clatter     | Fast climbing locomotion | Which placements retain coverage through ladder sections?             |
| Anchor      | Shared finite protection | Can priority fire drain or bypass the field before the cohort passes? |
| Glowbag     | Finite hydrogen emission | How does its atmospheric byproduct change the defended room?          |

## Behavior contracts

### Climbing and flight

Movement classes use the authored route graph. A Clatter applies a locomotion multiplier to climb
edges. A Shear-jelly selects eligible upper or airborne edges. Their preview shows the route before
the assault, allowing surface placement and firing arcs to answer the threat.

### Armored molt

The Splitback starts in an armored phase. Its shell threshold scales with level as part of total
health. Crossing the threshold changes its movement and defense profile and records one visible
transition.

### Shared protection field

The Anchor protects eligible nearby enemies. For post-resistance damage requests `r_e`:

```text
R        = sum_e(r_e)
absorbed = min(fieldCharge, R)
share_e  = absorbed * r_e / R
damage_e = r_e - share_e
```

Absorption is allocated within the same damage transaction, so combat telemetry identifies which
towers spent the field. Recharge is capped and an activation threshold governs recovery.

### Conserved gas emission

The Glowbag carries a finite hydrogen inventory and emits into its occupied atmospheric layer at a
bounded rate:

```text
emitted = min(reservoir, emissionRate * dt, roomHeadroom)
reservoir -= emitted
roomHydrogen += emitted
```

The opening sites may use the Glowbag only as a flying or route threat. Later sites expose the
emission through visible environmental and tower interactions.

## Authoring and telemetry

Enemy definitions own discriminated behavior data. Runtime state mirrors only the active behavior's
finite state. Wave definitions combine type, level, timing, count, and route; the compiler validates
behavior-specific cohorts and route eligibility.

The forecast exposes flight, climbing, armor, support, route preference, and reagent emission before
an assault. Runtime telemetry records route choice, tower targeting, armor transitions, field
absorption by source, reservoir emission, Matter yield, and Core damage.
