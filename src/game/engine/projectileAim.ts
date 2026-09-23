import { enemyDefinition } from "../encounter/catalogs";
import type { EncounterContext, EncounterState } from "../encounter/types";
import type { EnemyState, WorldPoint } from "../types";
import { gridCellToWorldPoint } from "../spatial";
import { enemyRoomId, enemyWorldPosition } from "./enemyPosition";
import { configuredProcess } from "../encounter/processContext";
import { projectCatalystMovement } from "../encounter/catalystFields";
import type { CatalystFieldSample } from "../encounter/catalystTypes";
import {
  ENEMY_WORLD_SPEED_SCALE,
  enemyBehaviorSpeedMultiplier,
  LOCOMOTION_SPEED,
} from "./enemyMovementRules";
import { environmentalEnemyMovementMultiplier } from "./environmentalFields";

const movementScale = (
  state: EncounterState,
  enemy: EnemyState,
  context: EncounterContext
): number => {
  const slow = enemy.effects
    .filter((effect) => effect.kind === "slow")
    .reduce((amount, effect) => Math.max(amount, effect.magnitude), 0);
  const process = configuredProcess(state, context);
  const room = enemyRoomId(enemy, state.map);
  const roomMultiplier =
    process && room
      ? process.bridge.movementMultiplier(process.state, enemy, room, process.context)
      : 1;
  return (
    roomMultiplier *
    (enemy.effects.some((effect) => effect.kind === "stun") ? 0 : Math.max(0, 1 - slow)) *
    environmentalEnemyMovementMultiplier(state, enemy)
  );
};

interface PredictionContext {
  context: EncounterContext;
  fieldSample: CatalystFieldSample;
  playerMultiplier: number;
}

/** Prediction follows the route available at launch; it never changes the enemy or the launched aim. */
const predictedPosition = (
  enemy: EnemyState,
  seconds: number,
  speed: number,
  prediction: PredictionContext
): WorldPoint => {
  let position = enemyWorldPosition(enemy);
  let remaining = seconds;
  const definition = enemyDefinition(prediction.context.combat, enemy.type);
  for (let index = enemy.pathIndex + 1; index < enemy.path.length; index += 1) {
    const step = enemy.path[index]!;
    const target = gridCellToWorldPoint(step.cell);
    const length = Math.hypot(target.x - position.x, target.elevation - position.elevation);
    const mechanics = prediction.context.combat.mechanics;
    const multiplier =
      mechanics.kind === "catalyst"
        ? projectCatalystMovement(
            prediction.fieldSample,
            enemy.id,
            position,
            target,
            prediction.playerMultiplier,
            mechanics.rules
          )
        : prediction.playerMultiplier;
    const modeSpeed =
      speed *
      multiplier *
      LOCOMOTION_SPEED[step.mode] *
      enemyBehaviorSpeedMultiplier({ ...enemy, mode: step.mode }, definition);
    const travel = remaining * modeSpeed;
    if (travel < length)
      return {
        x: position.x + ((target.x - position.x) * travel) / length,
        elevation: position.elevation + ((target.elevation - position.elevation) * travel) / length,
      };
    remaining -= length / modeSpeed;
    position = target;
  }
  return position;
};

export const leadProjectileTarget = (
  state: EncounterState,
  enemy: EnemyState,
  origin: WorldPoint,
  projectileSpeed: number,
  context: EncounterContext,
  fieldSample: CatalystFieldSample = { byEnemy: {}, servicedByDevice: {} }
): WorldPoint => {
  const speed = enemyDefinition(context.combat, enemy.type).speed * ENEMY_WORLD_SPEED_SCALE;
  const prediction = {
    context,
    fieldSample,
    playerMultiplier: movementScale(state, enemy, context),
  };
  if (speed <= 0 || projectileSpeed <= 0) return { ...enemyWorldPosition(enemy) };
  let low = 0;
  let high = Math.hypot(state.map.width, state.map.height) / projectileSpeed;
  for (let iteration = 0; iteration < 40; iteration += 1) {
    const time = (low + high) / 2;
    const target = predictedPosition(enemy, time, speed, prediction);
    if (
      Math.hypot(target.x - origin.x, target.elevation - origin.elevation) >
      time * projectileSpeed
    )
      low = time;
    else high = time;
  }
  return predictedPosition(enemy, high, speed, prediction);
};
