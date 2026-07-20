/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LEVEL_IDS } from "../game/types";
import { SaveSlotScreen } from "./SaveSlotScreen";

afterEach(cleanup);

describe("debug campaign launcher", () => {
  it("offers every authored site in development builds", () => {
    render(<SaveSlotScreen />);

    expect(screen.getByTestId("debug-start-game").textContent).toContain("Start at site");
    const siteSelect = screen.getByTestId("debug-start-level") as HTMLSelectElement;
    expect(siteSelect.options).toHaveLength(LEVEL_IDS.length);
    expect([...siteSelect.options].map((option) => option.value)).toEqual(LEVEL_IDS);
    expect(
      [...siteSelect.options].find((option) => option.value === "make_the_reagent")?.textContent
    ).toBe("LEVEL 2 · Make the Reagent · GUIDED");
    expect(
      [...siteSelect.options].find((option) => option.value === "stored_chlorine")?.textContent
    ).toBe("LEVEL 3 · Stored Chlorine · DEFENSE");
  });
});
