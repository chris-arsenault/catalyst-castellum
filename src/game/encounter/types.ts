import type {
  CommandDecision,
  EnemyDefinition,
  EnemyState,
  EnemyType,
  EnvironmentalField,
  FacilityPortalState,
  GameCommand,
  GameEvent,
  CombatIncident,
  RoundStats,
  ScenarioAvailability,
  TowerAttackEvent,
  TowerChassisId,
  TowerDefinition,
  TowerInstance,
  TowerRoundReport,
  WorldCatalogs,
} from "../types";
import type { WorldMap } from "../world/map";
import type { CatalystReport, CatalystState, CombatMechanics } from "./catalystTypes";
import type { PendingAttack } from "./projectileTypes";
import type { ProcessBridge, ProcessDefinition, ProcessState } from "./processTypes";

export interface CombatDefinition {
  readonly id: string;
  readonly contentVersion: number;
  readonly towers: Readonly<Partial<Record<TowerChassisId, TowerDefinition>>>;
  readonly enemies: Readonly<Partial<Record<EnemyType, EnemyDefinition>>>;
  readonly tickSeconds: 0.1;
  readonly mechanics: CombatMechanics;
}

export interface EncounterSpawn {
  readonly tick: number;
  readonly type: EnemyType;
  readonly level: number;
  readonly routeId: string;
}

export type EncounterTower = Omit<TowerInstance, "localResources">;
export type EncounterPhase = "build" | "assault" | "complete" | "defeat" | "timeout";

export interface EncounterDefinition {
  readonly id: string;
  readonly contentVersion: number;
  /** Campaign composition supplies the site's namespace; tactical fixtures supply their own. */
  readonly instanceNamespace: string;
  readonly map: WorldMap;
  readonly wave: readonly EncounterSpawn[];
  readonly availability: ScenarioAvailability;
  readonly maximumTicks: number;
  readonly startingMatter: number;
  readonly startingCoreIntegrity: number;
  readonly initialTowers: Readonly<Record<string, EncounterTower>>;
  readonly initialPortalStates: Readonly<Record<string, FacilityPortalState>>;
  readonly process: ProcessDefinition | null;
}

export type EncounterCommand = Exclude<
  GameCommand,
  {
    type:
      | "begin_level"
      | "continue_round"
      | "start_next_level"
      | "dock_at_site"
      | "retry_level"
      | "graft_module"
      | "dismantle_module"
      | "edit_hull_cell"
      | "edit_hull_cells"
      | "connect_hull_rooms"
      | "remove_hull_connection"
      | "configure_hull_portal"
      | "toggle_pause"
      | "set_pause"
      | "set_speed";
  }
>;

export interface OrderedEncounterCommand {
  readonly tick: number;
  readonly sequence: number;
  readonly command: EncounterCommand;
}

export type EncounterEvent = Omit<GameEvent, "levelId" | "round" | "phase"> & {
  encounterId: string;
  phase: EncounterPhase;
};

export type EncounterIncident = Omit<CombatIncident, "levelId" | "round" | "phase"> & {
  encounterId: string;
  phase: EncounterPhase;
};

export interface EncounterReport extends RoundStats {
  towers: Record<string, TowerRoundReport>;
  catalyst: CatalystReport | null;
}

export interface EncounterResult {
  readonly encounterId: string;
  readonly termination: "complete" | "defeat" | "timeout";
  readonly ticks: number;
  readonly coreIntegrity: number;
  readonly matter: number;
  readonly pendingMatter: number;
  readonly report: EncounterReport;
}

export interface EncounterState {
  definition: { id: string; contentVersion: number; combatId: string; combatVersion: number };
  map: WorldMap;
  mapRevision: number;
  world: WorldCatalogs;
  phase: EncounterPhase;
  tick: number;
  /** Retained accumulated timestamps preserve existing threshold behavior during extraction. */
  elapsed: number;
  phaseTime: number;
  commandCursor: { tick: number; sequence: number };
  availability: ScenarioAvailability;
  portalStates: Record<string, FacilityPortalState>;
  towers: Record<string, EncounterTower>;
  enemies: EnemyState[];
  towerAttacks: TowerAttackEvent[];
  pendingAttacks: PendingAttack[];
  catalyst: CatalystState | null;
  environmentalFields: EnvironmentalField[];
  spawnCursor: number;
  nextEnemyId: number;
  nextTowerSequence: number;
  nextTowerAttackId: number;
  nextEventId: number;
  nextIncidentId: number;
  matter: number;
  pendingMatter: number;
  coreIntegrity: number;
  stats: RoundStats;
  result: EncounterResult | null;
  events: EncounterEvent[];
  incidents: EncounterIncident[];
  process: ProcessState | null;
}

export interface EncounterContext {
  readonly combat: CombatDefinition;
  readonly definition: EncounterDefinition;
  readonly process: ProcessBridge | null;
}

export interface EncounterCommandResult {
  state: EncounterState;
  decision: CommandDecision;
  events: readonly EncounterEvent[];
}

export interface EncounterCommandRecord {
  input: OrderedEncounterCommand;
  decision: CommandDecision;
}

export interface EncounterAdvanceResult {
  state: EncounterState;
  ticksAdvanced: number;
  termination: EncounterResult["termination"] | null;
  events: readonly EncounterEvent[];
  commands: readonly EncounterCommandRecord[];
}
