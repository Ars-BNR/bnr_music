import { expect, test } from "@playwright/test";

test("live smoke: login and volume wheel invariant", async ({ page }) => {
  test.skip(!process.env.E2E_EMAIL || !process.env.E2E_PASSWORD, "E2E_EMAIL and E2E_PASSWORD are required");
  await page.goto("/login");
  await page.getByLabel("Email").fill(process.env.E2E_EMAIL!);
  await page.locator('input[type="password"]').fill(process.env.E2E_PASSWORD!);
  await page.locator("button[type=submit]").click();
  await expect(page).toHaveURL(/\/$/);

  const volume = page.getByRole("button", { name: /Volume:/ });
  await expect(volume).toBeVisible();
  await volume.hover();
  const scrollBefore = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, -120);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(scrollBefore);
});
