import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MailModule } from 'src/mail/mail.module';
import { RbacModule } from 'src/rbac/rbac.module';
import { TokenModule } from 'src/token/token.module';
import { UserModule } from 'src/user/user.module';
import { UserModel } from 'src/user/model/user.model';
import { AuthorModel } from 'src/author/model/author.model';
import { PasswordResetTokenModel } from 'src/user/model/password-reset-token.model';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
@Module({
  imports: [
    SequelizeModule.forFeature([
      UserModel,
      AuthorModel,
      PasswordResetTokenModel,
    ]),
    MailModule,
    RbacModule,
    TokenModule,
    UserModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
