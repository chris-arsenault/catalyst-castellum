# M5 — Run loop and grafting: execution steps

Expanded from `WALKING-CASTELLUM-PLAN.md` M5. Both milestone decisions are resolved
(2026-07-15): the module catalog launches with the archetype trio but is an **open data
catalog** (arbitrary types eventually); the run loop is built for the **tutorial only**
as a fixed authored run — main-game shape (fixed vs endless) stays deliberately
uncommitted in the model.

Scope note: the shipped Flash Point tutorial keeps an empty seed hull until M6
re-authors it (the seed-hull composition is a design question for the user at M6).
M5's "graft survives to the following site" exit is proven on authored test content in
the harness, exactly as M4 proved hull carryover.

Shape decisions taken from the plan and ADRs (no new user decisions):

- Room identity data (code, structure, ambient temperature, socket count) moves onto
  `MapRoom` — ADR-0001 says rooms carry their environmental properties as map data,
  and grafted rooms cannot have pack-authored definitions. `definitionRoom` reads the
  map; pack `rooms`/`roomOrder` dissolve into the map script; grafted rooms get
  generic pair-named copy like player-built pipes did.
- `ModuleTemplate` is pack content (`modules: Record<ModuleId, ModuleTemplate>`):
  relative footprint, socket cells, taps, hardpoint layout, joint stub (the
  architectural connection the graft creates), graft cost, and the room identity
  fields the grafted room is born with.
- Hardpoints are data on hull rooms: `{ id, cell, facing }` on `MapRoom`; a hardpoint
  is occupied when a joint connection exists at it. Grafting mints a deterministic
  room id (`module:<hardpointRef>`) so replays are identical.
- `graft_module { hardpointRoomId, hardpointId, moduleId }` and
  `dismantle_module { roomId }` are validated map edits following the M3 pattern
  (new frozen map, revision bump, catalog/record growth, loud validation).
- Run model: `RunOutcome` ("active" | "defeated" | "victorious") on `state.run`;
  defeat ends the run (no retry into the same run per ADR-0004 — the tutorial keeps
  its checkpoint retry until M6 rewires onboarding); victory advances position.
  `travel`/`dock` phases join the phase model between sites. `SiteDefinition`
  (producer spec + waves + salvage) is introduced alongside the tutorial's levels
  being expressed through it; the Level* naming survives in UI copy until M6.

1. Room identity moves onto the Map
   - File(s): `src/game/world/map.ts` (`MapRoom` gains code/structure/
     ambientTemperature/socketCount), `src/game/content/worldMap.ts` (author the
     fields), `src/game/world/instances.ts` (`definitionRoom` reads the map),
     `src/game/definitionTypes.ts` + `src/game/definition.ts` (drop pack
     `rooms`/`roomOrder`), `src/game/content/rooms.ts` (dissolved),
     `src/game/persistence/saveCodec.ts` (map schema), compiler, presentation
     `roomCopy` fallback for unauthored rooms, sweeps of `definition.rooms` /
     `roomOrder` readers.
   - Verify: determinism snapshot identical; a synthetic map room without pack copy
     renders a generic name.
2. Module catalog and hardpoint data
   - File(s): `src/game/world/modules.ts` (types), `src/game/content/modules/`
     (trio), pack `modules`, `MapRoom.hardpoints`, map schema + shared validator
     (hardpoint cells inside bounds), compiler checks.
   - Verify: pack compiles with the trio; validator rejects out-of-bounds hardpoints.
3. graft_module / dismantle_module commands
   - File(s): `src/game/world/graft.ts` (instantiate template at hardpoint →
     MapRoom + joint connection), command types/policy/executors, unit tests.
   - Verify: grafting on test content adds a hull room with working junctions and
     equipment sockets; determinism (same commands ⇒ identical maps); dismantle
     requires an empty room and refunds; occupied hardpoints reject.
4. Run outcome and travel/dock phases
   - File(s): `gameStateTypes` (`run.outcome`, phases), `phaseModel`, campaign
     commands (defeat sets outcome; victory advances), saveCodec, phase copy keys.
   - Verify: defeat marks the run defeated; the tutorial run advances through its
     sites; snapshot green.
5. SiteDefinition and the authored tutorial run
   - File(s): `src/game/definitionTypes.ts` (`SiteDefinition` = producer spec +
     waves + salvage), `src/game/content/sites/`, run script for the tutorial
     (existing levels as sites), scenario/campaign wiring.
   - Verify: campaign-health runs the tutorial run end-to-end; snapshot identical.
6. Graft carryover exit proof + graft-mode UI
   - Harness: authored two-site test run with a seed hull; graft on site 1 survives
     embedded on site 2 with contents.
   - UI: graft mode on the pipe-board pattern (hardpoint markers, module panel,
     snap placement, preview-confirm like pipes).
   - Verify: unit + e2e for the graft flow; `make ci` green; full e2e green.

---

## Execution outcome (2026-07-15)

M5 shipped: room identity on the Map (step 1); the open module catalog with the
archetype trio and hardpoint data + invariants (steps 2-3); graft_module /
dismantle_module map-edit commands with deterministic placement and ids (step 3); run
outcome and travel/dock phases (step 4); the graft-mode UI on the pipe-board
preview-confirm pattern (step 6); and the run-loop carryover proof — a graft grafted on
one site travels, docks, and arrives on the next site with its contents through the real
start_next_level/dock_at_site commands (step 6). The authored producer now strips the
incoming hull's rooms from a site before embedding, so the empty-hull tutorial stays
byte-identical while a real hull docks cleanly.

**Deferred to M6:** the `SiteDefinition`-replaces-`LevelDefinition` rename (step 5) and
the salvage economy. The run loop already works through the authored producer over
LevelDefinitions, and M6 re-authors the tutorial as sites — the natural home for the
rename. The shipped Flash Point tutorial has no seed hull, so grafting is unreachable
there until M6 gives it one (the seed-hull shape is the M6 user decision); the loop and
graft carryover are proven now on a seeded-hull save and in the harness, exactly as M4
proved hull carryover.
