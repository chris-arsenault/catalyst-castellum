# src/game/content/sites

Authored exterior content: site chunks (parametric map fragments with rooms, portals,
route stubs, feedstock taps, annexable structures) and fixed site scripts. The tutorial's
docking sites are fully authored sites; main-game sites are assembled from these chunks
by the seeded generator (ADR-0003).

`chlorAlkali.ts` is the first production vocabulary. `world/siteGenerator.ts` assembles
its room chunks against the carried hull, adds traversable passages/ladders, routes its
process lines, and validates the result. Run `pnpm site:candidates` to export a scored
SVG candidate sheet under `outputs/site-candidates/`; the tutorial binds one selected
seed so guidance and balance stay reproducible.
