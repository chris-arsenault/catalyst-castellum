# Architecture

Catalyst Castellum is a static browser application around a deterministic, serializable vertical
tower-defense simulation. The engine owns mechanics; authored packs own campaign content;
presentation owns localized interpretation; React and Pixi render view models and dispatch typed
commands.

## Dependency direction

```text
authored content -> compiler -> immutable GameDefinition -> GameRuntime -> application
       |                                |                    |             |
       +-> balance portfolios           +-> save codec       +-> queries   v
locale catalog -> translator -> presentation services ----------------> React/Pixi
```

- `src/game/content/**` authors towers, upgrades, enemies, maps, routes, waves, sites, supplies,
  narrative identities, and reference defenses.
- `src/game/authoring/compiler.ts` validates identities, references, maps, routes, tower surfaces,
  graft slots, waves, supplies, and campaign availability before runtime construction.
- `src/game/definition.ts` compiles and deep-freezes the default pack. `deriveGame` creates explicit
  variants for tests and alternate rulesets.
- `src/game/runtime.ts` binds creation, command evaluation, command execution, stepping, queries,
  validation, and persistence to one definition.
- `src/game/queries.ts` is the read-only application facade. Application and presentation modules
  consume runtime and query contracts rather than internal engine mutators.
- `src/presentation/**` binds a runtime and translator into localized copy, catalogs, formatters,
  forecasts, and memoized view models.
- `src/application/**` owns browser initialization, save slots, persistence scheduling, selection,
  notices, and UI-session state.
- `src/components/**` and `src/tutorial/**` render view models and dispatch semantic commands.

`pnpm architecture:check` enforces this direction and rejects cross-layer cycles.

## World and campaign model

The simulation consumes one `WorldMap`. It contains the rig hull, grafted rooms, site terrain,
architectural connections, enemy route graphs, valid tower surfaces, and routed gas or liquid
connections in one coordinate system. Geometry drives rendering, placement, line of sight, attack
range, enemy movement, room volume, conduit length, and environmental exposure.

Every site supplies an authored vertical cutaway and one or more ingress-to-Core routes. Routes may
split, merge, climb, descend, and pass through rooms. Deterministic path selection uses authored
edges and movement costs. Remaining route distance gives towers stable first, last, and nearest-to-
Core targeting without coupling combat to presentation coordinates.

One save follows one fixed campaign and one persistent claim rig. Hull rooms, grafts, hull-mounted
towers, upgrades, Matter, Core state, and narrative progress travel between sites. Site terrain and
temporary site placements belong to the current operation. Failed operations restore the pre-assault
checkpoint so campaign progression does not depend on a run-permadeath model. See
[ADR-0013](adr/0013-fixed-campaign-hull-and-checkpoints.md).

## Construction

Ordinary towers use free surface placement. A placement command identifies a grid anchor, floor,
wall, or ceiling face, footprint, and orientation. The same evaluator checks ownership, Matter,
clearance, support, route obstruction, range, and line of sight before the command becomes
available. Preview, execution, save validation, and rendering consume the same resolved placement.

Room grafts use authored hull graft slots. A graft adds persistent geometry, route connections,
tower surfaces, and any equipment positions defined inside that room. Grafts cost enough Matter to
compete with several tower upgrades and normally enter the hull between operations. See
[ADR-0012](adr/0012-vertical-placement-routes-and-grafts.md).

## Towers and combat

Tower definitions own mounting faces, footprint, attack cadence, target cap, arc, range, channels,
and upgrade branches. Towers query eligible enemies through the runtime, select targets with a
stable ordering, and emit typed damage, movement, or status packets. The central packet resolver
updates health, source ledgers, incidents, deaths, Matter rewards, and assault results as one
transaction.

Placement face changes behavior because the map is vertical. Floor towers command open lanes, wall
towers cover lateral approaches, and ceiling towers attack from above or interact with airborne
enemies. Towers may require clear line of sight, fire along a fixed arc, lob over obstructions, or
affect a bounded area. Attack cadence and target caps keep enemy count relevant to defense capacity.

Enemy archetypes own movement traits, route preferences, resistances, armor transitions, protection
fields, and other behaviors. Level scales their numeric campaign pressure while archetype identity
continues to determine the defense problem.

Direct towers define the first playable combat vocabulary. Chemistry, pipes, and atmosphere extend
that vocabulary after the opening sites prove placement, targeting, routing, wave pacing, and tower
economy. See [ADR-0011](adr/0011-direct-towers-define-campaign-combat.md).

## Chemistry, transport, and environment

The chemical simulation remains a deterministic subsystem. Species conserve elemental inventory;
reactions use typed stoichiometry and behavior data; powered equipment uses finite port inventories;
gas and liquid lines retain phase mixtures, hold-up, and routed geometry. Rooms retain lower and
upper gas layers, pooled liquid, stationary material, temperature, and pressure.

Campaign content connects these systems to tower defense through explicit interfaces:

- a pipe can supply feedstock or coolant to a compatible tower mode;
- a tower or enemy can release a finite atmospheric byproduct;
- a room condition can change range, cadence, damage channel, movement, or visibility;
- process equipment can prepare a resource that a tower consumes.

The opening sites use self-contained towers and environmentally neutral rooms. This keeps the
retained process model available without making it a prerequisite for proving the primary defense
loop.

## Campaign, tutorials, and balance

The campaign contains twelve authored sites across three acts. Each site binds a vertical map,
route graph, enemy level, five waves, construction resources, narrative sequence, and reference
defenses. Sites test geometry, resources, enemy composition, timing, and economic pressure. Later
sites add environmental and process interactions as additional strategies.

Tutorials use the same typed guide framework as the campaign. Predicates observe runtime state and
command decisions; presentation supplies localized instructions and focus targets. Tutorials first
teach surface placement, attack coverage, upgrades, multiple routes, and grafting, then introduce
transport or atmospheric effects when those systems enter the campaign.

Balance analysis evaluates tower service capacity, route coverage, enemy residence in range,
target-selection pressure, resource curves, Core damage, and exact deterministic replays. Reference
defenses prove multiple viable layouts; idle controls prove that each operation applies pressure.

## State and persistence

`GameState` is the durable domain snapshot. Construction, explicit cloning, validation, and save
encoding cover every reference-valued field; deep-independence and round-trip tests guard that
contract. UI state remains in the application layer.

The current schema is the only accepted pre-release schema. Each save identifies its pack and
content version, carries its campaign, hull, map, and domain state, and passes this boundary:

```text
untrusted JSON -> structural decode -> semantic state validation -> GameState
```

Durable tower placements, upgrades, grafts, route state, or campaign checkpoints require a schema
and content-version increment. The application exposes three named local slots. Browser restoration
is explicit initialization; the pure codec and scheduler remain separate concerns.

## Localization and copy

Mechanical definitions carry stable identities and numerical rules. English player-facing content
lives under `src/localization/locales/en/`; typed translation keys and placeholder validation keep
simulation state language-neutral. `pnpm copy:check` rejects display prose in mechanical content,
engine results, tutorial authoring, and JSX. `pnpm locales:check` validates catalog completeness and
placeholder parity.

## Extension paths

### Site

1. Author its vertical map, tower surfaces, ingress routes, Core destination, and graft access.
2. Add waves, enemy levels, construction resources, and any local environmental rules.
3. Add localized briefing, assault, result, and narrative copy.
4. Add reference defenses that use materially different placements or tower mixes.
5. Let compilation and campaign health validate the result.

### Tower or upgrade

1. Add a stable identity and structured targeting, footprint, attack, and upgrade data.
2. Reuse an existing attack and effect executor when the behavior matches.
3. Add localized catalog and manual copy.
4. Add placement, targeting, damage, balance, and save coverage.

### Enemy

1. Add a mechanical archetype and choose reusable movement, defense, and appearance behavior.
2. Add localized entity and manual copy, then use it in authored waves.
3. Add runtime or rendering branches only for a new behavior or silhouette family.

### Reaction, species, or process equipment

1. Add canonical identities and balanced chemical definitions.
2. Connect the process output to a specific environmental or tower-defense rule.
3. Reuse typed operation and transport strategies where they fit.
4. Add conservation, exact-delta, presentation, and encounter coverage.

### Durable state

1. Define construction and transition semantics.
2. Update explicit cloning and prove deep independence.
3. Increment the save schema and content version.
4. Add semantic invariants and round-trip tests.

## Verification

| Command                     | Contract                                                               |
| --------------------------- | ---------------------------------------------------------------------- |
| `make quick-ci`             | Architecture, copy, lint, format, typecheck, and fast unit suite       |
| `make ci`                   | Full coverage, build, performance, campaign health, and Terraform gate |
| `pnpm test:e2e`             | Complete Chromium browser behavior                                     |
| `pnpm performance:baseline` | Representative clone, step, codec, query, and render timings           |
| `pnpm balance:combat`       | Tower, route, economy, and transient combat workbook                   |
