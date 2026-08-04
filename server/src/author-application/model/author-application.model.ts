import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  Unique,
  UpdatedAt,
} from 'sequelize-typescript';
import { UserModel } from 'src/user/model/user.model';

export type AuthorApplicationStatus = 'pending' | 'approved' | 'rejected';

@Table({ tableName: 'author_applications', timestamps: true })
export class AuthorApplicationModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @ForeignKey(() => UserModel)
  @Unique
  @Column(DataType.INTEGER)
  userId: number;

  @Column(DataType.STRING(80))
  stageName: string;

  @Column(DataType.STRING(500))
  bio: string;

  @Column(DataType.STRING)
  avatar: string;

  @Column(DataType.STRING(16))
  status: AuthorApplicationStatus;

  @AllowNull
  @Column(DataType.STRING(500))
  reviewNote: string | null;

  @AllowNull
  @ForeignKey(() => UserModel)
  @Column(DataType.INTEGER)
  reviewedBy: number | null;

  @AllowNull
  @Column(DataType.DATE)
  reviewedAt: Date | null;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => UserModel, 'userId')
  user: UserModel;

  @BelongsTo(() => UserModel, 'reviewedBy')
  reviewer: UserModel;
}
