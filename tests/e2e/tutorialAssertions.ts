import { expect, type Page } from "@playwright/test";
import type { EquipmentId, EquipmentSocketId, RoomId } from "../../src/game/types";

export const installEquipment = async (
  page: Page,
  roomId: RoomId,
  socketId: EquipmentSocketId,
  equipmentId: EquipmentId
): Promise<void> => {
  await page.getByTestId(`open-equipment-build-${roomId}-${socketId}`).click();
  await expect(page.getByTestId("facility-manual")).toBeVisible();
  await page.getByTestId(`manual-equipment-choice-${equipmentId}`).click();
  await page.getByTestId(`install-${roomId}-${socketId}-${equipmentId}`).click();
  await expect(page.getByTestId("facility-manual")).toHaveCount(0);
};

/** A new campaign opens in the captain's log before entering its first claim. */
export const startNewGame = async (page: Page, slot = 1, guidance = true): Promise<void> => {
  const guidanceChoice = page.getByTestId(`new-game-guidance-slot-${slot}`);
  await expect(guidanceChoice).toBeChecked();
  if (!guidance) await guidanceChoice.uncheck();
  await page.getByTestId(`new-game-slot-${slot}`).click();
  await expect(page.getByTestId("captains-logbook")).toBeVisible();
  await expect(page.getByTestId("game-map")).toHaveCount(0);
  await page.getByTestId("act-continue").click();
  await expect(page.getByTestId("enter-control-room")).toBeVisible();
};

export const startGuidedTutorial = async (page: Page): Promise<void> => {
  await startNewGame(page);
  await page.getByTestId("enter-control-room").click();
  const intro = page.getByTestId("tutorial-stage-intro");
  await expect(intro).toBeVisible();
  await expect(intro).toContainText("Hold Claim 8-Delta");
  await expect(intro).toContainText("Establish route coverage");
  await page.getByTestId("enter-stage-controls").click();
  await expect(page.getByTestId("game-map")).toBeVisible();
  await expect(page.getByTestId("tutorial-task-card")).toContainText("Mount a defense on a wall.");
};

export const skipGuidance = async (page: Page): Promise<void> => {
  const taskCard = page.getByTestId("tutorial-task-card");
  if (!(await taskCard.isVisible())) return;
  await taskCard.getByRole("button", { name: "Skip guided lesson" }).click();
  await expect(taskCard).toBeHidden();
};
