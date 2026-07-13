import { expect, test } from "@playwright/test";

test("the document publishes the favicon and social preview contract", async ({
  page,
  request,
}) => {
  await page.goto("/");

  await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveAttribute(
    "href",
    "/favicon.svg"
  );
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    "href",
    "/manifest.webmanifest"
  );
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    "Catalyst Castellum"
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    "https://catalyst.ahara.io/social-card.png"
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image"
  );

  const [favicon, socialCard, manifest] = await Promise.all([
    request.get("/favicon.svg"),
    request.get("/social-card.png"),
    request.get("/manifest.webmanifest"),
  ]);
  expect(favicon.ok()).toBe(true);
  expect(favicon.headers()["content-type"]).toContain("image/svg+xml");
  expect(socialCard.ok()).toBe(true);
  expect(socialCard.headers()["content-type"]).toContain("image/png");
  expect(manifest.ok()).toBe(true);
  await expect(manifest.json()).resolves.toMatchObject({
    name: "Catalyst Castellum",
    theme_color: "#08110f",
  });
});
