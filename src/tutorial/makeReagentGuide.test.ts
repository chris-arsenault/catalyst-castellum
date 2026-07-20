import { describe, expect, it } from "vitest";
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

describe("Make the Reagent guidance", () => {
  it("continues the tutorial through conserved three-product cell operation", () => {
    let game = command(createScenarioGame("make_the_reagent"), { type: "begin_level" });
    const guide = guideDefinitionFor(game);
    if (!guide) throw new Error("Make the Reagent guide missing");

    expect(guide.id).toContain("co_products");
    expect(guide.firstFlashTeachingBreak).toBe(false);
    expect(guide.story.model?.stages.map((stage) => stage.kind)).toEqual([
      "feed",
      "convert",
      "separate",
      "relieve",
    ]);
    expect(guide.steps.map((step) => step.target)).toContain(
      TUTORIAL_ANCHORS.lowerIntakeMembraneCell
    );
    expect(guide.steps.map((step) => step.target)).toContain(
      TUTORIAL_ANCHORS.conduitCoreCellLiquid
    );
    const reason = guidedPhaseActionReason(game, "start_prime", []);
    expect(reason && tutorialText(DEFAULT_TRANSLATOR, reason)).toContain("Membrane Cell");

    game = command(game, {
      type: "install_equipment",
      roomId: "lower_intake",
      socketId: "socket_a",
      equipmentId: "membrane_cell",
    });
    expect(guideStepIndexFor(game, guide)).toBe(1);
    game = command(game, {
      type: "set_conduit",
      connectionId: "liquid:core__lower_intake",
      enabled: true,
    });
    expect(guidedPhaseActionReason(game, "start_prime", [])).toBeNull();
    game = command(game, { type: "start_prime" });
    game = advance(game, 12);

    expect(
      Object.values(roomState(game, "lower_intake").equipment).find(
        (instance) => instance?.equipmentId === "membrane_cell"
      )?.operation?.totalProcessed
    ).toBeGreaterThan(0);
    expect(guide.mission.tasks[2]?.completed(game)).toBe(true);
    expect(guidedPhaseActionReason(game, "start_assault", [])).toBeNull();
  });

  it("uses a separate shared-relief task list without a flash teaching break", () => {
    const game = command(createScenarioGame("make_the_reagent"), { type: "begin_level" });
    game.campaign.roundIndex = 1;
    const guide = guideDefinitionFor(game);
    if (!guide) throw new Error("Shared Relief guide missing");

    expect(guide.id).toContain("shared_relief");
    expect(guide.firstFlashTeachingBreak).toBe(false);
    expect(guide.steps[0]?.target).toBe(TUTORIAL_ANCHORS.conduitCoreCellGas);
    expect(guide.mission.tasks.map((task) => task.id)).toEqual([
      "open-recovery",
      "establish-recovery-flow",
      "sustain-cell",
      "hold-relief-wave",
    ]);
  });

  it("continues into the acid-line lesson on the same generated site", () => {
    const game = command(createScenarioGame("make_the_reagent"), { type: "begin_level" });
    game.campaign.roundIndex = 2;
    const guide = guideDefinitionFor(game);
    if (!guide) throw new Error("Hot Mix guide missing");

    expect(guide.id).toContain("hot_mix");
    expect(game.map.rooms.furnace?.code).toBe("CL-04");
    expect(game.map.rooms.gallery?.code).toBe("CL-05");
    expect(guidedPhaseActionReason(game, "start_prime", [])).toBe("tutorial.acid.reason.coil");
  });
});
