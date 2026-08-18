# Changelog

All notable user-visible changes are recorded here.

## Unreleased

### Tower defense

- Rebuilt ordinary combat around seven direct tower chassis with free grid-snapped floor, wall,
  and ceiling placement. Towers expose mount-specific arcs, range, cadence, target capacity,
  targeting policy, upgrades, attack state, damage contribution, and recovery value.
- Added authored ingress and route graphs to the side-view maps. Enemies traverse multiple vertical
  paths while first and last targeting compare route progress across lanes.
- Added placement previews, route coverage, tower rendering, projectiles, damage feedback, target
  controls, movement, rotation, upgrades, and dismantling to the map and defense panel.

### Campaign and construction

- Replaced the campaign's combat sites with twelve fixed five-wave tower-defense operations while
  preserving the Deep Shear claim rig, three-act route, dialogue, reports, travel, and Pell ending.
- Added save-backed operation checkpoints and retries. Hull-mounted towers and upgrades travel with
  the rig; site-mounted defenses return their authored recovery value at departure.
- Reworked room grafts as rare persistent hull purchases attached through authored graft slots.
  Grafted rooms add vertical tower surfaces and retain their purpose-specific process-equipment
  sockets.

### Chemistry and environment

- Kept conserved chemistry, finite inventories, process equipment, gas and liquid routing,
  temperature, pressure, and room atmospheres as deterministic world systems while direct towers
  supply the campaign's ordinary damage.
- Added explicit tower-supply and environmental-field contracts. Later operations can route a
  prepared gas to a compatible tower mode or apply a bounded atmospheric movement field without
  making chemical synthesis a prerequisite for defense.

### Guidance and verification

- Replaced reaction-combat lessons with tower placement, route coverage, wall and ceiling geometry,
  targeting, upgrades, and graft guidance. The facility manual now includes the complete tower
  catalog, and the control panel switches between defenses and room systems.
- Added deterministic tower, route, campaign carryover, checkpoint, graft, chemistry-bridge,
  portfolio, and browser coverage plus a continuous save-backed reference run through all twelve
  sites.
- Advanced saves to schema 27 and authored content to version 19. Current pre-release saves accept
  this format only.

## pre-tower-defense-rework - 2026-08-17

### Chemistry and construction

- Reworked chemistry legibility around duty vessels, site palettes, and depth-one hazards.
  Engineered reactions now run inside four new vessels — Catalytic Reactor, Packed Bed, Catalytic
  Burner, and Absorber Column — whose loaded medium selects the duty shown on their spec plate,
  while spontaneous chemistry stays ambient. Every site scopes its supplies, seeds, and build
  catalog to a palette of one to three process families, hull hazard reservoirs sell direct
  feedstock packets so each offensive family damages from one visible step, iron is the labeled
  support family, and the Kettleblack lesson now teaches bed-vessel operation.

### Campaign and narrative

- Replaced the per-site tutorial opt-out with a campaign-wide field guidance choice, made when a
  save is created and checked by default. Every run now plays every site, its dialogue, layouts,
  and waves; clearing the choice runs them with the coaching, task rail, and step gates stood down.
- Added the captain's log: a full-screen campaign surface with acts as expandable headers and their
  sites as entries, replacing the stack of briefing modals that used to open over the plant. Act
  overviews, contract briefings, after-action records, the contract route map, and the hangar all
  read from one page, and play starts from the current filing.
- Moved hull grafting into the log's hangar, reachable from the same page as the route.

### Presentation

- The menu, assault, and boss themes now sometimes play as a full-length recorded version instead
  of the chip stems. Each track rolls once on entry; the recorded version takes over on the same
  bar boundary and with the same fades the chip stems use, and the mood mix continues to follow the
  fight. Tracks without a recording, and rolls whose recording is still downloading, play the chip
  stems.
- Consolidated the between-level flow into two coherent surfaces: a shared wave report (round
  result, site completion, and campaign outcome now use one stats card and seal) and the captain's
  log for everything between sites.
- Tutorial field stories open as a modal on the play surface, where the chambers they name are
  visible behind them.
- Reworked narrative conversations into an accumulating channel transcript: each advance reveals
  the next line while the full conversation stays visible, and briefing dialogue no longer gates
  the begin action.
- Travel now plays as a timed transit that docks at the next site automatically; clicking the
  transit docks immediately.

## v0.1.0 - 2026-07-19

### Campaign and narrative

- Added a twelve-site, three-act campaign set in the Glass Frontier with localized briefings,
  talking-head conversations, debriefs, and a complete Pell Cordon finale.
- Added authored enemy levels, five-wave sites, visible forecasts, and multiple viable defense
  portfolios across the campaign.

### Chemistry and combat

- Added thirty balanced reactions spanning chlorine, carbon-steam, nitrogen-oxide, iron, nickel,
  fluorine, and uranium process families.
- Added eight Cthonic enemy types with flying, ladder-running, staged armor, shared protection, and
  finite reagent-emission behavior.
- Added mathematical first-order and transient second-order balance tooling tied directly to the
  compiled campaign and deterministic runtime.
- Added saturating species dose-response bounds and tutorial failure controls to keep accumulated
  reagents and earlier partial builds inside their authored combat roles.

### World and construction

- Rebuilt sites as validated side-view maps with physical rooms, passages, ladders, doors, process
  lines, and generated exteriors.
- Added a persistent mobile hull, between-site grafting, room modules, site travel, and conserved
  plant state across the run.
- Added player-routed gas and liquid lines with preview, length-scaled cost, binary operation, and
  whole-mixture finite-volume transport.

### Presentation

- Added refined animated 2D sprites for enemies and machines plus unified cutaway art for the Core,
  rooms, portals, walkways, and ladders.
- Added an in-world Encyclopedia, bestiary, process manual, localized tutorial system, and adaptive
  stem-based music.
- Added live reaction-engine change and homeostasis feedback during Prime plus first-order conduit
  response estimates that show rough target-room effectiveness arrows on direct map hover and
  before process telemetry.

### Bug fixes

- Reinforced Make the Reagent's acid-line waves so raw chlorine handles the opening lessons while
  the Thermal Coil, Gas Agitator, and downstream HCl line decide the later assaults.
- Fixed authored pipe direction so every newly installed process line follows its declared source
  and destination.
- Fixed room and portal presentation so passages read as open cutaways and hull rooms remain
  visually distinct from disposable site structures.
