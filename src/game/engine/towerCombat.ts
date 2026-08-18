import type { GameDefinition } from "../definitionTypes";
import type {
  EnemyControlEffect,
  EnemyState,
  GameState,
  TowerControlEffectDefinition,
  TowerInstance,
  WorldPoint,
} from "../types";
import { enemyRoomId, enemyWorldPosition, neutralizeEnemy } from "./combat";
import {
  addChannels,
  applyDamagePacketsWithScale,
  emptyHazardChannels,
  requestedDamageForPackets,
  type DamagePacket,
} from "./damage";
import { transitionArmoredMolt } from "./enemyBehaviors";
import { towerFieldDamageScale } from "./enemyField";
import { addCombatIncident } from "./events";
import { acquireTowerTargets } from "./towerTargeting";
import { effectiveTowerStats } from "./towerStats";
import { consumeTowerSupplyForShot, releaseTowerByproducts, towerSupplyQuery } from "./towerSupply";
import { upsertEnvironmentalField } from "./environmentalFields";
import { towerRoomId } from "./towerPlacement";

const distance = (left: WorldPoint, right: WorldPoint): number =>
  Math.hypot(right.x - left.x, right.elevation - left.elevation);

const expireAttacks = (state: GameState): void => {
  state.towerAttacks = state.towerAttacks.filter((attack) => attack.expiresAt >= state.elapsed);
};

const tickEffects = (state: GameState, dt: number): void => {
  for (const enemy of state.enemies) {
    enemy.effects = enemy.effects
      .map((effect) => ({ ...effect, remaining: Math.max(0, effect.remaining - dt) }))
      .filter((effect) => effect.remaining > 0);
  }
};

const effectKey = (effect: Pick<EnemyControlEffect, "sourceTowerId" | "kind">): string =>
  `${effect.sourceTowerId}:${effect.kind}`;

const applyControlEffect = (
  enemy: EnemyState,
  tower: TowerInstance,
  definition: TowerControlEffectDefinition
): void => {
  const incoming: EnemyControlEffect = {
    sourceTowerId: tower.id,
    kind: definition.kind,
    magnitude: definition.magnitude,
    remaining: definition.duration,
    stacking: definition.stacking,
    floor: definition.floor,
  };
  const index = enemy.effects.findIndex((effect) => effectKey(effect) === effectKey(incoming));
  if (index < 0) enemy.effects.push(incoming);
  else if (definition.refresh === "extend") {
    enemy.effects[index]!.remaining += definition.duration;
    enemy.effects[index]!.magnitude = Math.max(
      enemy.effects[index]!.magnitude,
      definition.magnitude
    );
  } else enemy.effects[index] = incoming;

  if (definition.kind === "route_displacement") {
    enemy.pathIndex = Math.max(0, enemy.pathIndex - Math.max(1, Math.round(definition.magnitude)));
    enemy.progress = 0;
  }
};

const attackPackets = (
  state: GameState,
  tower: TowerInstance,
  definition: GameDefinition,
  supplyMultiplier: number
): DamagePacket[] => {
  const chassis = definition.towers[tower.chassisId];
  const multiplier =
    effectiveTowerStats(tower, definition, state).damageMultiplier * supplyMultiplier;
  return chassis.attack.packets.map((packet, index) => ({
    key: `tower:${tower.id}:${tower.shots}:${index}`,
    sourceId: packet.sourceId,
    channels: {
      atmosphere: packet.channels.atmosphere * multiplier,
      corrosion: packet.channels.corrosion * multiplier,
      heat: packet.channels.heat * multiplier,
      pressure: packet.channels.pressure * multiplier,
      radiation: packet.channels.radiation * multiplier,
    },
  }));
};

const areaTargets = (
  state: GameState,
  tower: TowerInstance,
  primary: readonly EnemyState[],
  definition: GameDefinition
): EnemyState[] => {
  const chassis = definition.towers[tower.chassisId];
  const first = primary[0];
  if (!first || chassis.attack.radius <= 0) return [...primary];
  const center = enemyWorldPosition(first);
  const cap = effectiveTowerStats(tower, definition, state).targetCap;
  return state.enemies
    .filter(
      (enemy) =>
        enemy.health > 0 && distance(center, enemyWorldPosition(enemy)) <= chassis.attack.radius
    )
    .sort((left, right) => left.id - right.id)
    .slice(0, cap);
};

const recordAttack = (
  state: GameState,
  tower: TowerInstance,
  targets: readonly EnemyState[],
  killedEnemyIds: number[],
  damage: number,
  definition: GameDefinition
): void => {
  const target = targets[0];
  if (!target) return;
  const chassis = definition.towers[tower.chassisId];
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

type CombatIncidentTarget = Parameters<typeof addCombatIncident>[1]["targets"][number];

interface TowerHitResult {
  amount: number;
  channels: ReturnType<typeof emptyHazardChannels>;
  incidentTarget: CombatIncidentTarget;
  killedEnemyId: number | null;
}

const applyTowerHit = (
  state: GameState,
  tower: TowerInstance,
  enemy: EnemyState,
  packets: DamagePacket[],
  definition: GameDefinition
): TowerHitResult | null => {
  if (!state.enemies.includes(enemy) || enemy.health <= 0) return null;
  const chassis = definition.towers[tower.chassisId];
  const fieldScale = towerFieldDamageScale(state, enemy, packets, definition);
  const requested = requestedDamageForPackets(enemy, packets, definition) * fieldScale;
  const application = applyDamagePacketsWithScale(state, enemy, packets, fieldScale, definition);
  tower.telemetry.overkillDamage += Math.max(0, requested - application.healthBefore);
  const channels = application.packets.reduce((total, packet) => {
    addChannels(total, packet.channels);
    return total;
  }, emptyHazardChannels());
  for (const effect of chassis.attack.controlEffects) {
    applyControlEffect(enemy, tower, effect);
    tower.telemetry.controlApplications += 1;
  }
  const roomId = enemyRoomId(enemy, state.map);
  transitionArmoredMolt(state, enemy, roomId, application.killed);
  if (application.killed && roomId) {
    neutralizeEnemy(state, enemy, roomId, application, definition);
    tower.kills += 1;
  }
  return {
    amount: application.amount,
    channels,
    incidentTarget: {
      enemyId: enemy.id,
      enemyType: enemy.type,
      worldPosition: enemyWorldPosition(enemy),
      healthBefore: application.healthBefore,
      healthAfter: application.healthAfter,
      damageByChannel: channels,
      killed: application.killed,
    },
    killedEnemyId: application.killed && roomId ? enemy.id : null,
  };
};

const releaseSteamWake = (
  state: GameState,
  tower: TowerInstance,
  reactedHydrogen: number
): void => {
  const roomId = towerRoomId(state, tower);
  if (reactedHydrogen <= 0 || !roomId) return;
  upsertEnvironmentalField(state, {
    id: `tower:${tower.id}:steam-wake`,
    sourceId: tower.id,
    effect: "movement",
    roomId,
    zone: "both",
    intensity: Math.min(0.28, 0.12 + reactedHydrogen * 0.14),
    duration: 3.2,
    decayPerSecond: 0.025,
    stacking: "strongest",
    species: "steam",
  });
};

const recordCombatIncident = (
  state: GameState,
  tower: TowerInstance,
  targets: readonly EnemyState[],
  incidentTargets: CombatIncidentTarget[],
  incidentChannels: ReturnType<typeof emptyHazardChannels>,
  definition: GameDefinition
): void => {
  const roomId =
    targets
      .map((enemy) => enemyRoomId(enemy, state.map))
      .find((candidate): candidate is string => Boolean(candidate)) ?? "core";
  addCombatIncident(state, {
    elapsed: state.elapsed,
    levelId: state.campaign.levelId,
    round: state.campaign.roundIndex + 1,
    phase: state.phase,
    roomId,
    zone: null,
    sourceId: definition.towers[tower.chassisId].attack.packets[0]?.sourceId ?? "tower_bolt",
    reactionExtent: 0,
    pressureImpulse: 0,
    heatDelta: 0,
    damageByChannel: incidentChannels,
    targets: incidentTargets,
  });
};

const fireTower = (
  state: GameState,
  tower: TowerInstance,
  primaryTargets: readonly EnemyState[],
  definition: GameDefinition
): void => {
  const targets = areaTargets(state, tower, primaryTargets, definition);
  const supplyUse = consumeTowerSupplyForShot(state, tower, definition);
  const packets = attackPackets(state, tower, definition, supplyUse.damageMultiplier);
  const hits = targets.flatMap((enemy) => {
    const hit = applyTowerHit(state, tower, enemy, packets, definition);
    return hit ? [hit] : [];
  });
  const killedEnemyIds = hits.flatMap(({ killedEnemyId }) =>
    killedEnemyId === null ? [] : [killedEnemyId]
  );
  const incidentChannels = emptyHazardChannels();
  for (const hit of hits) addChannels(incidentChannels, hit.channels);
  const damage = hits.reduce((total, hit) => total + hit.amount, 0);
  if (killedEnemyIds.length > 0) {
    const killed = new Set(killedEnemyIds);
    state.enemies = state.enemies.filter((enemy) => !killed.has(enemy.id));
  }
  tower.shots += 1;
  tower.telemetry.targetsServiced += targets.length;
  tower.damageDealt += damage;
  tower.currentTargetIds = targets.map((enemy) => enemy.id);
  tower.downtimeReason = "none";
  const reactedHydrogen = releaseTowerByproducts(state, tower, supplyUse.consumed, definition);
  releaseSteamWake(state, tower, reactedHydrogen);
  recordAttack(state, tower, targets, killedEnemyIds, damage, definition);
  recordCombatIncident(
    state,
    tower,
    targets,
    hits.map(({ incidentTarget }) => incidentTarget),
    incidentChannels,
    definition
  );
};

const simulateTower = (
  state: GameState,
  tower: TowerInstance,
  dt: number,
  definition: GameDefinition
): void => {
  const supplyStatus = towerSupplyQuery(state, tower, definition);
  if (supplyStatus) state.towerSupply[tower.id] = supplyStatus;
  if (supplyStatus?.mode === "paused") {
    tower.currentTargetIds = [];
    tower.downtimeReason = "supply";
    tower.telemetry.downtime.supply += dt;
    return;
  }
  const cadence =
    effectiveTowerStats(tower, definition, state).cadence *
    (supplyStatus?.mode === "reduced" ? supplyStatus.modifier : 1);
  tower.cooldown = Math.max(0, tower.cooldown - dt);
  if (tower.cooldown > 0) {
    tower.downtimeReason = "cooldown";
    tower.telemetry.downtime.cooldown += dt;
    return;
  }
  const targets = acquireTowerTargets(state, tower, definition);
  if (targets.length === 0) {
    tower.currentTargetIds = [];
    tower.downtimeReason = "no_target";
    tower.telemetry.downtime.noTarget += dt;
    return;
  }
  tower.telemetry.engagedSeconds += dt;
  fireTower(state, tower, targets, definition);
  tower.cooldown = cadence > 0 ? 1 / cadence : 1;
};

export const simulateTowers = (state: GameState, dt: number, definition: GameDefinition): void => {
  expireAttacks(state);
  tickEffects(state, dt);
  for (const tower of Object.values(state.towers).sort((left, right) =>
    left.id.localeCompare(right.id)
  )) {
    simulateTower(state, tower, dt, definition);
  }
};
