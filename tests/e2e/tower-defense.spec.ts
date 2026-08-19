import { expect, test, type Page } from "@playwright/test";
import { createScenarioGame } from "../../src/game/simulation";
import { mapViewFor, type CameraTransform } from "../../src/components/gameMap/mapGeometry";
import type { WorldPoint } from "../../src/game/types";
import { startNewGame } from "./tutorialAssertions";

const claimMap = createScenarioGame("claim_8_delta").map;
const harkerMap = createScenarioGame("harkers_brace").map;

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

const worldClientPoint = async (page: Page, worldPoint: WorldPoint, map = claimMap) => {
  const bounds = await page.locator("canvas").boundingBox();
  if (!bounds) throw new Error("Pixi canvas did not produce a bounding box");
  return mapViewFor(map).worldToClientPoint(worldPoint, await mapCamera(page), bounds);
};

test("places, aims, upgrades, and fires a free wall-mounted tower", async ({ page }) => {
  await page.goto("/");
  await startNewGame(page, 1, false);
  await page.getByTestId("enter-control-room").click();

  await expect(page.getByTestId("tower-panel")).toBeVisible();
  await expect(page.getByTestId("start-assault")).toBeVisible();
  await page.getByTestId("tower-build-flash_chamber").click();
  await page.getByRole("button", { name: "right", exact: true }).click();

  const room = claimMap.rooms.switchyard;
  if (!room) throw new Error("Claim map has no switchyard");
  const openingPoint = await worldClientPoint(page, {
    x: room.bounds.column,
    elevation: room.bounds.elevation + 1.5,
  });
  await page.mouse.move(openingPoint.x, openingPoint.y);
  await expect(page.getByTestId("game-map")).toHaveAttribute(
    "data-tower-preview-face",
    "left_wall"
  );
  await expect(page.getByTestId("game-map")).toHaveAttribute("data-tower-preview-allowed", "false");
  const point = await worldClientPoint(page, {
    x: room.bounds.column,
    elevation: room.bounds.elevation + Math.min(3.5, room.bounds.height - 1),
  });
  await page.mouse.move(point.x, point.y);
  await expect(page.getByTestId("game-map")).toHaveAttribute(
    "data-tower-preview-face",
    "left_wall"
  );
  await expect(page.getByTestId("game-map")).toHaveAttribute("data-tower-preview-allowed", "true");
  await page.mouse.click(point.x, point.y);

  await expect(page.getByText("Selected defense")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Flash Chamber" })).toBeVisible();
  await page.getByTestId("tower-target-last").click();
  await page.getByTestId("tower-upgrade-flash_calibration").click();
  await expect(page.getByTestId("tower-upgrade-flash_calibration")).toContainText("Installed");

  await page.getByTestId("start-assault").click();
  await expect(page.getByTestId("tower-damage-dealt")).not.toContainText("Damage 0", {
    timeout: 15_000,
  });
  await expect(page.getByTestId("phase-banner")).toContainText(/assault|round complete/i);
});

test("gives wall and ceiling Carbon Burners distinct vertical coverage", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("debug-guidance").uncheck();
  await page.getByTestId("debug-start-level").selectOption("harkers_brace");
  await page.getByTestId("debug-start-game").click();
  await page.getByTestId("enter-control-room").click();

  const switchyard = harkerMap.rooms.switchyard;
  if (!switchyard) throw new Error("Harker map has no switchyard");
  await page.getByTestId("tower-build-carbon_burner").click();
  const wallPoint = await worldClientPoint(
    page,
    {
      x: switchyard.bounds.column + switchyard.bounds.width,
      elevation: switchyard.bounds.elevation + 3.25,
    },
    harkerMap
  );
  await page.mouse.move(wallPoint.x, wallPoint.y);
  await expect(page.getByTestId("game-map")).toHaveAttribute(
    "data-tower-preview-face",
    "right_wall"
  );
  await expect(page.getByTestId("game-map")).toHaveAttribute(
    "data-tower-preview-orientation",
    "left"
  );
  await page.getByRole("button", { name: "down", exact: true }).click();
  await expect(page.getByTestId("game-map")).toHaveAttribute(
    "data-tower-preview-orientation",
    "down"
  );
  await page.getByRole("button", { name: "left", exact: true }).click();
  await expect(page.getByTestId("game-map")).toHaveAttribute(
    "data-tower-preview-orientation",
    "left"
  );
  await page.mouse.click(wallPoint.x, wallPoint.y);
  await expect(page.getByText("Range 8", { exact: true })).toBeVisible();
  await page.getByTestId("tower-rotate-down").click();
  await expect(page.getByTestId("tower-rotate-down")).toHaveClass(/selected/);
  await page.getByTestId("tower-rotate-left").click();
  await expect(page.getByTestId("tower-rotate-left")).toHaveClass(/selected/);

  await page.getByTestId("tower-build-carbon_burner").click();
  await page.getByRole("button", { name: "down", exact: true }).click();
  const ceilingPoint = await worldClientPoint(
    page,
    {
      x: switchyard.bounds.column + 6.25,
      elevation: switchyard.bounds.elevation + switchyard.bounds.height - 0.25,
    },
    harkerMap
  );
  await page.mouse.move(ceilingPoint.x, ceilingPoint.y);
  await expect(page.getByTestId("game-map")).toHaveAttribute("data-tower-preview-face", "ceiling");
  await expect(page.getByTestId("game-map")).toHaveAttribute(
    "data-tower-preview-orientation",
    "down"
  );
  await page.mouse.click(ceilingPoint.x, ceilingPoint.y);
  await expect(page.getByText("Range 5.76", { exact: true })).toBeVisible();
  await page.getByTestId("tower-target-last").click();

  await page.getByTestId("start-assault").click();
  await expect(page.getByTestId("tower-damage-dealt")).not.toContainText("Damage 0", {
    timeout: 15_000,
  });
});
