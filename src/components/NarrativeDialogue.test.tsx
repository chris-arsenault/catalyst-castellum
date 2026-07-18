/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GamePresentationProvider } from "../application/GamePresentationProvider";
import { NARRATIVE_SITES_BY_ID } from "../presentation/defaultGame";
import { DEFAULT_GAME_PRESENTATION } from "../presentation/services";
import { NarrativeDialogue } from "./NarrativeDialogue";

afterEach(cleanup);

describe("narrative dialogue", () => {
  it("presents one talking-head turn at a time before opening the mission briefing", () => {
    const onComplete = vi.fn();
    render(
      <GamePresentationProvider presentation={DEFAULT_GAME_PRESENTATION}>
        <NarrativeDialogue
          phase="briefing"
          site={NARRATIVE_SITES_BY_ID.claim_8_delta}
          onComplete={onComplete}
        />
      </GamePresentationProvider>
    );

    expect(screen.getByText("Malk Tern")).toBeTruthy();
    expect(screen.getByText(/Morning\. Eight-Delta is an abandoned gas plant/)).toBeTruthy();
    expect(screen.queryByText("Mavo")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Mavo")).toBeTruthy();
    expect(screen.queryByText("Malk Tern")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("T’kesh")).toBeTruthy();
    expect(onComplete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Open mission briefing" }));
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("leaves the final after-action line visible beside the intermission controls", () => {
    render(
      <GamePresentationProvider presentation={DEFAULT_GAME_PRESENTATION}>
        <NarrativeDialogue phase="debrief" site={NARRATIVE_SITES_BY_ID.claim_8_delta} />
      </GamePresentationProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText(/cutter’s clock lost six seconds/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Next" })).toBeNull();
  });
});
