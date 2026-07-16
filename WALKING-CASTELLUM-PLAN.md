# Walking Castellum — Implementation Plan

Make the simulation run on a single Map contract — a 2D grid of rooms and routed
connections — and make Maps through interchangeable pre-level producers (authored,
random-layout, hybrid) that embed the player's persistent hull fragment. The run loop is
travel → dock → defend → annex/graft → travel; one save is one hull is one run. The
tutorial exists to teach the game's mechanics; the main game has no tutorial. Out of
scope: meta progression across runs, new chemistry/enemy content, art passes, and any
compatibility layer for the old map model.

## Confirmed decisions

- The simulation's entire world contract is a Map: rooms (rectangles with area,
  environmental properties, sockets, taps) and connections (portals, doors, ladders,
  gas/liquid lines) between any two rooms, each carrying route geometry that drives the
  physics. The sim neither knows nor cares how a Map was produced (ADR-0001).
- Map production is a pre-level pipeline of interchangeable producers — authored,
  random-layout (seeded chunk assembly), hybrid — all returning the same validated Map
  type; the hull fragment is a producer input, never a runtime composition (ADR-0001,
  ADR-0003).
- Connections are routed map data creatable between arbitrary rooms — authored,
  generated, or player-built through a deterministic orthogonal auto-router; the
  per-pair authored transport-run catalog is retired (ADR-0005).
- Rooms, connections, and portals are opaque instance ids with runtime catalogs;
  species/reactions/equipment/enemies stay closed unions (ADR-0002).
- One save slot = one hull = one run; defeat ends the run; meta progression is backlog
  (ADR-0004).
- Grafting uses **hardpoints**: designated attachment edges on player-owned rooms;
  grafting a module is a map edit that adds a room and its joint connection.
- One model, no legacy path: the Flash Point tutorial is re-authored as a fixed seed
  hull plus authored maps; its guides and balance contracts carry over.
- Vocabulary (types, copy keys, testids): **map**, **room**, **connection**, **hull**,
  **module**, **hardpoint**, **graft**, **site**, **chunk**, **dock**, **run**,
  **producer**.

## Context / reuse map

Source-of-truth files the executor re-derives behavior from:

- `src/game/engine/facilityModel.ts` — pure factory over map data (cells, traversal,
  volumes, liquid surfaces); reused as the Map's derived-geometry layer, re-run when the
  Map mutates.
- `src/game/content/facilityLayout.ts` + `facilityGeometry.ts` + `transportRuns.ts` +
  `networkNodes.ts` — today's authored world, currently spread across four parallel
  structures (room bounds, route blueprints, run catalog, per-room junction/utility
  nodes). All of it becomes data inside one authored Map script; junctions and utility
  taps derive from room properties.
- `src/game/identifiers.ts` — `ROOM_IDS`/`TRANSPORT_RUN_IDS`/`ENEMY_ROUTE_IDS` are the
  closed unions being retired for world topology; the rest stays.
- `src/game/gameStateTypes.ts`, `src/game/engine/scenarioState.ts` — state gains the
  Map (with instance catalogs) and a map-revision counter; records become
  instance-keyed.
- `src/game/persistence/saveCodec.ts` — v13 serializes the Map and run state;
  structural (non-exhaustive) record validation; legacy migrations end at v12 and old
  saves are rejected by the existing pack gate (pre-release).
- `src/game/authoring/compiler.ts` — the route/identity validators generalize into the
  shared map-validation module used by producers and in-play map edits.
- `src/game/engine/` (navigation, junctions, gasFlow, liquidFlow, architecturalFlow,
  stratification, combat) — reuse as-is in spirit: they already consume facility
  geometry + state records generically; retune their lookups to Map-derived structures
  and catalog iteration.
- `src/game/playtest/` + `tooling/playtest.ts` — harness pattern reused; plans run
  against produced maps + hull checkpoints; campaign-health becomes run-health over a
  seed corpus.
- `src/components/gameMap/` — renders rooms/connections from definitions + state;
  retuned to read the runtime Map (today `mapGeometry.ts` sizes the world from a module
  constant at import time).
- Pipe board / drag-to-build UX (`PipeBoard.tsx`, room-drag in `GameMap.tsx`) — the
  interaction pattern that generalizes to any-pair pipe building and grafting.
- Guides (`src/tutorial/flashPoint*.ts`) — step/task/gate machinery reused; predicates
  re-pointed at Map instance state during tutorial re-authoring.

Built new: `src/game/world/` (Map type, map validation, auto-router, producers, hull
fragment extraction), `src/game/content/modules/` (room-module templates),
`src/game/content/sites/` (authored maps and chunks), seeded run RNG, run-loop phases
(travel/dock/undock), graft and pipe map-edit commands, producer-driven scenario
construction.

## Cross-cutting constraints

- Simulation stays free of React/Pixi/browser (`pnpm architecture:check` enforces); all
  world/producer code lives in `src/game/`.
- The fixed-timestep sim step remains RNG-free and fully serializable; producers and
  offer draws consume the run seed strictly before a level starts (ADR-0003).
- Determinism contract: same seed + same commands ⇒ identical state, including instance
  ids and auto-routed paths (ADR-0002, ADR-0005) — this keeps replays and the balance
  harness meaningful.
- Map invariants are origin-blind: one gas and one liquid line per room pair,
  orthogonal routes with in-room endpoints, elevation-true geometry, breach-to-hull
  navigability — enforced by the shared validator on producer output and on every
  in-play map edit.
- `make ci` is the exit gate of every phase; the balance/playtest harness must be green
  (updated, never deleted) at each gate.
- No interim scaffolding that a later phase deletes: each phase's output is destination
  code.

## Milestones

### M1 — Instance-keyed world identity

Retire closed world unions; the engine iterates catalogs.

- `RoomId`/`TransportRunId`/route ids become opaque strings; `GameState` carries world
  catalogs (room, connection, portal instances with their definition data).
- Engine/UI loops iterate catalogs in canonical (sorted) order; `Record<RoomId, …>`
  state fields become instance-keyed records validated against the catalogs;
  `stateValidation` checks catalog/record agreement.
- Content keeps today's ids as plain strings; the tutorial pack compiles unchanged.
- Determinism snapshot: capture intended-plan playtest results (kills, breaches, core,
  flash counts per round) before the refactor; assert identical after.
- Exit: `make ci` green; determinism snapshot identical; no world-topology union
  remains in `src/game`.

### M2 — The Map contract [depends on M1]

The simulation consumes one Map object; parallel authored structures collapse into it.

- `src/game/world/`: the Map type (rooms with properties/sockets/taps, connections with
  kind + route geometry + actuator data, provenance tags), the shared map-validation
  module (generalized from the pack compiler's route/identity checks), and Map-derived
  geometry via `createFacilityModel` behind a map-revision counter on `GameState`.
- Junctions, utility nodes, and the transport-run catalog derive from the Map: room
  taps replace `networkNodes.ts` authoring; connection instances replace
  `TRANSPORT_RUNS`; enemy routing reads Map connections.
- Re-express the current world as one authored Map script (rooms, portals, lines,
  taps) producing today's exact geometry; delete the four parallel content structures.
- UI reads map dimensions and all geometry from the runtime Map; no module-constant map
  imports remain in `src/components`.
- Exit: `make ci` green; game plays byte-identically through the Map (determinism
  snapshot); map renders from the runtime Map.

### M3 — Connections as player map edits [depends on M2]

Pipes between any two rooms; routes are computed, validated data.

- Deterministic orthogonal auto-router over the grid (avoids room interiors and
  existing lanes where possible; stable output for identical requests).
- `build_connection`/`dismantle_connection` map-edit commands replace
  `build_transport`/`dismantle_transport`; validation enforces the room-pair invariant
  and route legality; costs scale with routed length.
- Pipe mode generalizes: drag between **any** two rooms routes a line; the board lists
  built connections regardless of origin.
- **[DECISION]** Route presentation: accept pure auto-routing for v1 (drawn/waypoint
  routing stays in the backlog), or require a route-preview-and-confirm step before the
  build commits.
- Exit: `make ci` green; tutorial balance contracts still green with authored routes
  now expressed as connection data; e2e covers an any-pair player-built line.

### M4 — Producers and the hull fragment [depends on M2]

Maps come from a pre-level pipeline; the hull persists as data.

- Producer contract: `(inputs: hull fragment, spec) → validated Map + waves`; the
  **authored producer** runs map scripts (the tutorial's maps); scenario construction
  consumes producer output instead of the static pack map.
- Hull fragment: extraction of player-owned rooms, their contents, connections among
  them, and hardpoint state from an ending Map; embedding by translation into the next
  produced Map.
- Save v13: Map, catalogs, hull provenance, run seed, and run position serialize and
  round-trip.
- Exit: `make ci` green; two consecutive authored maps played in sequence carry the
  hull fragment and all its contents across; save round-trips mid-level and
  between levels.

### M5 — Run loop and grafting [depends on M3, M4]

Travel → dock → defend → annex/graft → travel; a save is one run.

- Run state (seed, site index, outcome) and `travel`/`dock` phases join the phase
  model; `SiteDefinition` (producer spec + waves + salvage rewards) replaces
  `LevelDefinition`; defeat ends the run, victory advances to the next site.
- Module templates in `src/game/content/modules/` (footprint, sockets, junction spec,
  joint stubs, graft cost); hardpoints on player-owned rooms; `graft_module` /
  `dismantle_module` map-edit commands; graft-mode UI on the pipe-board pattern
  (hardpoint markers, module catalog panel, snap placement).
- Annexing converts cleared site structures into salvage and module offers; the
  tutorial is expressed as a fixed authored run script.
- Harness retune: site plans run against hull checkpoints; campaign-health asserts the
  tutorial run end-to-end.
- **[DECISION]** v1 module catalog: sizes, socket counts, and costs of the launch
  room modules.
- **[DECISION]** Run shape v1: tutorial run length beyond the Flash Point sites, and
  fixed-length vs endless main-game runs.
- Exit: `make ci` green; the full loop is playable through the authored tutorial run,
  including at least one graft that survives to the following site.

### M6 — Tutorial re-authored on the new model [depends on M5]

Flash Point teaches the same mechanics as producer-made maps against the seed hull.

- The five rounds re-expressed as authored sites; the second-chamber choice becomes a
  real route/graft decision; guides, anchors, copy, and gates migrate to Map instance
  predicates.
- Balance contracts re-verified: bare chamber dies in round 3, intended play clears at
  full core, chamber placement choices stay differentiated.
- Exit: `make ci` green; full e2e tutorial suite green; balance contract tests green.

### M7 — Random-layout and hybrid producers [depends on M5]

The main game: randomized maps, no tutorial.

- Chunk vocabulary v1 in `src/game/content/sites/`; the seeded random-layout producer
  assembles chunks + hull fragment into validated Maps with parametric waves and
  feedstock taps; the hybrid producer constrains draws with an authored skeleton.
- Main-game entry: a new run with a random seed skips the tutorial script and draws
  generated sites of rising tier; guides never engage.
- Run-health over a fixed seed corpus in CI: every corpus seed produces valid maps and
  the intended-policy hull survives the early tiers.
- **[DECISION]** Chunk vocabulary v1: site archetypes and feedstock spread of the
  first generation set.
- Exit: `make ci` green including seed-corpus run-health; a complete randomized run is
  playable start to defeat/victory.

### Decisions needing your input

| Where | Decision you own                                                                                                                          |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| M3    | DECIDED (2026-07-15): preview-and-confirm — drag shows the ghost route with its length-scaled cost; the build commits on explicit confirm |
| M5    | v1 module catalog: sizes, socket counts, costs of launch room modules                                                                     |
| M5    | Run shape v1: tutorial run length; fixed-length vs endless main-game runs                                                                 |
| M7    | Chunk vocabulary v1: site archetypes and feedstock spread for the first generator                                                         |

**M6 decisions (2026-07-15):** seed hull = Core + R-02 furnace (furnace carries one
hardpoint); everything else is site structure left at each dock. Tutorial keeps its
tuned 5-round flow but round 3 becomes a real graft: the player grafts a second chamber
onto the furnace hardpoint and arms it (bare single chamber still dies in round 3).

This plan is the single source of truth for the walking-castellum work. Execute a phase
by running `plan-phase` on it to expand milestone items into steps.
