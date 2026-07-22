import { expect, test, type Page } from "@playwright/test";
import { roomCenterWorld } from "../../src/game/config";
import type { RoomId, WorldPoint } from "../../src/game/types";
import { mapViewFor, type CameraTransform } from "../../src/components/gameMap/mapGeometry";
import { WORLD_MAP } from "../../src/game/content/worldMap";
import { installEquipment, skipGuidance, startGuidedTutorial } from "./tutorialAssertions";

const mapCamera = async (page: Page): Promise<CameraTransform> => {
  const map = page.getByTestId("game-map");
  return {
    x: Number(await map.getAttribute("data-camera-x")),
    y: Number(await map.getAttribute("data-camera-y")),
    zoom: Number(await map.getAttribute("data-camera-zoom")),
  };
};

const worldClientPoint = async (page: Page, worldPoint: WorldPoint) => {
  const bounds = await page.locator("canvas").boundingBox();
  if (!bounds) throw new Error("Pixi canvas did not produce a bounding box");
  return mapViewFor(WORLD_MAP).worldToClientPoint(worldPoint, await mapCamera(page), bounds);
};

const roomClientPoint = async (page: Page, roomId: RoomId) =>
  worldClientPoint(page, roomCenterWorld(roomId));

const clickMapRoom = async (page: Page, roomId: RoomId): Promise<void> => {
  const point = await roomClientPoint(page, roomId);
  await page.mouse.click(point.x, point.y);
};

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("save-selection")).toBeVisible();
  await expect(page.getByTestId("new-game-slot-1")).toBeVisible();
});

test("pipe mode dims the plant and drag-connecting rooms reports the routed state", async ({
  page,
}) => {
  await startGuidedTutorial(page);
  await skipGuidance(page);

  await page.getByTestId("pipe-mode-toggle").click();
  await expect(page.getByTestId("game-map")).toHaveAttribute("data-pipe-mode", "true");
  await expect(page.getByTestId("pipe-board")).toBeVisible();
  await expect(page.getByTestId("pipe-mode-hint")).toContainText("Drag between two rooms");
  await expect(page.getByTestId("room-inspector")).toHaveCount(0);
  await expect(page.getByTestId("pipe-run-gas:core__furnace")).toContainText("CORE ⇄ R-02");

  const core = await roomClientPoint(page, "core");
  const furnace = await roomClientPoint(page, "furnace");
  await page.mouse.move(core.x, core.y);
  await page.mouse.down();
  await page.mouse.move(furnace.x, furnace.y, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByTestId("pipe-confirm-popup")).toContainText("CORE ⇄ R-02");
  await expect(page.getByTestId("pipe-confirm-gas_line")).toBeDisabled();
  await page.getByTestId("pipe-confirm-cancel").click();
  await expect(page.getByTestId("pipe-confirm-popup")).toHaveCount(0);

  await page.getByTestId("pipe-board-close").click();
  await expect(page.getByTestId("game-map")).toHaveAttribute("data-pipe-mode", "false");
  await expect(page.getByTestId("room-inspector")).toBeVisible();
});

test("the first lesson exposes its route and complete equipment catalog", async ({ page }) => {
  await startGuidedTutorial(page);
  await skipGuidance(page);
  await page.getByTestId("pipe-mode-toggle").click();
  const board = page.getByTestId("pipe-board");
  await expect(board.getByText("Core–R-02 gas duct", { exact: true })).toBeVisible();
  await expect(page.getByTestId("conduit-panel-gas:core__furnace")).toContainText("CLOSED");
  await expect(page.locator('[data-testid^="conduit-panel-"]')).toHaveCount(1);
  await expect(page.locator('[data-testid^="conduit-control-"]')).toHaveCount(1);
  await expect(page.getByTestId("pipe-run-gas:core__gallery")).toHaveCount(0);
  await page.getByTestId("pipe-board-close").click();
  await expect(page.getByText("Membrane cell", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Wet contactor", { exact: true })).toHaveCount(0);
  await page.getByTestId("open-equipment-build-furnace-socket_a").click();
  await expect(page.getByTestId("manual-equipment-choice-membrane_cell")).toBeVisible();
  await expect(page.getByTestId("manual-equipment-choice-wet_contactor")).toBeVisible();
  await page.getByRole("button", { name: "Close facility manual" }).click();

  await clickMapRoom(page, "lower_intake");
  await expect(page.getByTestId("room-name")).toHaveText("Upper Inner Bay");
  await expect(page.getByText("Install equipment").first()).toBeVisible();
  await expect(page.getByTestId("open-equipment-build-lower_intake-socket_a")).toBeVisible();
});

test("planning uses the same equipment and physical-conduit construction rules", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await startGuidedTutorial(page);
  await skipGuidance(page);
  await page.getByTestId("pipe-mode-toggle").click();
  await page.getByRole("button", { name: "Dismantle gas conduit" }).click();
  await expect(page.getByTestId("pipe-board-empty")).toBeVisible();

  const core = await roomClientPoint(page, "core");
  const furnace = await roomClientPoint(page, "furnace");
  await page.mouse.move(core.x, core.y);
  await page.mouse.down();
  await page.mouse.move(furnace.x, furnace.y, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByTestId("pipe-confirm-popup")).toBeVisible();
  await page.getByTestId("pipe-confirm-gas_line").click();
  await expect(page.getByTestId("conduit-panel-gas:core__furnace")).toBeVisible();
  await page.getByTestId("pipe-board-close").click();

  await installEquipment(page, "furnace", "socket_a", "gas_agitator");
  await expect(page.getByText(/Gas agitator · Grade 1/)).toBeVisible();
});

test("an unauthored pair routes through preview and confirm at the corridor exam", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const { DEFAULT_GAME_DEFINITION } = await import("../../src/game/config");
  const { createScenarioGame } = await import("../../src/game/simulation");
  const { encodeGame } = await import("../../src/game/persistence/saveCodec");
  const state = createScenarioGame("flash_point");
  const exam = DEFAULT_GAME_DEFINITION.levels.flash_point.rounds.at(-1);
  if (!exam) throw new Error("flash_point has no rounds");
  state.phase = "build";
  state.matter = 200;
  state.campaign.roundIndex = DEFAULT_GAME_DEFINITION.levels.flash_point.rounds.length - 1;
  state.availability = {
    equipment: [...exam.availability.equipment],
    gasLines: [...exam.availability.gasLines],
    liquidLines: [...exam.availability.liquidLines],
  };
  const encoded = encodeGame(state, DEFAULT_GAME_DEFINITION);
  await page.addInitScript(
    ({ save }) => {
      window.localStorage.setItem(
        "catalyst-castellum:save:slot-1:v2",
        JSON.stringify({
          version: 2,
          savedAt: Date.now(),
          game: save,
          dismissedGuideIds: ["flash_point_ox1"],
          guidanceEnabled: true,
        })
      );
    },
    { save: encoded }
  );
  await page.goto("/");
  await page.getByTestId("load-save-slot-1").click();
  await page.getByTestId("game-map").waitFor({ state: "visible" });

  await page.getByTestId("pipe-mode-toggle").click();
  const reservoir = await roomClientPoint(page, "reservoir");
  const washlock = await roomClientPoint(page, "washlock");
  await page.mouse.move(reservoir.x, reservoir.y);
  await page.mouse.down();
  await page.mouse.move(washlock.x, washlock.y, { steps: 8 });
  await page.mouse.up();

  await expect(page.getByTestId("pipe-confirm-popup")).toContainText("R-03 ⇄ R-06");
  const buildGas = page.getByTestId("pipe-confirm-gas_line");
  await expect(buildGas).toBeEnabled();
  await buildGas.click();
  await expect(page.getByTestId("pipe-confirm-popup")).toHaveCount(0);
  await expect(page.getByTestId("conduit-panel-gas:reservoir__washlock")).toBeVisible();
  await expect(page.getByTestId("conduit-control-gas:reservoir__washlock")).toBeVisible();
});
