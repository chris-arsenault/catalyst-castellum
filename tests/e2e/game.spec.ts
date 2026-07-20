import { expect, test, type Page } from "@playwright/test";
import { gridCellToWorldPoint, roomCenterWorld } from "../../src/game/config";
import type { RoomId, WorldPoint } from "../../src/game/types";
import { mapViewFor, type CameraTransform } from "../../src/components/gameMap/mapGeometry";
import { WORLD_MAP } from "../../src/game/content/worldMap";
import {
  continueIntoSecondChamber,
  continueIntoStoredMomentum,
  installEquipment,
  skipGuidance,
  startGuidedTutorial,
  startNewGame,
  verifyStoredMomentumHasNoTeachingBreak,
} from "./tutorialAssertions";

const mapCamera = async (page: Page): Promise<CameraTransform> => {
  const map = page.getByTestId("game-map");
  const [x, y, zoom] = await Promise.all([
    map.getAttribute("data-camera-x"),
    map.getAttribute("data-camera-y"),
    map.getAttribute("data-camera-zoom"),
  ]);
  if (x === null || y === null || zoom === null) throw new Error("Map camera telemetry is absent");
  return { x: Number(x), y: Number(y), zoom: Number(zoom) };
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
  const errors: Error[] = [];
  const firstPageError = new Promise<Error>((resolve) => {
    page.on("pageerror", (error) => {
      errors.push(error);
      resolve(error);
    });
  });
  await page.goto("/");
  const saveSelection = page.getByTestId("save-selection");
  const startupError = await Promise.race([
    saveSelection.waitFor({ state: "visible" }).then(() => null),
    firstPageError,
  ]);
  expect(startupError).toBeNull();
  await expect(page.locator('[data-testid^="save-slot-"]')).toHaveCount(3);
  await expect(page.getByTestId("new-game-slot-1")).toBeVisible();
  await expect(page.getByTestId("new-game-slot-2")).toBeVisible();
  await expect(page.getByTestId("new-game-slot-3")).toBeVisible();
  expect(errors).toEqual([]);
});

test("resetting the active save restarts the tutorial at its first step", async ({ page }) => {
  await startGuidedTutorial(page);
  const coach = page.getByTestId("tutorial-coach");
  await installEquipment(page, "furnace", "socket_a", "gas_agitator");
  await expect(coach).toHaveAttribute("data-guide-step", "open-pipe-board");
  await expect(page.getByTestId("tutorial-task-card")).toContainText("1 / 4");

  await page.getByRole("button", { name: "Restart current save" }).click();
  await expect(page.getByTestId("restart-save-confirmation")).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByTestId("restart-save-confirmation")).toBeHidden();
  await expect(coach).toHaveAttribute("data-guide-step", "open-pipe-board");
  await page.getByRole("button", { name: "Restart current save" }).click();
  await page.getByTestId("confirm-restart-save").click();
  await page.getByTestId("act-continue").click();
  await expect(page.getByTestId("enter-control-room")).toBeVisible();
  await page.getByTestId("enter-control-room").click();

  await expect(coach).toHaveAttribute("data-guide-step", "install-agitator");
  await expect(page.getByTestId("open-equipment-build-furnace-socket_a")).toBeVisible();
  await expect(page.getByText(/Gas agitator · Grade 1/)).toHaveCount(0);
});

test("new game overwrites an occupied slot with a complete tutorial reset", async ({ page }) => {
  await startGuidedTutorial(page);
  await skipGuidance(page);
  await installEquipment(page, "furnace", "socket_a", "gas_agitator");
  await page.getByRole("button", { name: "Return to save slots" }).click();

  await expect(page.getByTestId("load-save-slot-1")).toBeVisible();
  await page.getByRole("button", { name: "Delete save slot 1" }).click();
  await expect(page.getByTestId("confirmation-delete-slot-1")).toBeVisible();
  await page.getByTestId("cancel-delete-slot-1").click();
  await expect(page.getByTestId("load-save-slot-1")).toBeVisible();
  await page.getByTestId("overwrite-slot-1").click();
  await expect(page.getByTestId("confirmation-overwrite-slot-1")).toBeVisible();
  await page.getByTestId("confirm-overwrite-slot-1").click();
  await page.getByTestId("act-continue").click();
  await page.getByTestId("enter-control-room").click();

  await expect(page.getByTestId("tutorial-coach")).toHaveAttribute(
    "data-guide-step",
    "install-agitator"
  );
  await expect(page.getByTestId("open-equipment-build-furnace-socket_a")).toBeVisible();
});

test("save slots remain isolated when starting and loading different campaigns", async ({
  page,
}) => {
  await startNewGame(page, 1);
  await page.getByTestId("tutorial-enabled").uncheck();
  await page.getByTestId("enter-control-room").click();
  await expect(page.getByText("Level 2 · Make the Reagent", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Return to save slots" }).click();

  await startNewGame(page, 2);
  await page.getByTestId("enter-control-room").click();
  await expect(page.getByTestId("tutorial-coach")).toHaveAttribute(
    "data-guide-step",
    "install-agitator"
  );
  await page.getByRole("button", { name: "Return to save slots" }).click();

  await page.getByTestId("load-save-slot-1").click();
  await expect(page.getByText("Level 2 · Make the Reagent", { exact: true })).toBeVisible();
  await expect(page.getByTestId("tutorial-coach")).toHaveCount(0);
});

test("the Flash Point field drill proves the complete causal chain through domain rules", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await startGuidedTutorial(page);
  const coach = page.getByTestId("tutorial-coach");
  const mapDuringGuide = await page.getByTestId("game-map").boundingBox();
  if (!mapDuringGuide) throw new Error("Map bounds are absent during guidance");
  await expect(page.getByTestId("room-name")).toHaveText("Lower Outer Bay");
  await expect(page.getByTestId("phase-banner")).toContainText("Planning");
  await expect(page.getByTestId("save-slots-button")).toContainText("Save slots");
  await expect(page.getByTestId("begin-prime")).toBeDisabled();
  await page.getByRole("button", { name: "Wave forecast" }).click();
  await expect(page.getByRole("dialog", { name: "First spark" })).toContainText("First spark");
  await page.getByRole("button", { name: "Back to the map" }).click();

  await clickMapRoom(page, "lower_intake");
  await expect(page.getByTestId("room-name")).toHaveText("Upper Inner Bay");
  await expect(coach).toHaveAttribute("data-guide-step", "install-agitator");
  await clickMapRoom(page, "furnace");

  await installEquipment(page, "furnace", "socket_a", "gas_agitator");
  await expect(page.getByTestId("game-map")).toHaveAttribute("data-installed-equipment-count", "1");
  await expect(coach).toHaveAttribute("data-guide-step", "open-pipe-board");
  await expect(page.locator(".react-joyride__overlay")).toHaveCount(0);

  await page.getByTestId("pipe-mode-toggle").click();
  await expect(page.getByTestId("pipe-board")).toBeVisible();
  await expect(coach).toHaveAttribute("data-guide-step", "start-shared-duct");
  const conduit = page.getByTestId("conduit-control-gas:core__furnace");
  await expect(page.locator('[data-testid^="conduit-control-"]')).toHaveCount(1);
  await expect(conduit).toHaveAttribute("aria-pressed", "false");
  await conduit.click();
  await expect(coach).toHaveAttribute("data-guide-step", "begin-prime");
  await page.getByTestId("pipe-board-close").click();
  await expect(page.getByTestId("tutorial-task-card")).toContainText("2 / 4");
  await expect(page.getByTestId("begin-prime")).toBeEnabled();

  await expect(page.getByTestId("source-gas_reservoir")).toHaveText("∞");
  await page.getByTestId("begin-prime").click();
  await expect(page.getByTestId("phase-banner")).toContainText("Live prime");
  await expect(page.getByTestId("start-assault")).toBeDisabled();
  await expect(coach).toHaveAttribute("data-guide-step", "accelerate-clock");

  await page.getByTestId("simulation-speed").click();
  await expect(coach).toHaveAttribute("data-guide-step", "observe-prime-flash");
  const flashExplanation = page.getByTestId("first-flash-explanation");
  await expect(flashExplanation).toContainText("R-02’s first OX-1 flash", { timeout: 30_000 });
  await expect(flashExplanation).toContainText("Teaching pause");
  await expect(flashExplanation).toContainText("Blast + hot gas");
  await expect(flashExplanation).toContainText("The pressure impulse is the kill mechanism");
  await expect(page.getByTestId("tutorial-task-card")).toContainText("3 / 4");
  await expect(page.locator(".paused-overlay")).toContainText("Simulation paused");
  await expect(page.getByTestId("recent-incidents-furnace")).toContainText("0 affected · 0 killed");
  await expect(coach).toHaveAttribute("data-guide-step", "start-assault");
  await flashExplanation.getByRole("button", { name: "Start first assault" }).click();
  await expect(page.locator(".paused-overlay")).toBeHidden();
  await expect(page.getByTestId("phase-banner")).toContainText("Autonomous assault");
  await expect(coach).toHaveAttribute("data-guide-step", "observe-combat-flash");

  await expect(page.getByTestId("recent-incidents-furnace")).toContainText(
    "1 affected · 1 killed",
    {
      timeout: 30_000,
    }
  );
  await expect(page.getByTestId("recent-incidents-furnace")).toContainText("PRESSURE");
  await expect(page.locator(".paused-overlay")).toBeHidden();
  await expect(coach).toBeHidden();
  await expect(page.getByTestId("tutorial-task-card")).toBeVisible();
  await expect(page.getByTestId("tutorial-task-card")).toContainText("Lesson complete");
  await expect(page.locator(".paused-overlay")).toBeHidden();
  await page.getByTestId("pipe-mode-toggle").click();
  await expect(conduit).toBeDisabled();
  await page.getByTestId("pipe-board-close").click();

  await continueIntoStoredMomentum(page, mapDuringGuide.height);
  await verifyStoredMomentumHasNoTeachingBreak(page);
  await continueIntoSecondChamber(page);
});

test("the first-flash teaching pause survives a page refresh and resumes the same run", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await startGuidedTutorial(page);
  await installEquipment(page, "furnace", "socket_a", "gas_agitator");
  await page.getByTestId("pipe-mode-toggle").click();
  await page.getByTestId("conduit-control-gas:core__furnace").click();
  await page.getByTestId("pipe-board-close").click();
  await page.getByTestId("begin-prime").click();
  await page.getByTestId("simulation-speed").click();

  const explanation = page.getByTestId("first-flash-explanation");
  await expect(explanation).toContainText("R-02’s first OX-1 flash", { timeout: 30_000 });
  await expect(page.getByTestId("game-map")).toBeVisible();

  await page.reload();
  await expect(page.getByTestId("save-selection")).toBeVisible();
  await page.getByTestId("load-save-slot-1").click();

  await expect(explanation).toContainText("R-02’s first OX-1 flash");
  await expect(page.getByTestId("game-map")).toBeVisible();
  await explanation.getByRole("button", { name: "Start first assault" }).click();
  await expect(page.getByTestId("phase-banner")).toContainText("Autonomous assault");
});

test("tutorial guidance leaves every physical map room inspectable", async ({ page }) => {
  await startGuidedTutorial(page);
  const coach = page.getByTestId("tutorial-coach");

  await clickMapRoom(page, "lower_intake");
  await expect(page.getByTestId("room-name")).toHaveText("Upper Inner Bay");
  await expect(coach).toHaveAttribute("data-guide-step", "install-agitator");

  await clickMapRoom(page, "furnace");
  await expect(page.getByTestId("room-name")).toHaveText("Lower Outer Bay");
  await expect(coach).toHaveAttribute("data-guide-step", "install-agitator");
});

test("the map reveals room materials on hover and keeps full history on demand", async ({
  page,
}) => {
  test.setTimeout(45_000);
  await startGuidedTutorial(page);
  await skipGuidance(page);

  const furnace = await roomClientPoint(page, "furnace");
  await page.mouse.move(furnace.x, furnace.y);
  const tooltip = page.getByTestId("room-map-tooltip");
  await expect(tooltip).toContainText("Lower Outer Bay");
  await expect(tooltip).toContainText("Upper gas");
  await expect(tooltip).toContainText("Lower gas");
  await expect(tooltip).toContainText("Liquid");
  await expect(tooltip).toContainText("Static pressure");
  await expect(tooltip).toContainText("OX-1 pulse");
  await expect(tooltip).toContainText("open passages");

  await installEquipment(page, "furnace", "socket_a", "gas_agitator");
  await page.getByTestId("pipe-mode-toggle").click();
  await page.getByTestId("conduit-control-gas:core__furnace").click();
  await page.getByTestId("pipe-board-close").click();
  await page.getByTestId("begin-prime").click();
  await page.getByTestId("simulation-speed").click();
  await page.mouse.move(furnace.x, furnace.y);
  await expect(tooltip).toContainText("H₂", { timeout: 20_000 });
  await expect(tooltip).toContainText("O₂");
  await expect(tooltip).toContainText("N₂");
  await expect(tooltip).toContainText("Powered feed");

  await page.getByTestId("battle-feed").click();
  await expect(page.getByRole("dialog")).toContainText("Battle log");
  await page.getByRole("button", { name: "Close battle log" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("the map exposes the tile platform world and room-owned architectural openings", async ({
  page,
}) => {
  await startGuidedTutorial(page);
  await skipGuidance(page);
  const map = page.getByTestId("game-map");
  await expect(map).toHaveAttribute("data-world-model", "cell-platform-v1");
  await expect(map).toHaveAttribute("data-grid", "76x40");
  await expect(map).toHaveAttribute("data-portal-count", "7");

  await clickMapRoom(page, "furnace");
  await page.getByRole("button", { name: "Room details" }).click();
  await expect(page.getByTestId("architectural-connections")).toContainText("Open ladder shaft");
  await expect(page.getByTestId("architectural-connections")).toContainText("Open passage");
  await page.getByRole("button", { name: "Close room details" }).click();

  await clickMapRoom(page, "reservoir");
  await page.getByRole("button", { name: "Room details" }).click();
  await expect(page.getByTestId("architectural-connections")).toContainText("Trapdoor");
  await page.getByRole("button", { name: "Close room details" }).click();

  await clickMapRoom(page, "core");
  await page.getByRole("button", { name: "Room details" }).click();
  await expect(page.getByTestId("architectural-connections")).toContainText("SEALED");
  await page.getByRole("button", { name: "Close room details" }).click();

  const platform = await worldClientPoint(page, gridCellToWorldPoint({ column: 9, elevation: 23 }));
  await page.mouse.click(platform.x, platform.y);
  await expect(page.getByTestId("room-name")).toHaveText("Lower Outer Bay");

  const washlockConnector = await worldClientPoint(
    page,
    gridCellToWorldPoint({ column: 42, elevation: 13 })
  );
  await page.mouse.click(washlockConnector.x, washlockConnector.y);
  await expect(page.getByTestId("room-name")).toHaveText("Lower Inner Bay");
});

test("map drag capture starts after a threshold and never selects the release room", async ({
  page,
}) => {
  await startGuidedTutorial(page);
  await skipGuidance(page);
  await expect(page.getByTestId("room-name")).toHaveText("Lower Outer Bay");
  await page.getByRole("button", { name: "Zoom in" }).click();

  const start = await roomClientPoint(page, "lower_intake");
  const before = await mapCamera(page);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x, start.y - 80, { steps: 8 });
  await page.mouse.up();

  await expect(page.getByTestId("room-name")).toHaveText("Lower Outer Bay");
  const after = await mapCamera(page);
  expect(after.y).not.toBe(before.y);

  await clickMapRoom(page, "lower_intake");
  await expect(page.getByTestId("room-name")).toHaveText("Upper Inner Bay");
});

test("disabling the tutorial starts directly in lesson two", async ({ page }) => {
  await startNewGame(page);
  const checkbox = page.getByTestId("tutorial-enabled");
  await expect(checkbox).toBeChecked();
  await checkbox.uncheck();
  await expect(page.getByTestId("enter-control-room")).toContainText("Skip to Make the Reagent");

  await page.getByTestId("enter-control-room").click();

  await expect(page.getByTestId("tutorial-coach")).toHaveCount(0);
  await expect(page.getByTestId("phase-banner")).toContainText("Planning");
  await page.getByRole("button", { name: "Wave forecast" }).click();
  await expect(page.getByRole("dialog", { name: "Co-products" })).toContainText("Co-products");
  await page.getByRole("button", { name: "Back to the map" }).click();
  await expect(page.getByTestId("room-name")).toHaveText("Upper Inner Bay");
  await expect(page.getByText("Level 2 · Make the Reagent", { exact: true })).toBeVisible();
  await expect(page.getByTestId("open-equipment-build-lower_intake-socket_a")).toBeVisible();
});

test("supplies expose actionable reserves without duplicating hidden plant inventories", async ({
  page,
}) => {
  await startGuidedTutorial(page);
  await skipGuidance(page);
  await expect(page.getByTestId("supply-dock")).toContainText("Supplies");
  await expect(page.getByText("Core material manifold")).toHaveCount(0);
  await expect(page.getByText("System trace")).toHaveCount(0);
  await expect(page.getByTestId("source-gas_reservoir")).toHaveText("∞");
  await expect(page.getByTestId("source-liquid_reservoir_a")).toHaveCount(0);
  await expect(page.getByTestId("source-liquid_reservoir_b")).toHaveCount(0);
  await expect(page.getByTestId("core-gas-junction")).toHaveCount(0);
  await expect(page.getByTestId("gas-vent-total")).toHaveCount(0);
  await expect(page.getByTestId("liquid-drain-total")).toHaveCount(0);

  await page.getByTestId("pipe-mode-toggle").click();
  await page.getByTestId("conduit-control-gas:core__furnace").click();
  await page.getByTestId("pipe-board-close").click();
  await page.getByTestId("begin-prime").click();
  await expect(page.getByTestId("source-gas_reservoir")).toHaveText("∞");
  await expect(page.getByTestId("phase-banner")).toContainText("Live prime");
});
