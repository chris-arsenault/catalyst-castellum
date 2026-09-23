import { useCallback } from "react";
import type { FederatedPointerEvent, Graphics } from "pixi.js";
import { useEncounterControls } from "../../application/encounterSurface";
import { gridPathToWorldPath } from "../../game/spatial";
import type { TowerInstanceId } from "../../game/types";
import type { EncounterState, EncounterTower } from "../../game/encounter/types";
import type { TowerPlacementPreview } from "../../presentation/towerPlanning";
import { colorNumber, mapViewFor } from "./mapGeometry";
import { drawTowerAttack } from "./towerGraphics";
import { drawTower, drawTowerBody, drawTowerCoverage } from "./towerDrawing";

const drawRouteGraph = (
  graphics: Graphics,
  game: EncounterState,
  focusedRouteId: string | null
): void => {
  graphics.clear();
  const view = mapViewFor(game.map);
  for (const edge of Object.values(game.map.routeGraph.edges)) {
    const points = view.worldPathToMap(gridPathToWorldPath(edge.cells));
    const first = points[0];
    if (!first) continue;
    graphics.moveTo(first.x, first.y);
    for (const point of points.slice(1)) graphics.lineTo(point.x, point.y);
    const highlighted =
      focusedRouteId && game.map.routeGraph.routes[focusedRouteId]?.edgeIds.includes(edge.id);
    graphics.stroke({
      color: highlighted ? 0xf2cb71 : 0xb95645,
      width: highlighted ? 5 : 3,
      alpha: highlighted ? 0.9 : 0.28,
    });
  }
};

const TowerNode = ({
  game,
  tower,
  selected,
  onSelect,
}: {
  game: EncounterState;
  tower: EncounterTower;
  selected: boolean;
  onSelect: (towerId: TowerInstanceId) => void;
}) => {
  const { towers } = useEncounterControls().presentation;
  const draw = useCallback(
    (graphics: Graphics) => {
      const device = towers.device(tower.chassisId);
      if (!device || device.kind === "weapon") drawTower(graphics, game, tower, selected, towers);
      else {
        graphics.clear();
        drawTowerBody(graphics, game, tower, selected, towers);
      }
    },
    [game, selected, tower, towers]
  );
  return (
    <pixiGraphics
      draw={draw}
      eventMode="static"
      cursor="pointer"
      onPointerTap={(event: FederatedPointerEvent) => {
        event.stopPropagation();
        onSelect(tower.id);
      }}
    />
  );
};

const PlacementPreview = ({
  game,
  preview,
}: {
  game: EncounterState;
  preview: TowerPlacementPreview;
}) => {
  const { towers } = useEncounterControls().presentation;
  const draw = useCallback(
    (graphics: Graphics) => {
      graphics.clear();
      const view = mapViewFor(game.map);
      const definition = towers.definition(preview.chassisId);
      const color = preview.allowed ? colorNumber(definition.color) : 0xe05b4e;
      const previewTower: EncounterTower = {
        id: "tower:preview",
        chassisId: preview.chassisId,
        placement: preview.placement,
        provenance: "site",
        upgrades: [],
        targetPolicy: definition.targetPolicies[0] ?? "first",
        cooldown: 0,
        currentTargetIds: [],
        damageDealt: 0,
        kills: 0,
        shots: 0,
        totalMatterSpent: 0,
        downtimeReason: "no_target",
        telemetry: {
          engagedSeconds: 0,
          targetsServiced: 0,
          overkillDamage: 0,
          controlApplications: 0,
          downtime: { noTarget: 0, cooldown: 0, supply: 0 },
        },
      };
      const device = towers.device(preview.chassisId);
      if (!device || device.kind === "weapon")
        drawTowerCoverage(graphics, game, previewTower, color, towers);
      else {
        const origin = view.worldToMapPoint(preview.placement.firingOrigin);
        graphics
          .circle(origin.x, origin.y, device.radius * view.pixelsPerUnit)
          .stroke({ color, width: 2, alpha: 0.5 });
      }
      for (const cell of preview.placement.occupiedCells) {
        const rect = view.gridCellMapRect(cell);
        graphics
          .rect(rect.left + 2, rect.top + 2, rect.width - 4, rect.height - 4)
          .fill({ color, alpha: 0.25 })
          .stroke({ color, width: 2, alpha: 0.9 });
      }
      for (const cell of preview.placement.supportCells) {
        const rect = view.gridCellMapRect(cell);
        graphics
          .rect(rect.left + 6, rect.top + 6, rect.width - 12, rect.height - 12)
          .stroke({ color, width: 1, alpha: 0.55 });
      }
      drawTowerBody(graphics, game, previewTower, false, towers, 0.78);
    },
    [game, preview, towers]
  );
  return <pixiGraphics draw={draw} eventMode="none" />;
};

const AttackLayer = ({ game }: { game: EncounterState }) => {
  const { towers } = useEncounterControls().presentation;
  const draw = useCallback(
    (graphics: Graphics) => {
      graphics.clear();
      const view = mapViewFor(game.map);
      for (const attack of game.towerAttacks) {
        const remaining = Math.max(0, attack.expiresAt - game.elapsed);
        const alpha = Math.min(1, remaining * 8);
        const source = view.worldToMapPoint(attack.source);
        const target = view.worldToMapPoint(attack.target);
        const chassisId = attack.sourceChassisId ?? game.towers[attack.towerId]?.chassisId;
        if (!chassisId) continue;
        const color = colorNumber(attack.sourceColor ?? towers.definition(chassisId).color);
        if (attack.sourceColor && (attack.strategy === "projectile" || attack.strategy === "lob")) {
          graphics.circle(target.x, target.y, 6).stroke({ color, width: 2, alpha });
          continue;
        }
        drawTowerAttack(graphics, attack, chassisId, source, target, color, alpha, game.elapsed);
      }
    },
    [game, towers]
  );
  return <pixiGraphics draw={draw} eventMode="none" />;
};

const FIELD_COLORS = {
  visibility: 0xd7be55,
  cadence: 0x58c9d8,
  movement: 0x83c7bc,
  damage: 0xe96b4f,
  reveal: 0xb8a3ef,
} as const;

const EnvironmentalFieldLayer = ({ game }: { game: EncounterState }) => {
  const draw = useCallback(
    (graphics: Graphics) => {
      graphics.clear();
      const view = mapViewFor(game.map);
      for (const field of game.environmentalFields) {
        const room = game.map.rooms[field.roomId];
        if (!room) continue;
        const lowerHalf = Math.max(1, Math.floor(room.bounds.height / 2));
        let elevation = room.bounds.elevation;
        let height = lowerHalf;
        if (field.zone === "upper") {
          elevation += lowerHalf;
          height = room.bounds.height - lowerHalf;
        } else if (field.zone === "both") {
          height = room.bounds.height;
        }
        const first = view.gridCellMapRect({ column: room.bounds.column, elevation });
        const last = view.gridCellMapRect({
          column: room.bounds.column + room.bounds.width - 1,
          elevation: elevation + Math.max(0, height - 1),
        });
        const color = FIELD_COLORS[field.effect];
        graphics
          .rect(
            first.left,
            last.top,
            last.left + last.width - first.left,
            first.top + first.height - last.top
          )
          .fill({ color, alpha: 0.035 + field.intensity * 0.16 })
          .stroke({ color, width: 1.5, alpha: 0.2 + field.intensity * 0.55 });
      }
    },
    [game]
  );
  return <pixiGraphics draw={draw} eventMode="none" />;
};

export const EncounterTowerLayer = ({
  game,
  placementPreview,
  selectedTowerId,
  onSelectTower,
}: {
  game: EncounterState;
  placementPreview: TowerPlacementPreview | null;
  selectedTowerId: TowerInstanceId | null;
  onSelectTower: (towerId: TowerInstanceId) => void;
}) => {
  const { focusedRouteId } = useEncounterControls();
  const drawRoutes = useCallback(
    (graphics: Graphics) => drawRouteGraph(graphics, game, focusedRouteId),
    [game, focusedRouteId]
  );
  return (
    <>
      <pixiGraphics draw={drawRoutes} eventMode="none" />
      <EnvironmentalFieldLayer game={game} />
      {Object.values(game.towers).map((tower) => (
        <TowerNode
          key={tower.id}
          game={game}
          tower={tower}
          selected={tower.id === selectedTowerId}
          onSelect={onSelectTower}
        />
      ))}
      {placementPreview && <PlacementPreview game={game} preview={placementPreview} />}
      <AttackLayer game={game} />
    </>
  );
};
