import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  const errors: Error[] = [];
  page.on("pageerror", (error) => errors.push(error));
  await page.goto("/");
  await expect(page.getByTestId("enter-control-room")).toBeVisible();
  await page.getByTestId("enter-control-room").click();
  await expect(page.getByTestId("game-map")).toBeVisible();
  expect(errors).toEqual([]);
});

test("build, prime, preview, and fire a room system", async ({ page }) => {
  await expect(page.getByTestId("room-name")).toHaveText("Switchyard");
  await expect(page.getByTestId("phase-banner")).toContainText("Breath test");

  await page.getByTestId("begin-prime").click();
  await expect(page.getByTestId("phase-banner")).toContainText("Prepare the room states");
  await expect(page.getByTestId("command-preview")).toContainText("Toxic");

  const toxicBefore = await page.getByTestId("gas-toxic_gas").innerText();
  await page.getByTestId("activate-gas_toxic").click();
  await expect(page.getByTestId("gas-toxic_gas")).not.toHaveText(toxicBefore);
  await expect(page.getByTestId("gas-toxic_gas")).toContainText(/3\d%/);

  await page.getByTestId("start-assault").click();
  await expect(page.getByTestId("phase-banner")).toContainText("Assault live");
  await expect(page.locator("canvas")).toHaveCount(1);
});

test("room navigation exposes different installed systems", async ({ page }) => {
  await page.getByTestId("select-room-furnace").click();
  await expect(page.getByTestId("room-name")).toHaveText("Furnace Hall");
  await expect(page.getByText("Fuel gas bank", { exact: true })).toBeVisible();
  await expect(page.getByText("Arc igniter", { exact: true })).toBeVisible();

  await page.getByTestId("select-room-reservoir").click();
  await expect(page.getByTestId("room-name")).toHaveText("Reservoir");
  await expect(page.getByText("Acid dump tank", { exact: true })).toBeVisible();
  await expect(page.getByText("Floor drain", { exact: true })).toBeVisible();
});

test("a live base survives a browser reload through the versioned save", async ({ page }) => {
  await page.getByTestId("begin-prime").click();
  await page.getByTestId("activate-gas_toxic").click();
  await expect(page.getByTestId("gas-toxic_gas")).toContainText(/3\d%/);
  await page.waitForTimeout(900);

  await page.reload();
  await expect(page.getByTestId("game-map")).toBeVisible();
  await expect(page.getByTestId("phase-banner")).toContainText("Prepare the room states");
  await expect(page.getByTestId("gas-toxic_gas")).toContainText(/[1-9]\d%/);
});

test("the layout remains usable at a compact desktop viewport", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(page.getByTestId("game-map")).toBeVisible();
  await expect(page.getByTestId("room-inspector")).toBeVisible();
  await expect(page.getByTestId("begin-prime")).toBeInViewport();
});
