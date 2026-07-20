# Catalyst Castellum

A browser-based chemical-process tower defense game set in the Glass Frontier universe.

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

| Topic                   | Link                                                               |
| ----------------------- | ------------------------------------------------------------------ |
| Documentation index     | [docs/README.md](docs/README.md)                                   |
| Architecture            | [docs/architecture.md](docs/architecture.md)                       |
| Campaign defense design | [docs/campaign-defense-design.md](docs/campaign-defense-design.md) |
| Chemistry               | [docs/chemical-process-design.md](docs/chemical-process-design.md) |
| Combat balance          | [docs/combat-balance-model.md](docs/combat-balance-model.md)       |
| Narrative canon         | [docs/narrative/lore-bible.md](docs/narrative/lore-bible.md)       |
| Architecture decisions  | [docs/adr/README.md](docs/adr/README.md)                           |
| Backlog                 | [BACKLOG.md](BACKLOG.md)                                           |
| Changelog               | [CHANGELOG.md](CHANGELOG.md)                                       |
| Agent guide             | [AGENTS.md](AGENTS.md)                                             |

## License

Catalyst Castellum is available under the [MIT License](LICENSE).
