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
  it("keeps the complete mission visible while marking state-driven progress", () => {
    let game = command(createScenarioGame("flash_point"), { type: "begin_level" });
    const guide = guideDefinitionFor(game);
    if (!guide) throw new Error("Flash Point guide missing");
    const installStep = guide.steps[0];
    const runStep = guide.steps[1];
    if (!installStep || !runStep) throw new Error("Flash Point guide steps missing");
    const view = render(<TutorialTaskCard activeStep={installStep} guide={guide} game={game} />);

    expect(screen.getByTestId("tutorial-task-card").textContent).toContain("0 / 4");
    expect(screen.getByText("Install and run a Gas Agitator in R-02.")).toBeTruthy();
    expect(screen.getByText("Open the Core → R-02 H₂/O₂ feed.")).toBeTruthy();
    expect(screen.getByText("Prime at 2× until R-02 produces an OX-1 flash.")).toBeTruthy();
    expect(screen.getByText("Start the assault and catch a crawler in the flash.")).toBeTruthy();
    expect(screen.getByText("Prepare the flash chamber")).toBeTruthy();
    expect(
      screen.getByText("Select R-02, then install a Gas Agitator in either socket.")
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Collapse tutorial tasks" }));
    expect(screen.getByTestId("tutorial-task-card").getAttribute("data-expanded")).toBe("false");
    expect(screen.queryByText("Prepare the flash chamber")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Expand tutorial tasks" }));
    expect(screen.getByTestId("tutorial-task-card").getAttribute("data-expanded")).toBe("true");
    expect(screen.getByText("Prepare the flash chamber")).toBeTruthy();

    game = command(game, {
      type: "install_equipment",
      roomId: "furnace",
      socketId: "socket_a",
      equipmentId: "gas_agitator",
    });
    view.rerender(<TutorialTaskCard activeStep={runStep} guide={guide} game={game} />);
    expect(screen.getByTestId("tutorial-task-card").textContent).toContain("1 / 4");
    expect(screen.getByText("Run the gas agitator")).toBeTruthy();
    expect(screen.getByText("Switch the R-02 Gas Agitator ON.")).toBeTruthy();
  });

  it("keeps a completed lesson visible beside its result panel", () => {
    const game = command(createScenarioGame("flash_point"), { type: "begin_level" });
    const guide = guideDefinitionFor(game);
    if (!guide) throw new Error("Flash Point guide missing");

    render(<TutorialTaskCard activeStep={null} guide={guide} game={game} />);

    expect(screen.getByText("Lesson complete")).toBeTruthy();
    expect(screen.getByText("First cycle established")).toBeTruthy();
    expect(
      screen.getByText("Continue into Stored Momentum with the chamber’s established state.")
    ).toBeTruthy();
  });
});
