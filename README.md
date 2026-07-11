# Catalyst Castellum

A browser-playable chemical-flow tower defense prototype. Enemies travel through a persistent room graph; the player defeats them by filling, sealing, flushing, and converting each room's contents at the right time.

Play the deployed game at [catalyst.ahara.io](https://catalyst.ahara.io).

## Technology

- React 19 for controls, telemetry, build configuration, and consequence previews
- PixiJS 8 with Pixi React for the facility map and live enemies
- Pure TypeScript fixed-step simulation, independent from React and PixiJS
- Zustand as the thin UI/simulation bridge
- Zod-validated, versioned local saves
- Vite, Vitest, and Playwright for build and automated verification

The command preview uses the same simulation operation as the real command, applied to a cloned state. This keeps projected composition changes consistent with actual outcomes.

## Run locally

```bash
pnpm install
pnpm dev
```

The dev server binds `0.0.0.0:26007` with strict-port behavior. Open it locally at
`http://127.0.0.1:26007`, or from the Sulion LAN at
`http://192.168.66.3:26007`.

Port `26007` is only a published development slot. The project does not yet
integrate with Sulion APIs, authentication, or reverse-proxy routing, and the
LAN endpoint is therefore not protected by Sulion authentication.

## Verify

```bash
make ci
pnpm test:e2e
pnpm build
```

The unit suite covers chemistry, displacement, dilution, reactions, persistence, enemy disruption, saves, and a complete five-cycle balance run. Playwright covers the build-to-prime-to-assault interaction path, Pixi canvas startup, room navigation, and compact desktop layout.

## How to play

1. In **Build**, select chambers and install or salvage modules. Salvage returns full fabricator value.
2. Begin **Prime**, then use installed modules to establish useful room states. Prime has no time limit.
3. Open the intakes to begin **Assault**. Watch occupancy counts and trigger systems when enemies are inside.
4. During **Settle**, gas equalizes, drains operate, reactions finish, and the resulting state carries into the next build phase.
5. Survive five cycles without reducing core integrity to zero.

Useful opening patterns:

- Seal the Switchyard, then inject toxic gas.
- Fill the Furnace Hall with fuel gas and ignite it at peak occupancy.
- Use acid and sludge together in the Reservoir; adding water will dilute both.
- Keep different hazards in successive rooms so Bellows cannot dismantle the entire defense by consuming one gas.

## Simulation boundary

`src/game/simulation.ts` exposes all authoritative state transitions implemented under `src/game/engine/`. Rendering and interface code may inspect state and dispatch typed commands, but they do not implement chemistry or damage rules. Scenario definitions, devices, enemies, and waves live under `src/game/content/` and are exported by `src/game/config.ts`.

## Deployment

The production build is static HTML, CSS, JavaScript, and browser assets. Ahara's website Terraform pattern publishes `dist/` to a private S3 bucket behind CloudFront, with Route 53 DNS, an ACM certificate, WAF protection, KMS encryption, and single-page-app fallback routing. There is no production application server, database, or runtime secret.

The project is registered in `ahara-infra` as `catalyst-castellum`, using resource prefix `catalyst` and Terraform state key `projects/catalyst-castellum.tfstate`. To deploy from an authorized Sulion terminal:

```bash
with-cred -- scripts/deploy.sh
```

Pushes to `main` also use Ahara's shared CI/CD workflow after the repository changes are committed and pushed.

## License

This project is available under the [MIT License](LICENSE).
