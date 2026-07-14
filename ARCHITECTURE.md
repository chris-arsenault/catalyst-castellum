# Catalyst Castellum architecture

This document records the post-MVP architecture contract established by the 2026-07 remediation.
It is normative for new features; the historical review reports explain why these boundaries were
chosen.

## Direction of dependency

```text
authored pack -> compiler -> immutable definition -> engine runtime / queries
      |                                      |                 |
      +-> reference health plans             +-> save codec    v
locale bundle -> typed translator/formatters -> presentation services -> application -> React/Pixi
```

- `src/game/content/**` authors mechanics only. Each level owns one module, campaign order is an
  explicit registry, and reference playtest plans are separate health fixtures.
- `src/game/authoring/compiler.ts` validates identities, references, reaction balance, routes,
  loadouts, waves, cumulative availability, and featured reactions, then deep-freezes the pack.
- `src/game/definition.ts` composes the default `GamePackSource` into an immutable
  `GameDefinition`. Facility caches are scoped to that definition.
- `src/game/engine/**` owns deterministic mechanics. It has no React, Pixi, Zustand, DOM, or browser
  dependency.
- `src/game/runtime.ts` is the public transition facade. A `GameRuntime` binds creation, command
  evaluation/execution, stepping, validation, and campaign queries to one definition.
- `src/game/queries.ts` is the read-only application query facade. UI code may not import engine
  internals or the broad test-support `simulation.ts` barrel.
- `src/localization/**` owns typed locale bundles, placeholder validation, formatters, and English
  copy for static UI, accessibility text, tutorials, commands, entities, levels, events, manual
  content, and presentation readouts.
- `src/presentation/**` binds a runtime and locale into event/command copy, catalogs, formatters,
  and memoized view models. `defaultGame.ts` is the single default-pack composition seam.
- `src/application/**` receives runtime and presentation services as dependencies, injects the
  selected presentation through `GamePresentationProvider`, and composes game-session/UI slices,
  startup, persistence scheduling, selection, help, notices, and tutorial progress.
- `src/components/**` and `src/tutorial/**` render and dispatch; they do not author simulation
  policy.

`pnpm architecture:check` enforces the dependency direction, forbids default content/engine imports
from application/UI code, and detects cross-layer module cycles. `pnpm copy:check` uses the
TypeScript AST to reject display fields in mechanical content, current-locale prose in the engine,
raw tutorial authoring copy, and literal UI/accessibility copy. `pnpm locales:check` checks locale
completeness and placeholder parity.

## Settled decisions

### Extensibility target

Multiple explicit facilities and balance variants are supported in one process. Third-party
plugins and runtime mod loading are not current goals. `deriveGame` is the local extension seam;
`createGameRuntime` binds the resulting definition without replacing globals.

### Mechanics and balance

Definitions own content-level parameters. Generic engine executors own numerical mechanics:

- reaction definitions own stoichiometry and typed behavior tuning;
- the reaction executor applies declared material deltas and checks available extent;
- equipment grades own typed behaviors, rates, targets, costs, and occupied volume;
- species own hazard rules, while physics owns generic aggregation;
- environmental hazard rules belong to the game definition;
- gas/liquid-specific drive equations remain separate, while mixture and transport planning
  primitives are shared.

Exceptional mechanics use discriminated behavior identities rather than free-text effect strings.
Display copy is derived from the same structured values under `src/presentation`.

### State lifecycle

The engine retains explicit immutable snapshots and an optimized explicit clone. This choice is
supported by recursive source-mutation/deep-independence tests and the measured clone cost below.
Every reference-valued field must be added to construction, clone, persistence, and validation; the
deep-independence test fails if clone coverage is incomplete.

Durable `GameState` contains only domain state. Browser/UI state remains in the application layer.
Simulation functions either return the source unchanged or a detached snapshot. In-place subsystem
mutators are internal and must be reached through `GameRuntime.step` or command execution.

### Phase ownership

`engine/phaseModel.ts` is authoritative for live/static semantics, allowed command types, and legal
transitions. Command evaluation consumes it before command-specific policy; stepping consumes its
static/live policy; transition helpers apply shared entry invariants. UI availability comes from
the same command decision model.

### Commands

`evaluateCommand` produces the authoritative allowed/rejected result, stable rejection code, typed
parameters, cost, refund, and amount. Execution consumes that decision. Presentation converts the
code and values to locale copy. UI and tutorial controls use memoized decision selectors and do not
reproduce affordability, placement, phase, refund, or rejection prose.

### Events and persisted copy

Current events use stable codes and structured parameters. Presentation derives current copy; copy
changes cannot affect deduplication or simulation identity. Historic prose events migrate to the
`legacy_message` code and retain their old text as compatibility parameters.

Reaction/process limiting factors likewise use structured species or condition identities.
Historic labels are retained only in the explicit `legacy` compatibility variant.

### Persistence and invalid saves

Save V12 is current. Every state carries `{ pack.id, pack.contentVersion }`; a runtime rejects state
owned by another pack. V7–V11 remain readable through frozen compatibility schemas and migrations;
the conserving compatibility transforms are isolated in `persistence/legacySaveMigrations.ts`.
The pipeline is:

```text
untrusted JSON -> structural decode -> version migration -> semantic validation -> GameState
```

Semantic validation covers topology/endpoints, identity records, campaign/availability agreement,
phase invariants, portals, navigation identities, and monotonic event/enemy/incident IDs. Invalid
local saves are rejected. Application initialization only enumerates three named slots; it never
automatically activates a simulation. Each slot envelope owns one validated `GameState`, its
tutorial-dismissal record, and save metadata. Refresh therefore returns to slot selection, while an
explicit load restores both game and tutorial state. Legacy unslotted saves migrate once into slot
one. Browser storage and slot-aware debounced/flushable scheduling are application concerns,
separate from the pure codec; reset cancels stale pending writes before replacing the active slot.

### Campaign health

Every authored intended reference policy must pass deterministically, remain stable, and beat its
do-nothing control. `pnpm campaign:health` enforces seed `13371` and exits nonzero on a mismatch.
All five current levels satisfy that contract.

## Performance contract

The repeatable baseline is `pnpm performance:baseline`; CI runs the deliberately generous
regression budget with `pnpm performance:check`. The representative state is the Commissioning Exam
after prime plus eight simulated seconds.

Baseline measured on the repository development container on 2026-07-13:

| Operation                         |         Mean |
| --------------------------------- | -----------: |
| Explicit clone                    |     0.064 ms |
| Fixed 0.1 s step                  |      1.77 ms |
| Save encode                       |     0.154 ms |
| Save decode + semantic validation |      1.22 ms |
| Cached room analysis lookup       |   0.00010 ms |
| Room render projection            |     0.023 ms |
| Serialized save size              | 36,453 bytes |

The budgets are 10 ms clone, 50 ms fixed step, 25 ms encode/decode, and 2 MB save size. These are
regression tripwires, not promises for every device. Pixi and tutorial code are lazy-loaded so the
initial application bundle does not absorb the whole rendering stack. Room analysis and command
decisions are cached per immutable snapshot/reference.

## Extension checklist

### New level

1. Add one rules module under `src/game/content/levels/`.
2. Add it to the explicit ordered registry in `content/campaign.ts`.
3. Add its English level/round keys under `src/localization/locales/en/levels.ts`.
4. Add its reference health plan to `content/playtestPlans.ts`.
5. Let pack compilation validate every enemy, route, loadout, availability, and reaction reference.

### Ordinary reaction

1. Add the canonical ID and one definition with balanced participants and a reusable behavior
   strategy (`gas_recombination`, `absorption`, or `mixed_contact`).
2. Use the generic executor; add a named strategy only for genuinely new phase/side-effect behavior.
3. Add exact-delta and elemental-conservation tests.
4. Add its entity/manual locale keys. A reaction using an existing strategy requires no engine or
   component change.

### Enemy

1. Add the mechanical definition and choose a reusable `presentation.appearance` and `manualIcon`.
2. Add entity/manual locale keys and use the enemy from a level wave.
3. Add a renderer only when introducing a genuinely new appearance archetype.

### Guided level

1. Author state conditions with the typed condition evaluator.
2. Register one provider in `GUIDE_REGISTRATIONS`; renderer and phase-action dispatch stay generic.
3. Add typed tutorial keys under `src/localization/locales/en/` for story, mission, task, step,
   completion, and phase-gate copy.
4. Add a specialized reaction gate only for a new reaction behavior. Levels select featured
   reactions as authored data.

### Copy or locale

1. Edit English catalog modules under `src/localization/locales/en/`.
2. Run `pnpm copy:export` for a context-grouped review document.
3. Add the same keys and placeholders to another locale bundle; `pnpm locales:check` validates it.
4. Preserve formulas, stable process codes, asset paths, CSS classes, test IDs, and explicit legacy
   saved prose as nonlocalized values.

### Equipment or grade

1. Add the canonical identity and structured grade behavior to the equipment definition.
2. Extend the discriminated behavior executor only when the behavior kind is new.
3. Derive grade display from the structured behavior; do not add a duplicate prose effect value.
4. Exercise command placement/cost and behavior in tests.

### Species hazard

1. Add the canonical identity, formula/composition, physical properties, and hazard rules.
2. Generic hazard aggregation consumes those rules; no species branch belongs in physics.
3. Add catalog and exposure tests.

### Facility/ruleset

1. Compose or derive an immutable `GameDefinition`.
2. Create a scoped runtime with `createGameRuntime`.
3. Validate scenarios before execution. Never replace module-global facility caches.

### Durable state field

1. Define construction/default semantics.
2. Update the explicit clone and prove deep independence.
3. Update the current save schema and version/migration policy.
4. Add semantic invariants where cross-field validity exists.

## Verification contract

`make ci` runs architecture boundaries, performance budgets, lint, formatting, typecheck, unit and
component tests with targeted coverage thresholds, production build, deterministic campaign health,
and Terraform formatting. GitHub CI additionally runs the production-path causal-chain Playwright
smoke in Chromium. The complete browser suite remains available through `pnpm test:e2e`.
