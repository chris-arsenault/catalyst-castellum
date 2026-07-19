# Catalyst Castellum architectural review

Date: 2026-07-13

## Executive assessment

Catalyst Castellum has a better simulation foundation than a typical MVP. The fixed-step engine is
deterministic, framework-independent, extensively covered by invariant-oriented tests, and built
around one authoritative spatial model. The command boundary, conserved-material model, damage
resolver, and save migrations all show deliberate engineering.

The repository is nevertheless not yet a low-friction base for broad post-MVP extension. Its main
risk is **change amplification**: a new reaction, equipment type, facility, phase, or state field has
to be added in several nominally separate layers that do not derive from one another. The code is
organized into `content`, `engine`, `components`, and `tutorial` directories, but several of those
boundaries are directory conventions rather than dependency boundaries.

The most important conclusion is:

> The engine is cleanly separated from React and Pixi, but it is not cleanly separated from the
> current campaign's concrete catalogs, identifiers, topology, text, and state representation.

That is acceptable for proving the MVP mechanics. It will become expensive once content and UI
variants begin growing in parallel.

No implementation plan or fixes are proposed in this report. The findings describe the current
risks and why they matter.

## Scope and validation

The review covered the TypeScript/React source, Pixi render projections, tutorial, headless
playtester, persistence and migrations, repository documentation, build configuration, and test
layout. The source contains 106 TypeScript/TSX files and roughly 16,300 lines of TypeScript/TSX;
the global stylesheet is another 3,060 lines.

Validation performed during the review:

- `make ci` passed: ESLint, Prettier, TypeScript, Vitest with coverage, and Terraform formatting.
- 16 Vitest files and all 81 tests passed.
- Coverage was 83.78% statements, 64.64% branches, 87.02% functions, and 85.84% lines.
- A one-random-policy-per-level headless smoke run was executed. The deterministic intended policy
  passed Levels 1 and 5 and failed Levels 2, 3, and 4.
- Playwright was not run because its configuration starts the local development server; this was a
  code/architecture review rather than an interactive browser verification request.

## Current architecture

The intended dependency flow is clear:

```text
authored content/configuration
           |
           v
pure mutable engine internals --> simulation.ts public facade
           |                              |
           v                              v
   persistence codec                Zustand store
                                          |
                                  React + Pixi projections
```

The actual application composition has extra reverse and cross-layer dependencies:

```text
global content singletons <--------- engine modules
          ^                              |
          |                              v
        save.ts <-------------------- GameState
          ^                              |
          |                              v
tutorial storage/model ------------> Zustand store <------------ E2E state injector
                                          |
                                          v
                               whole-snapshot React/Pixi tree
```

The second diagram is where most post-MVP risk sits.

## What is already strong

These strengths are important context for the findings; they should be preserved as architectural
constraints.

1. **The core engine is genuinely headless.** Files under `src/game/engine/` do not depend on
   React, Pixi, Zustand, DOM APIs, or browser timing. The browser-specific clock and persistence
   adapters are outside the engine.
2. **State transitions have an authoritative command entry point.** `executeCommand` owns mutation
   validation for player actions, and `stepGame` owns fixed-step simulation sequencing.
3. **The spatial model is unusually coherent.** Navigation, room volume, natural architectural
   flow, conduit routes, and rendering derive from the same authored cell geometry. The geometry
   test suite protects meaningful cross-subsystem invariants.
4. **Combat attribution has a strong transaction boundary.** Damage packets are resolved centrally
   and update health, ledgers, incidents, events, and round statistics together.
5. **Persistence is treated as a product concern.** Saves are versioned and validated, and the V7
   and V8 migrations explicitly preserve material and navigation state.
6. **Tests focus on domain invariants rather than only snapshots.** Conservation, topology,
   movement legality, branch fairness, damage attribution, and migration behavior all have direct
   coverage.

## Prioritized findings

| ID   | Priority | Finding                                                                                             |
| ---- | -------- | --------------------------------------------------------------------------------------------------- |
| A-01 | High     | Content catalogs describe mechanics but do not own their behavior                                   |
| A-02 | High     | The engine is hard-wired to one global ruleset and facility                                         |
| A-03 | High     | `GameState` is manually mirrored across initialization, cloning, schemas, and migrations            |
| A-04 | High     | UI availability logic duplicates only part of authoritative command policy                          |
| A-05 | High     | Valid saves can still violate canonical domain and topology invariants                              |
| A-06 | High     | Browser E2E behavior is injected through the production store and bypasses normal time flow         |
| A-07 | High     | The campaign validity loop is observational, not a quality gate                                     |
| A-08 | Medium   | Every simulation tick clones, publishes, redraws, and schedules persistence for a whole snapshot    |
| A-09 | Medium   | The public simulation boundary exposes mutable subsystems and implicit ordering constraints         |
| A-10 | Medium   | Domain state and engine queries contain presentation copy and display policy                        |
| A-11 | Medium   | Phase/state-machine rules are distributed across engine, schema, and UI branches                    |
| A-12 | Medium   | The application store is a mixed composition root with browser, tutorial, test, and domain duties   |
| A-13 | Medium   | Several large files and global facades obscure ownership and accumulate unrelated reasons to change |
| A-14 | Medium   | Test depth is uneven exactly where extension pressure is highest                                    |

### A-01 — Content catalogs describe mechanics but do not own their behavior

The repository appears data-driven: substances, reactions, equipment, enemies, transport runs, and
campaigns all have typed catalogs under `src/game/content/`. For reactions and equipment, however,
the catalog is mostly descriptive metadata. The executable behavior is hard-coded elsewhere.

Examples:

- [`REACTION_DEFINITIONS`](src/game/content/chemistry.ts#L20) owns equations and stoichiometric
  participants, but [`simulateReactions`](src/game/engine/reactions.ts#L334) does not execute those
  definitions. Each reaction has a separate hand-written function with the stoichiometry and
  kinetics repeated in assignments.
- [`EQUIPMENT_DEFINITIONS`](src/game/content/equipment.ts#L3) owns names, placement rules, costs, and
  displayed grades, while [`equipment.ts`](src/game/engine/equipment.ts#L15) has separate tables and
  specific identifier checks for agitators, contactors, coils, and membrane cells.
- The membrane cell is coupled across `types.ts`, the equipment catalog, the process catalog,
  `equipment.ts`, `reactions.ts`, scenario loadouts, `ProcessControls`, `ActuatorControls`, tutorial
  predicates, E2E setup, and saves.
- Every identifier family is declared as a literal tuple in [`types.ts`](src/game/types.ts#L7), then
  used to construct exhaustive records throughout the engine and persistence layer.

As a result, adding a reaction or equipment type is not an extension of a catalog. It is a
cross-repository modification with multiple sources of truth. The reaction catalog can remain
balanced while the executable reaction uses different coefficients, heat, products, or eligibility
rules. TypeScript proves that all IDs are handled in many records; it does not prove that the
declarative definition and imperative implementation agree.

This is the repository's clearest Open/Closed Principle problem. It is not a reason to turn the
functional codebase into a class hierarchy, but the current functional boundaries are closed over
the current four equipment types and seven reactions.

### A-02 — The engine is hard-wired to one global ruleset and facility

Engine functions accept `GameState`, but not the definitions or world against which that state is
interpreted. Instead, engine modules directly import concrete singleton catalogs:

- [`physics.ts`](src/game/engine/physics.ts#L1) imports the one facility geometry, substance catalog,
  and flash rules.
- [`gasFlow.ts`](src/game/engine/gasFlow.ts#L1) and
  [`liquidFlow.ts`](src/game/engine/liquidFlow.ts#L1) import the one transport-run catalog.
- [`combat.ts`](src/game/engine/combat.ts#L1) imports the one enemy catalog, facility map, and room
  catalog.
- [`scenarioState.ts`](src/game/engine/scenarioState.ts#L1) imports the one campaign, room, transport,
  and source catalogs.
- Facility cell caches are initialized from the module-level
  [`FACILITY_MAP`](src/game/content/facilityGeometry.ts#L42), not from a scenario/world parameter.

This is dependency inversion in name only: `content` is in a separate directory, but the engine
depends on its concrete instances. The consequences are broader than mod support. It is not
possible to run two facilities, compare two balance rulesets, load a level-specific topology, or
test a small synthetic world without editing or replacing module globals. `LevelDefinition`
selects loadouts and waves, but every level still uses the same rooms, sources, buffers, routes,
processes, reactions, portals, and map.

The fixed topology is explicitly an MVP constraint, but the dependency shape makes that constraint
expensive to relax later.

### A-03 — `GameState` is manually mirrored across initialization, cloning, schemas, and migrations

The authoritative state type is large and highly nested
([`GameState`](src/game/gameStateTypes.ts#L128)). Its lifecycle is re-described manually in several
places:

- [`createScenarioGame`](src/game/engine/scenarioState.ts#L187) initializes every record and field.
- [`cloneGame`](src/game/engine/roomState.ts#L170) manually deep-clones each nested branch.
- [`save.ts`](src/game/save.ts#L38) restates the shape in Zod, including repeated literal enums and
  per-species objects.
- Legacy schemas and migrations restate older shapes in the same file.
- Test-only setup in [`e2eMode.ts`](src/testing/e2eMode.ts#L44) manually creates an enemy and edits
  inventories.

This creates a dangerous maintenance property: adding a TypeScript field can compile while the
manual clone continues to share its nested value with the source. Likewise, a schema can infer a
shape that is close to, but not identical to, `GameState`; the current decoder resolves this with
an assertion at [`save.ts:662`](src/game/save.ts#L662), which removes compile-time proof of schema/type
alignment.

The circular type arrangement reinforces the problem. `types.ts` imports and re-exports
`gameStateTypes.ts` and `facilityTypes.ts`, while both of those files import types back from
`types.ts`. The imports are type-only and therefore safe at runtime, but there is no acyclic domain
type ownership model.

This is a high-risk source of subtle defects because every future feature is likely to add state.
The existing tests protect known fields, but they cannot make omitted future clone/schema work fail
automatically.

### A-04 — UI availability logic duplicates only part of authoritative command policy

The command layer correctly remains authoritative, but the UI independently recreates enough
policy to decide what to show and enable. Those UI copies are incomplete.

Examples:

- [`availableEquipment`](src/components/processControls/EquipmentControls.tsx#L23) repeats unlock,
  ring, and required-feature checks from
  [`equipmentInstallationProblem`](src/game/engine/commands.ts#L103), but does not include uniqueness,
  occupied-volume, existing-installation, or all resource constraints.
- Equipment upgrade buttons reproduce grade/cost/phase checks, while the engine additionally
  validates post-upgrade free volume.
- [`PhaseAction`](src/components/processControls/TransportControls.tsx#L34) independently calculates
  the 75% transport refund. The same policy lives in
  [`dismantleTransportCommand`](src/game/engine/transportCommands.ts#L76).
- Feedstock cards independently decide affordability and capacity display, while actual partial
  charge cost is recalculated by the command handler.
- Phase-lock checks such as `build || prime` are repeated in many components and command modules.

This produces a predictable class of drift: an action can look available and then be rejected, or
be hidden even though the command would accept it. The current notice mechanism makes rejection
safe, but it does not make the interface truthful. It also means headless callers, React controls,
tutorial selectors, and future alternate UIs do not share a complete decision/read model.

### A-05 — Valid saves can still violate canonical domain and topology invariants

The save boundary performs unusually strong enemy-path validation, but most other state receives
only structural validation. In particular, conduit routes are validated as arrays of integer cells
([`gasConduitSchema`](src/game/save.ts#L136) and
[`liquidConduitSchema`](src/game/save.ts#L147)). They are not required to be non-empty, in bounds,
orthogonal, contiguous, attached to the authored endpoints, or consistent with their run/phase.

That matters because the route in saved `GameState` is authoritative to the solver:

- [`conduitRoute`](src/game/engine/networkGeometry.ts#L23) reads the persisted route.
- Length, capacity, maximum flow, lift, and endpoints all derive from it.
- An empty route can produce zero capacity or an exception at
  [`conduitEndpoint`](src/game/engine/networkGeometry.ts#L75).
- The renderer uses the state route but falls back to the definition blueprint when it is empty
  ([`transportGraphics.ts:229-243`](src/components/gameMap/transportGraphics.ts#L229)). The UI can
  therefore draw a valid route while the engine sees no route.

Other cross-field invariants are also unvalidated: campaign `levelIndex` need not match `levelId`,
availability can contradict the current round, `roundIndex` is not bounded by the selected level,
and a room object's `id` need not match the record key that contains it.

This is not a security issue—the save is local—but it is a correctness and migration issue. The
schema currently means “well-shaped numbers and IDs,” not “a state the engine can safely execute.”

### A-06 — Browser E2E behavior is injected through the production store and bypasses normal time flow

The production Zustand module directly imports
[`applyE2ETutorialEvidence`](src/game/store.ts#L7). After every accepted command, the store gives the
test adapter an opportunity to replace the resulting authoritative game state
([`store.ts:35-43`](src/game/store.ts#L35)). The test adapter is development-gated, but it remains in
the application dependency graph and composition path.

In E2E mode:

- [`useSimulationClock`](src/game/hooks.ts#L8) does not run the interval clock.
- Changing speed during prime directly transfers source inventory into the furnace and invokes a
  flash.
- Starting assault directly creates an enemy in the furnace and invokes another flash
  ([`e2eMode.ts`](src/testing/e2eMode.ts#L24)).

Those operations call real reaction and damage functions, so the resulting evidence is internally
valid. They do not, however, exercise the complete browser integration claimed by the first E2E
scenario: timing accumulation, conduit priming, normal enemy spawning, navigation into the room,
and the real simulation-loop order are bypassed.

This weakens both architecture and test trust. Test scaffolding can mutate domain state after the
authoritative command boundary, and a green browser causal-chain test is not proof that the normal
browser clock produces that chain.

### A-07 — The campaign validity loop is observational, not a quality gate

The headless evaluator is a valuable architecture asset: it uses the same scenario creation,
commands, and fixed-step engine as the game. It currently reports a serious product inconsistency,
but neither `make ci` nor `pnpm check` enforces its result.

The review's deterministic intended-policy run produced:

| Level                  | Intended result               |
| ---------------------- | ----------------------------- |
| 1 — Flash Point        | Pass, 100% core               |
| 2 — Make the Reagent   | Fail, 0% core after one round |
| 3 — Acid Line          | Fail, 0% core after one round |
| 4 — Stored Chlorine    | Fail, 0% core after one round |
| 5 — Morrow Pocket | Pass, 100% core               |

The repository's own spatial rewrite ledger records the same Level 2–4 failures. The current unit
balance tests verify that levels require actions and use typed conduits; they do not verify that the
authored reference plan can complete each level. The CLI also exits successfully when intended
plans fail because results are printed rather than asserted.

For a near-MVP game, this is a high-priority architectural gap in the feedback loop: the strongest
end-to-end engine validator is decoupled from the definition of a healthy build.

### A-08 — Every simulation tick clones, publishes, redraws, and schedules persistence for a whole snapshot

The current update path is coarse-grained:

1. The browser clock calls `tick(0.1)` ten times per simulated second.
2. [`stepGame`](src/game/engine/step.ts#L46) deep-clones the full state before stepping.
3. The store replaces the top-level `game` reference and schedules a save.
4. `App` subscribes to the entire game and passes it to `GameMap`.
5. Another 35 component locations also select the entire `state.game` object.
6. Pixi drawing callbacks depend on the whole game object, so rooms, routes, process nodes,
   incidents, doors, and enemies are eligible to redraw on every tick.
7. The save scheduler serializes the latest full state at most every 750 ms.

The Zustand selectors do not isolate most of the tree because `App` itself re-renders on every game
replacement and renders all child components. `GameMap` then passes the whole snapshot through most
of the Pixi scene.

At the present scale this is likely acceptable. It is structurally tied to the size of `GameState`,
number of rooms/routes/enemies, event history, incident history, and render layers, however. Future
content growth increases simulation copying, React reconciliation, Pixi redraw work, and save
serialization together. Performance concerns cannot be addressed independently because the same
large snapshot is also the interface between layers.

### A-09 — The public simulation boundary exposes mutable subsystems and implicit ordering constraints

The strongest engine invariant is not just which functions run, but their order. In
[`stepMutable`](src/game/engine/step.ts#L27), networks run before installed equipment, stratification,
spawn, reactions, damage, and finally movement. The rewrite documentation correctly identifies
that order as gameplay semantics.

At the same time, [`simulation.ts`](src/game/simulation.ts#L1) re-exports low-level mutators such as
`simulateNetworks`, `simulateReactions`, and `simulateStratification` alongside safe queries and the
authoritative `stepGame`/`executeCommand` entry points. Several deep engine modules are also imported
directly by tests and E2E scaffolding.

The engine therefore has two public styles:

- immutable-looking state transitions that clone and return a new `GameState`; and
- in-place subsystem functions whose caller must know preconditions, mutation rules, and sequence.

This is an Interface Segregation problem and an invariant-boundary problem. A future caller can
easily run a valid subsystem in an invalid order, reuse the same mutable state reference, or bypass
command validation. The exports are useful for focused tests, but they are not distinguished from
the application API.

### A-10 — Domain state and engine queries contain presentation copy and display policy

Framework separation is good, but presentation separation is incomplete. The engine constructs and
persists user-facing English strings:

- Command handlers return complete UI messages and create prose events.
- [`roomRingDescription`](src/game/engine/commands.ts#L341) is display copy in the command module.
- [`equipmentFunctionalSummary`](src/game/engine/equipment.ts#L95) formats an inspector string.
- [`RoomAnalysis`](src/game/gameStateTypes.ts#L172) contains `hazardLabel` and `effects: string[]`, and
  [`roomExpectedEffects`](src/game/engine/physics.ts#L264) writes the final user-facing sentences.
- Reaction telemetry stores `limitingReactant` as a formatted string rather than structured cause
  data.
- `GameEvent` and `RoundReport` persist complete rendered prose in the save.

The immediate UI is convenient because it can render these values directly. The cost is that copy,
localization, alternate detail levels, accessibility phrasing, telemetry analysis, and domain rules
change together. Persisted saves also preserve old prose even after copy changes. This is a UI/engine
separation concern even though no React import crosses into the engine.

One visible symptom is that presentation code must infer units from raw analysis fields. In
[`RoomMetrics`](src/components/RoomInspector.tsx#L159), `analysis.liquidTotal` is displayed under
“Liquid fill” with a percent sign even though the field is an amount, not a fill ratio.

### A-11 — Phase/state-machine rules are distributed across engine, schema, and UI branches

`GamePhase` is a string union, while valid transitions and phase-specific invariants live in many
places:

- `commands.ts` and `campaignCommands.ts` validate individual transitions.
- `step.ts` owns a separate `STATIC_PHASES` set.
- `save.ts` repeats the phase enum.
- `TopBar`, `PhaseBanner`, modals, process controls, tutorial logic, and store behavior each branch
  on phase values independently.
- The broad `GameState` interface permits every field combination in every phase: paused build
  states, enemies during a briefing, reports during prime, or incompatible campaign progress are
  representable and mostly save-valid.

Adding a phase is consequently shotgun surgery. Exhaustiveness in `executeCommand` helps for new
commands, but it does not prove that every phase has step semantics, UI treatment, persistence
support, tutorial behavior, and legal entry/exit transitions.

### A-12 — The application store is a mixed composition root with browser, tutorial, test, and domain duties

[`store.ts`](src/game/store.ts#L1) is only 100 lines, but it has many unrelated reasons to change. It
currently owns:

- initial save restoration;
- domain command dispatch and ticking;
- save scheduling and reset;
- selected-room UI state;
- help and notice UI state;
- tutorial dismissal persistence and restart behavior;
- level-change focus policy; and
- the E2E state injector.

It also executes `loadSavedGame()` at module import time. Merely importing the store accesses
browser-backed application state when `window` exists, which makes initialization order and test
isolation part of module loading.

This does not compromise the pure engine, but it makes the application boundary hard to reuse. A
second UI, replay viewer, editor, server-side renderer, or isolated component harness would have to
accept the same tutorial, browser-storage, test, and selection policies or bypass the store.

### A-13 — Several large files and global facades obscure ownership and accumulate unrelated reasons to change

The repository enforces useful complexity and function-size limits, but the highest-change modules
work around or sit outside those limits:

- [`save.ts`](src/game/save.ts) is 712 lines and disables the file-length rule. It contains the
  current codec, two legacy formats, migrations, semantic navigation validation, `localStorage`, and
  save debouncing.
- [`campaign.ts`](src/game/content/campaign.ts) is 466 lines and disables the same rule. It combines
  level copy, loadouts, availability, waves, reference playtest policies, and campaign traversal.
- `styles.css` is 3,060 lines of global selectors with all component, modal, Pixi-container,
  tutorial, and responsive styling in one ownership domain.
- `combat.ts`, `commands.ts`, `reactions.ts`, `RoomInspector.tsx`, `Modals.tsx`, and
  `transportGraphics.ts` each carry several related but independently changing concepts.
- [`config.ts`](src/game/config.ts) and [`simulation.ts`](src/game/simulation.ts) are broad barrels.
  Engine and UI callers receive a large surface instead of importing from narrow contracts.

There is also meaningful duplication in gas/liquid conduit planning, mixture formatting across
several components, command `accept`/`reject` helpers, phase-lock predicates, and material
add/total helpers. Not every gas/liquid similarity deserves abstraction—the physics differs—but the
shared allocation/readout lifecycle is currently duplicated enough that a bug fix must often be
made twice.

These are not severe defects in isolation. Together they reduce locality: file names no longer
identify a single change reason, and broad barrels make dependency direction hard to enforce.

### A-14 — Test depth is uneven exactly where extension pressure is highest

The test suite is strong on the central simulation invariants, but the coverage report shows weak
branches in policy and transition code:

- `commands.ts`: 30.63% branch coverage;
- `campaignCommands.ts`: 35.71%;
- `phases.ts`: 27.77%;
- `transportTelemetry.ts`: 22.22%;
- overall branch coverage: 64.64%.

There are 16 `.test.ts` files and no `.test.tsx` files. `vite.config.ts` includes only
`src/**/*.test.ts`, so React control behavior, store composition, browser save scheduling, and the
duplicated UI availability rules have no component-level tests. Playwright covers important
browser flows, but its deterministic evidence injector bypasses part of the live integration as
described in A-06.

Coverage is collected but no thresholds are configured. `make ci` does not run the production
build, Playwright, or the headless evaluator. The external GitHub workflow may add checks, but its
implementation is not defined in this repository; locally, the documented CI contract cannot fail
for the currently broken intended policies in Levels 2–4.

## SOLID assessment in context

SOLID should be applied carefully to this functional codebase; class hierarchies would not improve
it by themselves.

- **Single Responsibility:** strongest violations are `save.ts`, `store.ts`, the broad analysis
  functions that mix physics with copy, and the global stylesheet.
- **Open/Closed:** weakest area. Reactions, equipment, phases, and facilities require edits to
  central switches, literal ID tuples, state records, schemas, UI, and tests.
- **Liskov Substitution:** not materially applicable; the design does not use substitutable object
  hierarchies.
- **Interface Segregation:** `GameState` and the `simulation.ts` facade are overly broad interfaces
  for UI and external callers. Most consumers see more mutable state and operations than they need.
- **Dependency Inversion:** the pure engine depends directly on concrete global catalogs and the
  one facility. The filesystem layout suggests inversion, but the dependency graph does not.

## Architectural readiness conclusion

The repository is a credible MVP implementation and a strong proof of its difficult simulation
ideas. Its conservation, geometry, and combat foundations are worth building on. The risk is not
that the current code is chaotic; it is that the current order depends on a small, closed set of
content.

Post-MVP growth will be most expensive in five areas:

1. adding executable content without duplicating definitions and engine code;
2. supporting more than one concrete world/ruleset;
3. evolving `GameState` safely across cloning and persistence;
4. keeping UI decisions aligned with command policy; and
5. preserving performance as the single whole-state snapshot grows.

Until those boundaries are made explicit, new features will tend to widen `types.ts`, `GameState`,
`save.ts`, global catalogs, the store, and the UI simultaneously. That is the central architectural
problem to address before treating the MVP as a durable long-term platform.
