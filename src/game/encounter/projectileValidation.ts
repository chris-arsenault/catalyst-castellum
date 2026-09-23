import type { AttackSourceSnapshot, PendingAttack } from "./projectileTypes";
import { projectilePositionAt } from "./projectiles";
import type { EncounterContext, EncounterState } from "./types";
import type { WorldPoint } from "../types";

const nonnegative = (value: number): boolean => Number.isFinite(value) && value >= 0;
const positive = (value: number): boolean => Number.isFinite(value) && value > 0;
const insideMap = (point: WorldPoint, state: EncounterState): boolean =>
  point.x >= 0 &&
  point.x <= state.map.width &&
  point.elevation >= 0 &&
  point.elevation <= state.map.height;
const validSourceValues = (source: AttackSourceSnapshot): boolean =>
  [source.origin.x, source.origin.elevation].every(Number.isFinite) &&
  [source.chargePerHit, source.radius].every(nonnegative) &&
  Number.isSafeInteger(source.targetCap) &&
  source.targetCap >= 1 &&
  source.packets.every((packet) => Object.values(packet.channels).every(nonnegative)) &&
  source.controlEffects.every((effect) =>
    [effect.magnitude, effect.duration, effect.floor].every(nonnegative)
  );
const validSource = (
  source: AttackSourceSnapshot,
  state: EncounterState,
  context: EncounterContext
): boolean => {
  const retained = state.catalyst?.sources[source.sourceId];
  const chassis = context.combat.towers[source.chassisId];
  return Boolean(
    retained &&
    chassis &&
    retained.towerId === source.towerId &&
    retained.chassisId === source.chassisId &&
    validSourceValues(source) &&
    source.eligibleLayers.length > 0 &&
    new Set(source.eligibleLayers).size === source.eligibleLayers.length &&
    source.eligibleLayers.every((layer) => chassis.eligibleLayers.includes(layer))
  );
};

const validFlight = (attack: PendingAttack): boolean => {
  if (
    ![attack.speed, attack.travelSeconds, attack.collisionRadius].every(positive) ||
    ![attack.age, attack.lobHeight].every(nonnegative) ||
    attack.age >= attack.travelSeconds ||
    ![attack.target.x, attack.target.elevation].every(Number.isFinite)
  )
    return false;
  if (attack.strategy === "projectile" && attack.lobHeight !== 0) return false;
  const duration = Math.max(
    0.001,
    Math.hypot(
      attack.target.x - attack.source.origin.x,
      attack.target.elevation - attack.source.origin.elevation
    ) / attack.speed
  );
  const position = projectilePositionAt(attack, attack.age / attack.travelSeconds);
  return (
    Math.abs(duration - attack.travelSeconds) < 1e-9 &&
    Math.abs(position.x - attack.position.x) < 1e-9 &&
    Math.abs(position.elevation - attack.position.elevation) < 1e-9
  );
};

const validIdentity = (attack: PendingAttack, state: EncounterState, ids: Set<number>): boolean =>
  Number.isSafeInteger(attack.id) &&
  attack.id >= 1 &&
  attack.id < state.nextTowerAttackId &&
  !ids.has(attack.id);
const validStrategy = (attack: PendingAttack, context: EncounterContext): boolean => {
  const authored = context.combat.towers[attack.source.chassisId]?.attack.strategy;
  return attack.strategy === "lobbed" ? authored === "lob" : authored === "projectile";
};

export const validatePendingAttacks = (
  state: EncounterState,
  context: EncounterContext
): string[] => {
  if (context.combat.mechanics.kind === "legacy")
    return state.pendingAttacks.length > 0
      ? ["legacy encounters cannot retain physical attacks"]
      : [];
  const issues: string[] = [];
  const ids = new Set<number>();
  for (const attack of state.pendingAttacks) {
    if (!validIdentity(attack, state, ids))
      issues.push(`invalid pending attack identity ${attack.id}`);
    ids.add(attack.id);
    if (!validSource(attack.source, state, context))
      issues.push(`invalid pending attack source ${attack.id}`);
    if (![attack.source.origin, attack.target].every((point) => insideMap(point, state)))
      issues.push(`pending attack endpoint leaves map ${attack.id}`);
    if (!validStrategy(attack, context) || !validFlight(attack))
      issues.push(`invalid pending attack flight ${attack.id}`);
  }
  return issues;
};
