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

export const startNewGame = async (page: Page, slot = 1): Promise<void> => {
  await page.getByTestId(`new-game-slot-${slot}`).click();
  await page.getByTestId("act-continue").click();
  await expect(page.getByTestId("enter-control-room")).toBeVisible();
  await expect(page.getByTestId("game-map")).toBeVisible();
  await expect(page.getByTestId("phase-banner")).toContainText("Site briefing");
};

export const startGuidedTutorial = async (page: Page): Promise<void> => {
  await startNewGame(page);
  await expect(page.getByTestId("tutorial-enabled")).toBeChecked();
  const intro = page.getByTestId("guide-intro");
  await expect(intro).toContainText("Turn R-02 into a combustion trap");
  await expect(intro).toContainText(/deckmouth column is moving along the service route/i);
  await expect(intro).toContainText("Commission the OX-1 cycle");
  await expect(intro).toContainText("Process model");
  await expect(intro).toContainText("2 H₂ : 1 O₂ · up to 2.2 mol-eq/s");
  await expect(intro).toContainText("2 open passages · pressure/density outflow");
  await expect(intro).toContainText("0.42× air density · 1.5 layer exchange");
  await expect(intro).toContainText("H₂ ≥ 7.5% · O₂ ≥ 12% · 2 H₂ + 1 O₂");
  await expect(intro).not.toContainText("Install and run a Gas Agitator in R-02.");
  await expect(page.getByTestId("tutorial-coach")).toHaveCount(0);
  const appError = new Promise<Error>((resolve) => page.once("pageerror", resolve));
  await page.getByTestId("enter-control-room").click();
  const startupError = await Promise.race([
    page
      .getByTestId("tutorial-coach")
      .waitFor({ state: "visible" })
      .then(() => null),
    appError,
  ]);
  expect(startupError).toBeNull();
  await expect(page.getByTestId("tutorial-coach")).toHaveAttribute(
    "data-guide-step",
    "install-agitator"
  );
  const taskCard = page.getByTestId("tutorial-task-card");
  await expect(taskCard).toContainText("Commission the OX-1 cycle");
  await expect(taskCard).toContainText("0 / 4");
  await expect(taskCard).toContainText("Prepare the flash chamber");
  await expect(taskCard).toContainText(
    "Select R-02, then install a Gas Agitator in either socket."
  );
  await expect(taskCard).toHaveAttribute("data-expanded", "true");
};

export const skipGuidance = async (page: Page): Promise<void> => {
  const taskCard = page.getByTestId("tutorial-task-card");
  if (!(await taskCard.isVisible())) return;
  await taskCard.getByRole("button", { name: "Skip guided lesson" }).click();
  await expect(taskCard).toBeHidden();
};

export const continueIntoStoredMomentum = async (
  page: Page,
  mapHeightDuringGuide: number
): Promise<void> => {
  const mapAfterGuide = await page.getByTestId("game-map").boundingBox();
  if (!mapAfterGuide) throw new Error("Map bounds are absent after guided combat");
  expect(mapAfterGuide.height).toBeGreaterThanOrEqual(mapHeightDuringGuide - 1);

  const progress = page.getByTestId("campaign-progress-panel");
  await expect(progress).toBeVisible({ timeout: 60_000 });
  await expect(progress).toContainText("Round analysis");
  await expect(progress.getByTestId("guide-intro")).toContainText("Hold Stored Momentum");
  await expect(page.getByTestId("tutorial-task-card")).toBeVisible();
  await expect(page.getByTestId("tutorial-task-card")).toContainText("Lesson complete");
  await expect(page.getByTestId("game-map")).toBeVisible();
  await expect(page.locator(".outcome-backdrop")).toHaveCount(0);
  const mapAtResult = await page.getByTestId("game-map").boundingBox();
  expect(mapAtResult?.height).toBeGreaterThanOrEqual(mapAfterGuide.height - 1);

  await page.getByTestId("continue-round").click();
  await expect(page.getByTestId("phase-banner")).toContainText("Planning");
  await expect(page.getByTestId("tutorial-task-card")).toContainText("Hold Stored Momentum");
  await expect(page.getByTestId("tutorial-coach")).toHaveAttribute(
    "data-guide-step",
    "prepare-followup"
  );
};

export const verifyStoredMomentumHasNoTeachingBreak = async (page: Page): Promise<void> => {
  await page.getByTestId("begin-prime").click();
  await expect(page.getByTestId("phase-banner")).toContainText("Live prime");
  await expect(page.getByTestId("recent-incidents-furnace")).toContainText("PRIME", {
    timeout: 20_000,
  });
  await expect(page.getByTestId("first-flash-explanation")).toHaveCount(0);
  await expect(page.getByTestId("phase-banner")).toContainText("Autonomous assault", {
    timeout: 20_000,
  });
  await expect(page.getByTestId("first-flash-explanation")).toHaveCount(0);
  await expect(page.getByTestId("tutorial-task-card")).toContainText("Hold Stored Momentum");
};

export const continueIntoSecondChamber = async (page: Page): Promise<void> => {
  const progress = page.getByTestId("campaign-progress-panel");
  await expect(progress).toContainText("Round analysis", { timeout: 60_000 });
  await expect(page.getByTestId("tutorial-task-card")).toContainText("Momentum held");
  await page.getByTestId("continue-round").click();
  await expect(page.getByTestId("phase-banner")).toContainText("Planning");

  const taskCard = page.getByTestId("tutorial-task-card");
  await expect(taskCard).toContainText("Commission the second chamber");
  await expect(page.getByTestId("begin-prime")).toBeDisabled();
  await expect(page.getByTestId("tutorial-coach")).toHaveAttribute(
    "data-guide-step",
    "open-pipe-board"
  );
  await expect(page.getByTestId("pipe-board")).toHaveCount(0);
};
