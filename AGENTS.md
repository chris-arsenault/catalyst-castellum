# Agent guide

Catalyst Castellum is a deterministic React/Pixi chemical-process tower defense game.

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
- Preserve deterministic fixed-step behavior, elemental conservation, finite inventories, and
  topology validation.
- Treat the current save schema as the only accepted pre-release format. Increment the schema and
  content version when durable state or authored mechanics change.
- Keep Ahara resource names under the `catalyst` prefix.
- Obtain explicit user authorization before pushing, deploying, or applying Terraform.
- Run `make ci` before committing or deploying.
- Record future work only in [BACKLOG.md](BACKLOG.md), architectural trade-offs only in
  [docs/adr/](docs/adr/README.md), and shipped behavior only in [CHANGELOG.md](CHANGELOG.md).

## Campaign and encounter design

Tutorials demonstrate tools. Sites test defenses. Chemistry creates strategies.

- Introduce controls and simulation rules through tutorials, then let encounters support multiple
  materially different defenses.
- Author sites around geometry, resources, enemy composition, timing, and economic pressure rather
  than a required reaction chain or prescribed room configuration.
- Treat newly available chemistry as an additional strategic option. Keep established builds viable
  through soft counters, overlapping combat roles, and compounding process interactions.
- Give every site a chemistry palette of one to three process families; supplies, seeds, and
  vessel availability derive from it (ADR-0008). Engineered reactions run in duty vessels
  (ADR-0007), and every offensive family damages at depth one from supplied feedstock while iron
  stays the support family (ADR-0009).

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
| `pnpm campaign:health`           | Assert every site portfolio and idle-loss contract                   |
| `pnpm balance:combat`            | Run the first- and second-order combat workbook                      |
| `pnpm sprites:all`               | Regenerate every checked-in sprite sheet                             |
| `with-cred -- scripts/deploy.sh` | Build and deploy through the approved credential path                |
