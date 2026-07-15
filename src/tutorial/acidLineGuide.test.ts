import { describe, expect, it } from "vitest";
import { hydrogenChlorineReactionStatus } from "../game/queries";
import { createScenarioGame, executeCommand, stepGame } from "../game/simulation";
import type { GameCommand, GameState } from "../game/types";
import { DEFAULT_TRANSLATOR } from "../localization/translator";
import { TUTORIAL_ANCHORS } from "./anchors";
import { guidedPhaseActionReason, guideDefinitionFor, guideStepIndexFor } from "./guideModel";
import { tutorialText } from "./tutorialCopy";
import { roomState } from "../game/world/instances";

const command = (source: GameState, value: GameCommand): GameState => {
  const result = executeCommand(source, value);
  expect(result.accepted, result.code ?? undefined).toBe(true);
  return result.state;
};

const advance = (source: GameState, seconds: number): GameState => {
  let game = source;
  for (let elapsed = 0; elapsed < seconds; elapsed += 0.1) game = stepGame(game, 0.1);
  return game;
};

const installAcidEquipment = (source: GameState): GameState => {
  let game = command(source, {
    type: "install_equipment",
    roomId: "furnace",
    socketId: "socket_a",
    equipmentId: "thermal_coil",
  });
  game = command(game, {
    type: "install_equipment",
    roomId: "furnace",
    socketId: "socket_b",
    equipmentId: "gas_agitator",
  });
  return game;
};

const openAcidLine = (source: GameState): GameState => {
  let game = source;
  for (const runId of ["cell_furnace", "furnace_return", "return_final"] as const) {
    game = command(game, { type: "set_conduit", runId, phase: "gas", enabled: true });
  }
  return game;
};

describe("Acid Line guidance", () => {
  it("teaches Thermal Coil activation, CL-2 conversion, and the complete return route", () => {
    let game = command(createScenarioGame("acid_line"), { type: "begin_level" });
    const guide = guideDefinitionFor(game);
    if (!guide) throw new Error("Acid Line guide missing");

    expect(guide.id).toContain("hot_mix");
    expect(guide.showStageIntro).toBe(true);
    expect(guide.firstFlashTeachingBreak).toBe(false);
    expect(
      guide.story.model?.stages.map((stage) => tutorialText(DEFAULT_TRANSLATOR, stage.metric))
    ).toEqual([
      "1 H₂ : 1 Cl₂ · 1.15 mol-eq/s",
      "68°C target · 38→66°C activation",
      "1 H₂ + 1 Cl₂ → 2 HCl",
      "R-02→R-04 1.2 · R-04→R-06 1.15 mol-eq/s",
    ]);
    expect(guide.steps.map((step) => step.target)).toEqual(
      expect.arrayContaining([
        TUTORIAL_ANCHORS.furnaceThermalCoil,
        TUTORIAL_ANCHORS.furnaceAgitator,
        TUTORIAL_ANCHORS.conduitCellFurnaceGas,
        TUTORIAL_ANCHORS.conduitFurnaceReturnGas,
        TUTORIAL_ANCHORS.conduitReturnFinalGas,
        TUTORIAL_ANCHORS.furnaceReactionReadout,
      ])
    );
    const reason = guidedPhaseActionReason(game, "start_prime", []);
    expect(reason && tutorialText(DEFAULT_TRANSLATOR, reason)).toContain("Thermal Coil");

    game = installAcidEquipment(game);
    expect(guideStepIndexFor(game, guide)).toBe(2);
    game = openAcidLine(game);
    expect(guidedPhaseActionReason(game, "start_prime", [])).toBeNull();
    game = command(game, { type: "start_prime" });
    game = advance(game, 27);

    expect(game.events.some((event) => event.code === "hcl_production_started")).toBe(true);
    expect(guide.mission.tasks[3]?.completed(game)).toBe(true);
    expect(guidedPhaseActionReason(game, "start_assault", [])).toBeNull();
  });

  it("continues with retained-inventory guidance in Residence Time", () => {
    const game = command(createScenarioGame("acid_line"), { type: "begin_level" });
    game.campaign.roundIndex = 1;
    const guide = guideDefinitionFor(game);
    if (!guide) throw new Error("Residence Time guide missing");

    expect(guide.id).toContain("residence_time");
    expect(guide.showStageIntro).toBe(false);
    expect(guide.gatesPhaseActions).toBe(false);
    expect(guide.firstFlashTeachingBreak).toBe(false);
    expect(guide.mission.tasks.map((task) => task.id)).toEqual([
      "confirm-acid-line",
      "start-residence-prime",
      "carry-downstream-acid",
      "hold-residence-wave",
    ]);
  });
});

describe("CL-2 live reaction status", () => {
  it("reports the simulator's temperature ramp, reactant batch, and agitation multiplier", () => {
    let game = command(createScenarioGame("acid_line"), { type: "begin_level" });
    game = command(game, {
      type: "install_equipment",
      roomId: "furnace",
      socketId: "socket_a",
      equipmentId: "gas_agitator",
    });
    const room = roomState(game, "furnace");
    room.gas.upper.hydrogen = 1;
    room.gas.upper.chlorine = 1;
    room.gasTemperature.upper = 38;

    expect(hydrogenChlorineReactionStatus(room, "upper")).toMatchObject({
      activation: 0,
      fullActivationTemperature: 66,
      reactionMultiplier: 1.5,
      ready: false,
    });

    room.gasTemperature.upper = 52;
    expect(hydrogenChlorineReactionStatus(room, "upper")).toMatchObject({
      activation: 0.5,
      availableExtent: 1,
      chlorineReady: true,
      hydrogenReady: true,
      ready: true,
    });
  });
});
