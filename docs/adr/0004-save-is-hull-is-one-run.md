# ADR-0004: A save is one hull is one run

Date: 2026-07-15
Status: accepted

## Context

"Persistent per save" admits several roguelite death models: a legacy hull that survives
across runs, a run-scoped hull with a meta-progression ledger, or a hybrid scarred hull.
Each drives a different save model, defeat semantics, and balance envelope. No meta
progression exists yet.

## Decision

One save slot holds exactly one run, and the run's identity is its hull:

- Starting a new game creates a fresh seed hull and a fresh run seed.
- The hull, its grafted modules, and all plant state persist across every site of that
  run and are serialized with the save.
- Defeat ends the run. The slot records the outcome; continuing means a new run with a
  new hull.
- Meta progression and any cross-run legacy are explicitly future work (see the
  backlog); nothing in the save model may quietly depend on cross-run state.

## Alternatives considered

- **Legacy hull across runs**: strong attachment, but balance must scale sites to an
  unbounded hull and defeat loses its teeth; requires the meta layer we have not
  designed.
- **Scarred hybrid hull**: keeps attachment with structural loss on defeat, but is the
  hardest to balance and to communicate, and still presupposes the meta layer.

## Consequences

- Balance targets a bounded envelope: the hull a player can grow within one run.
- The save schema stays simple: run state and hull state are one document; no meta
  ledger file exists yet.
- When meta progression arrives it will be additive (a separate cross-slot ledger), not
  a rework of run saves.
