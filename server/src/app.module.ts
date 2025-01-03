import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'path';
import { SequelizeModule } from '@nestjs/sequelize';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from './user/user.module';
import { TokenModule } from './token/token.module';
import { PlaylistModule } from './playlist/playlist.module';
import { TrackModule } from './track/track.module';
import { AlbumModule } from './album/album.module';
import { CollectionModule } from './collection/collection.module';
import { CollectionAlbumModule } from './collection-album/collection-album.module';
import { PlaylistTrackModule } from './playlist-track/playlist-track.module';
import { AlbumTrackModule } from './album-track/album-track.module';
import { CollectionPlaylistModule } from './collection-playlist/collection-playlist.module';
import { UserModel } from './user/model/user.model';
import { TokenModel } from './token/model/token.model';
import { PlaylistModel } from './playlist/model/playlist.model';
import { TrackModel } from './track/model/track.model';
import { AlbumModel } from './album/model/album.model';
import { CollectionModel } from './collection/model/collection.model';
import { PlaylistTrackModel } from './playlist-track/model/playlist-track.model';
import { AlbumTrackModel } from './album-track/model/album-track.model';
import { CollectionPlaylistModel } from './collection-playlist/model/collection-playlist.model';
import { CollectionAlbumModel } from './collection-album/model/collection-album.model';
import { SeedModule } from './seed/seed.module';
import { FileModule } from './file/file.module';
import { MailModule } from './mail/mail.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthorModule } from './author/author.module';
import { GenreModule } from './genre/genre.module';
import { TrackGenreModule } from './track-genre/track-genre.module';
import { AuthorModel } from './author/model/author.model';
import { GenreModel } from './genre/model/genre.model';
import { TrackGenreModel } from './track-genre/model/track-genre.model';
import { CollectionTrackModule } from './collection-track/collection-track.module';
import { CollectionTrackModel } from './collection-track/model/collection-track.model';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 0,
        limit: 0,
      },
    ]),
    ConfigModule.forRoot({
      envFilePath: `.${process.env.NODE_ENV}.env`,
    }),
    // раздача статики
    ServeStaticModule.forRoot({
      rootPath: path.resolve(__dirname, 'static'),
    }),
    // *
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: Number(process.env.POSTGRES_PORT),
      username: process.env.POSTGRES_USER,
      password: String(process.env.POSTGRES_PASSWORD),
      database: process.env.POSTGRES_DB,
      models: [
        UserModel,
        TokenModel,
        PlaylistModel,
        TrackModel,
        AlbumModel,
        CollectionModel,
        PlaylistTrackModel,
        AlbumTrackModel,
        CollectionPlaylistModel,
        CollectionAlbumModel,
        AuthorModel,
        GenreModel,
        TrackGenreModel,
        CollectionTrackModel,
      ],
      autoLoadModels: true,
      synchronize: true,
    }),
    JwtModule.register({
      secret: 'your-secret-key', // Замените на ваш секретный ключ
      signOptions: { expiresIn: '60s' }, // Время истечения токена
    }),
    UserModule,
    TokenModule,
    PlaylistModule,
    TrackModule,
    AlbumModule,
    CollectionModule,
    PlaylistTrackModule,
    AlbumTrackModule,
    CollectionPlaylistModule,
    CollectionAlbumModule,
    SeedModule,
    FileModule,
    MailModule,
    AuthorModule,
    GenreModule,
    TrackGenreModule,
    CollectionTrackModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
