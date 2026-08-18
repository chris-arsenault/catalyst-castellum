/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { createScenarioGame, executeCommand } from "../game/simulation";
import type { GameCommand, GameState } from "../game/types";
import { guideDefinitionFor } from "./guideModel";
import { TutorialTaskCard } from "./TutorialTaskCard";

afterEach(cleanup);

const command = (game: GameState, value: GameCommand): GameState => {
  const result = executeCommand(game, value);
  if (!result.accepted) throw new Error(result.code ?? "Command rejected");
  return result.state;
};

describe("tutorial task card", () => {
  it("shows the complete direct-defense mission and state-driven progress", () => {
    let game = command(createScenarioGame("claim_8_delta"), { type: "begin_level" });
    const guide = guideDefinitionFor(game);
    if (!guide) throw new Error("Claim 8-Delta guide missing");
    const view = render(
      <TutorialTaskCard activeStep={guide.steps[0] ?? null} guide={guide} game={game} />
    );

    expect(screen.getByTestId("tutorial-task-card").textContent).toContain("0 / 4");
    expect(screen.getByText("Mount a defense on a wall.")).toBeTruthy();
    expect(screen.getByText("Record direct tower damage.")).toBeTruthy();
    expect(screen.getByText("Establish route coverage")).toBeTruthy();
    expect(screen.getByText("Read the approach")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Collapse tutorial tasks" }));
    expect(screen.getByTestId("tutorial-task-card").getAttribute("data-expanded")).toBe("false");
    fireEvent.click(screen.getByRole("button", { name: "Expand tutorial tasks" }));

    game = command(game, {
      type: "place_tower",
      chassisId: "bolt_caster",
      anchor: { column: 6, elevation: 8 },
      mountFace: "left_wall",
      orientation: "right",
    });
    view.rerender(
      <TutorialTaskCard activeStep={guide.steps[3] ?? null} guide={guide} game={game} />
    );
    expect(screen.getByTestId("tutorial-task-card").textContent).toContain("1 / 4");
    expect(screen.getByText("Inspect the firing line")).toBeTruthy();
  });

  it("shows the direct-defense completion copy", () => {
    const game = command(createScenarioGame("claim_8_delta"), { type: "begin_level" });
    const guide = guideDefinitionFor(game);
    if (!guide) throw new Error("Claim 8-Delta guide missing");

    render(<TutorialTaskCard activeStep={null} guide={guide} game={game} />);
    expect(screen.getByText("Lesson complete")).toBeTruthy();
    expect(screen.getByText("Direct defense commissioned")).toBeTruthy();
    expect(
      screen.getByText("Apply the same coverage reading to the remaining waves.")
    ).toBeTruthy();
  });
});
