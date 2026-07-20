# Backlog

Planned-but-not-built work. Each item describes a future repository or game state; ordering remains
a product decision.

## Campaign and roguelite

- Define and implement the main-game run shape, including the fixed-length or endless completion
  model.
- Add a branching run map that lets the crew choose the next docking site.
- Add module drafting after site clearance, with several viable room-module offers.
- Add cross-run progression as a separate ledger for module templates, recipes, and starting-hull
  variants while each save remains one hull and one run.
- Expand the generated-site vocabulary into biome-specific chunk families with distinct feedstock
  taps, terrain profiles, and enemy ecologies.
- Give Twelve-Cask and Morrow Pocket distinct exterior maps while preserving their authored lessons
  and balance contracts.

## Onboarding and information

- Add a guided first-dock graft lesson that explains hull ownership, disposable site rooms, and the
  first permanent module choice.
- Expose each round's construction availability and the reason a machine, line, or supply remains
  locked.
- Add connected-run campaign health coverage that plays site transitions with the carried hull,
  grafts, inventories, and equipment intact.

## Process and combat systems

- Add capacity upgrades and conserved admission filters to process lines, including explicit
  backpressure, hold-up, and Matter costs.
- Add aerosol suspension, settling, filtration, and resuspension for uranium-bearing stationary
  material.
- Extend the enemy behavior vocabulary with conserved liquid/steam emitters, regenerating
  carapaces, and lower-to-upper-layer stage changes.
- Add further reagent chains and enemy counters through the existing mass-action, stationary
  inventory, and catalyst systems.
- Add hull damage and repair as a site-defense consequence.

## Construction and interface

- Add free-form edge-snapped graft placement if authored hardpoints constrain useful hull layouts.
- Move map hover and selection updates out of render so React never reports a cross-component state
  update during `GameMap` rendering.
