import { expect, test, type Page } from "@playwright/test";
import { CONDUIT_BLUEPRINTS, FACILITY_MAP, gridCellToWorldPoint } from "../../src/game/config";
import type { WorldPoint } from "../../src/game/types";
import { worldToClientPoint, type CameraTransform } from "../../src/components/gameMap/mapGeometry";

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
  return worldToClientPoint(worldPoint, await mapCamera(page), bounds);
};

const startGuidedTutorial = async (page: Page): Promise<void> => {
  await page.getByTestId("new-game-slot-1").click();
  const appError = new Promise<Error>((resolve) => page.once("pageerror", resolve));
  await page.getByTestId("enter-control-room").click();
  const startupError = await Promise.race([
    page
      .getByTestId("game-map")
      .waitFor({ state: "visible" })
      .then(() => null),
    appError,
  ]);
  expect(startupError).toBeNull();
};

const skipGuidance = async (page: Page): Promise<void> => {
  const coach = page.getByTestId("tutorial-coach");
  if (await coach.isVisible())
    await coach.getByRole("button", { name: "Skip guided lesson" }).click();
};

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("save-selection")).toBeVisible();
});

test("refresh returns to save selection before loading the live process", async ({ page }) => {
  await startGuidedTutorial(page);
  await skipGuidance(page);
  await page.getByTestId("conduit-control-core_furnace-gas").click();
  await page.getByTestId("begin-prime").click();
  await page.waitForTimeout(900);

  await page.reload();
  await expect(page.getByTestId("save-selection")).toBeVisible();
  await expect(page.getByTestId("load-save-slot-1")).toBeVisible();
  await expect(page.getByTestId("game-map")).toHaveCount(0);
  await page.getByTestId("load-save-slot-1").click();
  await expect(page.getByTestId("game-map")).toBeVisible();
  await expect(page.getByTestId("phase-banner")).toContainText("Live prime");
  await expect(page.getByTestId("conduit-control-core_furnace-gas")).toHaveAttribute(
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

test("hovering a shared conduit exposes all measured species on that physical route", async ({
  page,
}) => {
  await startGuidedTutorial(page);
  await skipGuidance(page);
  const route = CONDUIT_BLUEPRINTS.core_furnace.gas;
  if (!route) throw new Error("Flash Point gas route is not authored.");
  const routePoint = await worldClientPoint(
    page,
    gridCellToWorldPoint(route[Math.floor(route.length / 2)]!)
  );
  await page.mouse.move(routePoint.x, routePoint.y);
  const tooltip = page.getByTestId("transport-tooltip");
  await expect(tooltip).toContainText("CORE ⇄ R-02");
  await expect(tooltip).toContainText("Gas duct");
  await expect(tooltip).toContainText("Core–R-02 gas duct");
});

test("installed equipment appears on its authored room socket", async ({ page }) => {
  await startGuidedTutorial(page);
  await page.getByTestId("install-furnace-socket_a-gas_agitator").click();
  await expect(page.getByTestId("game-map")).toHaveAttribute("data-installed-equipment-count", "1");

  const socket = FACILITY_MAP.rooms.furnace.socketCells.socket_a;
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
  await page.getByRole("button", { name: "Open process manual" }).click();
  await page.getByTestId("replay-guided-lesson").click();
  await expect(page.getByTestId("tutorial-coach")).toHaveAttribute(
    "data-guide-step",
    "install-agitator"
  );
});
