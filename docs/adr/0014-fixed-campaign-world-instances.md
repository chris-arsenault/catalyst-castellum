# ADR-0014: Fixed campaign maps use deterministic world instances

Date: 2026-08-17
Status: accepted

## Context

ADR-0001 established one `WorldMap` as the simulation's spatial contract, and ADR-0002 replaced
closed room and connection unions with deterministic instance identities. Both decisions included
random map producers and run-seed identity because the campaign direction at that time used
generated runs.

The fixed campaign retains one map contract, persistent hull geometry, authored site cutaways, and
runtime grafting. It needs deterministic identity without making generation or a run seed part of
the active architecture.

## Decision

The simulation consumes one validated `WorldMap` for the current operation.

- Each campaign site authors its vertical geometry, ingress routes, construction surfaces, process
  connections, and attachment relationship to the persistent hull.
- Site materialization combines that authored site with the saved hull before the operation begins.
- Authored rooms, routes, and connections keep stable authored identities.
- Grafts, towers, and player-built connections derive deterministic identities from their owner,
  attachment or placement, and a persisted monotonic instance sequence.
- Runtime systems iterate world catalogs in canonical identity order.
- Validated commands replace the map when construction, grafting, or topology changes require a new
  spatial object.
- Room provenance identifies hull-owned and site-owned state for travel, recovery, and persistence.

This decision supersedes ADR-0001 and ADR-0002. ADR-0012 governs tower placement, enemy route
graphs, and graft slots. ADR-0013 governs campaign persistence and checkpoints.

## Consequences

The simulation, presentation, save codec, and authoring compiler continue to share one spatial
contract. Campaign maps remain reproducible through authored identity. Grafts and construction keep
stable save identities across travel and restore.

Map validation covers geometry, route reachability, construction surfaces, connections, provenance,
and identity uniqueness. Adding a site changes authored content rather than introducing a separate
world-generation path.
