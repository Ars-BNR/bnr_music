import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { SequelizeModule } from '@nestjs/sequelize';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import * as path from 'path';
import { AuthModule } from './auth/auth.module';
import { validateEnvironment } from './config/env.validation';
import { AlbumModule } from './album/album.module';
import { AlbumTrackModule } from './album-track/album-track.module';
import { AuthorModule } from './author/author.module';
import { CollectionModule } from './collection/collection.module';
import { CollectionAlbumModule } from './collection-album/collection-album.module';
import { CollectionPlaylistModule } from './collection-playlist/collection-playlist.module';
import { CollectionTrackModule } from './collection-track/collection-track.module';
import { FileModule } from './file/file.module';
import { GenreModule } from './genre/genre.module';
import { MailModule } from './mail/mail.module';
import { PlaylistModule } from './playlist/playlist.module';
import { PlaylistTrackModule } from './playlist-track/playlist-track.module';
import { SeedModule } from './seed/seed.module';
import { TrackModule } from './track/track.module';
import { TrackGenreModule } from './track-genre/track-genre.module';
import { UserModule } from './user/user.module';
import { AlbumModel } from './album/model/album.model';
import { AlbumTrackModel } from './album-track/model/album-track.model';
import { AuthorModel } from './author/model/author.model';
import { CollectionModel } from './collection/model/collection.model';
import { CollectionAlbumModel } from './collection-album/model/collection-album.model';
import { CollectionPlaylistModel } from './collection-playlist/model/collection-playlist.model';
import { CollectionTrackModel } from './collection-track/model/collection-track.model';
import { GenreModel } from './genre/model/genre.model';
import { PlaylistModel } from './playlist/model/playlist.model';
import { PlaylistTrackModel } from './playlist-track/model/playlist-track.model';
import { TokenModel } from './token/model/token.model';
import { TrackModel } from './track/model/track.model';
import { TrackGenreModel } from './track-genre/model/track-genre.model';
import { UserModel } from './user/model/user.model';

const models = [
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
];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: `.${process.env.NODE_ENV ?? 'development'}.env`,
      validate: validateEnvironment,
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ServeStaticModule.forRoot({ rootPath: path.resolve(__dirname, 'static') }),
    SequelizeModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        dialect: 'postgres' as const,
        host: config.getOrThrow<string>('POSTGRES_HOST'),
        port: config.getOrThrow<number>('POSTGRES_PORT'),
        username: config.getOrThrow<string>('POSTGRES_USER'),
        password: config.getOrThrow<string>('POSTGRES_PASSWORD'),
        database: config.getOrThrow<string>('POSTGRES_DB'),
        models,
        autoLoadModels: true,
        synchronize: config.get<string>('NODE_ENV') === 'test',
        logging: false,
      }),
    }),
    AuthModule,
    UserModule,
    PlaylistModule,
    TrackModule,
    AlbumModule,
    CollectionModule,
    PlaylistTrackModule,
    AlbumTrackModule,
    CollectionPlaylistModule,
    CollectionAlbumModule,
    CollectionTrackModule,
    FileModule,
    MailModule,
    AuthorModule,
    GenreModule,
    TrackGenreModule,
    SeedModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
