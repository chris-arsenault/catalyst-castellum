# ADR-0016: Encounter kernel and catalyst combat

Date: 2026-09-15
Status: accepted for implementation; execution authorized 2026-09-15

Design contract and delivery milestones:
[Catalyst combat plan](../../BACKLOG.md#catalyst-combat-contract-and-delivery-plan).

## Context

The user fixes the tower-defense genre, campaign, name, and an additional simulated interaction
layer. Catalysts need a mechanical role. Chemistry is one possible basis, not a requirement to
retain the existing solver. Grafting remains, with its form open to redesign. The user values the
existing graphics; the side-view geometry originally supported fluid gravity but can now serve
defensive positioning.

The current runtime is already headless and definition-injected. Its creation/stepping path still
requires campaign level identity, room process state, and a pack with campaign validation. The
playtest runner starts whole sites and advances their rounds. More campaign repetitions do not
answer small questions about targeting, placement, effect interactions, or comprehension.

The proposal retains this TypeScript engine and introduces a proper tactical boundary. The exact
charge/field/discharge rules and initial coefficients live in the linked contract. They are game
rules, not a physical E&M model.

## Proposed decisions

### One tactical kernel, campaign composition outside it

Introduce the following domain contracts, with exact file decomposition determined in M2:

- `CombatDefinition`: immutable validated catalogs of attacks, defenses, enemy traits, effects,
  and simulation constants. Contains no default content or browser dependencies.
- `EncounterDefinition`: stable ID/version, map and resolved legal routes, one wave schedule,
  availability, resource budget, validated initial installations, optional retained process
  configuration, and explicit completion limits. It does not require `LevelId` or campaign prose.
- `EncounterState`: integer tick, tactical phase, active resources/Core, installations and cooldowns,
  enemies and route progress, charge/source ledger, field state, pending impacts, monotonic sequences,
  and bounded authoritative reports. Outcome-affecting state is serializable.
- `CampaignState`: site/wave progression, persistent installation ownership, narrative/checkpoint
  policy, settlement identity, and inactive vessel state. The active tactical state lives once under
  `GameState.encounter`; the campaign does not also mutate copies of active towers, Matter, or Core.
- `EncounterResult`: completion/defeat/timeout, actual ticks, validated resource and Core changes,
  installation changes, and attributed combat results. Timeout is not victory.

The campaign adapter materializes its hull and site into an encounter. It performs rewards, wave
advancement, site recovery, travel, and checkpoint transitions through typed transactions. A stable
settlement identity prevents double banking on replay/reload. Mid-operation retries restore the
pre-assault checkpoint with its existing ownership policy; replaying a settlement cannot award
Matter twice. Between waves, move the authoritative tactical state forward rather than copying
installations into two mutable owners.

Keep tactical compilation separate from campaign validation. Both validate references, finite
numeric bounds, upgrade dependency acyclicity, geometry, routes, and legal initial state. Campaign
validation additionally enforces the twelve-site order and five waves per site. A one-wave fixture
must not require dummy campaign sites or direct mutation of a manufactured campaign state.

### Exact ticks and commands

The initial fixed tick remains 0.1 simulated seconds. Browser wall-clock accumulation, 1×/2× speed,
pause, and catch-up limits live in the application adapter. The kernel advances integer ticks and
never silently applies the current two-second clamp to an experiment.

Conceptual API:

```text
createEncounter(combatDefinition, encounterDefinition, initialState?) -> validated state
evaluateCommand(state, command) -> decision
executeCommand(state, command) -> next state + decision + committed events
advanceTicks(state, count, scheduledCommands?) -> state + ticksAdvanced + termination + events
```

Commands carry `{ tick, sequence, command }`, where tick identifies a simulation boundary and sequence
totally orders commands at that boundary. Reject duplicate identities and past commands. Execute
against each preceding result, recording rejection codes. Paused/build commands execute immediately
at the current boundary with increasing sequence; they advance no time. Pause/speed are adapter
controls and never secretly rescale a headless tick count. Snapshots include the ordering cursor needed
to resume a command stream safely. Compiled spawn schedules are sorted by tick and authored order.

M2 preserves the post-M1 step order while extracting the boundary. This includes retained process
work, spawning, enemy behavior, tower attacks, environmental damage, and movement/breaches. Establish
parity before introducing real projectile travel or changing effect sequencing in M3.

The new ruleset then specifies this tick sequence:

1. Execute boundary commands, expire old temporary state, and apply charge decay.
2. Advance any explicitly retained process subsystem, then spawn due enemies and update their
   authored behavior. A spawned enemy can be targeted and move on its spawn tick.
3. Freeze field eligibility, charge weights, and world-space projector vectors at the current
   positions. During movement, project and combine these frozen inputs against each traversed
   segment's tangent, then clamp once per segment. This prevents iteration-order force differences
   while retaining the correct direction at bends.
4. Advance previously launched projectiles against current enemy positions and swept collision
   geometry. Resolve impacts by impact time, immutable source identity, attack sequence, and collision
   target identity for exact ties. Update attack schedules and acquire targets; hitscan resolves
   immediately, while newly launched projectiles begin travel next tick. Each impact commits damage
   and accepted charge atomically; a later lethal hit records the resulting charge as death loss.
5. Resolve ready discharge catalysts in the contract's declared priority order, committing charge
   consumption and damage atomically.
6. Commit remaining environmental damage from retained systems, then move surviving enemies along
   legal routes using sampled fields. Movement effects of newly added/spent charge begin next tick.
7. Resolve Core arrivals, rewards, and encounter termination; emit the tactical result. No extra
   damage occurs after a committed defeat. Completion requires the schedule and enemies to be
   exhausted, with pending effects settled or explicitly discarded when they can affect no target.

Death becomes visible to later transactions in the same tick immediately; a target cannot be killed
or rewarded twice. Central packet resolution still owns mitigation, lethal attribution, and rewards.
Retained process bridges have explicit inputs/outputs at the above phases, not arbitrary callbacks
that reorder combat. Record the M3 ordering change as new mechanics with a content-version change.

Cooldown scheduling preserves fractional remainder under integer ticks. An idle tower retains one
ready attack, not accumulated shots for every second it lacked a target. Authored cadence bounds and
per-tick service limits must agree; compilation rejects unsupported rates rather than silently
discarding attacks. The browser interpolates presentation between committed states.

### Spatial effects and attack ownership

Fields change speed along a legal route tangent. They do not use rigid-body simulation, create
collision impulses, or alter routing. At bends, resolve travel segment by segment using that
segment's tangent and the tick's sampled field inputs. World distances remain in cells; traversal
timing and total remaining distance are queries shared with targeting and overlays.

Pending projectiles are authoritative state; visual attack trails are presentation events. A
projectile captures its attack specification and immutable source reference at launch. Upgrading,
moving, or selling its source does not change it. It can finish after source dismantling. Field
influence stops when its device is removed; charge already applied survives with historical source
attribution. Discharge is instantaneous, with pulse effects displayed at the committed damage time.

Maintain compact encounter source records for removed installations while charge, impacts, or reports
reference them. Validation checks those source records rather than requiring every historical source
to remain installed. Retain only the provenance required for current effects and aggregate reports;
do not turn the entire event log into an unbounded durable history.

Graft templates have explicit connection intent, including entry/exit ports for through-route rooms.
The campaign materializer resolves those into traversed routes and compatible mounts. Route validity
must be tested through the navigation actually used by enemies, not merely graph metadata. All
geometry-changing graft commands occur between operations. Fixed route choices and source identities
remain deterministic across hull translation and site materialization.

### Queries, observers, and tooling

Placement, range/arc, field direction, chain eligibility, next-wave routes, and effective stats are
runtime-bound queries. React/Pixi and local tools consume these contracts. Remove default-runtime
reads from variant-sensitive UI; an alternate definition test covers both command and display values.

Authoritative charge/damage/settlement accounting always executes. Diagnostic observers collect
optional bounded copies of target-rejection, impact, control, charge, and breach events. Observers
cannot issue commands or mutate state. Reporting off, aggregate-only, and detailed trace modes must
produce identical authoritative outcomes.

The runner supports fixture selection, exact limits, scheduled commands, snapshot replay, and named
comparison suites. It returns an explicit timeout/defeat/success and rejected commands. Failed
experiments produce local reproducibility artifacts with definition identity, snapshot, command log,
and diagnostic context. Do not retry rejected purchase commands until they accidentally succeed.

Split fast invariants/encounters from campaign integration suites. Keep campaign replays for carried
economy and persistence, and retain complete CI before commits. Measure fixture setup separately
from ticks. Optimize from profiles; neither worker orchestration nor a second engine is required
to establish this boundary.

### Persistence and migration

The current pre-release schema is the only supported format. Every durable-shape change increments
the schema; every authored-mechanics change increments the content version. No old-save migration
promise is added. The UI must identify incompatible saves and offer the existing explicit new-save
path without silently overwriting them.

Extraction initially carries the complete process subsystem through an explicit optional process
state owned by the encounter. A process-free fixture must not instantiate inventories merely to
satisfy an old constructor. The final catalyst campaign targets no dependency on ambient chemistry
or fluid transport. The M7 audit decides which old consumers are replaced, removed, or coherently
retained; any retained process path keeps its conservation and finite-inventory invariants.

During migration, one injected experimental pack/fixture exercises the new mechanics while the
existing campaign remains available. Give that pack a distinct identity to prevent cross-loading
saves. Share the kernel and query APIs; do not fork the browser simulation or build a permanent second
game. M7 removes the temporary composition after the complete replacement campaign is validated.

Save tests cover mid-flight impacts, competing catalysts, accumulated charge, paused configuration,
source dismantling, hull translation, operation retry, and settlement replay. Derived caches,
presentation interpolation, wall-clock values, and detailed observer traces are excluded from saves.

## Alternatives and consequences

- **Retain the full chemical solver as the new layer:** coherent if chemistry itself supplies the
  enjoyable decision, but it carries species, transport, UI, and testing obligations not required by
  the clarified brief. The selected proposal uses charge/fields; chemistry remains intact while
  existing consumers depend on it and is reviewed explicitly before retirement.
- **Use unconstrained E&M or free-body motion:** creates rich dynamics but requires new collision,
  navigation, force stability, and prediction rules. Route-constrained fields provide spatial control
  with readable consequences and reuse the current art/navigation.
- **Keep the current site runner as the sole test boundary:** avoids extraction but forces campaign
  scaffolding onto isolated mechanics and encourages expensive weakly targeted tests.
- **Rewrite the engine in another language or adopt a general ECS/plugin framework:** no current
  measurement or consumer justifies it. Typed data/effect strategies and an encounter boundary solve
  the immediate extension requirements within the existing runtime.
- **Replace the side view with a top-down game:** would discard valued presentation work without
  evidence that it improves the proposed decisions. The proposal tests readable side-view geometry.

The main costs are a durable-state/API migration, truthful projectile implementation, source-ledger
ownership, new UI projections, and campaign reauthoring. The expected benefit is a shared small
simulation boundary and a visible interaction layer. Human acceptance remains required to establish
that the additional decisions are worth their complexity.

## Relationship to existing decisions

This proposed ADR does not mark existing ADRs superseded or claim shipped behavior. If implemented:

- ADR-0011's primary direct-defense loop remains; its process/environment bridge becomes the
  explicit catalyst interaction contract.
- ADR-0012's free compatible placement remains; generic one-joint grafting gains explicit tactical
  connection templates and validated traversal.
- ADR-0013's campaign, ownership, checkpoint, and recovery obligations remain. Prices are tuned
  against the revised graft value rather than treated as immutable constants.
- ADR-0014's single world map and stable identities remain.
- ADR-0015's specific chemical roster/coating obligations are replaced by the selected charge,
  field, and discharge roles when the new content lands.

Update those statuses and the stable design documents during M7 after the replacement is verified.
