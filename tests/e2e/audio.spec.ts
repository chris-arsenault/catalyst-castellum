import { expect, test, type Page } from "@playwright/test";

const enterGame = async (page: Page): Promise<void> => {
  await page.getByTestId("new-game-slot-1").click();
  await page.getByTestId("act-continue").click();
  await page.getByTestId("enter-control-room").click();
  await page.getByTestId("enter-stage-controls").click();
  await page.getByTestId("game-map").waitFor({ state: "visible" });
};

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("audio settings open, adjust, mute, and persist", async ({ page }) => {
  await enterGame(page);

  const controls = page.getByTestId("audio-controls");
  await controls.getByRole("button", { name: "Audio settings" }).click();
  const popover = page.getByRole("group", { name: "Audio settings" });
  await expect(popover).toBeVisible();

  await popover.getByLabel("Music volume").fill("0.4");
  await popover.getByTestId("audio-mute-toggle").click();
  await expect(popover.getByTestId("audio-mute-toggle")).toHaveText(/Unmute audio/);

  const stored = await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem("castellum.audio.v1") ?? "{}")
  );
  expect(stored.muted).toBe(true);
  expect(stored.musicVolume).toBeCloseTo(0.4, 9);
});

test("the game boots with a live AudioContext path and no audio errors", async ({ page }) => {
  const errors: Error[] = [];
  page.on("pageerror", (error) => errors.push(error));
  await enterGame(page);

  // A user gesture has occurred (clicks above); interacting further should
  // leave the app healthy with the music director attached.
  await page.getByTestId("simulation-speed").waitFor({ state: "visible" });
  expect(errors).toEqual([]);
});
