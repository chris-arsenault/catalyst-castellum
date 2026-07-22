# Changelog

All notable user-visible changes are recorded here.

## Unreleased

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
