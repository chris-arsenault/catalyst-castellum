import type { Graphics } from "pixi.js";
import { gridCellToWorldPoint } from "../../game/spatial";
import type { EncounterState } from "../../game/tactical";
import type { EncounterTower } from "../../game/encounter/types";
import { towerMountWorldPoint } from "../../presentation/towerPlanning";
import type { TacticalPresentation } from "../../presentation/tactical";
type TowerPresentation = Pick<
  TacticalPresentation["towers"],
  "definition" | "stats" | "coversPoint"
>;
import { colorNumber, mapViewFor } from "./mapGeometry";
import { drawTowerApparatus, towerDirection } from "./towerGraphics";

export const drawTowerCoverage = (
  graphics: Graphics,
  game: EncounterState,
  tower: EncounterTower,
  color: number,
  towers: TowerPresentation
): void => {
  const view = mapViewFor(game.map);
  const stats = towers.stats(tower, game);
  const origin = view.worldToMapPoint(tower.placement.firingOrigin);
  const direction = towerDirection(tower.placement.orientation);
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
    const ground = towers.coversPoint(game, tower, point, "ground");
    const flying = towers.coversPoint(game, tower, point, "flying");
    if (!ground && !flying) continue;
    const rect = view.gridCellMapRect(cell);
    graphics
      .rect(rect.left + 4, rect.top + 4, rect.width - 8, rect.height - 8)
      .fill({ color: ground ? color : 0xa886dc, alpha: 0.2 });
  }
};

export const drawTower = (
  graphics: Graphics,
  game: EncounterState,
  tower: EncounterTower,
  selected: boolean,
  towers: TowerPresentation
): void => {
  graphics.clear();
  const definition = towers.definition(tower.chassisId);
  const color = colorNumber(definition.color);
  if (selected) {
    drawTowerCoverage(graphics, game, tower, color, towers);
  }
  drawTowerBody(graphics, game, tower, selected, towers);
};

export const drawTowerBody = (
  graphics: Graphics,
  game: EncounterState,
  tower: EncounterTower,
  selected: boolean,
  towers: TowerPresentation,
  alpha = 1
): void => {
  const view = mapViewFor(game.map);
  const mount = view.worldToMapPoint(towerMountWorldPoint(tower.placement));
  const origin = view.worldToMapPoint(tower.placement.firingOrigin);
  const chassis = { x: (mount.x + origin.x) / 2, y: (mount.y + origin.y) / 2 };
  const definition = towers.definition(tower.chassisId);
  const color = colorNumber(definition.color);
  const direction = towerDirection(tower.placement.orientation);
  graphics
    .moveTo(mount.x, mount.y)
    .lineTo(chassis.x, chassis.y)
    .stroke({ color, width: 5, alpha: 0.7 * alpha, cap: "round" });
  if (selected) {
    graphics.circle(chassis.x, chassis.y, 15).stroke({ color: 0xe7f1eb, width: 2, alpha: 0.82 });
  }
  drawTowerApparatus(graphics, tower.chassisId, chassis, origin, direction, color, selected, alpha);
  if (tower.cooldown > 0) {
    graphics
      .arc(
        chassis.x,
        chassis.y,
        14,
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 * Math.min(1, tower.cooldown)
      )
      .stroke({ color: 0xd9eadf, width: 2, alpha: 0.55 * alpha });
  }
};
