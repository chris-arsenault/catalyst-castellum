import { expect, test } from "@playwright/test";
import { DEFAULT_GAME_DEFINITION } from "../../src/game/config";
import { createScenarioGame } from "../../src/game/simulation";
import { encodeGame } from "../../src/game/persistence/saveCodec";

const seededSave = (): string => {
  const state = createScenarioGame("claim_8_delta", ["claim_8_delta"]);
  state.phase = "level_complete";
  state.matter = 100;
  return encodeGame(state, DEFAULT_GAME_DEFINITION);
};

test("grafts a module from a hull graft slot through preview and confirm", async ({ page }) => {
  test.setTimeout(60_000);
  const save = seededSave();
  await page.addInitScript((serialized: string) => {
    window.localStorage.setItem(
      "catalyst-castellum:save:slot-1:v2",
      JSON.stringify({
        version: 2,
        savedAt: Date.now(),
        game: serialized,
        dismissedGuideIds: ["claim_8_delta:field_guidance:v5"],
        guidanceEnabled: true,
      })
    );
  }, save);
  await page.goto("/");
  await page.getByTestId("load-save-slot-1").click();
  await expect(page.getByTestId("captains-logbook")).toBeVisible();
  await expect(page.getByTestId("game-map")).toHaveCount(0);
  await expect(page.getByTestId("logbook-entry")).toContainText("Site secured");
  await page.getByTestId("logbook-hangar").click();
  await expect(page.getByTestId("graft-board")).toBeVisible();
  await expect(page.getByTestId("game-map")).toHaveCount(0);
  await page.getByTestId("graft-slot-forward").click();
  await expect(page.getByTestId("graft-preview")).toBeVisible();

  const graftPod = page.getByTestId("graft-preview-build-utility_pod");
  await expect(graftPod).toBeEnabled();
  await graftPod.click();

  await expect(page.getByTestId("graft-preview")).toHaveCount(0);
  const dismantle = page.locator('[data-testid^="graft-dismantle-"]');
  await expect(dismantle).toContainText("POD");
  await dismantle.click();
  await expect(page.locator('[data-testid^="graft-dismantle-"]')).toHaveCount(0);
  await expect(page.getByTestId("graft-slot-forward")).toBeVisible();
});
