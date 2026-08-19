# Catalyst Castellum

A browser-based vertical tower-defense campaign set in the Glass Frontier universe.

The player commands a mostly unmanned Deep Shear vessel. A remote cutter couples recovered
material into the vessel's process rooms, and Cthonic intruders cross in the cutter wake. The player mounts
automated defenses throughout the ship's side-view rooms and holds the Core until each extraction
finishes.

Play the current build at [catalyst.ahara.io](https://catalyst.ahara.io).

## Quickstart

```bash
pnpm install
pnpm dev
```

The Vite development server binds `0.0.0.0:26007`. Open `http://127.0.0.1:26007` locally.

Run the normal local verification gate with:

```bash
make quick-ci
```

Use `make ci` for the complete repository gate and `pnpm test:e2e` for the browser suite.

## Documentation

| Topic                               | Link                                                               |
| ----------------------------------- | ------------------------------------------------------------------ |
| Tower-defense implementation record | [TOWER-DEFENSE-REWORK-PLAN.md](TOWER-DEFENSE-REWORK-PLAN.md)       |
| Documentation index                 | [docs/README.md](docs/README.md)                                   |
| Architecture                        | [docs/architecture.md](docs/architecture.md)                       |
| Campaign defense design             | [docs/campaign-defense-design.md](docs/campaign-defense-design.md) |
| Tutorial campaign                   | [docs/tutorial-campaign.md](docs/tutorial-campaign.md)             |
| Combat balance                      | [docs/combat-balance-model.md](docs/combat-balance-model.md)       |
| Narrative canon                     | [docs/narrative/lore-bible.md](docs/narrative/lore-bible.md)       |
| Architecture decisions              | [docs/adr/README.md](docs/adr/README.md)                           |
| Backlog                             | [BACKLOG.md](BACKLOG.md)                                           |
| Changelog                           | [CHANGELOG.md](CHANGELOG.md)                                       |
| Agent guide                         | [AGENTS.md](AGENTS.md)                                             |

## License

Catalyst Castellum is available under the [MIT License](LICENSE).
