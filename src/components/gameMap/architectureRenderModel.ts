import { facilityModelForMap } from "../../game/world/derivedModel";
import type { WorldMap } from "../../game/world/map";
import type { FacilityCellDefinition } from "../../game/facilityTypes";
import type { ArchitectureSpriteId } from "./architectureSprites";
import { mapViewFor } from "./mapGeometry";
import { instance } from "../../game/world/instances";

export interface ArchitectureSpriteModel {
  assetId: ArchitectureSpriteId;
  height: number;
  id: string;
  rotation: number;
  width: number;
  x: number;
  y: number;
}

const architectureKind = (definition: FacilityCellDefinition): "ladder" | "walkway" | null => {
  if (definition.terrain === "platform") return "walkway";
  if (definition.terrain === "ladder" && !definition.portalId) return "ladder";
  return null;
};

export const staticArchitectureModels = (map: WorldMap): ArchitectureSpriteModel[] => {
  const view = mapViewFor(map);
  return facilityModelForMap(map)
    .cells()
    .flatMap((definition) => {
      const kind = architectureKind(definition);
      if (!kind) return [];
      const rect = view.gridCellMapRect(definition.cell);
      const hull = definition.roomId
        ? instance(map.rooms, definition.roomId, "architecture room").provenance === "hull"
        : false;
      const assetId: ArchitectureSpriteId = hull ? `${kind}_hull` : kind;
      return [
        {
          assetId,
          height: kind === "walkway" ? 34 : rect.height,
          id: `${kind}:${definition.cell.column}:${definition.cell.elevation}`,
          rotation: 0,
          width: kind === "walkway" ? 34 : rect.width,
          x: rect.left + rect.width / 2,
          y: kind === "walkway" ? rect.top + 2 : rect.top + rect.height / 2,
        } satisfies ArchitectureSpriteModel,
      ];
    });
};
