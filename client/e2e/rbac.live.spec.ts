import { expect, test } from "@playwright/test";

test("live smoke: admin manages RBAC while ownership stays isolated", async ({
  page,
}) => {
  test.skip(
    !process.env.E2E_EMAIL || !process.env.E2E_PASSWORD,
    "E2E_EMAIL and E2E_PASSWORD are required",
  );
  test.skip(
    !process.env.E2E_POSTGRES_DB?.startsWith("bnr_music_e2e_"),
    "Live Playwright requires an isolated E2E_POSTGRES_DB",
  );

  const apiBase =
    process.env.PLAYWRIGHT_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://127.0.0.1:8340";

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/login");
  await page.getByLabel("Email").fill(process.env.E2E_EMAIL!);
  await page.locator('input[type="password"]').fill(process.env.E2E_PASSWORD!);
  await page.locator("button[type=submit]").click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("link", { name: "Модерация артистов" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Роли и доступ" })).toBeVisible();

  const adminToken = await page.evaluate(() => localStorage.getItem("token"));
  expect(adminToken).toBeTruthy();
  const adminHeaders = { Authorization: `Bearer ${adminToken}` };

  const permissionsResponse = await page.request.get(
    `${apiBase}/rbac/permissions`,
    { headers: adminHeaders },
  );
  expect(permissionsResponse.ok()).toBeTruthy();
  const permissions = (await permissionsResponse.json()) as Array<{
    id: number;
    code: string;
  }>;
  const usersRead = permissions.find(
    (permission) => permission.code === "users.read",
  );
  expect(usersRead).toBeTruthy();

  const rolesResponse = await page.request.get(`${apiBase}/rbac/roles`, {
    headers: adminHeaders,
  });
  expect(rolesResponse.ok()).toBeTruthy();
  const roles = (await rolesResponse.json()) as Array<{
    id: number;
    code: string;
  }>;
  const userRole = roles.find((role) => role.code === "user");
  expect(userRole).toBeTruthy();

  const suffix = Date.now();
  const memberEmail = `rbac-live-${suffix}@example.test`;
  const registrationResponse = await page.request.post(
    `${apiBase}/registration`,
    {
      data: { email: memberEmail, password: "strong-pass-123" },
    },
  );
  expect(registrationResponse.ok()).toBeTruthy();
  const registration = (await registrationResponse.json()) as {
    accessToken: string;
    user: { sub: number };
  };
  const memberHeaders = {
    Authorization: `Bearer ${registration.accessToken}`,
  };

  const createRoleResponse = await page.request.post(`${apiBase}/rbac/roles`, {
    headers: adminHeaders,
    data: {
      code: `live.reader.${suffix}`,
      name: `Live reader ${suffix}`,
      description: "Temporary role created by isolated live smoke",
      permissionIds: [usersRead!.id],
    },
  });
  expect(createRoleResponse.ok()).toBeTruthy();
  const customRole = (await createRoleResponse.json()) as { id: number };

  const assignmentResponse = await page.request.put(
    `${apiBase}/rbac/users/${registration.user.sub}/roles`,
    {
      headers: adminHeaders,
      data: { roleIds: [userRole!.id, customRole.id] },
    },
  );
  expect(assignmentResponse.ok()).toBeTruthy();

  const grantedResponse = await page.request.get(`${apiBase}/users`, {
    headers: memberHeaders,
  });
  expect(grantedResponse.ok()).toBeTruthy();

  const playlistResponse = await page.request.post(`${apiBase}/playlist`, {
    headers: memberHeaders,
    data: { name: `RBAC live private ${suffix}` },
  });
  expect(playlistResponse.ok()).toBeTruthy();
  const playlist = (await playlistResponse.json()) as { id: number };
  const forbiddenOwnership = await page.request.get(
    `${apiBase}/playlist/${playlist.id}`,
    { headers: adminHeaders },
  );
  expect(forbiddenOwnership.status()).toBe(403);

  const revokeResponse = await page.request.put(
    `${apiBase}/rbac/users/${registration.user.sub}/roles`,
    {
      headers: adminHeaders,
      data: { roleIds: [userRole!.id] },
    },
  );
  expect(revokeResponse.ok()).toBeTruthy();
  const revokedResponse = await page.request.get(`${apiBase}/users`, {
    headers: memberHeaders,
  });
  expect(revokedResponse.status()).toBe(403);
});
