import { expect, test } from "@playwright/test";
import { DEFAULT_GAME_DEFINITION } from "../../src/game/config";
import { createScenarioGame } from "../../src/game/simulation";
import { encodeGame } from "../../src/game/persistence/saveCodec";
import type { MapRoom, WorldMap } from "../../src/game/world/map";

/**
 * The shipped tutorial has no seed hull, so grafting is unreachable there until the
 * tutorial is re-authored (M6). This drives the graft flow from a seeded save whose
 * furnace is a hull room with an open hardpoint — the M6 hull's shape, proven now.
 */
const HARDPOINT = { id: "west_wall", cell: { column: 6, elevation: 22 }, facing: "left" as const };

const hullMap: WorldMap = {
  ...DEFAULT_GAME_DEFINITION.map,
  rooms: {
    ...DEFAULT_GAME_DEFINITION.map.rooms,
    furnace: {
      ...DEFAULT_GAME_DEFINITION.map.rooms.furnace!,
      provenance: "hull",
      hardpoints: [HARDPOINT],
    } as MapRoom,
  },
};

const seededSave = (): string => {
  // Site 2 is a real dock (levelIndex 1), where grafting is available.
  const state = createScenarioGame("make_the_reagent", ["flash_point"]);
  state.phase = "build";
  state.matter = 100;
  state.map = hullMap;
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
  const stageIntro = page.getByTestId("enter-stage-controls");
  if (await stageIntro.isVisible().catch(() => false)) await stageIntro.click();
  await page.getByTestId("game-map").waitFor({ state: "visible" });

  await page.getByTestId("graft-mode-toggle").click();
  await expect(page.getByTestId("graft-board")).toBeVisible();
  await page.getByTestId("graft-hardpoint-west_wall").click();
  await expect(page.getByTestId("graft-preview")).toBeVisible();

  const graftPod = page.getByTestId("graft-preview-build-utility_pod");
  await expect(graftPod).toBeEnabled();
  await graftPod.click();

  await expect(page.getByTestId("graft-preview")).toHaveCount(0);
  await expect(page.getByTestId("graft-slot-west_wall")).toContainText("POD-1");
  await page.getByTestId("graft-dismantle-west_wall").click();
  await expect(page.getByTestId("graft-hardpoint-west_wall")).toBeVisible();
});
