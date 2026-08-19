# ADR-0011: Direct towers define campaign combat

Date: 2026-08-17
Status: accepted

## Context

The reaction-led defense asked the player to infer combat output from inventories, phase contact,
transport delay, activation conditions, and room-wide hazards before the game supplied a readable
tower-defense decision. Attempts to narrow the reaction catalog through vessel classes, site
palettes, and depth-one hazards reduced the search space without producing a clear primary combat
loop.

The setting, deterministic chemical simulation, vertical vessel, campaign, and enemy roster remain
valuable. They do not require reactions to own basic targeting and damage.

## Decision

Direct towers define the campaign's primary defense vocabulary.

- A tower has an explicit footprint, mounting faces, range, arc, targeting policy, cadence, target
  cap, attack or control effect, cost, and upgrades.
- Towers attack enemies through the central deterministic packet resolver.
- The opening sites teach placement, coverage, targeting, upgrades, route control, and economy with
  self-contained towers.
- Chemistry, pipes, and atmosphere remain simulation systems and later connect through explicit
  tower supply, environmental effects, byproducts, and resource preparation.
- Later process options add viable strategies while established direct-tower defenses remain usable.

This decision supersedes ADR-0007, ADR-0008, and ADR-0009 as campaign-combat policy. Their reaction,
vessel, and family structures may remain implementation assets where they support the retained
process subsystem.

## Consequences

Tower output becomes visible at placement time and attributable during an assault. Enemy count again
creates finite target-service pressure. The combat balance model centers route coverage, cadence,
target selection, and Matter instead of solving a required chemical chain.

The first playable transition can prove one or two sites before pipe supply and atmospheric combat
effects are integrated. Retained chemistry needs explicit interfaces and presentation whenever it
changes tower or enemy behavior.
