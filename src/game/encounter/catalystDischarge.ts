import { emptyHazardChannels, requestedDamageForPackets } from "../engine/damage";
import { enemyWorldPosition } from "../engine/enemyPosition";
import type { EnemyState } from "../types";
import { enemyRouteDistance } from "../world/routes";
import { enemyDefinition } from "./catalogs";
import { ensureCatalystSource, removeEnemyCharge } from "./catalystCharge";
import type {
  CommitDischargeDamage,
  DischargeDeviceDefinition,
  DischargePreview,
  CatalystPulse,
  CatalystPulseTarget,
} from "./catalystTypes";
import { hasCombatLineOfSight } from "./projectiles";
import type { EncounterContext, EncounterState, EncounterTower } from "./types";

const separation = (left: EnemyState, right: EnemyState): number => {
  const a = enemyWorldPosition(left);
  const b = enemyWorldPosition(right);
  return Math.hypot(b.x - a.x, b.elevation - a.elevation);
};

const towerDistance = (tower: EncounterTower, enemy: EnemyState): number => {
  const position = enemyWorldPosition(enemy);
  return Math.hypot(
    position.x - tower.placement.firingOrigin.x,
    position.elevation - tower.placement.firingOrigin.elevation
  );
};

const inCoverage = (
  state: EncounterState,
  tower: EncounterTower,
  device: DischargeDeviceDefinition,
  context: EncounterContext
): EnemyState[] =>
  state.enemies.filter(
    (enemy) =>
      enemy.health > 0 &&
      towerDistance(tower, enemy) <= device.radius &&
      device.eligibleLayers.includes(
        enemyDefinition(context.combat, enemy.type).flying ? "flying" : "ground"
      )
  );

const hasCharge = (state: EncounterState, enemy: EnemyState, threshold: number): boolean => {
  const charge = state.catalyst?.chargeByEnemy[String(enemy.id)];
  return Boolean(
    charge && charge.amount + 1e-9 >= threshold && charge.lastDischargeTick !== state.tick
  );
};

const selectSeed = (
  state: EncounterState,
  tower: EncounterTower,
  candidates: EnemyState[],
  device: DischargeDeviceDefinition
): EnemyState | null =>
  candidates
    .filter(
      (enemy) =>
        hasCharge(state, enemy, device.seedThreshold) &&
        hasCombatLineOfSight(state.map, tower.placement.firingOrigin, enemyWorldPosition(enemy))
    )
    .sort((left, right) => {
      const health = tower.targetPolicy === "strongest" ? right.health - left.health : 0;
      return (
        health ||
        enemyRouteDistance(left).remaining - enemyRouteDistance(right).remaining ||
        left.id - right.id
      );
    })[0] ?? null;

const chainFromSeed = (
  state: EncounterState,
  seed: EnemyState | null,
  candidates: EnemyState[],
  device: DischargeDeviceDefinition
) => {
  const chain = seed ? [seed] : [];
  const blockedLinks: DischargePreview["blockedLinks"] = [];
  while (chain.length > 0 && chain.length < device.targetCap) {
    const previous = chain.at(-1)!;
    const nearby = candidates
      .filter(
        (enemy) =>
          !chain.includes(enemy) &&
          hasCharge(state, enemy, device.secondaryThreshold) &&
          separation(previous, enemy) <= device.linkDistance
      )
      .sort(
        (left, right) =>
          separation(previous, left) - separation(previous, right) || left.id - right.id
      );
    let next: EnemyState | undefined;
    for (const candidate of nearby) {
      if (
        hasCombatLineOfSight(state.map, enemyWorldPosition(previous), enemyWorldPosition(candidate))
      ) {
        next = candidate;
        break;
      }
      blockedLinks.push({ fromEnemyId: previous.id, toEnemyId: candidate.id });
    }
    if (!next) break;
    chain.push(next);
  }
  return { chain, blockedLinks };
};

const waitingForDischarge = (
  readyIn: number,
  seed: EnemyState | null,
  visible: boolean
): DischargePreview["waitingReason"] => {
  if (readyIn > 1e-9) return "recharging";
  if (seed) return "ready";
  return visible ? "acquiring_charge" : "awaiting_target";
};

export const previewDischarge = (
  state: EncounterState,
  towerId: string,
  context: EncounterContext
): DischargePreview | null => {
  const tower = state.towers[towerId];
  const mechanics = context.combat.mechanics;
  if (!tower || !state.catalyst || mechanics.kind !== "catalyst") return null;
  const device = mechanics.devices[tower.chassisId];
  const status = state.catalyst.devices[towerId];
  if (device?.kind !== "discharge" || status?.kind !== "discharge") return null;
  const candidates = inCoverage(state, tower, device, context);
  const seed = selectSeed(state, tower, candidates, device);
  const { chain, blockedLinks } = chainFromSeed(state, seed, candidates, device);
  const readyIn = Math.max(0, status.readyAt - state.elapsed);
  const visible = candidates.some((enemy) =>
    hasCombatLineOfSight(state.map, tower.placement.firingOrigin, enemyWorldPosition(enemy))
  );
  const waitingReason = waitingForDischarge(readyIn, seed, visible);
  return {
    sourceId: towerId,
    waitingReason,
    readyIn,
    seedEnemyId: seed?.id ?? null,
    chainEnemyIds: chain.map((enemy) => enemy.id),
    blockedLinks,
    seedThreshold: device.seedThreshold,
    secondaryThreshold: device.secondaryThreshold,
    targetCap: device.targetCap,
    radius: device.radius,
  };
};

const dischargeTarget = (
  state: EncounterState,
  enemy: EnemyState,
  tower: EncounterTower,
  device: DischargeDeviceDefinition,
  pulseId: number,
  context: EncounterContext,
  commit: CommitDischargeDamage
): CatalystPulseTarget => {
  const catalyst = state.catalyst!;
  const charge = catalyst.chargeByEnemy[String(enemy.id)]!;
  const consumed = Math.min(device.consumeCap, charge.amount);
  charge.lastDischargeTick = state.tick;
  const contributions = removeEnemyCharge(state, enemy.id, consumed, "consumed");
  const channels = emptyHazardChannels();
  channels[device.channel] = consumed * device.damagePerCharge;
  const packet = {
    key: `discharge:${tower.id}:${pulseId}:${enemy.id}`,
    sourceId: device.sourceId,
    channels,
  };
  const requested = requestedDamageForPackets(enemy, [packet], context.combat);
  const shieldBefore = state.stats.fieldDamageAbsorbed;
  const sourceId = ensureCatalystSource(state, tower);
  const application = commit(state, enemy, catalyst.sources[sourceId]!, packet, context);
  const afterShield = Math.max(0, requested - (state.stats.fieldDamageAbsorbed - shieldBefore));
  const account = (catalyst.damageByDevice[sourceId] ??= {
    raw: 0,
    actual: 0,
    mitigation: 0,
    overkill: 0,
    kills: 0,
  });
  account.raw += consumed * device.damagePerCharge;
  account.actual += application.amount;
  account.mitigation += Math.max(0, consumed * device.damagePerCharge - afterShield);
  account.overkill += Math.max(0, afterShield - application.healthBefore);
  if (application.killed) account.kills += 1;
  tower.damageDealt += application.amount;
  tower.kills += Number(application.killed);
  tower.telemetry.overkillDamage += Math.max(0, afterShield - application.healthBefore);
  tower.telemetry.targetsServiced += 1;
  return {
    enemyId: enemy.id,
    position: enemyWorldPosition(enemy),
    consumed,
    contributions,
    damage: application.amount,
  };
};

const pulse = (
  state: EncounterState,
  tower: EncounterTower,
  preview: DischargePreview,
  context: EncounterContext,
  commit: CommitDischargeDamage
): void => {
  const catalyst = state.catalyst!;
  const mechanics = context.combat.mechanics;
  if (mechanics.kind !== "catalyst") return;
  const device = mechanics.devices[tower.chassisId];
  const status = catalyst.devices[tower.id];
  if (device?.kind !== "discharge" || status?.kind !== "discharge") return;
  const record: CatalystPulse = {
    id: catalyst.nextPulseId++,
    sourceId: tower.id,
    elapsed: state.elapsed,
    origin: { ...tower.placement.firingOrigin },
    targets: [],
  };
  for (const enemyId of preview.chainEnemyIds) {
    const enemy = state.enemies.find((candidate) => candidate.id === enemyId);
    if (enemy && enemy.health > 0)
      record.targets.push(dischargeTarget(state, enemy, tower, device, record.id, context, commit));
  }
  status.readyAt = state.elapsed + device.cooldownSeconds;
  tower.shots += 1;
  catalyst.pulses.push(record);
  if (catalyst.pulses.length > 64) catalyst.pulses.splice(0, catalyst.pulses.length - 64);
};

const readyCandidates = (state: EncounterState, context: EncounterContext) =>
  Object.values(state.towers)
    .flatMap((tower) => {
      const preview = previewDischarge(state, tower.id, context);
      const status = state.catalyst?.devices[tower.id];
      const seed = state.enemies.find((enemy) => enemy.id === preview?.seedEnemyId);
      return preview?.waitingReason === "ready" && status?.kind === "discharge" && seed
        ? [
            {
              tower,
              preview,
              readyAt: status.readyAt,
              remaining: enemyRouteDistance(seed).remaining,
              distance: towerDistance(tower, seed),
            },
          ]
        : [];
    })
    .sort(
      (left, right) =>
        left.readyAt - right.readyAt ||
        left.remaining - right.remaining ||
        left.distance - right.distance ||
        left.tower.id.localeCompare(right.tower.id)
    );

export const resolveCatalystDischarges = (
  state: EncounterState,
  context: EncounterContext,
  commit: CommitDischargeDamage
): void => {
  if (!state.catalyst || context.combat.mechanics.kind !== "catalyst") return;
  for (let count = 0; count < Object.keys(state.catalyst.devices).length; count += 1) {
    const candidate = readyCandidates(state, context)[0];
    if (!candidate) break;
    pulse(state, candidate.tower, candidate.preview, context, commit);
  }
};
