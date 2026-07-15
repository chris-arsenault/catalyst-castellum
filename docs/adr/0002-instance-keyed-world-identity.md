# ADR-0002: Rooms, runs, and portals are instance-keyed, not closed unions

Date: 2026-07-15
Status: accepted

## Context

`RoomId`, `TransportRunId`, and portal ids were closed literal unions derived from const
arrays in `identifiers.ts`. `GameState` records, the Zod save schema (exhaustive records
in Zod 4), every engine loop, and the UI keyed off those unions. A dynamic world — grafted
rooms, generated sites — cannot enumerate its identifiers at compile time.

## Decision

World identity becomes opaque string instance ids carried by runtime catalogs:

- `GameState` gains world catalogs: the room instances, transport-run instances, and
  portal instances that currently exist, each carrying its definition data (geometry,
  junction spec, run phases) or a template reference plus instance parameters.
- Engine loops iterate the catalogs in a canonical stable order (sorted instance id),
  never a const array. Determinism is preserved by ordering, not by closed enumeration.
- Instance ids are namespaced and deterministic: authored content keeps its authored ids
  (`hull:core`, `site:switchyard`); grafted modules and generated site pieces derive ids
  from their creation sequence and the run seed (`hull:module-007`,
  `site:chunk-3-bay-2`), so replays from the same seed produce identical ids.
- The save schema validates catalogs structurally (each entry against its instance
  schema) rather than exhaustively against a global key list.
- Species, reactions, equipment, enemies, and buffer/source ids remain closed unions:
  they are content vocabulary, not world topology, and their exhaustiveness still buys
  type safety.

## Alternatives considered

- **Oversized static id pool** (`room_00`…`room_63` pre-declared): keeps unions but caps
  world size, litters state with dead entries, and makes generated content collide with
  the pool's semantics.
- **Per-pack generated types**: codegen of unions per content pack keeps compile-time
  safety but cannot cover runtime grafting or seeded generation at all.

## Consequences

- The type system trades key-exhaustiveness for catalog validation; state validation and
  the pack/site validators become the correctness backstop.
- Save format changes shape (new version); pre-release saves are invalidated by the
  existing pack `contentVersion` gate.
- Content authoring is unchanged in feel: authored ids are still readable strings; only
  their type widens.
