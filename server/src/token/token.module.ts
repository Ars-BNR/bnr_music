import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { JwtService } from '@nestjs/jwt';
import { TokenModel } from './model/token.model';

@Module({
  imports: [SequelizeModule.forFeature([TokenModel])],
  controllers: [],
  providers: [TokenService, JwtService],
  exports: [TokenService],
})
export class TokenModule {}
