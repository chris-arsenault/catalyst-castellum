import { expect, test, type Page } from "@playwright/test";
import { FACILITY_MAP, gridCellToWorldPoint } from "../../src/game/config";
import { isProcessLine } from "../../src/game/world/map";
import type { WorldPoint } from "../../src/game/types";
import { mapViewFor, type CameraTransform } from "../../src/components/gameMap/mapGeometry";
import { WORLD_MAP } from "../../src/game/content/worldMap";
import { installEquipment } from "./tutorialAssertions";
import { instance } from "../../src/game/world/instances";

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

const startGuidedTutorial = async (page: Page): Promise<void> => {
  await page.getByTestId("new-game-slot-1").click();
  const appError = new Promise<Error>((resolve) => page.once("pageerror", resolve));
  await page.getByTestId("enter-control-room").click();
  const startupError = await Promise.race([
    page
      .getByTestId("tutorial-stage-intro")
      .waitFor({ state: "visible" })
      .then(() => null),
    appError,
  ]);
  expect(startupError).toBeNull();
  await page.getByTestId("enter-stage-controls").click();
  await expect(page.getByTestId("game-map")).toBeVisible();
};

const skipGuidance = async (page: Page): Promise<void> => {
  const taskCard = page.getByTestId("tutorial-task-card");
  if (await taskCard.isVisible())
    await taskCard.getByRole("button", { name: "Skip guided lesson" }).click();
};

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("save-selection")).toBeVisible();
});

test("the tutorial task list occupies a collapsible left rail", async ({ page }) => {
  await startGuidedTutorial(page);
  const map = page.getByTestId("game-map");
  const expandedBounds = await map.boundingBox();
  if (!expandedBounds) throw new Error("Expanded tutorial map bounds are absent");

  await page.getByRole("button", { name: "Collapse tutorial tasks" }).click();
  await expect(page.getByTestId("tutorial-task-card")).toHaveAttribute("data-expanded", "false");
  await expect(page.getByRole("button", { name: "Expand tutorial tasks" })).toBeVisible();
  const collapsedBounds = await map.boundingBox();
  if (!collapsedBounds) throw new Error("Collapsed tutorial map bounds are absent");
  expect(collapsedBounds.width).toBeGreaterThan(expandedBounds.width + 200);
  expect(collapsedBounds.height).toBeGreaterThanOrEqual(expandedBounds.height - 1);

  await page.getByRole("button", { name: "Expand tutorial tasks" }).click();
  await expect(page.getByTestId("tutorial-task-card")).toHaveAttribute("data-expanded", "true");
  await expect(page.getByTestId("tutorial-task-card")).toContainText("Commission the OX-1 cycle");
});

test("refresh returns to save selection before loading the live process", async ({ page }) => {
  await startGuidedTutorial(page);
  await skipGuidance(page);
  await page.getByTestId("pipe-mode-toggle").click();
  await page.getByTestId("conduit-control-gas:core__furnace").click();
  await page.getByTestId("pipe-board-close").click();
  await page.getByTestId("begin-prime").click();
  await page.waitForTimeout(900);

  await page.reload();
  await expect(page.getByTestId("save-selection")).toBeVisible();
  await expect(page.getByTestId("load-save-slot-1")).toBeVisible();
  await expect(page.getByTestId("game-map")).toHaveCount(0);
  await page.getByTestId("load-save-slot-1").click();
  await expect(page.getByTestId("game-map")).toBeVisible();
  await expect(page.getByTestId("phase-banner")).toContainText("Live prime");
  await page.getByTestId("pipe-mode-toggle").click();
  await expect(page.getByTestId("conduit-control-gas:core__furnace")).toHaveAttribute(
    "aria-pressed",
    "true"
  );
});

test("the facility cross-section remains usable at a compact desktop viewport", async ({
  page,
}) => {
  await startGuidedTutorial(page);
  await skipGuidance(page);
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(page.getByTestId("game-map")).toBeVisible();
  await expect(page.getByTestId("room-inspector")).toBeVisible();
  await expect(page.getByTestId("begin-prime")).toBeInViewport();
  await expect(page.getByTestId("source-starter_gas_header")).toBeVisible();
});

test("the authored cross-section zooms and returns to a complete fit view", async ({ page }) => {
  await startGuidedTutorial(page);
  await skipGuidance(page);
  const controls = page.locator('[aria-label="Map camera controls"]');
  await expect(controls).toContainText("100%");
  await page.getByRole("button", { name: "Zoom in" }).click();
  await expect(controls).toContainText("120%");
  await page.getByRole("button", { name: "Fit facility" }).click();
  await expect(controls).toContainText("100%");
});

test("the flow overlay isolates one material across the facility", async ({ page }) => {
  await startGuidedTutorial(page);
  await skipGuidance(page);
  const overlay = page.getByTestId("material-flow-overlay");
  await expect(overlay).toHaveValue("");
  await overlay.selectOption("hydrogen");
  await expect(overlay.locator("option:checked")).toContainText("H₂");
  await overlay.selectOption("oxygen");
  await expect(overlay.locator("option:checked")).toContainText("O₂");
});

test("R-02 details expose the live OX-1 ignition gate and pressure model", async ({ page }) => {
  await startGuidedTutorial(page);
  await skipGuidance(page);
  await page.getByRole("button", { name: "Room details" }).click();

  const gate = page.getByTestId("ox1-ignition-gate");
  await expect(gate).toContainText("OX-1 ignition gate");
  await expect(gate).toContainText("Upper layer");
  await expect(gate).toContainText("Lower layer");
  await expect(gate).toContainText("H₂");
  await expect(gate).toContainText("O₂");
  await expect(gate).toContainText("Batch");
  await expect(gate).toContainText("Agitator required");
  await expect(gate).toContainText("Static pressure follows retained inventory");
  await expect(gate).toContainText("Pressure-driven passage outflow grows");
});

test("hovering a shared conduit exposes all measured species on that physical route", async ({
  page,
}) => {
  await startGuidedTutorial(page);
  await skipGuidance(page);
  const connection = instance(FACILITY_MAP.connections, "gas:core__furnace", "connection");
  if (!isProcessLine(connection)) throw new Error("Flash Point gas route is not authored.");
  // Hover an open-space segment of the route: the pipe hit layer sits beneath the
  // rooms, so a route cell that crosses a room body shows the room, not the pipe.
  const inAnyRoom = (cell: { column: number; elevation: number }) =>
    Object.values(FACILITY_MAP.rooms).some(
      (room) =>
        cell.column >= room.bounds.column &&
        cell.column < room.bounds.column + room.bounds.width &&
        cell.elevation >= room.bounds.elevation &&
        cell.elevation < room.bounds.elevation + room.bounds.height
    );
  const openCell = connection.route.find((cell) => !inAnyRoom(cell));
  if (!openCell) throw new Error("Flash Point gas route has no open-space segment.");
  const routePoint = await worldClientPoint(page, gridCellToWorldPoint(openCell));
  await page.mouse.move(routePoint.x, routePoint.y);
  const tooltip = page.getByTestId("transport-tooltip");
  await expect(tooltip).toContainText("CORE ⇄ R-02");
  await expect(tooltip).toContainText("Gas duct");
  await expect(tooltip).toContainText("Core–R-02 gas duct");
});

test("installed equipment appears on its authored room socket", async ({ page }) => {
  await startGuidedTutorial(page);
  await skipGuidance(page);
  await installEquipment(page, "furnace", "socket_a", "gas_agitator");
  await expect(page.getByTestId("game-map")).toHaveAttribute("data-installed-equipment-count", "1");

  const socket = instance(FACILITY_MAP.rooms, "furnace", "map room").socketCells.socket_a;
  if (!socket) throw new Error("R-02 socket A is absent from the facility map.");
  const socketPoint = gridCellToWorldPoint(socket);
  const marker = await worldClientPoint(page, {
    x: socketPoint.x,
    elevation: socketPoint.elevation + 1.5,
  });
  await page.mouse.move(marker.x, marker.y);

  const tooltip = page.getByTestId("equipment-map-tooltip");
  await expect(tooltip).toContainText("Gas agitator");
  await expect(tooltip).toContainText("ACTIVE");
  await expect(tooltip).toContainText("1.5 layer exchange");
});

test("skipped guidance can be replayed from the field manual", async ({ page }) => {
  await startGuidedTutorial(page);
  await skipGuidance(page);
  await page.getByRole("button", { name: "Open facility manual" }).click();
  await page.getByTestId("replay-guided-lesson").click();
  await expect(page.getByTestId("tutorial-coach")).toHaveAttribute(
    "data-guide-step",
    "install-agitator"
  );
});
