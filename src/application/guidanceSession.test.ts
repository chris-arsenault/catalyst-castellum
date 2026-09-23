import { createStore, type StoreApi } from "zustand/vanilla";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_GAME_RUNTIME } from "../game/runtime";
import { DEFAULT_GAME_PRESENTATION } from "../presentation/services";
import { guideDefinitionFor, guideStepIndexFor, IDLE_GUIDE_UI } from "../tutorial/guideModel";
import { emptySaveSlotCatalog, type TutorialSession } from "./saveSlots";
import { createGameStoreState, type GameStore, type GameStoreDependencies } from "./store";

const dependencies = (): GameStoreDependencies => ({
  runtime: DEFAULT_GAME_RUNTIME,
  presentation: DEFAULT_GAME_PRESENTATION,
  loadSlots: vi.fn(emptySaveSlotCatalog),
  clearSlot: vi.fn(),
  scheduleSave: vi.fn(),
  cancelSave: vi.fn(),
  flushSave: vi.fn(),
});

const fixture = () => {
  const adapters = dependencies();
  const store = createStore<GameStore>(createGameStoreState(adapters));
  store.getState().initialize();
  store.getState().startNewGame("slot-1");
  expect(store.getState().dispatch({ type: "begin_level" })).toBe(true);
  return { store, adapters };
};

const inspectTower = (store: StoreApi<GameStore>) => {
  expect(
    store.getState().dispatch({
      type: "place_tower",
      chassisId: "flash_chamber",
      anchor: { column: 6, elevation: 8 },
      mountFace: "left_wall",
      orientation: "right",
    })
  ).toBe(true);
  const towerId = Object.keys(store.getState().game.encounter.towers)[0]!;
  store.getState().selectTower(towerId);
  store.getState().selectTower(null);
  return towerId;
};

const activeStep = (state: GameStore) => {
  const guide = guideDefinitionFor(state.game);
  if (!guide) throw new Error("Missing guide");
  return guide.steps[guideStepIndexFor(state.game, guide, IDLE_GUIDE_UI, state.guideEvidence)]?.id;
};

describe("run-owned guide observations", () => {
  it("records transient selection before deselection, without a React render", () => {
    const { store, adapters } = fixture();
    store.getState().setTowerBuildSelection({
      chassisId: "flash_chamber",
      mountFace: "left_wall",
      orientation: "right",
    });
    store.getState().setTowerBuildSelection(null);
    expect(activeStep(store.getState())).toBe("mount-flash-chamber");
    inspectTower(store);
    expect(activeStep(store.getState())).toBe("start-assault");
    expect(adapters.scheduleSave).toHaveBeenLastCalledWith("slot-1", store.getState().game, {
      dismissedGuideIds: [],
      guidanceEnabled: true,
      guideEvidence: store.getState().guideEvidence,
    });
  });

  it("restores completed observations from the run and keeps them after dismantling", () => {
    const { store } = fixture();
    const towerId = inspectTower(store);
    expect(store.getState().dispatch({ type: "dismantle_tower", towerId })).toBe(true);
    expect(activeStep(store.getState())).toBe("start-assault");
    const catalog = emptySaveSlotCatalog();
    catalog["slot-1"] = {
      id: "slot-1",
      game: store.getState().game,
      savedAt: 1,
      dismissedGuideIds: [],
      guidanceEnabled: true,
      guideEvidence: store.getState().guideEvidence,
    };
    const restored = createStore<GameStore>(
      createGameStoreState({ ...dependencies(), loadSlots: () => catalog })
    );
    restored.getState().initialize();
    restored.getState().selectSaveSlot("slot-1");
    expect(restored.getState().selectedTowerId).toBeNull();
    expect(activeStep(restored.getState())).toBe("start-assault");
    expect(Object.values(restored.getState().guideEvidence)[0]?.tasks).toContain("mount-defense");
  });
});

describe("guide replay and run boundaries", () => {
  it("clears this guide's observations on replay and all observations on a new run", () => {
    const { store, adapters } = fixture();
    inspectTower(store);
    const game = store.getState().game;
    store.getState().restartTutorialGuide();
    expect(store.getState().guideEvidence).toEqual({});
    expect(store.getState().game).toBe(game);
    expect(activeStep(store.getState())).toBe("inspect-coverage");
    expect(adapters.scheduleSave).toHaveBeenLastCalledWith("slot-1", game, {
      dismissedGuideIds: [],
      guidanceEnabled: true,
      guideEvidence: {},
    });
    store.getState().selectTower(Object.keys(game.encounter.towers)[0]!);
    expect(activeStep(store.getState())).toBe("start-assault");
    store.getState().reset();
    expect(store.getState().guideEvidence).toEqual({});
    store.getState().dispatch({ type: "begin_level" });
    expect(activeStep(store.getState())).toBe("inspect-route");
  });

  it("retains learned observations when an operation checkpoint is retried", () => {
    const { store } = fixture();
    inspectTower(store);
    expect(store.getState().dispatch({ type: "start_assault" })).toBe(true);
    const evidence = store.getState().guideEvidence;
    const game = store.getState().game;
    store.setState({
      game: { ...game, phase: "defeat", encounter: { ...game.encounter, coreIntegrity: 0 } },
    });
    expect(store.getState().dispatch({ type: "retry_level" })).toBe(true);
    expect(store.getState().game.campaign.retryCount).toBe(1);
    expect(store.getState().guideEvidence).toEqual(evidence);
  });

  it("keeps observations isolated between slots", () => {
    const { store, adapters } = fixture();
    inspectTower(store);
    const remembered: TutorialSession = {
      dismissedGuideIds: [],
      guidanceEnabled: true,
      guideEvidence: store.getState().guideEvidence,
    };
    store.getState().startNewGame("slot-2");
    expect(store.getState().guideEvidence).toEqual({});
    expect(adapters.scheduleSave).toHaveBeenCalledWith("slot-1", expect.anything(), remembered);
  });
});
