# Vertical tower-defense rework plan

Status: implementation complete; external playtest acceptance pending

This record tracks the implementation that moved Catalyst Castellum to the fixed vertical
tower-defense campaign defined in
[`docs/campaign-defense-design.md`](docs/campaign-defense-design.md). Stable design remains in the
design, architecture, narrative, and ADR documents. The preserved implementation boundary is the
remote tag `pre-tower-defense-rework`.

## Delivery rules

- Build the replacement through the existing deterministic runtime, typed command policy, central
  damage resolver, map, save codec, presentation boundary, and tutorial framework.
- Keep ordinary towers independent from room equipment sockets. Towers occupy free grid-snapped
  floor, wall, and ceiling placements; process equipment continues to use purpose-specific slots.
- Keep room attachment constrained to graft slots. A graft may add tower surfaces and internal
  process-equipment slots.
- Prove Claim 8-Delta and Harker's Brace with self-contained direct towers before adding pipe supply
  or atmospheric combat effects.
- Preserve elemental conservation, finite inventories, and deterministic process simulation while
  removing chemical synthesis as the prerequisite for ordinary damage.
- Keep the existing campaign playable during development through an internal content variant. Make
  the new campaign the default only after all twelve replacement sites pass the release gates.
- Increment `contentVersion` for every merged authored-mechanics milestone. Increment the save
  schema whenever durable state changes; pre-release saves use only the current schema.
- Run `make ci` before every implementation commit. Run the relevant Playwright flows and update
  deterministic snapshots when simulation behavior changes.

## Reusable foundation

| Existing system                        | Reuse                                                                     | Required change                                                               |
| -------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `WorldMap` vertical cell geometry      | Rooms, platforms, ladders, portals, provenance, rendering coordinates     | Add construction surfaces, multiple ingress definitions, and route graphs     |
| Enemy navigation and position          | Walking, climbing, falling, flying, portal validation, deterministic step | Resolve authored route choices and expose remaining distance across lanes     |
| Damage packets and source ledgers      | Resistance, proportional lethal attribution, incidents, rewards           | Admit tower attacks and bounded control effects as first-class sources        |
| Typed command evaluation and execution | One authority for UI availability and mutation                            | Add place, move, rotate, target, upgrade, and dismantle tower commands        |
| Pixi cutaway and interaction layers    | Camera, cell geometry, enemies, damage numbers, hit testing               | Add tower, placement-preview, range, projectile, and route-coverage layers    |
| Campaign and narrative framework       | Twelve-site order, three acts, dialogue, reports, travel                  | Replace mechanical site definitions and retry semantics                       |
| Tutorial guide framework               | Typed steps, predicates, focus anchors, skip and restore behavior         | Replace every reaction, pipe, and Prime predicate with tower-defense evidence |
| Room grafting                          | Intermission UI, deterministic geometry, map edits, persistent rooms      | Rename hardpoints to graft slots and rebalance the shared Matter cost         |
| Chemistry, transport, and atmosphere   | Conserved inventories, reactions, line routing, room state                | Connect through explicit tower supply and environmental-effect contracts      |
| Playtest and balance tooling           | Exact runtime replay, reference portfolios, idle-loss checks              | Replace process actions and throughput metrics with tower and route metrics   |

## Phase 0: establish the future-state design — complete

### Completed

- [x] Preserve the Deep Shear claim rig, remote cutter, foundry, Cthonic wake, cast, twelve-site
      route, three acts, five-wave structure, and Pell conclusion.
- [x] Define direct towers as the primary combat system with free grid-snapped floor, wall, and
      ceiling placement.
- [x] Define authored multiple routes, route-progress targeting, persistent hull towers, operation
      checkpoints, and site-investment recovery.
- [x] Define room grafts as rare campaign purchases attached through graft slots and priced at
      roughly six to ten ordinary upgrades.
- [x] Retain chemistry, pipes, and atmosphere through explicit tower-supply and environmental
      interactions after two chemistry-neutral sites.
- [x] Rewrite the stable campaign, architecture, tutorial, balance, enemy, process, narrative, and
      authoring documents around the future state.
- [x] Record the displaced campaign model in the tagged changelog and superseded ADRs, including the
      consolidated fixed-campaign world decision in ADR-0014.

### Gate

Complete. Active design documents describe one coherent future state; historical implementation
decisions remain in the changelog and superseded ADRs.

## Phase 1: deterministic tower, placement, and route kernel — complete

### Slice specification

- [x] Fix the canonical mechanical site identities as `claim_8_delta`, `harkers_brace`,
      `twelve_cask`, and the existing narrative names through Pell Cordon. Keep dialogue and reveal
      identities stable.
- [x] Author the first tower roster specification by combat role, mounting faces, footprint,
      attack geometry, targeting policies, upgrade effects, and visual silhouette. Claim 8-Delta
      needs reliable single-target fire and rapid target service; Harker's Brace adds one
      orientation-sensitive projector.
- [x] Freeze the Claim 8-Delta and Harker's Brace cutaways, route graphs, starting Matter, tower
      availability, five-wave forecasts, and expected upgrade purchases.
- [x] Record baseline performance, deterministic snapshots, current save size, and the complete
      `make ci` result before simulation state changes.

### Domain model

- [x] Add closed content identities for tower chassis, upgrade branches, attack strategies, target
      policies, and tower damage sources.
- [x] Add immutable tower definitions covering build and upgrade cost, footprint, supported mount
      faces, range, firing arc, line-of-sight policy, cadence, target cap, eligible movement layers,
      attack packets, and optional control effects.
- [x] Add durable tower instances keyed by deterministic instance ID. State includes chassis,
      anchor cell, mount face, orientation, grade or branch, target policy, cooldown, and finite
      tower-local resources.
- [x] Add a placement value object containing anchor, mount face, orientation, occupied cells,
      support cells, and firing origin. Keep this type independent from React and Pixi.
- [x] Add `place_tower`, `move_tower`, `rotate_tower`, `set_tower_targeting`, `upgrade_tower`, and
      `dismantle_tower` commands. Their evaluators own Matter, availability, phase, support,
      clearance, overlap, and route-obstruction decisions.

### Route model

- [x] Replace the single `entryCell` assumption with authored ingress definitions and route graphs.
      A graph contains stable nodes and edges; edges carry ordered cells, traversal mode, length,
      movement cost, and enemy eligibility.
- [x] Make each wave entry select an ingress and route policy. Resolve ties through stable authored
      order and deterministic enemy identity.
- [x] Retain cell-level movement along the resolved edge cells so current walking, climbing,
      falling, flying, portal, and position code remains usable.
- [x] Expose total route length, traveled distance, remaining distance or travel time, current edge,
      and reachable Core destination through runtime queries.
- [x] Validate that every authored enemy-route combination reaches the Core and that construction
      cannot silently sever all legal paths.

### Combat kernel

- [x] Add deterministic target queries for first, last, nearest, strongest, weakest, armored,
      flying, and support. Stable enemy identity breaks equal-priority ties.
- [x] Advance tower cooldowns in the fixed step, acquire through the shared query, and emit typed
      hitscan, projectile, cone, lob, or bounded-area attacks through reusable strategies.
- [x] Feed tower damage through the existing packet resolver, resistance model, protection fields,
      kill transaction, Matter reward, incidents, and per-source ledgers.
- [x] Represent slow, stun, reveal, armor break, and route displacement as finite typed effects with
      explicit duration, stacking, refresh, and floor rules.

### Persistence and verification

- [x] Add tower and route state to construction, cloning, semantic validation, queries, save codec,
      and round-trip tests.
- [x] Advance the save schema from V23 to V24 and the initial tower content to version 16.
- [x] Add compiler checks for tower references, footprints, mount faces, upgrade graphs, route
      connectivity, wave ingress, and attack strategies.
- [x] Add headless tests proving legal and illegal placement, deterministic targeting, cadence,
      resistance, field absorption, kill attribution, route selection, cloning, and save restore.

### Gate

A headless authored map can place a tower on each supported surface, spawn enemies on two routes,
select targets across both routes, apply direct damage, award Matter, and replay identically after
save/load. React and Pixi remain absent from the simulation modules.

## Phase 2: Claim 8-Delta playable vertical slice — complete

### Construction and map interaction

- [x] Add a tower build palette driven by campaign availability and the same command decisions used
      by execution.
- [x] Convert pointer position into a candidate grid anchor and nearest compatible floor, wall, or
      ceiling face. Add keyboard and pointer rotation plus explicit cancel behavior.
- [x] Render valid and invalid footprints, structural support, firing origin, range, arc,
      line-of-sight obstruction, eligible target layers, and covered route segments before purchase.
- [x] Add tower selection, move, rotate, target-priority, upgrade, and dismantle controls without
      routing tower construction through room equipment sockets.

### Combat presentation

- [x] Add Pixi tower sprites with mount-aware orientation and stable z-order inside the existing map
      scene.
- [x] Render acquisition, aim, projectile or beam travel, hit effects, bounded areas, control state,
      damage numbers, kills, idle reasons, and Core breaches from runtime state.
- [x] Add tower inspection for current target, cadence, damage, range, target cap, policy, grade,
      upgrade delta, Matter contribution, damage, kills, and downtime reason.
- [x] Add route overlays and wave forecasts that identify ingress, expected path, movement layer,
      composition, cadence, and support relationships.

### Site and guidance

- [x] Author Claim 8-Delta as a five-wave, single-route operation with neutral rooms and
      self-contained direct towers.
- [x] Replace the opening guide with the documented sequence: inspect route, select tower, place on
      a wall, inspect coverage, start assault, observe acquisition and direct damage, then buy one
      upgrade.
- [x] Let later waves remove click-by-click guidance while keeping the first tower useful and adding
      cadence pressure.
- [x] Add at least two materially different reference defenses and an idle-loss control.

### Gate

Claim 8-Delta is playable from briefing through report in the browser and headless runtime. A human
can diagnose a weak placement from the map, improve it, and clear all five waves without pipes,
atmospheric manipulation, process equipment, or Prime.

## Phase 3: Harker's Brace and the vertical-placement proof — complete

### Work

- [x] Author Harker's Brace with two elevations, occluding architecture, vertical traversal, and
      distinct wall and ceiling opportunities.
- [x] Add the orientation-sensitive projector. A wall placement projects along a corridor; a ceiling
      placement covers a shorter downward area with separately authored geometry and tuning.
- [x] Complete line-of-sight intersection, projectile collision, target acquisition during climbs
      and falls, and upper-layer eligibility.
- [x] Expose first and last targeting through remaining route distance rather than screen position
      or room order.
- [x] Replace Harker's reaction tutorial with wall and ceiling placement, coverage comparison,
      elevation, target priority, and upgrade guidance.
- [x] Add a multi-ingress test map and exact replay even if Harker's authored waves use one primary
      path at a time.
- [x] Add an internal launcher or derived content variant for the two-site replacement slice. Keep
      it out of the public campaign route.

### Gate

The first two replacement sites pass browser, deterministic, save/load, reference-defense, and
idle-loss checks. Human playtesting confirms that wall and ceiling placement create different
decisions and that target acquisition remains readable across elevation changes.

## Phase 4: complete the ordinary tower vocabulary and open defense — complete

### Tower and upgrade systems

- [x] Complete the direct-combat roster for precise single-target fire, rapid service, bounded area
      damage, route control, upper-space coverage, and support.
- [x] Add authored upgrade branches that change visible values or behavior. Show exact before and
      after cadence, damage, range, target cap, arc, channel, and special rules.
- [x] Add target-cap and simultaneous-arrival accounting so enemy count can overwhelm finite tower
      service.
- [x] Add site-owned and hull-owned placement provenance plus authored dismantle and departure
      recovery values.

### Sites 3 and 4

- [x] Author Twelve-Cask around finite firing capacity, bounded area damage, route control, and mixed
      cadence. Keep chemistry optional and field guidance focused on ordinary towers.
- [x] Author Morrow Pocket as the first open defense with multiple simultaneous ingress routes,
      splits and merges, target priorities, upgrade orders, and several useful surface choices.
- [x] Give each site five waves, visible route forecasts, several distinct reference defenses, and
      an idle-loss control.

### Balance tooling

- [x] Replace process-throughput first-order metrics with tower DPS, target service, coverage time,
      line-of-sight uptime, control extension, route demand, overkill, and Matter efficiency.
- [x] Replace process-action portfolios with exact tower placements, orientations, policies,
      upgrades, construction timing, and later graft or process actions.
- [x] Report damage, kills, downtime, overkill, route leaks, Core integrity, and Matter by tower and
      wave.
- [x] Keep the exact fixed-step replay as final balance authority.

### Gate

Morrow Pocket supports materially different direct-tower defenses across every route. The rewritten
`pnpm balance:combat` and `pnpm campaign:health` explain failures through tower, route, and economy
data rather than reaction throughput.

## Phase 5: persistent campaign hull and Kettleblack graft economy — complete

### Campaign state

- [x] Replace run outcome and seed state with fixed campaign progress, operation checkpoint, and
      retry state.
- [x] Persist hull rooms, grafts, hull-mounted towers, upgrades, Matter, Core state, process
      inventories, guidance choice, and narrative progress between sites.
- [x] Snapshot the pre-assault operation checkpoint and restore it on retry through the normal save
      codec and semantic validator.
- [x] Recover the authored value of site-mounted towers at departure while retaining hull-mounted
      towers and upgrades.
- [x] Verify that construction during a running or paused assault follows the same typed command
      rules and deterministic ordering as construction between waves.

### Grafting

- [x] Rename the domain, commands, authored content, presentation, tests, and copy from tower-style
      hardpoints to hull graft slots.
- [x] Keep graft attachment on authored slots while exposing free tower surfaces inside the new
      room. Preserve purpose-specific process-equipment slots where a module defines them.
- [x] Price each graft at roughly six to ten ordinary upgrades. Balance campaign income for two
      normal purchases and a possible third through deliberate saving, with no count cap.
- [x] Add graft previews for persistent geometry, route connections, tower surfaces, internal
      equipment positions, cost, and resulting legal placements.

### Site 5

- [x] Author Kettleblack around one meaningful graft purchase and the final-approach geometry that
      purchase creates.
- [x] Replace its vessel lesson with graft comparison, purchase, tower placement in the new room,
      and visible persistence after travel.

### Gate

A save can clear sites 1–5, buy a graft, retain hull towers and upgrades, recover site investment,
travel, reload, fail Kettleblack, retry from its checkpoint, and reproduce the same state. Reference
campaigns establish the intended graft-versus-upgrade tradeoff.

## Phase 6: explicit chemistry and environment bridge plus Act II — complete

### Integration contract

- [x] Add tower supply requirements that name a port, accepted species or prepared resource, rate,
      local capacity, and consequence of insufficient flow. Preview and execution use one supply
      query.
- [x] Add environmental fields with source, composition or effect identity, geometry, intensity,
      duration, decay, affected properties, and explicit stacking.
- [x] Let process equipment prepare tower resources through its existing finite inventories and
      typed operations. Towers consume those resources rather than scanning arbitrary room state.
- [x] Let towers and enemies emit conserved atmospheric byproducts into the existing upper and lower
      gas inventories.
- [x] Show pipe destination, available rate, tower demand, atmosphere extent, affected entities,
      active modifier, and limiting condition on the cutaway.
- [x] Add conservation, order-independence, line latency, save/load, field decay, and stacking tests.

### Sites 6–8

- [x] Author Cordon 41 around ladder specialists, flyers, armor, and shared protection in a vertical
      sensor stack. Introduce one optional, visible environmental interaction.
- [x] Author Junction L-6 around separated freight lanes, sustained service, support targeting, and
      one pipe-assisted tower mode.
- [x] Author Pell Cut around four synchronized arrays and the Act II escalation. Direct towers remain
      sufficient; process preparation creates an alternate efficient defense.
- [x] Require every site to retain several direct or hybrid reference defenses and an idle-loss
      control.

### Gate

The first chemistry-assisted tower and first atmospheric interaction are understandable from the
map without consulting the reaction catalog. Removing the process connection weakens or changes the
defense while leaving a viable direct-tower answer.

## Phase 7: Act III and the complete fixed campaign — complete

### Work

- [x] Author Station 14 with flyers, split-height coverage, and multiple Council ingress routes.
- [x] Author Vasker Store with spatially overlapping rooms and alternating fast, heavy, upper-lane,
      and supported columns.
- [x] Author Lane Six with compressed convoy cadence over a long multi-route approach.
- [x] Author Pell Cordon with changing Near Voice formations, route pressure, support relationships,
      and the foundry's explicit cadence-breaking operation.
- [x] Connect every briefing, forecast, assault objective, report, intermission, dialogue, travel,
      reveal, and ending to the replacement mechanics while preserving the narrative script and
      three-act schedule.
- [x] Complete tower, enemy, route, graft, environment, process, and campaign entries in the field
      manual and encyclopedia.
- [x] Build several campaign-long reference portfolios that make legal cumulative purchases and
      choose different graft, upgrade, tower, and chemistry strategies.

### Gate

The complete twelve-site route is playable from new save to Pell Cordon victory. Every site has five
waves, every idle defense loses, open sites support materially different defenses, and campaign-long
portfolios remain solvent through the final report.

## Phase 8: retire the reaction-led campaign and release the future state — implementation complete

### Legacy retirement

- [x] Make the replacement twelve-site order the default pack and remove the internal transition
      variant.
- [x] Remove the old Flash Point, Make the Reagent, Stored Chlorine, and reaction-led site modules,
      process portfolios, tutorial predicates, localization, and debug launch paths after their new
      counterparts cover the same campaign positions.
- [x] Remove `prime` from the campaign phase model, commands, UI, guide framework, saves, events, and
      tests. Process simulation continues during ordinary simulation time.
- [x] Remove random-site producer and run-seed state that have no fixed-campaign consumer.
- [x] Remove room-wide reaction damage as the ordinary campaign weapon while retaining explicit
      environmental damage, conserved emissions, process preparation, pipes, and atmosphere.
- [x] Remove tower-facing assumptions about two room equipment sockets. Keep socket behavior only
      for authored process equipment.
- [x] Delete transitional adapters and compatibility branches once no authored content uses them.

### Product completion

- [x] Complete placement, targeting, upgrade, route, enemy, Matter, graft, checkpoint, process, and
      campaign Playwright scenarios.
- [x] Validate keyboard and pointer placement, color-independent coverage and validity cues, readable
      zoom levels, pause behavior, speed controls, reduced motion, and localized copy ownership.
- [x] Profile tower targeting, line-of-sight queries, route recomputation, projectiles, overlays,
      cloning, saves, and rendering against representative late-campaign loads.
- [ ] Conduct external human playtests at Claim 8-Delta, Harker's Brace, Morrow Pocket, Kettleblack, the first
      process interaction, Pell Cut, and Pell Cordon. Record design changes in the stable documents
      and future work here.
- [x] Increment the final schema and content versions, regenerate deterministic snapshots, and run
      `make ci`, `pnpm test:e2e`, `pnpm balance:combat`, and `pnpm campaign:health` from a clean tree.
- [x] Update the changelog only after the replacement behavior ships. Deployment remains a separate
      explicitly authorized action.

### Release gate

The repository contains one campaign implementation matching the stable design. New saves complete
the campaign with direct towers carrying ordinary combat. Vertical placement, multiple routes,
persistent grafts, and explicit chemistry integration pass deterministic, browser, balance, and
performance acceptance. External human playtests remain the release acceptance step.

## Review checkpoints

1. **First combat:** Claim 8-Delta determines whether placement, acquisition, hits, upgrades, and
   failure diagnosis are immediately readable.
2. **Vertical proof:** Harker's Brace determines whether floor, wall, and ceiling relationships add
   enough strategy to justify the side-view format.
3. **Open defense:** Morrow Pocket determines whether multiple routes, finite service, target
   priority, and tower diversity support more than one defense.
4. **Campaign ownership:** Kettleblack determines whether persistent towers and graft cost create a
   useful campaign-scale economy.
5. **Chemical lineage:** the first pipe-assisted tower and atmospheric field determine whether the
   retained process system adds strategy without reclaiming the primary combat loop.
6. **Campaign completion:** Pell Cordon determines whether the full progression, narrative, economy,
   and combined mechanics sustain twelve sites.
