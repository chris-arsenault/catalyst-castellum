import { emptyGas, emptyLiquid } from "../materials";
import type { GameDefinition } from "../definitionTypes";
import { addEvent } from "../engine/events";
import { findEnemyPath } from "../engine/navigation";
import { createScenarioGame } from "../engine/scenarioState";
import { type GameState, type GasAmounts, type LiquidAmounts, type ConnectionId } from "../types";
import type {
  LegacyV10Game,
  LegacyV7Game,
  LegacyV8Enemy,
  LegacyV8Game,
  LegacyV9Game,
} from "./saveCodec";
import { gasConduitState, liquidConduitState, processLineIds } from "../world/instances";

export const LEGACY_GAS_LINE_IDS = [
  "gas_oxygen_to_furnace",
  "gas_anode_to_furnace",
  "gas_cathode_to_furnace",
  "gas_cathode_relief",
  "gas_anode_to_absorber",
  "gas_acid_return",
  "gas_final_header",
  "gas_outer_bleed",
  "gas_furnace_exhaust",
  "gas_final_exhaust",
] as const;

export const LEGACY_LIQUID_LINE_IDS = [
  "liquid_water_to_cell",
  "liquid_salt_to_cell",
  "liquid_liquor_to_absorber",
  "liquid_liquor_recovery",
  "liquid_water_to_final",
  "liquid_hypochlorite_to_final",
  "liquid_absorber_recycle",
  "liquid_cell_drain",
  "liquid_absorber_drain",
  "liquid_final_drain",
] as const;

/** Legacy saves keyed transport runs by pair name; canonical line ids map back to them. */
const LEGACY_RUN_IDS: Record<ConnectionId, string> = {
  "gas:core__furnace": "core_furnace",
  "gas:core__switchyard": "core_switchyard",
  "gas:core__reservoir": "core_reservoir",
  "gas:core__gallery": "core_gallery",
  "gas:furnace__lower_intake": "cell_furnace",
  "gas:core__lower_intake": "core_cell",
  "gas:lower_intake__reservoir": "cell_absorber",
  "gas:furnace__gallery": "furnace_return",
  "gas:gallery__washlock": "return_final",
  "gas:gallery__switchyard": "return_outer",
  "gas:core__washlock": "core_final",
  "liquid:core__lower_intake": "core_cell",
  "liquid:lower_intake__reservoir": "cell_absorber",
  "liquid:core__washlock": "core_final",
  "liquid:reservoir__washlock": "absorber_final",
  "liquid:core__reservoir": "core_absorber",
};

const GAS_LINE_MIGRATION: Record<ConnectionId, readonly (typeof LEGACY_GAS_LINE_IDS)[number][]> = {
  "gas:core__furnace": ["gas_oxygen_to_furnace", "gas_furnace_exhaust"],
  "gas:core__switchyard": [],
  "gas:core__reservoir": [],
  "gas:core__gallery": [],
  "gas:furnace__lower_intake": ["gas_anode_to_furnace", "gas_cathode_to_furnace"],
  "gas:core__lower_intake": ["gas_cathode_relief"],
  "gas:lower_intake__reservoir": ["gas_anode_to_absorber"],
  "gas:furnace__gallery": ["gas_acid_return"],
  "gas:gallery__washlock": ["gas_final_header"],
  "gas:gallery__switchyard": ["gas_outer_bleed"],
  "gas:core__washlock": ["gas_final_exhaust"],
};

const LIQUID_LINE_MIGRATION: Record<
  ConnectionId,
  readonly (typeof LEGACY_LIQUID_LINE_IDS)[number][]
> = {
  "liquid:core__lower_intake": [
    "liquid_water_to_cell",
    "liquid_salt_to_cell",
    "liquid_liquor_recovery",
    "liquid_cell_drain",
  ],
  "liquid:lower_intake__reservoir": ["liquid_liquor_to_absorber", "liquid_absorber_recycle"],
  "liquid:core__washlock": ["liquid_water_to_final", "liquid_final_drain"],
  "liquid:reservoir__washlock": ["liquid_hypochlorite_to_final"],
  "liquid:core__reservoir": ["liquid_absorber_drain"],
};

const addGas = (target: GasAmounts, addition: GasAmounts): void => {
  for (const species of Object.keys(target) as (keyof GasAmounts)[])
    target[species] += addition[species];
};

const addLiquid = (target: LiquidAmounts, addition: LiquidAmounts): void => {
  for (const species of Object.keys(target) as (keyof LiquidAmounts)[])
    target[species] += addition[species];
};

const gasTotal = (gas: GasAmounts): number =>
  Object.values(gas).reduce((sum, value) => sum + value, 0);

const gasLinesForMigration = (
  levelId: GameState["campaign"]["levelId"],
  connectionId: ConnectionId
): readonly (typeof LEGACY_GAS_LINE_IDS)[number][] => {
  if (levelId !== "flash_point") return GAS_LINE_MIGRATION[connectionId] ?? [];
  if (connectionId === "gas:core__furnace") {
    return [...(GAS_LINE_MIGRATION["gas:core__furnace"] ?? []), "gas_cathode_to_furnace"];
  }
  if (connectionId === "gas:furnace__lower_intake") return ["gas_anode_to_furnace"];
  return GAS_LINE_MIGRATION[connectionId] ?? [];
};

const migrateV7LiquidConduits = (
  state: GameState,
  legacy: LegacyV7Game,
  definition: GameDefinition
): void => {
  for (const connectionId of processLineIds(definition, "liquid_line")) {
    const legacyRun = legacy.transportRuns[LEGACY_RUN_IDS[connectionId] ?? connectionId];
    const liquid = emptyLiquid();
    for (const lineId of LIQUID_LINE_MIGRATION[connectionId] ?? []) {
      addLiquid(liquid, legacy.liquidLines[lineId].liquid);
    }
    liquidConduitState(state, connectionId).liquid = liquid;
    liquidConduitState(state, connectionId).installed = Boolean(legacyRun?.liquidInstalled);
    liquidConduitState(state, connectionId).enabled = false;
  }
};

const migrateV7Conduits = (
  state: GameState,
  legacy: LegacyV7Game,
  definition: GameDefinition
): void => {
  const levelId = legacy.campaign.levelId;
  for (const connectionId of processLineIds(definition, "gas_line")) {
    const legacyRun = legacy.transportRuns[LEGACY_RUN_IDS[connectionId] ?? connectionId];
    const gas = emptyGas();
    let temperatureMass = 0;
    let temperatureAmount = 0;
    for (const lineId of gasLinesForMigration(levelId, connectionId)) {
      const line = legacy.gasLines[lineId];
      addGas(gas, line.gas);
      const amount = gasTotal(line.gas);
      temperatureMass += line.temperature * amount;
      temperatureAmount += amount;
    }
    gasConduitState(state, connectionId).gas = gas;
    gasConduitState(state, connectionId).temperature =
      temperatureAmount > 0 ? temperatureMass / temperatureAmount : 22;
    gasConduitState(state, connectionId).installed = Boolean(legacyRun?.gasInstalled);
    gasConduitState(state, connectionId).enabled = false;
  }
  migrateV7LiquidConduits(state, legacy, definition);
};

export const migrateV7Game = (legacy: LegacyV7Game, definition: GameDefinition): GameState => {
  const levelId = legacy.campaign.levelId;
  const state = createScenarioGame(levelId, legacy.campaign.completedLevelIds, definition);
  state.phase = "build";
  state.campaign.roundIndex = Math.min(
    legacy.campaign.roundIndex,
    definition.levels[levelId].rounds.length - 1
  );
  const round = definition.levels[levelId].rounds[state.campaign.roundIndex]!;
  state.availability = {
    equipment: [...round.availability.equipment],
    gasLines: [...round.availability.gasLines],
    liquidLines: [...round.availability.liquidLines],
    gasSources: [...round.availability.gasSources],
    liquidSources: [...round.availability.liquidSources],
  };
  state.rooms = legacy.rooms;
  state.gasBuffers = legacy.gasBuffers;
  state.liquidBuffers = legacy.liquidBuffers;
  state.liquidSources = legacy.liquidSources;
  state.processes = legacy.processes;
  state.gasVent = legacy.gasVent;
  state.liquidDrain = legacy.liquidDrain;
  state.coreIntegrity = legacy.coreIntegrity;
  state.matter = legacy.matter;
  state.pendingMatter = legacy.pendingMatter;

  const legacyOxygen = legacy.gasSources.oxygen_tank?.gas ?? emptyGas();
  state.gasSources.starter_gas_header.gas = { ...legacyOxygen };
  if (levelId === "flash_point") {
    addGas(state.gasSources.starter_gas_header.gas, state.gasBuffers.cathode_header.gas);
    state.gasBuffers.cathode_header.gas = emptyGas();
  }

  migrateV7Conduits(state, legacy, definition);
  addEvent(state, "warning", "physical_conduit_migrated");
  return state;
};

const migrateV8Enemy = (
  legacy: LegacyV8Enemy,
  portalStates: GameState["portalStates"],
  gameDefinition: GameDefinition
): GameState["enemies"][number] => {
  const definition = gameDefinition.enemies[legacy.type];
  const path = findEnemyPath({ flying: definition.flying, portalStates }, gameDefinition);
  if (path.length === 0)
    throw new Error(`Cannot migrate ${legacy.type}: Core route is unavailable.`);
  const oldSegments = Math.max(1, legacy.route.length - 1);
  const oldFraction = Math.min(1, (legacy.segment + legacy.progress) / oldSegments);
  const exactIndex = oldFraction * Math.max(1, path.length - 1);
  const pathIndex = Math.min(path.length - 1, Math.floor(exactIndex));
  const progress = pathIndex >= path.length - 1 ? 0 : exactIndex - pathIndex;
  const next = path[Math.min(pathIndex + 1, path.length - 1)] ?? path[pathIndex]!;
  const current = path[pathIndex] ?? path[0]!;
  const facing = next.cell.column < current.cell.column ? -1 : 1;
  return {
    id: legacy.id,
    type: legacy.type,
    health: legacy.health,
    maxHealth: legacy.maxHealth,
    routeId: "entry_to_core",
    path,
    pathIndex,
    progress,
    mode: next.mode,
    facing,
    spawnAge: legacy.spawnAge,
    damageTaken: legacy.damageTaken,
    damageBySource: legacy.damageBySource,
    lastDamage: legacy.lastDamage,
  };
};

export const migrateV8Game = (legacy: LegacyV8Game, definition: GameDefinition): LegacyV9Game => {
  const portalStates = definition.facility.initialPortalStates();
  const enemies = legacy.enemies.map((enemy) => migrateV8Enemy(enemy, portalStates, definition));
  return {
    ...legacy,
    version: 9,
    portalStates,
    enemies,
    nextEnemyId: Math.max(legacy.nextEnemyId, ...enemies.map(({ id }) => id + 1)),
  };
};

export const migrateV9Game = (legacy: LegacyV9Game): LegacyV10Game => ({
  ...legacy,
  version: 10,
  events: legacy.events.map(({ title, detail, ...event }) => ({
    ...event,
    code: "legacy_message",
    parameters: { title, detail },
  })),
});

export const migrateV10Game = (legacy: LegacyV10Game, definition: GameDefinition): GameState =>
  ({
    ...legacy,
    version: 12,
    pack: { id: definition.packId, contentVersion: definition.contentVersion },
  }) as GameState;
