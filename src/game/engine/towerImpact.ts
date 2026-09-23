import type { AttackSourceSnapshot } from "../encounter/projectileTypes";
import type { CommitDischargeDamage } from "../encounter/catalystTypes";
import { addImpactCharge } from "../encounter/catalystCharge";
import { addEncounterIncident } from "../encounter/events";
import { projectileImpactTargets, type ProjectileImpact } from "../encounter/projectiles";
import type { EncounterContext, EncounterState, EncounterTower } from "../encounter/types";
import { towerDefinition } from "../encounter/catalogs";
import type { EnemyState, WorldPoint } from "../types";
import { enemyRoomId, enemyWorldPosition, neutralizeEnemy } from "./combat";
import {
  addChannels,
  applyDamagePacketsWithScale,
  emptyHazardChannels,
  requestedDamageForPackets,
  type DamageApplication,
  type DamagePacket,
} from "./damage";
import { transitionArmoredMolt } from "./enemyBehaviors";
import { towerFieldDamageScale } from "./enemyField";

const distance = (left: WorldPoint, right: WorldPoint): number =>
  Math.hypot(right.x - left.x, right.elevation - left.elevation);

export const recordLegacyAttack = (
  state: EncounterState,
  tower: EncounterTower,
  targets: readonly EnemyState[],
  killedEnemyIds: number[],
  damage: number,
  definition: EncounterContext
): void => {
  const target = targets[0];
  if (!target) return;
  const chassis = towerDefinition(definition.combat, tower.chassisId);
  const travel =
    chassis.attack.projectileSpeed > 0
      ? distance(tower.placement.firingOrigin, enemyWorldPosition(target)) /
        chassis.attack.projectileSpeed
      : 0.12;
  state.towerAttacks.push({
    id: state.nextTowerAttackId,
    towerId: tower.id,
    strategy: chassis.attack.strategy,
    source: { ...tower.placement.firingOrigin },
    target: enemyWorldPosition(target),
    targetEnemyIds: targets.map((enemy) => enemy.id),
    startedAt: state.elapsed,
    expiresAt: state.elapsed + Math.max(0.12, travel),
    damage,
    killedEnemyIds,
  });
  state.nextTowerAttackId += 1;
  if (state.towerAttacks.length > 96) state.towerAttacks.splice(0, state.towerAttacks.length - 96);
};

/** Every damage path commits the same shield, resistance, attribution, and death transaction. */
export const commitSourceDamage = (
  state: EncounterState,
  enemy: EnemyState,
  packets: DamagePacket[],
  context: EncounterContext
): { application: DamageApplication; shieldScale: number; overkill: number } => {
  const shieldScale = towerFieldDamageScale(state, enemy, packets, context.combat);
  const requested = requestedDamageForPackets(enemy, packets, context.combat) * shieldScale;
  const application = applyDamagePacketsWithScale(
    state,
    enemy,
    packets,
    shieldScale,
    context.combat
  );
  const room = enemyRoomId(enemy, state.map);
  transitionArmoredMolt(state, enemy, room, application.killed);
  if (application.killed && room) {
    neutralizeEnemy(state, enemy, room, application, context);
    state.enemies = state.enemies.filter((candidate) => candidate.id !== enemy.id);
  }
  return { application, shieldScale, overkill: Math.max(0, requested - application.healthBefore) };
};

export const commitDischargeDamage: CommitDischargeDamage = (
  state,
  enemy,
  _source,
  packet,
  context
) => commitSourceDamage(state, enemy, [packet], context).application;

const applyEffects = (enemy: EnemyState, source: AttackSourceSnapshot): void => {
  for (const effect of source.controlEffects) {
    const incoming = {
      sourceTowerId: source.towerId,
      kind: effect.kind,
      magnitude: effect.magnitude,
      remaining: effect.duration,
      stacking: effect.stacking,
      floor: effect.floor,
    };
    const existing = enemy.effects.findIndex(
      (candidate) => candidate.sourceTowerId === source.towerId && candidate.kind === effect.kind
    );
    if (existing < 0) enemy.effects.push(incoming);
    else if (effect.refresh === "extend") {
      enemy.effects[existing]!.remaining += effect.duration;
      enemy.effects[existing]!.magnitude = Math.max(
        enemy.effects[existing]!.magnitude,
        effect.magnitude
      );
    } else enemy.effects[existing] = incoming;
    if (effect.kind === "route_displacement") {
      enemy.pathIndex = Math.max(0, enemy.pathIndex - Math.max(1, Math.round(effect.magnitude)));
      enemy.progress = 0;
    }
  }
};

const resolvePhysicalHit = (
  state: EncounterState,
  source: AttackSourceSnapshot,
  enemy: EnemyState,
  context: EncounterContext
) => {
  const live = state.towers[source.towerId];
  const account = state.catalyst?.directBySource[source.sourceId];
  const { application, shieldScale, overkill } = commitSourceDamage(
    state,
    enemy,
    source.packets,
    context
  );
  if (!application.killed && shieldScale > 0) {
    applyEffects(enemy, source);
    addImpactCharge(state, enemy, source.sourceId, source.chargePerHit, context);
    if (live) live.telemetry.controlApplications += source.controlEffects.length;
  }
  const appliedChannels = emptyHazardChannels();
  for (const packet of application.packets) addChannels(appliedChannels, packet.channels);
  const incident = {
    enemyId: enemy.id,
    enemyType: enemy.type,
    worldPosition: enemyWorldPosition(enemy),
    healthBefore: application.healthBefore,
    healthAfter: application.healthAfter,
    damageByChannel: appliedChannels,
    killed: application.killed,
  };
  if (account) {
    account.damage += application.amount;
    account.overkill += overkill;
    account.kills += Number(application.killed);
  }
  if (live) {
    live.damageDealt += application.amount;
    live.kills += Number(application.killed);
    live.telemetry.overkillDamage += overkill;
    live.telemetry.targetsServiced += 1;
  }
  return incident;
};

export const tickTowerEffects = (state: EncounterState, dt: number): void => {
  for (const enemy of state.enemies) {
    enemy.effects = enemy.effects
      .map((effect) => ({ ...effect, remaining: Math.max(0, effect.remaining - dt) }))
      .filter((effect) => effect.remaining > 0);
  }
};

export const expireTowerAttacks = (state: EncounterState): void => {
  state.towerAttacks = state.towerAttacks.filter((attack) => attack.expiresAt >= state.elapsed);
};

export const resolvePhysicalHits = (
  state: EncounterState,
  source: AttackSourceSnapshot,
  targets: readonly EnemyState[],
  position: WorldPoint,
  strategy: "hitscan" | "cone" | "projectile" | "lob" | "area",
  context: EncounterContext
): void => {
  const channels = emptyHazardChannels();
  const incidents: Parameters<typeof addEncounterIncident>[1]["targets"] = [];
  const killed: number[] = [];
  let damage = 0;
  for (const enemy of targets) {
    if (enemy.health <= 0 || !state.enemies.includes(enemy)) continue;
    const incident = resolvePhysicalHit(state, source, enemy, context);
    incidents.push(incident);
    addChannels(channels, incident.damageByChannel);
    damage += incident.healthBefore - incident.healthAfter;
    if (incident.killed) killed.push(enemy.id);
  }
  state.towerAttacks.push({
    id: state.nextTowerAttackId++,
    towerId: source.towerId,
    sourceChassisId: source.chassisId,
    sourceColor: source.color,
    strategy,
    source: { ...source.origin },
    target: { ...position },
    targetEnemyIds: incidents.map((target) => target.enemyId),
    startedAt: state.elapsed,
    expiresAt: state.elapsed + 0.15,
    damage,
    killedEnemyIds: killed,
  });
  if (state.towerAttacks.length > 96) state.towerAttacks.splice(0, state.towerAttacks.length - 96);
  if (incidents.length > 0)
    addEncounterIncident(state, {
      elapsed: state.elapsed,
      encounterId: state.definition.id,
      phase: state.phase,
      roomId:
        targets
          .map((enemy) => enemyRoomId(enemy, state.map))
          .find((id): id is string => Boolean(id)) ?? "core",
      zone: null,
      sourceId: source.packets[0]?.sourceId ?? "tower_flash",
      reactionExtent: 0,
      pressureImpulse: 0,
      heatDelta: 0,
      damageByChannel: channels,
      targets: incidents,
    });
};

export const resolveProjectileImpact = (
  state: EncounterState,
  impact: ProjectileImpact,
  context: EncounterContext
): void =>
  resolvePhysicalHits(
    state,
    impact.attack.source,
    projectileImpactTargets(state, impact, context),
    impact.position,
    impact.attack.strategy === "lobbed" ? "lob" : "projectile",
    context
  );
