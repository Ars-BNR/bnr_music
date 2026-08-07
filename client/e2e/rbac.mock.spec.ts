import { expect, test, type Page } from "@playwright/test";

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

type AccessFixture = {
  roles: string[];
  permissions: string[];
};

const mockProtectedApp = async (page: Page, access: AccessFixture) => {
  const principal = {
    sub: 1,
    email: "rbac-admin@example.test",
    ...access,
  };
  const profile = {
    id: 1,
    email: principal.email,
    displayName: "RBAC Administrator",
    bio: "",
    avatar: null,
    isActivated: true,
    ...access,
  };

  await page.route("**://localhost:8340/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (path === "/refresh") {
      return route.fulfill({
        json: { accessToken: "rbac-access-token", user: principal },
      });
    }
    if (path === "/users/me") return route.fulfill({ json: profile });
    if (path === "/playlist/mine") {
      return route.fulfill({ json: { items: [], total: 0 } });
    }
    if (path === "/tracks/popular" || path === "/albums/popular") {
      return route.fulfill({ json: [] });
    }
    if (path === "/genres" || path === "/authors") {
      return route.fulfill({ json: [] });
    }
    if (path === "/collection/me/summary") {
      return route.fulfill({
        json: {
          collectionId: 1,
          totalPlaylists: 0,
          totalAlbums: 0,
          totalTracks: 0,
        },
      });
    }
    if (path === "/creator/applications") {
      return route.fulfill({ json: { items: [], total: 0 } });
    }

    return route.fulfill({ json: [] });
  });
};

const mockRbacManagement = async (page: Page) => {
  const permissions = [
    {
      id: 101,
      code: "users.read",
      name: "Просмотр пользователей",
      description: "Разрешает читать каталог пользователей",
    },
    {
      id: 102,
      code: "catalog.manage",
      name: "Управление каталогом",
      description: "Разрешает менять музыкальный каталог",
    },
  ];
  let roles = [
    {
      id: 10,
      code: "user",
      name: "User",
      description: "Базовая системная роль",
      isSystem: true,
      permissions: [],
    },
    {
      id: 11,
      code: "admin",
      name: "Admin",
      description: "Системный администратор",
      isSystem: true,
      permissions,
    },
    {
      id: 12,
      code: "support.reader",
      name: "Support reader",
      description: "Пользовательская роль поддержки",
      isSystem: false,
      permissions: [permissions[0]],
    },
  ];
  const users = [
    {
      id: 1,
      email: "rbac-admin@example.test",
      displayName: "RBAC Administrator",
      roles: [roles[0], roles[1]],
    },
    {
      id: 2,
      email: "member@example.test",
      displayName: "Member Saint",
      roles: [roles[0]],
    },
  ];
  let lastAssignment: number[] = [];
  let nextAssignmentStatus: number | null = null;

  await page.route("**://localhost:8340/rbac/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (path === "/rbac/permissions") {
      return route.fulfill({ json: permissions });
    }
    if (path === "/rbac/roles" && request.method() === "GET") {
      return route.fulfill({ json: roles });
    }
    if (path === "/rbac/roles" && request.method() === "POST") {
      const body = request.postDataJSON() as {
        code: string;
        name: string;
        description: string;
        permissionIds: number[];
      };
      const created = {
        id: Math.max(...roles.map((role) => role.id)) + 1,
        ...body,
        isSystem: false,
        permissions: permissions.filter((permission) =>
          body.permissionIds.includes(permission.id),
        ),
      };
      roles = [...roles, created];
      return route.fulfill({ status: 201, json: created });
    }
    const roleMatch = path.match(/^\/rbac\/roles\/(\d+)$/);
    if (roleMatch && request.method() === "PATCH") {
      const id = Number(roleMatch[1]);
      const body = request.postDataJSON() as {
        name?: string;
        description?: string;
        permissionIds?: number[];
      };
      roles = roles.map((role) =>
        role.id === id
          ? {
              ...role,
              ...body,
              permissions:
                body.permissionIds === undefined
                  ? role.permissions
                  : permissions.filter((permission) =>
                      body.permissionIds?.includes(permission.id),
                    ),
            }
          : role,
      );
      return route.fulfill({
        json: roles.find((role) => role.id === id),
      });
    }
    if (path === "/rbac/users" && request.method() === "GET") {
      const query = (url.searchParams.get("query") ?? "").toLowerCase();
      const filtered = users.filter(
        (user) =>
          user.email.toLowerCase().includes(query) ||
          user.displayName.toLowerCase().includes(query),
      );
      return route.fulfill({ json: { items: filtered, total: filtered.length } });
    }
    if (/^\/rbac\/users\/\d+\/roles$/.test(path) && request.method() === "PUT") {
      if (nextAssignmentStatus) {
        const status = nextAssignmentStatus;
        nextAssignmentStatus = null;
        return route.fulfill({ status, json: { message: "Assignment rejected" } });
      }
      const body = request.postDataJSON() as { roleIds: number[] };
      lastAssignment = body.roleIds;
      const user = users.find((candidate) => candidate.id === Number(path.split("/")[3]));
      if (user) {
        user.roles = roles.filter((role) => body.roleIds.includes(role.id));
      }
      return route.fulfill({ json: user });
    }

    return route.fulfill({ status: 404, json: { message: "Not found" } });
  });

  return {
    getLastAssignment: () => lastAssignment,
    failNextAssignment: (status: number) => {
      nextAssignmentStatus = status;
    },
  };
};

test("regular users never see administrative navigation", async ({ page }) => {
  await mockProtectedApp(page, {
    roles: ["user"],
    permissions: userPermissions,
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");

  await expect(page.getByRole("link", { name: "Модерация артистов" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Роли и доступ" })).toHaveCount(0);
  await expect(page.getByLabel("Администрирование")).toHaveCount(0);
});

test("admin navigation is available on desktop, tablet and mobile", async ({
  page,
}) => {
  await mockProtectedApp(page, {
    roles: ["user", "admin"],
    permissions: adminPermissions,
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  const desktop = page.getByTestId("sidebar-desktop");
  await expect(desktop).toBeVisible();
  await expect(
    desktop.getByRole("link", { name: "Модерация артистов" }),
  ).toHaveAttribute("href", "/studio/moderation");
  await expect(
    desktop.getByRole("link", { name: "Роли и доступ" }),
  ).toHaveAttribute("href", "/admin/access");

  await page.setViewportSize({ width: 900, height: 900 });
  const rail = page.getByTestId("sidebar-rail");
  await expect(rail).toBeVisible();
  await expect(
    rail.getByRole("link", { name: "Модерация артистов" }),
  ).toBeVisible();
  await expect(rail.getByRole("link", { name: "Роли и доступ" })).toBeVisible();

  await page.setViewportSize({ width: 375, height: 900 });
  const menu = page.getByRole("button", { name: "Открыть навигацию" });
  await menu.click();
  const drawer = page.getByRole("dialog", { name: "Основная навигация" });
  await expect(
    drawer.getByRole("link", { name: "Модерация артистов" }),
  ).toBeVisible();
  await drawer.getByRole("link", { name: "Роли и доступ" }).click();
  await page.waitForURL("**/admin/access");
  await expect(drawer).toBeHidden();
});

test("admin sidebar stays scrollable without overlap on short viewports", async ({
  page,
}) => {
  await mockProtectedApp(page, {
    roles: ["user", "admin"],
    permissions: adminPermissions,
  });
  await page.route("**://localhost:8340/playlist/mine**", async (route) => {
    const items = Array.from({ length: 18 }, (_, index) => ({
      id: index + 1,
      name: `Archive playlist ${index + 1}`,
      userId: 1,
      trackCount: index,
    }));
    await route.fulfill({ json: { items, total: items.length } });
  });

  for (const viewport of [
    { width: 1280, height: 650, shell: "sidebar-desktop" },
    { width: 900, height: 600, shell: "sidebar-rail" },
  ] as const) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const shell = page.getByTestId(viewport.shell);
    const navigation = shell.getByRole("navigation", {
      name: "Основная навигация",
    });
    await expect(shell).toBeVisible();
    await expect(navigation).toBeVisible();
    let itemBeforeAdmin = navigation.getByRole("button", {
      name: "Плейлисты",
    });
    if (viewport.shell === "sidebar-desktop") {
      await navigation.getByRole("button", { name: "Плейлисты" }).click();
      itemBeforeAdmin = navigation.getByRole("link", {
        name: "Archive playlist 18",
      });
      await expect(itemBeforeAdmin).toBeAttached();
    }

    const firstAdminLink = navigation.getByRole("link", {
      name: "Модерация артистов",
    });
    await expect
      .poll(async () => {
        const [beforeAdminBounds, firstAdminBounds] = await Promise.all([
          itemBeforeAdmin.boundingBox(),
          firstAdminLink.boundingBox(),
        ]);
        if (!beforeAdminBounds || !firstAdminBounds) return false;
        return (
          beforeAdminBounds.y + beforeAdminBounds.height <=
          firstAdminBounds.y + 1
        );
      })
      .toBe(true);

    const scrollOwner = navigation.locator(".bnr-scrollbar").first();
    const scrollMetrics = await scrollOwner.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        clientHeight: element.clientHeight,
        scrollHeight: element.scrollHeight,
        scrollbarColor: style.scrollbarColor,
      };
    });
    expect(scrollMetrics.scrollHeight).toBeGreaterThan(scrollMetrics.clientHeight);
    expect(scrollMetrics.scrollbarColor).not.toBe("auto");
    await scrollOwner.evaluate((element) => {
      element.scrollTop = 0;
    });
    await scrollOwner.hover();
    await page.mouse.wheel(0, 420);
    await expect
      .poll(() => scrollOwner.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(0);

    const accessLink = navigation.getByRole("link", {
      name: "Роли и доступ",
    });
    await accessLink.scrollIntoViewIfNeeded();
    await expect(accessLink).toBeVisible();
    const logout = navigation.getByRole("button", { name: "Выход" });
    await expect(logout).toBeVisible();
    const [accessBounds, logoutBounds] = await Promise.all([
      accessLink.boundingBox(),
      logout.boundingBox(),
    ]);
    expect(accessBounds).not.toBeNull();
    expect(logoutBounds).not.toBeNull();
    expect((accessBounds?.y ?? 0) + (accessBounds?.height ?? 0)).toBeLessThanOrEqual(
      (logoutBounds?.y ?? 0) + 1,
    );

    const layout = await scrollOwner.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      return {
        top: bounds.top,
        bottom: bounds.bottom,
        clientHeight: element.clientHeight,
        scrollHeight: element.scrollHeight,
        scrollTop: element.scrollTop,
      };
    });
    expect(layout.top).toBeGreaterThanOrEqual(0);
    expect(layout.bottom).toBeLessThanOrEqual(viewport.height + 1);
    expect(layout.scrollTop).toBeGreaterThan(0);
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 1,
        ),
      )
      .toBe(true);
  }

  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/");
  await page.getByRole("button", { name: "Открыть навигацию" }).click();
  const drawer = page.getByRole("dialog", { name: "Основная навигация" });
  const drawerNavigation = drawer.getByRole("navigation", {
    name: "Основная навигация",
  });
  await drawerNavigation.getByRole("button", { name: "Плейлисты" }).click();
  await expect(
    drawerNavigation.getByRole("link", { name: "Archive playlist 18" }),
  ).toBeAttached();
  const drawerScrollOwner = drawerNavigation.locator(".bnr-scrollbar").first();
  const drawerScrollMetrics = await drawerScrollOwner.evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
  }));
  expect(drawerScrollMetrics.scrollHeight).toBeGreaterThan(
    drawerScrollMetrics.clientHeight,
  );
  await drawerScrollOwner.evaluate((element) => {
    element.scrollTop = 0;
  });
  await drawerScrollOwner.hover();
  await page.mouse.wheel(0, 420);
  await expect
    .poll(() => drawerScrollOwner.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0);

  const lastDrawerPlaylist = drawerNavigation.getByRole("link", {
    name: "Archive playlist 18",
  });
  const firstDrawerAdmin = drawerNavigation.getByRole("link", {
    name: "Модерация артистов",
  });
  const drawerAccess = drawerNavigation.getByRole("link", {
    name: "Роли и доступ",
  });
  const drawerLogout = drawerNavigation.getByRole("button", { name: "Выход" });
  await drawerAccess.scrollIntoViewIfNeeded();
  await expect(drawerAccess).toBeVisible();
  await expect(drawerLogout).toBeVisible();
  await expect
    .poll(async () => {
      const [lastPlaylistBounds, firstDrawerAdminBounds] = await Promise.all([
        lastDrawerPlaylist.boundingBox(),
        firstDrawerAdmin.boundingBox(),
      ]);
      if (!lastPlaylistBounds || !firstDrawerAdminBounds) return false;
      return (
        lastPlaylistBounds.y + lastPlaylistBounds.height <=
        firstDrawerAdminBounds.y + 1
      );
    })
    .toBe(true);
  const [drawerAccessBounds, drawerLogoutBounds] = await Promise.all([
    drawerAccess.boundingBox(),
    drawerLogout.boundingBox(),
  ]);
  expect(drawerAccessBounds).not.toBeNull();
  expect(drawerLogoutBounds).not.toBeNull();
  expect(
    (drawerAccessBounds?.y ?? 0) + (drawerAccessBounds?.height ?? 0),
  ).toBeLessThanOrEqual((drawerLogoutBounds?.y ?? 0) + 1);
  const drawerBounds = await drawer.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
    top: element.getBoundingClientRect().top,
    bottom: element.getBoundingClientRect().bottom,
  }));
  expect(drawerBounds.top).toBeGreaterThanOrEqual(0);
  expect(drawerBounds.bottom).toBeLessThanOrEqual(668);
  expect(drawerBounds.scrollWidth).toBeLessThanOrEqual(
    drawerBounds.clientWidth + 1,
  );
});

test("admin access searches users and assigns multiple roles", async ({
  page,
}) => {
  await mockProtectedApp(page, {
    roles: ["user", "admin"],
    permissions: adminPermissions,
  });
  const rbac = await mockRbacManagement(page);
  await page.goto("/admin/access");

  await expect(page.getByRole("tab", { name: "Пользователи" })).toBeVisible();
  const filteredUsersRequest = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return url.pathname === "/rbac/users" && url.searchParams.get("query") === "member";
  });
  await page.getByLabel("Поиск пользователей").fill("member");
  await filteredUsersRequest;
  await expect(page.getByText("Member Saint", { exact: true })).toBeVisible();

  await page
    .getByRole("button", {
      name: "Назначить роли пользователю Member Saint",
    })
    .click();
  const dialog = page.getByRole("dialog", { name: "Назначить роли" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("option", { name: "User" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await expect(dialog.getByRole("option", { name: "User" })).toBeDisabled();
  const roleSearch = dialog.getByRole("combobox", { name: "Поиск ролей" });
  await roleSearch.fill("Support reader");
  const supportRole = dialog.getByRole("option", { name: "Support reader" });
  await expect(supportRole).toBeVisible();
  await supportRole.click({ force: true });
  await expect(supportRole).toHaveAttribute("aria-checked", "true");
  await dialog.getByRole("button", { name: "Сохранить роли" }).click();
  await expect(dialog).toBeHidden();
  expect(rbac.getLastAssignment().sort((left, right) => left - right)).toEqual([
    10, 12,
  ]);

  rbac.failNextAssignment(409);
  await page
    .getByRole("button", {
      name: "Назначить роли пользователю Member Saint",
    })
    .click();
  await expect(dialog).toBeVisible();
  await roleSearch.fill("Support reader");
  await expect(supportRole).toBeVisible();
  await supportRole.click({ force: true });
  await dialog.getByRole("button", { name: "Сохранить роли" }).click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("alert")).toBeVisible();
});

test("admin access creates a role with selected permissions", async ({
  page,
}) => {
  await mockProtectedApp(page, {
    roles: ["user", "admin"],
    permissions: adminPermissions,
  });
  await mockRbacManagement(page);
  await page.goto("/admin/access");

  await page.getByRole("tab", { name: "Роли" }).click();
  await page.getByRole("button", { name: "Создать роль" }).click();
  const dialog = page.getByRole("dialog", { name: "Создать роль" });
  await dialog.getByLabel("Код роли").fill("catalog.curator");
  await dialog.getByLabel("Название роли").fill("Catalog curator");
  await dialog
    .getByLabel("Описание роли")
    .fill("Управляет выпусками музыкального архива");
  await page
    .getByRole("combobox", { name: "Поиск разрешений" })
    .fill("catalog.manage");
  const permission = dialog.getByRole("option", {
    name: "catalog.manage: Управление каталогом",
  });
  await permission.click();
  await expect(permission).toHaveAttribute("aria-checked", "true");
  await dialog.getByRole("button", { name: "Создать роль" }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByText("Catalog curator", { exact: true })).toBeVisible();
  await expect(page.getByText("catalog.manage", { exact: true }).last()).toBeVisible();
});
