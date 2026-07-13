import { currentLevel, currentRound } from "../config";
import type {
  EquipmentId,
  GameState,
  GasSourceId,
  LiquidSourceId,
  ScenarioAvailability,
  TransportPhase,
  TransportRunId,
} from "../types";

export const levelDefinitionFor = (state: GameState) => currentLevel(state.campaign.levelId);

export const roundDefinitionFor = (state: GameState) =>
  currentRound(state.campaign.levelId, state.campaign.roundIndex);

export const copyAvailability = (source: ScenarioAvailability): ScenarioAvailability => ({
  equipment: [...source.equipment],
  gasRuns: [...source.gasRuns],
  liquidRuns: [...source.liquidRuns],
  gasSources: [...source.gasSources],
  liquidSources: [...source.liquidSources],
});

export const equipmentAvailable = (state: GameState, equipmentId: EquipmentId): boolean =>
  state.availability.equipment.includes(equipmentId);

export const transportPhaseAvailable = (
  state: GameState,
  runId: TransportRunId,
  phase: TransportPhase
): boolean =>
  phase === "gas"
    ? state.availability.gasRuns.includes(runId)
    : state.availability.liquidRuns.includes(runId);

export const gasSourceAvailable = (state: GameState, sourceId: GasSourceId): boolean =>
  state.availability.gasSources.includes(sourceId);

export const liquidSourceAvailable = (state: GameState, sourceId: LiquidSourceId): boolean =>
  state.availability.liquidSources.includes(sourceId);
