import { expect, test, type Page, type Route } from "@playwright/test";

const basePermissions = [
  "profile.manage-own",
  "library.manage-own",
  "creator.apply",
];

const analyticsResponse = {
  period: "30d",
  trackingSince: "2026-08-01T10:00:00.000Z",
  generatedAt: "2026-08-08T10:00:00.000Z",
  popularTracksByGenre: [{ id: 1, name: "Synthwave", genreName: "Synthwave", trackId: 11, trackName: "Purple Rain", listens: 31 }],
  popularTracksByAlbum: [{ id: 2, name: "Neon Archive", albumName: "Neon Archive", trackId: 11, trackName: "Purple Rain", listens: 31 }],
  popularGenres: [{ id: 1, name: "Synthwave", listens: 51 }],
  popularAuthors: [{ id: 3, name: "The Saint", listens: 48 }],
  popularAlbumsByAuthor: [{ id: 2, name: "Neon Archive", authorName: "The Saint", albumName: "Neon Archive", listens: 44 }],
  popularAlbumTracksByAuthor: [{ id: 11, name: "Purple Rain", authorName: "The Saint", albumName: "Neon Archive", trackName: "Purple Rain", listens: 31 }],
};

const track = {
  id: 11,
  name: "Purple Rain",
  picture: "/image/purple.webp",
  text: "",
  listens: 31,
  audio: "/audio/purple.mp3",
  authorId: 3,
  authorName: "The Saint",
  featuredAuthors: [],
  albums: [{ id: 2, name: "Neon Archive" }],
};

async function mockApp(page: Page, permissions: string[]) {
  const periods: string[] = [];
  const plays: Array<{ trackId: number; playbackId: string }> = [];
  const principal = { sub: 1, email: "analytics@bnr.test", roles: ["user"], permissions };

  await page.route("**://localhost:8340/**", async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    if (path === "/refresh") return route.fulfill({ json: { accessToken: "analytics-token", user: principal } });
    if (path === "/users/me") return route.fulfill({ json: { id: 1, displayName: "Archive Keeper", bio: "", avatar: null, isActivated: true, ...principal } });
    if (path === "/playlist/mine") return route.fulfill({ json: { items: [], total: 0 } });
    if (path === "/collection/me/summary") return route.fulfill({ json: { collectionId: 1, totalPlaylists: 0, totalAlbums: 0, totalTracks: 0 } });
    if (path === "/tracks/popular") return route.fulfill({ json: [track] });
    if (path === "/albums/popular" || path === "/genres" || path === "/authors") return route.fulfill({ json: [] });
    if (path === "/admin/analytics") {
      periods.push(url.searchParams.get("period") ?? "");
      return route.fulfill({ json: { ...analyticsResponse, period: url.searchParams.get("period") ?? "30d" } });
    }
    const playMatch = path.match(/^\/tracks\/(\d+)\/plays$/);
    if (playMatch) {
      const body = request.postDataJSON() as { playbackId: string };
      plays.push({ trackId: Number(playMatch[1]), playbackId: body.playbackId });
      return route.fulfill({ status: 201, json: { recorded: true, listens: 32 } });
    }
    if (path.startsWith("/collection/me/tracks/")) return route.fulfill({ json: { isFavorite: false } });
    if (path.startsWith("/audio/") || path.startsWith("/image/")) return route.fulfill({ status: 404, body: "" });
    return route.fulfill({ json: [] });
  });
  return { periods, plays };
}

test("analytics permission reveals six responsive rankings and updates filters", async ({ page }) => {
  const api = await mockApp(page, [...basePermissions, "analytics.read"]);
  await page.setViewportSize({ width: 1280, height: 850 });
  await page.goto("/admin/dashboard");

  await expect(page.getByRole("heading", { name: "Палата статистики" })).toBeVisible();
  for (const title of [
    "Треки по жанрам",
    "Треки в альбомах",
    "Популярные жанры",
    "Популярные авторы",
    "Альбомы авторов",
    "Треки альбомов авторов",
  ]) {
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
  }
  await page.getByText("Таблица данных", { exact: true }).first().click();
  await expect(page.getByRole("cell", { name: "Synthwave · Purple Rain" })).toBeVisible();
  await page.getByRole("radio", { name: "7 дней" }).click();
  await expect.poll(() => api.periods.at(-1)).toBe("7d");
  await page.getByLabel("Размер рейтинга").click();
  await page.getByRole("option", { name: "Топ 5" }).click();
  await expect.poll(() => api.periods.length).toBeGreaterThan(2);

  for (const viewport of [
    { width: 375, height: 667 },
    { width: 900, height: 700 },
  ]) {
    await page.setViewportSize(viewport);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  }
});

test("analytics navigation stays hidden without permission", async ({ page }) => {
  await mockApp(page, basePermissions);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Статистика" })).toHaveCount(0);
});

test("successful playback records once while pause and resume do not duplicate it", async ({ page }) => {
  const api = await mockApp(page, basePermissions);
  await page.addInitScript(() => {
    Object.defineProperty(HTMLMediaElement.prototype, "play", {
      configurable: true,
      value: () => Promise.resolve(),
    });
    Object.defineProperty(HTMLMediaElement.prototype, "pause", {
      configurable: true,
      value: () => undefined,
    });
    Object.defineProperty(HTMLMediaElement.prototype, "load", {
      configurable: true,
      value: () => undefined,
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Воспроизвести Purple Rain" }).click();
  await expect.poll(() => api.plays.length).toBe(1);
  const player = page.getByRole("region", { name: "Audio player" });
  const playbackToggle = player.getByRole("button", { name: /^(Play|Pause)$/ });
  await playbackToggle.click();
  await playbackToggle.click();
  await page.waitForTimeout(100);
  expect(api.plays).toHaveLength(1);
  expect(api.plays[0]).toEqual({ trackId: 11, playbackId: expect.stringMatching(/^[0-9a-f-]{36}$/) });
});
