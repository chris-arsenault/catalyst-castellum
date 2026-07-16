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

The hull model (user-specified 2026-07-16): the player owns a **small** hull — **Core +
R-06 washlock** — to start. The furnace (R-02) and every process room are **site**
structure, so a defense built in a site room (the OX-1 in the furnace) is **temporary
and does not carry**. Only machines placed in **owned** rooms travel (there may be none
early). **Grafting** (a between-sites dock action, not every dock) grows the hull from
core+1 → core+2 rooms — that is how the player builds something permanent.

1. **Seed hull = Core + washlock** (committed): the pack map tags Core and R-06 washlock
   as hull; the Core carries a starboard hardpoint into open space. Furnace and all
   process rooms are site. Provenance/hardpoints are inert to the sim step — determinism
   snapshot and balance contracts unchanged.
2. **Only the owned hull travels** (committed, proven by `hullPersistence.test.ts`): a
   machine built in the site furnace is left behind at the dock; a machine placed in the
   owned washlock carries to the next site. The producer strips the incoming hull's
   rooms from a site before embedding, so a site never double-supplies a player room.
3. **Grafting gated to the dock** (committed): `graft_module`/`dismantle_module` require
   a site's first build phase (`roundIndex === 0`); the graft-mode toggle only shows at
   the dock. Faithful to grafting being between sites, not between rounds.
4. **CL-1 owns a generated exterior** (committed): `make_the_reagent` uses the seeded
   authored-chunk layout engine instead of OX-1's map. The selected raised-reservoir
   candidate places CL-02/CL-03 on an elevated process deck, carries Core + washlock
   into the dock, preserves the chlor-alkali lines, and supports both ground and flying
   breach paths. `pnpm site:candidates` generates further scored SVG candidates.

## Remaining (design-sensitive — needs user direction)

These are the player-facing tutorial-content decisions, distinct from the shipped
architecture:

- **What the player grafts at dock 1, and why.** The Core hardpoint can grow the hull;
  what module/lesson does dock 1 teach the player to graft, and what do they put in the
  new owned room that carries?
- **Teaching moment for grafting** at dock 1: a guide/step/copy in the travel→dock flow
  into make_the_reagent, including framing the hull-vs-site distinction (why the site
  OX-1 didn't carry).
- **Multi-site run verification**: play the connected run (flash_point → dock →
  make_the_reagent → …) with the hull carrying, and confirm each site still plays/teaches
  correctly and the balance holds. (Campaign-health currently plays each site in
  isolation, not as a connected run.)
- **Grafting availability at site 1**: currently the Core hardpoint makes grafting
  reachable at every dock including site 1; the lesson is meant for dock 1 (site 1→2).
  Whether to hide grafting until dock 1 is a tutorial-pacing choice.
- **Remaining site exteriors** for the HCl stages still use the OX-1 authored map.

Exit gate (unchanged): `make ci` green; full e2e tutorial suite green; balance contract
tests green — re-run once the graft lesson and multi-site verification land.
