# Changelog

All notable user-visible changes are recorded here.

## Unreleased

### Presentation

- Consolidated the between-level flow into two coherent surfaces: a shared wave report (round
  result, site completion, and campaign outcome now use one stats card and seal) and a single
  arrival briefing that combines the contract conversation, mission objective, and tutorial field
  story on one screen.
- Reworked narrative conversations into an accumulating channel transcript: each advance reveals
  the next line while the full conversation stays visible, and briefing dialogue no longer gates
  the begin action.
- Travel now plays as a timed transit that docks at the next site automatically; the dock button
  remains as an immediate skip.
- Tutorial stage stories moved into the arrival briefing (level-opening guides) and the round
  report (guides that start on a later round), removing the separate stage-intro screen.

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
- Added enemy-adjusted defensive posture during Prime plus held-operation conduit comparisons that
  show damage per traversal, route control, production support, and affected-room markers before
  process telemetry.

### Bug fixes

- Reinforced Make the Reagent's acid-line waves so raw chlorine handles the opening lessons while
  the Thermal Coil, Gas Agitator, and downstream HCl line decide the later assaults.
- Fixed authored pipe direction so every newly installed process line follows its declared source
  and destination.
- Fixed room and portal presentation so passages read as open cutaways and hull rooms remain
  visually distinct from disposable site structures.
