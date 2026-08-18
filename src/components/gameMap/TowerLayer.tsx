import { useCallback } from "react";
import type { FederatedPointerEvent, Graphics } from "pixi.js";
import { DEFAULT_GAME_RUNTIME } from "../../game/runtime";
import { gridCellToWorldPoint, gridPathToWorldPath } from "../../game/spatial";
import type { GameState, TowerInstance, TowerInstanceId } from "../../game/types";
import type { TowerPlacementPreview } from "../../presentation/towerPlanning";
import { colorNumber, mapViewFor } from "./mapGeometry";

const drawRouteGraph = (graphics: Graphics, game: GameState): void => {
  graphics.clear();
  const view = mapViewFor(game.map);
  for (const edge of Object.values(game.map.routeGraph.edges)) {
    const points = view.worldPathToMap(gridPathToWorldPath(edge.cells));
    const first = points[0];
    if (!first) continue;
    graphics.moveTo(first.x, first.y);
    for (const point of points.slice(1)) graphics.lineTo(point.x, point.y);
    graphics.stroke({ color: 0xb95645, width: 3, alpha: 0.28 });
  }
};

const directionVector = (orientation: TowerInstance["placement"]["orientation"]) => {
  if (orientation === "left") return { x: -1, y: 0 };
  if (orientation === "right") return { x: 1, y: 0 };
  if (orientation === "up") return { x: 0, y: -1 };
  return { x: 0, y: 1 };
};

const drawCoverage = (
  graphics: Graphics,
  game: GameState,
  tower: TowerInstance,
  color: number
): void => {
  const view = mapViewFor(game.map);
  const stats = DEFAULT_GAME_RUNTIME.queries.effectiveTowerStats(tower, game);
  const origin = view.worldToMapPoint(tower.placement.firingOrigin);
  const direction = directionVector(tower.placement.orientation);
  const center = Math.atan2(direction.y, direction.x);
  const halfArc = (stats.firingArc * Math.PI) / 360;
  graphics
    .moveTo(origin.x, origin.y)
    .arc(origin.x, origin.y, stats.range * view.pixelsPerUnit, center - halfArc, center + halfArc)
    .closePath()
    .fill({ color, alpha: 0.045 })
    .stroke({ color, width: 1.5, alpha: 0.38 });
  for (const cell of Object.values(game.map.routeGraph.edges).flatMap((edge) => edge.cells)) {
    const point = gridCellToWorldPoint(cell);
    const ground = DEFAULT_GAME_RUNTIME.queries.towerCoversPoint(game, tower, point, "ground");
    const flying = DEFAULT_GAME_RUNTIME.queries.towerCoversPoint(game, tower, point, "flying");
    if (!ground && !flying) continue;
    const rect = view.gridCellMapRect(cell);
    graphics
      .rect(rect.left + 4, rect.top + 4, rect.width - 8, rect.height - 8)
      .fill({ color: ground ? color : 0xa886dc, alpha: 0.2 });
  }
};

const drawTower = (
  graphics: Graphics,
  game: GameState,
  tower: TowerInstance,
  selected: boolean
): void => {
  graphics.clear();
  const view = mapViewFor(game.map);
  const origin = view.worldToMapPoint(tower.placement.firingOrigin);
  const definition = DEFAULT_GAME_RUNTIME.definition.towers[tower.chassisId];
  const color = colorNumber(definition.color);
  const direction = directionVector(tower.placement.orientation);
  if (selected) {
    drawCoverage(graphics, game, tower, color);
  }
  graphics
    .roundRect(origin.x - 10, origin.y - 10, 20, 20, 4)
    .fill({ color: 0x0b1713, alpha: 0.98 })
    .stroke({ color, width: selected ? 3 : 2, alpha: 0.96 });
  graphics
    .moveTo(origin.x, origin.y)
    .lineTo(origin.x + direction.x * 19, origin.y + direction.y * 19)
    .stroke({ color, width: 5, cap: "round" });
  if (tower.cooldown > 0) {
    graphics
      .arc(
        origin.x,
        origin.y,
        14,
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 * Math.min(1, tower.cooldown)
      )
      .stroke({ color: 0xd9eadf, width: 2, alpha: 0.55 });
  }
};

const TowerNode = ({
  game,
  tower,
  selected,
  onSelect,
}: {
  game: GameState;
  tower: TowerInstance;
  selected: boolean;
  onSelect: (towerId: TowerInstanceId) => void;
}) => {
  const draw = useCallback(
    (graphics: Graphics) => drawTower(graphics, game, tower, selected),
    [game, selected, tower]
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
  game: GameState;
  preview: TowerPlacementPreview;
}) => {
  const draw = useCallback(
    (graphics: Graphics) => {
      graphics.clear();
      const view = mapViewFor(game.map);
      const definition = DEFAULT_GAME_RUNTIME.definition.towers[preview.chassisId];
      const color = preview.allowed ? colorNumber(definition.color) : 0xe05b4e;
      const previewTower: TowerInstance = {
        id: "tower:preview",
        chassisId: preview.chassisId,
        placement: preview.placement,
        provenance: "site",
        upgrades: [],
        targetPolicy: definition.targetPolicies[0] ?? "first",
        cooldown: 0,
        localResources: { gas: {}, liquid: {} },
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
      drawCoverage(graphics, game, previewTower, color);
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
    },
    [game, preview]
  );
  return <pixiGraphics draw={draw} eventMode="none" />;
};

const AttackLayer = ({ game }: { game: GameState }) => {
  const draw = useCallback(
    (graphics: Graphics) => {
      graphics.clear();
      const view = mapViewFor(game.map);
      for (const attack of game.towerAttacks) {
        const remaining = Math.max(0, attack.expiresAt - game.elapsed);
        const alpha = Math.min(1, remaining * 8);
        const source = view.worldToMapPoint(attack.source);
        const target = view.worldToMapPoint(attack.target);
        const color = colorNumber(
          DEFAULT_GAME_RUNTIME.definition.towers[
            game.towers[attack.towerId]?.chassisId ?? "bolt_caster"
          ].color
        );
        graphics
          .moveTo(source.x, source.y)
          .lineTo(target.x, target.y)
          .stroke({
            color,
            width: attack.strategy === "projectile" ? 3 : 5,
            alpha,
          });
        if (attack.strategy === "lob" || attack.strategy === "area") {
          graphics.circle(target.x, target.y, 18).stroke({ color, width: 2, alpha });
        }
      }
    },
    [game]
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

const EnvironmentalFieldLayer = ({ game }: { game: GameState }) => {
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

export const TowerLayer = ({
  game,
  placementPreview,
  selectedTowerId,
  onSelectTower,
}: {
  game: GameState;
  placementPreview: TowerPlacementPreview | null;
  selectedTowerId: TowerInstanceId | null;
  onSelectTower: (towerId: TowerInstanceId) => void;
}) => {
  const drawRoutes = useCallback((graphics: Graphics) => drawRouteGraph(graphics, game), [game]);
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
