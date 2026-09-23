import type { EnemyState, WorldPoint } from "../types";
import type { WorldMap } from "../world/map";
import { facilityModelForMap } from "../world/derivedModel";
import { enemyWorldPosition } from "../engine/enemyPosition";
import { enemyDefinition } from "./catalogs";
import type { EncounterContext, EncounterState } from "./types";
import type { PendingAttack } from "./projectileTypes";

const interpolate = (a: WorldPoint, b: WorldPoint, t: number): WorldPoint => ({
  x: a.x + (b.x - a.x) * t,
  elevation: a.elevation + (b.elevation - a.elevation) * t,
});

/** Exact segment/closed-cell intersection; touching a solid corner blocks the ray. */
const cellIntersection = (a: WorldPoint, b: WorldPoint, x: number, y: number): number | null => {
  let near = 0;
  let far = 1;
  for (const [start, delta, low] of [
    [a.x, b.x - a.x, x],
    [a.elevation, b.elevation - a.elevation, y],
  ]) {
    if (Math.abs(delta!) < 1e-12) {
      if (start! < low! || start! > low! + 1) return null;
    } else {
      const left = (low! - start!) / delta!;
      const right = (low! + 1 - start!) / delta!;
      near = Math.max(near, Math.min(left, right));
      far = Math.min(far, Math.max(left, right));
      if (near > far) return null;
    }
  }
  return far <= 1e-9 ? null : near;
};

const firstSolid = (map: WorldMap, a: WorldPoint, b: WorldPoint): number | null => {
  const model = facilityModelForMap(map);
  let first: number | null = null;
  for (let x = Math.floor(Math.min(a.x, b.x)); x <= Math.floor(Math.max(a.x, b.x)); x += 1) {
    for (
      let y = Math.floor(Math.min(a.elevation, b.elevation));
      y <= Math.floor(Math.max(a.elevation, b.elevation));
      y += 1
    ) {
      const terrain = model.cellDefinition({ column: x, elevation: y }).terrain;
      if (terrain !== "solid" && terrain !== "platform" && terrain !== "core_shell") continue;
      const t = cellIntersection(a, b, x, y);
      if (t !== null && (first === null || t < first)) first = t;
    }
  }
  return first;
};

export const hasCombatLineOfSight = (
  map: WorldMap,
  source: WorldPoint,
  target: WorldPoint
): boolean => firstSolid(map, source, target) === null;

const enemyIntersection = (
  a: WorldPoint,
  b: WorldPoint,
  center: WorldPoint,
  radius: number
): number | null => {
  const dx = b.x - a.x;
  const dy = b.elevation - a.elevation;
  const ox = a.x - center.x;
  const oy = a.elevation - center.elevation;
  const c = ox * ox + oy * oy - radius * radius;
  if (c <= 0) return 0;
  const length = dx * dx + dy * dy;
  if (length <= 1e-12) return null;
  const projection = ox * dx + oy * dy;
  const discriminant = projection * projection - length * c;
  if (discriminant < 0) return null;
  const t = (-projection - Math.sqrt(discriminant)) / length;
  return t >= 0 && t <= 1 ? t : null;
};

const eligible = (enemy: EnemyState, attack: PendingAttack, context: EncounterContext): boolean =>
  enemy.health > 0 &&
  attack.source.eligibleLayers.includes(
    enemyDefinition(context.combat, enemy.type).flying ? "flying" : "ground"
  );

/** The authored lob is a fixed 32-segment parabola, independent of tick batching. */
export const projectilePositionAt = (attack: PendingAttack, fraction: number): WorldPoint => {
  const point = interpolate(attack.source.origin, attack.target, fraction);
  const lower = Math.floor(fraction * 32) / 32;
  const upper = Math.min(1, lower + 1 / 32);
  const blend = (fraction - lower) * 32;
  point.elevation +=
    4 * attack.lobHeight * (lower * (1 - lower) * (1 - blend) + upper * (1 - upper) * blend);
  return point;
};

export interface ProjectileImpact {
  attack: PendingAttack;
  position: WorldPoint;
  enemyId: number | null;
  time: number;
}

const advanceAttack = (
  state: EncounterState,
  attack: PendingAttack,
  dt: number,
  context: EncounterContext
): ProjectileImpact | null => {
  const from = attack.age / attack.travelSeconds;
  const to = Math.min(1, (attack.age + dt) / attack.travelSeconds);
  const segments = attack.strategy === "lobbed" ? 32 : 1;
  let start = from;
  while (start < to - 1e-12) {
    const end = Math.min(to, (Math.floor(start * segments + 1e-9) + 1) / segments);
    const a = attack.position;
    const b = projectilePositionAt(attack, end);
    let hit = firstSolid(state.map, a, b);
    let enemyId: number | null = null;
    for (const enemy of state.enemies
      .filter((candidate) => eligible(candidate, attack, context))
      .sort((l, r) => l.id - r.id)) {
      const t = enemyIntersection(a, b, enemyWorldPosition(enemy), attack.collisionRadius);
      if (t !== null && (hit === null || t < hit)) {
        hit = t;
        enemyId = enemy.id;
      }
    }
    if (hit !== null)
      return {
        attack,
        position: interpolate(a, b, hit),
        enemyId,
        time: (start + (end - start) * hit - from) * attack.travelSeconds,
      };
    attack.position = b;
    start = end;
  }
  attack.age = Math.min(attack.travelSeconds, attack.age + dt);
  return to >= 1
    ? {
        attack,
        position: { ...attack.target },
        enemyId: null,
        time: (1 - from) * attack.travelSeconds,
      }
    : null;
};

export const projectileImpactTargets = (
  state: EncounterState,
  impact: ProjectileImpact,
  context: EncounterContext
): EnemyState[] => {
  const { attack, position, enemyId } = impact;
  const primary = state.enemies.find(
    (enemy) => enemy.id === enemyId && eligible(enemy, attack, context)
  );
  if (attack.source.radius <= 0) return primary ? [primary] : [];
  const secondary = state.enemies
    .filter(
      (enemy) =>
        enemy.id !== enemyId &&
        eligible(enemy, attack, context) &&
        Math.hypot(
          enemyWorldPosition(enemy).x - position.x,
          enemyWorldPosition(enemy).elevation - position.elevation
        ) <= attack.source.radius &&
        hasCombatLineOfSight(state.map, position, enemyWorldPosition(enemy))
    )
    .sort((l, r) => l.id - r.id);
  return [...(primary ? [primary] : []), ...secondary].slice(0, attack.source.targetCap);
};

/** Re-evaluate remaining sweeps after each committed kill; dead enemies cannot intercept later shots. */
export const advanceProjectiles = (
  state: EncounterState,
  dt: number,
  context: EncounterContext,
  commit: (impact: ProjectileImpact) => void
): void => {
  const pending = [...state.pendingAttacks];
  while (pending.length > 0) {
    const candidates = pending
      .map((attack) => advanceAttack(state, structuredClone(attack), dt, context))
      .filter((impact): impact is ProjectileImpact => impact !== null);
    candidates.sort(
      (l, r) =>
        l.time - r.time ||
        l.attack.source.sourceId.localeCompare(r.attack.source.sourceId) ||
        l.attack.id - r.attack.id ||
        (l.enemyId ?? -1) - (r.enemyId ?? -1)
    );
    const first = candidates[0];
    if (!first) break;
    pending.splice(
      pending.findIndex((attack) => attack.id === first.attack.id),
      1
    );
    commit(first);
  }
  for (const attack of pending) advanceAttack(state, attack, dt, context);
  state.pendingAttacks = pending;
};
