/** @vitest-environment jsdom */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StrictMode, useCallback, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useGameStore } from "../application/store";
import { DEFAULT_GAME_RUNTIME } from "../game/runtime";
import { GameMap } from "./GameMap";
import type { MapSceneProps } from "./gameMap/MapScene";
import { mapViewFor, VIEWPORT_HEIGHT, VIEWPORT_WIDTH } from "./gameMap/mapGeometry";

vi.mock("./gameMap/MapScene", () => ({
  MapScene: ({ onPipeDragStart, onPipeDragEnd }: MapSceneProps) => (
    <>
      <canvas data-testid="map-canvas" />
      <button type="button" onPointerDown={() => onPipeDragStart("core")}>
        Begin pipe drag
      </button>
      <button type="button" onPointerUp={() => onPipeDragEnd("furnace")}>
        End pipe drag
      </button>
    </>
  ),
}));

const NO_CONNECT = () => undefined;

const MapFixture = ({ onConnect }: { onConnect: () => void }) => {
  const game = useGameStore((state) => state.game);
  const pipeMode = useGameStore((state) => state.pipeMode);
  const setPipeMode = useGameStore((state) => state.setPipeMode);
  const [connections, setConnections] = useState(0);
  const connect = useCallback(() => {
    onConnect();
    setConnections((count) => count + 1);
  }, [onConnect]);
  const togglePipeMode = useCallback(() => setPipeMode(!pipeMode), [pipeMode, setPipeMode]);
  return (
    <>
      <span data-testid="connections">{connections}</span>
      <GameMap
        game={game}
        selectedRoomId="switchyard"
        onSelectRoom={vi.fn()}
        onConnectRooms={connect}
        onTogglePipeMode={togglePipeMode}
        pipeMode={pipeMode}
      />
    </>
  );
};

beforeEach(() => {
  const game = DEFAULT_GAME_RUNTIME.execute(DEFAULT_GAME_RUNTIME.createScenario("claim_8_delta"), {
    type: "begin_level",
  }).state;
  useGameStore.setState({
    game,
    initialized: true,
    activeSlotId: "slot-1",
    pipeMode: false,
    pipePreview: null,
    graftMode: false,
    graftPreview: null,
    selectedTowerId: null,
    movingTowerId: null,
    towerBuildSelection: null,
    roomEffectPreview: null,
    notice: null,
  });
  vi.spyOn(HTMLCanvasElement.prototype, "getBoundingClientRect").mockReturnValue(
    new DOMRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT)
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const selectTower = () => {
  act(() =>
    useGameStore.getState().setTowerBuildSelection({
      chassisId: "flash_chamber",
      mountFace: "left_wall",
      orientation: "right",
    })
  );
};

const wallPoint = (height = 3.5) => {
  const { map } = useGameStore.getState().game.encounter;
  const room = map.rooms.switchyard!;
  const view = mapViewFor(map);
  const point = view.worldToViewportPoint(
    { x: room.bounds.column, elevation: room.bounds.elevation + height },
    view.initialCamera()
  );
  return { clientX: point.x, clientY: point.y };
};

describe("map construction input", () => {
  it("keeps camera, material, and pipe controls independent from an active placement", () => {
    render(<MapFixture onConnect={NO_CONNECT} />);
    selectTower();
    fireEvent.pointerMove(screen.getByTestId("map-canvas"), wallPoint());
    expect(screen.getByTestId("game-map").getAttribute("data-tower-preview-allowed")).toBe("true");
    const zoom = screen.getByRole("button", { name: /zoom in/i });
    fireEvent.keyDown(zoom, { key: "Enter" });
    fireEvent.click(zoom);
    fireEvent.click(screen.getByRole("button", { name: /fit/i }));
    fireEvent.change(screen.getByTestId("material-flow-overlay"), { target: { value: "oxygen" } });
    fireEvent.click(screen.getByTestId("material-flow-overlay"));
    fireEvent.keyDown(screen.getByTestId("material-flow-overlay"), { key: "r" });
    expect(useGameStore.getState().game.encounter.towers).toEqual({});
    expect(useGameStore.getState().towerBuildSelection?.orientation).toBe("right");

    fireEvent.click(screen.getByTestId("pipe-mode-toggle"));
    expect(useGameStore.getState().game.encounter.towers).toEqual({});
    expect(useGameStore.getState().towerBuildSelection).toBeNull();
    expect(useGameStore.getState().pipeMode).toBe(true);
    expect((screen.getByTestId("material-flow-overlay") as HTMLSelectElement).value).toBe("oxygen");
  });

  it("places at the clicked surface rather than a stale hover preview", () => {
    render(<MapFixture onConnect={NO_CONNECT} />);
    selectTower();
    fireEvent.pointerMove(screen.getByTestId("map-canvas"), wallPoint());
    fireEvent.click(screen.getByTestId("map-canvas"), wallPoint(5.5));
    const game = useGameStore.getState().game;
    expect(Object.values(game.encounter.towers)).toHaveLength(1);
    expect(Object.values(game.encounter.towers)[0]?.placement.anchor.elevation).toBe(
      game.encounter.map.rooms.switchyard!.bounds.elevation + 5
    );
  });

  it("announces the evaluated placement rejection and its actual Matter cost", () => {
    useGameStore.setState((state) => ({
      game: { ...state.game, encounter: { ...state.game.encounter, matter: 0 } },
    }));
    render(<MapFixture onConnect={NO_CONNECT} />);
    selectTower();
    fireEvent.click(screen.getByTestId("map-canvas"), wallPoint());
    const cost = DEFAULT_GAME_RUNTIME.definition.towers.flash_chamber.buildCost;
    expect(screen.getByRole("status").textContent).toBe(`This action requires ${cost} matter.`);
    fireEvent.click(screen.getByTestId("map-canvas"), wallPoint());
    expect(useGameStore.getState().game.encounter.towers).toEqual({});
  });

  it("completes a pipe drag once through an event, including in Strict Mode", () => {
    const onConnect = vi.fn();
    const errors = vi.spyOn(console, "error");
    useGameStore.getState().setPipeMode(true);
    render(
      <StrictMode>
        <MapFixture onConnect={onConnect} />
      </StrictMode>
    );
    fireEvent.pointerDown(screen.getByRole("button", { name: "Begin pipe drag" }));
    fireEvent.pointerUp(screen.getByRole("button", { name: "End pipe drag" }));
    expect(onConnect).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("connections").textContent).toBe("1");
    expect(errors).not.toHaveBeenCalled();
  });
});
