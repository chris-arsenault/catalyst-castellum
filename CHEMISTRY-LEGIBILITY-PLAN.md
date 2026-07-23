# Chemistry Legibility Rework — Implementation Plan

Make the chemistry possibility space legible without shrinking its physical accuracy. Engineered
reactions move into vessel classes whose loaded catalyst selects the reaction, every offensive
family damages enemies at depth one from site-supplied feedstock, and each site scopes chemistry
to a fixed two-to-three family palette. Out of scope: the run map and seeded per-dock palettes,
module drafting, and a stationary-supply economy (loadout seeding stays).

## Confirmed decisions

- Engineered chemistry runs in 4 new vessel classes (Catalytic Reactor, Packed Bed, Catalytic
  Burner, Absorber Column) plus the two existing cells; the loaded catalyst/bed medium selects
  the reaction ([ADR-0007](docs/adr/0007-engineered-reactions-run-in-vessels.md)).
- A wild set stays ambient under the rule: spontaneous in open air/water in reality → ambient;
  needs engineered conditions → vessel. OX-1 combustion and CL-2 recombination stay wild, which
  preserves the flash and acid-line tutorials. Accelerator equipment keeps multiplying the wild
  set only.
- The palette system is built in worldgen as destination architecture; all 12 authored levels
  declare fixed 2–3 family palettes; seeded palettes stay backlog
  ([ADR-0008](docs/adr/0008-site-chemistry-palettes.md)).
- Iron is the explicit support/carrier family, exempt from the depth-one promise; the five
  offensive families each damage at depth one from supplied feedstock
  ([ADR-0009](docs/adr/0009-damage-at-depth-one.md)).
- One content-version and save-schema bump at the end of the rework; intermediate milestones keep
  the current version while unreleased.

## Context / reuse map

**Reused as-is:**

- Generic stoichiometry primitives: `src/game/engine/reactionExecutor.ts`
  (`applyReactionExtent`, `maximumReactionExtent`, `reactionReactantCandidates`) and
  `MutableReactionInventory` — the vessel runner is built on these.
- Vessel-with-outputs pattern: `EquipmentDefinition.operation` and output ports in
  `src/game/facilityTypes.ts:55-120`; per-output buffers via `createEquipmentInstance`
  (`src/game/engine/equipment.ts`).
- Spec-plate UI precedent: `src/components/processControls/EquipmentOperationStatus.tsx`
  (equation, rate, limiting factor, output buffers for the two cells).
- Direct supply of intermediate species: the supply system already ships steam/CO/HF
  (`src/game/types.ts:72-98`, validation in `src/game/authoring/supplyValidation.ts`).
- Room-hosts-equipment predicates: `roomEquipmentIsActive`/`findRoomEquipment`
  (`src/game/engine/equipment.ts:64-111`).
- Typed command path: `evaluateCommand`/`executeCommand`
  (`src/game/engine/commandPolicy.ts`, `src/game/engine/commands.ts`).

**Reused but retuned:**

- The cell operation runner `simulateEquipmentOperations`
  (`src/game/engine/equipmentOperations.ts`) and its authoring validation
  (`src/game/authoring/equipmentOperationValidation.ts`) hard-require electrolysis behavior —
  both generalize to arbitrary reaction behaviors; output ids (`EQUIPMENT_OUTPUT_IDS`,
  fixed 3-tuple) and `limitCode` (closed anode/cathode/outlet union) widen.
- Ambient dispatch: `simulateRoomChemistry` (`src/game/engine/reactions.ts:285-315`) and the
  mass-action filter (`src/game/engine/massActionReactions.ts:348-377`) gain the
  engineered-reaction gate.
- Balance workbook: `tooling/combatBalance.ts` reaction-cap table and
  `src/game/balance/throughputModel.ts` re-express room-vs-vessel throughput.
- Reference portfolios: `src/game/content/playtestPortfolios*` command sequences re-authored
  against vessels and palettes.
- Tutorial concept models: `flashPointConcept.ts`/`acidLineConcept.ts` survive with wild-set
  OX-1/CL-2 but re-verify; `makeReagentConcept.ts` (membrane cell) is already vessel-shaped.

**Built new:**

- Six-family taxonomy and tag maps for reactions, species, supplies, vessels; compiler
  validation.
- General vessel runner hosting mass-action chemistry inside vessels; vessel catalyst slot and a
  typed load/unload command.
- Four vessel-class equipment definitions and their catalyst→reaction bindings.
- Palette type in worldgen (`src/game/world/siteGeneratorTypes.ts`), palette-derived supply,
  vessel availability, and build-menu scoping; fixed palette declarations on all 12 levels.
- Depth-one supply content for currently product-only species (ammonia, NO₂, chlorine,
  hypochlorite, HCl) with pricing/caps.
- Automated depth-one and palette contracts in campaign health.

## Cross-cutting constraints

- `src/game/engine/**` imports no `content`/`config`/`definition` — vessel and family behavior
  flows through the compiled definition, like reactions today (`tooling/checkArchitecture.ts`).
- Every new player action (catalyst loading) goes through typed command evaluation; UI
  availability derives from the same decisions.
- Determinism, elemental conservation, and finite inventories hold inside vessels: catalysts are
  non-consumed rate selectors, vessel buffers are finite volumes, and the simultaneous-solve
  ordering stays definition-order independent.
- All player-facing strings are locale keys (`copy:check`); copy follows the narrative style
  guide's affirmative present-tense rules.
- The campaign diversity contract (≥4 distinct clearing builds, ≥1 cross-family hybrid, idle play
  loses) now evaluates against each site's palette and remains the acceptance authority.
- Palette architecture is destination-shaped: authored levels pin palettes through the same
  system the future seeded run map will consume — no interim scoping mechanism.
- Per-change verification is `make quick-ci` plus targeted unit tests; `make ci`,
  `pnpm campaign:health`, `pnpm balance:combat`, and e2e run at the milestones that change their
  domains.

## Milestones

### M1 — Family taxonomy and reaction classification

Content architecture only; simulation behavior unchanged.

- Six-family enum; every reaction, species, and supply carries exactly one family; reactions
  carry a wild/engineered classification field (no gating yet).
- Compiler validation for complete, single-family tagging.
- Exit: `make quick-ci` green; taxonomy validation passes for the full catalog; simulation
  fixtures byte-identical.

### M2 — General vessel operation runner `[depends on M1]`

Engine capability; the two cells keep working unchanged.

- Generalize `simulateEquipmentOperations` and authoring validation beyond electrolysis to host
  mass-action (and other applicable) behaviors inside a vessel.
- Widen output identifiers and limit codes; add the vessel catalyst slot to equipment instances.
- Exit: `make quick-ci` green; new runner unit battery passes; existing cell and
  mass-action tests green.

### M3 — Vessel classes, catalyst command, ambient gating `[depends on M2]`

The possibility-space flip.

- Author the four vessel classes and their catalyst→reaction bindings; engineered reactions gate
  out of ambient dispatch; the wild set stays ambient.
- Typed load/unload-catalyst command with policy evaluation.
- Decided wild set (9): OX-1, CL-2, P-1, CL-3, CL-4, CL-5, CS-4, NO-3, UF-1 — combustion,
  recombination, dissolution, neutralization, hypochlorite chemistry, ambient NO oxidation, and
  UF₆ hydrolysis all proceed spontaneously at room scale.
- Decided vessel bindings (19 engineered reactions; loaded medium selects the enabled duties,
  feeds and windows select among them):

  | Vessel class      | Loaded medium   | Reactions                          |
  | ----------------- | --------------- | ---------------------------------- |
  | Catalytic Reactor | iron catalyst   | NO-1 ammonia synthesis, CS-2 shift |
  | Catalytic Reactor | nickel charge   | NI-5 methanation, CS-6B reforming  |
  | Packed Bed        | solid carbon    | CS-1, CS-3, CS-6A                  |
  | Packed Bed        | iron oxides     | FE-1, FE-2, FE-3                   |
  | Packed Bed        | nickel media    | NI-1, NI-2, NI-3, NI-4             |
  | Packed Bed        | uranyl fluoride | UF-2 recovery                      |
  | Catalytic Burner  | platinum        | NO-2, NO-5, NO-6 (window-split)    |
  | Absorber Column   | water charge    | NO-4 nitric acid absorption        |
  | Membrane Cell     | —               | CL-1 (unchanged)                   |
  | Fluorine Cell     | —               | UF-3 (unchanged)                   |

  Nickel carbonyl migration stays physical: NI-2 volatilizes from a warm nickel bed, the gas
  moves by ordinary transport, and NI-3 deposits into any hot Packed Bed, loading it as catalyst
  media.

- Exit: `make quick-ci` green; unit tests prove every engineered reaction runs only in its
  vessel and every wild reaction still runs ambiently.

### M4 — Spec plates and build UI `[depends on M3]`

- Generalize the cell status panel into the spec plate for every vessel class (resolved
  equation, feeds, outputs, rate, limiting factor, catalyst).
- Build menu grouped by vessel class with catalyst→reaction options; locale keys for all new
  copy.
- Decided names: Catalytic Reactor, Packed Bed, Catalytic Burner, Absorber Column — real process
  terms matching the existing two-word roster (Gas Agitator, Membrane Cell). Decided voice: the
  spec plate states the duty the loaded medium enables, affirmative present tense ("Iron charge:
  converts nitrogen and hydrogen feed to ammonia."), with the equation, windows, and limiting
  factor derived from the compiled definition.
- Exit: `make quick-ci` green (including copy checks); spec plate renders for all six vessel
  classes in component tests.

### M5 — Depth-one supplies and iron support labeling `[depends on M1]`

- Supply-content definitions for ammonia, NO₂, chlorine, hypochlorite, and HCl with reservoir
  phase assignments; chain-vs-buy pricing and caps.
- Iron labeled the support family in palettes, encyclopedia, and spec plates.
- Decided band structure: precursors (H₂, O₂, N₂, steam, water, brine, CO, CO₂, HF) keep their
  current cheap/unlimited authoring. Band A (starter hazard: the palette's primary supplied
  hazard) — generous cap, ~1.5× the synthesized Matter-equivalent, available round 1. Band B
  (convenience intermediate) — tight cap, ~3×, available mid-site. Exact values are M7 workbook
  outputs.
- Decided assignments: direct-supply species appear from Morrow Pocket onward (guided Act I
  levels keep their authored lessons). Morrow Pocket: chlorine A, hypochlorite B. Cordon 41:
  ammonia A, NO₂ B, chlorine B. Junction L-6: none new — supplied CO plus seeded nickel is
  already depth one; nickel carbonyl is never supplied. Pell Cut: chlorine B. Station 14: none
  new — supplied HF is depth zero. Vasker Store: chlorine A, hydrochloric acid B, ammonia B.
  Lane Six: ammonia A, NO₂ B. Pell Cordon: chlorine A, ammonia A, NO₂ B, hypochlorite B.
- Exit: `make quick-ci` green; an automated depth-one contract asserts every offensive family
  reaches damage in ≤1 step from some supplied feedstock.

### M6 — Palette system and level assignments `[depends on M1, M5]`

- Palette type in the worldgen layer; supplies, vessel availability, and build menu derive from
  the palette; compiler validates palette completeness.
- All 12 levels declare fixed 2–3 family palettes.
- Decided palettes (guided Act I levels may pin one family; open sites pin two or three; each
  introduction site pairs the new family with the strongest established one):

  | Level            | Palette                         |
  | ---------------- | ------------------------------- |
  | Flash Point      | chlorine-sodium                 |
  | Make the Reagent | chlorine-sodium                 |
  | Stored Chlorine  | chlorine-sodium                 |
  | Morrow Pocket    | chlorine-sodium                 |
  | Kettleblack      | carbon-steam, iron, chlorine    |
  | Cordon 41        | nitrogen-oxide, chlorine-sodium |
  | Junction L-6     | nickel, carbon-steam, chlorine  |
  | Pell Cut         | uranium-fluorine, chlorine, Ni  |
  | Station 14       | uranium-fluorine, carbon, Cl    |
  | Vasker Store     | chlorine, nitrogen-oxide, iron  |
  | Lane Six         | carbon-steam, nickel, nitrogen  |
  | Pell Cordon      | chlorine, nitrogen, uranium     |

  Junction L-6 pairs nickel with carbon-steam because NI-2 consumes CO; Station 14 pairs uranium
  with carbon-steam because UF-1 consumes steam — palette pairs are chemically coupled, not
  arbitrary. Implementation amendments (2026-07-22): chlorine-sodium joins every site that ships
  brine and a membrane cell, keeping the established defense viable; Morrow Pocket stays
  single-family because Act I availability offers no second family's vessels; Pell Cut keeps its
  authored nickel seeds by naming nickel in its palette. Lane Six is the one brine-free site.
  Compiler validation enforces supplies/seeds/availability ⊆ palette per level.

- Exit: `make quick-ci` green; build-menu and supply scoping proven in unit tests; every level
  compiles with a valid palette.

### M7 — Balance and portfolio re-authoring `[depends on M3, M5, M6]`

- Re-author reference portfolio builds against vessels and palettes; keep failure-control builds
  losing.
- Re-express the balance workbook's throughput model around vessel grades; extend campaign
  health with the depth-one and palette contracts.
- Exit: `make ci` green including `campaign-health`; `pnpm balance:combat` shows distinct but
  overlapping cost/survival bands per archetype.

### M8 — Tutorials, encyclopedia, and copy `[depends on M4, M6]`

- Re-verify and repair the flash, acid-line, and Kettleblack concept models and guides;
  Kettleblack's lesson teaches vessel-and-catalyst operation.
- Encyclopedia regrouped by family with vessel cross-links; doctrine/flavor for new vessels and
  supplies per the style guide.
- Exit: `make quick-ci` green; `pnpm test:e2e` tutorial flows green.

### M9 — Design docs, versioning, changelog `[depends on M7, M8]`

- Rewrite `docs/chemical-process-design.md` and `docs/campaign-defense-design.md` as current
  state (vessel model, palettes, depth-one, iron support); update the AGENTS campaign section.
- Bump `contentVersion` (`src/game/definition.ts`) and the save-schema literal
  (`src/game/persistence/saveCodec.ts`); one curated CHANGELOG line.
- Exit: `make ci` green; docs assert the shipped model with no future-state or historical
  phrasing.

### Decision register

All decisions are settled; execution stops on none. The four content decisions below were
delegated to Claude on 2026-07-22 and are recorded inline at their milestones.

| Where | Decision                    | Settled as                                          |
| ----- | --------------------------- | --------------------------------------------------- |
| M3    | Wild-set membership         | 9-reaction spontaneous roster; bindings table in M3 |
| M4    | Vessel names and copy voice | Catalytic Reactor, Packed Bed, Catalytic Burner,    |
|       |                             | Absorber Column; duty-statement voice               |
| M5    | Supplied species and bands  | A/B band structure; per-site table in M5            |
| M6    | Per-level palettes          | Coupled-pair table in M6                            |
