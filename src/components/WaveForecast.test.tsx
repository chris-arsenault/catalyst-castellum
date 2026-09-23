/** @vitest-environment jsdom */
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DEFAULT_GAME_RUNTIME } from "../game/runtime";
import { WaveForecastDetails, WaveForecastStrip } from "./WaveForecast";
import { GamePresentationProvider } from "../application/GamePresentationProvider";
import { createGamePresentation } from "../presentation/services";
import { TEST_LOCALE } from "../localization/locales/test";

afterEach(cleanup);

describe("per-route wave forecast", () => {
  it("uses injected locale copy for each route's timing and composition", () => {
    const game = DEFAULT_GAME_RUNTIME.createScenario("pell_cut");
    game.campaign.roundIndex = 1;
    const presentation = createGamePresentation(DEFAULT_GAME_RUNTIME, TEST_LOCALE);
    render(
      <GamePresentationProvider presentation={presentation}>
        <WaveForecastStrip game={game} />
      </GamePresentationProvider>
    );
    expect(screen.getByText("⟦Arrivals 1–13 s after assault starts⟧")).toBeTruthy();
    expect(screen.getByText("⟦7 × ⟦Clatter⟧⟧")).toBeTruthy();
  });

  it("keeps each ingress's enemies and arrival timing together in both views", () => {
    const game = DEFAULT_GAME_RUNTIME.createScenario("pell_cut");
    game.campaign.roundIndex = 1;
    render(
      <>
        <WaveForecastStrip game={game} />
        <WaveForecastDetails game={game} />
      </>
    );
    for (const id of ["wave-forecast-strip", "wave-forecast-details"]) {
      const forecast = screen.getByTestId(id);
      const first = forecast.querySelector('[data-route-id="array_one"]');
      const second = forecast.querySelector('[data-route-id="array_two"]');
      if (!(first instanceof HTMLElement) || !(second instanceof HTMLElement))
        throw new Error("Missing active route");
      expect(within(first).getByText("8 × Flintjack")).toBeTruthy();
      expect(within(first).queryByText("7 × Clatter")).toBeNull();
      expect(within(second).getByText("7 × Clatter")).toBeTruthy();
      expect(within(second).getByText("4 × Glowbag")).toBeTruthy();
      expect(within(second).getByText("Arrivals 1–13 s after assault starts")).toBeTruthy();
      expect(forecast.querySelector('[data-route-id="array_three"]')).toBeNull();
    }
  });
});
