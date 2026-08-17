# ADR-0012: Vertical placement, routes, and graft slots

Date: 2026-08-17
Status: accepted

## Context

The rig is a vertical 2D cutaway. Floor, wall, and ceiling placement can create different firing
arcs, line-of-sight relationships, and answers to climbing or flying enemies. Restricting ordinary
towers to authored hardpoints would discard much of that spatial choice.

Room grafting needs a narrower structural boundary. A persistent room can only join the hull where
geometry and utilities permit, and the new room may include equipment positions specific to its
purpose.

Traditional tower defense also needs more than one linear ingress path. Towers require stable route
progress for targeting while maps need authored splits, merges, climbs, drops, and alternate lanes.

## Decision

Ordinary towers use free grid-snapped placement on valid floor, wall, and ceiling surfaces. A
placement records an anchor cell, mounting face, footprint, orientation, and tower identity.
Validation checks support, clearance, route obstruction, ownership, cost, firing arc, range, and line
of sight through one typed command decision.

Enemy movement uses authored ingress-to-Core route graphs. Route edges carry traversal type, length,
and movement cost. Path selection and route progress are deterministic and available to targeting
queries.

Room grafts attach only at authored hull graft slots. A graft may provide new free-placement
surfaces, route connections, utility connections, and specific internal equipment positions. Graft
slots are not tower hardpoints.

## Consequences

Placement controls need face selection, orientation, footprint and clearance previews, range, arc,
line of sight, and route coverage. Wall and ceiling towers can differ mechanically without separate
map abstractions.

Map authoring and validation must prove that each active route reaches the Core, remains traversable,
and retains legal defense space. Save state must preserve tower placements, graft geometry, and
route-relevant changes by stable identity.
