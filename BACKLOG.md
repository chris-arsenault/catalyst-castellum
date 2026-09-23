# Backlog

Current design and delivery work, followed by deferred extensions. The previous implementation
record remains in [`TOWER-DEFENSE-REWORK-PLAN.md`](TOWER-DEFENSE-REWORK-PLAN.md); its outstanding human
playtest acceptance is not evidence that the current game is enjoyable.

## Catalyst combat contract and delivery plan

Date: 2026-09-15. Status: implementation authorized; M1 in progress.

Sulion root: `ba54b5cc-e127-42d3-883f-025668153e5e` — Catalyst combat and campaign renewal.
Architecture: [proposed ADR-0016](docs/adr/0016-encounter-kernel-and-catalyst-combat.md).
This section is the working contract, milestone record, and location for subsequent phase expansions.

### Outcome and authorization

Make Catalyst Castellum a readable tower-defense campaign in which placement, catalyst interactions,
and persistent hull growth support the same defensive plan. A player predicts a useful arrangement,
sees why it works, identifies a leak, and makes an adjustment with a visible consequence.

The user subsequently authorized executing the plan until input is needed. In-scope implementation
and validation are authorized; commits, pushes, deployments, and starting a development server remain
separate. The short encounter is a design proof for the complete campaign migration, not the final
delivery scope. Human acceptance remains a real evidence gate.

### Settled constraints

- Keep the name Catalyst Castellum and conventional tower defense as the primary genre.
- Preserve the twelve named sites, their order, three acts, cast, narrative reveals, and Pell
  conclusion. Retain five waves per campaign site. Tactical fixtures may contain one wave.
- Give catalysts an actual mechanical function and provide a procedural layer beyond direct attacks.
  A chemical solver, a species catalog, and physically accurate E&M are not requirements.
- Preserve grafting as persistent vessel development; its current templates, workflow, and economy
  are open to redesign.
- Preserve the existing visual identity, art assets, and music. Use the side-view presentation for
  this proposal; fluid gravity does not oblige us to retain current map proportions or every
  mounting and traversal rule.
- Retain typed command authority, deterministic simulation, valid routes, explicit combat
  attribution, save validation, persistent hull ownership, and site-investment recovery.
- Preserve conservation and finite inventories wherever the existing chemical/transport systems
  remain in use during migration. Their eventual retirement requires a consumer audit.
- Use small headless experiments for mechanics and balance. Campaign completion checks cannot
  establish human comprehension or enjoyment.

### Selected design proposal

These are concrete defaults for implementation planning, not claims of measured balance or settled
player preference. M3 implements them; M4 tests them. Architectural rationale and alternatives belong
in ADR-0016.

#### Combat loop

1. Read the next column's route, composition, arrival spacing, and visible special traits.
2. Place direct weapons and, when useful, devices that prepare or exploit charged targets.
3. Observe acquisition, impact, charge accumulation, field influence, and discharge on the map.
4. Reposition, retarget, or upgrade to address a specific coverage or capacity problem.
5. Review the routes that leaked and the contribution of the installed defense; carry earned Matter
   and hull installations into the next operation.

Direct-only defenses remain campaign-viable. Catalyst arrangements offer different timing, grouping,
and spending choices. Direct attacks remain the principal campaign damage source; control and stored
charge cannot replace all ordinary fire. A specialized discharge encounter may emphasize catalysts,
but the campaign does not require a prescribed combination.

#### Charge

Charge is a single nonnegative game quantity on an enemy. It represents prepared susceptibility to
the vessel's field equipment. This is a fictional combat model, not a claim about electromagnetic
physics. The initial vocabulary has no positive/negative charge types or pairwise particle forces.

- An authored attack effect adds charge on a successful impact against a surviving eligible target.
  A miss, a fully shield-blocked impact, or a dead target adds none. Armor mitigation alone does not
  change charge yield. Enemy susceptibility is a separate visible authored coefficient.
- Initial tuning: capacity 100, induction hit 20, decay 5 units/second after 1 second without a
  charge-producing hit. Values are definition data. Charge has a persistent source-contribution
  ledger so multiple inducers and dismantled sources remain attributable.
- Accepted input is capped by remaining capacity. Overflow, decay, charge consumed by discharge,
  and charge lost on death, breach, or encounter cleanup are separate accounting outcomes. A timeout
  preserves charge in its resumable snapshot; explicitly discarding that state records cleanup loss.
  Consumption and decay reduce source
  shares proportionally, with deterministic rounding/remainder ownership.
- Neutral enemies gain charge only from an authored producer. Field projectors and discharge
  catalysts create none. Charge cannot increase during a discharge chain.
- Charge is tactical: it persists through pause and mid-assault saves, decays in simulation time,
  and clears when its enemy leaves the encounter. Build screens do not precharge future enemies.

#### Field projector

A field projector changes charged enemies' spacing along their legal paths. It has attract/repel
modes, a footprint, a visible origin, range, affected layers, target capacity, and strength. It uses
the same placement and upgrade commands as other defenses and has no direct damage attack.

Initial tuning: radius 4 cells, six affected enemies, strength 0.5, and full response at 100 charge.
Eligible enemies require positive charge, an allowed layer, and clear field line of sight. At
capacity, choose highest charge, then nearest distance, then stable enemy identity. Show which
enemies are being serviced.

For each eligible enemy, freeze the eligible projector inputs, charge weights, and unit vectors from
its position toward each projector at tick start. Project those vectors onto the unit tangent of
each route segment traversed during that tick. Multiply by strength, charge/capacity, and linear range
falloff. Repel negates that contribution. At the projector's exact center or perpendicular alignment,
the contribution is zero. Sum contributions from all projectors using the same tick snapshot before
applying one final clamp.

The initial allowed speed is 0.35–1.5 times the enemy's unmodified traversal speed for that segment.
Apply the floor after all player-induced movement modifiers. An enemy's own locomotion transition
is distinct from player control. Opposing fields cancel before the clamp; adding projectors cannot
create permanent immobilization. Movement follows route distance in cells, not path-array indices.

Attraction ahead accelerates an enemy; attraction behind slows it. Repulsion reverses that behavior.
This can concentrate arrivals or separate a protected group, but a poorly placed field can accelerate
threats toward the Core. Previews show movement arrows along the route, including acceleration.
Fields never pull enemies through walls, switch branches, reverse travel, or create a new route.

Field activation and attract/repel changes take 1 simulated second. Relocation suspends the field
for the same interval. Repeated changes restart activation and cannot reset attack cooldowns or
duplicate effects. Pause remains available for planning. Changing field mode is a typed command.

#### Discharge catalyst

A catalyst enables a bounded discharge of charge already carried by enemies. The device persists;
the charge supplies the consumable budget. It is an explicitly conditional support defense, with
useful standalone direct weapons available beside it.

- Initial tuning: radius 5 cells, 60 charge required for a seed, 20 for a secondary target, link
  distance 2.5 cells, four targets total including the seed, and 1.5 seconds between pulses.
- Select a seed using the displayed first/strongest targeting policy among ready charged targets
  within radius and clear line of sight of the catalyst. Stable route-distance and identity rules
  break equal priorities.
- Starting at the seed, extend one chain to the nearest unvisited eligible charged target within
  link distance and line of sight of the previous target. Every target stays inside the catalyst's
  radius and allowed layers. Solid architecture blocks links. A chain may connect separate routes
  where they physically meet; it cannot jump through an intervening wall. Missing or blocked secondary
  links end the chain; an eligible seed still receives a one-target pulse and consumes the cooldown.
- Resolve the whole pulse at its trigger tick. Each target consumes up to 60 of its own charge and
  receives 0.75 raw damage per unit consumed, then the central damage resolver applies the authored
  channel and defenses. There is no charge transfer, recharge, free secondary burst, or repeat
  target. The pulse's visual flash coincides with its damage.
- Multiple ready catalysts compete for the same charge. Resolve oldest-ready first, then the seed's
  remaining route distance, then shortest device-to-seed distance, then stable device identity for exact
  ties. Re-evaluate remaining charge before each transaction; a target can discharge once per tick.
  A catalyst that cannot obtain a valid seed waits and retains its readiness age.
- Record catalyst damage and each inducer's consumed charge contribution separately. Damage totals
  count actual damage once; assists never inflate damage or kill totals. Overkill and mitigation
  remain explicit.
- Display waiting reasons: acquiring charge, awaiting a target, or recharging. Selection previews the
  seed, reachable and blocked links, charge thresholds, and target cap.

#### Direct attacks and the seven defense roles

Reuse apparatus silhouettes where their behavior remains truthful. The following role labels are
working design names, not final localization or durable IDs:

1. **Precision weapon:** focused direct fire and useful first/strongest targeting; reuse Flash
   Chamber as the starting asset and behavior family.
2. **Induction weapon:** rapid direct projectiles with charge on impact; reuse Caustic Jet's asset
   family, replacing its old coating interaction in the new ruleset.
3. **Cone weapon:** short projected area fire that rewards mounting orientation; reuse Carbon Burner.
4. **Lobbed weapon:** positional splash over an intervening obstruction; reuse Acid Pot's silhouette.
5. **Upper-coverage weapon:** reliable flying-target service, with a later charge-producing upgrade;
   reuse Wash Head's silhouette and distinguish its target eligibility visibly.
6. **Field projector:** attract/repel control; evaluate Quench Coil's asset for this purpose.
7. **Discharge catalyst:** conditional charge conversion; evaluate Carbonyl Marker's asset.

M3 needs the precision, induction, and cone weapons plus the two catalyst-layer devices. M5 completes
the roster. Each direct weapon exposes damage, cadence, targeting, geometry, and exact upgrade
deltas. Each support device exposes its input condition and spatial consequence. An upgrade must
change a readable quantity or rule, and every chassis needs a useful equal-Matter comparison.

Hitscan damage resolves on firing. Direct projectiles are non-homing and collide with the first
eligible enemy or blocking architecture along their swept segment. Lobbed attacks target a fixed
point and follow an authored arc that must clear geometry; splash resolves on impact with its own
layer, radius, and obstruction rules. A dead original target does not retarget a projectile.
Pending attacks snapshot damage, geometry, and source identity at launch; moving, upgrading, or
selling the source cannot improve an attack already in flight. M3 introduces these mechanics
explicitly; M2 extraction preserves the existing instant-hit behavior until then.

For cone attacks, resolve eligibility inside the cone itself. For splash, retain a still-eligible
primary before selecting secondary victims; a target cap never causes an ineligible secondary to
replace the selected primary. Tests cover mixed layers, walls, moving targets, and simultaneous hits.

#### Worked decisions and counters

- **Useful arrangement:** induction fire prepares a column before a bend. An attract field near the
  bend compresses arrivals, and a catalyst beside the next firing position discharges the group.
  Direct fire finishes survivors. Compare its cost and leaks against additional direct towers.
- **Weak arrangement:** a catalyst precedes the induction coverage, so seeds arrive uncharged.
  Moving it downstream changes the outcome. The map shows charge acquisition and the waiting reason.
- **Spatial counter:** spaced fast enemies or routes separated by a solid wall prevent useful chains.
  Focused fire remains effective; buying another catalyst does not repair missing charge or links.
- **Control risk:** attraction placed toward the Core accelerates the column before it reaches the
  intended kill zone. Its preview must expose that consequence before purchase.
- **Budget example:** a seed with 60 charge and three linked targets with 20 each consume 120 total
  charge for 90 raw damage at the initial coefficient. All four end at zero charge; a second
  catalyst cannot repeat that pulse. Resistance can reduce the 90, never create more charge.
- **Control envelope:** a 10-second passage held at the 0.35 speed floor takes about 28.6 seconds.
  That is a theoretical upper bound, not a balance result. Field capacity, limited range, acquisition,
  price, and actual charge uptime must prevent control from eclipsing all weapon investment.

Use existing enemy identities to author these pressures. Deckmouth establishes ordinary service;
Flintjack and Clatter stress arrival and traversal timing; Shear-jelly tests layers; Splitback tests
damage sequencing; Anchor tests protected-group separation; Redlung tests sustained output; Glowbag
receives a visible bounded support effect in the new ruleset. Any charge resistance or draining
behavior requires explicit copy, a visible tell, and a viable counter. Avoid blanket immunity as
the default answer to a powerful interaction.

### Battlefield, information, and graft contract

The side-view map remains the primary surface. Preserve sprites, material treatment, silhouettes,
music, and campaign presentation. Reframe or simplify geometry where needed to make routes readable
at ordinary zoom. Keep free compatible surface placement and orientation; mount restrictions should
express attack geometry, not inherited process-equipment sockets.

The opening exposes the current wave, available defenses, Matter, Core, and placement feedback.
Material catalogs, empty process panels, and irrelevant pipe controls do not occupy the new combat
surface. Introduce charge with its first producer, fields with a relevant route, and catalysts with
a visible charged group. Tooltips and overlays remain available by selection; color is supplemented
by symbols, meter shapes, direction arrows, and text. Preserve independent pause, speed, audio,
reduced-motion, keyboard, camera, and guidance controls.

Use one typed interaction mode for inspect, place, move, and field configuration. Map controls own
their click/keyboard events. Preview and execution share the injected runtime and command decisions.
Rejected placement identifies its cause and corrective action. Guides record completed observations
independently of current selection and give one immediate objective; opting out preserves content.

Wave forecasts show composition and timing per active ingress, with matching route highlights.
Reports show breaches by route and observed contributing facts such as uncovered passage, spent
charge, missing links, firing readiness, and target saturation. A report may suggest an adjustment
but must not present an inferred cause as a measured counterfactual.

Grafts are authored persistent tactical modules purchased in the hangar through compatible hull
attachments. Replace the generic room-sizing workflow with a small set of readable templates:

- **Firing gallery:** additional compatible surfaces and a longer sight line onto an existing route.
- **Transit chamber:** a bounded, authored route segment with useful bends or parallel approaches.
- **Field bay:** space and mounting opportunities for induction, fields, and discharge coverage.

These modules add geometry, not hidden percentage bonuses or free preinstalled equipment. Each
preview shows the exact affected route, entry/exit connections, added neutral traversal distance,
usable mounting cells, cost, and persistence. A module cannot promise route control from an unused
dead-end room. Through-route templates author distinct entry and exit ports; side galleries retain
the original route and must prove useful coverage from their new surfaces.

The new hull connection contract identifies site ingress and Core-bound egress explicitly. Remove
the current inferred farthest-room docking choice when introducing these templates. A graft cannot
silently relocate site ingress, bypass another purchased module, introduce a route cycle, or sever a
route. Validate every active movement class and later-site hull embedding. Grafting remains between
operations, so live enemies do not need relocation through edited geometry.

Keep the shared Matter economy and two or three campaign purchases as initial pacing targets;
six to ten ordinary upgrades is a starting cost envelope. M5 measures coverage and traversal value,
then M6 checks the complete income curve. No arbitrary count cap substitutes for price. New modules
do not create more attachment capacity unless their template explicitly supplies validated ports.
Every purchase records its investment, provenance, and contents. Dismantling uses a displayed refund
and rejects removal while occupied; existing material/equipment recovery rules remain authoritative
until migrated. Preserve hull installations across travel and recover site investment exactly once.

### Kernel and experiment contract

The proposed interfaces, ownership, tick order, and save requirements are specified in ADR-0016.
The implementation must provide the following externally observable behavior:

- Compile and run a one-wave encounter without a `LevelId`, twelve-site pack, React, browser, or
  default content import. Campaign adapters use exactly that encounter implementation.
- Construct a validated start state from an authored fixture or a versioned snapshot. Initial
  defenses and budgets obey ordinary placement and inventory invariants; invalid commands produce
  explicit results rather than being silently retried until successful.
- Apply ordered `{ tick, sequence, command }` transactions and advance an exact integer tick count.
  Return ticks actually advanced and the declared termination reason. Browser speed and catch-up
  limits do not cap headless advancement.
- Save and replay pending impacts, charge contributions, field activation, catalyst readiness,
  stable source identities, and command ordering. Snapshot plus command log reproduces authoritative
  state regardless of observer collection or rendering.
- Record actual shots, eligible-target time, ready-but-idle time, control exposure, charge input/
  losses/consumption, chain size, damage, overkill, leaks, and Matter. Avoid calling firing-tick time
  coverage. Detailed diagnostic traces are optional and bounded; disabling them changes no outcome.
- Provide direct fixture selection and named comparisons. A failed case reports its definition
  identity, starting snapshot, command log, and first failing invariant without requiring prior sites.

Proposed tooling surface, implemented in M2–M4 rather than available commands today:

```text
pnpm encounter:run --fixture <id> --max-ticks <count>
pnpm encounter:compare --suite <id>
pnpm encounter:replay --input <local-artifact>
```

Output defaults to terminal summaries; explicit output paths create local JSON/trace artifacts.
No hosted presentation or publication is part of this workflow.

The normal mechanical matrix contains named comparisons, not a large number of degraded copies of
one winning script: equal-Matter direct versus catalytic builds; one-cell placement changes; target
priority changes; spaced versus dense arrivals; blocked links; alternate layers; missing inducer,
projector, or catalyst; and upgrade versus another weapon. Each comparison states a hypothesis and
an expected relationship. Removing a support device should explain its marginal contribution.
Passing build labels and unique serialized layouts are not sufficient diversity evidence.

Split fast kernel/component contracts from campaign portfolios and long deterministic snapshots.
Retain a complete `make ci` contract before commits. Fix the benchmark's eight-seconds/two-seconds
fixture mismatch and assert tick/enemy counts before measuring. Initial performance targets are
provisional: ordinary microfixtures under 1 second each after process startup, the selected mechanical
matrix under 10 seconds, and a 100-enemy/40-device stress tick below 10 ms p95 on the recorded machine.
Measure setup separately from stepping. Revise targets only with documented measurements and user
impact; profile before adding workers, spatial indexes, or another execution engine.

### Source evidence and migration ownership

The review inspected the current bodies below. Findings are evidence from this session, not a claim
that the proposed mechanics already exist:

- `src/game/runtime.ts`, `definition.ts`, `engine/step.ts`, and `application/hooks.ts`: an injected
  headless runtime already exists. Browser accumulation uses 0.1-second steps. No normal
  browser/headless divergence was established. Reuse this boundary and make exact ticks explicit.
- `engine/towerCombat.ts`, `towerTargeting.ts`, `towerCommands.ts`, and `towerStateValidation.ts`:
  area target filtering, cooldown remainder, and attack-source deletion are verified defects.
  Reproductions showed ground-only Quench hitting flyers, base Caustic firing 25 shots in 10 seconds,
  and pause/fire/dismantle producing an unloadable save. M1 owns repairs; M3 owns new projectile rules.
- `authoring/compiler.ts`: negative upgrade cost compiled and awarded Matter in a probe; M1 owns
  numeric and reference validation. Its five-round campaign requirement moves above tactical
  compilation in M2, while the final campaign validator enforces exactly twelve sites and five waves.
- `presentation/waveForecast.ts`, `towerPlanning.ts`, `components/GameMap.tsx`, `gameMap/MapChrome.tsx`,
  `application/uiSlice.ts`, and `tutorial/towerDefenseGuides.ts`: route information is collapsed,
  placement reasons are hidden, construction modes overlap, and guide progress follows selection.
  M1 repairs those boundaries; M3 extends their runtime-bound projections for new mechanics.
- `components/TowerPanel.tsx`, `gameMap/TowerLayer.tsx`, and `presentation/towerCopy.ts`: default
  runtime reads bypass injected variants. M2–M3 migrate these consumers and test an alternate pack.
- `playtest/runner.ts`, `playtest/policies.ts`, `tooling/combatBalance.ts`, `tooling/performanceBaseline.ts`,
  and `Makefile`: site replay, narrow mutations, label-based diversity, misleading coverage, benchmark
  truncation, and unfiltered campaign tests constrain iteration. M2 and M4 own their replacement.
- `world/modules.ts`, `world/graft.ts`, `world/hullFragment.ts`, and `world/routes.ts`: reuse stable
  identities, map validation, hull extraction/translation, and provenance. Current modules have one
  attachment joint and docking is inferred by graph distance; a through-route graft needs a new
  explicit connection contract. Current enemy paths are recomputed from ingress, so do not assume
  that drawing extra route-graph edges makes enemies traverse a graft.
- `engine/scenarioState.ts`, `definitionTypes.ts`, `towerSupply.ts`, `environmentalFields.ts`,
  `persistence/saveCodec.ts`, and the process/chemistry modules: process data is embedded in room,
  pack, save, and loadout structures. M2 isolates that dependency; M7 audits removal by consumer.
- `docs/campaign-defense-design.md`, ADR-0011 through ADR-0015, and
  `docs/narrative/campaign-site-map.md`: preserve campaign and ownership requirements. Narrative
  references locate reveal obligations; implementation must read the affected actual dialogue and
  tutorial bodies before changing their mechanical wording. The entire script was not reviewed here.

The prior Sulion roots `82f8b98e-cd27-4bc9-80db-16f36bee3418` and
`c33720f9-0e65-4890-a825-50473166673b` are completed. Their phase records and the existing rework plan
were read; preserve their history rather than reopening them. Earlier completion claims do not
close the new human acceptance gates.

### Milestones

Future phases are pending. Expand only the next authorized milestone with the `plan-phase` skill;
keep the expansion here and use a Sulion child plan. A multi-step prerequisite discovered during
execution gets a blocked phase and a linked sub-plan. No milestone silently expands into unrelated
infrastructure, publication, or a new game genre.

#### M0 — Contract and plan

Scope: record the rules, ownership, source evidence, acceptance conditions, and deferred decisions.
Acceptance: the contract and proposed ADR agree, existing obligations are accounted for, and each
future milestone has a concrete outcome and evidence requirement.
Evidence: source inspection, independent gameplay/kernel review, documentation checks, Sulion mapping.
State: completed planning; M1 execution authorized and in progress.
Sulion: `95046b86-d5e6-45b4-a82f-15f3f1d4545f`.

#### M1 — Combat and interaction correctness

[depends on M0] Implementation authorized 2026-09-15.

Scope: repair mixed-layer area selection and primary retention, preserve cooldown remainder,
fix attack-source lifecycle on dismantling, validate authored numbers and upgrade graphs, expose
placement reasons, make construction modes exclusive, contain map-control events, derive forecasts
per route, and retain guide observations independently of selection. Include the existing map
hover/render-update follow-up below in the interaction repair.

Acceptance: ordinary commands cannot create the reproduced invalid save; cadence matches authored
service over sustained intervals; attacks obey shape/layer rules; preview and execution agree;
camera/pipe controls cannot place towers; guide progress survives deselection.

Evidence: small combat fixtures, command/save round trips, targeted component tests, and existing
affected suites. Record expected balance changes from bug fixes before updating snapshots. Preserve
the old campaign's current step order. Do not tune all twelve sites in this repair phase.
Sulion: `b5e9bd5d-2781-47d8-963c-3f55387efaa4`.

##### M1 execution expansion

Expansion: `98c38575-240b-4dfe-a63e-8e6cbb984068`. Execution authorized 2026-09-15.

1. **Combat and save invariants** (`16036ec4-5511-48a4-b3ec-62fb8294ba56`).
   - Files: `engine/towerCombat.ts`, `towerTargeting.ts`, `towerCommands.ts`, focused combat tests.
   - Resolve cone and splash targets through explicit eligibility/geometry; retain primary targets.
     Preserve fractional firing time while preventing idle-shot banking. Remove obsolete visual
     attack references when dismantling in the current instant-hit ruleset.
   - Verify mixed layers, cone geometry, sustained cadence, idle/reacquisition, and paused
     dismantle/save/load. Preserve process simulation and current tick ordering.
2. **Authored tower validation** (`2687c505-0640-4fc0-bbda-b1b5b8081f2d`).
   - Files: `authoring/compiler.ts`, new focused tower validator, authoring tests.
   - Validate finite costs/rates/dimensions/damage, recovery bounds, upgrade references and cycles,
     effective upgrade bounds, targeting/mount defaults, and supply/control values.
   - Verify malformed variants reject before runtime and current content still compiles.
3. **Construction interactions** (`e7b06491-1d0d-45b7-b030-073b18a4c485`).
   - Files: `application/uiSlice.ts`, map interaction components/hooks, placement preview, tests.
   - Make transitions mutually exclusive, contain control events, render authoritative rejection
     copy, and move hover side effects out of render. Preserve independent player controls.
   - Verify store mode transitions and component event/feedback behavior without starting a server.
4. **Forecasts and guide evidence** (`708970b4-e0f5-44da-a1df-483ce142975c`).
   - Files: forecast model/component/copy and guide model/components/tests.
   - Report current wave composition/timing per route; retain completed observations independently
     from live selection, with explicit reset/replay semantics.
   - Verify Pell Cut route changes, selected/deselected guide progression, and localized consumers.
5. **Integration validation** (`035f6989-6abd-4103-abc8-3603200ccdb5`) [depends on #1, #2, #3, #4].
   - Increment content identity for changed mechanics; increment save identity if durable shape changes.
     Run focused suites, typecheck, architecture, copy/locales, changed-file lint/format, and review.
   - Record expected balance changes. Full campaign tuning and projectile mechanics remain M6/M3.
     No commit or deployment is requested, so complete CI before publication remains a later gate.

Evidence: 92 tests across 17 application/tutorial/presentation/authoring/combat suites passed in
6.82 seconds; 22 focused combat tests additionally passed after amplified-cadence repair. Compilation
now rejects 15 malformed numeric/reference variants. Independent review reproduced reciprocal-rate
and upgraded-damage overflow; validation now rejects both. Authored attack damage including upgrades
has a 1e9 ceiling to leave arithmetic headroom. The effect-only coating fixture disables unused
upgrades so its authored 10/s cadence stays within the compiler contract. Content version is 21;
guide evidence changes the browser slot envelope to 3 while simulation schema remains 28.

Expected balance changes: base Caustic now services 32 shots/10 seconds and its manifold services 46;
environmental amplification can service two scheduled attacks per tick (189 shots/10 seconds at
19/s with an initially ready attack). Cone targets follow tower-origin coverage; splash retains its
primary and filters other targets by layer, radius, and impact line of sight. These replace the
previously inaccurate behavior; campaign portfolios are not retuned in M1.

State: completed. Typecheck passes; repository lint exits zero with 29 existing warnings.
Architecture, copy ownership, locale parity, changed-file formatting and whitespace checks pass.
Full campaign, browser, and human acceptance remain later milestones.

#### M2 — Independent encounter kernel

[depends on M1]

Scope: introduce the tactical definition/state and campaign adapter in ADR-0016; exact tick runner,
ordered commands, fixtures/snapshots, trace contract, local CLI, and test-suite separation. Isolate
existing process participation without changing its behavior. Capture post-M1 extraction baselines.

Acceptance: a one-wave fixture runs without campaign/default/browser imports; a campaign wave and
the same encounter produce equal authoritative state; batching ticks, pause/resume commands, and
observer on/off preserve results; mid-assault save/replay works. Setup validates placements/routes.

Evidence: parity tests at several command boundaries, process conservation tests for retained paths,
architecture/type checks, fixture runner output, and benchmark state assertions. Publish actual
runtime/setup timings. No new combat ordering or real projectile flight is hidden in extraction.
Sulion: `2b9baf53-6c11-4f0d-b067-17156996d37f`.

##### M2 execution expansion

Execution authorized 2026-09-15. This is one complete extraction milestone; intermediate contracts
are implementation steps, and the milestone remains open until campaign, save, process, and UI
consumers use the shared boundary.

Sulion expansion: `6bc13507-91d8-4928-b2a0-3cc11e31faac`.

1. **Post-repair characterization and contracts.** Record short explicit 0.1-second baseline cases
   for direct kills/breaches, commands/save replay, finite tower supply, gas emission, and settlement.
   Introduce tactical definition/state/command/result contracts under `game/encounter/`; place process
   ownership under optional encounter process state. Keep campaign progress and presentation controls
   outside tactical state. Preserve accumulated elapsed timestamps during extraction so normalization
   does not silently alter threshold behavior; the integer tick remains the scheduling authority.
2. **Shared tactical engine and process boundary.** Narrow existing targeting, placement, damage,
   enemy, and attack functions to their actual tactical dependencies. Extract creation, cloning,
   event recording, construction commands, and ordered fixed stepping. The optional process adapter
   owns inventories and explicitly participates in transport, equipment, supply, emission, residue,
   movement modifiers, and reactions at the existing ordered boundaries. Process-dependent enemy
   behavior requires a configured adapter. No manufactured campaign identity or process inventory
   may be required by a direct-fire fixture.
3. **Campaign and durable-state composition.** Materialize one authoritative `GameState.encounter`;
   migrate existing active resource/installation reads and writes, checkpoints, hull carryover, and
   save validation. Settle tactical results through a durable settlement identity once. Separate
   campaign metadata from tactical events. Increment save schema for the durable layout and update
   current-format rejection/UI behavior. Preserve production twelve-site/five-wave validation above
   tactical compilation. Validate campaign/standalone parity at command and completion boundaries.
4. **Runtime-bound presentation.** Add one injected tower presentation service and migrate panel,
   manual/catalog, aim controls, map rotation, map coverage and drawing. Verify alternate costs,
   stats, orientations, targeting, upgrade projections, and colors against the same runtime.
   Move browser pause/speed/catch-up controls into the application adapter and verify their behavior.
5. **Exact runner, replay and local tooling.** Provide integer tick advancement, ordered scheduled
   commands with explicit rejection records, validated snapshots, bounded observer modes, one-wave
   process-free fixtures, and local run/compare/replay commands. Split fast unit/encounter tests from
   campaign integration in package/Makefile/Vitest configuration. Correct the performance fixture
   using 80 actual ticks and assert state before timing. Measure setup separately from simulation.
6. **Extraction acceptance.** Run characterization/parity, command ordering, snapshot continuation,
   observer equivalence, process conservation, alternate-pack UI, architecture/type/copy/format and
   relevant persistence suites. Prove the standalone import graph excludes campaign/default/browser
   code. Record exact timings and limitations. No projectile flight or catalyst-rule changes belong
   in this extraction; M3 owns those mechanics.

State: completed. Shared kernel, optional process bridge, schema-29 campaign composition,
runtime-bound presentation, browser clock ownership, and fast/campaign test separation are in use.
Local run/compare/replay commands and usage are in [encounter tooling](docs/encounter-tooling.md).

Current evidence:

- Standalone one-map/one-enemy/one-tower fixture runs without campaign/default/browser imports.
  Transitive emitted-import enforcement now protects that boundary.
- `make quick-ci` passes: architecture, copy, lint (29 existing warnings), format, typecheck,
  and 488 fast tests; four long integration cases are intentionally excluded. Continuous campaign
  save/travel progression passes after strict receipt/checkpoint validation. The additional
  authored-tower identity regression passes (10 snapshot tests total).
- Six runner/CLI tests pass. A saved 10-tick prefix plus 66 replayed ticks equals uninterrupted
  execution exactly. The calibrated corridor fixture clears eight enemies in 76 ticks: local
  setup 5.47 ms, run 13.32 ms. Comparison variants spend the same 20 Matter.
- Eight settlement tests cover duplicate banking, missing/future receipts, future record identity,
  same-encounter retries, next-wave checkpoints, nonfinite results, and valid travel saves.
- Captured post-M1 direct-fire, breach, and finite-process cases retain their mechanical results.
  Campaign and standalone execution produce equal encounter state at command/tick boundaries;
  campaign settlement adds the pending reward and survives save/load.
- The first complete fast pass reported 457 passed, one failed, four excluded integration tests.
  The failure was the clone test's obsolete immutable-map path; its focused rerun passes.
- Exact 80-tick performance fixture verifies 8 simulated seconds, four enemies and five towers
  before timing. Measured tick: 6.05 ms; clone: 1.74 ms; encode: 2.36 ms; decode: 11.48 ms;
  save: 174,708 bytes. These are local samples, not browser performance measurements.
- Campaign integration passed continuous travel/save progression and Morrow portfolio evaluation.
  Its old primary-report snapshot differs after M1 cadence corrections and exact fixed stepping.
  Twelve-Cask's optional reaction portfolio initially produced zero neutralization damage.

Prerequisite gate repair:
`7469c26c-bdc1-4b4a-b64c-6cf37067b308`, branched from M2 extraction acceptance.
A controlled cadence-only probe restored 1.772727 neutralization damage with the old quantized
Caustic rate; the corrected rate kills the overlapping targets earlier. The completed repair removes
two optional acid upgrades (30 Matter remains unspent), preserves the positive reaction assertion,
and wins at Core 100 with 13.04545455 neutralization damage and zero rejected commands. A 0.1-second
trace identifies two reaction kills in wave five. The regenerated content-version-21 primary
snapshot passes for all twelve sites. Combat rules stayed unchanged during this reference repair.
This evidence does not establish that players discover or enjoy the combination.

Retained-process finding for the next mechanics milestone: dismantling a tower with a nonempty
local reagent store discards that inventory, matching prior behavior. Define and test its
inventory return or rejection rule alongside source-removal accounting before M3 acceptance.

#### M3 — Playable catalyst encounter

[depends on M2]

Scope: implement charge, fields, discharge, durable source attribution, explicit projectile impact,
and the five-device proof roster. Adapt Harker's Brace geometry into an isolated five-wave exercise
using existing art, with a direct-fire opening, charge/discharge introduction, a grouping opportunity,
a spacing/occlusion counter, and an unguided mixed final wave. Preserve its campaign identity outside
the fixture. Include the complete map/inspection/report/retry UI and a local fixture launch path.

Acceptance: a player can predict coverage, see charge and field direction, recognize a valid chain,
and correct an arrangement after a leak. The encounter supports direct-only and catalytic defenses
with legal equal-budget starts. Its simulation and UI use the same injected definitions. All new
state survives saves, source removal, and replay. End-of-wave settlement waits for relevant combat
resolution and clears transient charge/attacks explicitly.

Evidence: conservation/accounting examples, competing-catalyst and field-overlap tests, projectile
collision tests, observer parity, localized component checks, and browser interaction checks when
an explicitly authorized server or existing test target is available. Numeric values remain
provisional until M4. Opening guidance does not prescribe the full winning arrangement.
Sulion: `b8a16659-772d-4ed6-9e8f-34d28d7bb693`.

##### M3 execution expansion

Execution continues under the existing authorization after M2 acceptance. The proof uses its own
five encounter definitions and separate exercise persistence, with Harker's Brace as presentation
metadata. It does not manufacture campaign completion or use a campaign save slot.
Sulion execution branch: `d494040c-3ba2-4f84-b21a-d936cda4fab8`.

1. **Durable mechanic contracts.** Add an explicit legacy/catalyst ruleset discriminant to combat
   definitions. Legacy campaign fixtures retain their existing immediate attack timing; the catalyst
   ruleset defines physical delivery, charge coefficients, device roles, susceptibility, and movement
   bounds. Keep one optional catalyst state owner inside the encounter for enemy charge ledgers,
   source contributions, device activation/readiness, and diagnostic accounting. Pending physical
   attacks snapshot immutable source, geometry, effects, and damage at launch. Increment campaign
   and standalone snapshot versions for the durable additions; validate finite bounds, identities,
   source references, and charge accounting.
2. **Charge, fields, and discharge.** Implement the contract's capped input, proportional losses and
   consumption, delayed decay, bounded route-tangent field influences, activation delay, competitive
   catalyst ordering, and obstruction-aware chains. Expose pure previews and waiting reasons for
   rendering. Test the worked 120-charge/90-raw-damage case, competing catalysts, field cancellation,
   turns/layers/walls, source removal, and death/breach/cleanup accounting. Resolve retained tower
   feedstock on dismantle by returning it through its owning process room, with conservation tests.
3. **Physical impacts and telemetry.** Separate launch from impact in the shared combat engine.
   Hitscan/cones resolve immediately; non-homing projectiles sweep against eligible enemies and
   solid geometry; lobbed attacks follow a fixed authored arc and resolve splash at collision.
   Source movement/upgrades/removal cannot change launched attacks. Apply charge only after a
   successful, unblocked hit on a surviving susceptible enemy. Finish waves after relevant pending
   attacks resolve; record impact damage once, inducer assists separately, and explicit cleanup loss.
   Test interception, dead targets, occlusion, shields, simultaneous impacts, save/replay and observers.
4. **Five-wave exercise and shared play surface.** Author the five-device proof roster and adapted
   Harker geometry, with direct-only and catalytic equal-budget configurations. A small exercise
   adapter owns wave progression, checkpoint, receipts, reports, and one current encounter.
   Extract a shared tactical map/control boundary supplied by campaign and exercise containers,
   keeping global campaign-store consumers outside it. Reuse current art, camera, audio, placement,
   and controls; render process layers only for configured process state. Add explicit local fixture
   launch, separate save/reload, retry, and observational guidance with an unguided fifth wave.
5. **Legibility and acceptance.** Show charge meters/text, field direction and activation, serviced
   enemies, catalyst seed/link previews and waiting reasons, authoritative projectile motion, and
   factual contribution/leak reports. Validate runtime-bound projections with altered definitions,
   local headless fixtures and component tests. Run focused mechanics, replay, accounting, application,
   architecture, type, localization, formatting and fast gates. Prepare a playable local target.
   Browser interaction validation requires explicit authorization to start a development server;
   ask at that concrete gate if no already-authorized test target exists. Human comprehension and
   replay interest remain M4's input gate.

##### M3 local acceptance record — 2026-09-15

Implementation is complete locally; browser acceptance is waiting for explicit server authorization.

- `make quick-ci` passes: 545 tests, 126 test files, and four deliberately separated long integration
  tests skipped by the fast filter. Architecture, copy ownership, formatting, TypeScript and ESLint
  pass; ESLint reports 40 warnings. Locale placeholder parity and `git diff --check` pass separately.
- `pnpm build` passes. Vite reports a bundle-size warning above 500 kB; browser frame-time and
  rendering performance have not been measured for this exercise.
- The twelve-site determinism snapshot test passes after the intentional schema/source additions.
  Continuous new-save-to-victory campaign persistence passes with schema 30 and content version 22.
  Standalone snapshots use version 2. Prior pre-release saves appear as incompatible slots.
- Catalyst, impact, accounting, process conservation, exercise lifecycle, command-stream replay,
  independent browser controls and altered-definition projections have focused regression coverage.
  UI/controller tests mock Pixi and audio; they provide no rendered-browser acceptance evidence.
- Both checked-in five-wave command streams complete with every input accepted. Direct defense
  ends at 100 Core; the catalytic layout ends at 19. They share the 85-Matter opening but earn and
  spend different amounts later. These are known regression solutions, not equal-spend balance
  experiments or evidence of discovery/fun. The default idle policy loses on wave two.
- Physical projectiles now predict along the route at launch using the sampled movement modifiers,
  then retain a fixed trajectory. Review corrections cover effect expiry before impacts,
  saveable build timeouts, per-wave ledgers, source retention and discarded-charge cleanup reports.
  Field target-seconds record actual service eligibility; they do not estimate damage prevented.
- Browser launch: `?fixture=harker-catalyst` on local port 26007. The authored
  `tests/e2e/catalyst-exercise.spec.ts` covers real placement, firing, independent controls,
  reload and retry. It remains unrun, along with the relevant campaign browser regression.

Next action after authorization: start the local server, run the exercise and campaign placement
browser checks, inspect rendering and controls, and resolve concrete failures before M4. Human
observation and the controlled tactical comparisons remain mandatory M4 evidence.

#### M4 — Evaluate tactical decisions

[depends on M3]

Scope: run the named equal-Matter and placement/counter comparisons; correct misleading telemetry;
conduct three to five short unfamiliar-player sessions on the proof encounter. The user coordinates
participant access or supplies an approved testing path; the agent prepares the build, observation
script, local evidence, and changes. Do not contact people or publish a build without authorization.

Acceptance: observed players can explain coverage, charge, and a leak, then make an intentional
adjustment with the predicted result. Record where coaching was needed and whether they voluntarily
try another arrangement. Evidence supports useful direct and catalytic choices, including a counter
to the catalytic arrangement. Passing automation alone cannot complete this milestone.

Evidence: reproducible small-case results, local anonymized observation notes, specific adjustments,
and a reviewed decision on mechanics/presentation. This sample informs design; it is not a statistical
claim about all players. If an effect remains unclear or redundant, revise it within the fixed genre
and rerun the affected proof before expanding the campaign. Independent code work may continue, but
M5–M6 design commitments remain gated on this evidence.
Sulion: `05305334-b80f-4a8e-a239-92e8389946a6`.

#### M5 — Grafts and complete defense roster

[depends on M4]

Scope: complete the seven roles and their useful upgrade choices; implement authored firing-gallery,
transit-chamber, and field-bay templates, explicit hull ingress/egress, validated route traversal,
hangar previews, purchase/refund, ownership, and later-site materialization.

Acceptance: each role has a measured use and a limitation; an extra direct tower remains competitive
with a support investment in an appropriate encounter. Every offered graft has useful legal mounts
or verified route traversal, a visible price, and a persistent benefit. Buying and traveling with
different graft orders produces valid routes and stable identities. The same investment is never
duplicated between hull and encounter state.

Evidence: bounded contribution/substitution cases; graft geometry/route fixtures; buy/save/travel/
retry/refund sequences; exact hull embedding checks; and one short human comparison of graft previews.
Choose prices using those results before authoring the full campaign economy.
Sulion: `7e7fc6d7-bed1-4546-b6d3-0b4379c37f85`.

#### M6 — Integrate the fixed campaign

[depends on M5]

Scope: re-author mechanical content, unlocks, forecasts, tutorials, and portfolios for every site.
Read affected script bodies and adjust mechanical references while preserving narrative events.
Deliver the three acts incrementally inside this milestone's execution expansion:

- Claim 8-Delta: direct placement, observable impacts, one upgrade; no catalyst requirement.
- Harker's Brace: mounting geometry and sight lines, followed by the first visible charge option.
- Twelve-Cask: area capacity and the first optional discharge arrangement.
- Morrow Pocket: field direction, multiple routes, and independent build choice.
- Kettleblack: the first consequential graft purchase and demonstrated persistence.
- Cordon 41: flyers, climbers, armor, and bounded control across elevations.
- Junction L-6: separated lanes, protection, target priority, and sustained charge service.
- Pell Cut: four synchronized approaches and the existing Act II emergence.
- Station 14: airborne pressure and the upper-coverage charge alternative.
- Vasker Store: alternating spacing and occlusion across overlapping-looking rooms; actual collision
  geometry stays unambiguous and field links respect it.
- Lane Six: compressed arrivals that stress target and field capacity.
- Pell Cordon: combined roles, catalyst timing, persistent hull choices, and the existing closure.

Acceptance: all twelve sites retain five waves, narrative order, legal direct-only answers, and
useful catalytic alternatives after their introduction. New options have visible consequences and
do not obsolete the opening weapons by coefficient alone. Two distinct campaign purchase paths
remain solvent and complete; graft income supports the measured purchase target. Idle defenses lose.

Evidence: focused cases while tuning individual waves; selected site replays at act boundaries;
two continuous campaign portfolios for economy/persistence; narrative reveal assertions; and human
checks at Kettleblack, Pell Cut, and Pell Cordon. No campaign-wide rerun is required for every numeric
experiment. Reconcile complete CI requirements before each commit.
Sulion: `cb90cc48-a6ee-41de-bcbd-126d3d0a3bec`.

#### M7 — Retire displaced systems

[depends on M6]

Scope: make the catalyst campaign the sole production ruleset. Audit the old chemistry solver,
gas/liquid flow, species catalogs, supply devices, room atmospheric state, old coatings, process UI,
legacy balance models, tests, tutorial copy, and temporary variant selectors. For each removal
candidate, record actual consumers, strongest retention case, replacement/evidence, and deletion
rationale in this milestone's expansion before deletion.

Acceptance: every removed mechanic has a disposition; required narrative/art assets and shared
geometry helpers survive. Retained mechanics have explicit producers, consumers, and tests. The
production tick and save contain no abandoned process state merely to satisfy old scaffolding.
If a reviewed consumer still needs chemistry, retain its coherent conserved subsystem with an
explicit participation contract; do not stub inventory or fabricate resources to bypass it.

Evidence: import/reference and authored-content audits, current-save validation, relevant conservation
tests, localization/copy checks, and architecture tests. Reconcile `AGENTS.md`, the design/architecture
documents, ADR statuses, authoring guides, README, and old rework-plan pointers when behavior lands.
Record shipped behavior in CHANGELOG then, not during this planning task.
Sulion: `e346f571-8e92-4149-82e6-fff3899d584b`.

#### M8 — Acceptance and handoff

[depends on M7]

Scope: consolidate evidence for mechanics, UI, human decisions, campaign continuity, performance,
and maintainability. Remove obsolete fixtures after their invariants have explicit replacements.

Acceptance: complete `make ci` passes; relevant browser flows cover creation through retry/travel/
victory and independent controls; campaign portfolios meet economy contracts; human acceptance
observations are resolved or explicitly accepted by the user. Microfixture performance and late-load
budgets are measured on an identified machine. Adding an enemy trait or effect through an existing
strategy requires data and focused tests, not edits throughout UI and kernel consumers.

Evidence: exact revision, commands, results, fixture identities, performance measurements, and
remaining limitations in this record. Browser/server access and external publication are separate
authorizations. Do not mark this milestone complete with human or required browser evidence missing.
Sulion: `424dd6d9-0e73-4514-acf8-e9959da15f3d`.

### Deferred decisions and evidence triggers

- **Tuning and effect viability:** agent recommends coefficients from M3–M4 comparisons; the user
  owns acceptance of the resulting play. Charge polarity and free-body motion are outside this
  proposal and require a new concrete need before expansion.
- **Final device names and asset adaptations:** agent proposes during M3/M5 after behavior is clear;
  user owns material changes to the visual identity. Preserve current assets until replacements
  have been inspected in context.
- **Graft prices and connection layouts:** agent resolves from M5 geometry and contribution tests,
  then M6 campaign economy. Changing the fixed campaign or removing grafting remains user-owned.
- **Residual chemistry:** M7 consumer audit determines technical reuse/removal. Any retained
  player-facing process mechanic must earn its interface cost through M4/M6 evidence. The user
  resolves a proposed scope expansion beyond the charge/field design.
- **Human and browser access:** user supplies participants or an approved existing target when M4
  needs it. Prepare a concrete runnable result first; unavailable access remains an explicit evidence
  gap, not an automated pass. No immediate answer is needed to finish planning.

### Current state and next action

M0, M1 and M2 are complete against base revision `354bede`; M3 implementation is complete
and browser acceptance needs input. The user authorized committing and pushing this implementation
on the existing `main` branch on 2026-09-23. M1 and M2 evidence appears in their execution records
above. M3 now has the catalyst kernel, physical impacts, strict saves,
five-wave exercise, headless runner and shared browser surface. Its current provisional encounter
starts with 85 Matter and spawns 4, 6, 7, 9 and 14 enemies across the five waves.

Headless probes verified the direct opening, charge input/discharge, paid-device carryover, replay,
per-wave ledgers and idle loss. Two legal reference layouts complete all five waves; other candidate
layouts leak and lose. These runs do not establish a balanced campaign or human acceptance. A review caught and corrected
current-position projectile aim, build-timeout persistence, mixed report scopes, and discarded
charge accounting. The M3 local acceptance record above contains checks and their limits.

Publication validation on 2026-09-23: `make ci` passes. All 549 tests pass under coverage (128 files), with
81.09% statements, 67.30% branches, 81.68% functions and 83.75% lines. The first coverage run
exceeded the five-second limit in exhaustive equipment-placement and malformed-conduit tests;
their per-test limits are now fifteen seconds with unchanged assertions. Architecture, copy,
performance, lint, formatting, TypeScript and production build checks pass. ESLint reports
40 warnings, and Vite reports a bundle-size warning. All twelve site portfolios and idle-loss
contracts pass; the continuous campaign completes with 100 Core and zero rejected actions.
Terraform formatting passes. Browser and human acceptance remain pending.

Next: obtain the explicitly required development-server authorization and perform browser
interaction checks. M4 requires unfamiliar-player observations before
campaign integration proceeds. Development-server startup and manual deployment still require
explicit authorization.

## Campaign extensions

- Add persistent hull damage and repair after the fixed campaign economy is proven.
- Evaluate replayable post-campaign progression after the authored campaign is complete and
  playtested.

## Technical follow-up

- Move map hover and selection updates out of render so React never reports a cross-component state
  update during `GameMap` rendering. Included in M1 above; retained here as the original follow-up.
