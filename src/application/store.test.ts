import { createStore } from "zustand/vanilla";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_GAME_RUNTIME } from "../game/runtime";
import { LEVEL_IDS } from "../game/types";
import { guideDefinitionFor } from "../tutorial/guideModel";
import { emptySaveSlotCatalog, type SaveSlotRecord } from "./saveSlots";
import { createGameStoreState, type GameStore, type GameStoreDependencies } from "./store";
import { DEFAULT_GAME_PRESENTATION } from "../presentation/services";

const dependencies = (overrides: Partial<GameStoreDependencies> = {}): GameStoreDependencies => ({
  runtime: DEFAULT_GAME_RUNTIME,
  presentation: DEFAULT_GAME_PRESENTATION,
  loadSlots: vi.fn(emptySaveSlotCatalog),
  clearSlot: vi.fn(),
  scheduleSave: vi.fn(),
  cancelSave: vi.fn(),
  flushSave: vi.fn(),
  ...overrides,
});

const saveRecord = (overrides: Partial<SaveSlotRecord> = {}): SaveSlotRecord => ({
  id: "slot-1",
  game: DEFAULT_GAME_RUNTIME.createScenario("make_the_reagent"),
  dismissedGuideIds: ["guide-1"],
  guidanceEnabled: true,
  savedAt: 1234,
  ...overrides,
});

describe("game store composition", () => {
  it("enumerates saves without automatically loading a game", () => {
    const adapters = dependencies();
    const store = createStore<GameStore>(createGameStoreState(adapters));

    expect(store.getState().initialized).toBe(false);
    expect(adapters.loadSlots).not.toHaveBeenCalled();

    store.getState().initialize();
    store.getState().initialize();
    expect(adapters.loadSlots).toHaveBeenCalledTimes(1);
    expect(store.getState()).toMatchObject({ initialized: true, activeSlotId: null });
  });

  it("restores game and tutorial progress only after selecting an occupied slot", () => {
    const restored = saveRecord();
    const catalog = emptySaveSlotCatalog();
    catalog["slot-1"] = restored;
    const store = createStore<GameStore>(
      createGameStoreState(dependencies({ loadSlots: vi.fn(() => catalog) }))
    );

    store.getState().initialize();
    expect(store.getState().activeSlotId).toBeNull();
    store.getState().selectSaveSlot("slot-1");
    expect(store.getState()).toMatchObject({
      activeSlotId: "slot-1",
      game: restored.game,
      selectedRoomId: DEFAULT_GAME_RUNTIME.level(restored.game).focusRoomId,
      dismissedGuideIds: ["guide-1"],
      tutorialSessionRevision: 1,
    });
  });

  it("does not tick or dispatch before a slot is active", () => {
    const adapters = dependencies();
    const store = createStore<GameStore>(createGameStoreState(adapters));
    store.getState().initialize();
    const initial = store.getState().game;

    store.getState().tick(1);
    expect(store.getState().game).toBe(initial);
    expect(store.getState().dispatch({ type: "begin_level" })).toBe(false);
    expect(store.getState().notice).toContain("Choose a save slot");
    expect(adapters.scheduleSave).not.toHaveBeenCalled();
  });

  it("carries a socket target through the build manual and clears it on close", () => {
    const store = createStore<GameStore>(createGameStoreState(dependencies()));

    store.getState().openEquipmentBuild("furnace", "socket_a");
    expect(store.getState()).toMatchObject({
      showHelp: true,
      manualSection: "build",
      equipmentBuildTarget: { roomId: "furnace", socketId: "socket_a" },
    });

    store.getState().setManualSection("encyclopedia");
    expect(store.getState().equipmentBuildTarget).toEqual({
      roomId: "furnace",
      socketId: "socket_a",
    });
    store.getState().closeManual();
    expect(store.getState()).toMatchObject({ showHelp: false, equipmentBuildTarget: null });
  });
});

describe("debug save-slot starts", () => {
  it("starts the existing chlorine tutorial from its empty authored checkpoint", () => {
    const store = createStore<GameStore>(createGameStoreState(dependencies()));
    store.getState().initialize();

    store.getState().startNewGameAtLevel("slot-2", "make_the_reagent");

    expect(store.getState().game.phase).toBe("level_briefing");
    expect(
      Object.values(store.getState().game.rooms).flatMap((room) =>
        Object.values(room.equipment).filter((equipment) => equipment !== null)
      )
    ).toEqual([]);

    expect(store.getState().dispatch({ type: "begin_level" })).toBe(true);
    expect(guideDefinitionFor(store.getState().game)?.id).toBe("make_the_reagent:co_products:v1");
  });

  it("starts a debug campaign at an authored level with earlier sites completed", () => {
    const adapters = dependencies();
    const store = createStore<GameStore>(createGameStoreState(adapters));
    store.getState().initialize();

    store.getState().startNewGameAtLevel("slot-2", "pell_cut");

    const game = store.getState().game;
    expect(game).toMatchObject({
      phase: "level_briefing",
      campaign: {
        levelId: "pell_cut",
        levelIndex: LEVEL_IDS.indexOf("pell_cut"),
        roundIndex: 0,
        completedLevelIds: LEVEL_IDS.slice(0, LEVEL_IDS.indexOf("pell_cut")),
      },
    });
    expect(DEFAULT_GAME_RUNTIME.validate(game)).toEqual([]);
    expect(store.getState()).toMatchObject({
      activeSlotId: "slot-2",
      selectedRoomId: DEFAULT_GAME_RUNTIME.level(game).focusRoomId,
      dismissedGuideIds: [],
      tutorialSessionRevision: 1,
    });
    expect(adapters.scheduleSave).toHaveBeenLastCalledWith("slot-2", game, {
      dismissedGuideIds: [],
      guidanceEnabled: true,
    });
  });
});

describe("active save-slot lifecycle", () => {
  it("persists accepted commands and live ticks to the active slot", () => {
    const adapters = dependencies();
    const store = createStore<GameStore>(createGameStoreState(adapters));
    store.getState().initialize();
    store.getState().startNewGame("slot-2");

    expect(store.getState().dispatch({ type: "begin_level" })).toBe(true);
    expect(store.getState().dispatch({ type: "start_prime" })).toBe(true);
    const beforeTick = store.getState().game;
    store.getState().tick(0.1);
    expect(store.getState().game).not.toBe(beforeTick);
    expect(adapters.scheduleSave).toHaveBeenCalledTimes(4);
    expect(adapters.scheduleSave).toHaveBeenLastCalledWith("slot-2", store.getState().game, {
      dismissedGuideIds: [],
      guidanceEnabled: true,
    });
  });

  it("resets the active slot as one game-and-tutorial transaction", () => {
    const adapters = dependencies();
    const store = createStore<GameStore>(createGameStoreState(adapters));
    store.getState().initialize();
    store.getState().startNewGame("slot-1");
    store.setState({ dismissedGuideIds: ["flash_point:first_spark:v3"] });
    store.getState().selectRoom("washlock");
    const revision = store.getState().tutorialSessionRevision;

    store.getState().reset();

    expect(adapters.cancelSave).toHaveBeenLastCalledWith("slot-1");
    expect(adapters.clearSlot).toHaveBeenLastCalledWith("slot-1");
    expect(adapters.scheduleSave).toHaveBeenLastCalledWith("slot-1", store.getState().game, {
      dismissedGuideIds: [],
      guidanceEnabled: true,
    });
    expect(store.getState()).toMatchObject({
      activeSlotId: "slot-1",
      dismissedGuideIds: [],
      selectedRoomId: "furnace",
      tutorialSessionRevision: revision + 1,
    });
  });

  it("carries the chosen guidance setting through a run, a reload, and a restart", () => {
    const adapters = dependencies();
    const store = createStore<GameStore>(createGameStoreState(adapters));
    store.getState().initialize();

    store.getState().startNewGame("slot-1", false);
    expect(store.getState().guidanceEnabled).toBe(false);
    expect(adapters.scheduleSave).toHaveBeenLastCalledWith("slot-1", store.getState().game, {
      dismissedGuideIds: [],
      guidanceEnabled: false,
    });

    // Restarting the same slot keeps the run's choice rather than re-asking.
    store.getState().reset();
    expect(store.getState().guidanceEnabled).toBe(false);

    const catalog = emptySaveSlotCatalog();
    catalog["slot-2"] = saveRecord({ id: "slot-2", guidanceEnabled: false });
    const reloaded = createStore<GameStore>(
      createGameStoreState(dependencies({ loadSlots: vi.fn(() => catalog) }))
    );
    reloaded.getState().initialize();
    reloaded.getState().selectSaveSlot("slot-2");
    expect(reloaded.getState().guidanceEnabled).toBe(false);
  });

  it("flushes the active save and reloads the catalog before returning to the menu", () => {
    const refreshed = emptySaveSlotCatalog();
    refreshed["slot-3"] = saveRecord({ id: "slot-3" });
    const adapters = dependencies({ loadSlots: vi.fn(() => refreshed) });
    const store = createStore<GameStore>(createGameStoreState(adapters));
    store.getState().initialize();
    store.getState().selectSaveSlot("slot-3");

    store.getState().returnToMainMenu();

    expect(adapters.flushSave).toHaveBeenCalledOnce();
    expect(adapters.loadSlots).toHaveBeenCalledTimes(2);
    expect(store.getState()).toMatchObject({ activeSlotId: null, saveSlots: refreshed });
  });
});
