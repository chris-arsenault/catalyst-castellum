import { expect, test } from "@playwright/test";
import { skipGuidance, startGuidedTutorial, startNewGame } from "./tutorialAssertions";

test.beforeEach(async ({ page }) => {
  const errors: Error[] = [];
  page.on("pageerror", (error) => errors.push(error));
  await page.goto("/");
  await expect(page.getByTestId("save-selection")).toBeVisible();
  await expect(page.locator('[data-testid^="save-slot-"]')).toHaveCount(3);
  expect(errors).toEqual([]);
});

test("save slots preserve independent campaign and guidance state", async ({ page }) => {
  await startNewGame(page, 1, false);
  await page.getByTestId("enter-control-room").click();
  await expect(page.getByTestId("game-map")).toBeVisible();
  await expect(page.getByTestId("tutorial-coach")).toHaveCount(0);
  await page.getByRole("button", { name: "Return to save slots" }).click();

  await startNewGame(page, 2, true);
  await page.getByTestId("enter-control-room").click();
  await expect(page.getByTestId("tutorial-stage-intro")).toContainText("Hold Claim 8-Delta");
  await page.getByTestId("enter-stage-controls").click();
  await page.getByRole("button", { name: "Return to save slots" }).click();

  await page.getByTestId("load-save-slot-1").click();
  await expect(page.getByTestId("game-map")).toBeVisible();
  await expect(page.getByTestId("tutorial-stage-intro")).toHaveCount(0);
  await expect(page.getByTestId("tutorial-task-card")).toHaveCount(0);
});

test("the first tutorial teaches direct tower coverage", async ({ page }) => {
  await startGuidedTutorial(page);
  await expect(page.getByTestId("tutorial-coach")).toHaveAttribute(
    "data-guide-step",
    "inspect-route"
  );
  await expect(page.getByTestId("tutorial-task-card")).toContainText("Record direct tower damage.");
  await expect(page.getByTestId("start-assault")).toBeDisabled();
  await skipGuidance(page);
  await expect(page.getByTestId("start-assault")).toBeEnabled();
});

test("the vessel manual exposes the complete tower catalog", async ({ page }) => {
  await startNewGame(page, 1, false);
  await page.getByTestId("enter-control-room").click();
  await page.getByTestId("open-encyclopedia").click();
  await page.getByTestId("manual-tab-build").click();

  await expect(page.getByTestId("manual-tower-page")).toBeVisible();
  await expect(page.locator('[data-testid^="manual-tower-choice-"]')).toHaveCount(7);
  await page.getByTestId("manual-tower-choice-flash_chamber").click();
  await expect(page.getByTestId("manual-place-tower-flash_chamber")).toBeEnabled();
  await page.getByTestId("manual-place-tower-flash_chamber").click();
  await expect(page.getByTestId("vessel-manual")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Placement controls" })).toBeVisible();
});
