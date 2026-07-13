# Catalyst Castellum — Architectural Review

_Reviewer: Fugu · Date: 2026-07-13 · Scope: `src/**` (engine, UI, content, saves)_

This review evaluates the codebase against the goals you named: **extensibility, UI/engine
separation, clean code, DRY, and SOLID (where appropriate)**. The project is close to an MVP and
the intent is to establish a solid base going forward. Per your instruction, this document only
**identifies problems** — it proposes no fixes and changes no code.

---

## 1. Executive summary

The architecture is, overall, in good shape for an MVP. The single most important design goal —
**a deterministic simulation fully decoupled from React/Pixi** — is genuinely achieved and
consistently respected. The command pattern, the pure render-model projections, versioned/validated
saves, and the data-driven level catalog are all sound foundations that will pay off later.

The problems below are therefore mostly about **duplication that will multiply as content grows**
and about a handful of **single-source-of-truth violations** where the same fact is expressed in two
independent places that can silently drift. None are emergencies; all are cheaper to address now
(near-MVP, small content set) than after the game has 5× the reactions, equipment, and species.

**Highest-leverage issues (in priority order):**

1. Reaction stoichiometry is duplicated between declarative data and imperative engine code (§3.1).
2. The gas/liquid split is duplicated at every layer instead of abstracted once (§3.2).
3. Equipment behavior is scattered across files and its balance numbers are divorced from content (§3.3).
4. The engine is coupled to specific content via hardcoded room IDs and event-title strings (§3.4).
5. `cloneGame` is a hand-maintained deep clone with no compile-time safety net (§3.5).

---

## 2. What is working well (keep these invariants)

These are strengths worth protecting because several proposed changes could accidentally erode them.

- **Engine/UI separation is real.** `src/game/engine/**` has no React/Pixi/DOM imports; the
  simulation runs headless in `tooling/playtest.ts`. Zustand (`store.ts`) is a thin bridge, not the
  domain model, exactly as `CLAUDE.md` mandates.
- **Command pattern with a shared verdict.** `executeCommand` returns `{ state, accepted, reason }`,
  and the same authorization helpers (e.g. `equipmentInstallationProblem`) are used by both the UI
  and headless callers. This is the right seam for extensibility.
- **Pure render-model projections.** `roomRenderModel`/`enemyRenderModel` are pure
  `state → draw model` functions, keeping Pixi drawing dumb. This is a clean, testable boundary.
- **Data-driven content catalogs.** `content/campaign.ts` (`LevelDefinition`/`RoundDefinition`/
  `FacilityLoadout`) makes new levels almost purely additive. Species, enemies, and facility
  geometry are similarly declarative.
- **Determinism + serialization discipline.** Fixed timestep in `step.ts`, serializable state,
  versioned Zod-validated saves with conserving migrations (`migrateV7Game`/`migrateV8Game`).
- **Hygiene.** ~82 test cases, strict ESLint config, near-zero `eslint-disable`, no `TODO/FIXME`,
  small focused files, and a self-validating reaction catalog (`validateReactionCatalog`).

---

## 3. Primary findings

### 3.1 Reaction stoichiometry is duplicated between data and engine (SSOT / OCP)

`content/chemistry.ts` declares each reaction **as data** — reactants, products, and coefficients
(`REACTION_DEFINITIONS`), and even validates elemental balance (`reactionIsBalanced`). But the actual
simulation in `engine/reactions.ts` **re-encodes the same stoichiometry by hand** in bespoke
functions, e.g.:

```ts
gas.hydrogen -= reacted;
gas.chlorine -= reacted;
gas.hydrogen_chloride += reacted * 2;   // coefficient 2 restated in code
```

The declarative catalog is used only for validation and UI labels; it does **not** drive the
simulation. Consequences:

- The coefficients live in two places (`REACTION_DEFINITIONS` and each `simulateX` function) that can
  drift silently — the balance validator checks the data, not the code that actually runs.
- Adding or retuning a reaction requires editing hand-written engine code, not just data — an
  Open/Closed violation for what is nominally a data-driven system.
- Each reaction function embeds its own kinetics as bare magic numbers (`0.95`, `4.8`, `1.75`,
  `0.82`, `0.42`, `0.16`, …) with no named constants and no link to the definition.

The declarative model exists but stops short of being authoritative for behavior.

### 3.2 The gas/liquid split is duplicated at every layer (DRY)

The gas/liquid dichotomy is mirrored throughout instead of abstracted over a generic
"species inventory / phase" concept. Representative parallel pairs:

| Concern | Gas | Liquid |
| --- | --- | --- |
| Conduit transport engine | `engine/gasFlow.ts` (~248 ln) | `engine/liquidFlow.ts` (~205 ln) |
| Inventory ops | `takeGas`/`addGas`/`gasAmountTotal` | `takeLiquid`/`addLiquid`/`liquidAmountTotal` |
| State shape | `GasConduitState`, `GasJunctionState` | `LiquidConduitState`, `LiquidJunctionState` |
| UI composition | `GasComposition`/`GasLayerComposition` | `LiquidComposition` |
| UI summaries | `gasMixtureSummary`/`gasFlowSummary`/`dominantGasInLine` | `liquidMixtureSummary`/`liquidFlowSummary`/`dominantLiquidInLine` |

`gasFlow.ts` and `liquidFlow.ts` are the starkest case: they are near-identical structurally
(`GasPlan`/`LiquidPlan`, `initialPlan`, `proportionallyAllocate`/`allocateByRoom`,
`reconcileIncomingCapacity`, `deliver*`, `clearReadout`, `measuredCause`, `updateReadout`,
`isBlockedAfterPlan`, `applyPlan`, `simulate*Conduits`). The genuine differences are small and
well-isolated: the drive term (buoyancy+pressure vs. gravity head/lift) and gas-only temperature
mixing. Roughly ~200 lines are duplicated per phase. A bug fixed in one transport engine must be
remembered in the other; the UI summary helpers have the same hazard and already differ subtly (see
§4.3).

This is the largest single source of structural duplication and the one most likely to grow: adding
a third transported medium, or a new species, means touching every parallel site.

### 3.3 Equipment behavior is scattered, and its numbers are divorced from content (cohesion / SSOT / OCP)

- **Balance numbers live in the engine, not the content.** `engine/equipment.ts` hardcodes
  `GAS_REACTION_MULTIPLIERS`, `CONTACT_REACTION_MULTIPLIERS`, `HEATER_TARGETS`, `MEMBRANE_RATES`,
  `MEMBRANE_POWER`, etc. Meanwhile `content/equipment.ts` `EQUIPMENT_DEFINITIONS` carries only
  free-text `effect` strings that **restate the same numbers** (e.g. `"1.5× gas kinetics"`,
  `"68°C rated temperature"`). Editing the content description does not change behavior, and the two
  can drift. A designer cannot retune equipment from the content catalog alone.
- **Behavior is not cohesive per equipment.** Effects are dispatched across multiple files: the
  thermal coil is applied in `simulateInstalledEquipment` (equipment.ts), the agitator/contactor
  multipliers are pulled on demand inside `reactions.ts`, and the membrane cell has a dedicated
  `simulateElectrolysis` in `reactions.ts`. There is no single "equipment behavior" abstraction, so
  adding an equipment type means editing `EQUIPMENT_IDS`, `EQUIPMENT_DEFINITIONS`, new engine
  constant maps, and new branches in `reactions.ts`/`equipment.ts` — a classic Open/Closed
  violation.

### 3.4 The engine is coupled to specific content (room IDs and event strings)

`engine/reactions.ts` contains content-specific narrative logic:

```ts
if (reacted > 0 && room.id === "furnace" && !hasEvent(state, "R-02 HCl production established")) { … }
… room.id === "washlock" … "R-06 chlorine evolution established" …
```

Problems:

- The simulation "knows" specific rooms of a specific facility. A new facility layout, or a renamed
  room, silently drops these scripted events with no compile-time error.
- `hasEvent` deduplicates by **matching the human-readable title string**. Event identity is
  therefore coupled to display copy; editing the title breaks dedup, and localization/copy edits are
  landmines. Events lack a stable key/id for this purpose.

This narrative scripting arguably belongs in a content/trigger layer keyed off simulation facts, not
inside the physics loop.

### 3.5 `cloneGame` is a hand-maintained deep clone with no safety net (maintainability)

`engine/roomState.ts` `cloneGame` manually enumerates every field and nested record of `GameState`
(rooms, sources, buffers, junctions, conduits, portals, processes, enemies, stats, events,
incidents…). It runs every tick (`stepGame` clones `source` before mutating). The risk:

- Adding **any** new field to `GameState` requires remembering to extend `cloneGame`. If forgotten,
  the new field is shared by reference across the pre/post-tick states, producing subtle
  time-travel/mutation bugs that no type error will catch.
- There is no test asserting clone independence for all top-level keys, so the invariant is enforced
  only by reviewer vigilance.

The hand-clone was presumably chosen for per-tick performance, which is legitimate — but the fragility
is real and unguarded.

### 3.6 The save schema duplicates the domain types (SSOT / DRY)

`save.ts` defines a Zod schema that is a full hand-mirror of the domain type shapes (`gasSchema`
mirrors `GasAmounts`, `liquidSchema` mirrors `LiquidAmounts`, `roomSchema` mirrors `RoomState`, and
so on). This is two independent representations of the same shape that must be kept in sync by hand;
a new field must be added in both `types.ts` and `save.ts` or persistence silently diverges from
runtime. (The file already carries an `eslint-disable max-lines`, acknowledging the weight.)

Related: `roomIdSchema` and `phaseSchema` **re-list their string literals** rather than deriving from
a const array — see §3.7.

### 3.7 `RoomId`/`GamePhase` are not derived from const arrays, unlike every other ID family (consistency)

Every other identifier family follows the pattern "const array → derived union" (`GAS_TYPES`,
`LIQUID_TYPES`, `EQUIPMENT_IDS`, `TRANSPORT_RUN_IDS`, `LEVEL_IDS`, …), which gives a single source
for both the type and runtime iteration. `RoomId` (in `types.ts`) and `GamePhase` (in
`gameStateTypes.ts`) are instead hand-written unions with **no `ROOM_IDS`/`GAME_PHASES` const**. This
forces the string lists to be re-listed in `save.ts` and loses the "iterate all rooms/phases with
exhaustiveness" guarantee the other families enjoy. `ROOM_ORDER` exists but is derived from
`Object.keys(ROOM_DEFINITIONS)` and typed via a cast, not the reverse.

---

## 4. Secondary findings (UI, performance, clean code)

### 4.1 `analyzeRoom` is recomputed many times per render (perf / DRY)

`analyzeRoom` is a non-trivial aggregation (dominant species, hazards across zones, densities,
pressures, movement multipliers, effects). It is invoked **6 times inside `RoomInspector.tsx` alone**
(across `GasLayerComposition` ×2, `GasComposition`, `LiquidComposition`, `RoomMetrics`,
`EffectsPanel`, plus the inspector root), and again per room in `roomRenderModel`. There is no
memoization; each subcomponent recomputes independently.

### 4.2 Coarse store subscription granularity (perf, will not scale)

Nearly every component subscribes to the whole `state.game` object, which `store.ts` **replaces on
every tick** (~10 Hz). Result: the full inspector + map subtree re-renders every tick even when only
enemy positions changed. Acceptable at MVP scale, but there is no selector-level granularity or
state partitioning to lean on as the UI grows.

### 4.3 Duplicated, and subtly inconsistent, mixture/summary helpers (DRY)

Dominant-species/mixture summarization exists in multiple places with slightly different rules:
`describeGasMixture` (engine, `roomState.ts`) vs. `dominantGasInLine`/`gasMixtureSummary` (UI,
`ActuatorControls.tsx`). They diverge in thresholds (`0.05` vs. `0.005`) and labels (chemical
`formula` vs. `GAS_LABELS`). Because the logic is copied rather than shared, the copies have already
drifted.

### 4.4 Command handlers mix validation and mutation inconsistently (clean code)

Some handlers validate-first via dedicated `…Problem` helpers (e.g. `installEquipment`), while others
interleave validation with mutation — notably `upgradeEquipment`, which clones state, applies the
level bump, and only *then* checks the free-volume constraint before returning `source` on failure.
The pattern is inconsistent across the switch, and `executeCommand` itself carries an
`eslint-disable complexity`. A uniform validate → apply split would make the authorization boundary
easier to reason about and extend.

### 4.5 Lingering rename aliases (`CycleStats`/`CycleReport`) (clean code)

`gameStateTypes.ts` exports `type CycleStats = RoundStats` and `type CycleReport = RoundReport`, and
both names are used in the codebase (`events.ts` imports the `Cycle*` aliases; the rest uses
`Round*`). This looks like a half-finished rename; keeping both invites confusion about which is
canonical.

### 4.6 Pervasive un-named magic numbers in physics/reactions (clean code / tuning)

Beyond the reaction kinetics in §3.1, `engine/physics.ts` and `engine/reactions.ts` are dense with
bare tuning constants (separator-leak `0.48`/`0.42`/`0.16`, activation offsets, temperature deltas,
decay rates). `physics.ts` does name some (`STANDARD_PRESSURE`, `MAX_LIQUID_FILL_RATIO`, …), which
makes the un-named ones in the reaction/leak code stand out. This makes balance changes hard to trace
and is compounded by kinetics not being sourced from data.

### 4.7 Documentation drift (maintainability)

`CLAUDE.md` and `README.md` describe saves in terms of "V8 owns conduit routes, junctions…", but the
live `GameState.version` is `9` (with `migrateV8Game` present). The architecture prose should track
the current version to remain trustworthy as onboarding material.

---

## 5. SOLID scorecard (where appropriate)

| Principle | Assessment | Notes |
| --- | --- | --- |
| **S**ingle responsibility | Mostly good | Engine files are cohesive; exception is equipment behavior scattered across `equipment.ts`/`reactions.ts` (§3.3) and narrative scripting living inside the physics loop (§3.4). |
| **O**pen/closed | Weakest area | Adding a reaction (§3.1) or equipment (§3.3) requires editing engine code and multiple constant maps, not just data. |
| **L**iskov | N/A | Little inheritance/polymorphism; functional style. |
| **I**nterface segregation | Good | Types are focused; commands are a clean discriminated union. |
| **D**ependency inversion | Good at the big boundary | UI depends on the engine through pure functions + commands, not vice versa. Weaker internally where the engine reaches into specific content constants/IDs (§3.4). |

---

## 6. Suggested prioritization (problems only — no fixes prescribed)

1. **Decide whether reactions and equipment are truly data-driven** (§3.1, §3.3). This is the
   central extensibility question; everything else is smaller.
2. **Address the gas/liquid duplication axis** (§3.2) before adding a third medium or more species.
3. **Decouple narrative/event scripting from the physics loop and give events stable keys** (§3.4).
4. **Guard `cloneGame` and the save schema against silent drift** (§3.5, §3.6) — even a test that
   asserts round-trip/clone completeness across all `GameState` keys would remove the invisible risk.
5. **UI performance seams** (§4.1, §4.2) — cheap now, increasingly relevant as panels multiply.

_End of review._
