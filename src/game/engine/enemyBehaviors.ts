import type { EncounterContext, EncounterState } from "../encounter/types";
import { enemyDefinition } from "../encounter/catalogs";
import { configuredProcess } from "../encounter/processContext";
import type { EnemyBehaviorState, EnemyDefinition, EnemyState } from "../types";
import { enemyRoomId } from "./enemyPosition";
import { enemyBehaviorDurabilityScale } from "./enemyLevel";
import { addEncounterEvent as addEvent } from "../encounter/events";

export const initialEnemyBehaviorState = (
  definition: EnemyDefinition,
  level: number
): EnemyBehaviorState => {
  const durabilityScale = enemyBehaviorDurabilityScale(level);
  switch (definition.behavior.kind) {
    case "standard":
      return { kind: "standard" };
    case "ladder_runner":
      return { kind: "ladder_runner" };
    case "armored_molt":
      return {
        kind: "armored_molt",
        phase: "armored",
        transitionHealth: (definition.health - definition.behavior.shellHealth) * durabilityScale,
      };
    case "shared_field": {
      const maximumCharge = definition.behavior.capacity * durabilityScale;
      return {
        kind: "shared_field",
        charge: maximumCharge,
        maximumCharge,
        active: true,
      };
    }
    case "gas_emitter":
      return {
        kind: "gas_emitter",
        reservoir: definition.behavior.reservoir,
        initialReservoir: definition.behavior.reservoir,
      };
  }
};

const rechargeSharedField = (enemy: EnemyState, definition: EnemyDefinition, dt: number): void => {
  if (enemy.behavior.kind !== "shared_field" || definition.behavior.kind !== "shared_field") return;
  const scaledRecharge =
    definition.behavior.rechargePerSecond * enemyBehaviorDurabilityScale(enemy.level);
  enemy.behavior.charge = Math.min(
    enemy.behavior.maximumCharge,
    enemy.behavior.charge + scaledRecharge * dt
  );
  if (enemy.behavior.active) {
    enemy.behavior.active = enemy.behavior.charge > 0.001;
    return;
  }
  enemy.behavior.active =
    enemy.behavior.charge >= enemy.behavior.maximumCharge * definition.behavior.activationFraction;
};

const recordProtectedPresence = (state: EncounterState, enemy: EnemyState, dt: number): void => {
  if (enemy.behavior.kind !== "shared_field" || !enemy.behavior.active) return;
  const roomId = enemyRoomId(enemy, state.map);
  if (!roomId) return;
  const protectedAllies = state.enemies.filter(
    (candidate) => candidate.id !== enemy.id && enemyRoomId(candidate, state.map) === roomId
  ).length;
  state.stats.protectedAllySeconds += protectedAllies * dt;
};

/** Advances enemy-owned resources before chemistry so emitted gas can react in the same frame. */
export const simulateEnemyBehaviors = (
  state: EncounterState,
  dt: number,
  gameDefinition: EncounterContext
): void => {
  for (const enemy of state.enemies) {
    const definition = enemyDefinition(gameDefinition.combat, enemy.type);
    rechargeSharedField(enemy, definition, dt);
    recordProtectedPresence(state, enemy, dt);
    const process = configuredProcess(state, gameDefinition);
    process?.bridge.emitEnemy(process.state, enemy, dt, process.context);
  }
};

export const transitionArmoredMolt = (
  state: EncounterState,
  enemy: EnemyState,
  roomId: string | null,
  killed: boolean
): void => {
  if (
    enemy.behavior.kind !== "armored_molt" ||
    enemy.behavior.phase !== "armored" ||
    enemy.health > enemy.behavior.transitionHealth + 0.001 ||
    killed
  ) {
    return;
  }
  enemy.behavior.phase = "exposed";
  state.stats.armorTransitions += 1;
  addEvent(
    state,
    "warning",
    "enemy_molted",
    { enemyType: enemy.type, remainingHealth: Math.round(enemy.health) },
    roomId
  );
};
