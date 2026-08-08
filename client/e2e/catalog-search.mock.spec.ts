import { expect, test, type Page, type Route } from "@playwright/test";

const principal = {
  sub: 1,
  email: "catalog@example.test",
  roles: ["user", "author"],
  permissions: [
    "profile.manage-own",
    "library.manage-own",
    "creator.apply",
    "creator.publish",
  ],
};

const primaryAuthor = { id: 1, name: "Neon Saint", avatar: null };
const featuredAuthor = { id: 2, name: "Purple Guest", avatar: null };
const secondAuthor = { id: 3, name: "Shaundi", avatar: null };
const albums = [
  {
    id: 10,
    name: "Neon Archive",
    picture: "/image/neon.webp",
    listens: 120,
    authorId: primaryAuthor.id,
    authorName: primaryAuthor.name,
    featuredAuthors: [featuredAuthor],
  },
  {
    id: 11,
    name: "Third Street Sessions",
    picture: "/image/third-street.webp",
    listens: 90,
    authorId: primaryAuthor.id,
    authorName: primaryAuthor.name,
    featuredAuthors: [],
  },
  ...Array.from({ length: 19 }, (_, index) => ({
    id: 12 + index,
    name: `Archive Volume ${index + 1}`,
    picture: `/image/archive-${index + 1}.webp`,
    listens: 70 - index,
    authorId: secondAuthor.id,
    authorName: secondAuthor.name,
    featuredAuthors: [],
  })),
];

const track = {
  id: 20,
  name: "Neon Crown",
  picture: "/image/neon-crown.webp",
  text: "Catalog fixture",
  listens: 42,
  audio: "/audio/neon-crown.mp3",
  authorId: primaryAuthor.id,
  authorName: primaryAuthor.name,
  featuredAuthors: [featuredAuthor],
  albums: [
    { id: albums[0].id, name: albums[0].name },
    { id: albums[1].id, name: albums[1].name },
  ],
  albumId: albums[0].id,
};

const tracks = [
  track,
  ...Array.from({ length: 20 }, (_, index) => ({
    ...track,
    id: 21 + index,
    name: index === 0 ? "Solo Signal" : `Archive Track ${index + 2}`,
    audio: `/audio/archive-${index + 2}.mp3`,
    ...(index === 0 ? { albums: [], albumId: undefined } : {}),
  })),
];

const preview = {
  tracks: { items: [track], total: tracks.length },
  authors: { items: [primaryAuthor], total: 1 },
  albums: { items: [albums[0]], total: albums.length },
  genres: { items: [{ id: 30, name: "Synthwave" }], total: 1 },
  playlists: {
    items: [
      {
        id: 40,
        name: "Purple Night Drive",
        ownerName: "Catalog Keeper",
        trackCount: 7,
      },
    ],
    total: 1,
  },
};

const fulfillJson = (route: Route, json: unknown, status = 200) =>
  route.fulfill({ status, json });

const readMultipartField = (body: string, name: string) => {
  const match = body.match(
    new RegExp(
      `name="${name}"(?:; filename="[^"]*")?\\r\\n(?:Content-Type: [^\\r\\n]+\\r\\n)?\\r\\n([^\\r\\n]*)`,
    ),
  );
  return match?.[1];
};

async function mockCatalogApp(page: Page) {
  const searchRequests: string[] = [];
  const typedOffsets: number[] = [];
  const creatorTrackRequests: Array<{
    name: string;
    albumIds: number[];
    featuredAuthorIds: number[];
    genreIds: number[];
    idempotencyKey: string;
  }> = [];
  const creatorAlbumKeys: string[] = [];
  const assignments: Array<{ albumId: number; trackIds: number[] }> = [];
  const studioTracks = [track, tracks[1]];
  const studioAlbums = [albums[0], albums[1]];
  const deletedTrackBatches: number[][] = [];
  const deletedAlbumBatches: number[][] = [];
  const creatorProfile = {
    ...primaryAuthor,
    bio: "Approved creator fixture biography",
  };
  const creatorProfileDeletes: Array<{ currentPassword: string; stageName: string }> = [];
  let creatorDeleted = false;
  let brokenDraftAttempts = 0;

  await page.route("**://localhost:8340/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (path === "/refresh") {
      return fulfillJson(route, {
        accessToken: "catalog-access-token",
        user: creatorDeleted
          ? { ...principal, roles: ["user"], permissions: principal.permissions.filter((permission) => permission !== "creator.publish") }
          : principal,
      });
    }
    if (path === "/users/me") {
      return fulfillJson(route, {
        id: principal.sub,
        displayName: "Catalog Keeper",
        bio: "",
        avatar: null,
        isActivated: true,
        ...principal,
      });
    }
    if (path === "/playlist/mine") {
      return fulfillJson(route, { items: [], total: 0 });
    }
    if (path === "/collection/me/summary") {
      return fulfillJson(route, {
        collectionId: 1,
        totalPlaylists: 0,
        totalAlbums: 0,
        totalTracks: 0,
      });
    }
    if (/^\/collection\/me\/tracks\/\d+\/status$/.test(path)) {
      return fulfillJson(route, { isFavorite: false });
    }
    if (path === "/tracks/popular" || path === "/albums/popular") {
      return fulfillJson(route, []);
    }
    if (path === "/genres") {
      return fulfillJson(route, [{ id: 30, name: "Synthwave" }]);
    }
    if (path === "/authors") {
      return fulfillJson(route, [primaryAuthor, featuredAuthor, secondAuthor]);
    }
    if (path === "/creator/me") {
      if (request.method() === "PATCH") {
        const body = request.postDataBuffer()?.toString("utf8") ?? "";
        creatorProfile.name = readMultipartField(body, "stageName") ?? creatorProfile.name;
        creatorProfile.bio = readMultipartField(body, "bio") ?? creatorProfile.bio;
        return fulfillJson(route, {
          state: "approved",
          author: creatorProfile,
          counts: { tracks: studioTracks.length, albums: studioAlbums.length },
        });
      }
      if (request.method() === "DELETE") {
        const body = request.postDataJSON() as { currentPassword: string; stageName: string };
        creatorProfileDeletes.push(body);
        if (body.currentPassword !== "author-password") return fulfillJson(route, { message: "Current password is incorrect" }, 401);
        creatorDeleted = true;
        studioTracks.splice(0);
        studioAlbums.splice(0);
        return fulfillJson(route, { deleted: true, authorId: creatorProfile.id });
      }
      if (creatorDeleted) return fulfillJson(route, { state: "none" });
      return fulfillJson(route, {
        state: "approved",
        author: creatorProfile,
        counts: { tracks: studioTracks.length, albums: studioAlbums.length },
      });
    }
    if (path === "/creator/albums" && request.method() === "GET") {
      return fulfillJson(route, { items: studioAlbums, total: studioAlbums.length });
    }
    if (path === "/creator/tracks" && request.method() === "GET") {
      return fulfillJson(route, { items: studioTracks, total: studioTracks.length });
    }
    const singleTrackDelete = path.match(/^\/creator\/tracks\/(\d+)$/);
    if (singleTrackDelete && request.method() === "DELETE") {
      const id = Number(singleTrackDelete[1]);
      studioTracks.splice(studioTracks.findIndex((item) => item.id === id), 1);
      deletedTrackBatches.push([id]);
      return fulfillJson(route, { deletedIds: [id] });
    }
    if (path === "/creator/tracks/bulk-delete" && request.method() === "POST") {
      const ids = (request.postDataJSON() as { ids: number[] }).ids;
      ids.forEach((id) => { const index = studioTracks.findIndex((item) => item.id === id); if (index >= 0) studioTracks.splice(index, 1); });
      deletedTrackBatches.push(ids);
      return fulfillJson(route, { deletedIds: ids });
    }
    if (path === "/creator/albums/bulk-delete" && request.method() === "POST") {
      const ids = (request.postDataJSON() as { ids: number[] }).ids;
      ids.forEach((id) => { const index = studioAlbums.findIndex((item) => item.id === id); if (index >= 0) studioAlbums.splice(index, 1); });
      deletedAlbumBatches.push(ids);
      return fulfillJson(route, { deletedIds: ids });
    }
    if (path === "/creator/albums" && request.method() === "POST") {
      creatorAlbumKeys.push(request.headers()["idempotency-key"] ?? "");
      return fulfillJson(route, { ...albums[0], id: 99, name: "Bulk Album" }, 201);
    }
    if (path === "/creator/tracks" && request.method() === "POST") {
      const body = request.postDataBuffer()?.toString("utf8") ?? "";
      const name = readMultipartField(body, "name") ?? "";
      creatorTrackRequests.push({
        name,
        albumIds: JSON.parse(readMultipartField(body, "albumIds") ?? "[]") as number[],
        featuredAuthorIds: JSON.parse(
          readMultipartField(body, "featuredAuthorIds") ?? "[]",
        ) as number[],
        genreIds: JSON.parse(readMultipartField(body, "genreIds") ?? "[]") as number[],
        idempotencyKey: request.headers()["idempotency-key"] ?? "",
      });
      if (name === "Broken Draft" && brokenDraftAttempts++ === 0) {
        return fulfillJson(route, { message: "Temporary upload failure" }, 500);
      }
      return fulfillJson(
        route,
        { ...track, id: name === "Broken Draft" ? 502 : 501, name },
        201,
      );
    }
    const assignment = path.match(/^\/creator\/albums\/(\d+)\/tracks$/);
    if (assignment && request.method() === "PUT") {
      const body = request.postDataJSON() as { trackIds: number[] };
      assignments.push({ albumId: Number(assignment[1]), trackIds: body.trackIds });
      return fulfillJson(route, {
        albumId: Number(assignment[1]),
        trackIds: body.trackIds,
        addedTrackIds: body.trackIds,
      });
    }
    if (path === "/albums/catalog") {
      const offset = Number(url.searchParams.get("offset") ?? "0");
      const count = Number(url.searchParams.get("count") ?? "20");
      return fulfillJson(route, {
        items: albums.slice(offset, offset + count),
        total: albums.length,
      });
    }
    if (path === "/search") {
      const query = url.searchParams.get("query") ?? "";
      searchRequests.push(query);
      if (query === "old") {
        await new Promise((resolve) => setTimeout(resolve, 550));
        return fulfillJson(route, {
          ...preview,
          tracks: {
            items: [{ ...track, id: 999, name: "Obsolete Result" }],
            total: 1,
          },
        });
      }
      if (query === "neon") {
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      return fulfillJson(route, preview);
    }
    const searchType = path.match(
      /^\/search\/(tracks|authors|albums|genres|playlists)$/,
    )?.[1];
    if (searchType) {
      const offset = Number(url.searchParams.get("offset") ?? "0");
      typedOffsets.push(offset);
      if (searchType === "tracks") {
        return fulfillJson(route, {
          items: tracks.slice(offset, offset + 20),
          total: tracks.length,
        });
      }
      return fulfillJson(route, preview[searchType as keyof typeof preview]);
    }
    if (/^\/tracks\/listen\/\d+$/.test(path)) {
      return fulfillJson(route, { listens: 43 }, 201);
    }
    if (/^\/(image|audio)\//.test(path)) {
      return route.fulfill({ status: 404, body: "" });
    }
    return fulfillJson(route, []);
  });

  return {
    searchRequests,
    typedOffsets,
    creatorTrackRequests,
    creatorAlbumKeys,
    assignments,
    deletedTrackBatches,
    deletedAlbumBatches,
    creatorProfileDeletes,
  };
}

const catalogSearchInput = (page: Page) =>
  page.getByRole("searchbox", { name: /поиск/i });

test("search launcher opens the dedicated page and ignores stale responses", async ({
  page,
}) => {
  const requests = await mockCatalogApp(page);
  await page.goto("/");

  const launcher = catalogSearchInput(page);
  await launcher.focus();
  await page.waitForURL("**/search**");
  const input = catalogSearchInput(page);
  await expect(input).toBeFocused();

  await input.fill("old");
  await expect.poll(() => requests.searchRequests.includes("old")).toBe(true);
  await input.fill("neon");
  await expect(page).toHaveURL(/\/search\?.*q=neon(?:&|$)/);
  await expect(page.getByText("Neon Crown", { exact: true })).toBeVisible();
  await page.waitForTimeout(600);
  await expect(page.getByText("Obsolete Result", { exact: true })).toHaveCount(0);

  const results = page.getByRole("region", {
    name: "Поиск по музыкальному архиву",
  });
  await expect(results.getByRole("heading", { name: "Треки" })).toBeVisible();
  await expect(results.getByRole("heading", { name: "Авторы" })).toBeVisible();
  await expect(results.getByRole("heading", { name: "Альбомы" })).toBeVisible();
  await expect(results.getByRole("heading", { name: "Жанры" })).toBeVisible();
  await expect(results.getByRole("heading", { name: "Плейлисты" })).toBeVisible();
});

test("typed search tabs paginate and every result type keeps its destination", async ({
  page,
}) => {
  const requests = await mockCatalogApp(page);
  await page.goto("/search?q=neon&type=all");

  await page.getByRole("tab", { name: "Треки" }).click();
  await expect(page).toHaveURL(/type=tracks/);
  await expect(page.getByText("Archive Track 20", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Показать ещё" }).click();
  await expect(page.getByText("Archive Track 21", { exact: true })).toBeVisible();
  expect(requests.typedOffsets).toContain(20);

  await page.getByRole("tab", { name: "Авторы" }).click();
  await page.getByRole("link", { name: `Открыть автора ${primaryAuthor.name}` }).click();
  await page.waitForURL(`**/authors/${primaryAuthor.id}`);

  await page.goto("/search?q=neon&type=albums");
  await page.getByRole("link", { name: `Открыть альбом ${albums[0].name}` }).click();
  await page.waitForURL(`**/album/${albums[0].id}`);

  await page.goto("/search?q=neon&type=genres");
  await page.getByRole("link", { name: "Открыть жанр Synthwave" }).click();
  await page.waitForURL("**/category/30");

  await page.goto("/search?q=neon&type=playlists");
  await page.getByRole("link", { name: "Открыть плейлист Purple Night Drive" }).click();
  await page.waitForURL("**/playlist/40");
});

test("search playback queue and track menu expose all author and album credits", async ({
  page,
}) => {
  await mockCatalogApp(page);
  await page.goto("/search?q=neon&type=tracks");

  await page.getByRole("button", { name: `Воспроизвести ${track.name}` }).click();
  const player = page.getByRole("region", { name: "Audio player" });
  await expect(player).toContainText(track.name);
  await player.getByRole("button", { name: "Сведения о треке" }).click();

  await expect(
    page.getByRole("menuitem", { name: `Открыть автора ${primaryAuthor.name}` }),
  ).toHaveAttribute("href", `/authors/${primaryAuthor.id}`);
  await expect(
    page.getByRole("menuitem", { name: `Открыть автора ${featuredAuthor.name}` }),
  ).toHaveAttribute("href", `/authors/${featuredAuthor.id}`);
  await expect(
    page.getByRole("menuitem", { name: `Открыть альбом ${albums[0].name}` }),
  ).toHaveAttribute("href", `/album/${albums[0].id}`);
  await expect(
    page.getByRole("menuitem", { name: `Открыть альбом ${albums[1].name}` }),
  ).toHaveAttribute("href", `/album/${albums[1].id}`);

  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("menuitem", { name: `Открыть автора ${primaryAuthor.name}` }),
  ).toBeHidden();
  await expect(player.getByRole("button", { name: "Сведения о треке" })).toBeFocused();

  await player.getByRole("button", { name: "Next track" }).click();
  await expect(player).toContainText("Solo Signal");
  await player.getByRole("button", { name: "Сведения о треке" }).click();
  await expect(page.getByRole("menuitem", { name: "Сингл" })).toHaveAttribute(
    "data-disabled",
    "",
  );
  await page.keyboard.press("Escape");
  await player.getByRole("button", { name: "Previous track" }).click();
  await expect(player).toContainText(track.name);
  await player.getByRole("button", { name: "Сведения о треке" }).click();
  await page
    .getByRole("menuitem", { name: `Открыть автора ${featuredAuthor.name}` })
    .click();
  await page.waitForURL(`**/authors/${featuredAuthor.id}`);
  await expect(
    page.getByRole("menuitem", { name: `Открыть автора ${featuredAuthor.name}` }),
  ).toHaveCount(0);
});

test("albums catalog is linked from every responsive navigation and loads more", async ({
  page,
}) => {
  await mockCatalogApp(page);

  for (const viewport of [
    { width: 1280, height: 800 },
    { width: 900, height: 800 },
    { width: 375, height: 667 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    if (viewport.width < 768) {
      await page.getByRole("button", { name: "Открыть навигацию" }).click();
    }
    const albumLink = page.locator('a[href="/albums"]:visible').first();
    await expect(albumLink).toBeVisible();
    await albumLink.click();
    await page.waitForURL((url) => url.pathname === "/albums");
    await expect(page.getByText(albums[0].name, { exact: true })).toBeVisible();
    if (viewport.width === 1280) {
      await page.getByRole("button", { name: "Показать ещё" }).click();
      await expect(page.getByText("Archive Volume 19", { exact: true })).toBeVisible();
      await page.getByRole("searchbox", { name: "Поиск альбомов" }).fill("Neon");
      await expect(page).toHaveURL(/\/albums\?q=Neon/);
      await expect(page.getByText(albums[0].name, { exact: true })).toBeVisible();
      await expect(page.getByText("Archive Volume 19", { exact: true })).toHaveCount(0);
    }
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 1,
        ),
      )
      .toBe(true);
  }
});

test("bulk studio keeps successful drafts and retries only failed uploads", async ({
  page,
}) => {
  const api = await mockCatalogApp(page);
  await page.goto("/studio");
  await expect(page.getByRole("heading", { name: primaryAuthor.name })).toBeVisible();
  await page.getByRole("button", { name: "Загрузить треки" }).click();
  const dialog = page.getByRole("dialog", {
    name: "Массовая публикация треков",
  });

  await dialog.getByLabel("Общая обложка").setInputFiles({
    name: "shared-cover.webp",
    mimeType: "image/webp",
    buffer: Buffer.from("shared-cover"),
  });
  await dialog.getByRole("button", { name: "Не создавать" }).click();
  await dialog.getByLabel("Название альбома").fill("Bulk Album");
  await dialog.getByLabel("Обложка альбома").setInputFiles({
    name: "bulk-album.webp",
    mimeType: "image/webp",
    buffer: Buffer.from("bulk-album"),
  });

  const selectOption = async (
    draft: import("@playwright/test").Locator,
    triggerName: string,
    optionName: string,
  ) => {
    await draft.getByRole("button", { name: triggerName }).click();
    await page.getByRole("option", { name: optionName }).click();
    await page.keyboard.press("Escape");
  };

  const firstDraft = dialog.getByTestId("bulk-track-draft-1");
  await firstDraft.getByLabel("Название").fill("First Bulk Track");
  await firstDraft.getByLabel("Аудиофайл").setInputFiles({
    name: "first.mp3",
    mimeType: "audio/mpeg",
    buffer: Buffer.from("first-audio"),
  });
  await selectOption(firstDraft, "Жанры", "Synthwave");
  await selectOption(firstDraft, "Feat-авторы", featuredAuthor.name);
  await selectOption(firstDraft, "Альбомы", albums[0].name);

  await dialog.getByRole("button", { name: "Добавить трек (1/10)" }).click();
  const secondDraft = dialog.getByTestId("bulk-track-draft-2");
  await secondDraft.getByLabel("Название").fill("Broken Draft");
  await secondDraft.getByLabel("Аудиофайл").setInputFiles({
    name: "broken.mp3",
    mimeType: "audio/mpeg",
    buffer: Buffer.from("broken-audio"),
  });
  await selectOption(secondDraft, "Жанры", "Synthwave");

  await dialog.getByRole("button", { name: "Опубликовать очередь" }).click();
  await expect(firstDraft.getByText("Опубликован", { exact: true })).toBeVisible();
  await expect(secondDraft.getByText("Ошибка", { exact: true })).toBeVisible();
  expect(api.creatorTrackRequests).toHaveLength(2);
  expect(api.creatorTrackRequests.find(({ name }) => name === "First Bulk Track")).toEqual(
    expect.objectContaining({
      albumIds: [albums[0].id, 99],
      featuredAuthorIds: [featuredAuthor.id],
      genreIds: [30],
      idempotencyKey: expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      ),
    }),
  );
  expect(api.creatorAlbumKeys).toEqual([
    expect.stringMatching(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    ),
  ]);

  const brokenKey = api.creatorTrackRequests.find(
    ({ name }) => name === "Broken Draft",
  )?.idempotencyKey;
  await dialog.getByRole("button", { name: "Повторить ошибки (1)" }).click();
  await expect(secondDraft.getByText("Опубликован", { exact: true })).toBeVisible();
  expect(api.creatorTrackRequests).toHaveLength(3);
  expect(
    api.creatorTrackRequests.filter(({ name }) => name === "First Bulk Track"),
  ).toHaveLength(1);
  expect(
    api.creatorTrackRequests.filter(({ name }) => name === "Broken Draft"),
  ).toHaveLength(2);
  expect(api.creatorTrackRequests.at(-1)?.idempotencyKey).toBe(brokenKey);
  expect(api.assignments).toEqual(
    expect.arrayContaining([
      { albumId: albums[0].id, trackIds: [501] },
      { albumId: 99, trackIds: [501] },
      { albumId: 99, trackIds: [502] },
    ]),
  );
});

test("creator deletes one release and atomically bulk deletes selected releases", async ({
  page,
}) => {
  const api = await mockCatalogApp(page);
  await page.goto("/studio");

  const firstTrack = page.locator("article").filter({ hasText: track.name });
  await firstTrack.getByRole("button", { name: "Удалить", exact: true }).click();
  const singleDialog = page.getByRole("alertdialog");
  await expect(singleDialog).toContainText("аудиофайлы");
  await singleDialog.getByRole("button", { name: "Отмена" }).click();
  await expect(firstTrack.getByRole("button", { name: "Удалить", exact: true })).toBeFocused();

  await firstTrack.getByRole("button", { name: "Удалить", exact: true }).click();
  await singleDialog.getByRole("button", { name: "Удалить навсегда" }).click();
  await expect(page.getByText(track.name, { exact: true })).toHaveCount(0);
  expect(api.deletedTrackBatches).toEqual([[track.id]]);

  await page.getByRole("tab", { name: "Альбомы" }).click();
  await page.getByRole("button", { name: "Выбрать", exact: true }).click();
  await page.getByRole("checkbox", { name: `Выбрать альбом ${albums[0].name}` }).check();
  await page.getByRole("checkbox", { name: `Выбрать альбом ${albums[1].name}` }).check();
  await page.getByRole("button", { name: "Удалить (2)" }).click();
  const bulkDialog = page.getByRole("alertdialog");
  await expect(bulkDialog).toContainText("треки сохранятся");
  await bulkDialog.getByRole("button", { name: "Удалить навсегда" }).click();
  await expect(page.getByText(albums[0].name, { exact: true })).toHaveCount(0);
  await expect(page.getByText(albums[1].name, { exact: true })).toHaveCount(0);
  expect(api.deletedAlbumBatches).toEqual([[albums[0].id, albums[1].id]]);
});

test("creator edits and permanently removes the author profile without logging out", async ({
  page,
}) => {
  const api = await mockCatalogApp(page);
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/search?q=neon&type=tracks");
  await page.locator(`button[aria-label$="${track.name}"]`).first().click();
  await expect(page.getByRole("region", { name: "Audio player" })).toContainText(track.name);
  await page.goto("/studio");

  await page.getByRole("button", { name: "Редактировать профиль" }).click();
  const editDialog = page.getByRole("dialog", { name: "Редактировать профиль автора" });
  await editDialog.getByLabel("Псевдоним").fill("New Neon Saint");
  await editDialog.getByLabel("Bio").fill("A renewed public creator biography for the archive.");
  await editDialog.getByLabel("Новый аватар").setInputFiles({
    name: "new-author.webp",
    mimeType: "image/webp",
    buffer: Buffer.from("avatar"),
  });
  await expect(editDialog.getByAltText("Предпросмотр аватара автора")).toBeVisible();
  await editDialog.getByRole("button", { name: "Сохранить профиль" }).click();
  await expect(page.getByRole("heading", { name: "New Neon Saint" })).toBeVisible();

  const deleteTrigger = page.getByRole("button", { name: "Удалить авторский аккаунт" });
  await deleteTrigger.click();
  let deleteDialog = page.getByRole("alertdialog");
  await deleteDialog.getByRole("button", { name: "Отмена" }).click();
  await expect(deleteTrigger).toBeFocused();

  await deleteTrigger.click();
  deleteDialog = page.getByRole("alertdialog");
  await deleteDialog.getByLabel(/Введите псевдоним/).fill("New Neon Saint");
  await deleteDialog.getByLabel("Текущий пароль").fill("wrong-password");
  await deleteDialog.getByRole("button", { name: "Удалить безвозвратно" }).click();
  await expect(deleteDialog).toContainText("Текущий пароль указан неверно");
  await expect(deleteDialog).toBeVisible();

  await deleteDialog.getByLabel("Текущий пароль").fill("author-password");
  await deleteDialog.getByRole("button", { name: "Удалить безвозвратно" }).click();
  await expect(page.getByRole("heading", { name: "Стать автором" })).toBeVisible();
  await expect(page.getByLabel("Псевдоним")).toBeVisible();
  await expect(page.getByRole("region", { name: "Audio player" })).toHaveCount(0);
  expect(api.creatorProfileDeletes).toEqual([
    { currentPassword: "wrong-password", stageName: "New Neon Saint" },
    { currentPassword: "author-password", stageName: "New Neon Saint" },
  ]);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});
