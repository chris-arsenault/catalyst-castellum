import type { FacilityPortalState } from "../../game/types";
import { facilityModelForMap } from "../../game/world/derivedModel";
import {
  architecturalConnections,
  type ArchitecturalConnection,
  type WorldMap,
} from "../../game/world/map";
import type { ArchitectureSpriteId } from "./architectureSprites";
import { mapViewFor, type MapRect } from "./mapGeometry";

export interface ArchitectureSpriteModel {
  assetId: ArchitectureSpriteId;
  height: number;
  id: string;
  rotation: number;
  width: number;
  x: number;
  y: number;
}

export interface DoorSpriteModel extends ArchitectureSpriteModel {
  open: boolean;
}

interface DoorDimensions {
  height: number;
  width: number;
  y: number;
}

const connectorBounds = (map: WorldMap, portal: ArchitecturalConnection): MapRect => {
  const view = mapViewFor(map);
  const rectangles = portal.connectorCells.map(view.gridCellMapRect);
  const left = Math.min(...rectangles.map((rect) => rect.left));
  const top = Math.min(...rectangles.map((rect) => rect.top));
  const right = Math.max(...rectangles.map((rect) => rect.left + rect.width));
  const bottom = Math.max(...rectangles.map((rect) => rect.top + rect.height));
  return { left, top, width: right - left, height: bottom - top };
};

type StaticPortalAsset = "passage" | "ladder_shaft" | "floor_hole";

const portalAsset = (portal: ArchitecturalConnection): StaticPortalAsset | null => {
  if (portal.kind === "passage") return "passage";
  if (portal.kind === "ladder_shaft") return "ladder_shaft";
  if (portal.kind === "floor_hole") return "floor_hole";
  return null;
};

export const staticArchitectureModels = (map: WorldMap): ArchitectureSpriteModel[] => {
  const view = mapViewFor(map);
  const terrain: ArchitectureSpriteModel[] = facilityModelForMap(map)
    .cells()
    .flatMap((definition) => {
      const isWalkway = definition.terrain === "platform";
      const isRoomLadder = definition.terrain === "ladder" && !definition.portalId;
      if (!isWalkway && !isRoomLadder) return [];
      const rect = view.gridCellMapRect(definition.cell);
      return [
        {
          assetId: isWalkway ? "walkway" : "ladder",
          height: isWalkway ? 34 : rect.height,
          id: `${isWalkway ? "walkway" : "ladder"}:${definition.cell.column}:${definition.cell.elevation}`,
          rotation: 0,
          width: isWalkway ? 34 : rect.width,
          x: rect.left + rect.width / 2,
          y: isWalkway ? rect.top + 2 : rect.top + rect.height / 2,
        } satisfies ArchitectureSpriteModel,
      ];
    });
  const portals = architecturalConnections(map).flatMap((portal) => {
    const assetId = portalAsset(portal);
    if (!assetId) return [];
    const bounds = connectorBounds(map, portal);
    const dimensions: Record<StaticPortalAsset, { width: number; height: number; y: number }> = {
      passage: {
        width: Math.max(58, bounds.width + 36),
        height: 64,
        y: bounds.top + bounds.height / 2 - 5,
      },
      ladder_shaft: {
        width: Math.max(38, bounds.width + 20),
        height: Math.max(46, bounds.height + 30),
        y: bounds.top + bounds.height / 2,
      },
      floor_hole: {
        width: Math.max(60, bounds.width + 38),
        height: 42,
        y: bounds.top + 5,
      },
    };
    const size = dimensions[assetId];
    return [
      {
        assetId,
        height: size.height,
        id: `portal:${portal.id}`,
        rotation: 0,
        width: size.width,
        x: bounds.left + bounds.width / 2,
        y: size.y,
      } satisfies ArchitectureSpriteModel,
    ];
  });
  return [...terrain, ...portals];
};

const doorDimensions = (portal: ArchitecturalConnection, bounds: MapRect): DoorDimensions => {
  if (portal.kind === "trapdoor") {
    return { height: 44, width: Math.max(66, bounds.width + 42), y: bounds.top + 5 };
  }
  if (portal.kind === "core_door") {
    return {
      height: 76,
      width: Math.max(82, bounds.width + 38),
      y: bounds.top + bounds.height / 2 - 6,
    };
  }
  return {
    height: 66,
    width: Math.max(62, bounds.width + 38),
    y: bounds.top + bounds.height / 2 - 6,
  };
};

const doorArchitectureModel = (
  map: WorldMap,
  portal: ArchitecturalConnection,
  portalStates: Readonly<Record<string, FacilityPortalState>>
): DoorSpriteModel | null => {
  if (portal.kind !== "door" && portal.kind !== "core_door" && portal.kind !== "trapdoor")
    return null;
  const bounds = connectorBounds(map, portal);
  const state = portalStates[portal.id];
  const open = state ? state.open && !state.sealed : portal.defaultOpen && !portal.defaultSealed;
  const size = doorDimensions(portal, bounds);
  const rotation =
    portal.kind !== "trapdoor" && portal.orientation === "vertical" ? Math.PI / 2 : 0;
  return {
    assetId: portal.kind,
    height: size.height,
    id: portal.id,
    open,
    rotation,
    width: size.width,
    x: bounds.left + bounds.width / 2,
    y: size.y,
  };
};

export const doorArchitectureModels = (
  map: WorldMap,
  portalStates: Readonly<Record<string, FacilityPortalState>>
): DoorSpriteModel[] =>
  architecturalConnections(map).flatMap((portal) => {
    const model = doorArchitectureModel(map, portal, portalStates);
    return model ? [model] : [];
  });
