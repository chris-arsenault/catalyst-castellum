/** Public tactical API for presentation adapters; definitions remain explicitly injected. */
export { createEncounterRuntime } from "./encounter/runtime";
export { createEncounter } from "./encounter/create";
export { campaignEncounterContext } from "./engine/campaignEncounter";
export { resolveTowerPlacement } from "./engine/towerPlacement";
export { effectiveTowerStats } from "./engine/towerStats";
export { towerCoversPoint } from "./engine/towerTargeting";
export { enemyWorldPosition, enemyRoomId } from "./engine/enemyPosition";
export { previewCatalystField, previewCatalystPlacement } from "./encounter/catalystFields";
export { previewDischarge } from "./encounter/catalystDischarge";
export { getEnemyChargePreview } from "./encounter/catalystCharge";
export type { FieldPreview, FieldRouteArrow, DischargePreview } from "./encounter/catalystTypes";
export type { EffectiveTowerStats } from "./engine/towerStats";
export type {
  CombatDefinition,
  EncounterCommand,
  EncounterContext,
  EncounterDefinition,
  EncounterState,
  EncounterTower,
  EncounterResult,
} from "./encounter/types";
