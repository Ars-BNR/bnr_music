import {
  AllowNull,
  AutoIncrement,
  BelongsToMany,
  Column,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from 'sequelize-typescript';
import { UserModel } from 'src/user/model/user.model';
import { PermissionModel } from './permission.model';
import { RolePermissionModel } from './role-permission.model';
import { UserRoleModel } from './user-role.model';

@Table({ tableName: 'roles', timestamps: true })
export class RoleModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING(64))
  code: string;

  @AllowNull(false)
  @Column(DataType.STRING(120))
  name: string;

  @AllowNull(false)
  @Column(DataType.STRING(280))
  description: string;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  isSystem: boolean;

  @BelongsToMany(() => PermissionModel, () => RolePermissionModel)
  permissions: PermissionModel[];

  @BelongsToMany(() => UserModel, () => UserRoleModel)
  users: UserModel[];
}
