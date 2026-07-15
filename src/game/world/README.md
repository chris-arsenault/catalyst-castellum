# src/game/world

The Map contract and map producers.

- **Map**: the single world object the simulation runs on — a 2D grid of rooms
  (rectangles with area, environmental properties, sockets, and taps) and connections
  (portals, doors, ladders, gas/liquid lines) between any two rooms, each connection
  carrying its route geometry. Everything the engine needs derives from the Map
  (ADR-0001).
- **Producers**: pre-level processes that return a validated Map — authored,
  random-layout, and hybrid — each accepting the player's persistent hull fragment as
  input (ADR-0003).
- **Map validation**: the shared invariant checks run by every producer and by in-play
  map edits (ADR-0005).
- **Hull fragment**: extraction of the player-owned rooms, contents, and
  interconnections from an ending Map, for embedding in the next one (ADR-0004).

This directory is part of the simulation layer: no React, Pixi, or browser imports.
