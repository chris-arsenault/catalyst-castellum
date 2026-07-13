# Architectural Review — Catalyst Castellum

Date: 2026-07-13 · Scope: full `src/`, `tests/`, `tooling/` at commit `465d647` · Focus: extensibility, UI/engine separation, clean code, DRY, SOLID. This report identifies problems; it deliberately does not apply fixes.

## Verdict

The core architecture is sound and better-disciplined than most MVPs: a pure, deterministic
simulation behind a typed command boundary, versioned Zod-validated saves with conserving
migrations, and genuinely good engine test coverage (conservation tests, save-migration tests,
navigation legality enforced inside the save schema). The UI never mutates game state and almost
never imports engine internals.

The risks are concentrated in three structural patterns, all of which get more expensive with
every feature added:

1. **The declarative content model is decorative.** Reactions, equipment effects, and hazards are
   hand-coded in the engine; the data definitions only drive display.
2. **The gas/liquid phase pair is implemented twice** — a parallel-code twin that spans transport,
   junctions, inventories, commands, cloning, and save schemas.
3. **State identity is maintained by hand** — `cloneGame`, the Zod schemas, and the ID unions each
   re-enumerate the state shape, so every new field or species is a multi-file shotgun edit with
   silent-failure modes.

None of these block the MVP. All three determine how much each post-MVP feature costs.

---

## What the base gets right

- **Simulation purity is real.** No React, Pixi, or browser APIs anywhere in `src/game/engine` or
  `src/game/content`. `save.ts` guards `typeof window`. Fixed timestep with an accumulator
  (`hooks.ts`, `engine/step.ts:46`), speed cap, serializable state throughout.
- **Single command boundary.** All mutations flow through `executeCommand`
  (`engine/commands.ts:298`) with an exhaustive discriminated union, uniform accept/reject
  results, and validation messages shared by UI and headless callers.
- **Facade discipline.** `simulation.ts` is a curated export surface; UI components import from it
  (or `config.ts`) rather than reaching into `engine/*`. The only engine-internal imports outside
  the game layer are a test and `testing/e2eMode.ts` (flagged below).
- **Render models extracted and unit-tested.** `roomRenderModel.ts`, `enemyRenderModel.ts`,
  `incidentModel.ts` keep Pixi drawing code thin and testable — the right pattern.
- **Save layer takes correctness seriously.** Versioned envelopes, `superRefine` navigation
  validation, conserving v7 merge that refuses to delete inventory, debounced writes that swallow
  storage failures.
- **Bounded state growth.** Events capped at 48, incidents at 64 (`engine/events.ts:52,62`).
- **CI contract exists** (`make ci`: lint, format, typecheck, tests with coverage) and content
  self-validation exists (`validateReactionCatalog` checks elemental balance).

---

## Findings

### F1 — The engine bypasses its own content model (High · extensibility)

`ReactionDefinition` carries full stoichiometry (`content/chemistry.ts:20`), but
`engine/reactions.ts` never reads it. Every reaction is a bespoke function with coefficients
inlined by hand — e.g. `gas.hydrogen_chloride += reacted * 2` (`reactions.ts:167`),
`room.liquid.sodium_hydroxide -= reacted * 2` (`reactions.ts:244`). The two representations are
linked only by developer discipline: `validateReactionCatalog` proves the *definitions* balance,
not that the engine implements them. A coefficient typo in `reactions.ts` would violate
conservation while the catalog validator stays green and the UI displays the correct equation.

The same pattern repeats for equipment and hazards:

- **Equipment behavior is engine-hardcoded per ID.** `engine/equipment.ts` special-cases
  `"gas_agitator"`, `"wet_contactor"`, `"thermal_coil"`, `"membrane_cell"` with private constant
  tables (`GAS_REACTION_MULTIPLIERS`, `HEATER_TARGETS`, `MEMBRANE_RATES`). Worse, the player-facing
  numbers are duplicated as prose in `content/equipment.ts` `grades[].effect` strings
  ("1.5× gas kinetics" vs `GAS_REACTION_MULTIPLIERS[1] = 1.5`). Rebalance the engine constant and
  the store copy silently lies.
- **Hazards hardcode species in the engine.** `physics.ts:188-214` names `chlorine`,
  `hydrogen_chloride`, `sodium_hydroxide`, etc. with ~20 inline coefficients.
  `SpeciesDefinition` has `molarMass`/`referenceDensity`/`elements` but no toxicity, corrosivity,
  or heat-hazard fields — so a new gas species requires editing engine physics, not adding data.
- **Electrolysis is a hardcoded singleton.** `simulateElectrolysis` reaches directly for
  `state.processes.chlor_alkali_cell`, `gasBuffers.anode_header`, etc. `ProcessDefinition` exists
  but drives nothing; a second process means another bespoke engine function.

**Cost of adding one reaction today:** touch `types.ts` (two ID arrays), `content/chemistry.ts`,
a new hand-written function in `reactions.ts` plus wiring in `simulateRoomChemistry`, and the room
telemetry record — with no compiler check that the engine matches the declared equation.

### F2 — The gas/liquid twin: one architecture, implemented twice (High · DRY)

`engine/gasFlow.ts` (248 lines) and `engine/liquidFlow.ts` (205 lines) are structurally identical:
same `Plan` struct, same `initialPlan` priming logic (identical comment intent), same proportional
allocation (`proportionallyAllocate` vs `allocateByRoom` — the same function under two names),
same `reconcileIncomingCapacity`, `applyPlan`, `clearReadout`, `updateReadout`,
`isBlockedAfterPlan`, and `rate` helpers. The genuine physics differences (buoyancy+pressure drive
vs head/lift drive; temperature tracking; vent vs drain sink) are ~30 lines out of ~450.

The twin pattern pervades the codebase:

- Inventory math: `takeGas`/`takeLiquid`, `addGas`/`addLiquid` (`roomState.ts:262-292`),
  `packetFromGas`/`packetFromLiquid`, `subtractGas`/`subtractLiquid` (`architecturalFlow.ts`),
  `gasAmountTotal`/`liquidAmountTotal`.
- State: `GasSourceState`/`LiquidSourceState`, `GasBufferState`/`LiquidBufferState`,
  `GasJunctionState`/`LiquidJunctionState`, `GasConduitState`/`LiquidConduitState`.
- Commands: `gasCharge`/`liquidCharge` (`commands.ts:215-269`) are near-clones.
- Cloning: `cloneMaterialState`, `cloneNetworkState` handle each phase separately.
- Save: `gasSchema`/`liquidSchema`, `GAS_LINE_MIGRATION`/`LIQUID_LINE_MIGRATION`, and `save.ts`
  even re-implements `addGas`/`addLiquid`/`gasTotal` locally (`save.ts:512-521`) — a third copy.

Every transport-behavior change (the priming rule, blocked detection, allocation fairness) must be
made twice and can drift silently — the twins have already drifted cosmetically (function names,
`FULL_FLOW_DRIVE` vs `FULL_FLOW_HEAD`), which makes real drift harder to spot. A generic
species-keyed mixture module plus a phase-parameterized transport core would collapse roughly a
third of the engine.

### F3 — Hand-maintained deep clone is a latent correctness bug (High · maintainability)

`cloneGame` (`engine/roomState.ts:170`) manually enumerates every nested field of `GameState`.
Any new state field that isn't added here is *silently shared by reference* between the previous
and next tick — the worst failure mode: no error, no test failure, just aliased mutation that
corrupts history-dependent behavior (saves, retry snapshots, React referential equality). The
pattern has been kept up to date so far (`portalStates` was added correctly), but it converts every
`GameState` extension into a three-place edit (`gameStateTypes.ts`, `cloneGame`, `save.ts` schema)
where forgetting one place is invisible.

Secondary concern: a full deep clone runs on **every command and every 100 ms tick** at
`speed × 10 Hz`. Fine at today's state size; it couples frame cost linearly to state growth
(64 incidents × targets, 48 events, enemy paths are all copied each tick even when untouched).

There is no test asserting clone completeness (e.g. deep-freeze the source, step, assert no
mutation of the source) — that is the cheapest possible guard for this design.

### F4 — State shape is re-enumerated in three places with drift risk (Medium · DRY/extensibility)

- `gasSchema`/`liquidSchema` hand-list all species (`save.ts:70-86`) instead of deriving from
  `GAS_TYPES`/`LIQUID_TYPES` — the pattern used correctly for most other ID schemas
  (`z.enum(LEVEL_IDS)` etc.). Adding a gas compiles fine and then rejects every save at runtime.
- `roomIdSchema` (`save.ts:38`) duplicates the hand-written `RoomId` union (`types.ts:123`), which
  itself duplicates the keys of `ROOM_DEFINITIONS`. Three sources of truth for room identity.
- `phaseSchema`, `flowCauseSchema`, and the enemy `mode` enum are re-typed literal-by-literal in
  `save.ts` (the mode list twice: lines 188 and 270), all shadowing unions in the types layer.
- `RoomAnalysis` (`gameStateTypes.ts:172-199`) hand-flattens per-zone fields
  (`lowerDominantGas`, `upperDominantGas`, …) instead of a `Record<GasZone, ZoneAnalysis>` —
  the same widen-by-hand pattern.

TypeScript will not catch a Zod schema that is narrower than the type it validates (extra species
in the type simply fail at runtime). Since `save.ts` is the layer that must never drift, deriving
every enum schema from the single const arrays matters more here than anywhere else.

### F5 — Balance data is scattered through engine code (Medium · extensibility/tuning)

Rate constants, thresholds, and damage coefficients live inline where they are used:

- `reactions.ts`: kinetics (`0.95`, `1.75`, `2.8`, `0.82`, `0.72`), heat couplings (`4.8`, `0.8`,
  `0.62`, `0.42`, `0.34`, `0.28`), phase-change constants (`96`, `0.012`, `44`, `0.014`), separator
  leak model (`0.48`, `0.42`, `0.16`).
- `physics.ts`: the entire hazard model (`105`, `42`, `58`, `24`, `80`, `72`, `26`, `0.17`, `90`,
  thresholds `0.004`/`0.006`/`0.13`/`0.14`), movement slowdown curves.
- `combat.ts`: `ENEMY_WORLD_SPEED_SCALE`, `LOCOMOTION_SPEED`.
- `stratification.ts`, `gasFlow.ts`, `equipment.ts`: named constants at file top (better), but
  still spread across eight files.

Some of this is legitimately engine-owned (numerical damping, epsilons). But reaction kinetics,
hazard profiles, and equipment effect tables are *game balance* — the thing a playtest loop
(`tooling/playtest.ts` exists!) most wants to iterate on. Today a balance pass means edits across
the engine with no single place to see, diff, or sweep the tunables, and (per F1) some of them are
duplicated as display strings.

### F6 — Presentation copy and logic keyed on display strings inside the engine (Medium)

`addEvent` calls embed player-facing English prose throughout engine code (`reactions.ts`,
`combat.ts`, `commands.ts`, `phases.ts`, `save.ts`). Two problems:

1. The engine cannot be reskinned/localized/toned without touching simulation files, and copy
   edits show up as engine diffs.
2. **Display strings are load-bearing:** `hasEvent(state, title)` dedupes one-shot events by
   comparing the *title copy* (`reactions.ts:58,178,274`). Rewording "R-02 HCl production
   established" changes replay behavior. Event identity should be a code; copy should live in a
   UI-side table keyed by that code.

### F7 — UI subscription granularity and repeated derivation (Medium · performance/clean code)

- 35 call sites subscribe with `useGameStore((s) => s.game)`. Because `stepGame`/`executeCommand`
  replace the whole state object, every one of those components re-renders every 100 ms while the
  simulation runs, regardless of what changed.
- `analyzeRoom` — a nontrivial computation (dominant species, hazards for both zones, densities,
  effects list) — is called independently in 6 subcomponents of `RoomInspector` alone, per render,
  per tick, plus more call sites in the map layer (11+ component call sites total). There is no
  memoized derived-selector layer between the store and the components.

At today's scale this is invisible; it becomes the scaling constraint as the map and telemetry UI
grow. The clean seam already exists (`RoomAnalysis` is a pure function of `RoomState`) — it just
needs a per-tick cache/selector instead of ad-hoc recomputation.

### F8 — Boundary blurs at the edges (Low–Medium · separation)

- **`src/game/` hosts the React bridge.** `hooks.ts` (React) and `store.ts` (Zustand) live inside
  the directory that CLAUDE.md declares simulation-pure. The purity of `engine/` + `content/` is
  real, but the rule "no React in the game layer" is not mechanically checkable while the bridge
  lives there — no lint boundary enforces it.
- **Test scaffolding inside the dispatch path.** `store.dispatch` routes every accepted command
  through `applyE2ETutorialEvidence` (`testing/e2eMode.ts`), which fabricates enemies and flash
  bursts by mutating cloned state directly — bypassing the command boundary the rest of the
  codebase honors. It is DEV-and-query-param gated, but it means production dispatch semantics
  include a Playwright-scenario hook, and e2e tests exercise a state trajectory the real game can
  never produce.
- **Tutorial model hardcodes DOM selectors.** `guideModel.ts` embeds CSS selectors like
  `'[data-testid^="install-furnace-"][data-testid$="-gas_agitator"]'` in the (otherwise pure,
  tested) tutorial data. Components and tutorial can drift with no compile-time link; there is no
  shared registry of tutorial anchor IDs.
- **`config.ts` is a misleading name** — it is a pure re-export barrel of `content/*`. Two facades
  (`config.ts` for content, `simulation.ts` for engine) with overlapping consumers; fine, but the
  name suggests settings, not content.

### F9 — `save.ts` is four modules in one file (Low · cohesion)

712 lines behind an `eslint-disable max-lines`: current schema, v8 legacy schema + migration,
v7 legacy schema + conserving merge migration, storage IO, and a debounced write scheduler.
Each concern has a different change cadence (schemas change with state shape; migrations are
frozen once shipped; the scheduler is platform code). The file will grow by one frozen schema +
migration per save version — v10 will push it past 900 lines. Natural split: schema, one file per
frozen migration, storage/scheduler.

### F10 — Smaller items

- **Dead export:** `simulateEnemies` (`combat.ts:414`) has no callers anywhere (step.ts composes
  `resolveEnemyCombat` + `moveEnemies` itself).
- **Validate-after-mutate:** `upgradeEquipment` bumps `target.level` on the clone *before* the
  free-volume check and relies on `reject(source)` discarding the clone (`commands.ts:183-190`).
  Correct today, but the pattern breaks the moment someone returns `state` instead of `source` in
  a rejection path; every other command validates first.
- **Cast pressure from `Object.fromEntries`:** ~15 `as GameState["…"]` casts in
  `roomState.ts`/`save.ts`/`physics.ts` where a single typed `recordFromKeys(keys, fn)` helper
  would keep the type system honest; also `upgradeCosts[instance.level - 1] as number`.
- **Zone threshold duplicated conceptually:** `gasZoneForPort` uses `portHeight < 0.5`
  (`physics.ts:117`) and `enemyGasZone` re-derives zone from relative elevation `>= 0.5`
  (`combat.ts:121-128`) — one "which zone am I in" rule expressed twice against different inputs.
- **Store `reset()` bypasses command flow.** `reset`, `dismissTutorialGuide`, etc. in `store.ts`
  are fine as UI state, but `reset` also rebuilds game state outside `executeCommand` — the only
  non-command, non-load path that replaces the game. Worth keeping deliberate and unique.
- **Magic caps:** event/incident caps `48`/`64` are inline in `events.ts` rather than named.
- **`enemySchema` `progress` bound mismatch:** save schema requires `progress ≤ 1`
  (`save.ts:269`) while the engine invariant allows transient `progress` on the final step of `0`
  only by convention — safe now, but the invariant lives only in code comments.

---

## Extensibility scorecard — "what does it take to add…"

| Addition | Files to touch today | Silent-failure risk |
| --- | --- | --- |
| New gas species | `types.ts`, `content/substances.ts`, `save.ts` (hand-listed `gasSchema`), `physics.ts` hazards (F1), UI color/label consumers | Save schema rejects all saves; hazards silently ignore the species |
| New reaction | `types.ts` ×2 ID arrays, `content/chemistry.ts`, bespoke engine function + wiring (F1) | Engine/equation divergence undetected |
| New equipment | `types.ts`, `content/equipment.ts`, engine special-cases + constant tables (F1) | Display "effect" strings vs engine constants drift |
| New room | Hand-written `RoomId` union, `ROOM_DEFINITIONS`, geometry, `roomIdSchema`, corridor/route content | Three sources of room identity (F4) |
| New transport run | `types.ts`, `content/transportRuns.ts`, geometry | Low — this path is genuinely data-driven ✅ |
| New level/round | `content/campaign.ts` only | Low — well designed ✅ |
| New enemy type | `types.ts`, `content/enemies.ts` | Low — data-driven ✅ |
| New `GameState` field | `gameStateTypes.ts`, `cloneGame` (F3), `save.ts` schema (+ migration) | Missed clone = silent aliasing |

Levels, waves, enemies, and transport runs show the codebase already knows how to do data-driven
content. The problems are precisely where that pattern was *not* followed: reactions, equipment
effects, hazards, and the state-shape triple bookkeeping.

---

## Suggested priorities (directional, not prescriptive)

1. **Guard the clone** (F3): add a deep-freeze/no-alias test now — one hour of work neutralizes the
   scariest silent failure while any redesign is deferred.
2. **Derive every save schema enum from the const arrays** (F4): mechanical, removes the
   "compiles-but-rejects-saves" class.
3. **Unify the phase twins** (F2) before the next transport feature — every transport change made
   before unification doubles the eventual diff.
4. **Move balance into content** (F1/F5) before serious balancing begins: kinetics onto
   `ReactionDefinition`, hazard profile onto `SpeciesDefinition`, equipment effect tables into
   `EQUIPMENT_DEFINITIONS` (and render the display strings from them). This also converts the
   engine's bespoke reaction functions into a generic executor over the catalog — closing the
   engine/equation divergence risk.
5. **Event codes instead of copy keys** (F6) whenever the next copy pass happens.
6. Defer F7 (selector layer) until the UI actually shows frame pressure; defer F8/F9 splits to an
   opportunistic refactor.
