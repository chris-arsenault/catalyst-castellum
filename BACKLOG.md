# Backlog

Planned future game states. Ordering remains a product decision.

## Campaign combat

- Complete the direct tower roster, projectile and effect vocabulary, targeting policies, and
  authored upgrade families.
- Give every campaign site a validated multi-route vertical map and five direct-combat waves.
- Re-author campaign health around tower placement, target service, route coverage, Matter, and Core
  integrity.
- Add campaign checkpoint retry and remove run-ending assumptions from save presentation.
- Add hull damage and repair as a persistent campaign consequence.

## Construction and grafting

- Add free grid-snapped tower placement on compatible floor, wall, and ceiling surfaces.
- Add tower footprints, structural support, clearance, orientation, line of sight, and firing-arc
  previews.
- Convert room templates to persistent graft geometry with purpose-specific internal slots and a
  campaign-scale Matter cost.
- Balance campaign income around two ordinary graft purchases and an optional third through saving.
- Move map hover and selection updates out of render so React never reports a cross-component state
  update during `GameMap` rendering.

## Routing and enemies

- Author route graphs with multiple ingress points, branches, joins, and vertical transitions.
- Add deterministic movement costs per enemy archetype and route-distance targeting across lanes.
- Expose every wave's ingress, expected route, movement traits, and support relationships.
- Extend the enemy behavior vocabulary with additional visible movement, support, and phase states.

## Field guidance and information

- Replace chemical field lessons with tower placement, targeting, upgrades, vertical coverage, and
  route-capacity lessons.
- Rebuild tower and enemy inspection around immediate combat contribution and route state.
- Add a guided graft lesson tied to the first permanent hull expansion.

## Chemistry and transport

- Integrate pipes as visible tower-supply and battlefield-control relationships after the first
  direct-combat sites are complete.
- Integrate atmospheric fields, floor films, heat, pressure, and bounded byproducts as authored
  tower and enemy interactions.
- Add process-oriented grafts that combine tower surfaces with storage, transport, or atmosphere
  capacity.
