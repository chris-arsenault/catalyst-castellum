# src/game/world

The deterministic world contract and fixed campaign materialization.

- **Map**: the vertical 2D world consumed by the simulation. It contains the vessel hull, site rooms,
  terrain, architectural connections, enemy route graphs, valid construction surfaces, graft slots,
  process lines, and their shared route geometry.
- **Enemy routes**: authored ingress-to-Core graphs with splits, merges, elevation changes, and
  movement costs. Stable route progress supports deterministic movement and tower targeting.
- **Tower placement**: grid anchor, floor, wall, or ceiling face, footprint, and orientation.
  Placement validation owns support, clearance, route obstruction, range, and line-of-sight rules.
- **Site materialization**: a pre-operation join embeds the persistent vessel hull into one fixed,
  authored campaign map and returns validated topology.
- **Map validation**: shared invariant checks run when a map is created, restored, or changed during
  play.
- **Hull extraction**: the player-owned rooms, grafts, towers, upgrades, inventories, and internal
  connections carried to the next campaign site.

This directory belongs to the simulation layer and imports no React, Pixi, or browser APIs.
