import { LEVEL_DEFINITIONS } from "./content/campaign";
import { REACTION_DEFINITIONS } from "./content/chemistry";
import { ENEMY_DEFINITIONS } from "./content/enemies";
import { EQUIPMENT_DEFINITIONS } from "./content/equipment";
import { WORLD_MAP } from "./content/worldMap";
import { LINE_SPECS } from "./content/lineSpecs";
import { MODULE_TEMPLATES } from "./content/modules";
import { ENVIRONMENT_HAZARD_RULES } from "./content/hazards";
import { GAS_BUFFERS, GAS_SOURCES, LIQUID_BUFFERS, LIQUID_SOURCES } from "./content/supplies";
import { PROCESS_DEFINITIONS } from "./content/processes";
import { ambientGas, SPECIES_DEFINITIONS } from "./content/substances";
import { compileGamePack } from "./authoring/compiler";
import type { GameDefinition, GameDefinitionSource } from "./definitionTypes";
import { LEVEL_IDS } from "./identifiers";

export type {
  EnvironmentHazardRules,
  FacilityLoadout,
  FacilityModel,
  GameDefinition,
  GameDefinitionSource,
  GasConduitLoadout,
  LevelDefinition,
  LiquidConduitLoadout,
  RoundDefinition,
} from "./definitionTypes";

export const defineGame = (source: GameDefinitionSource): GameDefinition => compileGamePack(source);

export const deriveGame = (
  base: GameDefinition,
  overrides: Partial<GameDefinitionSource>
): GameDefinition => {
  const source: GameDefinitionSource = {
    id: base.id,
    packId: base.packId,
    contentVersion: base.contentVersion,
    map: base.map,
    lineSpecs: base.lineSpecs,
    modules: base.modules,
    levelOrder: base.levelOrder,
    species: base.species,
    reactions: base.reactions,
    equipment: base.equipment,
    processes: base.processes,
    enemies: base.enemies,
    levels: base.levels,
    gasSources: base.gasSources,
    liquidSources: base.liquidSources,
    gasBuffers: base.gasBuffers,
    liquidBuffers: base.liquidBuffers,
    ambientGas: base.ambientGas,
    environmentHazards: base.environmentHazards,
    ...overrides,
  };
  return defineGame(source);
};

export const DEFAULT_GAME_DEFINITION = defineGame({
  id: "catalyst-castellum",
  packId: "catalyst-castellum",
  contentVersion: 7,
  map: WORLD_MAP,
  lineSpecs: LINE_SPECS,
  modules: MODULE_TEMPLATES,
  levelOrder: LEVEL_IDS,
  species: SPECIES_DEFINITIONS,
  reactions: REACTION_DEFINITIONS,
  equipment: EQUIPMENT_DEFINITIONS,
  processes: PROCESS_DEFINITIONS,
  enemies: ENEMY_DEFINITIONS,
  levels: LEVEL_DEFINITIONS,
  gasSources: GAS_SOURCES,
  liquidSources: LIQUID_SOURCES,
  gasBuffers: GAS_BUFFERS,
  liquidBuffers: LIQUID_BUFFERS,
  ambientGas: ambientGas(),
  environmentHazards: ENVIRONMENT_HAZARD_RULES,
});
