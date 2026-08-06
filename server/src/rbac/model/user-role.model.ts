import {
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { UserModel } from 'src/user/model/user.model';
import { RoleModel } from './role.model';

@Table({ tableName: 'user_roles', timestamps: false })
export class UserRoleModel extends Model {
  @PrimaryKey
  @ForeignKey(() => UserModel)
  @Column(DataType.INTEGER)
  userId: number;

  @PrimaryKey
  @ForeignKey(() => RoleModel)
  @Column(DataType.INTEGER)
  roleId: number;
}
