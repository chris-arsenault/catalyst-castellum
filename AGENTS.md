# Agent guide

Catalyst Castellum is a deterministic React/Pixi vertical tower-defense campaign.

## Read first

| Topic                    | Link                                                               |
| ------------------------ | ------------------------------------------------------------------ |
| Workspace overview       | [README.md](README.md)                                             |
| Documentation index      | [docs/README.md](docs/README.md)                                   |
| Architecture             | [docs/architecture.md](docs/architecture.md)                       |
| Architecture decisions   | [docs/adr/README.md](docs/adr/README.md)                           |
| Campaign design          | [docs/campaign-defense-design.md](docs/campaign-defense-design.md) |
| Narrative and copy style | [docs/narrative/style-guide.md](docs/narrative/style-guide.md)     |
| Backlog                  | [BACKLOG.md](BACKLOG.md)                                           |
| Changelog                | [CHANGELOG.md](CHANGELOG.md)                                       |

## Critical rules

- Keep the simulation independent from React, PixiJS, Zustand, browser APIs, and default content.
- Route player actions through typed command evaluation and execution; derive UI availability from
  the same decisions.
- Preserve deterministic fixed-step behavior, map validation, route validity, and explicit combat
  source attribution.
- Preserve elemental conservation and finite inventories inside the retained chemistry and
  transport subsystems.
- Treat the current save schema as the only accepted pre-release format. Increment the schema and
  content version when durable state or authored mechanics change.
- Keep Ahara resource names under the `catalyst` prefix.
- Obtain explicit user authorization before pushing, deploying, or applying Terraform.
- Run `make ci` before committing or deploying.
- Record future work only in [BACKLOG.md](BACKLOG.md), architectural trade-offs only in
  [docs/adr/](docs/adr/README.md), and shipped behavior only in [CHANGELOG.md](CHANGELOG.md).

## Campaign and encounter design

Tutorials demonstrate tools. Sites test defenses. Geometry creates strategies.

- Preserve the fixed twelve-site, three-act campaign and its narrative reveal schedule.
- Make direct tower attacks the primary source of combat output. Towers expose range, firing arc,
  cadence, valid targets, targeting priority, damage, and upgrades through visible behavior.
- Author encounters around vertical geometry, multiple readable routes, tower coverage, enemy
  composition, cadence, and Matter pressure.
- Place ordinary towers freely on compatible grid-snapped floors, walls, and ceilings. Architecture,
  tower footprint, clearance, and line of sight determine legal placement.
- Attach room grafts through authored hull graft slots. Grafts add persistent geometry, mounting
  surfaces, and any purpose-specific internal equipment slots.
- Price a graft at roughly six to ten ordinary tower upgrades. A complete campaign normally supports
  two or three graft purchases through the shared Matter economy.
- Keep hull-owned rooms and installed defenses persistent across sites. Recover site-mounted tower
  value when the cutter return closes.
- Use deterministic route graphs with visible ingress, branches, joins, and remaining distance to
  the Core. Targeting priorities compare enemies across every active route.
- Introduce chemistry, pipes, and atmospheric state as visible tower and battlefield modifiers after
  the direct tower-defense loop is established. Basic towers operate effectively in neutral rooms.

## Player-facing copy

Voice, register, vocabulary, and canon are governed by the
[narrative and copy style guide](docs/narrative/style-guide.md). Apply these interface-copy rules:

- Write affirmative, present-tense declarations.
- Center each message on the current state, its immediate consequence, or the player's next action.
- Describe active behavior directly and keep tutorials focused on the visible mechanic and choice.
- Express empty, idle, unavailable, and destructive states through the state or available action.
- Treat `no`, `not`, `never`, `without`, `instead`, `rather`, and promises about absent behavior as
  review signals; rewrite around the active state wherever domain accuracy permits.
- State genuine hazards, losses, costs, and irreversible consequences explicitly, then present the
  available recovery action.

Review every modified player-facing string against these rules before completing a copy change.

## Code map

| Path                        | Purpose                                                                            |
| --------------------------- | ---------------------------------------------------------------------------------- |
| `src/game/`                 | Deterministic domain model, content, world generation, balance, saves, and runtime |
| `src/application/`          | Browser session, persistence scheduling, and UI state composition                  |
| `src/presentation/`         | Runtime-bound localized view models and copy                                       |
| `src/components/`           | React controls and Pixi map presentation                                           |
| `src/tutorial/`             | Typed guide definitions, predicates, and tutorial components                       |
| `src/localization/`         | Typed locale catalogs, formatters, and validation                                  |
| `tooling/`                  | Balance, playtest, generation, architecture, copy, and performance tools           |
| `tests/e2e/`                | Playwright browser flows                                                           |
| `infrastructure/terraform/` | Ahara static-site deployment                                                       |

## Commands

| Command                          | Purpose                                                              |
| -------------------------------- | -------------------------------------------------------------------- |
| `pnpm dev`                       | Start Vite on port 26007                                             |
| `make quick-ci`                  | Run the normal local architecture, copy, format, type, and unit gate |
| `make ci`                        | Run the complete local CI contract                                   |
| `pnpm test:e2e`                  | Run all Playwright browser scenarios                                 |
| `pnpm campaign:health`           | Assert campaign portfolios and idle-loss contracts                   |
| `pnpm balance:combat`            | Run the combat balance workbook                                      |
| `pnpm sprites:all`               | Regenerate every checked-in sprite sheet                             |
| `with-cred -- scripts/deploy.sh` | Build and deploy through the approved credential path                |
