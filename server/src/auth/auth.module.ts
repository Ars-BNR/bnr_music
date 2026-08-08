import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { SequelizeModule } from '@nestjs/sequelize';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { TokenModel } from 'src/token/model/token.model';
import { TokenService } from 'src/token/token.service';
import { CollectionModel } from 'src/collection/model/collection.model';
import { PlaylistModel } from 'src/playlist/model/playlist.model';
import { UserModel } from 'src/user/model/user.model';
import { JwtStrategy } from './jwt.strategy';
import { OwnershipService } from './ownership.service';

@Global()
@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: config.getOrThrow<string>('EXPIRES_ACCESS_JWT'),
        },
      }),
    }),
    SequelizeModule.forFeature([
      TokenModel,
      CollectionModel,
      PlaylistModel,
      UserModel,
    ]),
  ],
  providers: [TokenService, JwtStrategy, JwtAuthGuard, OwnershipService],
  exports: [
    TokenService,
    JwtModule,
    PassportModule,
    JwtAuthGuard,
    OwnershipService,
  ],
})
export class AuthModule {}
