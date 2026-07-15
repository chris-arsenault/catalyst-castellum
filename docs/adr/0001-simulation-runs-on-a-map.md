# ADR-0001: The simulation runs on a Map; producers make Maps

Date: 2026-07-15
Status: accepted

## Context

The campaign reused one static facility for every level while replacing player
constructions with authored loadouts, so transitions read as bugs. The engine also
carried a parallel hand-authored node diagram (fixed room list, per-room junction
definitions, a closed catalog of per-pair transport runs with authored blueprints)
that the simulation depended on directly. The target game is a roguelite whose maps
are variously authored, randomized, or both, and whose player fortress (the hull)
persists across sites.

## Decision

The simulation's entire world contract is a single **Map** object:

- A Map is a 2D grid with **rooms** (rectangles with area, environmental properties,
  sockets, and input/output taps) and **connections** (architectural: portals, doors,
  ladders, trapdoors; process: gas/liquid lines) between any two rooms, where each
  connection carries its route geometry and that geometry drives the physics.
- Everything the engine previously read from parallel authored structures — junctions,
  utility nodes, transport-run catalogs — derives from the Map.
- The Map is mutable during play through validated commands: building a pipe is a map
  edit; placing portals, doors, or ladders later is the same kind of edit.

**Map production is a separate pre-level pipeline.** A producer takes inputs (an
authored script, a seed plus chunk vocabulary, or both) plus the player's persistent
hull fragment, and returns a validated Map. Producers are interchangeable:

- **Authored producer** — fixed maps (the tutorial).
- **Random-layout producer** — seeded generation.
- **Hybrid producer** — authored skeleton with randomized layout.

The simulation never composes, generates, or distinguishes hull from site at runtime;
room provenance (player-owned vs. site) is plain data on the Map that the run loop uses
when extracting the hull fragment at level end.

## Alternatives considered

- **Runtime hull/site composition**: the sim understands two world blocks joined at
  dock time. Rejected: it keeps world semantics inside the simulation, makes every
  engine feature aware of the split, and is still a node diagram under the hood.
- **Bespoke static map per level**: nothing persists; authoring cost scales linearly;
  no randomization path.
- **Full persistence on the current single static map**: the map can never change and
  the parallel node diagram survives.

## Consequences

- The engine's world surface shrinks to one contract; producers can be added without
  touching the simulation.
- Hull persistence is a data operation: extract the owned-room fragment (rooms,
  contents, interconnections) from the ending Map; hand it to the next producer.
- The closed transport-run catalog and per-room junction author-data are retired in
  favor of Map-derived structures; player pipe-building stops being limited to
  pre-authored pairs.
- Map validation (invariants, navigability) becomes shared infrastructure run by every
  producer and by every in-play map mutation.
