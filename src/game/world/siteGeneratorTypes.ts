import type { ConduitDestinationKind, GridCell, RoomId } from "../types";
import type { HullOffset } from "./hullFragment";
import type {
  MapRoom,
  MapUtilityNode,
  ProcessLineConnection,
  ProcessLineKind,
  WorldMap,
} from "./map";

/** Authored chunk geometry uses a local origin and is translated by the layout engine. */
export interface SiteRoomChunk {
  id: string;
  room: MapRoom;
}

export type SiteJoinDirection = "right" | "up" | "down";

/** A route pattern constrains chunk assembly while leaving chunk order and alignment seeded. */
export interface SiteRoutePattern {
  id: string;
  /** One join per chunk: chunk[n] -> chunk[n + 1], with the last joining the hull dock room. */
  directions: readonly SiteJoinDirection[];
}

export interface SiteProcessLineSpec {
  kind: ProcessLineKind;
  rooms: readonly [RoomId, RoomId];
  direction: readonly [RoomId, RoomId];
  destinationKind: ConduitDestinationKind;
  actuator: ProcessLineConnection["actuator"];
  actuatorHead: number;
  maxFlow: number;
  volumePerCell: number;
  buildCost: number;
}

export interface GeneratedSiteSpec {
  id: string;
  width: number;
  height: number;
  cellSize: number;
  ringRadii: WorldMap["ringRadii"];
  hullAnchor: HullOffset;
  /** Fixed cells are expressed in the incoming hull's coordinate system and translated. */
  coreAnchor: GridCell;
  coreBreachCell: GridCell;
  chunks: readonly SiteRoomChunk[];
  /** Each order includes every chunk id exactly once and begins with the entry chunk. */
  chunkOrders: readonly (readonly string[])[];
  patterns: readonly SiteRoutePattern[];
  processLines: readonly SiteProcessLineSpec[];
  /** Site utility-node cells are local to their host chunk room. */
  utilityNodes: Readonly<Record<string, MapUtilityNode>>;
}

export interface GeneratedLevelSite {
  kind: "generated";
  seed: number;
  spec: GeneratedSiteSpec;
}

export interface SiteLayoutCandidate {
  seed: number;
  patternId: string;
  chunkOrder: readonly string[];
  map: WorldMap;
  score: number;
  metrics: {
    routeLength: number;
    siteSpan: number;
    verticalSpan: number;
    occupiedArea: number;
  };
}
