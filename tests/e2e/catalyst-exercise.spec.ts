import { expect, test, type Page } from "@playwright/test";
import { createCatalystExerciseRuntime } from "../../src/game/exercise";
import { mapViewFor } from "../../src/components/gameMap/mapGeometry";

const exerciseMap = createCatalystExerciseRuntime().create().encounter.map;
const placementPoint = async (page: Page) => {
  const map = page.getByTestId("game-map");
  const [x, y, zoom, bounds] = await Promise.all([
    map.getAttribute("data-camera-x"),
    map.getAttribute("data-camera-y"),
    map.getAttribute("data-camera-zoom"),
    page.locator("canvas").boundingBox(),
  ]);
  if (x === null || y === null || zoom === null || !bounds)
    throw new Error("Encounter camera is unavailable");
  return mapViewFor(exerciseMap).worldToClientPoint(
    { x: 7, elevation: 7.5 },
    { x: Number(x), y: Number(y), zoom: Number(zoom) },
    bounds
  );
};

test("places and fires an exercise defense, keeps controls independent, and retries after reload", async ({
  page,
}) => {
  await page.goto("/?fixture=harker-catalyst");
  await expect(page.getByTestId("catalyst-exercise")).toBeVisible();
  await expect(page.getByTestId("tower-build-caustic_jet")).toHaveCount(0);
  await page.getByTestId("tower-build-flash_chamber").click();
  await page.getByRole("button", { name: "right", exact: true }).click();
  const point = await placementPoint(page);
  await page.mouse.move(point.x, point.y);
  await expect(page.getByTestId("game-map")).toHaveAttribute("data-tower-preview-allowed", "true");
  await page.mouse.click(point.x, point.y);
  await expect(page.getByRole("heading", { name: "Precision weapon", exact: true })).toBeVisible();
  await page.getByTestId("start-assault").click();
  await expect(page.getByTestId("tower-damage-dealt")).not.toContainText("Damage 0", {
    timeout: 15000,
  });
  await page.getByRole("button", { name: /Pause/ }).click();
  await page.getByRole("checkbox", { name: "Reduce animation" }).check();
  await expect(page.getByRole("button", { name: /Resume/ })).toBeVisible();
  await page.getByRole("button", { name: /Resume/ }).click();
  await expect(page.getByTestId("exercise-report")).toBeVisible({ timeout: 45000 });
  await page.reload();
  await expect(page.getByTestId("exercise-report")).toBeVisible();
  await page.getByRole("button", { name: "Retry this wave", exact: true }).click();
  await expect(page.getByTestId("start-assault")).toBeVisible();
  await expect(page.getByTestId("exercise-report")).toHaveCount(0);
});
