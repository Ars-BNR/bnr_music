const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const routes = {
    user: {
      sub: 1,
      email: 'playwright@example.com',
      roles: ['user'],
      permissions: ['profile.manage-own','library.manage-own','creator.apply'],
      isActivated: true
    },
    profile: {
      id: 1,
      email: 'playwright@example.com',
      displayName: 'Playwright Saint',
      bio: 'bio',
      avatar: null,
      roles: ['user'],
      permissions: ['profile.manage-own','library.manage-own','creator.apply'],
      isActivated: true,
    }
  };
  await page.route('**://localhost:8340/refresh', (route) => route.fulfill({ json: { accessToken: 'test-access-token', user: routes.user } }));
  await page.route('**://localhost:8340/users/me', (route) => {
    if (route.request().method() === 'PATCH') return route.fulfill({ json: routes.profile });
    if (route.request().method() === 'POST') return route.fulfill({ json: routes.profile });
    if (route.request().method() === 'DELETE') return route.fulfill({ json: routes.profile });
    return route.fulfill({ json: routes.profile });
  });
  await page.route('**://localhost:8340/creator/me', (route) => route.fulfill({
    json: {
      state: 'approved',
      author: { id: 1, name: 'Genre Author', bio: 'Approved', avatar: null },
      counts: { tracks: 0, albums: 1 },
    },
  }));
  await page.route('**://localhost:8340/creator/tracks', (route) => {
    if (route.request().method() === 'POST') return route.fulfill({ status: 201, json: { id: 901, name: 'Feat Track' } });
    return route.fulfill({ json: { items: [], total: 0 } });
  });
  await page.route('**://localhost:8340/creator/albums', (route) => {
    if (route.request().method() === 'POST') return route.fulfill({ status: 201, json: { id: 902, name: 'Album' } });
    return route.fulfill({ json: { items: [{ id: 1, name: 'Album One', listens: 1, authorId: 1, authorName: 'Author One', picture: 'image' }], total: 1 } });
  });
  await page.route('**://localhost:8340/genres*', (route) => {
    route.fulfill({ json: [{ id: 1, name: 'Game music' }, { id: 2, name: 'Hip hop' }] });
  });
  await page.route('**://localhost:8340/authors*', (route) => {
    const url = new URL(route.request().url());
    const q = url.searchParams.get('query') || '';
    const all = [{ id: 2, name: 'Purple Composer' }, { id: 3, name: 'Shaundi' }, { id: 1, name: 'Genre Author' }];
    const items = q ? all.filter((a) => a.name.toLowerCase().includes(q.toLowerCase()) && a.id !== 1) : all.filter((a) => a.id !== 1);
    route.fulfill({ json: items });
  });
  await page.route('**://localhost:8340/playlist/mine', (route) => route.fulfill({ json: { items: [], total: 0 } }));

  // minimal for global app fetches
  await page.route('**://localhost:8340/tracks/search**', (route) => route.fulfill({ json: [] }));
  await page.route('**://localhost:8340/tracks', (route) => route.fulfill({ json: [] }));
  await page.route('**://localhost:8340/albums', (route) => route.fulfill({ json: [] }));
  await page.route('**://localhost:8340/albums/*/tracks', (route) => route.fulfill({ json: [] }));
  await page.route('**://localhost:8340/genres', (route) => {
    if (route.request().url().includes('/genres')) route.fulfill({ json: [{ id: 1, name: 'Game music' }] });
  });
  await page.route('**://localhost:8340/collection/**', (route) => route.fulfill({ json: { id: 1 } }));
  await page.route('**://localhost:8340/collection/me/summary', (route) => route.fulfill({ json: { collectionId: 1, totalPlaylists: 0, totalAlbums: 0, totalTracks: 0 } }));
  await page.route('**://localhost:8340/collection/me/tracks', (route) => route.fulfill({ json: { items: [], total: 0 } }));
  await page.route('**://localhost:8340/collection_playlist/**', (route) => route.fulfill({ json: [] }));
  await page.route('**://localhost:8340/collection_track**', (route) => route.fulfill({ json: [] }));
  await page.route('**://localhost:8340/logout', (route) => route.fulfill({ json: {} }));

  await page.goto('http://127.0.0.1:3100/studio', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  const html = await page.content();
  const hasHeading = await page.getByRole('heading', { name: 'Genre Author' }).count();
  const buttons = await page.getByRole('button', { name: 'Загрузить треки' }).count();
  const allButtons = await page.locator('button').allInnerTexts();
  console.log('heading count', hasHeading);
  console.log('upload buttons', buttons);
  console.log('buttons with tr: ', allButtons.filter(t => t.includes('Загрузить')).slice(0,20));
  await page.screenshot({ path: 'D:/projecting_scelping/bnr_music/client/test-results/studio-debug.png' });

  await browser.close();
})();
