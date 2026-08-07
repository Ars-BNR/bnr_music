import { expect, test } from "@playwright/test";

test("live smoke: login, owner favorites and volume wheel invariant", async ({ page }) => {
  test.skip(!process.env.E2E_EMAIL || !process.env.E2E_PASSWORD, "E2E_EMAIL and E2E_PASSWORD are required");
  test.skip(
    !process.env.E2E_POSTGRES_DB?.startsWith("bnr_music_e2e_"),
    "Live Playwright requires an isolated E2E_POSTGRES_DB",
  );
  await page.goto("/login");
  await page.getByLabel("Email").fill(process.env.E2E_EMAIL!);
  await page.locator('input[type="password"]').fill(process.env.E2E_PASSWORD!);
  await page.locator("button[type=submit]").click();
  await expect(page).toHaveURL(/\/$/);

  const apiBase = process.env.PLAYWRIGHT_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8340";
  const accessToken = await page.evaluate(() => localStorage.getItem("token"));
  expect(accessToken).toBeTruthy();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const genresResponse = await page.request.get(`${apiBase}/genres?count=1&offset=0`);
  expect(genresResponse.ok()).toBeTruthy();
  const genres = await genresResponse.json() as Array<{ id: number; name: string }>;
  expect(genres.length).toBeGreaterThan(0);
  const genreResponse = await page.request.get(`${apiBase}/genres/${genres[0].id}/tracks?count=20&offset=0`);
  expect(genreResponse.ok()).toBeTruthy();
  expect(await genreResponse.json()).toEqual(expect.objectContaining({ genre: expect.objectContaining({ id: genres[0].id }), tracks: expect.any(Array), total: expect.any(Number) }));

  const albumsResponse = await page.request.get(`${apiBase}/collection/me/albums?count=20&offset=0`, { headers });
  expect(albumsResponse.ok()).toBeTruthy();
  expect(await albumsResponse.json()).toEqual(expect.objectContaining({ items: expect.any(Array), total: expect.any(Number) }));

  const playlistsResponse = await page.request.get(`${apiBase}/playlist/mine?count=20&offset=0`, { headers });
  expect(playlistsResponse.ok()).toBeTruthy();
  const playlists = await playlistsResponse.json() as { items: Array<{ id: number; name: string }>; total: number };
  expect(playlists.items.length).toBeGreaterThan(0);
  const playlistResponse = await page.request.get(`${apiBase}/playlist/${playlists.items[0].id}?count=20&offset=0`);
  expect(playlistResponse.ok()).toBeTruthy();
  expect(await playlistResponse.json()).toEqual(expect.objectContaining({ id: playlists.items[0].id, tracks: expect.any(Array), total: expect.any(Number) }));

  await page.goto(`/category/${genres[0].id}`);
  await expect(page.getByRole("heading", { name: genres[0].name })).toBeVisible();
  await page.goto("/collection/albums");
  await expect(page.getByText("Не удалось загрузить любимые альбомы.")).toHaveCount(0);
  await page.goto(`/playlist/${playlists.items[0].id}`);
  await expect(page.getByRole("heading", { name: playlists.items[0].name })).toBeVisible();

  await page.goto("/");

  const popularResponse = await page.request.get(
    `${apiBase}/tracks/popular?count=1&offset=0`,
  );
  expect(popularResponse.ok()).toBeTruthy();
  const [popularTrack] = (await popularResponse.json()) as Array<{
    id: number;
    name: string;
    authorId: number;
    authorName: string;
    albums?: Array<{ id: number; name: string }>;
  }>;
  expect(popularTrack).toBeTruthy();

  const catalogResponse = await page.request.get(
    `${apiBase}/albums/catalog?count=20&offset=0`,
  );
  expect(catalogResponse.ok()).toBeTruthy();
  expect(await catalogResponse.json()).toEqual(
    expect.objectContaining({ items: expect.any(Array), total: expect.any(Number) }),
  );
  const searchResponse = await page.request.get(
    `${apiBase}/search/tracks?query=${encodeURIComponent(popularTrack.name)}&count=20&offset=0`,
  );
  expect(searchResponse.ok()).toBeTruthy();
  expect(await searchResponse.json()).toEqual(
    expect.objectContaining({
      items: expect.arrayContaining([
        expect.objectContaining({ id: popularTrack.id, albums: expect.any(Array) }),
      ]),
      total: expect.any(Number),
    }),
  );

  await page.goto(`/search?q=${encodeURIComponent(popularTrack.name)}&type=tracks`);
  await expect(page.getByText(popularTrack.name, { exact: true }).first()).toBeVisible();
  await page.goto("/albums");
  await expect(page.getByRole("heading", { name: "Альбомы" })).toBeVisible();
  await page.goto("/");
  await page.request.delete(
    `${apiBase}/collection/me/tracks/${popularTrack.id}`,
    { headers },
  );

  const firstTrack = page
    .locator('section[aria-labelledby="popular-tracks-heading"] button[aria-pressed]')
    .first();
  await expect(firstTrack).toBeVisible();
  await firstTrack.click();
  await expect(page.getByRole("region", { name: "Audio player" })).toBeVisible();
  await expect(page.locator("audio")).toHaveCount(1);
  const details = page.getByRole("button", { name: "Сведения о треке" });
  await details.click();
  await expect(
    page.getByRole("menuitem", {
      name: `Открыть автора ${popularTrack.authorName}`,
    }),
  ).toHaveAttribute("href", `/authors/${popularTrack.authorId}`);
  await page.keyboard.press("Escape");
  await expect(details).toBeFocused();

  try {
    const addFavorite = page.getByRole("button", {
      name: "Add track to favorites",
    });
    await expect(addFavorite).toBeEnabled();
    await addFavorite.click();
    await expect(
      page.getByRole("button", { name: "Remove track from favorites" }),
    ).toHaveAttribute("aria-pressed", "true");

    const favoriteStatus = await page.request.get(
      `${apiBase}/collection/me/tracks/${popularTrack.id}/status`,
      { headers },
    );
    expect(favoriteStatus.ok()).toBeTruthy();
    expect(await favoriteStatus.json()).toEqual({ isFavorite: true });

    await page.goto("/collection/tracks");
    await expect(page.getByText(popularTrack.name, { exact: true })).toBeVisible();
    await page.goto("/");
    await firstTrack.click();
    await expect(page.getByRole("region", { name: "Audio player" })).toBeVisible();
  } finally {
    await page.request.delete(
      `${apiBase}/collection/me/tracks/${popularTrack.id}`,
      { headers },
    );
  }

  const volume = page.getByRole("button", { name: /Volume:/ });
  await expect(volume).toBeVisible();
  await volume.hover();
  await expect(page.getByRole("slider", { name: "Volume" })).toBeVisible();
  const scrollBefore = await page.evaluate(() => window.scrollY);
  await page.getByRole("slider", { name: "Volume" }).hover();
  await page.mouse.wheel(0, 120);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(scrollBefore);
});
