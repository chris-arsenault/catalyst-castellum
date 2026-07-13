# Foundational gameplay rewrite ledger

Date started: 2026-07-12

Status: technically verified; product direction not accepted, paused for redesign

This ledger exists to prevent the July gameplay rewrite from stopping at presentation-layer
changes. A requirement is complete only when the simulation state, commands, content, UI,
persistence, headless playtester, and automated tests all express the same mechanic.

## Why this rewrite exists

The prior build had five mismatches between presentation and underlying game:

1. The guide effectively owned room selection, preventing spatial comparison during the lesson.
2. Flash Point sourced H₂ from an unexplained R-05/Inner Bay header inherited from later chemistry.
3. The map drew bundled transport runs, while simulation and controls still operated hidden
   purpose/material-specific connections.
4. Numeric coordinates dressed disconnected rooms and banded routes that still behaved like a
   process schematic rather than a continuous side-view place.
5. Flash Point implied a repeating combustion weapon, but ordinary static overpressure killed most
   of the wave and the one-frame effect provided no durable death explanation.

This is a single vertical rewrite. None of those mismatches may be declared fixed by changing only
copy, line rendering, or tutorial sequencing.

## Non-negotiable invariants

### Physical transport

- There is at most one installed gas conduit and one installed liquid conduit for a room pair.
- A conduit owns one conserved mixed inventory for its phase. It does not contain invisible
  per-material or per-purpose sub-lines.
- All species in the upstream mixture contend for the same conduit capacity and move together
  unless a later explicit filter changes that behavior.
- The player operates one binary fan/pump per conduit. The player never opens O2, H2, water, or
  brine as independent transport controls.
- Sources, sinks, processing equipment, vents, and drains interact through room inventories or
  equipment ports; their material identity does not create another conduit.
- Each conduit owns a real world-space route and derives length, volume, latency, lift/head, and
  rendering from that same route.
- Fixed MVP routes use the same ordered route-point data that future player-drawn routes will edit.

### Spatial facility

- The map is one continuous side-view world with terrain, enclosed rooms, corridors, doors, and
  service routes occupying the same coordinate system.
- Core is spatially central. Inner/middle/outer classification follows physical/corridor distance
  from Core rather than arbitrary screen columns.
- Enemy position, room bounds, corridor traversal, conduit routes, gravity, and rendered geometry
  all refer to the same world coordinates.
- Visible room interior geometry determines simulated room volume; there is no unrelated global
  volume shared by differently sized rooms.
- Enemy exposure follows tagged path occupancy. A creature in an isolated corridor does not keep
  taking hazards from the room it has already left.
- A map tap selects a room in tutorial and normal play. Dragging pans only after a movement
  threshold; the camera must not steal taps from Pixi room hit targets.

### Combat causality

- Damage types remain the small durable set: atmosphere, corrosion, heat, pressure, radiation.
- Damage sources are separately identified (for example ambient overpressure versus OX-1 flash).
- All damage is applied through one packet resolver which caps same-tick contributions without
  source-order bias and updates enemy, round, incident, and death attribution together.
- Static overpressure is primarily a movement/containment condition. Only catastrophic static
  pressure causes meaningful continuous pressure damage.
- OX-1 combustion applies an explicit high-power, low-frequency pressure/heat attack to enemies in
  the room at ignition. It is not represented only as a quickly decaying room scalar.
- Every enemy retains cumulative damage by channel and source. A death record identifies the
  dominant source and useful contributing channels.
- Transient incidents persist long enough to read. Current room conditions and recent incidents
  are separate information concepts.
- Simulation order deliberately spawns due enemies before resolving reaction bursts, then applies
  ongoing exposure, movement, and breaches. Incidental function order must not decide who a flash
  hits.

### Flash Point and tutorial

- Level 1 does not borrow an unexplained precharged output header from the Level 2 membrane cell.
- Starter H2 and O2 have a visible, comprehensible origin at Core and share one gas conduit control.
- R-02 is recommended for a visible spatial reason: it is on the enemy corridor and is serviced by
  the installed starter conduit. Other rooms remain freely selectable and inspectable.
- The guide highlights or pans without owning room selection.
- The guide continues through first enemy contact and an attributable combat incident. It does not
  finish immediately after an empty-room flash.
- The player gets time to inspect the board after a flash and after its combat result.

## Required proof

- Unit test: a gas conduit transports a mixed H2/O2 inventory through one shared capacity and one
  actuator; there are no independent per-species transport commands.
- Unit test: gas and liquid remain element/mass-conserving across shared conduit transport.
- Unit test: route length and elevation affect transport response using the displayed route.
- Geometry test: room/corridor/conduit cells are in bounds, connected, non-duplicated by phase, and
  agree with endpoints, derived rings, room volume, and enemy exposure ranges.
- Unit test: ordinary Flash Point operating pressure does not erase the wave through ambient DOT.
- Unit test: an OX-1 incident records affected enemies, channel/source damage, and attributable
  deaths.
- Headless balance: doing nothing fails; intended setup passes primarily because of OX-1 attack
  events; poor timing or placement produces intermediate damage.
- E2E: clicking multiple actual Pixi rooms changes the inspector while the guide remains open.
- E2E: dragging pans without selecting; clicking without dragging selects.
- E2E: Flash Point exposes one gas conduit control, visibly shows its mixed flow, and never exposes
  separate H2/O2 feed toggles.
- E2E: the guide remains present through the first readable combat incident and allows free board
  inspection before continuing.
- E2E: disabling the tutorial still enters Level 2 directly.
- Full typecheck, unit suite, build, and E2E suite pass.

## Implementation log

### 2026-07-12 - rewrite opened

- Recorded the four substrate mismatches and the replacement invariants above.
- Started independent read-only audits for transport, spatial map/input, and combat/tutorial.
- Confirmed before implementation that the intended Flash Point setup kills all ten crawlers via
  the broad pressure channel, with eight receiving no combustion-pulse contribution at all. This
  is the baseline defect the new combat tests must prevent.
- Captured a green baseline before changing domain state: TypeScript passed and all 58 unit tests
  passed across 9 files.

### 2026-07-12 - independent audits received

- Spatial audit reproduced the map-selection failure in and out of tutorial. The unconditional DOM
  pointer capture steals Pixi's pointer-up/tap. It also found that the displayed path for a bundled
  run can differ from the geometry of its hidden member lines.
- Spatial audit expanded the rewrite boundary: canonical grid cells must own rooms, corridors,
  doors, ports, and conduit routes; room volume must derive from geometry; enemy path ranges must
  distinguish rooms from corridors; rings must derive from Core distance.
- Combat audit confirmed OX-1 is not an attack in the current engine. It is a room pressure scalar
  sampled as ordinary DOT, with static damage beginning almost exactly where slowdown begins.
- Combat audit established the replacement boundary: finite damage-source IDs orthogonal to the
  five channels, a centralized packet resolver, structured persisted incidents, per-enemy and
  per-round attribution, deliberate reaction/combat step ordering, and tutorial evidence based on
  a real assault incident rather than `combustionCount`.
- Transport audit requires deleting connection IDs, line state, routing groups, and their commands
  rather than retaining them privately. State will contain one gas conduit and one liquid conduit
  per run, each with one mixture inventory, route, capacity, and binary actuator.
- Transport endpoints will be visible room-local junctions. Tanks, equipment buffers, rooms, vent,
  and recovery attach through local non-player-operated ports; all outgoing unfiltered conduits
  draw the junction mixture. Branch requests must be allocated from a snapshot so ID order cannot
  become an invisible routing priority.
- All later scenarios require redesign because several old bundled runs hid simultaneous opposing
  traffic. No level may retain that behavior behind the new conduit UI.

### 2026-07-12 - domain and persistence replacement

- Replaced V7 connection arrays, routing groups, line state, and material-specific commands with V8
  `gasConduits`, `liquidConduits`, room-local gas/liquid junctions, and one `set_conduit` command.
- Each room-pair phase now owns one serializable route, one binary actuator, one capacity, one
  retained whole-mixture inventory, total/per-species telemetry, and one block/drive cause.
- Rebuilt every campaign loadout and reference policy around those physical conduits. Flash Point
  now begins with one visible Core starter header containing 76 H₂ + 38 O₂, one dry Core–R-02 gas
  conduit, blank R-02 sockets, and no R-05 starter inventory.
- Local source/equipment/room junctions are not player-operated lines. Multiple enabled branches
  allocate the upstream junction snapshot proportionally, so run-ID ordering cannot steal all flow.
- Route cells now derive conduit length, swept volume, maximum response, endpoints, liquid crest,
  and rendered path. A dry gas or liquid conduit cannot discharge until its routed volume has been
  swept full; no material appears at the destination after the first solver tick.
- Initial atmosphere now scales with each room's visible usable volume and absolute temperature, so
  every differently sized room starts at the same ambient static pressure. Liquid pickup depth and
  free-volume UI also use geometry-derived room volume rather than the old global 100-unit value.
- Added a conserving V7→V8 migration. It merges every hidden legacy line inventory into the
  corresponding room-pair phase, weights gas temperature by retained quantity, preserves even
  over-capacity migrated inventory, maps the old oxygen reserve to the new starter header, records a
  migration event, and leaves directionally ambiguous actuators off.

### 2026-07-12 - spatial world and input replacement

- Added one 112×70 canonical facility grid owning rock, room bounds, excavated corridors, shafts,
  doors, sockets, utilities, conduit cells, Core anchor, and monster path sections.
- Ring classification, room volume, room hit testing, liquid surfaces, enemy occupancy, conduit
  endpoints, and Pixi drawing now derive from that shared geometry. Core is physically central and
  corridor segments explicitly have no room exposure.
- Replaced disconnected bands with a continuous terrain cross-section. Pan/zoom operates on this
  same world rather than switching to a diagram view.
- Map pointer capture now begins only after a six-CSS-pixel drag threshold. A canvas tap reaches the
  Pixi room hit area; a drag pans without selecting the release room.
- Added a five-second map incident layer with expanding OX-1 shock rings and coalesced pressure/kill
  plaques tied to persisted incident records.

### 2026-07-12 - combat and tutorial causality replacement

- Added a central proportional damage-packet resolver over the five durable channels and explicit
  finite damage-source IDs. Same-tick lethal packets are capped without order bias and update enemy,
  round, incident, event, and death attribution together.
- Static pressure now slows above 1.3 atmospheres but deals continuous pressure damage only above
  the separate catastrophic threshold of 2.2 atmospheres. A residual flash pressure scalar is
  visual/physical state and cannot repeatedly damage a later arrival.
- H₂/O₂ combustion now returns an explicit one-shot pressure/heat burst. The simulation deliberately
  spawns due hostiles, resolves reactions/bursts against physical room occupants, applies continuous
  exposure, then moves/breaches enemies.
- Added structured durable incidents with source, room/zone, reaction extent, impulse, heat, actual
  targets, capped per-channel damage, pre/post health, world position, and kill status. Room UI and
  map feedback render this history separately from current conditions.
- The guide no longer selects rooms. It explains why R-02 is the serviced corridor chamber, teaches
  one mixed-gas fan, waits for a real zero-target prime incident, continues into assault, and pauses
  once after a real attributed OX-1 kill so the full board remains inspectable.
- Development-only E2E mode freezes only the interval clock. Its deterministic evidence still calls
  the conserved flash reaction, central combat resolver, structured incident recorder, and normal
  guide predicates; there is no test-only simulation command or tutorial-success flag.

### 2026-07-12 - tests replaced with substrate assertions

- Replaced connection-oriented unit tests with whole-mixture conservation, one-conduit-per-pair,
  routed-capacity latency, fair branch allocation, geometry volume, corridor occupancy, damage
  attribution, incident durability, save migration, and guide-causality assertions.
- Rewrote Playwright coverage around actual Pixi room clicks, drag threshold, exactly one shared
  Flash Point actuator, visible Core source/junction ownership, real prime/combat evidence, paused
  inspection, save reload, material overlay, and physical-route hover.
- Focused TypeScript and 32 integration/unit assertions passed during integration. The first full
  Playwright run passed 12/13; the only failure was obsolete Level 2 copy (`Separated products`
  versus the authored `Co-products`) and the assertion was updated before the final proof below.

### 2026-07-12 - integration defects caught and corrected

- Focused transport tests caught the first solver's CSTR-like behavior: the first packet could leave
  on the tick after entering an otherwise empty long duct. Discharge now begins only after the full
  route-derived swept volume has filled, making displayed distance actual response latency.
- Geometry tests caught two leftover global-volume assumptions in liquid pickup submergence and the
  room free-volume display. Both now use `roomVolume(roomId)`. Initial gas also scales by visible
  usable volume and absolute temperature, so every authored room starts at 101.3 kPa.
- A later solver audit found inlet demand was calculated before destination backpressure scaled
  discharge. A full blocked conduit could therefore accept replacement material for inventory that
  had not left. Both gas and liquid planners now reconcile inlet headroom against the allocated
  outgoing amount before shared-source allocation; a regression test holds both phases at capacity
  against a blocked destination.
- The first full policy sweep revealed that Levels 3–5 still passed with no player actions because
  pre-enabled feed/recovery hardware created lethal pressure or hypoxia. Installed critical
  conduits now begin off, and the reference policy explicitly commissions the taught branches. This
  preserves the “installed scaffolding” progression without starting from a solved factory.
- The V7 migration audit replaced a tautological round clamp with the authored level length and now
  preserves every species from the legacy oxygen tank rather than only its O₂ field.
- Development-only deterministic tutorial evidence now transfers its H₂/O₂ charge out of the real
  Core header before invoking the normal flash/combat rules; even test mode does not synthesize
  untracked material.
- Final independent audits found and closed additional drift paths: missing monster corridors and
  empty polylines now fail fast instead of drawing a direct schematic shortcut; utility nodes are
  grid-authored and host-validated inside `FACILITY_MAP`; the conduit solver consumes the canonical
  grid-to-world conversion; and submerged liquid pickup uses equipment-displaced usable volume.
- The combat/tutorial audit reproduced the first real prime flash at the old 18-second automatic
  lock boundary. Flash Point now has a 24-second prime, a regression proves its real flash occurs
  while the Start Assault action still exists, and guided mode pauses on that incident for unlimited
  board inspection. Starting assault resumes the simulation through the normal phase command.
- The migration audit found that a real V7 Flash Point cathode stock/feed remained in the obsolete
  Inner Bay path. Flash Point migration now moves that stock and feed exactly once into the Core
  starter source/conduit, clears the old cathode buffer, and prevents nonexistent run phases from
  inheriting legacy installation flags.

### 2026-07-12 - final proof

- `make ci` passed: ESLint, Prettier check, TypeScript, Terraform format check, and 49/49 Vitest
  assertions across 11 files. Coverage was 83.06% statements, 60.24% branches, 85.30% functions,
  and 85.20% lines.
- `pnpm run build` produced the static Vite site successfully. Vite reports only its non-blocking
  large-chunk advisory for the Pixi/React client bundle.
- `pnpm test:e2e` passed 13/13 Chromium scenarios, including the full guided causal chain, selectable
  Pixi rooms during guidance, drag-safe camera input, exactly one shared Flash Point actuator,
  visible Core ownership, durable prime/combat incidents, save reload, tutorial-disabled Level 2,
  physical-route hover, material overlay, and compact layout.
- A final seeded sweep of 10 random policies per level ran through the pure engine outside CI. Every
  do-nothing policy failed and every authored intended policy passed. Flash Point finished at 100%
  Core with 9 OX-1 kills / 452 attributed OX-1 damage; one-action random policies passed only 25%,
  while two-action policies passed 100% with 96% average Core. Level 2 separated 0% one-action,
  50% two-action, and 100% three-action policies. Level 3's intended policy passed at 52% Core,
  preserving meaningful execution pressure. Levels 4 and 5 also separated incomplete from intended
  policies without unstable terminations.
- Final searches found no runtime/UI references to legacy connection IDs, per-material commands,
  routing priorities, starter Inner Bay stock, or bundled hidden line state. `git diff --check` is
  clean.

## Deviations and unresolved decisions

None. The MVP still uses room-scale finite volumes rather than per-tile CFD, as explicitly intended;
fixed conduit routes use the same editable grid-cell shape reserved for later player-drawn routing.

## Product review pause

On 2026-07-12, after the implementation and verification pass, the user determined that the design
remains substantially different from the intended game. This rewrite is therefore not an accepted
gameplay direction despite passing its technical invariants and tests. Further implementation is
paused pending renewed design work; the next pass must start from product-level critique rather than
incremental test or surface-UI repair.
