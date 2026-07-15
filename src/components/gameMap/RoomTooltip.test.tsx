/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { createScenarioGame } from "../../game/simulation";
import { RoomTooltip } from "./RoomTooltip";
import { gasConduitState, roomState } from "../../game/world/instances";

afterEach(cleanup);

describe("room map detail", () => {
  it("shows complete layered composition and distinguishes static pressure from a flash pulse", () => {
    const game = createScenarioGame("flash_point");
    roomState(game, "furnace").gas.upper.hydrogen = 18;
    roomState(game, "furnace").gas.upper.oxygen = 9;
    roomState(game, "furnace").gas.lower.hydrogen = 7;
    roomState(game, "furnace").gasTemperature.lower = 72;
    roomState(game, "furnace").pressurePulse = 38;
    gasConduitState(game, "core_furnace").flowCause = "fan";
    gasConduitState(game, "core_furnace").lastFlow = 1.4;

    render(<RoomTooltip game={game} roomId="furnace" />);

    const tooltip = screen.getByTestId("room-map-tooltip");
    expect(tooltip.textContent).toContain("H₂");
    expect(tooltip.textContent).toContain("O₂");
    expect(tooltip.textContent).toContain("N₂");
    expect(tooltip.textContent).toContain("Static pressure");
    expect(tooltip.textContent).toContain("OX-1 pulse+38 kPa");
    expect(tooltip.textContent).toContain("2 open passages");
    expect(tooltip.textContent).toContain("THERMAL");
    expect(tooltip.textContent).toContain("Thermal exposure begins above 60 °C");
  });
});
