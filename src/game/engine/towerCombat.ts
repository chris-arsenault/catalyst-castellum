import type { EncounterContext, EncounterState, EncounterTower } from "../encounter/types";
import { towerDefinition } from "../encounter/catalogs";
import { configuredProcess } from "../encounter/processContext";
import type { EnemyControlEffect, EnemyState, TowerControlEffectDefinition } from "../types";
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
import { addEncounterIncident as addCombatIncident } from "../encounter/events";
import { acquireTowerTargets, resolveTowerAttackTargets } from "./towerTargeting";
import { effectiveTowerStats } from "./towerStats";
import { firePhysicalTower } from "./towerLaunch";
import { expireTowerAttacks, tickTowerEffects, recordLegacyAttack } from "./towerImpact";
import type { CatalystFieldSample } from "../encounter/catalystTypes";

type TowerTickContext = EncounterContext & { fieldSample: CatalystFieldSample };

const effectKey = (effect: Pick<EnemyControlEffect, "sourceTowerId" | "kind">): string =>
  `${effect.sourceTowerId}:${effect.kind}`;

const oppositeCoating = (kind: TowerControlEffectDefinition["kind"]): "acid" | "caustic" | null => {
  if (kind === "acid") return "caustic";
  if (kind === "caustic") return "acid";
  return null;
};

const applyControlEffect = (
  enemy: EnemyState,
  tower: EncounterTower,
  definition: TowerControlEffectDefinition
): boolean => {
  const opposite = oppositeCoating(definition.kind);
  if (opposite && enemy.effects.some((effect) => effect.kind === opposite)) {
    enemy.effects = enemy.effects.filter(
      (effect) => effect.kind !== "acid" && effect.kind !== "caustic"
    );
    return true;
  }
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
  return false;
};

const neutralizationPackets = (tower: EncounterTower): DamagePacket[] => [
  {
    key: `tower:${tower.id}:${tower.shots}:neutralization`,
    sourceId: "tower_neutralization",
    channels: {
      atmosphere: 0,
      corrosion: 0,
      heat: 18,
      pressure: 0,
      radiation: 0,
    },
  },
];

const attackPackets = (
  state: EncounterState,
  tower: EncounterTower,
  definition: EncounterContext,
  supplyMultiplier: number
): DamagePacket[] => {
  const chassis = towerDefinition(definition.combat, tower.chassisId);
  const multiplier =
    effectiveTowerStats(tower, definition.combat, state).damageMultiplier * supplyMultiplier;
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

type CombatIncidentTarget = Parameters<typeof addCombatIncident>[1]["targets"][number];

interface TowerHitResult {
  amount: number;
  channels: ReturnType<typeof emptyHazardChannels>;
  incidentTarget: CombatIncidentTarget;
  killedEnemyId: number | null;
}

type DamageApplication = ReturnType<typeof applyDamagePacketsWithScale>;

const applyNeutralizationDamage = (
  state: EncounterState,
  tower: EncounterTower,
  enemy: EnemyState,
  current: DamageApplication,
  channels: ReturnType<typeof emptyHazardChannels>,
  definition: EncounterContext
): DamageApplication => {
  const packets = neutralizationPackets(tower);
  const requested = requestedDamageForPackets(enemy, packets, definition.combat);
  const reaction = applyDamagePacketsWithScale(state, enemy, packets, 1, definition.combat);
  tower.telemetry.overkillDamage += Math.max(0, requested - reaction.healthBefore);
  for (const packet of reaction.packets) addChannels(channels, packet.channels);
  return {
    healthBefore: current.healthBefore,
    healthAfter: reaction.healthAfter,
    amount: current.amount + reaction.amount,
    killed: reaction.killed,
    dominantSource: reaction.killed ? reaction.dominantSource : current.dominantSource,
    dominantChannel: reaction.killed ? reaction.dominantChannel : current.dominantChannel,
    packets: [...current.packets, ...reaction.packets],
  };
};

const applyTowerControlEffects = (
  state: EncounterState,
  tower: EncounterTower,
  enemy: EnemyState,
  initial: DamageApplication,
  channels: ReturnType<typeof emptyHazardChannels>,
  definition: EncounterContext
): DamageApplication => {
  let result = initial;
  for (const effect of towerDefinition(definition.combat, tower.chassisId).attack.controlEffects) {
    const reacted = applyControlEffect(enemy, tower, effect);
    tower.telemetry.controlApplications += 1;
    if (reacted && enemy.health > 0) {
      result = applyNeutralizationDamage(state, tower, enemy, result, channels, definition);
    }
  }
  return result;
};

const applyTowerHit = (
  state: EncounterState,
  tower: EncounterTower,
  enemy: EnemyState,
  packets: DamagePacket[],
  definition: EncounterContext
): TowerHitResult | null => {
  if (!state.enemies.includes(enemy) || enemy.health <= 0) return null;
  const fieldScale = towerFieldDamageScale(state, enemy, packets, definition.combat);
  const requested = requestedDamageForPackets(enemy, packets, definition.combat) * fieldScale;
  const application = applyDamagePacketsWithScale(
    state,
    enemy,
    packets,
    fieldScale,
    definition.combat
  );
  tower.telemetry.overkillDamage += Math.max(0, requested - application.healthBefore);
  const channels = application.packets.reduce((total, packet) => {
    addChannels(total, packet.channels);
    return total;
  }, emptyHazardChannels());
  const finalApplication = applyTowerControlEffects(
    state,
    tower,
    enemy,
    application,
    channels,
    definition
  );
  const roomId = enemyRoomId(enemy, state.map);
  transitionArmoredMolt(state, enemy, roomId, finalApplication.killed);
  if (finalApplication.killed && roomId) {
    neutralizeEnemy(state, enemy, roomId, finalApplication, definition);
    tower.kills += 1;
  }
  return {
    amount: finalApplication.amount,
    channels,
    incidentTarget: {
      enemyId: enemy.id,
      enemyType: enemy.type,
      worldPosition: enemyWorldPosition(enemy),
      healthBefore: finalApplication.healthBefore,
      healthAfter: finalApplication.healthAfter,
      damageByChannel: channels,
      killed: finalApplication.killed,
    },
    killedEnemyId: finalApplication.killed && roomId ? enemy.id : null,
  };
};

const recordCombatIncident = (
  state: EncounterState,
  tower: EncounterTower,
  targets: readonly EnemyState[],
  incidentTargets: CombatIncidentTarget[],
  incidentChannels: ReturnType<typeof emptyHazardChannels>,
  definition: EncounterContext
): void => {
  const roomId =
    targets
      .map((enemy) => enemyRoomId(enemy, state.map))
      .find((candidate): candidate is string => Boolean(candidate)) ?? "core";
  addCombatIncident(state, {
    elapsed: state.elapsed,
    encounterId: state.definition.id,
    phase: state.phase,
    roomId,
    zone: null,
    sourceId:
      towerDefinition(definition.combat, tower.chassisId).attack.packets[0]?.sourceId ??
      "tower_flash",
    reactionExtent: 0,
    pressureImpulse: 0,
    heatDelta: 0,
    damageByChannel: incidentChannels,
    targets: incidentTargets,
  });
};

const fireTower = (
  state: EncounterState,
  tower: EncounterTower,
  primaryTargets: readonly EnemyState[],
  definition: TowerTickContext
): void => {
  const targets = resolveTowerAttackTargets(state, tower, primaryTargets, definition.combat);
  const process = configuredProcess(state, definition);
  const supplyUse = process
    ? process.bridge.consumeTowerSupply(process.state, tower, process.context)
    : { damageMultiplier: 1, consumed: {} };
  const packets = attackPackets(state, tower, definition, supplyUse.damageMultiplier);
  if (definition.combat.mechanics.kind === "catalyst") {
    firePhysicalTower(
      state,
      tower,
      primaryTargets,
      targets,
      packets,
      definition,
      definition.fieldSample
    );
    process?.bridge.afterTowerShot(process.state, tower, supplyUse, process.context);
    return;
  }
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
  process?.bridge.afterTowerShot(process.state, tower, supplyUse, process.context);
  recordLegacyAttack(state, tower, targets, killedEnemyIds, damage, definition);
  recordCombatIncident(
    state,
    tower,
    targets,
    hits.map(({ incidentTarget }) => incidentTarget),
    incidentChannels,
    definition
  );
};

const currentTowerCadence = (
  state: EncounterState,
  tower: EncounterTower,
  definition: EncounterContext
): number | null => {
  const supplyStatus = currentSupply(state, tower, definition);
  if (supplyStatus?.mode === "paused") return null;
  const cadence =
    effectiveTowerStats(tower, definition.combat, state).cadence *
    (supplyStatus?.mode === "reduced" ? supplyStatus.modifier : 1);
  // Authored service is at most 10/s; environmental fields multiply it by at most 1.9.
  if (!Number.isFinite(1 / cadence) || cadence <= 0 || cadence > 19)
    throw new Error("Tower cadence exceeds the supported finite service bounds.");
  return cadence;
};

const currentSupply = (state: EncounterState, tower: EncounterTower, context: EncounterContext) => {
  const process = configuredProcess(state, context);
  if (!process) return null;
  const status = process.bridge.towerSupply(process.state, tower, process.context);
  if (status) process.state.process.towerSupply[tower.id] = status;
  return status;
};

const fireReadyAttacks = (
  state: EncounterState,
  tower: EncounterTower,
  dt: number,
  definition: TowerTickContext,
  remainingCooldown: number,
  cadence: number | null
): number => {
  let fired = 0;
  while (remainingCooldown <= 1e-9) {
    if (fired > 0) cadence = currentTowerCadence(state, tower, definition);
    const targets = cadence === null ? [] : acquireTowerTargets(state, tower, definition.combat);
    if (cadence === null || targets.length === 0) {
      tower.cooldown = 0;
      tower.currentTargetIds = [];
      tower.downtimeReason = cadence === null ? "supply" : "no_target";
      if (fired === 0) tower.telemetry.downtime.noTarget += dt;
      return fired;
    }
    if (fired >= 2) throw new Error("A fixed tower tick supports at most two ready attacks.");
    fireTower(state, tower, targets, definition);
    fired += 1;
    remainingCooldown += 1 / cadence;
  }
  // Carry every ready deadline within this tick; idle and supply waits discard firing debt.
  tower.cooldown = Math.max(0, remainingCooldown);
  return fired;
};

const simulateTower = (
  state: EncounterState,
  tower: EncounterTower,
  dt: number,
  definition: TowerTickContext
): void => {
  const cadence = currentTowerCadence(state, tower, definition);
  if (cadence === null) {
    tower.currentTargetIds = [];
    tower.downtimeReason = "supply";
    tower.telemetry.downtime.supply += dt;
    return;
  }
  const remainingCooldown = tower.cooldown > 0 ? tower.cooldown - dt : 0;
  tower.cooldown = Math.max(0, remainingCooldown);
  if (remainingCooldown > 1e-9) {
    tower.downtimeReason = "cooldown";
    tower.telemetry.downtime.cooldown += dt;
    return;
  }
  if (fireReadyAttacks(state, tower, dt, definition, remainingCooldown, cadence) > 0)
    tower.telemetry.engagedSeconds += dt;
};

export const simulateTowers = (
  state: EncounterState,
  dt: number,
  definition: EncounterContext,
  fieldSample: CatalystFieldSample = { byEnemy: {}, servicedByDevice: {} }
): void => {
  expireTowerAttacks(state);
  if (definition.combat.mechanics.kind === "legacy") tickTowerEffects(state, dt);
  for (const tower of Object.values(state.towers).sort((left, right) =>
    left.id.localeCompare(right.id)
  )) {
    const mechanics = definition.combat.mechanics;
    const device = mechanics.kind === "catalyst" ? mechanics.devices[tower.chassisId] : undefined;
    if (device && device.kind !== "weapon") continue;
    simulateTower(state, tower, dt, { ...definition, fieldSample });
  }
};
