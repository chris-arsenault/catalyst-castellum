# ADR-0003: The random-layout producer assembles authored chunks by seed

Date: 2026-07-15
Status: accepted

## Context

The main game needs randomized maps, but the simulation depends on carefully shaped
spatial data: orthogonal routes, room-pair line invariants, portal adjacency,
elevation-driven physics, and navigable enemy paths. Maps are made by producers
(ADR-0001); this record fixes how the random-layout producer works.

## Decision

The random-layout producer assembles maps from authored material; it does not
synthesize cells:

- Authors write **chunks**: parametric map fragments (room clusters with bounds,
  connections, feedstock taps, hull-facing dock edges) in the Map vocabulary.
- The producer composes chunks plus the player's hull fragment into a complete Map and
  the level's waves, deriving every random draw from the run seed. Waves are parametric
  templates instantiated per site tier.
- Every produced Map passes the same validation as authored maps (route checks,
  room-pair line invariant, breach-to-hull navigability). A map that fails validation
  is a producer bug and throws; producers never ship partially valid output to the sim.
- The hybrid producer is the same machinery with an authored skeleton constraining the
  draw; the authored producer is the degenerate case with no draws at all.
- Producers run before a level starts, outside the fixed-timestep simulation. The sim
  step remains RNG-free.

## Alternatives considered

- **Cell-level procedural generation**: maximal variety, but reproducing the spatial
  invariants (orthogonal routes, sensible elevation profiles, navigable breach paths)
  from raw cells is a research project and every failure lands in the sim.
- **Fully authored maps only**: no generator risk, but the roguelite promise of
  randomized maps dies, and content cost scales linearly forever.

## Consequences

- Variety comes from the chunk vocabulary and assembly rules; growing the game means
  authoring chunks, which reuses the existing map-authoring muscle.
- Map validation is one shared module used by every producer and by in-play map edits.
- Same seed, same run: replays and the balance harness get deterministic maps for free.
