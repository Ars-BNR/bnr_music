import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TokenModule } from 'src/token/token.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserModel } from './model/user.model';
import { MailModule } from 'src/mail/mail.module';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [TokenModule, MailModule, SequelizeModule.forFeature([UserModel])],
  controllers: [UserController],
  providers: [UserService, JwtService],
})
export class UserModule {}
