/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useGameStore } from "../application/store";
import { createScenarioGame, executeCommand } from "../game/simulation";
import { HydrogenChlorineGate } from "./HydrogenChlorineGate";

afterEach(cleanup);

describe("hydrogen-chlorine reaction gate", () => {
  it("presents the live CL-2 temperature and reactant conditions", () => {
    const entered = executeCommand(createScenarioGame("acid_line"), { type: "begin_level" });
    if (!entered.accepted) throw new Error(entered.code ?? "Acid Line entry failed");
    useGameStore.setState({ game: entered.state });

    render(<HydrogenChlorineGate />);

    expect(screen.getByTestId("cl2-reaction-gate").textContent).toContain("CL-2 reaction gate");
    expect(screen.getByTestId("cl2-reaction-upper").textContent).toContain("38°C");
    expect(screen.getByTestId("cl2-reaction-upper").textContent).toContain("H₂");
    expect(screen.getByTestId("cl2-reaction-upper").textContent).toContain("Cl₂");
    expect(screen.getByTestId("cl2-reaction-gate").textContent).toContain(
      "Thermal Coil supplies heat"
    );
    expect(screen.getByTestId("cl2-reaction-gate").textContent).toContain(
      "each 1:1 batch creates two parts HCl"
    );
  });
});
