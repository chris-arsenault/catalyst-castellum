# Authoring, engine, UI, and localization implementation plan

Status: active implementation ledger

Progress:

- Phase 1: complete (definition-neutral engine, bound runtime/query/presentation selectors)
- Phase 2: in progress (V12 pack identity and definition-aware codec complete; authoring compiler and
  modular level registry remain)
- Phases 3-6: pending

This plan turns the 2026-07 architecture review into an enforceable repository design. It is the
durable source of truth for the migration and must be updated as implementation discoveries change
the work. A phase is complete only when its acceptance checks pass; moving files without enforcing
the boundary does not complete a phase.

## Target dependency graph

```text
authored rules -> authoring compiler -> compiled game definition -> engine runtime
       |                                                    |
       +-> health/reference plans                           v
       +-> presentation traits                       application selectors
                                                            |
locale bundles -> typed formatter -> presentation models -> UI
```

The engine owns deterministic mechanics and semantic result codes. Authoring owns mechanics data,
campaign composition, and reusable presentation traits. Locale bundles own player-facing language.
Presentation owns formatting and view models. Application binds one compiled definition, runtime,
and locale. Components render view models and dispatch typed commands.

## Cross-cutting completion criteria

- `src/game/engine/**` imports neither default content nor a default game definition.
- Engine commands and durable state contain semantic codes and typed values, not current-locale
  player copy. Explicit legacy save prose remains a compatibility exception.
- Components, tutorials, application code, and audio import neither `game/config` nor
  `game/content` nor `game/engine`.
- A copy editor can revise English player-facing language under one locale root without opening
  mechanics or component files.
- Locale validation checks missing keys, extra keys, and placeholder parity.
- Saves identify the game pack and content version that owns their state.
- Adding a level, an enemy reusing an appearance, or a reaction using an existing strategy does not
  require an engine or component edit.
- Architecture tooling detects forbidden imports and cycles between engine, definition, content,
  presentation, application, and UI layers.
- The existing save migrations, deterministic campaign health, and browser behavior remain intact.

## Phase 1: engine contracts and runtime binding

1. Move shared engine-facing definition contracts and spatial primitives into neutral modules.
2. Split authored definition source from compiled definition.
3. Remove `DEFAULT_GAME_DEFINITION` default parameters from engine modules.
4. Make `createGameRuntime` close over one compiled definition and expose bound transition and query
   services.
5. Route presentation selectors through the bound runtime instead of importing engine modules.
6. Keep compatibility barrels only for tests, with the default runtime passed explicitly.

Acceptance:

- Engine-to-definition and engine-to-content import counts are zero.
- Two runtimes can evaluate, query, render projections, and save independently in one process.

## Phase 2: compiled authoring packs and persistence identity

1. Add a `GamePackSource` and compiler that validates IDs, references, balanced reactions, routes,
   loadouts, waves, cumulative availability, guide targets, and non-empty rounds.
2. Give compiled packs an immutable `packId` and integer `contentVersion`.
3. Store pack identity in `GameState` and save envelopes; reject saves owned by another pack.
4. Make current save decoding definition-aware while preserving V7-V11 migration behavior.
5. Split the campaign monolith into one module per level plus an explicit ordered registry.
6. Keep reference playtest plans beside authoring modules but exclude them from runtime level rules.

Acceptance:

- Invalid authored references fail compilation before a scenario can start.
- An existing save round-trips with pack identity and legacy saves migrate to the default pack.
- A new level is one rules module, one registry entry, one locale entry, and one health plan.

## Phase 3: reusable extension seams

1. Replace reaction-ID scheduling with a registry keyed by reaction behavior strategy.
2. Express ordinary rate limits, phase scope, headroom, heat, telemetry, and event triggers as typed
   authored behavior configuration.
3. Keep genuinely exceptional behavior, such as an instantaneous flash, in a named engine strategy.
4. Store room reaction telemetry as a definition-derived dynamic record.
5. Add enemy appearance archetypes and manual icon traits to authored presentation metadata.
6. Make renderers switch on reusable archetypes rather than concrete enemy IDs.
7. Replace tutorial level dispatch and component-specific gates with authored guide registrations and
   a typed condition evaluator.

Acceptance:

- A fixture adds an ordinary reaction using an existing strategy without editing engine/UI code.
- A fixture adds an enemy using an existing archetype without editing engine/UI code.
- A fixture adds a guided level without editing tutorial renderer/component dispatch code.

## Phase 4: typed localization and copy ownership

1. Create one locale root with namespaces for UI, entities, levels, events, commands, manual, and
   tutorials.
2. Replace display fields in mechanical definitions with stable semantic IDs resolved by locale.
3. Replace command rejection prose with a rejection code and typed interpolation values.
4. Define event payloads as a code-to-parameter map so message placeholders are type-safe.
5. Centralize number, list, plural, date, duration, percentage, and measurement formatting.
6. Move JSX text, accessibility labels, titles, notices, tutorial prose, manual prose, and metadata
   into the English locale catalog.
7. Keep formulas, stable process codes, asset paths, test IDs, CSS classes, and explicit legacy saved
   prose outside localization.
8. Add locale validation and a copy export command that emits the English catalog grouped by player
   context for review.

Acceptance:

- Normal English copy edits touch locale files only.
- A second complete test locale can be registered without mechanics or UI changes.
- UI tests assert semantics/keys except for focused localization rendering tests.

## Phase 5: presentation and UI boundary

1. Create bound presentation services that convert domain state to localized view models.
2. Move raw catalog enumeration, phase labels, room/reaction panels, tooltips, and manual projections
   out of components.
3. Keep high-frequency Pixi projections pure and definition-bound.
4. Make application composition inject runtime and presentation services.
5. Restrict components to application hooks, presentation models, UI-local state, and semantic
   command dispatch.

Acceptance:

- Production components do not import broad game state/catalog modules.
- Alternate definitions are reflected correctly in application selectors and visual projections.

## Phase 6: enforcement, fixtures, documentation, and verification

1. Strengthen `architecture:check` with the complete dependency matrix and cycle detection.
2. Add fixture packs proving level/enemy/reaction/guide extension contracts.
3. Add locale completeness, placeholder parity, raw-copy, and copy-export tests.
4. Update `ARCHITECTURE.md`, the README extension guide, and save-version documentation.
5. Run architecture checks, performance budgets, lint, formatting, typecheck, coverage, production
   build, campaign health, Terraform formatting, and the complete Playwright suite.

Acceptance:

- `make ci` and `pnpm test:e2e` pass.
- The architecture checker fails representative forbidden-import and cycle fixtures.
- The worktree contains no temporary compatibility exception without a documented removal reason.

## Implementation notes

- Preserve TypeScript authoring and add compilation/validation; do not replace mechanics with
  untyped JSON.
- Prefer explicit registries where order is gameplay-significant. Automatic file discovery must not
  decide campaign order.
- Data-only extension applies to new instances of existing mechanics. New mechanical or visual
  behavior intentionally requires a new strategy implementation.
- Keep changes save-compatible wherever possible. Any required current-schema change receives a new
  save version and a conserving migration.
- Review every moved or modified player-facing English string against `AGENTS.md` before completion.
