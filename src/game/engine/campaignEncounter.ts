import type { GameDefinition, LevelDefinition } from "../definitionTypes";
import type { GameState } from "../types";
import type { WorldMap } from "../world/map";
import type { CombatDefinition, EncounterDefinition } from "../encounter/types";
import type { ProcessDefinition, ProcessEncounterContext } from "../encounter/processTypes";
import { RETAINED_PROCESS_BRIDGE } from "../encounter/processBridge";
import { facilityModelForMap } from "../world/derivedModel";
import { resolveEnemyLevel } from "./enemyLevel";

export const combatDefinitionFor = (definition: GameDefinition): CombatDefinition => ({
  id: definition.packId,
  contentVersion: definition.contentVersion,
  towers: definition.towers,
  enemies: definition.enemies,
  tickSeconds: 0.1,
  mechanics: { kind: "legacy" },
});

const processDefinitionFor = (
  definition: GameDefinition,
  level: LevelDefinition,
  roundIndex: number
): ProcessDefinition => ({
  species: definition.species,
  reactions: definition.reactions,
  equipment: definition.equipment,
  ambientGas: definition.ambientGas,
  environmentHazards: definition.environmentHazards,
  lineBlueprints: definition.lineBlueprints,
  lineSpecs: definition.lineSpecs,
  supplies: level.supplies,
  availableSupplyIds: level.supplies
    .filter((supply) => {
      const index = level.rounds.findIndex((round) => round.id === supply.availableFromRound);
      return index >= 0 && index <= roundIndex;
    })
    .map((supply) => supply.id),
  loadout: level.loadout,
});

/** Preserve the old accumulated 0.1-second threshold when compiling campaign wave clocks. */
const campaignSpawnTicks = (wave: LevelDefinition["rounds"][number]["wave"]): number[] => {
  let tick = 0;
  let elapsed = 0;
  return wave.map((entry) => {
    while (elapsed < entry.at) {
      tick += 1;
      elapsed += 0.1;
    }
    return Math.max(1, tick);
  });
};

export const campaignEncounterDefinition = (
  definition: GameDefinition,
  level: LevelDefinition,
  roundIndex: number,
  map: WorldMap
): EncounterDefinition & { process: ProcessDefinition } => {
  const round = level.rounds[roundIndex];
  if (!round) throw new Error(`Missing campaign wave ${level.id}:${roundIndex}.`);
  const ticks = campaignSpawnTicks(round.wave);
  return {
    id: `${level.id}:${round.id}`,
    contentVersion: definition.contentVersion,
    instanceNamespace: level.id,
    map,
    wave: round.wave.map((entry, index) => ({
      tick: ticks[index]!,
      type: entry.type,
      routeId: entry.routeId,
      level: resolveEnemyLevel(level.enemyLevel, entry.levelOffset),
    })),
    availability: round.availability,
    maximumTicks: 1_000_000,
    startingMatter: level.startingMatter,
    startingCoreIntegrity: level.startingCoreIntegrity,
    initialTowers: {},
    initialPortalStates: facilityModelForMap(map).initialPortalStates(),
    process: processDefinitionFor(definition, level, roundIndex),
  };
};

export const campaignEncounterContext = (
  state: GameState,
  definition: GameDefinition
): ProcessEncounterContext => ({
  combat: combatDefinitionFor(definition),
  definition: campaignEncounterDefinition(
    definition,
    definition.levels[state.campaign.levelId],
    state.campaign.roundIndex,
    state.encounter.map
  ),
  process: RETAINED_PROCESS_BRIDGE,
});
