import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CollectionModel } from 'src/collection/model/collection.model';
import { MailModule } from 'src/mail/mail.module';
import { FileModule } from 'src/file/file.module';
import { UserModel } from './model/user.model';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    MailModule,
    FileModule,
    SequelizeModule.forFeature([UserModel, CollectionModel]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
