import {
  AllowNull,
  AutoIncrement,
  BelongsToMany,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from 'sequelize-typescript';
import { RolePermissionModel } from './role-permission.model';
import { RoleModel } from './role.model';

@Table({ tableName: 'permissions', timestamps: true })
export class PermissionModel extends Model {
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

  @BelongsToMany(() => RoleModel, () => RolePermissionModel)
  roles: RoleModel[];
}
