import { expect, test } from "@playwright/test";

test("process equipment uses room sockets and the site catalog", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("debug-guidance").uncheck();
  await page.getByTestId("debug-start-slot").selectOption("slot-1");
  await page.getByTestId("debug-start-level").selectOption("junction_l6");
  await page.getByTestId("debug-start-game").click();
  await page.getByTestId("enter-control-room").click();
  await expect(page.getByTestId("game-map")).toBeVisible();

  await page.getByTestId("side-panel-room").click();
  await expect(page.getByTestId("room-inspector")).toBeVisible();
  await page.getByTestId("open-equipment-build-lower_intake-socket_a").click();
  await expect(page.getByRole("dialog", { name: "Vessel Manual" })).toBeVisible();
  await expect(page.getByAltText("Membrane cell field plate").last()).toBeVisible();

  await page.getByTestId("manual-equipment-choice-membrane_cell").click();
  const cell = page.getByTestId("install-lower_intake-socket_a-membrane_cell");
  await expect(cell).toBeEnabled();
  await page.getByRole("button", { name: "Encyclopedia entry" }).click();
  await expect(page.getByTestId("equipment-entry-membrane_cell")).toContainText(
    "Produces chlorine, hydrogen, and sodium hydroxide"
  );
  await page.getByTestId("equipment-entry-membrane_cell").getByRole("button").click();
  await expect(page.getByTestId("reaction-entry-chlor_alkali_electrolysis")).toContainText(
    "Process inventory"
  );
  await page.getByTestId("manual-tab-build").click();
  await page.getByTestId("manual-equipment-choice-membrane_cell").click();

  await cell.click();
  await expect(page.getByTestId("game-map")).toHaveAttribute(
    "data-cell-outlet-room",
    "lower_intake"
  );
  await expect(page.getByTestId("game-map")).toHaveAttribute("data-installed-equipment-count", "1");
});
