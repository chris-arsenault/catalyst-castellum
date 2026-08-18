import type { HullOffset } from "./hullFragment";
import type { WorldMap } from "./map";

export interface FixedLevelSite {
  kind: "fixed";
  map: WorldMap;
  hullAnchor: HullOffset;
}
