# Catalyst Castellum

## Critical rules

- Never push, deploy, or apply Terraform without explicit user authorization.
- Never use destructive Git commands to discard local work.
- Run `make ci` before committing or deploying.
- Keep the simulation independent from React, PixiJS, and browser APIs.
- Keep Ahara resource names under the `catalyst` prefix.
- Do not add a backend, database, or authentication without a product decision.

## Project overview

Catalyst Castellum is a browser-based chemical-flow tower defense game. Players defend a
persistent room graph by controlling gases, liquids, heat, pressure, and deterministic
reactions rather than projectile towers.

The production build is a static Vite site deployed to `https://catalyst.ahara.io` through
Ahara's S3 and CloudFront website module.

## Code layout

| Path                        | Purpose                                                         |
| --------------------------- | --------------------------------------------------------------- |
| `src/game/`                 | Deterministic simulation, content definitions, state, and saves |
| `src/components/`           | React controls, telemetry, Pixi map, and modal UI               |
| `tests/e2e/`                | Playwright browser flows                                        |
| `tooling/`                  | Shared local dev-server configuration                           |
| `infrastructure/terraform/` | Ahara static-website deployment                                 |
| `scripts/deploy.sh`         | Parameterless local build and Terraform apply                   |

## Architecture patterns

- `simulation.ts` owns authoritative state transitions; UI code dispatches typed commands.
- Consequence previews apply the real command to a cloned state.
- The simulation uses fixed timesteps and serializable state for deterministic testing.
- Zustand is only the React/Pixi bridge; it is not the domain model.
- Saves are versioned and validated with Zod before restoration.
- Production has no runtime service. Terraform uploads `dist/` to the Ahara website module.

## Development commands

| Command                          | Purpose                            |
| -------------------------------- | ---------------------------------- |
| `pnpm dev`                       | Start Vite on exposable port 26007 |
| `pnpm build`                     | Typecheck and build `dist/`        |
| `pnpm test`                      | Run Vitest simulation tests        |
| `pnpm test:e2e`                  | Run Playwright browser tests       |
| `make ci`                        | Run the local Ahara CI contract    |
| `with-cred -- scripts/deploy.sh` | Build and deploy to Ahara          |
