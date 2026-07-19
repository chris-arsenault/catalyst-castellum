import { cell } from "../../spatial";
import type { GasTapDefinition, LiquidTapDefinition, MapRoom } from "../../world/map";
import type { SiteRoomChunk } from "../../world/siteGeneratorTypes";

export const siteGasTap = (overrides: Partial<GasTapDefinition> = {}): GasTapDefinition => ({
  capacity: 18,
  includeRoomInventory: true,
  roomPortHeight: 0.72,
  sourceIds: [],
  ...overrides,
});

export const siteLiquidTap = (
  overrides: Partial<LiquidTapDefinition> = {}
): LiquidTapDefinition => ({
  capacity: 18,
  includeRoomInventory: true,
  roomPortHeight: 0.12,
  sourceIds: [],
  ...overrides,
});

export const siteRoomChunk = (
  id: string,
  code: string,
  structure: MapRoom["structure"],
  width: number,
  height: number,
  overrides: Partial<Omit<MapRoom, "id" | "code" | "structure" | "bounds">> = {}
): SiteRoomChunk => ({
  id,
  room: {
    id,
    code,
    structure,
    ambientTemperature: 22,
    socketCount: structure === "entry" ? 0 : 2,
    bounds: { column: 0, elevation: 0, width, height },
    socketCells:
      structure === "entry"
        ? {}
        : {
            socket_a: cell(Math.floor(width * 0.34), 0),
            socket_b: cell(Math.floor(width * 0.72), 0),
          },
    platformCells: [],
    ladderCells: [],
    taps: { gas: siteGasTap(), liquid: siteLiquidTap() },
    hardpoints: [],
    provenance: "site",
    ...overrides,
  },
});
