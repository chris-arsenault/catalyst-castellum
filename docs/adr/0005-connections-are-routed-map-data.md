# ADR-0005: Connections are routed map data between arbitrary rooms

Date: 2026-07-15
Status: superseded by ADR-0006

## Context

Process lines existed as a closed catalog of per-pair "transport runs", each with a
hand-authored route blueprint; players could only build or toggle runs an author had
pre-declared. Architectural openings (portals, doors, ladders) were similarly fixed at
authoring time. A map-first world (ADR-0001) with player-editable topology cannot
enumerate its connections up front.

## Decision

A connection is first-class Map data joining any two rooms:

- Every connection carries a **kind** (gas line, liquid line, portal, door, ladder,
  trapdoor), its **route geometry** on the grid, and its actuator/aperture data. Route
  geometry keeps driving the physics: length sets swept volume and latency, crest
  elevation sets liquid behavior, endpoints set port heights.
- Connections are created three ways, all producing identical data: authored (in a map
  script or chunk), generated (by a producer), or **player-built during play** as a map
  edit.
- Player-built process lines get their route from an **orthogonal auto-router** over
  the grid (avoiding room interiors and existing lanes where possible); the resulting
  path is stored on the connection exactly as an authored blueprint would be.
- Map validation applies uniformly regardless of origin: at most one gas and one liquid
  line per room pair, orthogonal adjacency, endpoints inside their rooms, and
  navigability rules for architectural connections.

## Alternatives considered

- **Keep the closed run catalog and grow it**: every new room pair needs authored
  blueprints; generated maps and grafted rooms would have no legal connections; player
  freedom stays capped at toggling authored intent.
- **Player-drawn routes** (manual waypoint drawing instead of auto-routing): maximal
  control, but a heavy editor UX for marginal gain; the auto-router stores the same
  data, and drawn routing can be layered on later without model change.

## Consequences

- The pipe board and drag-to-build UX generalize from "toggle authored pairs" to "route
  between any two rooms," and grafted or generated rooms are connectable with no extra
  authoring.
- The auto-router becomes a real engine component with deterministic output (same map,
  same request, same route) so builds replay identically.
- Authored maps keep hand-placed routes where aesthetics matter; authoring becomes a
  special case of the same data, not a separate system.
