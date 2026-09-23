import { towerDefinition } from "../encounter/catalogs";
import { ensureCatalystSource } from "../encounter/catalystCharge";
import type { AttackSourceSnapshot } from "../encounter/projectileTypes";
import type { EncounterContext, EncounterState, EncounterTower } from "../encounter/types";
import type { EnemyState } from "../types";
import type { DamagePacket } from "./damage";
import { enemyWorldPosition } from "./enemyPosition";
import { resolvePhysicalHits } from "./towerImpact";
import { hasCombatLineOfSight } from "../encounter/projectiles";
import { effectiveTowerStats } from "./towerStats";
import type {
  InductionDeviceDefinition,
  CatalystFieldSample,
  CatalystDeviceDefinition,
} from "../encounter/catalystTypes";
import type { TowerDefinition, WorldPoint } from "../types";
import { leadProjectileTarget } from "./projectileAim";

const weaponDevice = (
  device: CatalystDeviceDefinition | undefined
): InductionDeviceDefinition | undefined => (device?.kind === "weapon" ? device : undefined);

const enqueueProjectile = (
  state: EncounterState,
  source: AttackSourceSnapshot,
  target: WorldPoint,
  chassis: TowerDefinition,
  device: InductionDeviceDefinition | undefined
): void => {
  const speed = chassis.attack.projectileSpeed;
  if (!Number.isFinite(speed) || speed <= 0)
    throw new Error("Physical attacks require a positive finite speed.");
  state.pendingAttacks.push({
    id: state.nextTowerAttackId++,
    strategy: chassis.attack.strategy === "lob" ? "lobbed" : "projectile",
    source,
    target,
    speed,
    lobHeight: chassis.attack.strategy === "lob" ? (device?.lobHeight ?? 2) : 0,
    collisionRadius: device?.projectileRadius ?? 0.15,
    age: 0,
    travelSeconds: Math.max(
      0.001,
      Math.hypot(target.x - source.origin.x, target.elevation - source.origin.elevation) / speed
    ),
    position: { ...source.origin },
  });
};

export const firePhysicalTower = (
  state: EncounterState,
  tower: EncounterTower,
  primary: readonly EnemyState[],
  targets: readonly EnemyState[],
  packets: DamagePacket[],
  context: EncounterContext,
  fieldSample: CatalystFieldSample = { byEnemy: {}, servicedByDevice: {} }
): void => {
  const chassis = towerDefinition(context.combat, tower.chassisId);
  const mechanics = context.combat.mechanics;
  if (mechanics.kind !== "catalyst" || !primary[0]) return;
  const device = weaponDevice(mechanics.devices[tower.chassisId]);
  const sourceId = ensureCatalystSource(state, tower);
  const source: AttackSourceSnapshot = {
    sourceId,
    towerId: tower.id,
    chassisId: tower.chassisId,
    color: chassis.color,
    origin: { ...tower.placement.firingOrigin },
    packets: structuredClone(packets),
    controlEffects: structuredClone([...chassis.attack.controlEffects]),
    chargePerHit: device?.chargePerHit ?? 0,
    eligibleLayers: [...chassis.eligibleLayers],
    radius: chassis.attack.radius,
    targetCap: effectiveTowerStats(tower, context.combat, state).targetCap,
  };
  const target =
    chassis.attack.strategy === "projectile"
      ? leadProjectileTarget(
          state,
          primary[0],
          source.origin,
          chassis.attack.projectileSpeed,
          context,
          fieldSample
        )
      : { ...enemyWorldPosition(primary[0]) };
  tower.shots += 1;
  tower.currentTargetIds = primary.map((enemy) => enemy.id);
  tower.downtimeReason = "none";
  state.catalyst!.directBySource[sourceId]!.shots += 1;
  if (chassis.attack.strategy === "projectile" || chassis.attack.strategy === "lob") {
    enqueueProjectile(state, source, target, chassis, device);
  } else
    resolvePhysicalHits(
      state,
      source,
      targets.filter((enemy) =>
        hasCombatLineOfSight(state.map, source.origin, enemyWorldPosition(enemy))
      ),
      target,
      chassis.attack.strategy,
      context
    );
};
