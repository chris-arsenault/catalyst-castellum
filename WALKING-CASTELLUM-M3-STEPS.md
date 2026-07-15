# M3 — Connections as player map edits: execution steps

Expanded from `WALKING-CASTELLUM-PLAN.md` M3. Reference behavior derives from ADR-0005
and the M2 Map contract. The milestone's `[DECISION]` is resolved: **preview then
confirm** — the drag shows the routed path as a ghost with its length-scaled cost and
the build commits on an explicit confirm.

Shape decisions taken from the ADRs and M2 (no new user decisions):

- `build_connection { kind, fromRoomId, toRoomId }` installs the pair's line: if the
  map already carries that connection (authored, or previously dismantled), it is
  installed with its stored route and cost; otherwise the auto-router mints it and the
  map edit appends it. `dismantle_connection { connectionId }` uninstalls but keeps
  the routed connection as map data, so authored aesthetics survive a rebuild and the
  data stays origin-blind (ADR-0005: identical data regardless of origin).
- A map edit replaces the frozen map object and bumps `mapRevision`; world catalogs
  and per-kind conduit records grow with the new instance; the shared validator runs
  on every edited map.
- Endpoint convention mirrors the tap port heights physics already reads: gas
  endpoints at the room's center column at ~0.72 of room height, liquid at ~0.12.
- Player-line parameters and per-cell cost are pack content (`lineSpecs` per kind);
  authored connections keep their authored parameters.
- Because a player-built line diverges `state.map` from the pack map, the save must
  carry the map from this milestone on: save v13 serializes `map` + `mapRevision`
  (pulled forward from M4, which keeps producers/hull only).
- Availability keeps gating by canonical pair id — pair ids are computable without
  authoring, so a round can authorize an unauthored pair.

1. Deterministic orthogonal auto-router
   - File(s): `src/game/world/autoRouter.ts` (new), `src/game/world/autoRouter.test.ts`
   - Reference behavior: ADR-0005 — deterministic output (same map, same request,
     same route); orthogonal adjacency; endpoints inside their rooms; avoids room
     interiors and existing lanes where possible (soft penalties, not hard blocks).
   - Change: `routeConnection(map, kind, fromRoomId, toRoomId): GridCell[] | null` —
     Dijkstra over (cell, direction) with fixed neighbor order and deterministic
     tie-breaking; weights: step 1, turn penalty, heavy penalty for third-room
     interior cells, light penalty for endpoint-room interiors, penalty for cells on
     existing process-line routes; endpoints from the tap-height convention.
   - Verify: red — module does not exist; green — identical calls return identical
     routes; routes validate under `validateWorldMap` when appended; a route between
     two authored rooms avoids a third room's interior when a clear corridor exists.

2. Map-edit helpers and line specs
   - File(s): `src/game/world/mapEdits.ts` (new), `src/game/world/mapEdits.test.ts`,
     `src/game/content/lineSpecs.ts` (new), `src/game/definitionTypes.ts` +
     `src/game/definition.ts` (pack gains `lineSpecs`)
   - Reference behavior: ADR-0001 — the Map is mutable during play through validated
     commands; M2's WeakMap caches key off the map object, so an edit must replace it.
   - Change: `withConnection(map, connection): WorldMap` (frozen copy, appended
     insertion order) and validation glue that surfaces `MapIssue`s; pack `lineSpecs`
     per kind (actuator, actuatorHead, maxFlow, volumePerCell, buildCost as
     base + per-cell); `mintLineConnection(definition, kind, from, to)` combining
     router + specs + canonical id.
   - Verify: red — helpers do not exist; green — an edited map validates, keeps
     authored order prefix, and derives a fresh facility model/catalog set.

3. build_connection / dismantle_connection commands [depends on #1, #2]
   - File(s): `src/game/gameStateTypes.ts`, `src/game/engine/commandPolicy.ts`,
     `src/game/engine/commands.ts`, `src/game/engine/transportCommands.ts`,
     `src/game/engine/campaign.ts` (availability by pair id), state growth in
     `src/game/engine/` (map replacement, catalog + record growth)
   - Reference behavior: today's build/dismantle semantics generalized: build charges
     the connection's cost and installs (enabled off); dismantle refunds 75% and
     requires an empty line; policy rejects unavailable pairs, existing installs, and
     insufficient matter. New: a build of an absent pair mints the connection first.
   - Change: replace `build_transport`/`dismantle_transport` with
     `build_connection { kind, fromRoomId, toRoomId }` /
     `dismantle_connection { connectionId }`; executing a minting build replaces
     `state.map`, bumps `mapRevision`, appends the world catalog, and creates the
     per-kind conduit record (route = stored route).
   - Verify: red — new command shapes fail to compile against dispatch tables before
     wiring; green — unit tests: building an unauthored available pair creates map
     data + conduit state and deducts the length-scaled cost; rebuilding a dismantled
     authored line reuses its authored route; the pair invariant rejects duplicates;
     determinism: same commands ⇒ identical state (snapshot suite still green).

4. Save v13: the map rides in the save [depends on #3]
   - File(s): `src/game/persistence/saveCodec.ts`,
     `src/game/engine/scenarioState.ts` (state version), save tests
   - Reference behavior: plan context — the save serializes the Map once topology is
     player-editable; decode validates the stored map with the shared validator and
     rejects packs whose rooms don't cover it.
   - Change: state/save version 13; zod schema for `WorldMap` (structural; closed
     enums for kinds); encode `map` + `mapRevision`; decode uses the stored map
     (worldCatalogsFor moves to map-derived); v12 saves are below the supported floor
     (pre-release cutoff unchanged).
   - Verify: red — a round-trip test asserting a player-built line survives
     encode/decode fails before; green after; tampered-map saves are rejected.

5. Pipe-mode preview-and-confirm UI [depends on #3]
   - File(s): `src/application/storeTypes.ts` + `src/application/uiSlice.ts`
     (`pipePreview` state), `src/App.tsx` (drag → preview), `src/components/PipeBoard.tsx`
     (preview card: per-kind cost + Build/Cancel), `src/components/gameMap/MapLayers.tsx`
     - `transportGraphics.ts` (ghost route overlay), presentation query for
       `planConnection` (route + cost preview via the same router)
   - Reference behavior: the resolved decision — releasing a drag never builds;
     it opens a preview whose Build dispatches `build_connection` (the command
     re-derives the same deterministic route); Cancel clears. Existing-pair drags
     preview the stored route and authored cost.
   - Change: drag release sets `pipePreview { fromRoomId, toRoomId, options: per-kind
{ route, cost, buildable } }`; ghost lane renders the previewed route; the board
     shows the pair's buildable kinds with costs; localized copy for the preview card.
   - Verify: component tests for the preview model; e2e (step 7) drives the flow.

6. Tutorial and playtest plans on the new commands [depends on #3]
   - File(s): `src/game/content/playtestPlans.ts`, `src/tutorial/*` guide predicates
     and copy keys if they referenced build_transport, `src/game/content/levels/*`
     (availability additions for the any-pair e2e case)
   - Reference behavior: M3 exit — tutorial balance contracts still green; authored
     routes now expressed purely as connection data.
   - Change: plans dispatch `build_connection`; one late flash_point round authorizes
     an unauthored pair id so the any-pair path is reachable in the shipped tutorial.
   - Verify: campaign health green; determinism snapshot green (intended plans avoid
     the new pair, so reports are unchanged).

7. Phase exit
   - File(s): `tests/e2e/pipe-mode.spec.ts` (any-pair build through preview-confirm)
   - Verify: `make ci` green; determinism snapshot identical; e2e covers dragging an
     unauthored pair, seeing the ghost + cost, confirming, and the pipe operating;
     full e2e suite green.
