import { expect, test } from "@playwright/test";
import { DEFAULT_GAME_DEFINITION } from "../../src/game/config";
import { createScenarioGame } from "../../src/game/simulation";
import { encodeGame } from "../../src/game/persistence/saveCodec";

const seededSave = (): string => {
  const state = createScenarioGame("flash_point", ["flash_point"]);
  state.phase = "level_complete";
  state.matter = 100;
  return encodeGame(state, DEFAULT_GAME_DEFINITION);
};

test("grafts a module from a hull hardpoint through preview and confirm", async ({ page }) => {
  test.setTimeout(60_000);
  const save = seededSave();
  await page.addInitScript((serialized: string) => {
    window.localStorage.setItem(
      "catalyst-castellum:save:slot-1:v1",
      JSON.stringify({
        version: 1,
        savedAt: Date.now(),
        game: serialized,
        dismissedGuideIds: ["flash_point:field_guidance:v5"],
      })
    );
  }, save);
  await page.goto("/");
  await page.getByTestId("load-save-slot-1").click();
  await expect(page.getByTestId("level-intermission")).toBeVisible();
  await expect(page.getByTestId("game-map")).toHaveCount(0);
  await page.getByTestId("intermission-graft").click();
  await expect(page.getByTestId("graft-board")).toBeVisible();
  await expect(page.getByTestId("game-map")).toHaveCount(0);
  await page.getByTestId("graft-hardpoint-forward").click();
  await expect(page.getByTestId("graft-preview")).toBeVisible();

  const graftPod = page.getByTestId("graft-preview-build-utility_pod");
  await expect(graftPod).toBeEnabled();
  await graftPod.click();

  await expect(page.getByTestId("graft-preview")).toHaveCount(0);
  const dismantle = page.locator('[data-testid^="graft-dismantle-"]');
  await expect(dismantle).toContainText("POD");
  await dismantle.click();
  await expect(page.locator('[data-testid^="graft-dismantle-"]')).toHaveCount(0);
  await expect(page.getByTestId("graft-hardpoint-forward")).toBeVisible();
});
