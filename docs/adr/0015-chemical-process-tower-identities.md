# ADR-0015: Tower chassis use chemical process identities

Date: 2026-08-19
Status: accepted

## Context

ADR-0011 made direct towers the primary combat vocabulary. The first implementation gave the seven
roles generic weapon identities with no connection to the vessel's process vocabulary. Those
names and effects made placement easier to read, but separated combat from the vessel's remote
chemical systems and left the retained process simulation adjacent to the tower game.

Traditional tower-defense decisions still need to work before the player manages pipes, atmosphere,
or reaction inventory. A process identity therefore cannot make ordinary firing depend on a
reaction chain.

## Decision

The fixed roster comprises the Flash Chamber, Caustic Jet, Carbon Burner, Acid Pot, Quench Coil,
Wash Head, and Carbonyl Marker.

- Each chassis has a familiar direct tower-defense role and fires at base output in a neutral room.
- Its chemical operation determines its damage channels, control effects, geometry, animation,
  upgrades, and player-facing language.
- Acid and Caustic coatings are useful independently. Combining them on one target consumes both
  and causes one bounded neutralization heat burst.
- Later pipe and atmosphere content connects through named, conserved interfaces such as Carbon
  Burner fuel and Wash Head scrubbing. These interfaces improve or alter a viable direct tower.
- Claim 8-Delta and Harker's Brace teach the direct roster without process management. Twelve-Cask
  introduces the first optional coating reaction. Later sites add process connections one at a time.

## Consequences

The tower catalog reads as purpose-built equipment for this vessel while retaining coverage,
cadence, targeting, route, and economy as the primary decisions. Players can infer each attack from
the selected chassis and see any reaction before it resolves.

Tower identifiers, damage attribution, tutorials, campaign portfolios, visual effects, and upgrade
copy follow the process names. Process-assisted modes require conservation tests and a direct-fire
reference defense, while the first campaign sites remain independent from pipes and atmosphere.
