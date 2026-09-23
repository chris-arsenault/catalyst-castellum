/** @vitest-environment jsdom */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createCatalystExerciseRuntime, type ExerciseRuntime } from "../game/exercise";
import { useEncounterSurface } from "../application/encounterSurface";
import { encodeExerciseSession, EXERCISE_SAVE_KEY } from "../application/exerciseStorage";
import { ExerciseApp } from "./ExerciseApp";

vi.mock("../application/useExerciseAudio", () => ({ useExerciseAudio: () => undefined }));
vi.mock("./AudioControls", () => ({ AudioControls: () => null }));
vi.mock("./gameMap/EncounterMap", () => ({
  EncounterMap: () => {
    const surface = useEncounterSurface();
    return (
      <button
        type="button"
        onClick={() =>
          surface.setInteraction({
            kind: "inspect",
            towerId: Object.keys(surface.encounter.towers)[0] ?? null,
          })
        }
      >
        Inspect installed defense
      </button>
    );
  },
}));

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
  localStorage.clear();
});

describe("exercise application recovery and clock", () => {
  it("shows an incompatible save and starts fresh only after the explicit action", () => {
    localStorage.setItem(EXERCISE_SAVE_KEY, "{broken");
    localStorage.setItem("campaign-sentinel", "retained");
    render(<ExerciseApp runtime={createCatalystExerciseRuntime()} />);
    expect(screen.queryByTestId("start-assault")).toBeNull();
    expect(localStorage.getItem(EXERCISE_SAVE_KEY)).toBe("{broken");
    fireEvent.click(screen.getByRole("button", { name: "Start fresh exercise" }));
    expect(screen.getByTestId("start-assault")).toBeTruthy();
    expect(localStorage.getItem("campaign-sentinel")).toBe("retained");
  });

  it("pauses immediately while guidance and speed remain independently controlled", () => {
    const runtime = createCatalystExerciseRuntime();
    const advance = vi.spyOn(runtime, "advanceTicks");
    let now = 0;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    render(<ExerciseApp runtime={runtime} />);
    fireEvent.click(screen.getByTestId("start-assault"));
    act(() => {
      now = 100;
      vi.advanceTimersByTime(50);
    });
    expect(advance).toHaveBeenCalledTimes(1);
    expect(advance.mock.calls[0]![1]).toBe(1);
    fireEvent.click(screen.getByRole("button", { name: "Pause simulation" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Show wave guidance" }));
    fireEvent.click(screen.getByTestId("simulation-speed"));
    expect(screen.getByTestId("simulation-speed").textContent).toContain("2×");
    expect(
      (screen.getByRole("checkbox", { name: "Show wave guidance" }) as HTMLInputElement).checked
    ).toBe(false);
    act(() => {
      now = 5100;
      vi.advanceTimersByTime(5000);
    });
    expect(advance).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Resume simulation" }));
    act(() => {
      now = 5150;
      vi.advanceTimersByTime(50);
    });
    expect(advance).toHaveBeenCalledTimes(2);
    expect(advance.mock.calls[1]![1]).toBe(1);
  });
});

const projectionRuntime = (): ExerciseRuntime => {
  const base = createCatalystExerciseRuntime();
  const prepared = base.execute(base.create(), {
    type: "place_tower",
    chassisId: "flash_chamber",
    anchor: { column: 7, elevation: 7 },
    mountFace: "left_wall",
    orientation: "right",
  }).state;
  const runtime: ExerciseRuntime = {
    ...base,
    create: () => prepared,
    context: (state) => {
      const context = base.context(state);
      return {
        ...context,
        definition: {
          ...context.definition,
          wave: [
            { tick: 10, type: "deckmouth", level: 20, routeId: "lower" },
            { tick: 30, type: "flintjack", level: 20, routeId: "upper" },
          ],
        },
        combat: {
          ...context.combat,
          towers: {
            ...context.combat.towers,
            flash_chamber: {
              ...context.combat.towers.flash_chamber!,
              buildCost: 137,
              range: 12,
              cadence: 1.25,
              color: "#123abc",
              attack: {
                ...context.combat.towers.flash_chamber!.attack,
                packets: [
                  {
                    sourceId: "tower_flash",
                    channels: {
                      atmosphere: 0,
                      corrosion: 0,
                      heat: 99,
                      pressure: 0,
                      radiation: 0,
                    },
                  },
                ],
              },
            },
          },
        },
      };
    },
  };
  return runtime;
};

describe("injected exercise presentation", () => {
  it("projects supplied tower coefficients, colors, and per-route wave timing", () => {
    const runtime = projectionRuntime();
    render(<ExerciseApp runtime={runtime} />);
    const build = screen.getByTestId("tower-build-flash_chamber");
    expect(build.textContent).toContain("Place · 137 M");
    expect(build.querySelector("rect")?.getAttribute("fill")).toBe("#123abc");
    fireEvent.click(screen.getByRole("button", { name: "Inspect installed defense" }));
    expect(screen.getByText("Range 12")).toBeTruthy();
    expect(screen.getByText("Cadence 1.25/s")).toBeTruthy();
    expect(screen.getByText("Damage 99")).toBeTruthy();
    expect(screen.getByText("Incoming: 2 · 1–3 s")).toBeTruthy();
    const lower = screen.getByRole("button", { name: "lower · 1 enemies · 1–1 s" });
    const upper = screen.getByRole("button", { name: "upper · 1 enemies · 3–3 s" });
    fireEvent.click(lower);
    expect(lower.getAttribute("aria-pressed")).toBe("true");
    expect(upper.getAttribute("aria-pressed")).toBe("false");
  });

  it("offers retry from a persisted terminal report and restores its paid defense", () => {
    const runtime = createCatalystExerciseRuntime();
    let prepared = runtime.create();
    for (const column of [7, 20])
      prepared = runtime.execute(prepared, {
        type: "place_tower",
        chassisId: "flash_chamber",
        anchor: { column, elevation: 7 },
        mountFace: "left_wall",
        orientation: "right",
      }).state;
    const finished = runtime.advanceTicks(
      runtime.execute(prepared, { type: "start_assault" }).state,
      1800
    );
    localStorage.setItem(
      EXERCISE_SAVE_KEY,
      encodeExerciseSession({ state: finished, guidance: false, evidence: ["coverage"] }, runtime)
    );
    render(<ExerciseApp runtime={runtime} />);
    expect(screen.getByTestId("exercise-report")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry this wave" }));
    expect(screen.queryByTestId("exercise-report")).toBeNull();
    expect(screen.getByTestId("start-assault")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Inspect installed defense" }));
    expect(screen.getByText("Damage 24")).toBeTruthy();
    expect(
      (screen.getByRole("checkbox", { name: "Show wave guidance" }) as HTMLInputElement).checked
    ).toBe(false);
  });
});
