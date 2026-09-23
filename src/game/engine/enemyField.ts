import type { CombatDefinition, EncounterState } from "../encounter/types";
import { DAMAGE_SOURCE_IDS } from "../identifiers";
import type { EnemyState } from "../types";
import {
  requestedDamageBySourceForPackets,
  requestedDamageForPackets,
  type DamagePacket,
} from "./damage";
import { enemyRoomId } from "./enemyPosition";

const activeAnchor = (occupants: EnemyState[]): EnemyState | null =>
  occupants
    .filter(
      (enemy) =>
        enemy.behavior.kind === "shared_field" && enemy.behavior.active && enemy.behavior.charge > 0
    )
    .sort((left, right) => left.id - right.id)[0] ?? null;

/** Spends the room's active protection field against one discrete tower transaction. */
export const towerFieldDamageScale = (
  state: Pick<EncounterState, "map" | "enemies" | "stats">,
  target: EnemyState,
  packets: readonly DamagePacket[],
  definition: Pick<CombatDefinition, "enemies">
): number => {
  const roomId = enemyRoomId(target, state.map);
  if (!roomId) return 1;
  const occupants = state.enemies.filter((enemy) => enemyRoomId(enemy, state.map) === roomId);
  const anchor = activeAnchor(occupants);
  if (!anchor || anchor.id === target.id || anchor.behavior.kind !== "shared_field") return 1;
  const requested = requestedDamageForPackets(target, [...packets], definition);
  if (requested <= 0) return 1;
  const absorbed = Math.min(anchor.behavior.charge, requested);
  anchor.behavior.charge -= absorbed;
  if (anchor.behavior.charge <= 0.001) anchor.behavior.active = false;
  state.stats.fieldDamageAbsorbed += absorbed;
  const bySource = requestedDamageBySourceForPackets(target, [...packets], definition);
  for (const sourceId of DAMAGE_SOURCE_IDS) {
    state.stats.fieldDamageAbsorbedBySource[sourceId] +=
      absorbed * (bySource[sourceId] / requested);
  }
  return 1 - absorbed / requested;
};
