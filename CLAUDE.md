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
- The simulation uses fixed timesteps and serializable state for deterministic testing.
- Monster corridors, gas ducts, and liquid pipes are separate fixed graphs in the MVP.
- Every numbered room is on the radial monster route; ring membership follows distance to the core.
- Feedstock, vent, and drain nodes are isolated ports hosted by the core utility manifold.
- Each room pair owns at most one gas conduit and one liquid conduit. A conduit has one persistent
  whole-mixture inventory, one binary actuator, and no hidden purpose- or species-specific sub-lines.
- Room-local junctions connect tanks, buffers, rooms, vents, and drains to those conduits. Branches
  allocate shared inventory proportionally rather than receiving an invisible ID-order priority.
- Hover detail uses measured per-species throughput from the shared conduit. The flow overlay is
  single-select and shows one species system-wide without inventing another transport channel.
- Authored side-view geometry owns room bounds, corridor/shaft paths, utility locations, and process
  routes. Rendering and simulation consume the same coordinates.
- Screen height is physical elevation. Route distance drives enemy travel, conduit capacity,
  swept-volume latency, and rated response; liquid crest height is derived from the route. Pumps,
  fans, pressure, density, and gravity use that geometry.
- Rooms conserve separate upper/lower gas layers; composition and temperature determine mixture
  density, buoyant overturn, passive line direction, and ground-versus-flying exposure.
- Reactions run continuously from room inventories and preserve all tracked byproducts.
- OX-1 combustion creates a discrete pressure/heat damage burst. A central packet resolver records
  channel and source attribution on enemies, round stats, durable incidents, and death events.
- Planning freezes the process, priming consumes real inventory, and assault locks all setpoints.
- The UI exposes current first-order state but does not calculate cascade forecasts.
- Zustand is only the React/Pixi bridge; it is not the domain model.
- Saves are versioned and validated with Zod before restoration. V8 owns conduit routes, junctions,
  damage ledgers, and incidents; the V7 migration merges every legacy sub-line without deleting its
  inventory and leaves ambiguous migrated actuators off.
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
