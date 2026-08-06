import {
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { PermissionModel } from './permission.model';
import { RoleModel } from './role.model';

@Table({ tableName: 'role_permissions', timestamps: false })
export class RolePermissionModel extends Model {
  @PrimaryKey
  @ForeignKey(() => RoleModel)
  @Column(DataType.INTEGER)
  roleId: number;

  @PrimaryKey
  @ForeignKey(() => PermissionModel)
  @Column(DataType.INTEGER)
  permissionId: number;
}
