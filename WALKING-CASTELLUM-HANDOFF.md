# Walking Castellum — Handoff

State snapshot for the next agent. Repo: `catalyst-castellum` (browser chemical-flow tower
defense, Vite SPA, deterministic sim in `src/game/`). Branch: `main`, clean, everything below is
pushed. Read `WALKING-CASTELLUM-PLAN.md` (the milestone plan) and the ADRs in `docs/adr/` first;
this doc is the "where we are right now" layer on top of them.

## Milestone status

| Milestone                                                         | State                                                  |
| ----------------------------------------------------------------- | ------------------------------------------------------ |
| M1 instance-keyed world identity                                  | ✅ done                                                |
| M2 the Map contract (sim + UI run on one WorldMap)                | ✅ done                                                |
| M3 connections as player map edits (auto-router, preview-confirm) | ✅ done                                                |
| M4 producers + hull fragment                                      | ✅ done                                                |
| M5 run loop + grafting                                            | ✅ done                                                |
| **M6 tutorial re-authored**                                       | 🔶 **in progress** — see below                         |
| M7 random/hybrid producers                                        | 🔶 generator foundation shipped; main game not started |

`WALKING-CASTELLUM-M{1..6}-STEPS.md` hold the per-milestone step detail and execution notes.

## The mental model (hard-won from user corrections — do not re-derive)

- **The tutorial is a multi-site RUN**, not one level. Sites: (1) OX-1 = `flash_point` 5 rounds,
  (2) CL/NaCl = `make_the_reagent` (chlor-alkali; the user calls this "CL-1"), (3) HCl =
  `stored_chlorine`/`acid_line`. The whole point of the walking-castellum architecture is to fix
  the **jarring** old transition where the map stayed the same but the player's built machines and
  pipes vanished.
- **The hull is what persists; the site is disposable.** Hull = **Core + R-06 washlock** (small,
  authored in `src/game/content/worldMap.ts` with `provenance: "hull"`). The **furnace (R-02) and
  every process room are `site`**. Only machines placed in **owned/hull** rooms carry to the next
  site; a defense the player builds in the site furnace (the OX-1) is **temporary and does not
  carry**. Proven by `src/game/hullPersistence.test.ts`.
- **Grafting is a between-sites (dock) action**, NOT between rounds. It grows the hull core+1 →
  core+2. Gated to a site's **first build phase after the first site** (`phase === "build" &&
roundIndex === 0 && levelIndex > 0`) in `evaluateGraftModule`/`evaluateDismantleModule`
  (`commandPolicy.ts`) and the graft-mode toggle (`MapChrome.tsx`). The Core carries a `starboard`
  hardpoint. Modules catalog in `src/game/content/modules.ts` (utility_pod / process_chamber /
  reservoir_stack) — an **open data catalog**; more/arbitrary types are expected.
- **Main-game run shape is deliberately UNCOMMITTED** (fixed-length vs endless). Build for the
  tutorial only; don't lock the model into either.
- Memory file `game-vision-roguelite-castellum.md` holds the durable vision; keep it current.

## What just shipped (this session, all pushed)

Pipe UX overhaul + hull model correction + visual hull cue:

- **Pipes route dynamic shortest-path**, crossing rooms as a top overlay (user asked for this
  explicitly and repeatedly — **do not add room/lane avoidance back**). `src/game/world/autoRouter.ts`
  is uniform `STEP_COST` + tiny turn tie-breaker. `worldMap.ts` computes every process-line route
  via `routeConnection` (no hand-drawn blueprints; the routes in `worldMapConnections.ts` are dead
  fallback cruft, safe to delete later).
- **Only built (installed) pipes render** on the map. Filter with optional-chained record access
  (`game.gasConduits[id]?.installed`), NOT `conduitState()` — `world.connections` includes
  architectural portals, and per-kind conduit records are disjoint, so both throw on the wrong id.
- **Cursor confirm popup** replaces the old right-panel card: `PipePreviewPopup.tsx`, "Connect A ⇄
  B" + Cancel / Gas / Liquid (each with cost). Confirming **builds AND enables** the line so it
  flows immediately and the tutorial predicate registers it.
- **Click a pipe's open segment to toggle** it (both phases). The interaction lives in `PipeHitLayer`
  (invisible fat hit-line) rendered **beneath the rooms** in `MapScene.tsx`, so a pipe crossing a
  room never steals that room's click; the visual pipe stays on top. Consequence: pipe hover/toggle
  only works where the route is in open space (a room on top wins there) — this is intentional.
- **Hull rooms wear a cyan bracket frame** (`roomGraphics.ts` `drawHullFrame`, fed by
  `RoomDrawModel.provenance`) so Core + R-06 read as owned.
- Determinism snapshot regenerated for the new route lengths; balance contracts unchanged.

## Site 2 exterior (shipped 2026-07-16; ready for user reaction)

- `make_the_reagent` / CL-1 now runs on a **distinct generated exterior**, selected seed
  `20260720`: entry + CL-01 stay low while CL-02 and CL-03 form a raised chlor-alkali process deck
  over the carried R-06 washlock. OX-1's furnace and gallery are absent from this disposable site.
- The durable generator lives in `src/game/world/siteGenerator.ts`: deterministic authored-chunk
  assembly, seeded chunk order/pattern/alignment draws, automatic passages/ladders, dynamic process
  routing, validation, candidate scoring, and hull embedding. CL-1's vocabulary is
  `src/game/content/sites/chlorAlkali.ts`.
- `pnpm site:candidates -- --count 5 --seed 20260700` writes scored SVG candidates plus a manifest
  under ignored `outputs/site-candidates/make_the_reagent/`.
- Runtime topology reads the produced `state.map`; save decode accepts valid generated/grafted room
  catalogs; hull geometry rebases between shifted generated sites and later authored sites.
- Generator tests lock same-seed replay, multi-candidate uniqueness, shared map validation, ground
  and flying navigation, save round-trip, and generated→authored hull rebasing. Campaign health
  completes CL-1 with Core 50.

## Also open in M6 (tutorial content, tied to the new model)

- **#4 upgrade any agitator** — likely a guide predicate/anchor tied to the furnace
  (`equipmentUpgradeTutorialAnchor` in `EquipmentControls.tsx`, `furnaceAgitatorUpgraded` in
  `flashPointGuideState.ts`). Guides are written for the OLD furnace-central model and need
  re-pointing at the hull model.
- **#5 build availability opaque/restrictive** — per-round `availability.{equipment,gasLines,...}`
  gates what can be built; the user had lots of matter but couldn't build (nothing available) and
  it wasn't explained. Loosen and/or communicate.
- **Grafting is not taught yet** — the graft lesson at the first dock (site 1 → site 2) is unwritten.
- **Guides/copy/anchors** (`src/tutorial/*`) broadly still assume furnace-central; re-point at Map
  instance predicates and the hull model.

## Conventions / gotchas

- **Verify locally:** use `make quick-ci` for normal iteration (architecture-check, copy-check,
  lint, format, typecheck, and Vitest without coverage). `make ci` remains the full
  GitHub-equivalent gate with coverage, build, performance, campaign-health, and Terraform checks;
  run it occasionally before releases or when those areas change. Run `pnpm test:e2e` (Playwright,
  ~2.3 min, 29 tests) when browser flows change. Regenerate the behavior lock with
  `pnpm determinism:snapshot` **only** for intended changes.
- **Commit straight to `main`, never branch** (user's standing rule). End commit messages with a
  `Co-Authored-By:` trailer (match the repo's recent commits).
- **`deriveGame(def, { map: {...} })`** is how you override the world now — room identity (code,
  structure, ambientTemperature, socketCount, provenance, hardpoints) lives on `MapRoom`, not on
  `pack.rooms` (that record is gone). `definitionRoom`/`roomDefinition`/`roomSocketIds` take a
  `MapCarrier` (the GameState at runtime, the definition at creation).
- **Save is v13** (`saveCodec.ts`): serializes `map` + `mapRevision` + `run` ({seed, position,
  outcome}). Decode validates the stored map + room coverage. Legacy saves inject the pack map.
- **Level transition** routes `level_complete → travel → dock_at_site → level_briefing`
  (`campaignCommands.ts`, `TravelModal` in `Modals.tsx`). `dock_at_site` extracts the hull and
  re-produces the next site.
- **Playtest harness** plays each level in ISOLATION to `level_complete` (not a connected run);
  `runLoop.test.ts` / `hullCarryover.test.ts` prove the connected loop instead.
- E2e that need a specific state seed a save into `localStorage`
  (`catalyst-castellum:save:slot-1:v1`) via `page.addInitScript`; see `graft-mode.spec.ts` and the
  corridor-exam test in `pipe-mode.spec.ts` for the pattern (build state → `encodeGame` → seed).
- Backlog notes (`docs/backlog.md`): a benign React "setState during render" warning and a
  transient `Unknown map room instance: graft:*` on dismantle — both cosmetic, all tests green.

## Key files

- World model: `src/game/world/{map,mapValidation,mapEdits,autoRouter,producer,hullFragment,modules,graft,instances,derivedModel}.ts`
- Authored content: `src/game/content/{worldMap,worldMapConnections,modules,lineSpecs,supplies}.ts`, `src/game/content/levels/*`
- Engine: `src/game/engine/{scenarioState,commandPolicy,commands,campaignCommands,graftCommands,transportCommands,facilityModel}.ts`
- Pipe/graft UI: `src/components/{PipeBoard,GraftBoard}.tsx`, `src/components/gameMap/{MapLayers,MapScene,PipePreviewPopup,transportGraphics,roomGraphics,roomRenderModel,MapChrome}.tsx`, `src/presentation/{pipePlanning,graftPlanning}.ts`
- Tutorial (needs re-authoring): `src/tutorial/*`
