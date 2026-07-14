/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DEFAULT_GAME_RUNTIME } from "../game/runtime";
import { TEST_LOCALE } from "../localization/locales/test";
import { createGamePresentation } from "../presentation/services";
import { OperationsManual } from "../components/manual/OperationsManual";
import { GamePresentationProvider } from "./GamePresentationProvider";

afterEach(cleanup);

describe("game presentation context", () => {
  it("renders static interface copy from an alternate locale without component changes", () => {
    const presentation = createGamePresentation(DEFAULT_GAME_RUNTIME, TEST_LOCALE);
    render(
      <GamePresentationProvider presentation={presentation}>
        <OperationsManual />
      </GamePresentationProvider>
    );

    expect(screen.getByRole("heading", { name: "⟦Run the defense machine⟧" })).toBeTruthy();
    expect(
      screen.getByText(
        "⟦Configure equipment, conduits, and feedstocks while simulation time is frozen.⟧"
      )
    ).toBeTruthy();
  });
});
