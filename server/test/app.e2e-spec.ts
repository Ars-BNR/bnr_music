import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Sequelize } from 'sequelize-typescript';
import cookieParser from 'cookie-parser';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { AlbumModel } from '../src/album/model/album.model';
import { AlbumFeaturedAuthorModel } from '../src/album-featured-author/model/album-featured-author.model';
import { AuthorModel } from '../src/author/model/author.model';
import { CollectionAlbumModel } from '../src/collection-album/model/collection-album.model';
import { GenreModel } from '../src/genre/model/genre.model';
import { FileService } from '../src/file/file.service';
import { PlaylistTrackModel } from '../src/playlist-track/model/playlist-track.model';
import { RbacService } from '../src/rbac/rbac.service';
import { TrackModel } from '../src/track/model/track.model';
import { TrackFeaturedAuthorModel } from '../src/track-featured-author/model/track-featured-author.model';
import { TrackGenreModel } from '../src/track-genre/model/track-genre.model';
import { TokenModel } from '../src/token/model/token.model';
import { UserModel } from '../src/user/model/user.model';

const requiredDatabaseVariables = [
  'E2E_POSTGRES_HOST',
  'E2E_POSTGRES_PORT',
  'E2E_POSTGRES_USER',
  'E2E_POSTGRES_PASSWORD',
  'E2E_POSTGRES_DB',
] as const;

const hasE2eDatabase = requiredDatabaseVariables.every((key) =>
  Boolean(process.env[key]),
);
const e2eDatabaseName = process.env.E2E_POSTGRES_DB ?? '';

if (hasE2eDatabase && !e2eDatabaseName.startsWith('bnr_music_e2e_')) {
  throw new Error('E2E_POSTGRES_DB must start with "bnr_music_e2e_"');
}

if (hasE2eDatabase) {
  Object.assign(process.env, {
    NODE_ENV: 'test',
    POSTGRES_HOST: process.env.E2E_POSTGRES_HOST,
    POSTGRES_PORT: process.env.E2E_POSTGRES_PORT,
    POSTGRES_USER: process.env.E2E_POSTGRES_USER,
    POSTGRES_PASSWORD: process.env.E2E_POSTGRES_PASSWORD,
    POSTGRES_DB: process.env.E2E_POSTGRES_DB,
    JWT_ACCESS_SECRET: 'e2e-access-secret-at-least-32-characters',
    JWT_REFRESH_SECRET: 'e2e-refresh-secret-at-least-32-characters',
    EXPIRES_ACCESS_JWT: '15m',
    EXPIRES_REFRESH_JWT: '30d',
    CLIENT_URL: 'http://127.0.0.1:13000',
    API_URL: 'http://127.0.0.1:18341',
    MAIL_DISABLED: 'true',
  });
}

const describeE2e = hasE2eDatabase ? describe : describe.skip;

const asCookieHeader = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value.join(';') : (value ?? '');

const refreshCookieFrom = (value: string | string[] | undefined): string => {
  const firstCookie = Array.isArray(value) ? value[0] : value;
  if (!firstCookie) throw new Error('Response did not return a refresh cookie');
  return firstCookie.split(';')[0];
};

describeE2e('BNR Music API (e2e)', () => {
  let app: INestApplication;
  let sequelize: Sequelize;
  let rbacService: RbacService;
  const createdFixtureFiles = new Set<string>();

  beforeAll(async () => {
    const { AppModule } = await import('../src/app.module');
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
    sequelize = app.get(Sequelize);
    rbacService = app.get(RbacService);
  }, 30_000);

  beforeEach(async () => {
    await sequelize.sync({ force: true });
    await rbacService.ensureSystemDefinitions();
  }, 30_000);

  afterEach(() => {
    const files = app.get(FileService);
    createdFixtureFiles.forEach((file) => files.deleteFile(file));
    createdFixtureFiles.clear();
  });

  afterAll(async () => {
    await app?.close();
  }, 30_000);

  const register = async (suffix: string) => {
    const agent = request.agent(app.getHttpServer());
    const response = await agent
      .post('/registration')
      .send({
        email: `e2e-${suffix}@example.test`,
        password: 'strong-password',
      })
      .expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        accessToken: expect.any(String),
        user: expect.objectContaining({
          roles: expect.arrayContaining(['user']),
          permissions: expect.arrayContaining([
            'profile.manage-own',
            'library.manage-own',
            'creator.apply',
          ]),
        }),
      }),
    );
    expect(response.body.refreshToken).toBeUndefined();
    expect(asCookieHeader(response.headers['set-cookie'])).toContain(
      'HttpOnly',
    );
    return { agent, response };
  };

  it('validates offset=0 and preserves 400/404 responses', async () => {
    await request(app.getHttpServer())
      .get('/tracks?offset=0&count=10')
      .expect(200);
    await request(app.getHttpServer()).get('/tracks?offset=-1').expect(400);
    await request(app.getHttpServer()).get('/tracks/not-a-number').expect(400);
    await request(app.getHttpServer()).get('/tracks/999999').expect(404);
  });

  it('allows an activated admin to log in with a 20-character seed password', async () => {
    const password = '12345678901234567890';
    await UserModel.create({
      email: 'seed-admin@example.test',
      password: await bcrypt.hash(password, 10),
      isActivated: true,
      activationLink: 'seed-admin-activation',
      displayName: 'Seed Admin',
      bio: '',
      avatar: null,
    });
    const seedAdmin = await UserModel.findOne({
      where: { email: 'seed-admin@example.test' },
    });
    if (!seedAdmin) throw new Error('Seed admin fixture was not created');
    await rbacService.assignSystemRole(seedAdmin.id, 'user');
    await rbacService.assignSystemRole(seedAdmin.id, 'admin');

    const response = await request(app.getHttpServer())
      .post('/login')
      .send({ email: 'seed-admin@example.test', password })
      .expect(201);
    expect(response.body.accessToken).toEqual(expect.any(String));

    await request(app.getHttpServer())
      .post('/login')
      .send({ email: 'seed-admin@example.test', password: 'wrong-password' })
      .expect(401);
  });

  it('creates creator albums and tracks with ordered featured authors', async () => {
    const owner = await register('creator-feat');
    const ownerId = owner.response.body.user.sub as number;
    const ownerToken = owner.response.body.accessToken as string;
    const primary = await AuthorModel.create({
      userId: ownerId,
      name: 'Primary creator',
      bio: '',
      avatar: null,
    });
    const [firstFeatured, secondFeatured, genre] = await Promise.all([
      AuthorModel.create({ name: 'Featured One' }),
      AuthorModel.create({ name: 'Featured Two' }),
      GenreModel.create({ name: 'Creator genre' }),
    ]);
    await rbacService.assignSystemRole(ownerId, 'author');

    const albumResponse = await owner.agent
      .post('/creator/albums')
      .set('Authorization', `Bearer ${ownerToken}`)
      .field('name', 'Featured album')
      .field(
        'featuredAuthorIds',
        JSON.stringify([secondFeatured.id, firstFeatured.id]),
      )
      .attach('picture', Buffer.from('album-picture'), 'album.webp')
      .expect(201);
    createdFixtureFiles.add(albumResponse.body.picture);

    await expect(
      AlbumFeaturedAuthorModel.findAll({
        where: { albumId: albumResponse.body.id },
        order: [['position', 'ASC']],
      }),
    ).resolves.toEqual([
      expect.objectContaining({ authorId: secondFeatured.id, position: 0 }),
      expect.objectContaining({ authorId: firstFeatured.id, position: 1 }),
    ]);

    const trackResponse = await owner.agent
      .post('/creator/tracks')
      .set('Authorization', `Bearer ${ownerToken}`)
      .field('name', 'Featured track')
      .field('text', '')
      .field('genreIds', JSON.stringify([genre.id]))
      .field(
        'featuredAuthorIds',
        JSON.stringify([firstFeatured.id, secondFeatured.id]),
      )
      .attach('picture', Buffer.from('track-picture'), 'track.webp')
      .attach('audio', Buffer.from('track-audio'), 'track.mp3')
      .expect(201);
    createdFixtureFiles.add(trackResponse.body.picture);
    createdFixtureFiles.add(trackResponse.body.audio);

    await expect(
      TrackFeaturedAuthorModel.findAll({
        where: { trackId: trackResponse.body.id },
        order: [['position', 'ASC']],
      }),
    ).resolves.toEqual([
      expect.objectContaining({ authorId: firstFeatured.id, position: 0 }),
      expect.objectContaining({ authorId: secondFeatured.id, position: 1 }),
    ]);

    const publicAlbum = await request(app.getHttpServer())
      .get(`/albums/${albumResponse.body.id}`)
      .expect(200);
    expect(publicAlbum.body).toEqual(
      expect.objectContaining({
        authorId: primary.id,
        featuredAuthors: [
          expect.objectContaining({ id: secondFeatured.id }),
          expect.objectContaining({ id: firstFeatured.id }),
        ],
      }),
    );

    const publicTrack = await request(app.getHttpServer())
      .get(`/tracks/${trackResponse.body.id}`)
      .expect(200);
    expect(publicTrack.body).toEqual(
      expect.objectContaining({
        authorId: primary.id,
        featuredAuthors: [
          expect.objectContaining({ id: firstFeatured.id }),
          expect.objectContaining({ id: secondFeatured.id }),
        ],
      }),
    );
  });

  it('serves a public, paginated genre queue and validates its pagination', async () => {
    const genre = await GenreModel.create({ name: 'E2E genre' });
    const author = await AuthorModel.create({ name: 'Genre composer' });
    const [first, second] = await Promise.all([
      TrackModel.create({
        name: 'Genre track one',
        picture: 'image/one.jpg',
        text: '',
        audio: 'audio/one.mp3',
        authorId: author.id,
        listens: 0,
      }),
      TrackModel.create({
        name: 'Genre track two',
        picture: 'image/two.jpg',
        text: '',
        audio: 'audio/two.mp3',
        authorId: author.id,
        listens: 0,
      }),
    ]);
    await TrackGenreModel.bulkCreate([
      { trackId: first.id, genreId: genre.id },
      { trackId: second.id, genreId: genre.id },
    ]);

    const response = await request(app.getHttpServer())
      .get(`/genres/${genre.id}/tracks?count=1&offset=0`)
      .expect(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        genre: { id: genre.id, name: 'E2E genre' },
        total: 2,
        tracks: [expect.objectContaining({ authorName: 'Genre composer' })],
      }),
    );
    await request(app.getHttpServer())
      .get(`/genres/${genre.id}/tracks?offset=-1`)
      .expect(400);
    await request(app.getHttpServer()).get('/genres/999999/tracks').expect(404);
  });

  it('rotates refresh sessions, never serializes the token, and invalidates logout', async () => {
    const { agent, response } = await register('rotation');
    const oldCookie = refreshCookieFrom(response.headers['set-cookie']);
    const refresh = await agent.post('/refresh').expect(201);
    expect(refresh.body.refreshToken).toBeUndefined();
    const nextCookie = refreshCookieFrom(refresh.headers['set-cookie']);
    expect(nextCookie).not.toBe(oldCookie);
    const sessions = await TokenModel.findAll();
    expect(sessions).toHaveLength(1);
    const oldToken = decodeURIComponent(
      oldCookie.slice(oldCookie.indexOf('=') + 1),
    );
    await expect(
      bcrypt.compare(oldToken, sessions[0].refreshToken),
    ).resolves.toBe(false);

    await request(app.getHttpServer())
      .post('/refresh')
      .set('Cookie', oldCookie)
      .expect(401);
    await agent.post('/logout').expect(201);
    await agent.post('/refresh').expect(401);
  });

  it('manages RBAC roles, applies grants immediately and preserves ownership', async () => {
    const manager = await register('rbac-manager');
    const member = await register('rbac-member');
    const managerId = manager.response.body.user.sub as number;
    const memberId = member.response.body.user.sub as number;
    const managerToken = manager.response.body.accessToken as string;
    const memberToken = member.response.body.accessToken as string;

    await request(app.getHttpServer()).get('/rbac/roles').expect(401);
    await member.agent
      .get('/rbac/roles')
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(403);

    await rbacService.assignSystemRole(managerId, 'admin');

    const rolesResponse = await manager.agent
      .get('/rbac/roles')
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(200);
    const permissionsResponse = await manager.agent
      .get('/rbac/permissions')
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(200);
    const userRole = rolesResponse.body.find(
      (role: { code: string }) => role.code === 'user',
    );
    const adminRole = rolesResponse.body.find(
      (role: { code: string }) => role.code === 'admin',
    );
    const usersRead = permissionsResponse.body.find(
      (permission: { code: string }) => permission.code === 'users.read',
    );
    expect(userRole).toEqual(expect.objectContaining({ isSystem: true }));
    expect(adminRole).toEqual(expect.objectContaining({ isSystem: true }));
    expect(usersRead).toEqual(
      expect.objectContaining({ id: expect.any(Number) }),
    );

    const customRoleResponse = await manager.agent
      .post('/rbac/roles')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        code: 'support.reader',
        name: 'Support reader',
        description: 'Can review user directory',
        permissionIds: [usersRead.id],
      })
      .expect(201);
    expect(customRoleResponse.body).toEqual(
      expect.objectContaining({
        code: 'support.reader',
        isSystem: false,
        permissions: [expect.objectContaining({ code: 'users.read' })],
      }),
    );

    const usersPage = await manager.agent
      .get('/rbac/users?query=rbac-member&count=1&offset=0')
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(200);
    expect(usersPage.body).toEqual({
      items: [
        expect.objectContaining({
          id: memberId,
          email: 'e2e-rbac-member@example.test',
          roles: [expect.objectContaining({ code: 'user' })],
        }),
      ],
      total: 1,
    });
    await manager.agent
      .get('/rbac/users?count=1&offset=-1')
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(400);

    await member.agent
      .get('/users')
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(403);
    await manager.agent
      .put(`/rbac/users/${memberId}/roles`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ roleIds: [userRole.id, customRoleResponse.body.id] })
      .expect(200)
      .expect((response) => {
        expect(response.body.roles).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ code: 'user' }),
            expect.objectContaining({ code: 'support.reader' }),
          ]),
        );
      });

    await member.agent
      .get('/users')
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);

    await manager.agent
      .put(`/rbac/users/${memberId}/roles`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ roleIds: [userRole.id] })
      .expect(200);
    await member.agent
      .get('/users')
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(403);

    await manager.agent
      .patch(`/rbac/roles/${adminRole.id}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ name: 'Mutable admin' })
      .expect(403);
    await manager.agent
      .put(`/rbac/users/${memberId}/roles`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ roleIds: [customRoleResponse.body.id] })
      .expect(400);
    await manager.agent
      .put(`/rbac/users/${managerId}/roles`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ roleIds: [userRole.id] })
      .expect(403);

    const memberCollection = await member.agent
      .get(`/collection/user/${memberId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);
    await manager.agent
      .get(`/collection/${memberCollection.body.id}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(403);
    const memberPlaylist = await member.agent
      .post('/playlist')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Member private playlist' })
      .expect(201);
    await manager.agent
      .get(`/playlist/${memberPlaylist.body.id}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(403);
  });

  it('returns favorite albums and only the authenticated user playlists', async () => {
    const first = await register('library-first');
    const second = await register('library-second');
    const firstToken = first.response.body.accessToken as string;
    const firstUserId = first.response.body.user.sub as number;
    const secondToken = second.response.body.accessToken as string;
    const firstCollection = await first.agent
      .get(`/collection/user/${firstUserId}`)
      .set('Authorization', `Bearer ${firstToken}`)
      .expect(200);
    const author = await AuthorModel.create({ name: 'Library author' });
    const album = await AlbumModel.create({
      name: 'Library album',
      picture: 'image/library.jpg',
      listens: 5,
      authorId: author.id,
    });
    await CollectionAlbumModel.create({
      collectionId: firstCollection.body.id,
      albumId: album.id,
    });
    const track = await TrackModel.create({
      name: 'Library track',
      picture: 'image/library-track.jpg',
      text: '',
      audio: 'audio/library-track.mp3',
      authorId: author.id,
      listens: 0,
    });
    const firstPlaylist = await first.agent
      .post('/playlist')
      .set('Authorization', `Bearer ${firstToken}`)
      .send({ name: 'First personal playlist' })
      .expect(201);
    await PlaylistTrackModel.create({
      playlistId: firstPlaylist.body.id,
      trackId: track.id,
    });
    await second.agent
      .post('/playlist')
      .set('Authorization', `Bearer ${secondToken}`)
      .send({ name: 'Second personal playlist' })
      .expect(201);

    const albums = await first.agent
      .get('/collection/me/albums?count=20&offset=0')
      .set('Authorization', `Bearer ${firstToken}`)
      .expect(200);
    expect(albums.body).toEqual({
      items: [
        expect.objectContaining({
          id: album.id,
          authorId: author.id,
          authorName: 'Library author',
        }),
      ],
      total: 1,
    });

    const playlists = await first.agent
      .get('/playlist/mine?count=20&offset=0')
      .set('Authorization', `Bearer ${firstToken}`)
      .expect(200);
    expect(playlists.body).toEqual({
      items: [
        expect.objectContaining({
          id: firstPlaylist.body.id,
          trackCount: 1,
        }),
      ],
      total: 1,
    });

    const playlistDetail = await first.agent
      .get(`/playlist/${firstPlaylist.body.id}?count=20&offset=0`)
      .set('Authorization', `Bearer ${firstToken}`)
      .expect(200);
    expect(playlistDetail.body).toEqual(
      expect.objectContaining({
        id: firstPlaylist.body.id,
        total: 1,
        tracks: [
          expect.objectContaining({
            id: track.id,
            authorName: 'Library author',
            featuredAuthors: [],
          }),
        ],
      }),
    );
    await second.agent
      .get(`/playlist/${firstPlaylist.body.id}?count=20&offset=0`)
      .set('Authorization', `Bearer ${secondToken}`)
      .expect(403);
    await first.agent
      .get('/playlist/999999?count=20&offset=0')
      .set('Authorization', `Bearer ${firstToken}`)
      .expect(404);
  });

  it('enforces roles, collection ownership, relation conflicts and atomic listens', async () => {
    const first = await register('first');
    const second = await register('second');
    const firstToken = first.response.body.accessToken as string;
    const secondToken = second.response.body.accessToken as string;
    const firstUserId = first.response.body.user.sub as number;

    const firstCollection = await first.agent
      .get(`/collection/user/${firstUserId}`)
      .set('Authorization', `Bearer ${firstToken}`)
      .expect(200);
    await second.agent
      .get(`/collection/${firstCollection.body.id}`)
      .set('Authorization', `Bearer ${secondToken}`)
      .expect(403);
    await request(app.getHttpServer()).delete('/tracks/1').expect(401);
    await request(app.getHttpServer())
      .get('/collection/me/tracks?count=20&offset=0')
      .expect(401);
    await first.agent
      .delete('/tracks/1')
      .set('Authorization', `Bearer ${firstToken}`)
      .expect(403);

    const author = await AuthorModel.create({ name: 'E2E author' });
    const track = await TrackModel.create({
      name: 'E2E track',
      picture: 'image/e2e.jpg',
      text: 'E2E',
      audio: 'audio/e2e.mp3',
      authorId: author.id,
      listens: 0,
    });
    const relation = {
      collectionId: firstCollection.body.id,
      trackId: track.id,
    };
    await first.agent
      .get(`/collection/me/tracks/${track.id}/status`)
      .set('Authorization', `Bearer ${firstToken}`)
      .expect(200)
      .expect({ isFavorite: false });
    await first.agent
      .put(`/collection/me/tracks/${track.id}`)
      .set('Authorization', `Bearer ${firstToken}`)
      .expect(200)
      .expect({ isFavorite: true });
    await first.agent
      .put(`/collection/me/tracks/${track.id}`)
      .set('Authorization', `Bearer ${firstToken}`)
      .expect(200)
      .expect({ isFavorite: true });
    await first.agent
      .get(`/collection/me/tracks/${track.id}/status`)
      .set('Authorization', `Bearer ${firstToken}`)
      .expect(200)
      .expect({ isFavorite: true });
    await second.agent
      .get(`/collection/me/tracks/${track.id}/status`)
      .set('Authorization', `Bearer ${secondToken}`)
      .expect(200)
      .expect({ isFavorite: false });
    await first.agent
      .get('/collection/me/tracks?count=20&offset=0')
      .set('Authorization', `Bearer ${firstToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.total).toBe(1);
        expect(response.body.items).toHaveLength(1);
        expect(response.body.items[0]).toEqual(
          expect.objectContaining({
            id: track.id,
            name: 'E2E track',
            authorName: 'E2E author',
            featuredAuthors: [],
          }),
        );
      });
    await first.agent
      .delete(`/collection/me/tracks/${track.id}`)
      .set('Authorization', `Bearer ${firstToken}`)
      .expect(200)
      .expect({ isFavorite: false });
    await first.agent
      .delete(`/collection/me/tracks/${track.id}`)
      .set('Authorization', `Bearer ${firstToken}`)
      .expect(200)
      .expect({ isFavorite: false });
    await first.agent
      .post('/collection_track')
      .set('Authorization', `Bearer ${firstToken}`)
      .send(relation)
      .expect(201);
    await first.agent
      .post('/collection_track')
      .set('Authorization', `Bearer ${firstToken}`)
      .send(relation)
      .expect(409);

    await Promise.all([
      request(app.getHttpServer())
        .post(`/tracks/listen/${track.id}`)
        .expect(201),
      request(app.getHttpServer())
        .post(`/tracks/listen/${track.id}`)
        .expect(201),
    ]);
    await expect(track.reload()).resolves.toMatchObject({ listens: 2 });

    await rbacService.assignSystemRole(firstUserId, 'admin');
    const adminLogin = await request(app.getHttpServer())
      .post('/login')
      .send({ email: 'e2e-first@example.test', password: 'strong-password' })
      .expect(201);
    await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${adminLogin.body.accessToken}`)
      .expect(200);

    const genre = await GenreModel.create({ name: 'Admin created genre' });
    const createdTrack = await request(app.getHttpServer())
      .post('/tracks')
      .set('Authorization', `Bearer ${adminLogin.body.accessToken}`)
      .field('name', 'Admin genre track')
      .field('authorId', String(author.id))
      .field('text', '')
      .field('genreIds', JSON.stringify([genre.id]))
      .attach('picture', Buffer.from('picture'), 'cover.png')
      .attach('audio', Buffer.from('audio'), 'track.mp3')
      .expect(201);
    await expect(
      TrackGenreModel.count({
        where: { trackId: createdTrack.body.id, genreId: genre.id },
      }),
    ).resolves.toBe(1);
    const files = app.get(FileService);
    files.deleteFile(createdTrack.body.picture);
    files.deleteFile(createdTrack.body.audio);
  });
});
