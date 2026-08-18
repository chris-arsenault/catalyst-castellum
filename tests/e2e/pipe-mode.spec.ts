import { expect, test, type Page } from "@playwright/test";
import { createScenarioGame } from "../../src/game/simulation";
import { facilityModelForMap } from "../../src/game/world/derivedModel";
import { mapViewFor, type CameraTransform } from "../../src/components/gameMap/mapGeometry";
import type { RoomId } from "../../src/game/types";
import { installEquipment } from "./tutorialAssertions";

const siteMap = createScenarioGame("junction_l6").map;

const mapCamera = async (page: Page): Promise<CameraTransform> => {
  const map = page.getByTestId("game-map");
  return {
    x: Number(await map.getAttribute("data-camera-x")),
    y: Number(await map.getAttribute("data-camera-y")),
    zoom: Number(await map.getAttribute("data-camera-zoom")),
  };
};

const roomClientPoint = async (page: Page, roomId: RoomId) => {
  const bounds = await page.locator("canvas").boundingBox();
  if (!bounds) throw new Error("Pixi canvas did not produce a bounding box");
  return mapViewFor(siteMap).worldToClientPoint(
    facilityModelForMap(siteMap).roomCenterWorld(roomId),
    await mapCamera(page),
    bounds
  );
};

const startProcessSite = async (page: Page): Promise<void> => {
  await page.goto("/");
  await page.getByTestId("debug-guidance").uncheck();
  await page.getByTestId("debug-start-level").selectOption("junction_l6");
  await page.getByTestId("debug-start-game").click();
  await page.getByTestId("enter-control-room").click();
  await expect(page.getByTestId("game-map")).toBeVisible();
};

const dragRoomConnection = async (
  page: Page,
  fromRoomId: RoomId,
  toRoomId: RoomId
): Promise<void> => {
  const from = await roomClientPoint(page, fromRoomId);
  const to = await roomClientPoint(page, toRoomId);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 8 });
  await page.mouse.up();
};

test("pipe mode previews, builds, and dismantles a physical route", async ({ page }) => {
  await startProcessSite(page);
  await page.getByTestId("pipe-mode-toggle").click();

  await expect(page.getByTestId("game-map")).toHaveAttribute("data-pipe-mode", "true");
  await expect(page.getByTestId("pipe-board")).toBeVisible();
  await expect(page.getByTestId("pipe-mode-hint")).toContainText("Drag between two rooms");
  await dragRoomConnection(page, "core", "furnace");
  await expect(page.getByTestId("pipe-confirm-popup")).toBeVisible();
  await expect(page.getByTestId("pipe-confirm-gas_line")).toBeEnabled();
  await page.getByTestId("pipe-confirm-gas_line").click();

  const panel = page.getByTestId("conduit-panel-gas:core__furnace");
  await expect(panel).toBeVisible();
  await panel.getByRole("button", { name: "Dismantle gas conduit" }).click();
  await expect(page.getByTestId("pipe-board-empty")).toBeVisible();
});

test("a process tower feed can be constructed from the same planning surface", async ({ page }) => {
  await startProcessSite(page);
  await page.getByTestId("side-panel-room").click();
  await installEquipment(page, "lower_intake", "socket_a", "membrane_cell");
  await expect(page.getByText(/Membrane cell · Grade 1/)).toBeVisible();

  await page.getByTestId("pipe-mode-toggle").click();
  await dragRoomConnection(page, "lower_intake", "furnace");
  await expect(page.getByTestId("pipe-confirm-popup")).toBeVisible();
  await expect(page.getByTestId("pipe-confirm-gas_line")).toBeEnabled();
  await page.getByTestId("pipe-confirm-gas_line").click();
  await expect(page.getByTestId("conduit-panel-gas:furnace__lower_intake")).toBeVisible();
});
