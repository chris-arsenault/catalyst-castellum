import type { GameCommand, GamePhase, GameState } from "../types";

export type GameCommandType = GameCommand["type"];

export interface PhaseDefinition {
  stepMode: "live" | "static";
  allowedCommands: readonly GameCommandType[];
  legalTransitions: readonly GamePhase[];
}

export const PHASE_DEFINITIONS: Record<GamePhase, PhaseDefinition> = {
  level_briefing: {
    stepMode: "static",
    allowedCommands: ["begin_level", "skip_tutorial"],
    legalTransitions: ["build"],
  },
  build: {
    stepMode: "static",
    allowedCommands: [
      "install_equipment",
      "toggle_equipment",
      "upgrade_equipment",
      "dismantle_equipment",
      "set_conduit",
      "build_connection",
      "dismantle_connection",
      "graft_module",
      "dismantle_module",
      "charge_gas_source",
      "charge_liquid_source",
      "start_prime",
    ],
    legalTransitions: ["prime"],
  },
  prime: {
    stepMode: "live",
    allowedCommands: [
      "toggle_equipment",
      "set_conduit",
      "start_assault",
      "toggle_pause",
      "set_pause",
      "set_speed",
    ],
    legalTransitions: ["assault"],
  },
  assault: {
    stepMode: "live",
    allowedCommands: ["toggle_pause", "set_pause", "set_speed"],
    legalTransitions: ["round_result", "level_complete", "victory", "defeat"],
  },
  round_result: {
    stepMode: "static",
    allowedCommands: ["continue_round"],
    legalTransitions: ["build"],
  },
  level_complete: {
    stepMode: "static",
    allowedCommands: ["graft_module", "dismantle_module", "start_next_level"],
    legalTransitions: ["travel"],
  },
  travel: {
    stepMode: "static",
    allowedCommands: ["dock_at_site"],
    legalTransitions: [],
  },
  victory: {
    stepMode: "static",
    allowedCommands: [],
    legalTransitions: [],
  },
  defeat: {
    stepMode: "static",
    allowedCommands: ["retry_level"],
    legalTransitions: ["level_briefing"],
  },
};

export const phaseAllowsCommand = (phase: GamePhase, command: GameCommandType): boolean =>
  PHASE_DEFINITIONS[phase].allowedCommands.includes(command);

export const phaseIsStatic = (phase: GamePhase): boolean =>
  PHASE_DEFINITIONS[phase].stepMode === "static";

export const phaseCanTransition = (from: GamePhase, to: GamePhase): boolean =>
  PHASE_DEFINITIONS[from].legalTransitions.includes(to);

export const transitionPhase = (state: GameState, next: GamePhase): void => {
  if (!phaseCanTransition(state.phase, next)) {
    throw new Error(`Illegal phase transition: ${state.phase} -> ${next}`);
  }
  state.phase = next;
  state.phaseTime = 0;
  state.paused = false;
};
