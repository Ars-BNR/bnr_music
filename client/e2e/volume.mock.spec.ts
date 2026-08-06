import { expect, test } from "@playwright/test";

const userPermissions = [
  "profile.manage-own",
  "library.manage-own",
  "creator.apply",
];
const adminPermissions = [
  ...userPermissions,
  "creator.publish",
  "creator.moderate",
  "catalog.manage",
  "users.read",
  "rbac.manage",
];
const user = {
  sub: 1,
  email: "playwright@example.com",
  roles: ["user"],
  permissions: userPermissions,
};
const profile = {
  id: 1,
  email: "playwright@example.com",
  displayName: "Playwright Saint",
  bio: "Тестовый хранитель музыкального архива.",
  avatar: null,
  roles: ["user"],
  permissions: userPermissions,
  isActivated: true,
};
const tracks = [
  {
    id: 1,
    name: "Playwright Track",
    picture: "image/ac2.jpg",
    text: "Test track",
    listens: 0,
    audio: "audio/test.mp3",
    authorName: "Test Author",
    authorId: 1,
    albumId: 1,
  },
  {
    id: 2,
    name: "Second Playwright Track",
    picture: "image/ac3.jpg",
    text: "Second test track",
    listens: 0,
    audio: "audio/test-2.mp3",
    authorName: "Second Test Author",
    authorId: 2,
    albumId: 2,
  },
];
const albums = [
  { id: 1, name: "Album One", listens: 100, authorId: 1, authorName: "Author One", picture: "/image/album-1.jpg" },
  { id: 2, name: "Album Two", listens: 90, authorId: 2, authorName: "Author Two", picture: "/image/album-2.jpg" },
  { id: 3, name: "Album Three", listens: 80, authorId: 3, authorName: "Author Three", picture: "/image/album-3.jpg" },
  { id: 4, name: "Album Four", listens: 70, authorId: 4, authorName: "Author Four", picture: "/image/album-4.jpg" },
  { id: 5, name: "Album Five", listens: 60, authorId: 5, authorName: "Author Five", picture: "/image/album-5.jpg" },
];
const sidebarPlaylists = [
  { id: 51, name: "Purple Reign" },
  { id: 52, name: "Third Street Saints" },
];
const genres = [
  { id: 1, name: "Game music" },
  { id: 2, name: "Hip hop" },
  { id: 3, name: "Electronic" },
];
const genreTracks = Array.from({ length: 21 }, (_, index) => ({
  id: 401 + index,
  name: `Genre Track ${index + 1}`,
  picture: `image/genre-${index + 1}.jpg`,
  text: "Genre test track",
  listens: index,
  audio: `audio/genre-${index + 1}.mp3`,
  authorName: "Genre Author",
  authorId: 40,
  albumId: 4,
}));

const singleAlbumTrack = {
  id: 101,
  name: "Single Album Track",
  picture: "image/single.jpg",
  text: "Only track in this album",
  listens: 0,
  audio: "audio/album-single.mp3",
  authorName: "Album Author",
  authorId: 10,
  albumId: 77,
};
const favoriteTracks = [
  {
    id: 201,
    name: "Favorite First",
    picture: "image/favorite-first.jpg",
    text: "First favorite",
    listens: 0,
    audio: "audio/favorite-first.mp3",
    authorName: "Favorite Author",
    authorId: 20,
    albumId: 20,
  },
  {
    id: 202,
    name: "Favorite Last",
    picture: "image/favorite-last.jpg",
    text: "Last favorite",
    listens: 0,
    audio: "audio/favorite-last.mp3",
    authorName: "Favorite Author",
    authorId: 20,
    albumId: 20,
  },
];
const playlistTracks = [
  {
    id: 301,
    name: "Playlist First",
    picture: "image/playlist-first.jpg",
    text: "First playlist track",
    listens: 0,
    audio: "audio/playlist-first.mp3",
    authorName: "Playlist Author",
    authorId: 30,
    albumId: 30,
  },
  {
    id: 302,
    name: "Playlist Last",
    picture: "image/playlist-last.jpg",
    text: "Last playlist track",
    listens: 0,
    audio: "audio/playlist-last.mp3",
    authorName: "Playlist Author",
    authorId: 30,
    albumId: 30,
  },
];

async function dispatchMediaMetadata(audio: import("@playwright/test").Locator, duration: number) {
  await audio.evaluate((element, mockDuration) => {
    Object.defineProperty(element, "duration", { configurable: true, value: mockDuration });
    Object.defineProperty(element, "currentTime", { configurable: true, value: 0, writable: true });
    element.dispatchEvent(new Event("loadedmetadata"));
    element.dispatchEvent(new Event("durationchange"));
  }, duration);
}

const readMultipartField = (body: string, name: string) => {
  const match = body.match(
    new RegExp(
      `name="${name}"(?:; filename="[^"]*")?\\r\\n(?:Content-Type: [^\\r\\n]+\\r\\n)?\\r\\n([^\\r\\n]*)`,
    ),
  );
  return match?.[1];
};

type LibraryFailures = {
  favoriteAlbums?: boolean;
  favoriteTracks?: boolean;
  playlists?: boolean;
  approvedStudio?: boolean;
};

async function mockApi(page: import("@playwright/test").Page, failures: LibraryFailures = {}) {
  let favoriteAlbums = [{ ...albums[0], favoriteRelationId: 701 }];
  let personalFavoriteTracks = favoriteTracks.map((track) => ({ ...track }));
  let personalPlaylists = sidebarPlaylists.map((playlist, index) => ({ ...playlist, userId: 1, trackCount: index + 1 }));
  let creatorState: "none" | "pending" = "none";
  let authorRequests = 0;
  const creatorSubmissions: Partial<Record<"track" | "album", string>> = {};
  await page.route("**://localhost:8340/refresh", async (route) => route.fulfill({ json: { accessToken: "test-access-token", user } }));
  await page.route("**://localhost:8340/users/me", async (route) => {
    if (route.request().method() === "PATCH") return route.fulfill({ json: profile });
    if (route.request().method() === "POST") return route.fulfill({ json: profile });
    if (route.request().method() === "DELETE") return route.fulfill({ json: profile });
    return route.fulfill({ json: profile });
  });
  await page.route("**://localhost:8340/tracks/search**", async (route) => route.fulfill({ json: tracks }));
  await page.route("**://localhost:8340/tracks**", async (route) => route.fulfill({ json: tracks }));
  await page.route("**://localhost:8340/albums**", async (route) => route.fulfill({ json: [] }));
  await page.route("**://localhost:8340/genres**", async (route) => {
    const url = new URL(route.request().url());
    const match = url.pathname.match(/\/genres\/(\d+)\/tracks$/);
    if (match) {
      const genreId = Number(match[1]);
      if (genreId === 404) return route.fulfill({ status: 404, json: { message: "Genre not found" } });
      const offset = Number(url.searchParams.get("offset") ?? "0");
      const count = Number(url.searchParams.get("count") ?? "20");
      return route.fulfill({ json: { genre: genres[0], tracks: genreTracks.slice(offset, offset + count), total: genreTracks.length } });
    }
    return route.fulfill({ json: genres });
  });
  await page.route("**://localhost:8340/authors**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    if (/\/authors\/1\/tracks$/.test(path)) return route.fulfill({ json: { tracks, total: tracks.length } });
    if (/\/authors\/1\/albums$/.test(path)) return route.fulfill({ json: { albums: albums.filter((album) => album.authorId === 1), total: 1 } });
    if (/\/authors\/1$/.test(path)) return route.fulfill({ json: { id: 1, name: "Genre Author" } });
    authorRequests += 1;
    const query = url.searchParams.get("query")?.trim().toLowerCase() ?? "";
    const availableAuthors = [
      { id: 1, name: "Genre Author" },
      { id: 2, name: "Purple Composer" },
      ...(failures.approvedStudio ? [{ id: 3, name: "Shaundi" }] : []),
    ];
    return route.fulfill({
      json: query
        ? availableAuthors.filter((author) =>
            author.name.toLowerCase().includes(query),
          )
        : availableAuthors,
    });
  });
  await page.route("**://localhost:8340/creator/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/creator/me")) {
      if (failures.approvedStudio) {
        return route.fulfill({
          json: {
            state: "approved",
            author: {
              id: 1,
              name: "Genre Author",
              bio: "Approved Playwright creator",
              avatar: null,
            },
            counts: { tracks: 0, albums: 1 },
          },
        });
      }
      return route.fulfill({ json: creatorState === "none" ? { state: "none" } : { state: "pending", application: { stageName: "Purple Saint", bio: "Музыкальный архив Третьей улицы и редких саундтреков.", avatar: "image/avatar.jpg" } } });
    }
    if (url.pathname.endsWith("/creator/application") && route.request().method() === "POST") {
      creatorState = "pending";
      return route.fulfill({ status: 201, json: { id: 1, status: "pending" } });
    }
    if (url.pathname.endsWith("/creator/tracks")) {
      if (route.request().method() === "POST") {
        creatorSubmissions.track = route.request().postDataBuffer()?.toString("utf8") ?? "";
        return route.fulfill({ status: 201, json: { id: 901, name: "Feat Track" } });
      }
      return route.fulfill({ json: { items: [], total: 0 } });
    }
    if (url.pathname.endsWith("/creator/albums")) {
      if (route.request().method() === "POST") {
        creatorSubmissions.album = route.request().postDataBuffer()?.toString("utf8") ?? "";
        return route.fulfill({ status: 201, json: { id: 902, name: "Feat Album" } });
      }
      return route.fulfill({
        json: {
          items: failures.approvedStudio ? [albums[0]] : [],
          total: failures.approvedStudio ? 1 : 0,
        },
      });
    }
    if (url.pathname.endsWith("/creator/applications")) return route.fulfill({ json: { items: [], total: 0 } });
    return route.fulfill({ json: {} });
  });
  await page.route("**://localhost:8340/collection/**", async (route) => route.fulfill({ json: { id: 1 } }));
  await page.route("**://localhost:8340/collection/me/summary", async (route) => route.fulfill({ json: { collectionId: 1, totalPlaylists: personalPlaylists.length, totalAlbums: favoriteAlbums.length, totalTracks: 2 } }));
  await page.route("**://localhost:8340/collection/me/albums**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const albumId = Number(path.match(/albums\/(\d+)/)?.[1]);
    if (path.endsWith("/status")) return route.fulfill({ json: { isFavorite: favoriteAlbums.some((album) => album.id === albumId) } });
    if (request.method() === "PUT") {
      const album = albums.find((item) => item.id === albumId);
      if (album && !favoriteAlbums.some((item) => item.id === albumId)) favoriteAlbums.push({ ...album, favoriteRelationId: 700 + albumId });
      return route.fulfill({ json: { isFavorite: true } });
    }
    if (request.method() === "DELETE") {
      favoriteAlbums = favoriteAlbums.filter((album) => album.id !== albumId);
      return route.fulfill({ json: { isFavorite: false } });
    }
    if (failures.favoriteAlbums) return route.fulfill({ status: 500, json: { message: "Failed" } });
    return route.fulfill({ json: { items: favoriteAlbums, total: favoriteAlbums.length } });
  });
  await page.route("**://localhost:8340/collection/me/tracks**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const trackId = Number(url.pathname.match(/tracks\/(\d+)/)?.[1]);
    if (url.pathname.endsWith("/status")) {
      return route.fulfill({
        json: {
          isFavorite: personalFavoriteTracks.some((track) => track.id === trackId),
        },
      });
    }
    if (failures.favoriteTracks && request.method() !== "GET") {
      return route.fulfill({ status: 500, json: { message: "Failed" } });
    }
    if (request.method() === "PUT") {
      const track = [...tracks, ...favoriteTracks].find(
        (candidate) => candidate.id === trackId,
      );
      if (track && !personalFavoriteTracks.some((item) => item.id === trackId)) {
        personalFavoriteTracks.push({ ...track });
      }
      return route.fulfill({ json: { isFavorite: true } });
    }
    if (request.method() === "DELETE") {
      personalFavoriteTracks = personalFavoriteTracks.filter(
        (track) => track.id !== trackId,
      );
      return route.fulfill({ json: { isFavorite: false } });
    }
    const offset = Number(url.searchParams.get("offset") ?? "0");
    const count = Number(url.searchParams.get("count") ?? "20");
    return route.fulfill({
      json: {
        items: personalFavoriteTracks.slice(offset, offset + count),
        total: personalFavoriteTracks.length,
      },
    });
  });
  await page.route("**://localhost:8340/playlist/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const detailMatch = path.match(/\/playlist\/(\d+)$/);
    const renameMatch = path.match(/\/playlist\/change\/(\d+)$/);
    const deleteMatch = path.match(/\/playlist\/delete\/(\d+)$/);
    if (detailMatch && request.method() === "GET") {
      const id = Number(detailMatch[1]);
      const playlist = personalPlaylists.find((item) => item.id === id);
      if (!playlist) return route.fulfill({ status: 404, json: { message: "Playlist not found" } });
      return route.fulfill({ json: { id, name: playlist.name, userId: 1, tracks: playlistTracks, total: playlistTracks.length } });
    }
    if (renameMatch && request.method() === "PATCH") {
      const id = Number(renameMatch[1]);
      const body = request.postDataJSON() as { name: string };
      personalPlaylists = personalPlaylists.map((item) => item.id === id ? { ...item, name: body.name } : item);
      return route.fulfill({ json: personalPlaylists.find((item) => item.id === id) });
    }
    if (deleteMatch && request.method() === "DELETE") {
      const id = Number(deleteMatch[1]);
      personalPlaylists = personalPlaylists.filter((item) => item.id !== id);
      return route.fulfill({ status: 200, json: {} });
    }
    return route.fallback();
  });
  await page.route("**://localhost:8340/playlist/mine**", async (route) => {
    if (failures.playlists) return route.fulfill({ status: 500, json: { message: "Failed" } });
    return route.fulfill({ json: { items: personalPlaylists, total: personalPlaylists.length } });
  });
  await page.route("**://localhost:8340/playlist", async (route) => {
    if (route.request().method() === "POST") {
      const body = route.request().postDataJSON() as { name: string };
      const created = { id: 100 + personalPlaylists.length, name: body.name, userId: 1, trackCount: 0 };
      personalPlaylists = [created, ...personalPlaylists];
      return route.fulfill({ json: created });
    }
    return route.fulfill({ json: [] });
  });
  await page.route("**://localhost:8340/collection_playlist/**", async (route) => route.fulfill({ json: sidebarPlaylists }));
  await page.route("**://localhost:8340/collection_track/**", async (route) => {
    if (route.request().method() === "GET") return route.fulfill({ json: favoriteTracks });
    return route.fulfill({ json: {} });
  });
  await page.route("**://localhost:8340/logout", async (route) => route.fulfill({ json: {} }));

  return {
    getAuthorRequestCount: () => authorRequests,
    getCreatorSubmission: (kind: "track" | "album") =>
      creatorSubmissions[kind] ?? "",
  };
}

test("protected page plays a mocked track and keeps page scroll stable while changing volume", async ({ page }) => {
  await mockApi(page);
  await page.goto("/");
  await page.evaluate(() => { document.body.style.minHeight = "3000px"; window.scrollTo(0, 300); });

  const search = page.getByPlaceholder("Search song");
  const searchResults = page.getByRole("list", { name: "Track search results" });
  await search.fill("playwright");
  await searchResults.getByRole("button", { name: /^Playwright Track Test Author/ }).click();

  const volumeButton = page.getByRole("button", { name: /^Volume:/ });
  await expect(volumeButton).toHaveAccessibleName("Volume: 50%");
  await expect(volumeButton).toBeVisible();
  await expect(volumeButton.locator("svg")).toHaveCSS("width", "26px");
  await expect(volumeButton.locator("svg")).toHaveCSS("height", "26px");
  await expect(page.getByRole("slider", { name: "Playback position" })).toHaveCSS(
    "background-color",
    "rgb(99, 0, 255)"
  );
  await volumeButton.hover();
  const volumeSlider = page.getByRole("slider", { name: "Volume" });
  const volumeSliderRoot = page
    .getByRole("dialog", { name: "Volume control" })
    .locator('[data-orientation="vertical"]')
    .first();
  await expect(volumeSlider).toBeVisible();
  await expect(volumeSlider).toHaveCSS("background-color", "rgb(99, 0, 255)");
  const sliderBox = await volumeSliderRoot.boundingBox();
  expect(sliderBox?.height).toBeGreaterThan(100);

  const scrollBefore = await page.evaluate(() => window.scrollY);
  await volumeSliderRoot.hover();
  await page.mouse.wheel(0, 120);
  await expect(volumeButton).toHaveAccessibleName("Volume: 45%");
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(scrollBefore);
  await expect.poll(() => page.locator("audio").evaluate((audio) => (audio as HTMLAudioElement).volume)).toBe(0.45);

  await page.mouse.move(0, 0);
  await page.waitForTimeout(150);
  await expect(page.getByRole("slider", { name: "Volume" })).toBeHidden();

  await search.fill("second");
  await searchResults.getByRole("button", { name: /^Second Playwright Track Second Test Author/ }).click();
  await expect.poll(() => page.locator("audio").evaluate((audio) => (audio as HTMLAudioElement).volume)).toBe(0.45);

  await volumeButton.hover();
  await volumeSliderRoot.hover();
  await expect.poll(() => page.evaluate(() => document.activeElement?.getAttribute("role"))).not.toBe("slider");
  await page.keyboard.press("ArrowUp");
  await expect(volumeButton).toHaveAccessibleName("Volume: 50%");
  await page.keyboard.press("ArrowDown");
  await expect(volumeButton).toHaveAccessibleName("Volume: 45%");
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(scrollBefore);

  await page.keyboard.press("Escape");
  await expect(volumeSlider).toBeHidden();

  await volumeButton.hover();
  await volumeSlider.focus();
  await volumeSlider.press("End");
  await volumeSliderRoot.hover();
  await page.mouse.wheel(0, -120);
  await expect(volumeButton).toHaveAccessibleName("Volume: 100%");
  await volumeSlider.press("Home");
  await page.mouse.wheel(0, 120);
  await expect(volumeButton).toHaveAccessibleName("Volume: 0%");

  const dragStart = await volumeSliderRoot.boundingBox();
  if (!dragStart) throw new Error("Volume slider did not render");
  await page.mouse.move(dragStart.x + dragStart.width / 2, dragStart.y + dragStart.height / 2);
  await page.mouse.down();
  await page.mouse.move(dragStart.x + dragStart.width / 2, dragStart.y - 24);
  await page.mouse.up();
  await expect(volumeSlider).toBeHidden();

  await page.mouse.move(0, 0);
  await page.mouse.wheel(0, 200);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(scrollBefore);
});

test("login route remains reachable without an access token", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator("button[type=submit]")).toBeVisible();
});

test("login accepts the seed password and explains API failures by status", async ({ page }) => {
  await mockApi(page);
  let loginStatus: number | "success" = 400;
  await page.route("**://localhost:8340/login", async (route) => {
    if (loginStatus === "success") {
      return route.fulfill({
        json: {
          accessToken: "admin-access-token",
          user: {
            ...user,
            roles: ["user", "admin"],
            permissions: adminPermissions,
          },
        },
      });
    }
    return route.fulfill({ status: loginStatus, json: { message: "Login failed" } });
  });

  await page.goto("/login");
  await page.getByLabel("Email").fill("seed-admin@example.test");
  await page.getByLabel("Пароль").fill("12345678901234567890");

  for (const [status, message] of [
    [400, "Проверьте формат email и пароля."],
    [401, "Неверный email или пароль."],
    [429, "Слишком много попыток входа. Попробуйте немного позже."],
    [500, "Сервис входа временно недоступен. Попробуйте ещё раз позже."],
  ] as const) {
    loginStatus = status;
    await page.getByRole("button", { name: "Войти" }).click();
    await expect(page.getByText(message)).toBeVisible();
  }

  loginStatus = "success";
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem("token"))).toBe("test-access-token");
});

test("auth shell keeps the heraldic layout, validation, and form transition", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Войти в BNR" })).toBeVisible();
  const headingFont = await page.getByRole("heading", { name: "Войти в BNR" }).evaluate((element) => window.getComputedStyle(element).fontFamily);
  expect(headingFont.toLowerCase()).toContain("cinzel");
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page.getByLabel("Email")).toHaveAttribute("aria-invalid", "true");
  await page.getByRole("link", { name: "Зарегистрироваться" }).click();
  await page.waitForURL("**/registration");
  await expect(page.getByRole("heading", { name: "Создать аккаунт" })).toBeVisible();
  const bounds = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  expect(bounds.scrollWidth).toBeLessThanOrEqual(bounds.clientWidth);
});

test("genre cards lead to a paginated genre queue that stays inside its context", async ({ page }) => {
  await mockApi(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/category");
  await expect(page.getByRole("link", { name: "Открыть жанр Game music" })).toHaveAttribute("href", "/category/1");

  await page.goto("/category/1");
  await expect(page.getByRole("heading", { name: "Game music" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Genre Track/ })).toHaveCount(20);
  await page.getByRole("button", { name: "Показать ещё" }).click();
  await expect(page.getByRole("button", { name: /Genre Track/ })).toHaveCount(21);

  await page.getByRole("button", { name: "Genre Track 1 Genre Author", exact: true }).click();
  await page.getByRole("button", { name: "Shuffle playlist" }).click();
  await page.getByRole("button", { name: "Next track" }).click();
  await expect(page.getByRole("region", { name: "Audio player" })).toContainText(/Genre Track/);
  await expect(page.getByRole("region", { name: "Audio player" })).not.toContainText("Playwright Track");

  await page.goto("/category/404");
  await expect(page.getByText("Жанр не найден")).toBeVisible();
  await expect(page.getByRole("link", { name: "Вернуться к жанрам" })).toHaveAttribute("href", "/category");
});

test("author and track cards adapt without fake imagery", async ({ page }) => {
  await mockApi(page);
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/authors");
  await expect(page.getByRole("article")).toHaveCount(2);
  await expect(page.getByText("Genre Author", { exact: true })).toBeVisible();
  const bounds = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  expect(bounds.scrollWidth).toBeLessThanOrEqual(bounds.clientWidth);
});

test("Search closes its backdrop and ignores stale responses", async ({ page }) => {
  await mockApi(page);
  await page.goto("/");

  const search = page.getByPlaceholder("Search song");
  const backdrop = page.getByTestId("search-backdrop");
  const searchResult = page.getByRole("list", { name: "Track search results" }).getByRole("button", { name: /^Playwright Track Test Author/ });

  await search.focus();
  await expect(backdrop).toBeVisible();
  await search.fill("playwright");
  await expect(searchResult).toBeVisible();

  await backdrop.click();
  await expect(backdrop).toBeHidden();
  await expect(searchResult).toBeHidden();
  await expect(search).toHaveValue("playwright");

  await search.focus();
  await expect(searchResult).toBeVisible();
  await search.press("Escape");
  await expect(backdrop).toBeHidden();
  await expect(searchResult).toBeHidden();

  await page.route("**/tracks/search**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    await route.fulfill({ json: tracks });
  });
  await search.fill("delayed");
  await page.waitForTimeout(350);
  await search.fill("");
  await page.waitForTimeout(550);
  await expect(searchResult).toBeHidden();

  await search.fill("playwright");
  await expect(searchResult).toBeVisible();
  await searchResult.click();
  await expect(backdrop).toBeHidden();
  await expect(page.locator("audio")).toHaveCount(1);
});

test("Sidebar desktop uses the heraldic system, active routes, playlists, and logout", async ({ page }) => {
  await mockApi(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  const mineRequest = page.waitForRequest((request) => new URL(request.url()).pathname === "/playlist/mine");
  await page.goto("/");
  await mineRequest;
  await expect.poll(() => page.evaluate(() => localStorage.getItem("collection"))).toBeNull();

  const desktopSidebar = page.getByTestId("sidebar-desktop");
  const navigation = desktopSidebar.getByRole("navigation", { name: "Основная навигация" });
  await expect(desktopSidebar).toBeVisible();
  await expect(navigation).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Главная", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(desktopSidebar.getByTestId("sidebar-fleur")).toHaveAttribute("aria-hidden", "true");

  const brandFont = await desktopSidebar.getByText("BNR", { exact: true }).evaluate((element) =>
    window.getComputedStyle(element).fontFamily,
  );
  expect(brandFont.toLowerCase()).toContain("cinzel");

  for (const label of ["Главная", "Категории", "Артисты"]) {
    const link = navigation.getByRole("link", { name: label, exact: true });
    const icon = link.locator("svg.lucide");
    await expect(link).toBeVisible();
    await expect(icon).toHaveCSS("width", "24px");
    await expect(icon).toHaveCSS("height", "24px");
  }

  for (const iconClass of ["lucide-list-music", "lucide-log-out"]) {
    const icon = navigation.locator(`svg.${iconClass}`);
    await expect(icon).toBeVisible();
    await expect(icon).toHaveCSS("width", "24px");
    await expect(icon).toHaveCSS("height", "24px");
  }

  const playlistsTrigger = navigation.getByRole("button", { name: "Плейлисты" });
  await playlistsTrigger.click();
  await expect(navigation.getByRole("link", { name: "Purple Reign" })).toBeVisible();

  await page.goto("/category");
  await expect(navigation.getByRole("link", { name: "Категории", exact: true })).toHaveAttribute("aria-current", "page");

  await navigation.getByRole("button", { name: "Выход" }).click();
  await page.waitForURL("**/login");
});

test("Sidebar switches to a labelled rail and playlist popover on tablet", async ({ page }) => {
  await mockApi(page);
  await page.setViewportSize({ width: 900, height: 900 });
  await page.goto("/");

  const desktopSidebar = page.getByTestId("sidebar-desktop");
  const rail = page.getByTestId("sidebar-rail");
  const navigation = rail.getByRole("navigation", { name: "Основная навигация" });
  await expect(desktopSidebar).toBeHidden();
  await expect(rail).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Главная", exact: true })).toHaveAttribute("aria-current", "page");

  const playlistsButton = navigation.getByRole("button", { name: "Плейлисты" });
  await playlistsButton.hover();
  await expect(navigation.getByRole("tooltip", { name: "Плейлисты" })).toBeVisible();
  await playlistsButton.click();

  const popover = page.getByRole("dialog", { name: "Плейлисты" });
  await expect(popover).toBeVisible();
  await expect(popover.getByRole("link", { name: "Purple Reign" })).toBeVisible();
  await popover.getByRole("link", { name: "Все плейлисты" }).click();
  await expect(popover).toBeHidden();

  const bounds = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(bounds.scrollWidth).toBeLessThanOrEqual(bounds.clientWidth);
});

test("Sidebar mobile drawer traps focus, restores it, and closes after navigation", async ({ page }) => {
  await mockApi(page);
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/");

  const mobileHeader = page.getByTestId("sidebar-mobile-header");
  const menuButton = page.getByRole("button", { name: "Открыть навигацию" });
  await expect(mobileHeader).toBeVisible();
  await expect(menuButton).toBeVisible();
  await menuButton.click();

  const drawer = page.getByRole("dialog", { name: "Основная навигация" });
  await expect(drawer).toBeVisible();
  expect(
    await drawer.evaluate((element) => element.contains(document.activeElement)),
  ).toBe(true);

  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(menuButton).toBeFocused();

  await menuButton.click();
  await drawer.getByRole("link", { name: "Категории" }).click();
  await page.waitForURL("**/category");
  await expect(drawer).toBeHidden();

  const bounds = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(bounds.scrollWidth).toBeLessThanOrEqual(bounds.clientWidth);
});

test("Sidebar respects reduced motion and keeps visible keyboard focus", async ({ page }) => {
  await mockApi(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");

  const link = page.getByTestId("sidebar-desktop").getByRole("link", { name: "Главная", exact: true });
  await link.focus();
  await expect(link).toHaveCSS("outline-style", "solid");
  const transitionDuration = await link.evaluate((element) =>
    Number.parseFloat(window.getComputedStyle(element).transitionDuration),
  );
  expect(transitionDuration).toBeLessThanOrEqual(0.00001);
});

test("Album carousel animates API albums and respects autoplay controls", async ({ page }) => {
  await page.clock.install();
  await mockApi(page);
  await page.route("**/albums/popular**", async (route) => route.fulfill({ json: albums }));
  await page.goto("/");

  const carousel = page.getByRole("region", { name: "Popular albums" });
  const activeSlide = carousel.locator('[data-slot="0"]');
  const activeAlbum = () => activeSlide.getByRole("link");

  await expect(carousel).toBeVisible();
  await expect(activeAlbum()).toHaveAttribute("href", "/album/1");
  await expect(activeSlide.locator("img")).toHaveAttribute("src", /album-1\.jpg/);
  await expect(activeSlide).toHaveCSS("transition-duration", "0.42s, 0.42s");

  await carousel.getByRole("button", { name: "Next album" }).click();
  await expect(activeAlbum()).toHaveAttribute("href", "/album/2");

  await page.mouse.move(1200, 800);
  await page.clock.fastForward(5_000);
  await expect(activeAlbum()).toHaveAttribute("href", "/album/3");

  const pauseAutoplay = carousel.getByRole("button", { name: "Pause autoplay" });
  await pauseAutoplay.click();
  await expect(carousel.getByRole("button", { name: "Resume autoplay" })).toBeVisible();
  await page.mouse.move(1200, 800);
  await page.clock.fastForward(10_000);
  await expect(activeAlbum()).toHaveAttribute("href", "/album/3");

  await carousel.getByRole("button", { name: "Resume autoplay" }).click();
  await page.mouse.move(1200, 800);
  await page.clock.fastForward(5_000);
  await expect(activeAlbum()).toHaveAttribute("href", "/album/4");

  await carousel.hover();
  await page.clock.fastForward(5_000);
  await expect(activeAlbum()).toHaveAttribute("href", "/album/4");

  await page.mouse.move(1200, 800);
  await carousel.focus();
  await page.keyboard.press("ArrowRight");
  await expect(activeAlbum()).toHaveAttribute("href", "/album/5");
  await page.keyboard.press("ArrowLeft");
  await expect(activeAlbum()).toHaveAttribute("href", "/album/4");

  await carousel.getByRole("button", { name: "Show album Album Two" }).click();
  await expect(activeAlbum()).toHaveAttribute("href", "/album/2");

  const bounds = await carousel.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { left: rect.left, right: rect.right, scrollWidth: element.scrollWidth, clientWidth: element.clientWidth };
  });
  expect(bounds.left).toBeGreaterThanOrEqual(0);
  expect(bounds.right).toBeLessThanOrEqual(1281);
  expect(bounds.scrollWidth).toBeLessThanOrEqual(bounds.clientWidth);
});

test("Album carousel safely handles short API responses", async ({ page }) => {
  await mockApi(page);
  await page.route("**/albums/popular**", async (route) => route.fulfill({ json: albums.slice(0, 1) }));
  await page.goto("/");

  const carousel = page.getByRole("region", { name: "Popular albums" });
  await expect(carousel.locator("[data-slot]")).toHaveCount(1);
  await expect(carousel.getByRole("button", { name: "Previous album" })).toBeDisabled();
  await expect(carousel.getByRole("button", { name: "Next album" })).toBeDisabled();
  await expect(carousel.getByRole("link", { name: "Album One" })).toHaveAttribute("href", "/album/1");
});

test("Player controls use Lucide icons and fit every supported viewport", async ({ page }) => {
  await mockApi(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");

  await page.getByPlaceholder("Search song").fill("playwright");
  await page.getByRole("list", { name: "Track search results" }).getByRole("button", { name: /^Playwright Track Test Author/ }).click();

  const player = page.getByRole("region", { name: "Audio player" });
  const playerButtons = [
    page.getByRole("button", { name: "Previous track" }),
    page.getByRole("button", { name: /^(Play|Pause)$/ }),
    page.getByRole("button", { name: "Next track" }),
    page.getByRole("button", { name: "Add track to favorites" }),
    page.getByRole("button", { name: "Repeat playlist" }),
    page.getByRole("button", { name: "Shuffle playlist" }),
    page.getByRole("button", { name: /^Volume:/ }),
  ];

  for (const button of playerButtons) {
    await expect(button).toBeVisible();
    await expect(button.locator("svg")).toHaveCSS("width", "26px");
    await expect(button.locator("svg")).toHaveCSS("height", "26px");
  }

  const repeatButton = page.getByRole("button", { name: "Repeat playlist" });
  await expect(repeatButton).toHaveAttribute("aria-pressed", "false");
  await repeatButton.click();
  await expect(repeatButton).toHaveAttribute("aria-pressed", "true");

  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(player).toBeVisible();

    const playerBounds = await player.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      return {
        left: bounds.left,
        right: bounds.right,
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
      };
    });

    expect(playerBounds.left).toBeGreaterThanOrEqual(0);
    expect(playerBounds.right).toBeLessThanOrEqual(width + 1);
    expect(playerBounds.scrollWidth).toBeLessThanOrEqual(playerBounds.clientWidth);
  }

  await page.setViewportSize({ width: 375, height: 900 });
  for (const button of playerButtons) {
    await expect(button).toBeInViewport();
  }
});

test("a one-track album restarts in shuffle mode without losing its duration", async ({ page }) => {
  await mockApi(page);
  await page.route("**/albums/77", async (route) =>
    route.fulfill({
      json: {
        id: 77,
        name: "Single track album",
        listens: 0,
        authorId: 10,
        authorName: "Album Author",
        picture: "image/single.jpg",
        tracks: [singleAlbumTrack],
      },
    })
  );
  await page.goto("/album/77");

  await page.getByText("Single Album Track", { exact: true }).click();
  const player = page.getByRole("region", { name: "Audio player" });
  const audio = page.locator("audio");
  await dispatchMediaMetadata(audio, 121);
  await expect(player).toContainText("2:01");
  await page.getByRole("button", { name: "Shuffle playlist" }).click();

  await audio.evaluate((element) => {
    const media = element as HTMLAudioElement;
    media.currentTime = 18;
    media.dispatchEvent(new Event("timeupdate"));
  });
  await expect(player).toContainText("0:18");
  await page.getByRole("button", { name: "Next track" }).click();
  await expect(player).toContainText("2:01");
  await expect(player).toContainText("0:00");
  await expect.poll(() => audio.evaluate((element) => (element as HTMLAudioElement).src.includes("album-single.mp3"))).toBe(true);

  await audio.evaluate((element) => element.dispatchEvent(new Event("ended")));
  await expect(player).toContainText("2:01");
  await expect(player).toContainText("0:00");
  await expect.poll(() => audio.evaluate((element) => (element as HTMLAudioElement).src.includes("album-single.mp3"))).toBe(true);
});

test("favorite-track shuffle stays within favorites and cycles from the last track", async ({ page }) => {
  await mockApi(page);
  await page.goto("/collection/tracks");

  await page.getByText("Favorite Last", { exact: true }).click();
  const player = page.getByRole("region", { name: "Audio player" });
  const audio = page.locator("audio");
  await dispatchMediaMetadata(audio, 203);
  await expect(player).toContainText("Favorite Last");
  await expect(player).toContainText("3:23");
  await page.getByRole("button", { name: "Shuffle playlist" }).click();

  await page.getByRole("button", { name: "Next track" }).click();
  await expect(player).toContainText("Favorite First");
  await dispatchMediaMetadata(audio, 171);
  await expect(player).toContainText("2:51");
  await expect(player).not.toContainText("Playwright Track");

  await page.getByRole("button", { name: "Previous track" }).click();
  await expect(player).toContainText("Favorite Last");
  await dispatchMediaMetadata(audio, 203);
  await expect(player).toContainText("3:23");

  await audio.evaluate((element) => element.dispatchEvent(new Event("ended")));
  await expect(player).toContainText("Favorite First");
  await dispatchMediaMetadata(audio, 171);
  await expect(player).toContainText("2:51");

  await page.getByRole("button", { name: "Next track" }).click();
  await expect(player).toContainText("Favorite Last");
  await dispatchMediaMetadata(audio, 203);
  await expect(player).toContainText("3:23");
});

test("favorite toggle ignores a stale collection id and uses the owner-derived API", async ({ page }) => {
  await mockApi(page);
  await page.addInitScript(() => localStorage.setItem("collection", "999"));
  const legacyRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/collection_track")) {
      legacyRequests.push(request.url());
    }
  });
  await page.goto("/");

  await page
    .getByRole("button", { name: /^Playwright Track Test Author/ })
    .first()
    .click();
  const addButton = page.getByRole("button", { name: "Add track to favorites" });
  await expect(addButton).toBeEnabled();
  const addRequest = page.waitForRequest(
    (request) =>
      new URL(request.url()).pathname === "/collection/me/tracks/1" &&
      request.method() === "PUT",
  );
  await addButton.click();
  await addRequest;
  await expect(
    page.getByRole("button", { name: "Remove track from favorites" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("collection")))
    .toBeNull();

  await page.goto("/collection/tracks");
  await expect(
    page.getByRole("button", { name: /^Playwright Track Test Author/ }),
  ).toBeVisible();
  expect(legacyRequests).toEqual([]);
});

test("failed favorite mutation keeps the heart state unchanged", async ({ page }) => {
  const failures: LibraryFailures = { favoriteTracks: true };
  await mockApi(page, failures);
  await page.goto("/");

  await page
    .getByRole("button", { name: /^Playwright Track Test Author/ })
    .first()
    .click();
  const addButton = page.getByRole("button", { name: "Add track to favorites" });
  await expect(addButton).toBeEnabled();
  await addButton.click();

  await expect(
    page.getByRole("alert").filter({
      hasText: "Не удалось обновить любимые треки.",
    }),
  ).toBeVisible();
  await expect(addButton).toHaveAttribute("aria-pressed", "false");
});

test("playlist shuffle uses its own queue for next and previous tracks", async ({ page }) => {
  await mockApi(page);
  await page.route("**://localhost:8340/playlist/55**", async (route) =>
    route.fulfill({ json: { id: 55, name: "Test playlist", userId: 1, tracks: playlistTracks, total: playlistTracks.length } })
  );
  await page.goto("/playlist/55");

  await page.getByText("Playlist Last", { exact: true }).click();
  const player = page.getByRole("region", { name: "Audio player" });
  const audio = page.locator("audio");
  await dispatchMediaMetadata(audio, 184);
  await expect(player).toContainText("Playlist Last");
  await expect(player).toContainText("3:04");

  await page.getByRole("button", { name: "Shuffle playlist" }).click();
  await page.getByRole("button", { name: "Next track" }).click();
  await expect(player).toContainText("Playlist First");
  await dispatchMediaMetadata(audio, 142);
  await expect(player).toContainText("2:22");
  await expect(player).not.toContainText("Playwright Track");

  await page.getByRole("button", { name: "Previous track" }).click();
  await expect(player).toContainText("Playlist Last");
  await dispatchMediaMetadata(audio, 184);
  await expect(player).toContainText("3:04");
});

test("Sidebar opens a real owner-derived playlist detail without collection localStorage", async ({ page }) => {
  await mockApi(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");

  const navigation = page.getByTestId("sidebar-desktop").getByRole("navigation", { name: "Основная навигация" });
  await navigation.getByRole("button", { name: "Плейлисты" }).click();
  await navigation.getByRole("link", { name: "Purple Reign" }).click();

  await expect(page).toHaveURL(/\/playlist\/51$/);
  await expect(page.getByRole("heading", { name: "Purple Reign" })).toBeVisible();
  await expect(page.getByText("Playlist First", { exact: true })).toBeVisible();
});

test("playlist detail distinguishes forbidden, missing, and retryable server errors", async ({ page }) => {
  await mockApi(page);
  let status = 403;
  await page.route("**://localhost:8340/playlist/999**", async (route) => {
    if (status === 200) {
      return route.fulfill({ json: { id: 999, name: "Recovered playlist", userId: 1, tracks: [], total: 0 } });
    }
    return route.fulfill({ status, json: { message: "Failed" } });
  });

  await page.goto("/playlist/999");
  await expect(page.getByText("Доступ запрещён", { exact: true })).toBeVisible();

  status = 404;
  await page.reload();
  await expect(page.getByText("Плейлист не найден", { exact: true })).toBeVisible();

  status = 500;
  await page.reload();
  await expect(page.getByText("Не удалось загрузить плейлист. Проверьте подключение и повторите попытку.")).toBeVisible();
  status = 200;
  await page.getByRole("button", { name: "Повторить" }).click();
  await expect(page.getByRole("heading", { name: "Recovered playlist" })).toBeVisible();
});

test("profile panel and settings keep the private BNR dossier accessible", async ({ page }) => {
  await mockApi(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/profile");

  await expect(page.getByRole("heading", { name: "Playwright Saint" })).toBeVisible();
  await expect(page.getByText("Тестовый хранитель музыкального архива.")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Панель профиля" }).getByRole("link", { name: "Открыть профиль" })).toHaveAttribute("href", "/profile");
  await expect(page.getByRole("navigation", { name: "Панель профиля" }).getByRole("link", { name: "Любимые альбомы" })).toHaveAttribute("href", "/collection/albums");
  await expect(page.locator("[data-testid='sidebar-fleur']")).toBeVisible();

  await page.goto("/settings");
  await page.getByRole("tab", { name: "Профиль" }).click();
  await page.getByLabel("Имя").fill("Purple Test");
  await page.getByRole("button", { name: "Сохранить профиль" }).click();
  await expect(page.getByText("Профиль сохранён.")).toBeVisible();
  await page.getByRole("tab", { name: "Безопасность" }).click();
  await expect(page.getByText("После сохранения потребуется активировать новый адрес и войти заново.")).toBeVisible();
});

test("favorite albums, author archive and playlist management use the redesigned flows", async ({ page }) => {
  await mockApi(page);
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/collection/albums");
  await expect(page.getByRole("heading", { name: "Любимые альбомы" })).toBeVisible();
  await page.getByRole("button", { name: /Удалить Album One из любимых/ }).click();
  await expect(page.getByText("Любимых альбомов пока нет")).toBeVisible();

  await page.goto("/authors/1");
  await expect(page.getByRole("heading", { name: "Genre Author" })).toBeVisible();
  await page.getByRole("button", { name: "Воспроизвести Playwright Track" }).click();
  await expect(page.getByRole("region", { name: "Audio player" })).toContainText("Playwright Track");

  await page.goto("/collection/playlist");
  await page.getByRole("button", { name: "Создать плейлист" }).click();
  await page.getByLabel("Название").fill("New Saints Mix");
  await page.getByRole("button", { name: "Сохранить" }).click();
  await expect(page.getByRole("link", { name: "Открыть плейлист New Saints Mix" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("favorite track cards use equal grid columns at every supported viewport", async ({ page }) => {
  await mockApi(page);
  await page.addInitScript(() => localStorage.setItem("collection", "1"));

  for (const viewport of [375, 768, 1280]) {
    await page.setViewportSize({ width: viewport, height: 900 });
    await page.goto("/collection/tracks");
    const cards = page.getByRole("button", { name: /Favorite (First|Last)/ });
    await expect(cards).toHaveCount(2);
    const first = await cards.nth(0).boundingBox();
    const second = await cards.nth(1).boundingBox();
    expect(first?.width).toBeGreaterThan(0);
    expect(second?.width).toBeCloseTo(first?.width ?? 0, 1);
    expect(first?.height).toBeCloseTo(second?.height ?? 0, 1);
  }
});

test("library pages show retryable errors without an incorrect empty state", async ({ page }) => {
  const failures: LibraryFailures = { favoriteAlbums: true, playlists: true };
  await mockApi(page, failures);

  await page.goto("/collection/albums");
  await expect(page.getByText("Не удалось загрузить любимые альбомы.")).toBeVisible();
  await expect(page.getByText("Любимых альбомов пока нет")).toHaveCount(0);
  failures.favoriteAlbums = false;
  await page.getByRole("button", { name: "Повторить" }).click();
  await expect(page.getByRole("link", { name: "Открыть альбом Album One" })).toBeVisible();

  await page.goto("/collection/playlist");
  await expect(page.getByText("Не удалось загрузить плейлисты.")).toBeVisible();
  await expect(page.getByText("Плейлистов пока нет")).toHaveCount(0);
  failures.playlists = false;
  await page.getByRole("button", { name: "Повторить" }).click();
  await expect(page.getByRole("link", { name: "Открыть плейлист Purple Reign" })).toBeVisible();
});

test("creator studio submits a heraldic application and transitions to pending", async ({ page }) => {
  await mockApi(page);
  await page.goto("/studio");

  await expect(page.getByRole("heading", { name: "Стать автором" })).toBeVisible();
  const avatar = page.getByLabel("Аватар автора");
  await avatar.setInputFiles({ name: "seal.png", mimeType: "image/png", buffer: Buffer.from("png") });
  await page.getByLabel("Псевдоним").fill("Purple Saint");
  await page.getByLabel("О себе").fill("Музыкальный архив Третьей улицы и редких саундтреков.");
  await page.getByRole("button", { name: "Отправить заявку" }).click();

  await expect(page.getByRole("heading", { name: "Заявка на рассмотрении" })).toBeVisible();
  await expect(page.getByRole("status", { name: /Загружаем авторскую студию/ })).toHaveCount(0);
});

test("studio popovers support pointer keyboard Escape and restore focus", async ({
  page,
}) => {
  const studio = await mockApi(page, { approvedStudio: true });
  await page.goto("/studio");
  await expect(page.getByRole("heading", { name: "Genre Author" })).toBeVisible();
  await page.getByRole("button", { name: "Создать трек" }).click();
  const dialog = page.getByRole("dialog", { name: "Создать трек" });
  const featTrigger = dialog.getByRole("button", {
    name: "Добавить feat-автора",
  });
  await featTrigger.click();
  const featSearch = page.getByRole("combobox", {
    name: "Поиск feat-автора",
  });

  await expect.poll(studio.getAuthorRequestCount).toBeGreaterThan(0);
  await expect(featSearch).toBeFocused();
  await expect(page.getByRole("option", { name: "Purple Composer" })).toBeVisible();
  await expect(page.getByRole("option", { name: "Genre Author" })).toHaveCount(0);

  await page.keyboard.press("Escape");
  await expect(page.getByRole("option", { name: "Purple Composer" })).toHaveCount(0);
  await expect(featTrigger).toBeFocused();

  await featTrigger.press("Enter");
  await expect(featSearch).toBeFocused();
  const authorRequestsBeforeSearch = studio.getAuthorRequestCount();
  await featSearch.fill("Purple");
  await expect
    .poll(studio.getAuthorRequestCount)
    .toBeGreaterThan(authorRequestsBeforeSearch);
  await expect(page.getByRole("option", { name: "Purple Composer" })).toBeVisible();
  await featSearch.press("ArrowDown");
  await featSearch.press("Enter");
  await expect(
    dialog.getByRole("button", { name: "Убрать Purple Composer" }),
  ).toBeVisible();

  await page.keyboard.press("Escape");
  const selectedFeatTrigger = dialog.getByRole("button", {
    name: "Выбрано: 1",
  });
  await expect(selectedFeatTrigger).toBeFocused();

  const genreTrigger = dialog.getByRole("button", {
    name: "Выберите хотя бы один жанр",
  });
  const genreTriggerControl = dialog.locator(
    'button[aria-haspopup="listbox"][aria-invalid]',
  );
  await genreTrigger.click();
  const genreSearch = page.getByPlaceholder("Найти жанр");
  await expect(genreSearch).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("option", { name: "Game music" })).toHaveCount(0);
  await expect(genreTrigger).toBeFocused();

  await genreTrigger.press("Enter");
  await expect(genreSearch).toBeFocused();
  const gameMusicOption = page.getByRole("option", { name: "Game music" });
  const hipHopOption = page.getByRole("option", { name: "Hip hop" });
  await expect(gameMusicOption).toBeVisible();
  await expect(hipHopOption).toBeVisible();
  await expect(gameMusicOption).toHaveAttribute("aria-selected", "true");
  await genreSearch.press("ArrowDown");
  await expect(gameMusicOption).toHaveAttribute("aria-selected", "false");
  await expect(hipHopOption).toHaveAttribute("aria-selected", "true");
  await expect(genreSearch).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(genreTriggerControl).toHaveAttribute("aria-label", "Hip hop");
  await page.keyboard.press("Escape");
  await expect(genreTriggerControl).toHaveAccessibleName("Hip hop");
  await expect(genreTriggerControl).toBeFocused();
});

test("approved studio submits ordered feat ids for tracks and albums", async ({
  page,
}) => {
  const studio = await mockApi(page, { approvedStudio: true });
  await page.goto("/studio");

  await page.getByRole("button", { name: "Создать трек" }).click();
  const trackDialog = page.getByRole("dialog", { name: "Создать трек" });
  await trackDialog.getByLabel("Название").fill("Feat Track");
  await trackDialog.getByLabel("Текст или описание").fill("Multiple feat test");

  await trackDialog
    .getByRole("button", { name: "Добавить feat-автора" })
    .click();
  const featSearch = page.getByRole("combobox", { name: "Поиск feat-автора" });
  await featSearch.fill("Purple");
  await expect(page.getByRole("option", { name: "Genre Author" })).toHaveCount(0);
  await page.getByRole("option", { name: "Purple Composer" }).click();
  await expect(trackDialog.getByRole("button", { name: "Убрать Purple Composer" })).toBeVisible();
  await featSearch.fill("Shaundi");
  await page.getByRole("option", { name: "Shaundi" }).click();
  await expect(trackDialog.getByRole("button", { name: "Убрать Shaundi" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(trackDialog.getByRole("button", { name: "Выбрано: 2" })).toBeFocused();

  await trackDialog
    .getByRole("button", { name: "Выберите хотя бы один жанр" })
    .click();
  await page.getByRole("option", { name: "Game music" }).click();
  await page.keyboard.press("Escape");
  await expect(trackDialog.getByRole("button", { name: "Game music" })).toBeFocused();
  await trackDialog.getByLabel("Альбом").click();
  await page.getByRole("option", { name: "Album One" }).click();
  await trackDialog.getByLabel("Обложка").setInputFiles({
    name: "track-cover.png",
    mimeType: "image/png",
    buffer: Buffer.from("track-cover"),
  });
  await trackDialog.getByLabel("Аудиофайл").setInputFiles({
    name: "track.mp3",
    mimeType: "audio/mpeg",
    buffer: Buffer.from("track-audio"),
  });
  await trackDialog.getByRole("button", { name: "Опубликовать" }).click();
  await expect(trackDialog).toBeHidden();

  const trackBody = studio.getCreatorSubmission("track");
  expect(readMultipartField(trackBody, "featuredAuthorIds")).toBe("[2,3]");
  expect(readMultipartField(trackBody, "genreIds")).toBe("[1]");
  expect(readMultipartField(trackBody, "albumId")).toBe("1");
  expect(readMultipartField(trackBody, "authorId")).toBeUndefined();

  await page.getByRole("tab", { name: "Альбомы" }).click();
  await page.getByRole("button", { name: "Создать альбом" }).click();
  const albumDialog = page.getByRole("dialog", { name: "Создать альбом" });
  await albumDialog.getByLabel("Название").fill("Feat Album");
  await albumDialog
    .getByRole("button", { name: "Добавить feat-автора" })
    .click();
  const albumFeatSearch = page.getByRole("combobox", {
    name: "Поиск feat-автора",
  });
  await albumFeatSearch.fill("Purple");
  await page.getByRole("option", { name: "Purple Composer" }).click();
  await albumFeatSearch.fill("Shaundi");
  await page.getByRole("option", { name: "Shaundi" }).click();
  await page.keyboard.press("Escape");
  await expect(albumDialog.getByRole("button", { name: "Выбрано: 2" })).toBeFocused();
  await albumDialog.getByLabel("Обложка альбома").setInputFiles({
    name: "album-cover.webp",
    mimeType: "image/webp",
    buffer: Buffer.from("album-cover"),
  });
  await albumDialog.getByRole("button", { name: "Опубликовать" }).click();
  await expect(albumDialog).toBeHidden();

  const albumBody = studio.getCreatorSubmission("album");
  expect(readMultipartField(albumBody, "featuredAuthorIds")).toBe("[2,3]");
  expect(readMultipartField(albumBody, "authorId")).toBeUndefined();
});

test("heraldic loader announces delayed authorization and respects reduced motion", async ({ page }) => {
  await mockApi(page);
  await page.route("**://localhost:8340/refresh", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 280));
    await route.fulfill({ json: { accessToken: "test-access-token", user } });
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const loader = page.getByRole("status", { name: "Проверяем доступ" });
  await expect(loader).toBeVisible();
  await expect(loader.locator(".heraldic-loader__echo").first()).toHaveCSS("animation-name", "none");
  await expect(loader).toBeHidden();
});
