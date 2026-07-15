# M4 — Producers and the hull fragment: execution steps

Expanded from `WALKING-CASTELLUM-PLAN.md` M4. Reference behavior derives from ADR-0001
(producers make Maps; the sim never composes at runtime), ADR-0004 (one save = one hull
= one run), and the confirmed hardpoint model. Save v13's map serialization already
landed in M3; this milestone adds hull provenance flow, run identity, and the producer
pipeline.

Shape decisions taken from the plan and ADRs (no new user decisions):

- Producer contract: `produce(spec, hull: HullFragment | null) → { map, rounds }` —
  a validated Map plus the site's authored waves. The authored producer wraps a map
  script; scenario construction consumes producer output instead of reading the pack
  map directly. For the shipped tutorial the authored producer returns the pack's map
  with an empty hull, so behavior is byte-identical (determinism snapshot).
- Hull fragment = the player-owned slice of an ENDING state: hull-provenance rooms
  (map data), connections whose endpoints are both hull rooms, and their live state
  (room contents, equipment, temperatures, conduit inventories). Embedding translates
  the fragment's cells by a producer-chosen offset onto the next map and merges rooms,
  connections, and initial state slices.
- Room and connection instance ids persist across sites for hull members (opaque ids,
  ADR-0002); producers must not mint colliding site ids — the shared validator gains
  that check at produce time.
- Run identity on GameState: `run: { seed: string; position: number }`, serialized in
  save v13. The tutorial runs with a fixed seed ("authored"); the seed is consumed
  strictly before a level starts (ADR-0003) — no RNG enters the fixed-timestep step.

1. Hull fragment extraction
   - File(s): `src/game/world/hullFragment.ts` (new), `src/game/world/hullFragment.test.ts`
   - Reference behavior: ADR-0004 — the hull is data extracted from the ending Map and
     state; plan M4 — rooms, contents, connections among them, hardpoint state.
   - Change: `HullFragment` type (rooms, connections, roomStates, gasConduits,
     liquidConduits keyed by instance id, all deep-copied);
     `extractHullFragment(state): HullFragment` selecting `provenance === "hull"`
     rooms and their internal connections/records.
   - Verify: red — module does not exist; green — a state with a hull-tagged room
     yields exactly that room, its equipment/inventory, and only hull-internal lines.

2. Fragment embedding as a map operation [depends on #1]
   - File(s): `src/game/world/hullFragment.ts`, tests
   - Reference behavior: plan M4 — embedding by translation into the next produced
     Map; shared validation applies to the result (ADR-0001).
   - Change: `embedHullFragment(map, fragment, offset): WorldMap` translating every
     cell field (bounds, sockets, platforms, ladders, routes, connectors, endpoints)
     by the offset and appending rooms/connections; loud on id collisions or
     validation failures.
   - Verify: green — an embedded fragment's rooms sit at translated bounds, the
     edited map validates, and geometry derives cleanly.

3. Producer contract and the authored producer [depends on #2]
   - File(s): `src/game/world/producer.ts` (new), `src/game/content/sites/` (site
     scripts move/wrap here as needed), tests
   - Reference behavior: ADR-0001 — interchangeable producers returning the same
     validated Map type; authored maps keep hand-placed routes.
   - Change: `SiteSpec` (map script + rounds + hull anchor offset) and
     `AuthoredProducer.produce(spec, hull)` → `{ map, rounds }`: script map, embed
     hull at the spec's anchor, validate; empty hull returns the script map object
     unchanged (cache identity preserved for the tutorial).
   - Verify: green — producing with a hull yields the embedded map; producing without
     returns the script map identically (same object).

4. Run identity and scenario construction from producer output [depends on #3]
   - File(s): `src/game/gameStateTypes.ts` (`run`), `src/game/engine/scenarioState.ts`,
     `src/game/engine/campaignCommands.ts`/`campaign.ts` (level transitions),
     `src/game/persistence/saveCodec.ts` (schema + round-trip), `src/game/runtime.ts`
   - Reference behavior: plan M4 — scenario construction consumes producer output;
     save v13 round-trips run seed and position; level transitions extract the hull
     from the ending state and hand it to the next site's producer.
   - Change: `run: { seed: string; position: number }` on GameState (tutorial seed
     "authored", position = level index); `createScenarioGame` takes a produced
     `{ map, rounds }` (default: authored producer over the level's spec with the
     previous state's hull); advancing levels extracts + reproduces; save schema
     gains `run`.
   - Verify: red — schema/round-trip tests for `run` fail before; green — determinism
     snapshot byte-identical (tutorial produces the same map object and rounds).

5. Two authored maps in sequence carry the hull (exit proof)
   - File(s): test-only site scripts under `src/game/world/` or `src/game/content/sites/`,
     `src/game/hullCarryover.test.ts` (new)
   - Reference behavior: M4 exit — two consecutive authored maps played in sequence
     carry the hull fragment and all its contents across; saves round-trip mid-level
     and between levels.
   - Change: two small test site specs whose first map marks hull rooms; a test that
     plays/modifies hull state on site A, transitions, and asserts the same rooms,
     equipment, inventories, and internal lines exist translated on site B; plus a
     save round-trip at both points.
   - Verify: red before the transition wiring exists; green after.

6. Phase exit
   - Verify: `make ci` green; determinism snapshot identical; e2e suite green.
