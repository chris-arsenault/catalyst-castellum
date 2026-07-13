import { expect, test, type Page } from "@playwright/test";
import { CONDUIT_BLUEPRINTS, gridCellToWorldPoint, roomCenterWorld } from "../../src/game/config";
import type { RoomId, WorldPoint } from "../../src/game/types";
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

const roomClientPoint = async (page: Page, roomId: RoomId) =>
  worldClientPoint(page, roomCenterWorld(roomId));

const clickMapRoom = async (page: Page, roomId: RoomId): Promise<void> => {
  const point = await roomClientPoint(page, roomId);
  await page.mouse.click(point.x, point.y);
};

const skipGuidance = async (page: Page): Promise<void> => {
  const coach = page.getByTestId("tutorial-coach");
  if (await coach.isVisible()) {
    await coach.getByRole("button", { name: "Skip guided lesson" }).click();
    await expect(coach).toBeHidden();
  }
};

const startNewGame = async (page: Page, slot = 1): Promise<void> => {
  await page.getByTestId(`new-game-slot-${slot}`).click();
  await expect(page.getByTestId("enter-control-room")).toBeVisible();
};

const startGuidedTutorial = async (page: Page): Promise<void> => {
  await startNewGame(page);
  await expect(page.getByTestId("tutorial-enabled")).toBeChecked();
  await page.getByTestId("enter-control-room").click();
  await expect(page.getByTestId("game-map")).toBeVisible();
  await expect(page.getByTestId("tutorial-coach")).toHaveAttribute(
    "data-guide-step",
    "install-agitator"
  );
};

const continueTutorial = async (page: Page, nextStep: string): Promise<void> => {
  const coach = page.getByTestId("tutorial-coach");
  await coach.getByTestId("tutorial-continue").click();
  await expect(coach).toHaveAttribute("data-guide-step", nextStep);
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
  await page.getByTestId("install-furnace-socket_a-gas_agitator").click();
  await continueTutorial(page, "start-shared-duct");

  await page.getByRole("button", { name: "Restart current save" }).click();
  await expect(page.getByTestId("restart-save-confirmation")).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByTestId("restart-save-confirmation")).toBeHidden();
  await expect(coach).toHaveAttribute("data-guide-step", "start-shared-duct");
  await page.getByRole("button", { name: "Restart current save" }).click();
  await page.getByTestId("confirm-restart-save").click();
  await expect(page.getByTestId("enter-control-room")).toBeVisible();
  await page.getByTestId("enter-control-room").click();

  await expect(coach).toHaveAttribute("data-guide-step", "install-agitator");
  await expect(page.getByTestId("install-furnace-socket_a-gas_agitator")).toBeVisible();
  await expect(page.getByText(/Gas agitator · Grade 1/)).toHaveCount(0);
});

test("new game overwrites an occupied slot with a complete tutorial reset", async ({ page }) => {
  await startGuidedTutorial(page);
  await skipGuidance(page);
  await page.getByTestId("install-furnace-socket_a-gas_agitator").click();
  await page.getByRole("button", { name: "Return to save slots" }).click();

  await expect(page.getByTestId("load-save-slot-1")).toBeVisible();
  await page.getByRole("button", { name: "Delete save slot 1" }).click();
  await expect(page.getByTestId("confirmation-delete-slot-1")).toBeVisible();
  await page.getByTestId("cancel-delete-slot-1").click();
  await expect(page.getByTestId("load-save-slot-1")).toBeVisible();
  await page.getByTestId("overwrite-slot-1").click();
  await expect(page.getByTestId("confirmation-overwrite-slot-1")).toBeVisible();
  await page.getByTestId("confirm-overwrite-slot-1").click();
  await page.getByTestId("enter-control-room").click();

  await expect(page.getByTestId("tutorial-coach")).toHaveAttribute(
    "data-guide-step",
    "install-agitator"
  );
  await expect(page.getByTestId("install-furnace-socket_a-gas_agitator")).toBeVisible();
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
  await expect(page.getByTestId("room-name")).toHaveText("Lower Outer Bay");
  await expect(page.getByTestId("phase-banner")).toContainText("First spark");

  await page.getByTestId("install-furnace-socket_a-gas_agitator").click();
  await expect(page.getByText(/Gas agitator · Grade 1/)).toBeVisible();
  await expect(coach).toContainText("The Gas Agitator now recirculates");
  await expect(page.locator(".react-joyride__overlay")).toHaveCount(0);

  await page.getByTestId("select-room-lower_intake").click();
  await expect(page.getByTestId("room-name")).toHaveText("Upper Inner Bay");
  await expect(coach).toHaveAttribute("data-guide-step", "install-agitator");
  await page.getByTestId("select-room-furnace").click();
  await continueTutorial(page, "start-shared-duct");

  const conduit = page.getByTestId("conduit-control-core_furnace-gas");
  await expect(conduit).toHaveAttribute("aria-pressed", "false");
  await conduit.click();
  await expect(coach).toContainText("The fan is armed");
  await expect(page.locator('[data-testid^="conduit-control-"]')).toHaveCount(1);
  await continueTutorial(page, "begin-prime");

  const headerBefore = await page.getByTestId("source-starter_gas_header").innerText();
  await page.getByTestId("begin-prime").click();
  await expect(page.getByTestId("phase-banner")).toContainText("Live prime");
  await expect(page.getByTestId("source-starter_gas_header")).not.toHaveText(headerBefore, {
    timeout: 10_000,
  });
  await expect(coach).toContainText("The plant clock is live");
  await continueTutorial(page, "accelerate-clock");

  await page.getByTestId("simulation-speed").click();
  await expect(coach).toContainText("The clock is at 2×");
  await continueTutorial(page, "observe-prime-flash");
  await expect(coach).toContainText("first OX-1 incident", { timeout: 30_000 });
  await expect(page.getByTestId("recent-incidents-furnace")).toContainText("0 hit · 0 killed");
  await continueTutorial(page, "start-assault");

  await page.getByTestId("start-assault").click();
  await expect(page.getByTestId("phase-banner")).toContainText("Autonomous assault");
  await expect(coach).toContainText("Crawlers are advancing along the mapped route");
  await continueTutorial(page, "observe-combat-flash");

  await expect(page.locator(".paused-overlay")).toContainText("Simulation paused", {
    timeout: 60_000,
  });
  await expect(coach).toContainText("Combat is paused on a confirmed hit", { timeout: 60_000 });
  await expect(page.getByTestId("recent-incidents-furnace")).toContainText("1 hit · 1 killed");
  await expect(page.getByTestId("recent-incidents-furnace")).toContainText("pressure");
  await continueTutorial(page, "combat-confirmed");
  await expect(coach).toContainText("Core stock → mixed-gas duct");

  await page.getByTestId("complete-guided-lesson").click();
  await expect(coach).toBeHidden();
  await expect(page.locator(".paused-overlay")).toBeHidden();
  await expect(conduit).toBeDisabled();
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
  await expect(page.getByTestId("architectural-connections")).toContainText("Open ladder shaft");
  await expect(page.getByTestId("architectural-connections")).toContainText("Open passage");

  await clickMapRoom(page, "reservoir");
  await expect(page.getByTestId("architectural-connections")).toContainText("Trapdoor");

  await clickMapRoom(page, "core");
  await expect(page.getByTestId("architectural-connections")).toContainText("SEALED");

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
  await expect(page.getByTestId("enter-control-room")).toContainText("Begin lesson 2");

  await page.getByTestId("enter-control-room").click();

  await expect(page.getByTestId("tutorial-coach")).toHaveCount(0);
  await expect(page.getByTestId("phase-banner")).toContainText("Co-products");
  await expect(page.getByTestId("room-name")).toHaveText("Upper Inner Bay");
  await expect(page.getByText("Level 2 · Make the Reagent", { exact: true })).toBeVisible();
  await expect(page.getByTestId("install-lower_intake-socket_a-membrane_cell")).toBeVisible();
});

test("the first lesson exposes its physical gas route and unlocked equipment", async ({ page }) => {
  await startGuidedTutorial(page);
  await skipGuidance(page);
  const inspector = page.getByTestId("room-inspector");
  await expect(inspector.getByText("Core–R-02 gas duct", { exact: true })).toBeVisible();
  await expect(page.getByTestId("conduit-panel-core_furnace-gas")).toContainText("PHYSICAL ROUTE");
  await expect(page.locator('[data-testid^="conduit-panel-"]')).toHaveCount(1);
  await expect(page.locator('[data-testid^="conduit-control-"]')).toHaveCount(1);
  await expect(page.getByText("Membrane cell", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Wet contactor", { exact: true })).toHaveCount(0);

  await page.getByTestId("select-room-lower_intake").click();
  await expect(page.getByTestId("room-name")).toHaveText("Upper Inner Bay");
  await expect(page.getByText(/INNER RING/)).toBeVisible();
  await expect(page.getByText("Open equipment socket").first()).toBeVisible();
  await expect(page.getByTestId("install-lower_intake-socket_a-gas_agitator")).toBeVisible();
  await expect(page.locator('[data-testid^="conduit-panel-"]')).toHaveCount(0);
});

test("planning uses the same equipment and physical-conduit construction rules", async ({
  page,
}) => {
  await startGuidedTutorial(page);
  await skipGuidance(page);
  await page.getByRole("button", { name: "Dismantle gas conduit" }).click();
  const rebuild = page.getByTestId("build-core_furnace-gas");
  await expect(rebuild).toBeVisible();
  await rebuild.click();
  await expect(rebuild).toBeHidden();

  await page.getByTestId("install-furnace-socket_a-gas_agitator").click();
  await expect(page.getByText(/Gas agitator · Grade 1/)).toBeVisible();
});

test("Core visibly owns the mixed starter header, junction, vent, and drain", async ({ page }) => {
  await startGuidedTutorial(page);
  await skipGuidance(page);
  await expect(page.getByText(/EXOTIC TRANSMUTATION/)).toBeVisible();
  await expect(page.getByTestId("source-starter_gas_header")).toContainText("114.0 / 150");
  await expect(page.getByTestId("starter-gas-composition")).toHaveText("H₂ 76.0 · O₂ 38.0");
  await expect(page.getByTestId("core-gas-junction")).toContainText("0.0 / 24");
  await expect(page.getByTestId("core-gas-junction-composition")).toContainText(
    "feeds Core–R-02 gas duct"
  );
  await expect(page.getByTestId("source-water_tank")).toHaveCount(0);
  await expect(page.getByTestId("source-sodium_chloride_tank")).toHaveCount(0);
  await expect(page.getByTestId("gas-vent-total")).toHaveText("0.0 mol-eq");
  await expect(page.getByTestId("liquid-drain-total")).toHaveText("0.0 mol-eq");

  await page.getByTestId("conduit-control-core_furnace-gas").click();
  await page.getByTestId("begin-prime").click();
  await expect(page.getByTestId("source-starter_gas_header")).not.toContainText("114.0 / 150", {
    timeout: 10_000,
  });
  await expect(page.getByTestId("phase-banner")).toContainText("Live prime");
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
  await expect(page.getByTestId("source-starter_gas_header")).toContainText("/ 150");
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
  await expect(overlay).toHaveValue("hydrogen");
  await expect(overlay.locator("option:checked")).toContainText("H₂");

  await overlay.selectOption("oxygen");
  await expect(overlay).toHaveValue("oxygen");
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
