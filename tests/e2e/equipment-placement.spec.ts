import { expect, test, type Page } from "@playwright/test";
import { createScenarioGame } from "../../src/game/simulation";
import type { RoomId } from "../../src/game/types";
import { facilityModelForMap } from "../../src/game/world/derivedModel";
import { mapViewFor, type CameraTransform } from "../../src/components/gameMap/mapGeometry";

const siteMap = createScenarioGame("make_the_reagent").map;

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

const clickMapRoom = async (page: Page, roomId: RoomId): Promise<void> => {
  const bounds = await page.locator("canvas").boundingBox();
  if (!bounds) throw new Error("Pixi canvas did not produce a bounding box");
  const point = mapViewFor(siteMap).worldToClientPoint(
    facilityModelForMap(siteMap).roomCenterWorld(roomId),
    await mapCamera(page),
    bounds
  );
  await page.mouse.click(point.x, point.y);
};

test("lesson equipment uses universal room sockets and visible catalog locks", async ({ page }) => {
  await page.goto("/");
  // Make the Reagent owns the membrane cell, so start the run at that site.
  await page.getByTestId("debug-guidance").uncheck();
  await page.getByTestId("debug-start-slot").selectOption("slot-1");
  await page.getByTestId("debug-start-level").selectOption("make_the_reagent");
  await page.getByTestId("debug-start-game").click();
  await page.getByTestId("enter-control-room").click();
  await expect(page.getByTestId("game-map")).toBeVisible();

  await clickMapRoom(page, "switchyard");
  await page.getByTestId("open-equipment-build-switchyard-socket_a").click();
  await expect(page.getByRole("dialog", { name: "Facility Manual" })).toBeVisible();
  await expect(page.getByAltText("Membrane cell field plate").last()).toBeVisible();
  const cell = page.getByTestId("install-switchyard-socket_a-membrane_cell");
  await expect(cell).toBeEnabled();
  for (const equipmentId of ["gas_agitator", "wet_contactor", "thermal_coil"] as const) {
    await page.getByTestId(`manual-equipment-choice-${equipmentId}`).click();
    await expect(page.getByTestId(`install-switchyard-socket_a-${equipmentId}`)).toBeDisabled();
  }

  await page.getByTestId("manual-equipment-choice-membrane_cell").click();
  await page.getByRole("button", { name: "Encyclopedia entry" }).click();
  await expect(page.getByTestId("equipment-entry-membrane_cell")).toContainText(
    "Produces chlorine, hydrogen, and sodium hydroxide"
  );
  await page.getByTestId("equipment-entry-membrane_cell").getByRole("button").click();
  await expect(page.getByTestId("reaction-entry-chlor_alkali_electrolysis")).toContainText(
    "Process inventory"
  );
  await page.getByTestId("manual-tab-build").click();

  await cell.click();
  await expect(page.getByTestId("game-map")).toHaveAttribute("data-cell-outlet-room", "switchyard");
  await expect(page.getByTestId("game-map")).toHaveAttribute("data-installed-equipment-count", "1");
});
