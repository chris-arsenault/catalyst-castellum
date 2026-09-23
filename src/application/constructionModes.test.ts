import { createStore } from "zustand/vanilla";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_GAME_RUNTIME } from "../game/runtime";
import { DEFAULT_GAME_PRESENTATION } from "../presentation/services";
import { emptySaveSlotCatalog } from "./saveSlots";
import { createGameStoreState, type GameStore } from "./store";

const constructionStore = () =>
  createStore<GameStore>(
    createGameStoreState({
      runtime: DEFAULT_GAME_RUNTIME,
      presentation: DEFAULT_GAME_PRESENTATION,
      loadSlots: emptySaveSlotCatalog,
      clearSlot: vi.fn(),
      scheduleSave: vi.fn(),
      cancelSave: vi.fn(),
      flushSave: vi.fn(),
    })
  );

const selection = {
  chassisId: "flash_chamber",
  mountFace: "left_wall",
  orientation: "right",
} as const;

describe("construction mode transitions", () => {
  it.each(["pipe", "graft"] as const)("leaves tower placement when entering %s mode", (mode) => {
    const store = constructionStore();
    store.getState().setTowerBuildSelection(selection);
    store.setState({ movingTowerId: "tower:moving", manualSection: "threats" });

    if (mode === "pipe") store.getState().setPipeMode(true);
    else store.getState().setGraftMode(true);

    expect(store.getState()).toMatchObject({
      towerBuildSelection: null,
      movingTowerId: null,
      pipeMode: mode === "pipe",
      graftMode: mode === "graft",
      manualSection: "threats",
    });
  });

  it("clears the previous construction preview on every mode switch", () => {
    const store = constructionStore();
    store.getState().setPipeMode(true);
    store.getState().setPipePreview({
      fromRoomId: "core",
      toRoomId: "furnace",
      anchor: { x: 0, y: 0 },
      selectedKind: "gas_line",
      options: [],
    });
    store.getState().setGraftMode(true);
    expect(store.getState()).toMatchObject({ pipeMode: false, pipePreview: null, graftMode: true });

    store.getState().setGraftPreview({ hostRoomId: "core", graftSlotId: "graft", options: [] });
    store.getState().setPipeMode(true);
    expect(store.getState()).toMatchObject({
      graftMode: false,
      graftPreview: null,
      pipeMode: true,
    });

    store.getState().setTowerBuildSelection(selection);
    expect(store.getState()).toMatchObject({
      towerBuildSelection: selection,
      pipeMode: false,
      graftMode: false,
      pipePreview: null,
      graftPreview: null,
    });
  });

  it("closing an inactive board preserves the current construction tool", () => {
    const store = constructionStore();
    store.getState().setTowerBuildSelection(selection);
    store.getState().setPipeMode(false);
    store.getState().setGraftMode(false);
    expect(store.getState().towerBuildSelection).toEqual(selection);
    store.getState().setPipeMode(true);
    store.getState().setGraftMode(false);
    expect(store.getState().pipeMode).toBe(true);
  });
});
