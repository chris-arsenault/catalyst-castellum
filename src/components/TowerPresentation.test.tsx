/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useGameStore } from "../application/store";
import { GamePresentationProvider } from "../application/GamePresentationProvider";
import { towerVariantFixture } from "../presentation/__fixtures__/towerVariant";
import { createGamePresentation } from "../presentation/services";
import { EN_LOCALE } from "../localization/locales/en";
import { TowerPanel } from "./TowerPanel";
import { TowerBuildCatalog } from "./manual/TowerBuildCatalog";
import { GameMap } from "./GameMap";

vi.mock("./gameMap/MapScene", () => ({ MapScene: () => <canvas data-testid="map-canvas" /> }));
const initial = useGameStore.getState();
afterEach(() => {
  cleanup();
  useGameStore.setState(initial, true);
});

const fixture = () => {
  const { runtime, game, tower } = towerVariantFixture();
  const presentation = createGamePresentation(runtime, EN_LOCALE);
  const dispatch = vi.fn(() => true);
  const setTowerBuildSelection = vi.fn();
  useGameStore.setState({
    game,
    selectedTowerId: tower.id,
    towerBuildSelection: null,
    dispatch,
    setTowerBuildSelection,
  });
  return { runtime, game, tower, presentation, dispatch, setTowerBuildSelection };
};

describe("variant tower controls", () => {
  it("shows injected build/upgrade numbers, targeting and aim choices", () => {
    const { presentation, dispatch, tower } = fixture();
    render(
      <GamePresentationProvider presentation={presentation}>
        <TowerPanel />
      </GamePresentationProvider>
    );
    const palette = screen.getByTestId("tower-build-flash_chamber");
    expect(palette.textContent).toContain("29 M");
    expect(palette.querySelector("rect")?.getAttribute("fill")).toBe("#123abc");
    expect(screen.getByText("Range 5")).toBeTruthy();
    expect(screen.getByText("Cadence 2/s")).toBeTruthy();
    expect(screen.getByText("Damage 40")).toBeTruthy();
    expect(screen.queryByTestId("tower-rotate-left")).toBeNull();
    expect(screen.getByTestId("tower-rotate-right")).toBeTruthy();
    expect(screen.queryByTestId("tower-target-first")).toBeNull();
    expect(screen.getByTestId("tower-target-strongest")).toBeTruthy();
    const upgrade = screen.getByTestId("tower-upgrade-flash_calibration");
    expect(upgrade.textContent).toContain("7 M");
    expect(upgrade.textContent).toContain("40→60");
    expect(upgrade.textContent).toContain("2→2.5");
    expect(upgrade.textContent).toContain("5→6");
    fireEvent.click(upgrade);
    expect(dispatch).toHaveBeenCalledWith({
      type: "upgrade_tower",
      towerId: tower.id,
      upgradeId: "flash_calibration",
    });
  });

  it("starts placement with the injected default mount and orientation", () => {
    const { presentation, setTowerBuildSelection } = fixture();
    render(
      <GamePresentationProvider presentation={presentation}>
        <TowerPanel />
      </GamePresentationProvider>
    );
    fireEvent.click(screen.getByTestId("tower-build-flash_chamber"));
    expect(setTowerBuildSelection).toHaveBeenCalledWith({
      chassisId: "flash_chamber",
      mountFace: "ceiling",
      orientation: "down",
    });
  });
});

describe("variant manual and map", () => {
  it("shows the same variant catalog, damage, color and placement default in the manual", () => {
    const { presentation, setTowerBuildSelection } = fixture();
    render(
      <GamePresentationProvider presentation={presentation}>
        <TowerBuildCatalog />
      </GamePresentationProvider>
    );
    const choice = screen.getByTestId("manual-tower-choice-flash_chamber");
    expect(choice.textContent).toContain("29 M");
    expect(choice.querySelector("svg")?.getAttribute("color")).toBe("#123abc");
    const page = screen.getByTestId("manual-tower-page");
    expect(within(page).getByText("40")).toBeTruthy();
    fireEvent.click(screen.getByTestId("manual-place-tower-flash_chamber"));
    expect(setTowerBuildSelection).toHaveBeenCalledWith({
      chassisId: "flash_chamber",
      mountFace: "ceiling",
      orientation: "down",
    });
  });

  it("cycles placement aim through the injected orientation list", () => {
    const { presentation, game, setTowerBuildSelection } = fixture();
    useGameStore.setState({
      towerBuildSelection: {
        chassisId: "flash_chamber",
        mountFace: "ceiling",
        orientation: "down",
      },
    });
    render(
      <GamePresentationProvider presentation={presentation}>
        <GameMap
          game={game}
          selectedRoomId="switchyard"
          onSelectRoom={vi.fn()}
          onConnectRooms={vi.fn()}
          onTogglePipeMode={vi.fn()}
          pipeMode={false}
        />
      </GamePresentationProvider>
    );
    fireEvent.keyDown(window, { key: "r" });
    expect(setTowerBuildSelection).toHaveBeenCalledWith({
      chassisId: "flash_chamber",
      mountFace: "ceiling",
      orientation: "right",
    });
  });
});
