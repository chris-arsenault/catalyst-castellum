# Catalyst Castellum

A browser-playable chemical-process defense prototype. The castellum is a persistent reaction engine: the player installs equipment, connects rooms, operates simple binary flow hardware, and lets slow upstream reactions create harmful downstream environments.

Play the deployed game at [catalyst.ahara.io](https://catalyst.ahara.io).

## Technology

- React 19 for controls and first-order instrumentation
- PixiJS 8 with Pixi React for the combined side-view facility cross-section
- Pure TypeScript fixed-step simulation, independent from React and PixiJS
- Zustand as the thin UI/simulation bridge
- Zod-validated, versioned local saves
- Vite, Vitest, and Playwright for build and automated verification

The production application is static JavaScript. All authoritative flow, reaction, combat, and phase transitions run deterministically in the browser.

## Run locally

```bash
pnpm install
pnpm dev
```

The dev server binds `0.0.0.0:26007` with strict-port behavior. Open it locally at `http://127.0.0.1:26007`, or from the Sulion LAN at `http://192.168.66.3:26007`.

Port `26007` is only a published development slot. The project does not integrate with Sulion APIs, authentication, or reverse-proxy routing, and the LAN endpoint is therefore not protected by Sulion authentication.

## Verify

```bash
make ci
pnpm test:e2e
pnpm build
```

The unit suite covers elemental conservation, finite-volume shared conduits, route-volume priming,
cross-phase displacement, backpressure, H₂/O₂ flash attacks, movement drag, damage attribution,
persistent incidents and byproducts, campaign checkpoints, unlock enforcement, and versioned saves.
Playwright covers the first tutorial from briefing through an attributed combat kill, free Pixi room
selection, drag-safe camera controls, save restoration, compact layout, shared-conduit hover detail,
and single-material flow overlays.

The slower policy-injection playtester is deliberately separate from normal CI:

```bash
pnpm playtest -- --runs 200 --seed 13371
pnpm playtest -- --level flash_point --runs 500
```

It runs the pure engine without React or Pixi, compares do-nothing and intended reference policies,
then groups seeded randomized policies by action count, pass rate, and remaining core. Neither
`make ci` nor `pnpm check` invokes it.

## How to play

1. Read the level briefing. Each checkpoint starts from a deliberately limited facility and unlocks
   one new physical idea.
2. During **Plan**, install equipment in generic sockets, construct the currently available runs,
   operate binary flow hardware, and charge unlocked feedstocks. The simulation is frozen.
3. Begin **Prime** to run the real plant without enemies. Every round has a bounded live window;
   inputs, line contents, heat, pressure, and byproducts persist when it auto-locks.
4. Lock early or let the timer begin **Assault** automatically. Construction and operating choices
   remain locked while enemies cross the facility.
5. Analyze the frozen result, then carry the exact chemical state into the next round. Completing a
   level creates a clean retry checkpoint before the next facility loadout.

Every numbered room lies on the inward hostile route: R-01/R-02 form the outer ring, R-03/R-04 the
middle ring, and R-05/R-06 the inner ring around the core. Ordinary rooms have two generic sockets
and no furnace, absorber, or reactor type. When installed beside R-05's separated manifold, the
membrane cell performs balanced chlor-alkali electrolysis:

```text
2 NaCl(aq) + 2 H₂O(l) → Cl₂(g) + H₂(g) + 2 NaOH(aq)
```

The first checkpoint does **not** begin with that factory. Core visibly owns one finite starter
header containing a 2:1 H₂/O₂ mixture, and one empty physical duct reaches blank R-02. Installing an
agitator and switching on that duct's single fan creates a repeating OX-1 pressure/heat weapon. Later
checkpoints introduce membrane electrolysis, hot HCl formation, transport construction, NaOCl
storage, and delayed chlorine release. The former fully preinstalled factory is retained as the final
**Commissioning Exam**, not presented as the tutorial starting state.

In that full process, the cell's three products occupy separated outlet inventories. One `Cl₂`
branch and part of the `H₂` stream reach R-02, where a removable thermal coil and gas agitator create
conditions for `HCl` formation. A wet contactor in R-03 accelerates storage of another `Cl₂` branch in
`NaOH` as `NaOCl`. The acid return and hypochlorite line converge in R-06, where contact equipment
accelerates absorption, neutralization, and delayed `Cl₂` release without selecting a desired
product.

The useful split necessarily leaves excess `H₂` and `NaOH`. Relief and recovery hardware is either
on or off; its installed rating replaces percentage setpoints. Every unfiltered conduit draws the
complete mixture in its upstream local junction. Vents and drains retain complete, species-resolved
mixtures at Core rather than deleting them, and closed conduits retain whatever was already inside.

R-02 can instead become a batch combustion defense. Once the mixed starter gas accumulates, the
balanced `2 H₂ + O₂ → 2 H₂O(g)` reaction autoignites into one explicit pressure/heat attack,
persistent heat, and steam. Continued whole-mixture flow recharges discrete flashes; route hold-up,
steam accumulation, and room pressure change the cadence over time.

The interface exposes current composition, static and shock pressure, temperature, flow, line
pressure, liquid-line priming, and retained contents. It deliberately does not forecast downstream
cascades: timing and second-order consequences must be inferred from the system.

Player actions are discrete: install, upgrade, dismantle, build, open, close, and power.
Installed equipment occupies room volume and changes broad physical behavior. Blank rooms retain
natural chemistry, but contain no hidden heat, mixing, electrolysis, absorption, or production role.

The map draws physical transport infrastructure rather than a line per substance or process purpose.
Each room pair has at most one gas conduit and one liquid conduit; each phase owns one conserved
mixture inventory and one binary actuator. Hovering shows that conduit's retained composition,
direction, capacity, priming state, and measured per-species flow. The single-select material overlay
traces one species across the plant with pulsing arrows sized by actual throughput.

## Simulation boundary

`src/game/simulation.ts` exposes all authoritative state transitions implemented under
`src/game/engine/`. Rendering and interface code may inspect state and dispatch typed commands, but
they do not implement chemistry, unlock, timing, or damage rules. Level definitions own facility
loadouts, round waves, prime limits, and availability under `src/game/content/campaign.ts`.
`src/game/engine/scenarioState.ts` materializes those definitions into the same `GameState` consumed
by the browser and the headless evaluator.

Gas conduits, liquid conduits, and monster corridors are independent networks in the MVP. Feedstock
tanks, the vent, and liquid recovery are distinct ports hosted by the Core utility manifold; their
inventories do not mix with the Core atmosphere. Room-local junctions connect those ports, equipment
buffers, and room inventory to physical conduits without adding player-visible sub-lines. The cell's
anode, cathode, and liquor outlets remain explicit buffers beside R-05's separated manifold. Ring
rules constrain equipment availability, but ordinary rooms share one generic socket-and-environment
model.

Rooms and process lines are conserved finite volumes. Liquid consumes room volume and compresses the
remaining atmosphere; gas pressure includes quantity, free volume, and temperature. Passive gas
valves require a pressure gradient, fans add pressure head, liquid pumps displace already-primed line
contents, and full destinations stall upstream flow. Incoming material therefore pushes complete
mixtures through open exits instead of replacing or deleting selected species.

The map is also the physical vertical cross-section. A single authored grid owns room bounds,
corridors and shafts, doors, utility nodes, and every conduit route. Route length determines enemy
travel distance and conduit volume, delay, and rated response; each liquid route's highest point is
its hydraulic crest. The one rendered gas or liquid conduit is the same conserved inventory used by
the solver. Rooms retain geometry-derived finite volumes rather than per-tile fluids: liquid surfaces
and submerged pickups use room bounds, while separate upper/lower gas composition and temperature
drive buoyant overturn and ground-versus-flying exposure. Pan and zoom reveal the same authoritative
world at different scales rather than switching to a separate schematic.

Every modeled species has a formula and arbitrary elemental composition map. Reaction definitions
declare stoichiometric participants and are mechanically rejected by tests if any modeled element
fails to balance. The only element-changing operation is the player-facing `EXOTIC TRANSMUTATION`
conversion of harvested Matter into finite `O₂`, `H₂O`, or `NaCl(aq)` reserves.

## Deployment

The production build is static HTML, CSS, JavaScript, and browser assets. Ahara's website Terraform pattern publishes `dist/` to a private S3 bucket behind CloudFront, with Route 53 DNS, an ACM certificate, WAF protection, KMS encryption, and single-page-app fallback routing. There is no production application server, database, or runtime secret.

The project is registered in `ahara-infra` as `catalyst-castellum`, using resource prefix `catalyst` and Terraform state key `projects/catalyst-castellum.tfstate`. To deploy from an authorized Sulion terminal:

```bash
with-cred -- scripts/deploy.sh
```

Pushes to `main` also use Ahara's shared CI/CD workflow after the repository changes are committed and pushed.

## License

This project is available under the [MIT License](LICENSE).
