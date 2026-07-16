# M6 — Tutorial re-authored on the walking-castellum model

Corrected understanding (2026-07-16, user): the tutorial is **already a multi-site run** —
site 1 OX-1 (Flash Point, 5 rounds), site 2 NaCl (make_the_reagent), site 3 HCl
(stored_chlorine / acid_line). The whole reason for this architecture: the old
site→site transition was **jarring** because the map stayed the same but the player's
built machines vanished and the pipes were different. The fix: the **hull (Core +
furnace + everything the player built in them — equipment and hull-internal pipes)
persists across sites**; only the site (exterior rooms, feedstock/taps, waves) changes.
**Grafting is a between-sites (dock) action**, taught at the dock between site 1 and
site 2, and available at every dock after.

## Shipped in M6 so far

1. **Seed hull** (committed): the pack map tags Core + R-02 furnace as hull provenance;
   the furnace carries one hardpoint. Provenance/hardpoints are inert to the sim step —
   determinism snapshot and balance contracts unchanged. The graft-mode toggle surfaces
   in the tutorial for the first time.
2. **Hull defenses persist across a site transition** (committed, proven by
   `hullPersistence.test.ts`): building an OX-1 in the furnace (agitator + core→furnace
   feed), then travelling and docking to the NaCl site, carries the agitator and the
   feed intact — the concrete fix for the jarring OX-1→NaCl reset. The producer strips
   the incoming hull's rooms from a site before embedding, so a site never
   double-supplies a player room.
3. **Grafting gated to the dock** (committed): `graft_module`/`dismantle_module` require
   a site's first build phase (`roundIndex === 0`); the graft-mode toggle only shows at
   the dock. Faithful to grafting being between sites, not between rounds.

## Remaining (design-sensitive — needs user direction)

These are the player-facing tutorial-content decisions, distinct from the shipped
architecture:

- **What the player grafts at dock 1, and why.** Entering the NaCl site with an armed
  hull, what module/lesson does dock 1 teach? (A second flash chamber? A reagent room
  for NaCl chemistry?) This is site-specific design.
- **Teaching moment for grafting** at dock 1: a guide/step/copy in the travel→dock flow
  into make_the_reagent.
- **Multi-site run verification**: the existing sites' authored loadouts vs. the carried
  hull. When the player arrives at make_the_reagent with an OX-1-armed furnace, does the
  site still play correctly / teach NaCl? Re-verify balance across the run and confirm
  no site jarringly re-supplies hull rooms.
- **Per-site authoring** if a site needs its exterior re-expressed so the hull carries
  cleanly (most is already handled by the producer's hull-strip).

Exit gate (unchanged): `make ci` green; full e2e tutorial suite green; balance contract
tests green — re-run once the graft lesson and multi-site verification land.
