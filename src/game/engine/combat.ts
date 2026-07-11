import { ENEMY_DEFINITIONS, ROOM_DEFINITIONS, WAVES } from "../config";
import type { EnemyState, GameState, RoomId, RoomState } from "../types";
import { addEvent } from "./events";
import { clamp } from "./math";
import { gasPercent, liquidStrength } from "./roomState";

export const enemyRoomId = (enemy: EnemyState): RoomId =>
  enemy.route[Math.min(enemy.segment, enemy.route.length - 1)] as RoomId;

const enemyDamagePerSecond = (room: RoomState, enemy: EnemyState): number => {
  const definition = ENEMY_DEFINITIONS[enemy.type];
  const toxic = gasPercent(room, "toxic_gas");
  const oxygen = gasPercent(room, "oxygen");
  const co2 = gasPercent(room, "co2");
  const steam = gasPercent(room, "steam");
  let damage = Math.max(0, toxic - 0.17) * 34 * definition.toxicMultiplier;
  if (definition.needsOxygen) {
    damage += Math.max(0, 0.34 - oxygen) * 34;
    damage += Math.max(0, co2 - 0.46) * 22;
  }
  if (!definition.flying) {
    damage += Math.max(0, liquidStrength(room, "acid") - 7) * 0.66 * definition.acidMultiplier;
    damage +=
      Math.max(0, liquidStrength(room, "caustic") - 7) * 0.58 * definition.causticMultiplier;
  }
  damage += Math.max(0, steam - 0.13) * 25 * definition.heatMultiplier;
  damage += Math.max(0, room.temperature - 48) * 0.18 * definition.heatMultiplier;
  if (room.flashTimer > 0) damage += room.flashIntensity * 54 * definition.heatMultiplier;
  return damage;
};

const enemySpeedMultiplier = (room: RoomState, enemy: EnemyState): number => {
  const definition = ENEMY_DEFINITIONS[enemy.type];
  let multiplier = room.sealTimer > 0 ? 0.38 : 1;
  if (!definition.flying) {
    multiplier *= 1 - clamp(liquidStrength(room, "sludge") / 80, 0, 0.65);
  }
  return multiplier;
};

export const spawnEnemies = (state: GameState): void => {
  const wave = WAVES[state.cycle] ?? [];
  while (state.spawnCursor < wave.length) {
    const entry = wave[state.spawnCursor];
    if (!entry || entry.at > state.phaseTime) break;
    const definition = ENEMY_DEFINITIONS[entry.type];
    state.enemies.push({
      id: state.nextEnemyId,
      type: entry.type,
      health: definition.health,
      maxHealth: definition.health,
      route: [...entry.route],
      segment: 0,
      progress: 0,
      spawnAge: 0,
      damageTaken: 0,
      disrupted: false,
    });
    state.nextEnemyId += 1;
    state.spawnCursor += 1;
    state.stats.spawned += 1;
  }
};

const disruptAtmosphere = (
  state: GameState,
  enemy: EnemyState,
  roomId: RoomId,
  dt: number
): void => {
  const room = state.rooms[roomId];
  if (enemy.type !== "bellows" || room.gas.toxic_gas <= 0.5) return;
  const consumed = Math.min(room.gas.toxic_gas, 5.2 * dt);
  room.gas.toxic_gas -= consumed;
  room.gas.co2 += consumed * 0.92;
  if (enemy.disrupted || consumed <= 0) return;
  enemy.disrupted = true;
  addEvent(
    state,
    "danger",
    "Bellows disrupting atmosphere",
    `${ROOM_DEFINITIONS[roomId].name} is losing toxic gas and gaining CO₂.`,
    roomId
  );
};

const applyDamage = (state: GameState, enemy: EnemyState, room: RoomState, dt: number): void => {
  const damage = Math.min(enemy.health, enemyDamagePerSecond(room, enemy) * dt);
  enemy.health -= damage;
  enemy.damageTaken += damage;
  state.stats.damageDealt += damage;
};

const neutralizeEnemy = (state: GameState, enemy: EnemyState, roomId: RoomId): void => {
  const definition = ENEMY_DEFINITIONS[enemy.type];
  const room = state.rooms[roomId];
  state.stats.killed += 1;
  room.residue = clamp(room.residue + definition.residueOnDeath, 0, 100);
  addEvent(
    state,
    "good",
    `${definition.name} neutralized`,
    `Environmental exposure dealt ${Math.round(enemy.damageTaken)} damage in ${ROOM_DEFINITIONS[roomId].name}.`,
    roomId
  );
};

const moveEnemy = (enemy: EnemyState, room: RoomState, dt: number): boolean => {
  const definition = ENEMY_DEFINITIONS[enemy.type];
  enemy.progress += definition.speed * enemySpeedMultiplier(room, enemy) * dt;
  while (enemy.progress >= 1) {
    enemy.progress -= 1;
    enemy.segment += 1;
    if (enemy.segment >= enemy.route.length - 1) break;
  }
  return enemy.segment >= enemy.route.length - 1;
};

const breachCore = (state: GameState, enemy: EnemyState): void => {
  const definition = ENEMY_DEFINITIONS[enemy.type];
  state.coreIntegrity = Math.max(0, state.coreIntegrity - definition.coreDamage);
  state.stats.breached += 1;
  state.stats.coreDamage += definition.coreDamage;
  addEvent(
    state,
    "danger",
    "Core breach",
    `${definition.name} dealt ${definition.coreDamage} persistent core damage.`,
    "core"
  );
};

type EnemyResolution = "alive" | "neutralized" | "breached";

const simulateEnemy = (state: GameState, enemy: EnemyState, dt: number): EnemyResolution => {
  const roomId = enemyRoomId(enemy);
  const room = state.rooms[roomId];
  enemy.spawnAge += dt;
  disruptAtmosphere(state, enemy, roomId, dt);
  applyDamage(state, enemy, room, dt);
  if (enemy.health <= 0.001) {
    neutralizeEnemy(state, enemy, roomId);
    return "neutralized";
  }
  if (moveEnemy(enemy, room, dt)) {
    breachCore(state, enemy);
    return "breached";
  }
  return "alive";
};

export const simulateEnemies = (state: GameState, dt: number): void => {
  const survivors: EnemyState[] = [];
  for (const enemy of state.enemies) {
    if (simulateEnemy(state, enemy, dt) === "alive") survivors.push(enemy);
  }
  state.enemies = survivors;
};

export const enemyWorldPosition = (enemy: EnemyState): { x: number; y: number } => {
  const fromId = enemy.route[Math.min(enemy.segment, enemy.route.length - 1)] as RoomId;
  const toId = enemy.route[Math.min(enemy.segment + 1, enemy.route.length - 1)] as RoomId;
  const from = ROOM_DEFINITIONS[fromId].position;
  const to = ROOM_DEFINITIONS[toId].position;
  return {
    x: from.x + (to.x - from.x) * enemy.progress,
    y: from.y + (to.y - from.y) * enemy.progress,
  };
};
