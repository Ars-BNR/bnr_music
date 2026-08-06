import { Global, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserModel } from 'src/user/model/user.model';
import { PermissionModel } from './model/permission.model';
import { RolePermissionModel } from './model/role-permission.model';
import { RoleModel } from './model/role.model';
import { UserRoleModel } from './model/user-role.model';
import { PermissionsGuard } from './permissions.guard';
import { RbacController } from './rbac.controller';
import { RbacService } from './rbac.service';

@Global()
@Module({
  imports: [
    SequelizeModule.forFeature([
      UserModel,
      RoleModel,
      PermissionModel,
      UserRoleModel,
      RolePermissionModel,
    ]),
  ],
  controllers: [RbacController],
  providers: [RbacService, PermissionsGuard],
  exports: [RbacService, PermissionsGuard],
})
export class RbacModule {}
