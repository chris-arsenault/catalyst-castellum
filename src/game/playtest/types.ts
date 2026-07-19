import type {
  DamageSourceId,
  GameCommand,
  GamePhase,
  HazardChannels,
  LevelId,
  RoundReport,
} from "../types";

export const BUILD_ARCHETYPE_IDS = [
  "burst",
  "continuous",
  "control",
  "storage",
  "catalytic",
  "carrier",
  "pressure",
  "hybrid",
] as const;

export type BuildArchetypeId = (typeof BUILD_ARCHETYPE_IDS)[number];

export interface PlaytestRoundPlan {
  commands: readonly GameCommand[];
  primeFraction: number;
}

export interface PlaytestPlan {
  name: string;
  archetype: BuildArchetypeId | null;
  rounds: readonly PlaytestRoundPlan[];
}

export interface BuildProfile {
  equipment: string[];
  enabledGasLines: string[];
  enabledLiquidLines: string[];
  activeDamageSources: DamageSourceId[];
}

export interface PlaytestResult {
  levelId: LevelId;
  planName: string;
  archetype: BuildArchetypeId | null;
  success: boolean;
  terminalPhase: GamePhase;
  coreIntegrity: number;
  roundsCleared: number;
  killed: number;
  breached: number;
  coreDamage: number;
  fieldDamageAbsorbed: number;
  fieldDamageAbsorbedBySource: Record<DamageSourceId, number>;
  damageBySource: Record<DamageSourceId, number>;
  killsBySource: Record<DamageSourceId, number>;
  damageByChannel: HazardChannels;
  pulseDamage: number;
  continuousDamage: number;
  matterSpent: number;
  buildProfile: BuildProfile;
  buildSignature: string;
  plannedActions: number;
  acceptedActions: number;
  rejectedActions: number;
  simulatedSeconds: number;
  stable: boolean;
  reports: RoundReport[];
}

export interface EvaluationOptions {
  levelId: LevelId;
  runs: number;
  seed: number;
}

export interface ActionBand {
  actions: number;
  trials: number;
  passes: number;
  passRate: number;
  averageCore: number;
}

export interface LevelEvaluation {
  levelId: LevelId;
  doNothing: PlaytestResult;
  references: PlaytestResult[];
  mutationTrials: PlaytestResult[];
  actionBands: ActionBand[];
  diversity: DiversityEvaluation;
}

export interface DiversityRequirement {
  minimumPassingBuilds: number;
  minimumPassingArchetypes: number;
  minimumDistinctSignatures: number;
}

export interface DiversityEvaluation extends DiversityRequirement {
  passingBuilds: number;
  passingArchetypes: BuildArchetypeId[];
  distinctPassingSignatures: number;
  satisfied: boolean;
  issues: string[];
}
