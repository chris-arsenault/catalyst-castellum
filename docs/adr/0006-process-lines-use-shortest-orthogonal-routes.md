# ADR-0006: Process lines use shortest orthogonal routes

Date: 2026-07-19
Status: accepted

## Context

ADR-0005 established routed connections and proposed an auto-router that preferred empty service
space, avoided room interiors, and avoided existing process lines. In the assembled side-view map,
those penalties produced long decorative detours and made a pipe's route harder to relate to its two
rooms. Process lines render above room cutaways and do not alter enemy movement, room occupancy, or
architectural passage.

## Decision

Player-built and generated process lines use a deterministic shortest orthogonal path between their
phase-specific room endpoints. Every in-bounds cell has equal travel cost; a small turn cost resolves
equal-length paths toward simpler shapes. Routes may cross room interiors and other process lines.

The preview and build command call the same router, and the resulting cells remain stored on the
connection. Route length continues to determine Matter cost, retained volume, latency, lift, and
rated response.

## Alternatives considered

- **Avoid room interiors and existing lines with soft penalties** — preserved service-space
  aesthetics but created long routes whose geometry obscured the room pair and increased physical
  costs for visual reasons.
- **Treat rooms and lines as hard obstacles** — produced unroutable pairs on dense or grafted maps
  and made process topology depend on decorative lane availability.
- **Player-authored waypoints** — offered exact visual control at the cost of a map-editor workflow
  for every connection.

## Consequences

- A connection reads as the direct relationship between two rooms, and its preview matches the
  installed line exactly.
- Process lines may visually cross rooms or one another; their foreground rendering and interaction
  layers preserve room selection and architectural readability.
- Same map, phase, and endpoint pair always produce the same route and physical parameters.
- ADR-0005 remains authoritative for connection identity, storage, validation, and origin-blind map
  data; this record supersedes only its routing preference.
