import { gridCellToWorldPoint } from "../spatial";
import type { GameDefinition } from "../definitionTypes";
import type { EnemyState, GasZone, RoomId, WorldPoint } from "../types";
import { instance } from "../world/instances";

export const enemyWorldPosition = (enemy: EnemyState): WorldPoint => {
  const current = enemy.path[Math.min(enemy.pathIndex, enemy.path.length - 1)];
  if (!current) throw new Error(`Enemy ${enemy.id} has no cell navigation path.`);
  const next = enemy.path[Math.min(enemy.pathIndex + 1, enemy.path.length - 1)] ?? current;
  const from = gridCellToWorldPoint(current.cell);
  const to = gridCellToWorldPoint(next.cell);
  return {
    x: from.x + (to.x - from.x) * enemy.progress,
    elevation: from.elevation + (to.elevation - from.elevation) * enemy.progress,
  };
};

export const enemyRoomId = (enemy: EnemyState, definition: GameDefinition): RoomId | null =>
  definition.facility.roomAtWorldPoint(enemyWorldPosition(enemy));

export const enemyGasZone = (enemy: EnemyState, definition: GameDefinition): GasZone => {
  const roomId = enemyRoomId(enemy, definition);
  if (!roomId) return "lower";
  const bounds = instance(definition.facilityMap.rooms, roomId, "map room").bounds;
  const relativeElevation =
    (enemyWorldPosition(enemy).elevation - bounds.elevation) / bounds.height;
  return relativeElevation >= 0.5 ? "upper" : "lower";
};
