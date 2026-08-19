# ADR-0013: Fixed campaign hull and operation checkpoints

Date: 2026-08-17
Status: accepted

## Context

The campaign already has twelve named sites, three narrative acts, persistent characters, and a
specific Pell conclusion. Run seeds, branching routes, drafts, and permadeath add progression
questions before the authored campaign and tower-defense loop are complete.

The vessel still benefits from persistent physical history. Towers, upgrades, and occasional
room grafts give the vessel a campaign-scale shape and make Matter spending matter beyond one site.

## Decision

One save slot contains one persistent vessel moving through one fixed twelve-site campaign.

- Campaign order, narrative reveals, and site maps are authored.
- Hull rooms, room grafts, hull-mounted towers, upgrades, Matter, Core state, inventories, and
  narrative progress persist between operations.
- Room grafting is a campaign-scale purchase made between operations. Its Matter cost targets roughly
  six to ten ordinary upgrades, leading to about two or three grafts across the campaign without a
  count cap.
- A failed operation restores its pre-assault campaign checkpoint and may be retried.
- Site-installed tower value is recovered when the vessel departs unless the site contract defines a
  specific lasting consequence.

This decision supersedes ADR-0003 and ADR-0004.

## Consequences

Campaign balance can assume a bounded sequence of unlocks, resources, graft opportunities, and
narrative state. The save model needs an operation checkpoint plus durable hull and campaign state,
not a terminal run record.

Reference defenses must remain campaign-legal across site boundaries. Graft cost is evaluated
against future geometry and placement value, while ordinary tower upgrades remain the frequent
spending decision.
