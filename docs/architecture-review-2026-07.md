# Architecture review: engine, authoring, UI, and copy

Date: 2026-07-14

## Executive assessment

The repository began with a sound deterministic simulation but weak composition boundaries: the
engine frequently reached the default definition, a campaign file mixed every level with playtest
instructions, concrete reaction/enemy IDs leaked into presentation branches, and player copy lived
across mechanics, presentation helpers, tutorial authoring, and JSX.

The implemented architecture now has four explicit ownership zones:

```text
mechanical TypeScript source -> pack compiler -> immutable GameDefinition -> GameRuntime
            |                                                |
            +-> reference health plans                       +-> semantic events/results

typed locale bundle -> formatters + presentation services -> application composition -> UI
```

The most important result is that extension cost is proportional to the kind of change. A level is
a level module plus registry/locale/health entries. An ordinary reaction selects an existing
behavior strategy. An enemy selects an existing appearance archetype. Copy for localized domain
concepts changes in locale modules and never changes simulation state or save identity.

## 1. Engine separation

### Initial condition

- Engine functions accepted or defaulted to `DEFAULT_GAME_DEFINITION`, which made dependency
  injection optional and allowed tests to pass while production behavior remained globally bound.
- Read-only UI queries and mutating simulation functions shared broad barrels.
- Event and command results carried presentation prose near authoritative policy.
- Reaction telemetry and clone logic assumed a closed, fixed reaction record.

### Current condition

- `src/game/engine/**` receives a compiled definition explicitly and imports neither default content
  nor a default definition.
- `createGameRuntime(definition)` closes over creation, evaluation, execution, stepping, queries,
  validation, and a definition-aware save codec.
- Commands return rejection codes and typed parameters. Events are a discriminated code-to-payload
  union. Current-locale prose is derived in presentation.
- Room reaction telemetry is initialized from the compiled reaction catalog and cloned as a dynamic
  record.
- Two-runtime tests prove independent rules, state, queries, and save ownership in one process.

Assessment: strong. The remaining engine changes for new content are intentionally limited to a
genuinely new mechanical strategy, never a new instance of an existing strategy.

## 2. Game authoring separation

### Initial condition

- `content/campaign.ts` owned every level, round, briefing, lesson, and reference playtest command.
- Definitions were structurally typed but entered the runtime without one comprehensive compile
  step.
- Reactions were scheduled by known IDs; enemy rendering and manual icons switched on enemy IDs;
  tutorial dispatch switched on level IDs.
- Saves identified only a schema version, not the ruleset that owned their state.

### Current condition

- `GamePackSource` is compiled and deep-frozen. Compilation validates identity agreement, pack
  version, level order, nonempty rounds/waves, enemy and route references, cumulative availability,
  loadouts, reaction participants/balance, facility paths, and featured-reaction references.
- Each level is an independent module under `content/levels/`; `campaign.ts` is an explicit ordered
  registry. Reference policies live in `content/playtestPlans.ts` and are absent from runtime level
  rules.
- Room reactions dispatch through a behavior-strategy registry. Reusable strategies own ordinary
  gas recombination, absorption, and mixed-contact chemistry; the instantaneous OX-1 flash remains
  a named exceptional strategy.
- Enemy definitions carry reusable appearance/manual-icon traits. The map projection is
  definition-bound and switches on appearance archetypes.
- Guides use registrations and typed state conditions. Levels author featured reactions, while a
  reusable panel selects an existing behavior view.
- Save V12 carries pack ID and content version. Foreign-pack saves are rejected; V7-V11 data
  migrates into the default pack.
- Fixture tests add a reaction, enemy, and guided level through these seams without engine or
  renderer dispatch edits.

Assessment: strong for data-only instances of existing mechanics. A new ID still joins the
project's TypeScript identity union by design; dynamic third-party mod loading is outside scope.

## 3. UI separation

### Initial condition

- React and Pixi modules imported the broad default config barrel and, in some places, internal
  engine helpers.
- Components enumerated catalogs, applied command rejection policy, and selected concrete reaction
  gates.
- Application store construction imported a global runtime rather than receiving services.

### Current condition

- Production components, tutorials, application code, and audio import neither `game/config`,
  `game/content`, nor `game/engine`.
- `presentation/defaultGame.ts` is the single default-pack binding seam. Bound presentation
  services combine a runtime, locale, formatters, event/command renderers, manuals, and cached
  selectors.
- Store construction receives runtime and presentation services. Command notices use the injected
  presenter, and lifecycle/session/UI actions use the injected runtime.
- High-frequency enemy projection has a definition-bound factory; fixture coverage proves an
  alternate definition changes the visual archetype without a component branch.
- The architecture checker rejects internal imports and cross-layer cycles.

Assessment: materially cleaner. Components remain responsible for layout and UI-local interaction;
mechanical policy and default content ownership sit behind query/presentation composition seams.

## 4. Copy and internationalization separation

### Initial condition

- Names and descriptions were fields on rooms, equipment, species, reactions, sources, buffers,
  processes, enemies, conduits, levels, and rounds.
- Command rejection and event prose were assembled from engine-layer decisions.
- Formatting used local `toFixed`, `toLocaleString`, plural suffixes, and date formatting throughout
  presentation/UI code.
- Copy review required broad searches across mechanics, presentation helpers, tutorial files, and
  JSX.

### Current condition

- Mechanical definitions retain IDs, formulas, codes, equations, assets, traits, and numerical
  rules. Display names/descriptions are locale entries.
- English is divided into typed namespaces for UI, commands, entities, levels, events, damage,
  manual, and presentation readouts.
- Translator placeholder types are derived from the English catalog. Locale validation reports
  missing keys, extra keys, and placeholder mismatch; a complete `en-XA` locale proves registration
  without mechanics changes.
- Number, list, plural, date, duration, percentage, and measurement formatting share one locale
  service.
- `pnpm copy:export` emits a single context-grouped English review document. `pnpm copy:check`
  prevents display fields from returning to mechanical content or current-locale prose from
  returning to engine results.
- Explicit legacy saved prose, formulas, stable process codes, asset paths, test IDs, and CSS
  classes remain outside translation.

Assessment: the durable copy boundary now covers the language most likely to change with game
authoring and balance. The active implementation ledger tracks the final migration of tutorial
narrative and static interface microcopy before declaring the localization phase closed.

## Coupling matrix

| Change | Engine | Authoring | Locale | Presentation/UI | Persistence |
| --- | --- | --- | --- | --- | --- |
| New level using existing mechanics | — | module + registry + health plan | level/round keys | — | content version decision |
| New ordinary reaction | — | balanced definition + strategy config | entity/manual keys | — | content version decision |
| New exceptional reaction behavior | new named strategy | definition | entity/manual keys | optional reusable view | schema only if state changes |
| New enemy using an appearance | — | enemy definition + wave | entity/manual keys | — | content version decision |
| New appearance archetype | — | enemy trait | entity/manual keys | one renderer archetype | — |
| English copy edit | — | — | locale module | — | — |
| New locale | — | — | complete bundle | bind at composition | — |
| New durable state field | construction/clone/validation | optional | optional | projection | schema + migration |

`—` means the layer normally remains untouched. New mechanical or visual behavior intentionally
crosses its corresponding strategy boundary.

## Enforcement and evidence

- `pnpm architecture:check`: forbidden dependency matrix plus cross-layer cycle detection.
- `pnpm copy:check`: mechanical/engine copy ownership.
- `pnpm locales:check`: complete second locale and placeholder parity.
- Compiler fixtures: invalid enemy references and unbalanced chemistry fail before scenario start.
- Extension fixtures: ordinary reaction, enemy archetype, and guide registration.
- Runtime fixtures: two packs query and save independently; foreign-pack decode fails.
- `make ci`: architecture, copy, performance, lint, formatting, types, coverage, build, deterministic
  campaign health, and Terraform formatting.
- `pnpm test:e2e`: complete browser behavior.
