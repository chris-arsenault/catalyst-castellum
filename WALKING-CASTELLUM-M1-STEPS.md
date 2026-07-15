# M1 — Instance-keyed world identity: execution steps

Expanded from `WALKING-CASTELLUM-PLAN.md` M1. Reference behavior derives from the plan's
Context/reuse map and ADR-0002. Exit gate: `make ci` green; determinism snapshot
identical; no world-topology union (`ROOM_IDS`/`TRANSPORT_RUN_IDS`/`ENEMY_ROUTE_IDS`)
remains in `src/game`.

Ordering rationale: `noUncheckedIndexedAccess` is enabled, so flipping
`Record<union, T>` state fields to string-keyed records makes every direct index read
`T | undefined`. Steps therefore (1) lock behavior, (2) introduce asserting instance
accessors, (3) sweep call sites subsystem-by-subsystem while unions still exist (every
step compiles and stays green), (4) flip the types and delete the unions, (5) add
catalogs + validation.

1. Determinism snapshot fixture and test
   - File(s): `src/game/playtest/determinism.test.ts`, fixture
     `src/game/playtest/__fixtures__/intended-run-snapshot.json`
   - Reference behavior: `runPlan(levelId, intendedPlan(levelId))` per level in
     `LEVEL_IDS`, per-round reports (killed, breached, coreDamage, OX-1 kills/damage,
     combustion counts) — the plan's determinism contract.
   - Change: a test that runs every level's intended plan and deep-compares the
     per-round report series against the committed fixture; generate the fixture from
     current behavior in this step.
   - Verify: red — test file and fixture do not exist (fails to resolve); green — test
     passes against the freshly generated fixture before any refactor.

2. Asserting instance accessors
   - File(s): `src/game/world/instances.ts` (new), `src/game/world/instances.test.ts`
   - Reference behavior: a missing instance id is a programming error in a dynamic
     world (ADR-0002); lookups must be loud, not `undefined`.
   - Change: `instance(record, id, kind)` returning `T` or throwing with the id and
     kind; typed wrappers `roomState`, `gasConduitState`, `liquidConduitState`,
     `gasJunctionState`, `liquidJunctionState` over `GameState`; generic over current
     union-keyed records so it lands without type churn.
   - Verify: red — module does not exist; green — unit tests cover hit and loud-miss.

3. Sweep engine indexed access to accessors
   - File(s): `src/game/engine/*.ts` (junctions, gasFlow, liquidFlow, reactions,
     stratification, architecturalFlow, combat, commands, commandPolicy, campaign,
     phases, scenarioState, transport*, routing, equipment, physics, roomState,
     stateValidation as needed)
   - Reference behavior: unchanged semantics; behavior lock is step 1's snapshot.
   - Change: replace direct `state.rooms[id]` / conduit / junction index reads with the
     step-2 accessors; loops that iterate records keep `Object.entries` where they
     already do.
   - Verify: red→green not applicable per file (behavior-preserving refactor named by
     the plan); verification is `pnpm typecheck` + `pnpm vitest run` + step-1 snapshot
     green after the sweep.

4. Sweep UI/presentation/tutorial indexed access to accessors [depends on #2]
   - File(s): `src/components/**`, `src/presentation/**`, `src/tutorial/**`,
     `src/application/**` sites indexing world-keyed records
   - Reference behavior: unchanged rendering/guide semantics.
   - Change: same accessor substitution as step 3.
   - Verify: `pnpm typecheck` + component/tutorial vitest suites green.

5. World catalogs on GameState
   - File(s): `src/game/gameStateTypes.ts`, `src/game/engine/scenarioState.ts`,
     `src/game/persistence/saveCodec.ts` (decode fill), `src/game/simulation.ts`
     exports as needed
   - Reference behavior: plan M1 — state carries the instance id catalogs in canonical
     order; catalogs are pack-derived while topology is pack-static, so they are
     reconstructed on decode rather than serialized (serialization of the mutable Map
     is M4's save v13).
   - Change: `world: { rooms: readonly string[]; connections: readonly string[]; routes:
readonly string[] }` on `GameState`; built from pack `roomOrder` and
     run/route keys at scenario creation; decode paths fill it from the definition after
     parsing; `cloneGame` carries it.
   - Verify: red — new state-shape test (scenario creation yields catalogs matching the
     pack; decode of an encoded save restores identical catalogs) fails to compile;
     green after.

6. Engine and UI iterate catalogs [depends on #5]
   - File(s): `src/game/engine/junctions.ts`, `reactions.ts`, and every
     `definition.roomOrder` / `TRANSPORT_RUN_IDS` loop in `src/game`;
     `src/components/GameMap.tsx`/`gameMap/MapScene.tsx`, `MapLayers.tsx`,
     `PipeBoard.tsx`, `ProcessControls.tsx`, `App.tsx` world loops
   - Reference behavior: identical iteration order — catalogs are initialized from the
     same pack order the loops use today, so the snapshot must not move.
   - Change: loops read `state.world.rooms` / `state.world.connections` (UI:
     `game.world.*`); creation-time loops (`scenarioState`) keep reading the pack.
   - Verify: step-1 snapshot green; `pnpm vitest run` green.

7. Flip world-topology ids to opaque strings and delete the unions [depends on #3, #4, #6]
   - File(s): `src/game/identifiers.ts`, `src/game/types.ts`,
     `src/game/content/rooms.ts`, `src/game/content/transportRuns.ts`,
     `src/game/content/enemies.ts`, `src/game/content/levels/fullPlant.ts`,
     `src/game/definitionTypes.ts`
   - Reference behavior: ADR-0002 — `RoomId`/`TransportRunId`/`EnemyRouteId` become
     `string` aliases; authored content keeps today's literal ids; canonical content
     order lives in content (`ROOM_ORDER` stays authored in `rooms.ts`;
     `fullPlant` derives run lists from `Object.keys(TRANSPORT_RUNS)`).
   - Change: remove `ROOM_IDS`/`TRANSPORT_RUN_IDS`/`ENEMY_ROUTE_IDS`; alias the id
     types to `string`; fix the residual value-imports (tests included).
   - Verify: red — `grep -rn "ROOM_IDS\|TRANSPORT_RUN_IDS\|ENEMY_ROUTE_IDS" src/game`
     non-empty before; green — grep empty, `pnpm typecheck` green.

8. Structural save schemas and catalog validation [depends on #7]
   - File(s): `src/game/persistence/saveCodec.ts`,
     `src/game/persistence/legacySaveMigrations.ts`,
     `src/game/engine/stateValidation.ts`, `src/game/authoring/compiler.ts`
   - Reference behavior: ADR-0002 — records validate structurally; the catalog is the
     exhaustiveness backstop. Legacy v7 migration iterates its own migration-table
     keys. The pack compiler gains the coverage checks the closed unions used to give
     for free: every room has junction definitions; loadout/availability ids resolve;
     room/run record keys equal their catalogs.
   - Change: id key schemas become `z.string().min(1)`; `stateValidation` asserts
     catalog↔record agreement (rooms, junctions, conduits) and availability ⊆ catalog;
     compiler validates junction coverage and record-key identity.
   - Verify: red — new validation tests (a state with a missing room record or an
     unknown catalog id fails validation; a pack missing a room junction fails
     compilation) fail before; green after; save round-trip test still green.

9. Phase exit
   - File(s): none new
   - Reference behavior: plan M1 exit gate.
   - Change: none — verification only.
   - Verify: `make ci` green; step-1 determinism snapshot byte-identical; grep gate
     from step 7 empty; e2e suite green.
