import type { DamageSourceId, GameCommand, GamePhase, LevelId } from "../types";

export interface PlaytestPlan {
  name: string;
  commands: GameCommand[];
  primeFraction: number;
}

export interface PlaytestResult {
  levelId: LevelId;
  planName: string;
  success: boolean;
  terminalPhase: GamePhase;
  coreIntegrity: number;
  roundsCleared: number;
  killed: number;
  breached: number;
  coreDamage: number;
  damageBySource: Record<DamageSourceId, number>;
  killsBySource: Record<DamageSourceId, number>;
  plannedActions: number;
  acceptedActions: number;
  rejectedActions: number;
  simulatedSeconds: number;
  stable: boolean;
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
  intended: PlaytestResult;
  randomTrials: PlaytestResult[];
  actionBands: ActionBand[];
}
