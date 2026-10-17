import { expect, test } from "@playwright/test";
import { applyFixtureCommand, firstWaveFixture } from "../../src/game/__fixtures__/postM1Scenarios";
import { campaignEncounterContext } from "../../src/game/engine/campaignEncounter";
import { completeAssault } from "../../src/game/engine/phases";
import { finishEncounter } from "../../src/game/encounter/reports";

const seededSave = (): string => {
  const fixture = firstWaveFixture();
  const { runtime } = fixture;
  let state = fixture.state;
  state.encounter.matter = 100;
  for (const round of runtime.definition.levels.claim_8_delta.rounds) {
    state = applyFixtureCommand(runtime, state, { type: "start_assault" });
    const wave = campaignEncounterContext(state, runtime.definition).definition.wave;
    expect(state.encounter.definition.id).toBe(`claim_8_delta:${round.id}`);
    state.encounter.spawnCursor = wave.length;
    state.encounter.stats.spawned = wave.length;
    state.encounter.stats.killed = wave.length;
    finishEncounter(state.encounter, "complete");
    completeAssault(state, runtime.definition);
    if (state.phase === "round_result") {
      state = applyFixtureCommand(runtime, state, { type: "continue_round" });
    }
  }
  expect(state.phase).toBe("level_complete");
  const serialized = runtime.save.encode(state);
  expect(runtime.save.decode(serialized)).not.toBeNull();
  return serialized;
};

test("grafts a module from a hull graft slot through preview and confirm", async ({ page }) => {
  test.setTimeout(60_000);
  const save = seededSave();
  await page.addInitScript((serialized: string) => {
    window.localStorage.setItem(
      "catalyst-castellum:save:slot-1:v3",
      JSON.stringify({
        version: 3,
        savedAt: Date.now(),
        game: serialized,
        dismissedGuideIds: ["claim_8_delta:field_guidance:v5"],
        guidanceEnabled: true,
        guideEvidence: {},
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
