# Catalyst Castellum combined architectural review and remediation proposal

_Date: 2026-07-13_  
_Inputs: [CODEX_REVIEW.md](CODEX_REVIEW.md), [CLAUDE_REVIEW.md](CLAUDE_REVIEW.md), and
[FUGU_REVIEW.md](FUGU_REVIEW.md)_

## Purpose

This document consolidates the three architectural reviews into one deduplicated assessment. It
preserves every distinct material finding, reconciles overlapping severity judgments, and proposes
a remediation sequence for review. It does not implement any of the changes.

The combined assessment focuses on the qualities needed for post-MVP development:

- extension without widening central switches and state structures for every feature;
- a trustworthy UI/domain boundary;
- deterministic, testable simulation behavior;
- safe state and save evolution;
- clear module ownership and dependency direction;
- deliberate reuse rather than indiscriminate abstraction; and
- feedback loops that can prevent known-bad content from shipping.

## Consolidated assessment

Catalyst Castellum is a credible MVP with a stronger core than a typical prototype. The difficult
parts—deterministic simulation, conservation-aware transport, serializable state, a command seam,
headless execution, and pure render-model projections—already exist. React and Pixi do not leak
into the engine itself.

The primary architectural risk is that this order depends on a small, fixed content set. Several
catalogs describe behavior without owning it; the engine imports one concrete world and ruleset;
`GameState` is manually reproduced across its lifecycle; and UI, persistence, testing, and phase
logic each duplicate portions of domain policy. Adding content therefore tends to widen types,
schemas, engine branches, store behavior, UI controls, tests, and copy simultaneously.

The repository is ready to be hardened, but the sequence matters. Broad refactoring should not
precede safeguards for save validity, source-state immutability, campaign viability, command policy,
and production-path browser tests. Once those feedback loops exist, the content/ruleset boundary
and state lifecycle can be changed with much lower regression risk.

### Severity model

- **High:** likely to create incorrect behavior, invalid persisted state, misleading test results,
  or cross-repository feature edits during normal post-MVP growth.
- **Medium:** a meaningful scaling, ownership, or drift risk that is tolerable at current size.
- **Low:** localized debt or inconsistency that should be handled opportunistically or alongside a
  related structural change.

## Foundations worth preserving

The remediation work should retain these existing strengths:

1. **The simulation is deterministic and headless.** Fixed-step execution and serializable state
   support repeatable tests and command-line playtesting.
2. **The core engine is framework-independent.** `src/game/engine/**` does not depend on React,
   Pixi, or the DOM.
3. **Commands are an existing authority seam.** `executeCommand` returns a shared accepted/rejected
   verdict rather than allowing components to mutate domain state directly.
4. **Rendering is projection-oriented.** Room and enemy render models translate domain state into
   drawing inputs without putting game rules in Pixi code.
5. **Important domain invariants have tests.** Conservation, reactions, networks, combat,
   migrations, and deterministic stepping already receive meaningful coverage.
6. **The content model has proven data-driven examples.** Campaigns, rounds, waves, enemies, and
   much of the facility data demonstrate that declarative content works in this codebase.
7. **Persistence is versioned and structurally validated.** The current weaknesses are gaps in
   semantic validation and ownership, not the absence of a persistence strategy.
8. **Repository hygiene is generally sound.** Strict TypeScript, linting, formatting, coverage,
   and content validation form a useful baseline.

These are architectural invariants, not implementation details. A remediation that makes the
engine dependent on UI concerns, sacrifices deterministic execution, or hides rules behind opaque
runtime mutation would be a regression.

## Unified finding summary

| ID   | Severity | Finding                                                                                | Source coverage     |
| ---- | -------- | -------------------------------------------------------------------------------------- | ------------------- |
| U-01 | High     | Content catalogs describe mechanics but do not authoritatively execute them            | All three           |
| U-02 | High     | The engine is coupled to one concrete world, ruleset, and narrative context            | Codex, Claude, Fugu |
| U-03 | High     | Gas and liquid repeat the same transport/inventory architecture                        | All three           |
| U-04 | High     | `GameState` lifecycle and domain identity are manually mirrored                        | All three           |
| U-05 | High     | Persistence validates shape more strongly than executable domain validity              | Codex, Claude, Fugu |
| U-06 | High     | UI action availability duplicates incomplete command policy                            | Codex               |
| U-07 | Medium   | Public mutation and command boundaries expose implicit invariants                      | Codex, Claude, Fugu |
| U-08 | High     | Browser E2E scaffolding changes production dispatch and bypasses normal time flow      | Codex, Claude       |
| U-09 | High     | The headless campaign evaluator reports failures but cannot fail a healthy-build check | Codex               |
| U-10 | Medium   | Whole-state cloning, publication, derivation, drawing, and saving scale together       | All three           |
| U-11 | Medium   | Engine state and behavior contain presentation copy and use copy as identity           | All three           |
| U-12 | Medium   | Phase/state-machine ownership is distributed across layers                             | Codex, Fugu         |
| U-13 | Medium   | The application store and bridge mix unrelated application concerns                    | Codex, Claude       |
| U-14 | Medium   | Large modules and broad facades weaken ownership and dependency control                | All three           |
| U-15 | Medium   | Verification is weakest around policy, UI integration, and extension pressure          | All three           |
| U-16 | Low      | Local duplication, aliases, casts, magic values, and dead surface add friction         | Claude, Fugu        |

“All three” does not mean the reports used identical wording or severity. It means they identified
the same underlying gap. Findings unique to one review remain in the union because they are
independently material.

## Detailed findings

### U-01 — Content catalogs describe mechanics but do not authoritatively execute them

The repository presents substances, reactions, equipment, processes, enemies, transport runs, and
campaigns as typed content. Reactions, equipment, processes, and hazards are only partly
data-driven, however.

- [`REACTION_DEFINITIONS`](src/game/content/chemistry.ts) owns equations and stoichiometry, but
  [`reactions.ts`](src/game/engine/reactions.ts) separately hard-codes coefficients, rates, heat,
  phase changes, and eligibility in bespoke functions. Catalog balance validation cannot prove that
  executable behavior matches the declared equation.
- [`EQUIPMENT_DEFINITIONS`](src/game/content/equipment.ts) owns placement, costs, grade labels, and
  free-text effects. Executable multipliers, targets, rates, and power consumption live in separate
  engine tables and identifier branches. Display text can disagree with behavior.
- Hazard behavior names concrete species and embeds toxicity, corrosivity, heat, and movement
  coefficients in [`physics.ts`](src/game/engine/physics.ts). A new hazardous species is not an
  additive content change.
- The chlor-alkali process is a hard-coded singleton spanning process state, fixed source/buffer
  identifiers, equipment, reactions, UI controls, tutorial predicates, E2E setup, and saves.
- Balance values are spread across reaction, physics, combat, stratification, flow, and equipment
  modules. Some are legitimate numerical-engine constants, but content balance and display values
  are not clearly separated from solver mechanics.

This is the clearest Open/Closed gap. Adding a reaction or equipment type requires modifying
central behavior rather than extending one authoritative definition. The goal should not be to
force all mechanics into an untyped data language; it should be to ensure definitions own their
parameters and that exceptional behavior has an explicit, typed extension point.

### U-02 — The engine is coupled to one concrete world, ruleset, and narrative context

Engine functions accept `GameState`, but they obtain the world against which that state is
interpreted from module-level imports.

- Physics, combat, flows, scenario construction, and navigation import concrete singleton catalogs
  and the one facility map.
- Facility caches are initialized from the global map rather than a scenario/world argument.
- Levels select loadouts and waves, but share the same rooms, topology, reactions, sources,
  processes, and portals.
- Reaction code checks specific room identifiers such as the furnace and washlock to emit scripted
  narrative events.
- The membrane process addresses specific process, source, and buffer keys directly.

The separate `content` directory gives useful organization but not dependency inversion. The
engine cannot run two facilities or balance variants in one process, construct a small synthetic
world for a focused test, or reuse its rules against another topology without replacing globals.

This does not require a plugin system for the next milestone. It does require an explicit decision
about whether “one fixed facility forever” is a product invariant. If it is not, the current
dependency shape makes future expansion unnecessarily expensive.

### U-03 — Gas and liquid repeat the same transport/inventory architecture

Gas and liquid have genuinely different physics, but much of their surrounding lifecycle is
duplicated:

- `gasFlow.ts` and `liquidFlow.ts` repeat planning, priming, allocation, incoming-capacity
  reconciliation, readout reset/update, blocked-state detection, and plan application.
- Material amount, add, subtract, take, packet, and total helpers exist in gas/liquid pairs and are
  repeated again in migration code.
- State types, source/buffer/junction/conduit shapes, command handlers, cloning, schemas, migration
  maps, UI composition, and telemetry summaries mirror one another.
- Similar mixture summaries already use different thresholds and labels in the engine and UI.

The risk is silent behavioral drift: shared transport-policy fixes must be discovered and applied
twice. The correct abstraction boundary is not “gas and liquid are identical.” Shared mixture and
transport-plan mechanics can be reused while buoyancy, pressure, head/lift, temperature, vents,
and drains remain phase-specific strategies.

A generic core should only be extracted after characterization tests make the true common contract
explicit. Abstracting solely from textual similarity would risk obscuring the actual physics.

### U-04 — `GameState` lifecycle and domain identity are manually mirrored

`GameState` is large and nested. Its shape is manually re-described in scenario initialization,
deep cloning, current save schemas, legacy schemas, migrations, and test setup.

- [`cloneGame`](src/game/engine/roomState.ts) enumerates every nested field. Omitting a future
  reference-valued field silently aliases old and new snapshots; TypeScript cannot detect that
  omission.
- Full cloning occurs for commands and fixed simulation ticks, so clone cost grows with rooms,
  routes, enemies, histories, and future state fields.
- Save schemas manually re-list material fields and several literal unions. A domain type can widen
  while the decoder remains narrower and only fails at runtime.
- `RoomId` and `GamePhase` do not follow the same const-tuple-to-union pattern as most identifier
  families. Room identity is represented by a type union, catalog keys, ordering, and a schema.
- `RoomAnalysis` hand-flattens lower/upper zone fields rather than representing the zone dimension
  structurally.
- `Object.fromEntries` construction requires repeated assertions because the record-building
  contract is not expressed in reusable typed utilities.
- Type-only imports between `types.ts`, `gameStateTypes.ts`, and facility types form a circular
  ownership arrangement. It is runtime-safe but makes the authoritative home of domain types less
  clear.

This is both correctness and extensibility debt. “Add one state field” is currently a distributed
protocol enforced by memory and review rather than executable completeness checks.

### U-05 — Persistence validates shape more strongly than executable domain validity

Zod validation provides a good structural boundary, but a structurally valid save is not
necessarily safe or canonical for the engine.

- Persisted conduit routes can be empty, out of bounds, non-contiguous, diagonal, disconnected from
  authored endpoints, or inconsistent with their declared run/phase.
- Engine capacity, length, endpoint, and flow behavior treat the saved route as authoritative.
  Rendering can fall back to an authored blueprint for an empty route, so the map and solver can
  interpret the same saved state differently.
- Campaign level index, level ID, round index, and availability can contradict one another.
- A room object's `id` can disagree with the record key containing it.
- Other cross-field and phase invariants are representable because decoding validates local field
  shapes rather than whole-game semantics.

Persistence ownership also has cohesion and growth problems:

- [`save.ts`](src/game/save.ts) combines the current codec, frozen legacy formats, migrations,
  semantic navigation checks, browser storage, and debounced scheduling.
- Each new save version will add another frozen representation to an already large module.
- Documentation still describes V8 ownership even though current state is V9, reducing onboarding
  trust.

The save boundary needs two clearly different guarantees: structural decoding of untrusted bytes
and semantic validation/canonicalization of an executable game. Migration, storage, and scheduling
are separate concerns from both.

### U-06 — UI action availability duplicates incomplete command policy

The engine command layer remains authoritative, but components independently reconstruct enough
policy to decide whether an action is visible, enabled, affordable, or refundable.

- Equipment controls repeat unlock, feature, ring, cost, grade, and phase conditions, but do not
  reproduce every uniqueness, occupancy, post-upgrade volume, or resource constraint.
- Transport controls calculate refund policy separately from transport commands.
- Feedstock controls independently estimate affordability and capacity while commands calculate
  the accepted partial charge.
- Phase locks are repeated throughout controls and command modules.
- Tutorial predicates and alternate/headless callers form additional consumers of the same policy.

Rejected commands remain safe, but the UI can be misleading: actions can appear available and then
fail, or remain hidden while the engine would accept them. The missing domain concept is a shared
decision/read model that explains command availability, costs, previews, and rejection reasons
without requiring the UI to simulate mutations.

### U-07 — Public mutation and command boundaries expose implicit invariants

Correct simulation behavior depends on subsystem order. Networks, equipment, stratification,
spawning, reactions, damage, and movement are sequenced deliberately in the authoritative step.
The public simulation barrel also exports low-level in-place subsystem mutators, making them appear
equivalent to `stepGame`, queries, and immutable command transitions.

Consequences include:

- callers can invoke valid subsystems in an invalid order;
- callers can reuse mutable state references or bypass command validation;
- deep engine modules become informal APIs for tests and E2E scaffolding;
- the broad facade violates interface segregation by exposing more state and mutation capability
  than application callers require.

Within command handling, validation/application style is inconsistent. Most complex commands use
problem helpers, while `upgradeEquipment` mutates a clone before its final volume check and relies
on returning the original source when rejected. The pattern is correct today but fragile.

The store's reset path is the only normal non-command/non-load game replacement. That may be a
legitimate lifecycle action, but the exception is implicit rather than expressed as a separate
application boundary.

### U-08 — Browser E2E scaffolding changes production dispatch and bypasses normal time flow

The production Zustand dispatch path imports and invokes E2E tutorial evidence after accepted
commands. It is development-gated, but test behavior remains part of application composition.

In E2E mode:

- the normal simulation interval is frozen;
- changing speed can directly move material and trigger a flash;
- starting assault can directly create an enemy and invoke another flash; and
- timing accumulation, conduit priming, normal spawning, navigation, and authoritative subsystem
  ordering are bypassed.

The injected reactions and damage functions are real, but a green browser scenario does not prove
that the production browser clock and complete state trajectory cause the observed result. It also
normalizes mutation after the authoritative command boundary.

Test setup sometimes needs deterministic state construction. That capability should be an explicit
test harness boundary, not a hidden branch inside every production dispatch.

Tutorial data also embeds raw DOM selectors. Changes to component test IDs and tutorial anchors
can drift without a typed/shared identity contract.

### U-09 — The headless campaign evaluator reports failures but cannot fail a healthy-build check

The playtest tool is one of the repository's strongest architectural assets because it exercises
real scenarios, commands, and fixed-step simulation without the UI. Its output is observational.

The deterministic intended-policy run recorded by the Codex review produced:

| Level                  | Result                        |
| ---------------------- | ----------------------------- |
| 1 — Flash Point        | Pass, 100% core               |
| 2 — Make the Reagent   | Fail, 0% core after one round |
| 3 — Acid Line          | Fail, 0% core after one round |
| 4 — Stored Chlorine    | Fail, 0% core after one round |
| 5 — Morrow Pocket | Pass, 100% core               |

The unit tests prove that levels require actions and use typed conduits. They do not prove that the
authored reference policy can complete every level. The evaluator prints failures but exits
successfully, and it is not part of the local CI contract.

For a near-MVP game, a known-broken intended campaign path is not only a balance defect. It is a
feedback-loop defect: the most representative engine/content integration check is not an enforced
definition of build health.

### U-10 — Whole-state cloning, publication, derivation, drawing, and saving scale together

The main update path is deliberately simple but coarse:

1. `stepGame` deep-clones the entire game.
2. Zustand replaces the top-level `game` reference.
3. The application root and many components subscribe to that whole object.
4. Pixi drawing callbacks receive broad state and are eligible to redraw.
5. Room analysis is recomputed repeatedly across inspector subcomponents and map projections.
6. Save scheduling serializes the latest full snapshot on a short debounce.

The reviews counted roughly 35 whole-game subscriptions and multiple `analyzeRoom` calls within a
single inspector render. Events, incidents, routes, enemies, and other unchanged branches are
copied and republished with each tick.

This is acceptable at current scale and should not trigger a speculative rewrite. The architectural
issue is coupling: simulation state size, clone cost, React reconciliation, Pixi redraws, derived
analysis, and persistence serialization all grow together. There is no measured budget or narrow
snapshot/view-model boundary that allows one layer to scale independently.

### U-11 — Engine state and behavior contain presentation copy and use copy as identity

No React dependency crosses into the engine, but presentation separation is incomplete.

- Commands, reactions, combat, phases, and migrations create player-facing English prose.
- `RoomAnalysis` and equipment summaries expose final display sentences rather than structured
  facts.
- Reaction telemetry stores a formatted limiting-reactant string rather than a stable structured
  cause.
- Events and reports persist rendered copy, tying old saves to the wording of the build that wrote
  them.
- `hasEvent` deduplicates one-shot narrative events by title. Editing or localizing display copy can
  change simulation behavior.
- The UI sometimes has to infer display semantics from raw fields; one example presents a liquid
  amount as a percentage-style “fill” value.

This couples copy editing, localization, accessibility phrasing, telemetry analysis, persistence,
and replay behavior. Stable domain event identity and structured payloads are the missing boundary.

### U-12 — Phase/state-machine ownership is distributed across layers

`GamePhase` is a string union, while phase semantics are distributed across commands, campaign
commands, the fixed-step loop, saves, UI banners, modals, controls, tutorial behavior, and store
logic.

- Each command locally validates its legal phases.
- The step loop owns an independent static-phase set.
- The save schema repeats phase literals.
- Components repeatedly branch on phase values.
- Broad `GameState` permits many incompatible field combinations for a phase.

Adding or changing a phase is shotgun surgery. A switch can be exhaustive while the overall state
machine remains incomplete because there is no single transition model covering legal commands,
step semantics, entry/exit effects, required state, UI treatment, and persistence validity.

### U-13 — The application store and bridge mix unrelated application concerns

The Zustand store is small in line count but broad in responsibility. It owns initial save loading,
domain dispatch, fixed ticking, save scheduling, reset, selected-room state, help and notices,
tutorial persistence, level-change focus, and the E2E injector.

It also performs save restoration during module initialization when a browser is available. Import
order therefore has browser-storage effects and complicates isolated tests, alternate frontends,
replay tools, editors, and server-side use.

The React hook and Zustand bridge live under `src/game/`, while the enforceable pure boundary is
actually `engine` plus most `content`. The current directory rule can be misunderstood as “all game
code is framework-independent” even though application integration lives there. No dependency rule
mechanically protects the intended layering.

`config.ts` and `simulation.ts` are broad, ambiguously named barrels. They make imports convenient
but obscure the narrow contracts consumers actually need.

### U-14 — Large modules and broad facades weaken ownership and dependency control

Several central files have accumulated multiple change reasons:

- `save.ts` combines live codecs, frozen versions, migrations, validation, storage, and scheduling.
- `campaign.ts` combines campaign content, copy, loadouts, waves, availability, traversal, and
  intended playtest policy.
- `styles.css` is a single global stylesheet for component, modal, map, tutorial, and responsive
  presentation.
- `commands.ts`, `combat.ts`, `reactions.ts`, `RoomInspector.tsx`, `Modals.tsx`, and transport
  graphics each group several independently evolving concepts.
- `config.ts` and `simulation.ts` export large surfaces rather than explicit application, query,
  and test contracts.

Large files are a symptom, not the architectural diagnosis. The issue is low locality: file names
no longer correspond to one ownership domain, migrations grow beside live logic, and broad barrels
make dependency direction difficult to inspect or enforce.

### U-15 — Verification is weakest around policy, UI integration, and extension pressure

The suite is strong on important simulation invariants but uneven at the boundaries most likely to
change:

- the validated run reported 81 tests and 64.64% overall branch coverage;
- command, campaign-command, phase, and transport-telemetry branch coverage is particularly low;
- there are no `.test.tsx` component tests, and the test include pattern covers only `.test.ts`;
- UI availability, store composition, save scheduling, and many browser boundary cases lack direct
  tests;
- Playwright's deterministic injector bypasses parts of the production integration it appears to
  validate;
- coverage is reported without thresholds;
- the local CI contract omits the production build, browser suite, and headless campaign health;
  and
- there is no extension-oriented contract test proving that a new state field, reaction,
  equipment type, or ruleset fails loudly when lifecycle wiring is incomplete.

More tests alone are not the objective. The missing tests should make architectural contracts
executable: source immutability, schema/type alignment, semantic save validity, command decision
parity, production time flow, intended campaign viability, and narrow public APIs.

### U-16 — Localized debt increases maintenance friction

The reviews also identified smaller issues that should be retained in the backlog:

- mixture summaries use duplicated and inconsistent thresholds and labels;
- gas-zone classification is expressed separately for ports and enemies;
- event and incident history caps are unnamed literals;
- reaction/physics tuning includes many unnamed magic values;
- `CycleStats`/`CycleReport` aliases coexist with the canonical `Round*` names;
- `simulateEnemies` appears to be an unused public export;
- accepted/rejected command-result helpers are repeated across command modules;
- `Object.fromEntries` construction produces repeated unsafe assertions;
- the enemy save progress invariant relies on convention rather than one documented contract;
- tutorial selectors are untyped string coupling to DOM details; and
- save-version documentation has drifted.

These are not separate architectural programs. Each should be addressed when its owning boundary
is changed, avoiding unrelated cleanup-only churn.

## SOLID and clean-design assessment

SOLID is useful here as a set of pressure tests, not as an argument for class hierarchies.

- **Single Responsibility:** generally good within small engine modules, but weak in persistence,
  the application store, broad content files, presentation-producing analysis, and global styling.
- **Open/Closed:** the weakest principle. Reactions, equipment, hazards, processes, phases, and
  facilities require central edits rather than typed extension through authoritative definitions.
- **Liskov Substitution:** largely not applicable because the architecture is functional and uses
  little behavioral inheritance.
- **Interface Segregation:** weakened by the broad `GameState` snapshot, whole-game UI
  subscriptions, and a simulation facade that exposes low-level mutators beside safe entry points.
- **Dependency Inversion:** strong at the React/Pixi-to-engine boundary, weak inside the domain
  because engine modules import concrete global catalogs and one facility.
- **DRY:** the most consequential duplication is semantic, not cosmetic: reaction definitions vs.
  execution, equipment copy vs. values, UI availability vs. command rules, state types vs. schemas,
  and shared gas/liquid planning behavior.

## Target architecture characteristics

The remediation should aim for these outcomes without imposing a particular library or class
model:

1. A scenario is evaluated against an explicit immutable `GameDefinition`/ruleset rather than
   hidden module globals.
2. Content definitions are authoritative for declarative parameters. Exceptional behavior uses
   typed strategies or handlers with exhaustiveness checks.
3. Application callers have a narrow immutable transition/query API. Mutable subsystems are
   internal or explicitly test-only.
4. One command decision model drives execution, UI availability, tutorial guidance, cost previews,
   and rejection reasons.
5. Runtime state has one deliberate construction/cloning/update strategy with executable
   completeness checks.
6. Persistence separates byte decoding, migrations, semantic validation/canonicalization, storage,
   and scheduling.
7. Domain events use stable codes and structured payloads; rendering owns final copy.
8. Browser tests exercise production time and dispatch. Deterministic fixtures enter through a
   visible test harness rather than hidden post-command mutation.
9. UI consumers subscribe to purpose-built selectors/view models instead of the entire mutable
   world by default.
10. CI represents product health: type/lint/unit checks, buildability, campaign viability, and a
    small production-path browser smoke suite.

## Remediation plan for review

### Guiding constraints

- Preserve deterministic, headless simulation throughout the work.
- Make behavior-preserving changes under characterization tests before changing rules or balance.
- Do not combine a save-format change, balance change, and engine abstraction in one migration.
- Prefer typed functional composition over introducing class hierarchies solely to satisfy SOLID
  terminology.
- Extract only demonstrated gas/liquid commonality; keep phase-specific physics readable.
- Avoid a speculative mod/plugin framework. Establish explicit composition boundaries first.
- Measure snapshot/render costs before adopting a new state library or large UI rewrite.
- Keep old saves loadable through frozen migrations, followed by current semantic validation.

### Phase 0 — Agree on boundaries and establish a regression baseline

**Purpose:** remove architectural ambiguity before code movement and capture current behavior.

Proposed work:

1. Record short decisions for:
   - whether multiple facilities/rulesets are an expected post-MVP capability;
   - the authoritative ownership of mechanics, balance values, and display copy;
   - the intended public engine API;
   - the state update/clone strategy; and
   - the compatibility policy for old saves and persisted event copy.
2. Characterize current deterministic behavior with golden seeds for reactions, transport,
   combat, phase transitions, and campaign policies.
3. Add or specify architecture tests for source-state non-mutation and deep clone independence.
4. Capture a performance baseline: tick time, clone time, serialized save size/time, React render
   counts, repeated room analysis, and Pixi draw frequency on representative levels.
5. Confirm and document the intended campaign result for each reference policy. The current Level
   2–4 failures need a product decision: defects to correct, obsolete policies to replace, or
   intended failures to encode explicitly.

**Exit criteria:** target boundaries are agreed; deterministic and performance baselines are
repeatable; expected campaign outcomes are explicit; no major refactor begins with an unknown
behavioral baseline.

### Phase 1 — Repair correctness and trust boundaries

**Purpose:** ensure persisted states, commands, and tests tell the truth before restructuring the
engine.

Proposed workstreams:

#### 1A. Semantic state validation

- Define a current-state semantic validator separate from Zod structural decoding.
- Validate/canonicalize conduit topology, authored endpoints, record key/ID agreement, campaign
  indices and availability, phase invariants, navigation, and cross-field consistency.
- Run semantic validation after new-game construction and migrations, and at appropriate debug/test
  boundaries.
- Specify whether invalid local saves are rejected, repaired, quarantined, or reset; do not silently
  render a different topology than the solver uses.

#### 1B. Command decision parity

- Establish one domain-level command evaluation result containing availability, rejection code,
  calculated cost/refund, and any safe preview data.
- Make execution consume the same evaluation rather than reimplementing validation.
- Make UI controls and tutorial predicates consume decision/query results rather than duplicate
  policy.
- Normalize handlers to validate first and apply second.

#### 1C. Honest browser integration tests

- Remove the E2E evidence injector from normal store dispatch and clock selection.
- Separate deterministic fixture construction from production behavior behind an explicit test
  harness/composition entry point.
- Ensure at least one browser causal-chain test uses the real clock, conduits, spawn, navigation,
  simulation order, and command path.
- Replace tutorial coupling to arbitrary CSS selectors with stable shared anchor identities.

#### 1D. Campaign health gate

- Make reference-policy results machine-readable with nonzero failure status when an asserted policy
  fails.
- Correct the Level 2–4 content/engine/policy mismatch after its cause is diagnosed.
- Add a deterministic, bounded campaign-health job once all asserted policies are valid.

#### 1E. Stable event identity

- Introduce stable event/incident codes and structured payloads for behavioral identity.
- Stop deduplicating by rendered title.
- Define migration/display behavior for historic events already persisted as prose.

**Exit criteria:** structurally valid but semantically unsafe saves cannot enter simulation;
displayed action availability agrees with authoritative command evaluation; browser smoke tests no
longer fabricate their causal chain; intended campaign policies pass or are explicitly classified;
copy changes cannot alter event identity.

### Phase 2 — Establish explicit ruleset and executable-content boundaries

**Purpose:** make normal content additions local and make the engine reusable without a premature
plugin architecture.

Proposed workstreams:

#### 2A. Explicit game definition

- Define an immutable composition object containing facility topology, rooms, materials,
  reactions, equipment, processes, transport definitions, enemies, campaign content, and relevant
  rule parameters.
- Construct a scenario from a definition and carry or inject that definition through engine query
  and transition entry points.
- Remove module-initialized caches tied to the singleton facility or scope caches by definition.
- Keep a default application definition so normal call sites stay simple.

#### 2B. Authoritative reaction model

- Make reaction definitions own stoichiometry and content-level tuning.
- Use a generic, conservation-aware executor for ordinary reactions.
- Represent genuinely exceptional eligibility, phase interaction, or side effects through a small
  typed strategy/handler key rather than another copy of the equation.
- Test that declared and executed material deltas agree and conserve elements.

#### 2C. Authoritative equipment, process, and hazard models

- Move numeric equipment grades/effects out of display prose and make presentation derive from the
  same structured values.
- Give equipment/process behaviors typed executor identities and explicit dependencies rather than
  scattered identifier checks.
- Move species-owned hazard parameters into authoritative definitions while keeping generic hazard
  math in the engine.
- Separate solver constants from balance/content constants so tuning surfaces are inspectable.

#### 2D. Canonical identity definitions

- Derive runtime ID arrays, union types, exhaustive records, and enum schemas from one canonical
  definition where practical.
- Clarify ownership among room IDs, room definitions, facility geometry, and ordering.
- Replace repeated typed-record assertions with well-tested construction helpers.

**Exit criteria:** an ordinary reaction/equipment/species addition changes authoritative content and
an intentional typed behavior extension point, not unrelated engine switches; two definitions can
be instantiated in one process; executable effects and displayed values cannot silently diverge.

### Phase 3 — Harden state, phase, persistence, and application ownership

**Purpose:** make state evolution predictable and separate long-lived domain concerns from browser
application concerns.

Proposed workstreams:

#### 3A. State lifecycle strategy

- Choose between a verified explicit clone, generated/schema-backed cloning, or structural-sharing
  updates based on Phase 0 correctness and performance evidence.
- Ensure adding a reference-valued state field fails a completeness test unless construction,
  update, clone, and persistence behavior are defined.
- Separate durable domain state from ephemeral UI/test/application state.
- Normalize repeated dimensional structures such as per-zone analysis where it improves
  exhaustiveness.

#### 3B. Explicit phase model

- Centralize legal transitions, step/static semantics, entry/exit effects, and allowed commands.
- Derive phase availability queries for UI/tutorial use.
- Add semantic invariants for phase-specific state.
- Keep the model functional and data-oriented; a class-based state pattern is not required.

#### 3C. Persistence decomposition

- Separate the current codec, frozen legacy codecs/migrations, semantic validation, browser storage,
  and scheduling into owned modules.
- Treat migrations as immutable compatibility code with fixtures.
- Decode structurally, migrate, validate semantically, and only then expose current `GameState`.
- Update save-version documentation as part of each version change.

#### 3D. Application composition

- Separate domain game state/dispatch from selected-room, notice, help, tutorial, and modal state.
- Move browser save restoration out of module-import side effects into explicit application
  initialization.
- Define narrow composition adapters for the browser UI, headless runner, and test harness.
- Replace broad/misleading barrels with explicit application, transition, query, content, and
  test-support entry points.

**Exit criteria:** state extensions have an executable completeness contract; phase behavior has one
authoritative model; loading is an explicit decode/migrate/validate pipeline; importing a module
does not restore browser state; application callers cannot reach internal mutable subsystems by
accident.

### Phase 4 — Consolidate proven duplication and decouple UI scaling

**Purpose:** reduce drift and performance coupling after correctness boundaries are stable.

Proposed workstreams:

#### 4A. Material and transport reuse

- Introduce typed mixture primitives for add/subtract/take/total/allocation operations.
- Characterize gas and liquid planners, then extract their shared planning, capacity reconciliation,
  blocked-state, and telemetry lifecycle.
- Keep phase-specific drive equations, temperature rules, source/sink behavior, and safety rules
  isolated and named.
- Make migrations reuse safe domain primitives only when doing so does not make frozen migration
  behavior depend on changing live code.

#### 4B. Query and render models

- Introduce memoized or per-snapshot selectors for expensive room analysis and command decisions.
- Subscribe components to narrow view models instead of the entire game where it materially reduces
  work.
- Narrow Pixi drawing dependencies to the state each layer renders.
- Correct unit/label inconsistencies as presentation models become structured.

#### 4C. Publication and persistence performance

- Use Phase 0 measurements to decide whether structural sharing, lower publication frequency,
  separate simulation/render cadence, or dirty-aware persistence is warranted.
- Establish regression budgets rather than optimizing by intuition.
- Preserve deterministic fixed-step semantics regardless of render cadence.

#### 4D. Cohesion cleanup

- Split large files along stable ownership boundaries, not arbitrary line counts.
- Divide global styles by component/feature ownership if the build system supports it cleanly.
- Remove stale aliases/dead exports and centralize shared zone, summary, cap, and tuning concepts
  alongside the structural work that owns them.

**Exit criteria:** shared gas/liquid policy has one implementation without hiding distinct physics;
room analysis is computed once per relevant snapshot; unchanged UI/map regions avoid unnecessary
work; save scheduling and rendering no longer scale only as functions of the entire game snapshot.

### Phase 5 — Make architecture and product health enforceable

**Purpose:** prevent the same gaps from returning as content and contributors increase.

Proposed work:

1. Add dependency-boundary checks that prevent UI/browser imports in domain engine/content modules
   and prevent application code from importing internal mutators.
2. Add targeted branch coverage thresholds for command/phase/persistence policy rather than chasing
   a single global percentage.
3. Add component tests for decision rendering, notices, phase actions, and store initialization.
4. Include the production build and a bounded production-path browser smoke suite in the supported
   CI contract.
5. Include deterministic campaign reference checks once their expected policies are healthy.
6. Add architectural extension fixtures or compile-time tests for:
   - a new state field;
   - a new ordinary reaction;
   - a new equipment grade/type;
   - a new species with hazards; and
   - a second minimal game definition/facility.
7. Keep architecture and save-version documentation validated as part of relevant changes.

**Exit criteria:** CI fails when architectural contracts drift; representative extension exercises
are local and explicit; production-path browser behavior and intended campaign viability are part
of the definition of a healthy build.

## Sequencing and dependency map

```text
Phase 0: decisions + characterization + measurements
   |
   +--> Phase 1: correctness/trust boundaries
   |       |-- semantic saves
   |       |-- command decision parity
   |       |-- honest E2E
   |       |-- campaign health
   |       `-- stable events
   |
   +--> Phase 2: explicit definition + executable content
   |       `-- depends on Phase 1 regression protection
   |
   +--> Phase 3: state/phase/persistence/application ownership
   |       `-- coordinates with the definition boundary from Phase 2
   |
   +--> Phase 4: reuse + UI/performance scaling
   |       `-- depends on stable state/query contracts and baseline measurements
   |
   `--> Phase 5: enforcement
           `-- added incrementally, completed after the target seams exist
```

Phase 1 should begin before major new content work. Phases 2 and 3 can be split into small vertical
changes, but their contracts must be coordinated: a ruleset context affects scenario construction,
state queries, saves, and public engine entry points. Phase 4 should not become the opening move;
otherwise transport and UI abstractions will be built on state and policy boundaries that are still
changing.

## Proposed delivery slices

The phases are architectural outcomes, not an instruction to make five large branches. A reviewable
delivery sequence would look like this:

| Slice | Scope                                                                                    | Primary risk controlled                         |
| ----- | ---------------------------------------------------------------------------------------- | ----------------------------------------------- |
| 1     | ADRs, deterministic baselines, clone/source immutability tests, performance measurements | Refactoring without known contracts             |
| 2     | Semantic save validation and topology/campaign invariants                                | Executing invalid persisted state               |
| 3     | Shared command evaluation used by one end-to-end control family                          | UI/domain policy drift                          |
| 4     | Remove post-dispatch E2E injection; add one real-clock browser scenario                  | False integration confidence                    |
| 5     | Diagnose/fix reference policies and make evaluator enforceable                           | Shipping broken campaign paths                  |
| 6     | Stable event codes and structured payloads                                               | Copy changing behavior/persistence identity     |
| 7     | Introduce explicit default `GameDefinition` through one engine vertical                  | Hidden global dependency                        |
| 8     | Move one ordinary reaction and one equipment family to authoritative definitions         | Validate extension model before broad migration |
| 9     | Complete definition/ruleset migration and canonical IDs                                  | Cross-repository content edits                  |
| 10    | State lifecycle and phase model hardening                                                | Silent state drift and scattered transitions    |
| 11    | Persistence/store/facade decomposition                                                   | Mixed ownership and import side effects         |
| 12    | Characterized material/transport reuse                                                   | Gas/liquid policy drift                         |
| 13    | Selector/render/persistence scaling based on measurements                                | Whole-snapshot growth cost                      |
| 14    | CI architecture, campaign, component, and browser gates                                  | Regression of the new boundaries                |

Each slice should keep saves loadable, preserve deterministic seeds unless a deliberate rules change
is documented, and avoid mixing unrelated cleanup.

## Decisions requested before implementation

The following choices materially affect the design and should be resolved during review:

1. **Extensibility target:** Is a second facility/ruleset a real expected capability, or is the goal
   only easier maintenance of one facility? The recommended base supports multiple explicit
   definitions without promising third-party plugins or runtime mod loading.
2. **Mechanics model:** Should ordinary reactions be fully definition-driven with typed exceptional
   strategies, or should every reaction keep a bespoke handler? The hybrid model best preserves
   unusual chemistry while eliminating duplicated stoichiometry.
3. **State update strategy:** Retain an optimized explicit clone with generated/completeness guards,
   adopt structural sharing, or use a library-assisted immutable update model? Decide from measured
   tick/clone behavior and debugging needs, not fashion.
4. **Persisted events:** Preserve rendered historic copy exactly, or migrate toward event codes plus
   structured parameters and render with current copy? This affects replay fidelity and save
   compatibility.
5. **Invalid-save policy:** Reject/reset, attempt deterministic repair, or expose recovery choices?
   Semantic validation must be strict regardless, but user experience is a product decision.
6. **Campaign gate semantics:** Must every authored intended policy pass every level, or are some
   reference policies demonstrations rather than success assertions? The CLI contract should encode
   that distinction explicitly.
7. **Performance budget:** What representative hardware and maximum content scale define acceptable
   tick, render, and save costs? Without a target, “optimize the store” has no completion criterion.
8. **CI cost envelope:** Which browser and campaign checks run per commit versus nightly/pre-release?
   A small production-path smoke gate should still run in the normal supported CI path.

## Recommended priority order

If only a limited amount of architectural work can happen before the next feature wave, prioritize:

1. semantic save validation and clone/source immutability guarantees;
2. command decision parity between domain and UI;
3. removal of hidden E2E state injection plus one honest browser causal-chain test;
4. diagnosis and enforcement of intended campaign viability;
5. an explicit ruleset/game-definition boundary;
6. authoritative reaction/equipment/hazard data with stable event identity;
7. state, phase, persistence, store, and facade ownership;
8. characterized gas/liquid reuse; and
9. measured UI/render/persistence optimization.

This order treats correctness and test trust as prerequisites for extensibility work. It also avoids
spending the first post-MVP cycle on performance or abstraction without evidence.

## Completion criteria for the remediation program

The base can be considered durable for post-MVP growth when:

- a new ordinary reaction has one authoritative equation and one structured tuning definition;
- a new equipment type or species does not require unrelated UI prose and engine constant copies;
- a second minimal facility/ruleset can run beside the default without replacing module globals;
- adding state cannot silently omit clone or persistence behavior;
- every loaded game is structurally decoded, migrated, and semantically validated;
- UI action availability, price/refund previews, and execution use the same decision model;
- production E2E scenarios do not depend on fabricated post-command state;
- all asserted reference campaign policies pass in an enforced deterministic check;
- display-copy changes cannot alter event identity or simulation rules;
- application callers cannot accidentally invoke mutable subsystems out of order;
- phase transitions and phase-specific invariants have one authoritative model;
- transport reuse removes shared policy duplication while retaining readable phase physics;
- measured tick, render, analysis, and save costs stay within an agreed content-scale budget; and
- CI prevents violations of the new dependency and behavior contracts.

## Final conclusion

The three reviews agree that Catalyst Castellum should be evolved, not rebuilt. Its deterministic
functional engine, command seam, render projections, content catalogs, and save migrations are the
right raw materials. The main problem is incomplete authority: definitions, types, schemas, UI
policy, test adapters, and engine behavior each own overlapping pieces of the truth.

The remediation program should first make correctness and test claims reliable, then introduce an
explicit definition/ruleset boundary, harden state and persistence ownership, and finally consolidate
proven duplication and optimize measured bottlenecks. That sequence provides a solid post-MVP base
without turning a focused simulation game into an unnecessary framework.
