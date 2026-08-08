import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { UserModel } from './user.model';

@Table({ tableName: 'password_reset_tokens', timestamps: false })
export class PasswordResetTokenModel extends Model {
  @PrimaryKey
  @Column(DataType.UUID)
  id: string;

  @ForeignKey(() => UserModel)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  userId: number;

  @AllowNull(false)
  @Column(DataType.STRING(64))
  tokenHash: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  expiresAt: Date;

  @AllowNull
  @Column(DataType.DATE)
  usedAt: Date | null;

  @AllowNull(false)
  @Column(DataType.DATE)
  createdAt: Date;

  @BelongsTo(() => UserModel)
  user: UserModel;
}
