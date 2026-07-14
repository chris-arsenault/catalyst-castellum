import { describe, expect, it } from "vitest";
import { GAME_PHASES, type GamePhase } from "../types";
import { createScenarioGame } from "../simulation";
import {
  PHASE_DEFINITIONS,
  phaseAllowsCommand,
  phaseCanTransition,
  phaseIsStatic,
  transitionPhase,
} from "./phaseModel";

describe("phase model", () => {
  it("defines policy for every canonical phase", () => {
    expect(Object.keys(PHASE_DEFINITIONS)).toEqual([...GAME_PHASES]);
    for (const phase of GAME_PHASES) {
      const definition = PHASE_DEFINITIONS[phase];
      expect(phaseIsStatic(phase)).toBe(definition.stepMode === "static");
      for (const command of definition.allowedCommands) {
        expect(phaseAllowsCommand(phase, command)).toBe(true);
      }
      for (const destination of definition.legalTransitions) {
        expect(phaseCanTransition(phase, destination)).toBe(true);
      }
    }
  });

  it("rejects undeclared transitions without mutating state", () => {
    const state = createScenarioGame("flash_point");
    const before = { phase: state.phase, phaseTime: state.phaseTime };
    expect(() => transitionPhase(state, "assault")).toThrow(
      "Illegal phase transition: level_briefing -> assault"
    );
    expect({ phase: state.phase, phaseTime: state.phaseTime }).toEqual(before);
  });

  it("applies transition entry invariants centrally", () => {
    const state = createScenarioGame("flash_point");
    state.phaseTime = 12;
    state.paused = true;
    transitionPhase(state, "build");
    expect(state.phase).toBe<GamePhase>("build");
    expect(state.phaseTime).toBe(0);
    expect(state.paused).toBe(false);
  });
});
