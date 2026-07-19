import type { GameDefinition } from "../definitionTypes";
import type {
  EquipmentId,
  GameState,
  ScenarioAvailability,
  SiteSupplyDefinition,
  TransportPhase,
  ConnectionId,
} from "../types";

export const levelDefinitionFor = (state: GameState, definition: GameDefinition) =>
  definition.levels[state.campaign.levelId];

export const roundDefinitionFor = (state: GameState, definition: GameDefinition) => {
  const round = definition.levels[state.campaign.levelId].rounds[state.campaign.roundIndex];
  if (!round) throw new Error(`Invalid round index ${state.campaign.roundIndex}`);
  return round;
};

export const nextLevelIdFor = (
  levelId: GameState["campaign"]["levelId"],
  definition: GameDefinition
) => {
  const index = definition.levelOrder.indexOf(levelId);
  return definition.levelOrder[index + 1] ?? null;
};

export const copyAvailability = (source: ScenarioAvailability): ScenarioAvailability => ({
  equipment: [...source.equipment],
  gasLines: [...source.gasLines],
  liquidLines: [...source.liquidLines],
});

export const equipmentAvailable = (state: GameState, equipmentId: EquipmentId): boolean =>
  state.availability.equipment.includes(equipmentId);

export const transportPhaseAvailable = (
  state: GameState,
  runId: ConnectionId,
  phase: TransportPhase
): boolean =>
  phase === "gas"
    ? state.availability.gasLines.includes(runId)
    : state.availability.liquidLines.includes(runId);

export const connectionAvailable = (state: GameState, connectionId: ConnectionId): boolean =>
  state.availability.gasLines.includes(connectionId) ||
  state.availability.liquidLines.includes(connectionId) ||
  (state.map.connections[connectionId]?.rooms.every(
    (roomId) => state.map.rooms[roomId]?.provenance === "hull"
  ) ??
    false);

export const supplyDefinitionsFor = (
  state: GameState,
  definition: GameDefinition
): readonly SiteSupplyDefinition[] => levelDefinitionFor(state, definition).supplies;

export const supplyDefinitionFor = (
  state: GameState,
  sourceId: string,
  definition: GameDefinition
): SiteSupplyDefinition | null =>
  supplyDefinitionsFor(state, definition).find((supply) => supply.id === sourceId) ?? null;

export const supplyAvailable = (
  state: GameState,
  sourceId: string,
  definition: GameDefinition
): boolean => {
  const level = levelDefinitionFor(state, definition);
  const supply = level.supplies.find((candidate) => candidate.id === sourceId);
  if (!supply) return false;
  const availableIndex = level.rounds.findIndex((round) => round.id === supply.availableFromRound);
  return availableIndex >= 0 && state.campaign.roundIndex >= availableIndex;
};
