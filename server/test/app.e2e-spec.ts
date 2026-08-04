import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Sequelize } from 'sequelize-typescript';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AuthorModel } from '../src/author/model/author.model';
import { GenreModel } from '../src/genre/model/genre.model';
import { FileService } from '../src/file/file.service';
import { TrackModel } from '../src/track/model/track.model';
import { TrackGenreModel } from '../src/track-genre/model/track-genre.model';
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
  });

  beforeEach(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await app?.close();
  });

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
        user: expect.any(Object),
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

    await request(app.getHttpServer())
      .post('/refresh')
      .set('Cookie', oldCookie)
      .expect(401);
    await agent.post('/logout').expect(201);
    await agent.post('/refresh').expect(401);
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

    await UserModel.update({ role: 'admin' }, { where: { id: firstUserId } });
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
