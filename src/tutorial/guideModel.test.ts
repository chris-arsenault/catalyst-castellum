import { describe, expect, it } from "vitest";
import { emptyHazardChannels } from "../game/engine/damage";
import { createScenarioGame, executeCommand } from "../game/simulation";
import type { CombatIncident, GameCommand, GameState } from "../game/types";
import { DEFAULT_TRANSLATOR } from "../localization/translator";
import {
  assaultFlashIncident,
  guidedPhaseActionReason,
  guideDefinitionFor,
  guideStepIndexFor,
} from "./guideModel";
import { TUTORIAL_ANCHORS } from "./anchors";
import type { GuideDefinition, GuideRegistry } from "./guideModel";
import { tutorialText } from "./tutorialCopy";

const command = (source: GameState, value: GameCommand): GameState => {
  const result = executeCommand(source, value);
  expect(result.accepted, result.code ?? undefined).toBe(true);
  return result.state;
};

const incident = (
  game: GameState,
  phase: "prime" | "assault",
  killed: boolean
): CombatIncident => ({
  id: game.nextIncidentId,
  elapsed: game.elapsed,
  levelId: "flash_point",
  round: 1,
  phase,
  roomId: "furnace",
  zone: "lower",
  sourceId: "hydrogen_oxygen_combustion",
  reactionExtent: 3,
  pressureImpulse: 120,
  heatDelta: 30,
  damageByChannel: {
    ...emptyHazardChannels(),
    pressure: phase === "assault" ? 64 : 0,
  },
  targets:
    phase === "assault"
      ? [
          {
            enemyId: 9,
            enemyType: "crawler",
            worldPosition: { x: 98, elevation: 14 },
            healthBefore: 64,
            healthAfter: killed ? 0 : 12,
            damageByChannel: { ...emptyHazardChannels(), pressure: killed ? 64 : 52 },
            killed,
          },
        ]
      : [],
});

const FLASH_POINT_STEP_IDS = [
  "install-agitator",
  "run-agitator",
  "start-shared-duct",
  "begin-prime",
  "accelerate-clock",
  "observe-prime-flash",
  "cold-assault",
  "start-assault",
  "observe-combat-flash",
];

describe("Flash Point guide definition", () => {
  it("defines a reusable story and four state-driven field tasks", () => {
    const game = command(createScenarioGame("flash_point"), { type: "begin_level" });
    const guide = guideDefinitionFor(game);
    if (!guide) throw new Error("Flash Point guide missing");

    expect(tutorialText(DEFAULT_TRANSLATOR, guide.story.title)).toBe(
      "Turn R-02 into a combustion trap"
    );
    expect(
      guide.story.model?.stages.map((stage) => tutorialText(DEFAULT_TRANSLATOR, stage.metric))
    ).toEqual([
      "2 H₂ : 1 O₂ · up to 2.2 mol-eq/s",
      "2 open passages · pressure/density outflow",
      "0.42× air density · 1.5 layer exchange",
      "H₂ ≥ 5% · O₂ ≥ 8% · 2 H₂ + 1 O₂",
    ]);
    expect(tutorialText(DEFAULT_TRANSLATOR, guide.story.model!.conclusion)).toContain(
      "Prime supplies transport time"
    );
    expect(guide.mission.tasks.map((task) => task.id)).toEqual([
      "mix-chamber",
      "feed-reactants",
      "prove-ignition",
      "catch-crawler",
    ]);
    expect(guide.mission.tasks.map((task) => task.completed(game))).toEqual([
      false,
      false,
      false,
      false,
    ]);
  });
});

describe("guide registration extension", () => {
  it("registers another guided level without renderer dispatch changes", () => {
    const game = command(createScenarioGame("stored_chlorine"), { type: "begin_level" });
    const fixture: GuideDefinition = {
      completion: {
        title: "tutorial.common.lessonComplete",
        explanation: "tutorial.common.lessonComplete",
        instruction: "tutorial.common.doNow",
      },
      id: "fixture-guide",
      dismissalId: "fixture-guide",
      firstFlashTeachingBreak: false,
      label: "tutorial.common.tasks",
      showStageIntro: false,
      gatesPhaseActions: false,
      story: {
        kicker: "tutorial.common.tasks",
        title: "tutorial.common.tasks",
        paragraphs: [],
        model: null,
      },
      mission: {
        title: "tutorial.common.tasks",
        summary: "tutorial.common.tasks",
        tasks: [],
      },
      steps: [],
    };
    const registry: GuideRegistry = {
      stored_chlorine: { guideFor: () => fixture },
    };

    expect(guideDefinitionFor(game, registry)).toBe(fixture);
  });
});

describe("Flash Point guided flow", () => {
  it("teaches one mixed conduit and waits for separate prime and combat evidence", () => {
    let game = command(createScenarioGame("flash_point"), { type: "begin_level" });
    const guide = guideDefinitionFor(game);
    expect(guide).not.toBeNull();
    if (!guide) throw new Error("Flash Point guide missing");

    expect(guide.steps.map((step) => step.id)).toEqual(FLASH_POINT_STEP_IDS);
    expect(
      guide.steps.filter((step) => step.target === TUTORIAL_ANCHORS.conduitCoreFurnaceGas)
    ).toHaveLength(1);
    expect(guide.steps.some((step) => /oxygen|hydrogen/i.test(step.target))).toBe(false);

    game = command(game, {
      type: "install_equipment",
      roomId: "furnace",
      socketId: "socket_a",
      equipmentId: "gas_agitator",
    });
    expect(guide.steps[0]?.completed(game)).toBe(true);
    expect(guide.steps[1]?.completed(game)).toBe(true);
    expect(guideStepIndexFor(game, guide)).toBe(2);

    game = command(game, {
      type: "toggle_equipment",
      roomId: "furnace",
      socketId: "socket_a",
      enabled: false,
    });
    expect(guideStepIndexFor(game, guide)).toBe(1);
    const agitatorReason = guidedPhaseActionReason(game, "start_prime", []);
    expect(agitatorReason && tutorialText(DEFAULT_TRANSLATOR, agitatorReason)).toContain(
      "run a Gas Agitator"
    );
    game = command(game, {
      type: "toggle_equipment",
      roomId: "furnace",
      socketId: "socket_a",
      enabled: true,
    });

    game = command(game, {
      type: "set_conduit",
      runId: "core_furnace",
      phase: "gas",
      enabled: true,
    });
    expect(guide.steps[2]?.completed(game)).toBe(true);
    expect(guidedPhaseActionReason(game, "start_prime", [])).toBeNull();
    game = command(game, { type: "start_prime" });
    game = command(game, { type: "set_speed", speed: 2 });

    game.incidents.unshift(incident(game, "prime", false));
    expect(guide.steps[5]?.completed(game)).toBe(true);
    expect(assaultFlashIncident(game)).toBeNull();
    expect(guideStepIndexFor(game, guide)).toBe(7);
    expect(guidedPhaseActionReason(game, "start_assault", [])).toBeNull();

    game = command(game, { type: "start_assault" });
    game.incidents.unshift(incident(game, "assault", false));
    expect(assaultFlashIncident(game)).not.toBeNull();
    expect(guide.steps[8]?.completed(game)).toBe(false);

    game.incidents.unshift(incident(game, "assault", true));
    expect(guide.steps[8]?.completed(game)).toBe(true);
    expect(guideStepIndexFor(game, guide)).toBe(guide.steps.length);
  });
});

describe("Flash Point cold assault guidance", () => {
  it("surfaces a cold assault when the prime evidence is absent", () => {
    let game = command(createScenarioGame("flash_point"), { type: "begin_level" });
    const guide = guideDefinitionFor(game);
    if (!guide) throw new Error("Flash Point guide missing");
    const primeReason = guidedPhaseActionReason(game, "start_prime", []);
    expect(primeReason && tutorialText(DEFAULT_TRANSLATOR, primeReason)).toContain("Gas Agitator");
    expect(guidedPhaseActionReason(game, "start_prime", [guide.dismissalId])).toBeNull();

    game = command(game, { type: "start_prime" });
    const assaultReason = guidedPhaseActionReason(game, "start_assault", []);
    expect(assaultReason && tutorialText(DEFAULT_TRANSLATOR, assaultReason)).toContain(
      "first OX-1 flash"
    );
    game = command(game, { type: "start_assault" });
    expect(guide.steps[guideStepIndexFor(game, guide)]?.id).toBe("cold-assault");
  });
});

describe("Flash Point follow-up guidance", () => {
  it("continues with a looser retained-state mission in round two", () => {
    let game = command(createScenarioGame("flash_point"), { type: "begin_level" });
    game = command(game, {
      type: "install_equipment",
      roomId: "furnace",
      socketId: "socket_a",
      equipmentId: "gas_agitator",
    });
    game = command(game, {
      type: "set_conduit",
      runId: "core_furnace",
      phase: "gas",
      enabled: true,
    });
    game.campaign.roundIndex = 1;
    const guide = guideDefinitionFor(game);
    if (!guide) throw new Error("Stored Momentum guide missing");

    expect(guide.id).toContain("stored_momentum");
    expect(guide.showStageIntro).toBe(false);
    expect(guide.gatesPhaseActions).toBe(false);
    expect(guide.dismissalId).toBe("flash_point:field_guidance:v5");
    expect(guide.steps.map((step) => step.id)).toEqual([
      "prepare-followup",
      "observe-followup-prime",
      "observe-followup-assault",
    ]);
    expect(guide.mission.tasks[0]?.completed(game)).toBe(true);
    expect(guideStepIndexFor(game, guide)).toBe(0);
    expect(guidedPhaseActionReason(game, "start_prime", [])).toBeNull();

    game.phase = "prime";
    expect(guideStepIndexFor(game, guide)).toBe(1);
    game.phase = "assault";
    expect(guideStepIndexFor(game, guide)).toBe(2);
  });
});
