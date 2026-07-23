# ADR-0008: Sites scope chemistry through fixed palettes

Date: 2026-07-22
Status: accepted

## Context

Every site exposes the full six-family, 30-reaction catalog: supplies are authored per level,
generation randomizes only geometry, and no chemistry-family taxonomy exists anywhere in the
content or engine. The concurrent possibility space at any site is the entire catalog, which
playtesting shows is more than a player can hold while making build decisions. The roguelite
direction already assigns feedstock taps to procedurally assembled exteriors, and the campaign
diversity contract requires each open site to support several materially distinct builds.

## Decision

A six-family taxonomy — chlorine-sodium, carbon-steam, nitrogen-oxide, iron, nickel, and
uranium-fluorine — tags every reaction, species, supply, and vessel. Each site declares a palette
of two to three families, and the site's supplies, vessel availability, and build menu derive from
that palette. The palette system lives in the world-generation layer as the destination
architecture: the twelve authored campaign levels pin fixed palettes, and the future run map draws
seeded palettes through the same system. Concurrent possibility space at a site becomes roughly
eight to twelve reactions; the full catalog becomes variety across sites and runs.

## Alternatives considered

- **Seeded per-dock palettes now** — converts the post-tutorial campaign into generated palette
  sites immediately, but forces run-shape and site-pool decisions that are deliberately
  uncommitted, and roughly doubles the rework.
- **Hand-scoped supplies per level without a taxonomy** — achievable with today's authoring, but
  leaves nothing reusable for generated sites and duplicates scoping logic across levels, tooling,
  and UI.
- **Global reaction unlock progression** — shrinks the early space by gating the catalog on
  campaign position, but reintroduces curriculum framing and conflicts with the open-defense
  contract that keeps established builds viable everywhere.

## Consequences

- The family enum, the tag maps, and compiler validation that every reaction, species, supply, and
  vessel carries exactly one family are net-new content architecture.
- Site identity strengthens: a site's palette is visible in its briefing, supplies, and build
  menu, and portfolio diversity checks evaluate against the palette rather than the full catalog.
- Palette assignment per level is an authored balance decision with the same acceptance authority
  as the existing portfolio contract.
- The future run map consumes the palette system unchanged; seeded palette drawing remains backlog
  work.
