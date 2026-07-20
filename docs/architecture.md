# Architecture

Catalyst Castellum is a static browser application around a deterministic, serializable simulation.
The engine owns mechanics; authored packs own content; presentation owns localized interpretation;
React and Pixi render view models and dispatch typed commands.

## Dependency direction

```text
authored content -> compiler -> immutable GameDefinition -> GameRuntime -> application
       |                                |                    |             |
       +-> playtest portfolios          +-> save codec       +-> queries   v
locale catalog -> translator -> presentation services ----------------> React/Pixi
```

- `src/game/content/**` authors species, reactions, equipment, enemies, levels, sites, supplies,
  narrative identities, and reference portfolios.
- `src/game/authoring/compiler.ts` validates identities, references, elemental balance, equipment
  operations, supplies, maps, waves, and cumulative availability before runtime construction.
- `src/game/definition.ts` compiles and deep-freezes the default pack. `deriveGame` creates explicit
  variants for tests and alternate rulesets.
- `src/game/runtime.ts` binds creation, command evaluation, command execution, stepping, queries,
  validation, and persistence to one definition.
- `src/game/queries.ts` is the read-only application facade. Application and presentation modules
  consume runtime/query contracts rather than internal engine mutators.
- `src/presentation/**` binds a runtime and translator into localized copy, catalogs, formatters,
  forecasts, and memoized view models.
- `src/application/**` owns browser initialization, save slots, persistence scheduling, selection,
  notices, and UI-session state.
- `src/components/**` and `src/tutorial/**` render view models and dispatch semantic commands.

`pnpm architecture:check` enforces this direction and rejects cross-layer cycles.

## World and run model

The simulation consumes one `WorldMap`. It contains room instances, utility nodes, architectural
connections, and routed gas/liquid connections in one coordinate system. Geometry drives room
volume, enemy movement, exposure, conduit length, hold-up, liquid crest, and rendering.

Map producers run before a site starts. Authored and seeded chunk-assembly producers return the same
validated map shape and embed the player's carried hull fragment. The fixed simulation step remains
RNG-free. See [ADR-0001](adr/0001-simulation-runs-on-a-map.md),
[ADR-0002](adr/0002-instance-keyed-world-identity.md), and
[ADR-0003](adr/0003-random-producer-chunk-assembly.md).

One save contains one run and one hull. Hull rooms, grafted modules, installed equipment, internal
connections, and all conserved inventories travel between sites. Disposable site rooms remain with
the cleared claim. See [ADR-0004](adr/0004-save-is-hull-is-one-run.md).

Process lines are player-authored map data. Preview and execution call the same deterministic
shortest-path router, and the stored route drives both physics and rendering. See
[ADR-0006](adr/0006-process-lines-use-shortest-orthogonal-routes.md).

## Chemistry and equipment

Species definitions own formulas, arbitrary elemental composition, physical properties, and hazard
contributions. Reaction definitions own stoichiometry and typed behavior data. Compilation rejects
unbalanced chemical reactions.

Ordinary multi-stage chemistry uses a simultaneous mass-action pass. Each room is snapshotted once;
forward and reverse requests compete through proportional allocation; products become eligible on
the next simulation step. This prevents catalog order from creating hidden process priority.

Powered cells use typed equipment-operation definitions with instance-local inputs, outputs,
headroom, rates, telemetry, and conserved port inventories. Every installed operation runs
independently. Presentation derives machine effects and reaction mechanics from the same structured
definitions.

## Transport and spatial physics

Gas and liquid lines carry one complete phase mixture through one persistent finite inventory.
Route length controls hold-up and rated response. Fans and pumps are binary actuators; passive lines
follow their physical gradients. Shared junction allocation is proportional, so identifier order
does not determine who receives feed.

Rooms retain separate lower and upper gas layers plus pooled liquid and stationary material.
Composition, temperature, pressure, density, elevation, port height, liquid surface, and equipment
volume determine transport and reaction conditions. Architectural openings exchange material
independently from dedicated process lines.

## Combat and campaign health

Enemy level scales health, breach damage, reward, and residue from stable archetype definitions.
Movement traits, resistance, flying state, armor transitions, protection fields, and reagent
reservoirs remain archetype behavior rather than level bonuses.

All damage enters the central packet resolver with stable channel and source identities. It updates
health, per-source ledgers, incidents, deaths, Matter rewards, and round results as one transaction.
Room-wide hazards affect every occupant, while finite fields and reagents make cohort composition
matter.

The runtime also exposes a read-only defensive-posture projection. It converts present room
hazards, reaction-pulse cadence, enemy resistance, route residence time, and movement drag into
damage and control per enemy traversal. Conduit inspection compares equal held-operation clones
that differ by one actuator setting; the result remains a local causal comparison rather than a
wave-survival forecast.

Every open-defense site has five reference portfolios and an idle-loss control. `pnpm
campaign:health` executes the exact runtime and fails when a portfolio, diversity, or idle-loss
contract changes. `pnpm balance:combat` adds controlled first-order and transient second-order
analysis.

## State and persistence

`GameState` is the durable domain snapshot. Construction, explicit cloning, validation, and save
encoding cover every reference-valued field; deep-independence and round-trip tests guard that
contract. UI state remains in the application layer.

Save V22 is the only accepted pre-release schema. Each save identifies its pack and content
version, carries its map/run/domain state, and passes this boundary:

```text
untrusted JSON -> structural decode -> semantic state validation -> GameState
```

The application exposes three named local slots. Browser restoration is explicit initialization;
the pure codec and scheduler remain separate concerns.

## Localization and copy

Mechanical definitions carry stable identities and numerical rules. English player-facing content
lives under `src/localization/locales/en/`; typed translation keys and placeholder validation keep
simulation state language-neutral. `pnpm copy:check` rejects display prose in mechanical content,
engine results, tutorial authoring, and JSX. `pnpm locales:check` validates catalog completeness and
placeholder parity.

## Extension paths

### Level or site

1. Add a level module under `src/game/content/levels/` and register it in `content/campaign.ts`.
2. Add or select a site specification and physical supplies.
3. Add localized mission, round, and narrative copy.
4. Add five round-aware reference portfolios and a diversity target.
5. Let compilation and campaign health validate the result.

### Reaction or species

1. Add canonical identities and species definitions with formulas, elements, physical properties,
   and hazard rules.
2. Add balanced reaction definitions using an existing behavior strategy.
3. Extend the typed strategy registry only for genuinely new phase or side-effect behavior.
4. Add exact-delta, conservation, presentation, and campaign-delivery coverage.

### Equipment

1. Add the canonical identity and structured grade behavior.
2. Attach a typed equipment operation when the machine transforms material.
3. Extend the generic executor only for a new operation kind.
4. Add localized catalog/manual copy and command/operation tests.

### Enemy

1. Add a mechanical archetype and choose a reusable behavior and appearance.
2. Add localized entity/manual copy and use it in authored waves.
3. Add runtime or rendering branches only for a genuinely new behavior or silhouette family.

### Durable state

1. Define construction and transition semantics.
2. Update explicit cloning and prove deep independence.
3. Update V22's successor schema and increment the save/content version.
4. Add semantic invariants and round-trip tests.

## Verification

| Command                     | Contract                                                               |
| --------------------------- | ---------------------------------------------------------------------- |
| `make quick-ci`             | Architecture, copy, lint, format, typecheck, and fast unit suite       |
| `make ci`                   | Full coverage, build, performance, campaign health, and Terraform gate |
| `pnpm test:e2e`             | Complete Chromium browser behavior                                     |
| `pnpm performance:baseline` | Representative clone, step, codec, query, and render timings           |
| `pnpm balance:combat`       | First-order and transient combat workbook                              |
