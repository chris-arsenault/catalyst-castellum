# Spatial platform-world rewrite ledger

Date started: 2026-07-12

Status: complete; three independent adversarial audits passed

This ledger is the binding completion contract for replacing the facility diagram with a
tile-addressable, side-view platform world. A visual resemblance to `map.png` or `map2.png` is not
completion. Each requirement must be represented in canonical facility data, consumed by the
simulation, rendered from that same data, and protected by an automated test.

## Why the previous rewrite was insufficient

The previous facility rewrite added world coordinates around the old room graph without replacing
its semantics:

1. Most rooms remained the same 14 by 8 cell size.
2. Long widened corridor centerlines occupied most of the facility envelope.
3. Enemies still followed room IDs and interpolated between room centers.
4. Ladders, shafts, floors, doors, and falls were rendering details rather than navigation rules.
5. Natural reagent exchange did not derive from the architectural openings used by enemies.

No item in this ledger may be closed by changing only Pixi drawing code, copy, or authored
coordinates.

## Canonical spatial-world invariants

- Every in-bounds cell has canonical terrain: solid, room air, platform, ladder, door, trapdoor,
  or permanently sealed Core structure.
- Every non-solid atmospheric cell belongs to exactly one room region. Chemistry remains lumped per
  room, but room volume derives from its actual atmospheric cells.
- Rooms use intentionally varied width and height. The authored map includes at least one tall
  chamber, one wide shallow chamber, and one compact chamber.
- Room atmospheric cells occupy most of the playable facility envelope. Rock forms the exterior,
  shared walls, floors, and partitions instead of separating isolated room nodes with large voids.
- Floors, internal platforms, ladders, holes, doors, and trapdoors occupy real grid cells.
- Architectural room adjacency is derived from first-class portals. There is no separately authored
  schematic room graph used as a movement shortcut.
- Dedicated gas and liquid conduits remain a separate routed network. A conduit may connect rooms
  that have no architectural portal and never creates an enemy path or natural leak.

## Enemy-navigation invariants

- Enemy position is a cell/world position plus locomotion mode, not a room-route segment and
  normalized room-to-room progress.
- Ground enemies walk only through open cells with support, climb only on ladder cells, fall through
  unsupported openings until landing, and cross doors/trapdoors only when their state allows it.
- The canonical navigation path is calculated over cells. Room membership is derived from the
  enemy's current cell and is used only for lumped hazard exposure.
- The authored tutorial path includes visible walking, climbing, falling, and a final sealed-Core
  door transition.
- Future flying navigation can use the same terrain grid with a different neighbor policy; it is not
  implemented as another room-center interpolation.

## Architectural reagent invariants

- The same portal that permits architectural traversal defines gas and liquid conductance between
  its adjacent rooms.
- Gas crosses open passages and rises through open vertical shafts based on pressure, density,
  elevation, and portal conductance.
- Liquid spills across a side opening only above its sill and drains downward through a floor hole,
  ladder shaft, or open trapdoor.
- Closing an architectural opening disables both its applicable navigation edges and natural
  reagent conductance. A reagent-only room seal may instead block gas/liquid conductance while
  leaving movement open; this is explicit portal state, not a hidden topology fork.
- Portal seal groups are equipment-ready and do not require a future world-model replacement.
- The Core has no atmospheric exchange even though reaching its entrance completes an enemy breach.
- Architectural exchange conserves every transported species and thermal energy within normal
  solver tolerance.

## Rendering invariants

- The default map is primarily rooms and architecture, not connection bands over an empty field.
- Room bounds, walls, floors, platforms, ladders, openings, doors, and trapdoors render from the
  canonical cell/portal data.
- Enemies render at their simulated cell/world positions and visibly use distinct walk, climb, and
  fall poses or orientation.
- Dedicated process routes remain overlays and are visually distinct from architectural openings.
- Selecting a room uses its complete spatial region; the presence of platforms or ladders does not
  turn it back into a rectangular diagram node.

## Required automated proof

- Geometry tests classify every cell and prove unique atmospheric ownership, in-bounds structures,
  varied room dimensions, room-dominant occupancy, and volume derived from cell count.
- Navigation tests prove that the authored entry-to-Core path contains walk, climb, fall, and door
  actions and never uses a room-center shortcut.
- Navigation tests prove a removed ladder or closed door makes the appropriate route unreachable.
- Combat tests prove room exposure changes when an enemy crosses the actual room-boundary cell.
- Gas tests prove upward transfer through an open shaft and no transfer through the same sealed
  portal.
- Liquid tests prove downward drainage through a floor opening, sill-controlled side spill, and no
  transfer through a closed trapdoor.
- Conservation tests cover architectural gas and liquid exchange independently of dedicated
  conduits.
- Rendering tests or E2E assertions prove architectural structures are present and enemy movement
  advances across real cells.
- Full lint, formatting, typecheck, unit suite, production build, and E2E suite pass.

## Implementation log

### 2026-07-12 - rewrite opened

- Reviewed both annotated Draw.io PNGs, including their embedded labels.
- Recorded the binding domain, navigation, transport, rendering, and proof requirements above before
  changing implementation.
- Started independent read-only audits for spatial composition, cell locomotion, and architectural
  reagent transport.

### 2026-07-12 - canonical platform world replaced

- Deleted corridor definitions, widened centerlines, monster connection polylines, and the authored
  room-ID monster route from the live domain model.
- Authored a compact 76 by 40 cell facility with six distinct room dimensions, a tall lift chamber,
  a wide upper chamber, shared walls, a real internal platform, a continuous ladder, two gravity
  drops, a trapdoor, passages, and a permanently sealed Core door.
- Compiled every in-bounds cell to immutable terrain and room ownership. Room atmospheric cells
  occupy more than 65% of the complete room envelope, and finite room volume now counts those cells
  while excluding solid platforms.
- Kept dedicated conduit blueprints as an independent grid-routed network. Their endpoints remain
  room-owned, but no conduit cell changes enemy navigation or architectural permeability.

### 2026-07-12 - cell locomotion replaced

- Replaced `EnemyState.route + segment` with a persisted typed cell path, path index, interpolation
  progress, locomotion mode, and facing.
- Added deterministic cell search with grounded horizontal support, ladder-only vertical climbing,
  unsupported gravity descent, state-gated portal cells, a sealed-door transition, and a separate
  open-air neighbor policy for flying enemies.
- Enemy world position now interpolates only between adjacent grid-cell centers. Room exposure is
  derived from the current world cell, while Core breach happens at the sealed entrance goal.
- Rendering consumes engine locomotion mode and facing for distinct walking, climbing, falling,
  door, and flying silhouettes.

### 2026-07-12 - architectural reagent network added

- Added persistent portal state separate from conduit state. Every portal has shared room endpoints,
  exact connector cells, a crossing kind, aperture, gas conductance, liquid conductance, sill,
  gravity mode, seal group, open state, and sealed state.
- Added snapshot-planned whole-mixture gas exchange with pressure, density, elevation, diffusion,
  source allocation, destination headroom, species conservation, and thermal mixing.
- Added snapshot-planned liquid spill/drain exchange. Side passages require liquid above their sill;
  shafts, holes, and trapdoors drain from the higher room; closed or sealed portals transfer
  nothing; the Core door has zero reagent conductance.
- Natural portal flow runs independently of fans and pumps. Live gas/liquid rates render as small
  portal arrows and appear in each selected room's architectural-opening readout.

### 2026-07-12 - persistence and proof replaced

- Bumped persistence to v9 and added a v8 migration that converts active room-segment enemies into
  cell paths and initializes authored portal states. Existing v7 material migration now lands
  directly in the v9 world.
- Added geometry proofs for complete cell classification, unique atmospheric ownership, varied
  dimensions, room-dominant area, room-volume derivation, portal contiguity, conduit independence,
  and coordinate transforms.
- Added path proofs for walk, climb, fall, and door ordering, grounded adjacency, ladder-only climb,
  gravity direction, and route failure when the ladder or Core door closes.
- Added combat integration proof for a complete cell traversal through every chamber and locomotion
  mode, with room exposure still derived from physical position.
- Added architectural flow proofs for upward gas transfer, sealing, downward mixed-liquid drainage,
  closed trapdoors, sill-controlled spill, and per-species conservation.
- Added browser proof that the tile world and all seven room-owned openings are wired into the live
  map and inspector; replaced the old hard-coded conduit hover coordinate with the live blueprint.
- Verification passed: ESLint, Prettier, TypeScript, 60 Vitest assertions, production build, 14
  Chromium E2E scenarios, and the separate headless playtester.

### 2026-07-12 - adversarial structural gap closure

- Re-audited the first implementation separately across spatial geometry/rendering, enemy combat and
  tutorial movement, and architectural transport. The audits found and recorded engine-level gaps
  rather than treating the first green test run as completion.
- Moved the Core breach goal from an ordinary Washlock cell onto the first authored closed door
  cell. Navigation now reaches that exact cell through normal neighbor construction, uses its real
  portal identity and door terrain, and permits no closed-door crossing into Core atmosphere. A
  separate endpoint-to-endpoint proof shows the full door crossing is impossible while closed and
  uses both connector cells when opened.
- Added explicit permanently sealed Core-shell terrain around the Core. It is non-atmospheric,
  non-traversable, supportive terrain rendered from the canonical cell classifier; authored door
  connectors take precedence where they cut the shell.
- Corrected room atmospheric enumeration to consume the complete facility-cell cache. Host-owned
  passage, shaft, trapdoor, floor-hole, and door connector cells now contribute to room volume,
  rendering, gas zones, and liquid fill rather than disappearing when outside the rectangular room
  bounds.
- Replaced rectangular liquid-height interpolation with bottom-up filling across actual
  atmospheric row capacity. Internal platforms reduce row capacity, connector elevations
  participate, architectural spill tests consume this surface, and vertical drain direction now
  derives from portal endpoints rather than room centers.
- Replaced broad rectangular gas/liquid fills with a render projection of the same canonical cells
  used by room physics. Connector atmosphere is visible, platform cells remain solid, each liquid
  cell fills to the physical surface, and room selection attaches to the drawn region instead of a
  hard-coded rectangle.
- Added a pure enemy render projection and proof that an engine movement step changes the rendered
  map position and locomotion pose. Hazard zoning now samples actual enemy elevation, floor-contact
  hazards exclude climbing/falling enemies, and the room-boundary exposure proof advances through
  the real connector cell.
- Hardened v9 persistence so all canonical portal states are mandatory and persisted enemy paths
  must be in bounds, adjacent, terrain-compatible, portal-consistent, locomotion-legal for the enemy
  type, and terminated at the canonical breach cell.
- Current verification passes: ESLint, Prettier, TypeScript, 81 Vitest assertions, production build,
  and all 14 Chromium E2E scenarios. A one-policy-per-level headless playtest smoke completed; it
  reports intended-plan success for L1 and L5 and intended-plan failure for L2 through L4. The
  default 200-policy analytical run remains deliberately separate and long-running rather than a CI
  gate.

### 2026-07-12 - final adversarial audit passed

- The combat audit found that liquid corrosion still treated every walking enemy as floor-contact,
  even on a platform above the liquid. Contact now compares actual enemy foot elevation with the
  canonical cell-profile liquid surface, with dry-platform and immersed-floor regressions.
- The combat audit also produced legal-looking but impossible saved paths: walking sideways out of
  a gravity hole and falling down a ladder. Save validation now calls the same ground/flying neighbor
  policy used by live pathfinding, and both exact mutations are rejected by regression tests.
- The transport audit replaced a vacuous equal-temperature conservation proof with a 118 °C source
  and 4 °C destination, checking both destination warming and the full thermal ledger. A synthetic
  portal whose endpoints oppose its room-center ordering protects endpoint-derived gravity.
- Removed the unused authored `traversal` field. Portal kind compiles connector terrain, and that
  terrain is the single movement-policy source consumed by navigation; authored fields can no longer
  silently disagree.
- The spatial audit now executes the production Pixi architecture drawing functions against real
  graphics objects and checks shell, platform, ladder, door, and trapdoor operations. Browser proof
  clicks a canonical platform cell and an out-of-bounds host-owned connector cell and verifies their
  room selection.
- Final independent results: spatial/rendering PASS, combat/navigation/persistence PASS, and
  architectural transport/domain PASS. No concrete structural contract gap remains in the audited
  rewrite.
