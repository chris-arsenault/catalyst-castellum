import { ENEMY_DEFINITIONS, facilityCellDefinition } from "../game/config";
import { resolveEnemyCombat } from "../game/engine/combat";
import { emptyDamageLedger } from "../game/engine/damage";
import { simulateHydrogenOxygenFlash } from "../game/engine/flashReaction";
import { findEnemyPath } from "../game/engine/navigation";
import { cloneGame } from "../game/simulation";
import type { GameCommand, GameState } from "../game/types";

const E2E_QUERY_PARAMETER = "e2eTest";

export const e2eModeEnabled = (): boolean => {
  if (!import.meta.env.DEV || typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get(E2E_QUERY_PARAMETER) === "1";
};

const flashTutorialConfigured = (game: GameState): boolean =>
  game.campaign.levelId === "flash_point" &&
  game.campaign.roundIndex === 0 &&
  game.gasConduits.core_furnace.enabled &&
  Object.values(game.rooms.furnace.equipment).some(
    (instance) => instance?.equipmentId === "gas_agitator" && instance.enabled
  );

const seedFlashMixture = (game: GameState): void => {
  const source = game.gasSources.starter_gas_header.gas;
  const gas = game.rooms.furnace.gas.lower;
  const hydrogen = Math.min(12, source.hydrogen);
  const oxygen = Math.min(6, source.oxygen);
  source.hydrogen -= hydrogen;
  source.oxygen -= oxygen;
  gas.hydrogen += hydrogen;
  gas.oxygen += oxygen;
  game.rooms.furnace.flashCooldown.lower = 0;
};

const recordPrimeFlash = (source: GameState): GameState => {
  const game = cloneGame(source);
  seedFlashMixture(game);
  const burst = simulateHydrogenOxygenFlash(game, game.rooms.furnace, "lower", 0.1);
  if (burst) resolveEnemyCombat(game, 0, [burst]);
  return game;
};

const recordCombatFlash = (source: GameState): GameState => {
  const game = cloneGame(source);
  const definition = ENEMY_DEFINITIONS.crawler;
  const enemyId = game.nextEnemyId;
  game.nextEnemyId += 1;
  game.stats.spawned += 1;
  const path = findEnemyPath({ flying: false, portalStates: game.portalStates });
  const pathIndex = path.findIndex(
    (step) => facilityCellDefinition(step.cell).roomId === "furnace"
  );
  if (pathIndex < 0) throw new Error("Tutorial route does not cross the flash chamber.");
  game.enemies.push({
    id: enemyId,
    type: "crawler",
    health: definition.health,
    maxHealth: definition.health,
    routeId: "entry_to_core",
    path,
    pathIndex,
    progress: 0,
    mode: path[pathIndex]?.mode ?? "walking",
    facing: 1,
    spawnAge: 0,
    damageTaken: 0,
    damageBySource: emptyDamageLedger(),
    lastDamage: null,
  });
  seedFlashMixture(game);
  const burst = simulateHydrogenOxygenFlash(game, game.rooms.furnace, "lower", 0.1);
  if (burst) resolveEnemyCombat(game, 0, [burst]);
  return game;
};

export const applyE2ETutorialEvidence = (source: GameState, command: GameCommand): GameState => {
  if (!e2eModeEnabled() || !flashTutorialConfigured(source)) return source;
  if (command.type === "set_speed" && command.speed === 2 && source.phase === "prime") {
    return recordPrimeFlash(source);
  }
  if (command.type === "start_assault" && source.phase === "assault") {
    return recordCombatFlash(source);
  }
  return source;
};
